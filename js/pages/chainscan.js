import { D, coin, store } from '../core/data.js?v=202610102000';
import { esc } from '../core/fmt.js?v=202610102000';
import { pageHead, ring, empty, icon, icons, hydrate, sparkline } from '../core/ui.js?v=202610102000';

const MERK = 'c2_ns_state_v1';
const SORTEN = [['mc', 'Market Cap'], ['c24', '24 Std'], ['c7', '7 Tage'], ['c30', '30 Tage'], ['v', 'Volumen']];
const state = { eco: null, band: null, sort: 'mc', multi: false, q: '' };
{
    const s = store.get(MERK, null);
    if (s) { state.eco = s.eco || null; state.band = s.band || null; state.sort = s.sort || 'mc'; state.multi = !!s.multi; }
}
const merken = () => store.set(MERK, { eco: state.eco, band: state.band, sort: state.sort, multi: state.multi });

let R = null;   // Wurzel der Seite
let heroFor = null;   // Hero nur bei Chain-Wechsel neu zeichnen, sonst startet der Ring bei jedem Tastendruck
const $ = id => R.querySelector('#' + id);

const zahlDE = (x, stellen) => x.toLocaleString('de-DE', { maximumFractionDigits: stellen });
function geld(n) {
    if (n == null) return '?';
    if (n >= 1e9) return zahlDE(n / 1e9, 2) + ' Mrd';
    if (n >= 1e6) return zahlDE(n / 1e6, n >= 1e8 ? 0 : 1) + ' Mio';
    if (n >= 1e3) return zahlDE(n / 1e3, 0) + ' Tsd';
    return zahlDE(n, 0);
}
function preis(p) {
    if (p == null) return '?';
    if (p >= 1000) return zahlDE(p, 0) + ' $';
    if (p >= 1) return p.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
    if (p >= 0.0001) return zahlDE(p, 5) + ' $';
    return p.toLocaleString('de-DE', { maximumSignificantDigits: 3 }) + ' $';
}
const kls = x => x > 0.05 ? 'up' : x < -0.05 ? 'down' : 'dim';
function pctHtml(x) {
    if (x == null) return '<span class="dim">?</span>';
    return `<span class="${kls(x)}">${x > 0 ? '+' : ''}${zahlDE(x, Math.abs(x) >= 100 ? 0 : 1)} %</span>`;
}
function ppHtml(x) {
    if (x == null) return '<span class="dim">?</span>';
    return `<span class="${kls(x)}">${x > 0 ? '+' : ''}${zahlDE(x, 1)} Pp</span>`;
}
function spark(werte, farbe, w, h) {
    if (!werte || werte.length < 2) return `<svg class="cs-sp" viewBox="0 0 ${w} ${h}"></svg>`;
    const dx = w / (werte.length - 1);
    const pts = werte.map((v, i) => (i * dx).toFixed(1) + ',' + (h - 2 - v / 100 * (h - 4)).toFixed(1));
    const col = farbe || (werte[werte.length - 1] >= werte[0] ? 'var(--up)' : 'var(--down)');
    return `<svg class="cs-sp" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="color:${col}">
        <path d="M0,${h} L${pts.join(' L')} L${w},${h} Z" fill="currentColor" opacity=".14"/>
        <polyline points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

function panelSym(c) {
    const best = coin(c.s);
    return best && best.id === c.id ? c.s : null;
}

const stables = () => { const m = typeof window !== 'undefined' && window.MARKT_PLUS_DATA; return (m && m.stables && m.stables.chains) ? m.stables : null; };
function stableVon(e) {
    const s = stables(); if (!s) return null;
    const zu = s.zuordnung || {}, name = zu[e.key];
    const nm = String(e.name || '').toLowerCase();
    return (name && s.chains.find(c => c.name === name)) ||
        s.chains.find(c => c.key === e.key || String(c.name || '').toLowerCase() === nm) || null;
}
const sgnGeld = v => v == null ? '?' : (v > 0 ? '+' : v < 0 ? '-' : '') + geld(Math.abs(v)) + ' $';
function stableZeile(e) {
    const c = stableVon(e);
    if (!c || c.chg_7d == null) return '';
    return `<div class="cs-stab" title="Stablecoin-Bestand auf ${esc(e.name)}: ${geld(c.usd)} $. Quelle DefiLlama.">
        <span>Stablecoins 7T</span><b class="${kls(c.chg_7d_pct)}">${sgnGeld(c.chg_7d)}</b></div>`;
}
function stableHero(e) {
    const s = stables(), c = stableVon(e);
    if (!s || !c) return '';
    const rang = (s.rangliste_7d || []).indexOf(c.name);
    const v = c.verlauf_30d || [];
    return `<div class="cs-stab-hero">
        <span class="eyebrow">Stablecoins auf ${esc(e.name)}</span>
        <span><b>${geld(c.usd)} $</b></span>
        <span>7 Tage ${c.chg_7d == null ? '<span class="dim">?</span>' : `<b class="${kls(c.chg_7d_pct)}">${sgnGeld(c.chg_7d)}</b> ${pctHtml(c.chg_7d_pct)}`}</span>
        <span>30 Tage ${pctHtml(c.chg_30d_pct)}</span>
        ${rang >= 0 ? `<span>Zufluss-Rang ${rang + 1} von ${s.rangliste_7d.length} Chains</span>` : ''}
        ${v.length >= 3 ? `<span class="cs-stab-sp">${sparkline(v, 90, 20, 'var(--eco)')}</span>` : ''}
    </div>`;
}

const daten = () => D.narrativ;
const ecoVon = (d, key) => d.oekosysteme.filter(e => e.key === key)[0] || null;
function heissKey(d) {
    let best = null;
    d.oekosysteme.forEach(e => {
        const p = e.puls || {};
        if (p.wert != null && (p.n || 0) >= 5 && (!best || p.wert > best.puls.wert)) best = e;
    });
    return best ? best.key : null;
}
function bandAnzahl(e, key) {
    const a = (e.anzahl || {})[key] || { nativ: 0, multi: 0 };
    return a.nativ + (state.multi ? a.multi : 0);
}
const bandLabel = (d, key) => { const b = d.baender.filter(x => x.key === key)[0]; return b ? b.label : key; };
const bandText = b => b.max ? geld(b.min) + ' bis ' + geld(b.max) : 'ab ' + geld(b.min);

function renderEcos(d) {
    const heiss = heissKey(d), el = $('csEcos');
    el.innerHTML = d.oekosysteme.map((e, i) => {
        const n = e.nativ || {}, p = e.puls || {};
        return `<button type="button" class="card click cs-eco${e.key === state.eco ? ' on' : ''}" data-eco="${esc(e.key)}" style="--eco:${esc(e.farbe)};--i:${i}" aria-pressed="${e.key === state.eco}">
            <div class="cs-eco-top"><img src="${esc(n.img)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><b>${esc(e.name)}</b>
                ${e.key === heiss ? '<span class="cs-heiss">Läuft gerade</span>' : ''}</div>
            <div class="cs-eco-kurs"><span>${esc(n.s || '')} ${preis(n.p)}</span>${pctHtml(n.c7)}<em>7 Tage</em></div>
            ${spark(n.sp, 'var(--eco)', 160, 30)}
            <div class="row between" style="margin-top:12px"><span class="eyebrow">Puls</span><b class="num cs-puls">${p.wert == null ? '?' : esc(p.wert)}</b></div>
            <div class="bar" style="margin-top:6px"><i data-w="${p.wert || 0}" style="--c:var(--eco)"></i></div>
            <div class="cs-puls-sub">${p.breite_7d == null ? '' : esc(p.breite_7d) + ' % im Plus · '}Basis ${esc(p.n || 0)}</div>
            ${stableZeile(e)}
            ${e.veraltet ? `<div class="cs-alt">Alter Stand vom ${esc(e.stand)}</div>` : ''}
        </button>`;
    }).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.bar i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; })));
}

const kpi = (titel, wert, unter) => `<div class="card sunk cs-kpi"><div class="eyebrow">${titel}</div><div class="num cs-kpi-v">${wert}</div><small>${unter}</small></div>`;
function verlaufHtml(e) {
    const v = (e.verlauf || []).filter(x => x.puls != null);
    if (v.length < 2) return '<div class="cs-verlauf">Puls-Verlauf: baut sich ab heute mit jedem Update auf. Ab dem zweiten Tag steht hier die Kurve.</div>';
    const w = 600, h = 46, dx = w / (v.length - 1);
    const pts = v.map((x, i) => (i * dx).toFixed(1) + ',' + (h - 3 - x.puls / 100 * (h - 6)).toFixed(1));
    const tag = t => { const s = String(t).split('-'); return s[2] + '.' + s[1] + '.'; };
    return `<div class="cs-verlauf">Puls-Verlauf ${esc(tag(v[0].t))} bis ${esc(tag(v[v.length - 1].t))}
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="0" x2="${w}" y1="${h / 2}" y2="${h / 2}" stroke="var(--ink-3)" stroke-opacity=".4" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>
        <polyline points="${pts.join(' ')}" fill="none" stroke="var(--eco)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></div>`;
}

function renderHero(d, e) {
    const n = e.nativ || {}, p = e.puls || {};
    let proj = 0, multi = 0;
    Object.keys(e.anzahl || {}).forEach(k => { proj += e.anzahl[k].nativ; multi += e.anzahl[k].multi; });
    const el = $('csHero');
    el.style.setProperty('--eco', e.farbe || 'var(--pg)');
    el.innerHTML = `<div class="cs-hero">
            <div class="cs-hero-l"><img src="${esc(n.img)}" alt="" onerror="this.style.visibility='hidden'">
                <div style="min-width:0"><div class="eyebrow">Ökosystem</div><h3 class="h1" style="margin-top:6px">${esc(e.name)}</h3>
                <div class="cs-hero-kurs"><span>${esc(n.s || '')} <b>${preis(n.p)}</b></span><span>24h ${pctHtml(n.c24)}</span><span>7T ${pctHtml(n.c7)}</span><span>30T ${pctHtml(n.c30)}</span>
                    <span>Rang #${esc(n.r || '?')} · MC ${geld(n.mc)}</span></div>${stableHero(e)}</div></div>
            <div title="Puls: 55 % Anteil der Werte im Plus über 7 Tage, 45 % Vorsprung des Medians zum Gesamtmarkt">${ring(p.wert, 'Puls', 124)}</div>
        </div>
        <div class="cs-kpis">
            ${kpi('Breite 7 Tage', p.breite_7d == null ? '?' : esc(p.breite_7d) + ' %', 'der Werte im Plus')}
            ${kpi('Median 7 Tage', pctHtml(p.median_7d), 'typisches Projekt')}
            ${kpi('Vorsprung', ppHtml(p.vorsprung_7d), 'zum Markt-Median ' + (d.markt_median_7d == null ? '?' : (d.markt_median_7d > 0 ? '+' : '') + zahlDE(d.markt_median_7d, 1) + ' %'))}
            ${kpi('Projekte', String(proj), multi ? '+ ' + multi + ' gebrückte Tokens' : 'auf ' + esc(e.name) + ' zu Hause')}
        </div>${verlaufHtml(e)}`;
    hydrate(el);   // Ring fährt hoch, Zahl zählt
}

function renderCtrl(d, e) {
    $('csBands').innerHTML = d.baender.map(b => {
        const n = bandAnzahl(e, b.key);
        return `<button type="button" class="${b.key === state.band ? 'on' : ''}${n ? '' : ' leer'}" data-band="${esc(b.key)}"><b>${esc(b.label)}</b><span>${bandText(b)}</span><em>${n}</em></button>`;
    }).join('');
    $('csSort').innerHTML = SORTEN.map(s => `<button type="button" class="cs-chip${s[0] === state.sort ? ' on' : ''}" data-sort="${s[0]}">${s[1]}</button>`).join('') +
        `<button type="button" class="cs-chip${state.multi ? ' on' : ''}" data-multi="1" title="Tokens, die woanders zu Hause sind und nur per Bridge auf der Chain liegen">Gebrückte Tokens</button>`;
    const st = (e.puls || {}).staerkste || [];
    $('csTop').innerHTML = st.length ? '<span class="eyebrow">Stärkste der Woche</span>' +
        st.map(x => `<button type="button" class="cs-chip" data-suche="${esc(x.s)}">${esc(x.s)} ${pctHtml(x.c7)}</button>`).join('') : '';
}

function auswahl(d, e) {
    const q = state.q.trim().toLowerCase();
    let pool = (e.coins || []).filter(c => c.nat || state.multi);
    if (q) pool = pool.filter(c => (c.s || '').toLowerCase().indexOf(q) >= 0 || (c.n || '').toLowerCase().indexOf(q) >= 0);
    else pool = pool.filter(c => c.b === state.band);
    const k = state.sort;
    pool.sort((a, b) => {
        let x = a[k], y = b[k];
        if (x == null) x = -1e18; if (y == null) y = -1e18;
        return y - x;
    });
    return pool;
}

function mehrText(e, pool, q) {
    if (q) return pool.length > 30 ? `<div class="cs-mehr">Top 30 von ${pool.length} Treffern.</div>` : '';
    const gesamt = bandAnzahl(e, state.band);
    if (gesamt <= 30) return '';
    return `<div class="cs-mehr">Top 30 von ${gesamt} Projekten in diesem Band${state.sort !== 'mc' && gesamt > pool.length ? '. Sortiert wird unter den ' + pool.length + ' größten nach Market Cap.' : '.'}</div>`;
}
function leerText(d, e, q) {
    if (q) return 'Kein Projekt auf ' + esc(e.name) + ' passt zu <b>' + esc(q) + '</b>.';
    const groesstes = (e.coins || []).filter(c => c.nat).sort((a, b) => (b.mc || 0) - (a.mc || 0))[0];
    const b = d.baender.filter(x => x.key === state.band)[0];
    let t = 'Auf ' + esc(e.name) + ' liegt aktuell kein Projekt im Band <b>' + esc(b ? b.label : '') + '</b> (' + (b ? bandText(b) : '') + ').';
    if (groesstes && b && groesstes.mc < b.min) t += ' Das größte Projekt der Chain ist <b>' + esc(groesstes.n) + '</b> mit ' + geld(groesstes.mc) +
        '. Genau da liegt der Hebel, wenn das Ökosystem Fahrt aufnimmt.';
    return t;
}

function renderListe(d, e) {
    const q = state.q.trim(), el = $('csListe');
    const pool = auswahl(d, e), zeilen = pool.slice(0, 30);
    const rang = {};
    (e.coins || []).filter(c => c.nat).slice().sort((a, b) => (b.mc || 0) - (a.mc || 0)).forEach((c, i) => { rang[c.id] = i + 1; });
    const on = k => state.sort === k ? ' class="on"' : '';
    const kopf = `<div class="cs-row cs-kopf"><span>#</span><span></span><span>Projekt</span><span class="cs-c-sp">7 Tage</span><span class="cs-r">Preis</span>
        <span class="cs-r cs-c-mc"><u data-sort="mc"${on('mc')}>Market Cap</u></span><span class="cs-r"><u data-sort="c24"${on('c24')}>24 Std</u></span>
        <span class="cs-r"><u data-sort="c7"${on('c7')}>7 Tage</u></span><span class="cs-r cs-c-30"><u data-sort="c30"${on('c30')}>30 Tage</u></span><span></span></div>`;
    if (!zeilen.length) { el.innerHTML = `<div class="empty">${leerText(d, e, q)}</div>`; return; }
    el.innerHTML = kopf + zeilen.map((c, i) => {
        const sym = panelSym(c);
        let badges = '';
        if (!c.nat) badges += `<span class="cs-badge" style="--c:var(--ink-3)">gebrückt · ${esc(c.heim || 'extern')}</span>`;
        if (c.c7 != null && c.c7 >= 30) badges += '<span class="cs-badge" style="--c:var(--up)">läuft</span>';
        if (c.v && c.mc && c.v / c.mc >= 0.25) badges += '<span class="cs-badge" style="--c:var(--warn)">Volumen-Schub</span>';
        const unter = esc(c.s) + (q ? ' · ' + esc(bandLabel(d, c.b)) : '') + (c.ath != null && c.ath <= -90 ? ' · ' + zahlDE(c.ath, 0) + ' % vom ATH' : '');
        return `<div class="cs-row cs-zeile" ${sym ? `data-coin="${esc(sym)}"` : `data-cg="${esc(c.id)}"`} style="--i:${i}" role="button" tabindex="0" title="${sym ? 'Coin-Detail öffnen' : 'Auf CoinGecko öffnen'}">
            <span class="cs-rang">${c.nat ? rang[c.id] || '' : ''}</span>
            <img class="coin-img" src="${esc(c.img)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
            <div class="cs-name"><b>${esc(c.n)}</b><span>${unter}</span>${badges}</div>
            <div class="cs-c-sp">${spark(c.sp, null, 84, 26)}</div>
            <div class="cs-r cs-preis">${preis(c.p)}<span class="cs-mcm"> · MC ${geld(c.mc)}</span></div>
            <div class="cs-r cs-c-mc">${geld(c.mc)}</div>
            <div class="cs-r"><i class="cs-lbl">24h </i>${pctHtml(c.c24)}</div>
            <div class="cs-r"><i class="cs-lbl">7T </i>${pctHtml(c.c7)}</div>
            <div class="cs-r cs-c-30">${pctHtml(c.c30)}</div>
            <a class="cs-cg" data-stop href="https://www.coingecko.com/en/coins/${encodeURIComponent(c.id)}" target="_blank" rel="noopener" title="Auf CoinGecko">${icon('arrow-up-right')}</a>
        </div>`;
    }).join('') + mehrText(e, pool, q);
    icons(el);
}

function renderNote(d, e) {
    const r = e.ausgefiltert || {};
    $('csNote').innerHTML = 'Quelle: CoinGecko, Kategorie <b>' + esc(e.kategorie) + '</b>, Stand ' + esc(e.stand) + '. ' +
        'Gezählt werden nur Projekte, die auf der Chain zu Hause sind. Ausgeblendet: ' + (r.stabil || 0) + ' Stablecoins, ' +
        (r.abgeleitet || 0) + ' Bridge-, Wrapped- und Staking-Varianten, ' + (r.klein_tot || 0) + ' Tokens unter 1 Mio oder fast ohne Handel. ' +
        '<b>Puls</b>: 55 % Anteil der Werte im Plus über 7 Tage, 45 % Vorsprung des Medians zum Gesamtmarkt (Top 300). Ab 60 läuft eine Chain besser als der Markt. ' +
        'Hypothetisch. Keine Finanzberatung.';
}

function waehleBand(e) {
    if (state.band && bandAnzahl(e, state.band)) return;
    const d = daten(), erstes = d.baender.filter(b => bandAnzahl(e, b.key))[0];
    state.band = erstes ? erstes.key : (state.band || 'gross');
}

function renderDetail(autoBand) {
    const d = daten(); if (!d) return;
    const e = ecoVon(d, state.eco); if (!e) return;
    if (autoBand) waehleBand(e);
    if (heroFor !== e.key) { renderHero(d, e); heroFor = e.key; }
    renderCtrl(d, e); renderListe(d, e); renderNote(d, e);
}

export default {
    styles: `
        .cs-ecos { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 18px; }
        .cs-eco { text-align: left; display: block; width: 100%; color: inherit; font: inherit; }
        .cs-eco.on { box-shadow: var(--sh-out), inset 0 0 0 2px var(--eco); }
        .cs-eco-top { display: flex; align-items: center; gap: 10px; }
        .cs-eco-top img { width: 28px; height: 28px; border-radius: 50%; background: var(--sunk); }
        .cs-eco-top b { font-size: 1.05rem; font-weight: 500; }
        .cs-heiss { margin-left: auto; padding: 3px 9px; border-radius: var(--r-pill); font-family: var(--mono); font-size: .58rem; letter-spacing: .08em; text-transform: uppercase;
            color: var(--up); background: color-mix(in srgb, var(--up) 14%, transparent); white-space: nowrap; }
        .cs-eco-kurs { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin: 12px 0 8px; font-family: var(--mono); font-size: .76rem; }
        .cs-eco-kurs em { font-style: normal; color: var(--ink-3); font-size: .64rem; }
        .cs-sp { display: block; width: 100%; height: 30px; }
        .cs-puls { font-size: 1.3rem; font-weight: 300; }
        .cs-puls-sub { margin-top: 7px; font-family: var(--mono); font-size: .64rem; color: var(--ink-3); }
        .cs-alt { margin-top: 8px; font-size: .7rem; color: var(--warn); }
        .cs-stab { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-top: 10px; padding-top: 9px; border-top: 1px solid var(--line); font-family: var(--mono); font-size: .66rem; color: var(--ink-3); }
        .cs-stab b { font-weight: 500; font-size: .74rem; }
        .cs-stab-hero { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; margin-top: 10px; padding: 8px 14px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); font-family: var(--mono); font-size: .72rem; color: var(--ink-2); }
        .cs-stab-hero .eyebrow { letter-spacing: .1em; }
        .cs-stab-hero b { font-weight: 500; color: var(--ink); }
        .cs-stab-hero b.up { color: var(--up); } .cs-stab-hero b.down { color: var(--down); }
        .cs-stab-sp { display: inline-flex; }
        .cs-hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .cs-hero-l { display: flex; align-items: center; gap: 18px; min-width: 0; flex: 1; }
        .cs-hero-l > img { width: 60px; height: 60px; border-radius: 50%; background: var(--sunk); flex: none; box-shadow: 0 0 0 4px color-mix(in srgb, var(--eco) 25%, transparent); }
        .cs-hero-kurs { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font-family: var(--mono); font-size: .76rem; color: var(--ink-2); }
        .cs-hero-kurs b { font-weight: 500; color: var(--ink); }
        .cs-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 22px; }
        .cs-kpi { padding: 16px 18px; }
        .cs-kpi-v { font-size: 1.5rem; font-weight: 300; margin: 8px 0 4px; letter-spacing: -.02em; }
        .cs-kpi small { font-size: .72rem; color: var(--ink-3); }
        .cs-verlauf { margin-top: 18px; font-family: var(--mono); font-size: .66rem; color: var(--ink-3); }
        .cs-verlauf svg { display: block; width: 100%; height: 46px; margin-top: 8px; }
        .cs-ctrl { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 26px; }
        .cs-bands { display: inline-flex; padding: 4px; gap: 4px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); flex-wrap: wrap; }
        .cs-bands button { display: grid; grid-template-columns: auto auto; gap: 1px 10px; align-items: center; text-align: left; padding: 8px 14px; border-radius: 12px; color: var(--ink-3); transition: all .25s var(--ease); }
        .cs-bands button b { font-weight: 500; font-size: .86rem; color: var(--ink-2); }
        .cs-bands button span { grid-column: 1; font-family: var(--mono); font-size: .58rem; }
        .cs-bands button em { grid-column: 2; grid-row: 1 / span 2; font-style: normal; font-family: var(--mono); font-size: .8rem; }
        .cs-bands button.on { background: var(--surface); box-shadow: var(--sh-sm); color: var(--ink-2); }
        .cs-bands button.on b, .cs-bands button.on em { color: var(--ink); }
        .cs-bands button.leer { opacity: .5; }
        .cs-sort, .cs-top { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
        .cs-top { margin-top: 14px; }
        .cs-top:empty { display: none; }
        .cs-chip { padding: 6px 13px; border-radius: var(--r-pill); font-family: var(--mono); font-size: .66rem; letter-spacing: .04em; color: var(--ink-2); background: var(--bg); box-shadow: var(--sh-in); transition: all .25s var(--ease); }
        .cs-chip:hover { color: var(--ink); }
        .cs-chip.on { background: var(--btn); color: var(--btn-ink); box-shadow: none; }
        .cs-suche { flex: 1; min-width: 180px; max-width: 300px; margin-left: auto; }
        .cs-liste { margin-top: 18px; }
        .cs-row { display: grid; grid-template-columns: 30px 28px minmax(0, 1.7fr) 90px minmax(0, 1fr) minmax(0, .9fr) minmax(0, .8fr) minmax(0, .8fr) minmax(0, .8fr) 28px; align-items: center; gap: 12px; padding: 11px 8px; }
        .cs-kopf { font-family: var(--mono); font-size: .6rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); padding-top: 4px; padding-bottom: 8px; }
        .cs-kopf u { text-decoration: none; cursor: pointer; transition: color .2s; }
        .cs-kopf u:hover, .cs-kopf u.on { color: var(--ink); }
        .cs-zeile { border-top: 1px solid var(--line); border-radius: 12px; cursor: pointer; transition: background .2s, transform .25s var(--ease); animation: rise .5s var(--ease) both; animation-delay: calc(var(--i, 0) * 18ms); }
        .cs-zeile:hover { background: color-mix(in srgb, var(--ink) 3.5%, transparent); transform: translateX(3px); }
        .cs-zeile:focus-visible { outline: 2px solid var(--pg); outline-offset: -2px; }
        .cs-r { text-align: right; font-family: var(--mono); font-size: .8rem; white-space: nowrap; }
        .cs-rang { font-family: var(--mono); font-size: .74rem; color: var(--ink-3); text-align: center; }
        .cs-name { min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 3px 8px; }
        .cs-name b { font-weight: 500; font-size: .9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
        .cs-name > span:not(.cs-badge) { font-family: var(--mono); font-size: .68rem; color: var(--ink-3); }
        .cs-badge { padding: 2px 8px; border-radius: var(--r-pill); font-family: var(--mono); font-size: .58rem; color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); white-space: nowrap; }
        .cs-c-sp .cs-sp { height: 26px; }
        .cs-mcm, .cs-lbl { display: none; font-style: normal; color: var(--ink-3); }
        .cs-cg { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; color: var(--ink-3); transition: color .2s, background .2s; }
        .cs-cg:hover { color: var(--ink); background: var(--bg); }
        .cs-cg svg { width: 14px; height: 14px; }
        .cs-mehr { padding: 14px 8px 0; font-size: .78rem; color: var(--ink-3); }
        .cs-note { margin-top: 20px; font-size: .78rem; color: var(--ink-3); line-height: 1.6; font-weight: 300; }
        .cs-note b { color: var(--ink-2); font-weight: 500; }
        @media (max-width: 1180px) { .cs-row { grid-template-columns: 30px 28px minmax(0, 1.7fr) minmax(0, 1fr) minmax(0, .9fr) minmax(0, .8fr) minmax(0, .8fr) 28px; } .cs-c-sp, .cs-c-30 { display: none; } }
        @media (max-width: 860px) {
            .cs-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .cs-hero { justify-content: center; }
            .cs-suche { max-width: none; margin-left: 0; flex-basis: 100%; }
            .cs-kopf { display: none; }
            .cs-row { grid-template-columns: 22px 28px minmax(0, 1fr) auto auto; gap: 4px 10px; }
            .cs-c-mc, .cs-cg { display: none; }
            .cs-preis { grid-column: 3 / -1; grid-row: 2; text-align: left; font-size: .7rem; color: var(--ink-3); }
            .cs-mcm, .cs-lbl { display: inline; }
        }`,
    render(root) {
        R = root;
        heroFor = null;
        root.classList.add('stack');
        const d = daten();
        const kopf = (rechts) => pageHead('Entdecken', 'Chain-Scan', 'Wenn eine Chain Fahrt aufnimmt, siehst du hier sofort, welche Projekte auf ihr laufen. Top 30 je Ökosystem nach Market Cap, getrennt nach groß, mittel und klein. Gezählt wird nur, was auf der Chain zu Hause ist. Der <b>Puls</b> zeigt, welches Ökosystem gerade besser läuft als der Markt.', rechts);
        if (!d || !d.oekosysteme || !d.oekosysteme.length) { root.innerHTML = kopf('') + `<div class="card">${empty('Noch keine Daten.')}</div>`; return; }
        if (!ecoVon(d, state.eco)) state.eco = heissKey(d) || d.oekosysteme[0].key;
        state.q = '';
        root.innerHTML = kopf(`<span class="eyebrow" style="letter-spacing:.08em">Stand ${esc(d.updated)} · ${d.oekosysteme.length} Ökosysteme · Markt-Median 7 Tage ${d.markt_median_7d == null ? '?' : (d.markt_median_7d > 0 ? '+' : '') + zahlDE(d.markt_median_7d, 1) + ' %'}</span>`) +
            `<div id="csEcos" class="cs-ecos"></div>
            <section class="card" id="csDetail">
                <div id="csHero"></div>
                <div class="cs-ctrl">
                    <div id="csBands" class="cs-bands" role="group" aria-label="Größe"></div>
                    <div id="csSort" class="cs-sort"></div>
                    <input id="csSuche" class="input cs-suche" type="search" placeholder="Projekt suchen" autocomplete="off" aria-label="Projekt suchen">
                </div>
                <div id="csTop" class="cs-top"></div>
                <div id="csListe" class="cs-liste"></div>
                <div id="csNote" class="cs-note"></div>
            </section>`;
        renderEcos(d);
        renderDetail(true);

        root.onclick = ev => {
            const eco = ev.target.closest('[data-eco]');
            if (eco) {
                if (state.eco !== eco.dataset.eco) { state.eco = eco.dataset.eco; state.q = ''; $('csSuche').value = ''; }
                merken();
                root.querySelectorAll('#csEcos .cs-eco').forEach(b => { const an = b.dataset.eco === state.eco; b.classList.toggle('on', an); b.setAttribute('aria-pressed', an); });
                renderDetail(true);
                if (window.matchMedia('(max-width: 900px)').matches) $('csDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            const band = ev.target.closest('[data-band]');
            if (band) { state.band = band.dataset.band; state.q = ''; $('csSuche').value = ''; merken(); renderDetail(); return; }
            const sort = ev.target.closest('[data-sort]');
            if (sort) { state.sort = sort.dataset.sort; merken(); renderDetail(); return; }
            if (ev.target.closest('[data-multi]')) { state.multi = !state.multi; merken(); renderDetail(); return; }
            const such = ev.target.closest('[data-suche]');
            if (such) { state.q = such.dataset.suche; $('csSuche').value = state.q; renderDetail(); return; }
            const row = ev.target.closest('.cs-zeile[data-cg]');
            if (row && !ev.target.closest('a')) window.open('https://www.coingecko.com/en/coins/' + encodeURIComponent(row.dataset.cg), '_blank', 'noopener');
        };
        root.onkeydown = ev => {
            if (ev.key !== 'Enter' && ev.key !== ' ') return;
            const row = ev.target.closest && ev.target.closest('.cs-zeile');
            if (row) { ev.preventDefault(); row.click(); }
        };
        $('csSuche').oninput = function () { state.q = this.value; renderDetail(); };
    },
    destroy() { if (R) { R.onclick = null; R.onkeydown = null; } R = null; },
};
