import { D } from '../core/data.js?v=202610091357';
import { esc } from '../core/fmt.js?v=202610091357';
import { card, pageHead, seg, chip, empty, icon, icons } from '../core/ui.js?v=202610091357';

const state = { eintrag: 0, filter: 'alle', sort: 'rang' };
const leer = v => v === null || v === undefined;

function fmtPreis(p) {
    if (leer(p)) return '?';
    if (p >= 1000) return p.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' $';
    if (p >= 1) return p.toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' $';
    if (p >= 0.01) return p.toLocaleString('de-DE', { maximumFractionDigits: 4 }) + ' $';
    return p.toLocaleString('de-DE', { maximumFractionDigits: 6 }) + ' $';
}
function fmtPct(v, plus) {
    if (leer(v)) return '?';
    return (v > 0 && plus !== false ? '+' : '') + v.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' %';
}
const farbe = v => leer(v) ? 'var(--ink-3)' : v > 0 ? 'var(--up)' : v < 0 ? 'var(--down)' : 'var(--ink-2)';
function geld(n) {
    if (leer(n)) return '?';
    if (n >= 1e9) return (n / 1e9).toFixed(2).replace('.', ',') + ' Mrd';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' Mio';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
    return Number(n).toFixed(0);
}
function datumDE(d) {
    if (!d) return '';
    const t = String(d).split('-');
    return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : d;
}
const zahl2 = v => leer(v) ? '?' : v.toFixed(2).replace('.', ',');

function sparkline(serie, perf) {
    const pts = (serie || []).slice();
    if (pts.length < 2) {
        return `<svg class="tb-spark" viewBox="0 0 200 44" preserveAspectRatio="none">
            <line x1="0" y1="22" x2="200" y2="22" stroke="var(--ink-3)" stroke-opacity=".5" stroke-dasharray="3 3"/>
            <text x="100" y="26" fill="var(--ink-3)" font-size="8" text-anchor="middle">Historie ab morgen</text></svg>`;
    }
    const vals = pts.map(p => p[1]);
    let lo = Math.min(...vals, 0), hi = Math.max(...vals, 0);
    if (hi - lo < 1e-9) hi = lo + 1;
    const W = 200, H = 44, pad = 3;
    const x = i => pad + i * (W - 2 * pad) / (pts.length - 1);
    const y = v => pad + (hi - v) * (H - 2 * pad) / (hi - lo);
    const d = vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ');
    const y0 = y(0).toFixed(1), col = farbe(perf);
    const fill = d + ' L' + x(pts.length - 1).toFixed(1) + ',' + y0 + ' L' + x(0).toFixed(1) + ',' + y0 + ' Z';
    return `<svg class="tb-spark" viewBox="0 0 200 44" preserveAspectRatio="none">
        <path d="${fill}" fill="${col}" opacity=".14"/>
        <line x1="0" y1="${y0}" x2="200" y2="${y0}" stroke="var(--ink-3)" stroke-opacity=".6" stroke-dasharray="3 3"/>
        <path d="${d}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${x(pts.length - 1).toFixed(1)}" cy="${y(vals[vals.length - 1]).toFixed(1)}" r="2.4" fill="${col}"/></svg>`;
}

const zelle = (label, wert, col) =>
    `<div class="tb-zelle"><div class="eyebrow">${esc(label)}</div><b class="num"${col ? ` style="color:${col}"` : ''}>${esc(wert)}</b></div>`;

function gesamt(d) {
    const g = d.gesamt || {};
    const kaufQuote = g.n_kauf ? Math.round(100 * (g.kauf_treffer || 0) / g.n_kauf) : null;
    return `<div class="tb-bilanz">` +
        zelle('Analysen', g.n_analysen || 0) +
        zelle('Coins bewertet', g.n_coins || 0) +
        zelle('Kauf-Signale Ø', fmtPct(g.kauf_perf), farbe(g.kauf_perf)) +
        zelle('Alpha zu BTC Ø', fmtPct(g.kauf_alpha), farbe(g.kauf_alpha)) +
        zelle('Meiden-Signale Ø', fmtPct(g.meiden_perf), farbe(leer(g.meiden_perf) ? null : -g.meiden_perf)) +
        zelle('Kauf-Treffer', (g.kauf_treffer || 0) + ' von ' + (g.n_kauf || 0) + (kaufQuote !== null && g.kauf_treffer + g.kauf_nein + g.kauf_markt > 0 ? ' (' + kaufQuote + ' %)' : '')) +
        zelle('Meiden-Treffer', (g.meiden_treffer || 0) + ' von ' + ((g.meiden_treffer || 0) + (g.meiden_nein || 0))) +
        zelle('Rang-Treffer', zahl2(g.rang_treffer), farbe(g.rang_treffer)) + `</div>`;
}

function kopf(e) {
    const m = e.markt || {}, b = e.bilanz || {};
    return `<div class="tb-kopf">
        <div><div class="eyebrow" style="color:var(--pg)">${esc(datumDE(e.datum))} · Tag ${b.tage || 0}</div>
            <h3 class="h2" style="margin:8px 0 8px">${esc(e.titel)}</h3><p>${esc(e.quelle)}</p><p>${esc(e.methode)}</p></div>
        <div><div class="eyebrow">Markt damals</div>
            <p><b>BTC ${fmtPreis(m.btc)}</b> · Fear &amp; Greed <b>${m.fng !== undefined ? esc(m.fng) + ' (' + esc(m.fng_label || '') + ')' : '?'}</b> · Dominanz <b>${m.dominanz !== undefined ? esc(m.dominanz) + ' %' : '?'}</b></p>
            ${m.kommentar ? `<p>${esc(m.kommentar)}</p>` : ''}
            <div class="eyebrow" style="margin-top:12px">Himmel</div><p>${esc(e.astro || '')}</p></div>
        <div><div class="eyebrow">These</div><p>${esc(e.these || '')}</p>
            ${e.muster ? `<div class="eyebrow" style="margin-top:12px">Muster</div><p>${esc(e.muster)}</p>` : ''}</div>
    </div>`;
}

function bilanz(e) {
    const b = e.bilanz || {};
    return `<div class="tb-bilanz">` +
        zelle('BTC seit Analyse', fmtPct(b.btc_perf), farbe(b.btc_perf)) +
        zelle('Kauf (' + b.n_kauf + ') Ø', fmtPct(b.kauf_perf), farbe(b.kauf_perf)) +
        zelle('Alpha Kauf', fmtPct(b.kauf_alpha), farbe(b.kauf_alpha)) +
        zelle('Watch (' + b.n_watch + ') Ø', fmtPct(b.watch_perf), farbe(b.watch_perf)) +
        zelle('Meiden (' + b.n_meiden + ') Ø', fmtPct(b.meiden_perf), farbe(leer(b.meiden_perf) ? null : -b.meiden_perf)) +
        zelle('Top 5 gegen Rest', fmtPct(b.top5_perf) + ' / ' + fmtPct(b.rest_perf), farbe(!leer(b.top5_perf) && !leer(b.rest_perf) ? b.top5_perf - b.rest_perf : null)) +
        zelle('Rang-Treffer', zahl2(b.rang_treffer), farbe(b.rang_treffer)) +
        zelle('Treffer', (b.treffer_ja || 0) + ' ja · ' + (b.treffer_markt || 0) + ' Markt · ' + (b.treffer_nein || 0) + ' nein · ' + (b.treffer_offen || 0) + ' offen') +
        (b.bester ? zelle('Bester', b.bester.symbol + ' ' + fmtPct(b.bester.perf) + ' (Rang ' + b.bester.rang + ')', 'var(--up)') : '') +
        (b.schlechtester ? zelle('Schlechtester', b.schlechtester.symbol + ' ' + fmtPct(b.schlechtester.perf) + ' (Rang ' + b.schlechtester.rang + ')', 'var(--down)') : '') + `</div>`;
}

function rang(e) {
    const coins = (e.coins || []).slice().sort((a, b) => (a.rang || 99) - (b.rang || 99));
    const vals = coins.map(c => c.perf).filter(v => !leer(v));
    const btc = e.bilanz ? e.bilanz.btc_perf : null;
    if (!leer(btc)) vals.push(btc);
    const maxAbs = Math.max(5, Math.max(...vals.map(Math.abs), 0));
    const zeilen = coins.map(c => {
        const v = c.perf;
        const w = leer(v) ? 0 : Math.min(50, Math.abs(v) / maxAbs * 50);
        const balken = leer(v) ? '' : (v >= 0 ? `<i class="pos" style="left:50%;width:${w}%"></i>` : `<i class="neg" style="right:50%;width:${w}%"></i>`);
        const marke = leer(btc) ? '' : `<em style="left:calc(50% + ${Math.max(-50, Math.min(50, btc / maxAbs * 50))}%)" title="BTC ${esc(fmtPct(btc))}"></em>`;
        return `<div class="tb-rz" data-coin="${esc(c.symbol)}"><span class="r">${esc(c.rang)}</span>
            <span class="s">${esc(c.symbol)}<small>${esc(c.signal)}</small></span>
            <span class="tb-bar"><u style="left:50%"></u>${balken}${marke}</span>
            <span class="v" style="color:${farbe(v)}">${fmtPct(v)}</span></div>`;
    }).join('');
    return `<div class="tb-rang">${zeilen}</div>
        <p class="sub" style="font-size:.78rem;margin-top:14px">Balken: Kurs seit der Analyse. <span class="warn">Gelbe Marke</span>: Bitcoin im selben Zeitraum. Stimmt die Rangfolge, stehen die grünen Balken oben und die roten unten.</p>`;
}

function timeline(e) {
    const evs = (e.ereignisse || []).slice().reverse();
    if (!evs.length) return empty('Noch keine Ereignisse.');
    return `<div class="tb-timeline">${evs.map(ev => {
        let txt = esc(ev.text);
        const i = txt.indexOf(':');
        if (i > 0 && i < 40) txt = '<b>' + txt.slice(0, i) + '</b>' + txt.slice(i);
        return `<div class="tb-ev ${esc(ev.typ || '')}"><span class="d">${esc(datumDE(ev.datum))}</span>${txt}</div>`;
    }).join('')}</div>`;
}

const SIG_FARBE = { kauf: 'var(--up)', watch: 'var(--warn)', meiden: 'var(--down)' };
const TREFFER_FARBE = { ja: 'var(--up)', markt: 'var(--warn)', nein: 'var(--down)' };
function karte(c) {
    const klasse = c.signal === 'kauf' ? ' gut' : c.signal === 'meiden' ? ' schwach' : '';
    const trefferTxt = { ja: 'Treffer', markt: 'nur mit dem Markt', nein: 'daneben', offen: 'offen' }[c.treffer] || 'offen';
    return `<div class="card sunk tb-card${klasse}">
        <div class="tb-top" data-coin="${esc(c.symbol)}">
            <div style="min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><span class="tb-rangbadge">${esc(c.rang)}</span><b class="tb-sym">${esc(c.symbol)}</b>${chip(c.signal || '', SIG_FARBE[c.signal])}</div>
                <div class="tb-tier">${esc(c.name)} · ${esc(c.tier || '')}</div></div>
            <div style="text-align:right"><div class="tb-perf num" style="color:${farbe(c.perf)}">${fmtPct(c.perf)}</div>
                <div class="tb-alpha">Alpha zu BTC ${fmtPct(c.alpha)}</div></div>
        </div>
        ${sparkline(c.serie, c.perf)}
        <div class="tb-zahlen">
            <div>Einstieg <b>${fmtPreis(c.einstieg)}</b></div>
            <div>Jetzt <b>${fmtPreis(c.aktuell)}</b></div>
            <div>Hoch <b class="up">${fmtPct(c.hoch)}</b></div>
            <div>Tief <b class="down">${fmtPct(c.tief)}</b></div>
        </div>
        <div class="tb-zahlen">
            <div>MC <b>${geld(c.mc_jetzt || c.mc)}</b></div>
            <div>MC/FDV <b>${zahl2(c.mc_fdv)}</b></div>
            <div>vom ATH <b>${fmtPct(!leer(c.ath_pct_jetzt) ? c.ath_pct_jetzt : c.ath_pct)}</b></div>
            <div>7d <b style="color:${farbe(c.ch7d)}">${fmtPct(c.ch7d)}</b></div>
        </div>
        <div style="margin-top:12px">${chip(trefferTxt, TREFFER_FARBE[c.treffer])}</div>
        <details><summary>${icon('chevron-right')}Warum so bewertet</summary>
            <div class="tb-txt"><b>Mystik</b> ${esc(c.mystik)}</div>
            <div class="tb-txt"><b>Fundament</b> ${esc(c.fundament)}</div>
            <div class="tb-txt"><b>Urteil</b> ${esc(c.urteil)}</div></details>
    </div>`;
}

function grid(e) {
    const coins = (e.coins || []).filter(c => state.filter === 'alle' || c.signal === state.filter);
    coins.sort((a, b) => {
        if (state.sort === 'perf') return (leer(b.perf) ? -1e9 : b.perf) - (leer(a.perf) ? -1e9 : a.perf);
        if (state.sort === 'alpha') return (leer(b.alpha) ? -1e9 : b.alpha) - (leer(a.alpha) ? -1e9 : a.alpha);
        return (a.rang || 99) - (b.rang || 99);
    });
    return coins.length ? `<div class="tb-grid">${coins.map(karte).join('')}</div>` : empty('Keine Coins in dieser Auswahl.');
}

function eintrag(d) {
    const e = d.eintraege[state.eintrag];
    if (!e) return empty('Dieser Eintrag fehlt in den Daten.');
    return card({ body: kopf(e) }) +
        card({ eyebrow: 'Bilanz dieser Analyse', body: bilanz(e) }) +
        `<div class="tb-zwei">${card({ eyebrow: 'Rang gegen Realität', body: rang(e) })}${card({ eyebrow: 'Timeline', body: timeline(e) })}</div>` +
        card({ eyebrow: 'Die Coins', right: `<div class="row wrap" style="justify-content:flex-end">${seg('tbfilter', [['alle', 'Alle'], ['kauf', 'Kauf'], ['watch', 'Watch'], ['meiden', 'Meiden']], state.filter)}${seg('tbsort', [['rang', 'Nach Rang'], ['perf', 'Nach Performance'], ['alpha', 'Nach Alpha zu BTC']], state.sort)}</div>`,
            body: `<div id="tbGrid">${grid(e)}</div>`, cls: 'tb-coins' }) +
        `<p class="sub" style="max-width:none;font-size:.8rem">${window.CB2_PUBLIC ? 'Die Nachverfolgung läuft automatisch mit jedem Update. Hypothetisch, keine Finanzberatung.' : 'Neue Analyse eintragen: Eintrag in <code>tagebuch.json</code> anlegen, danach <code>python3 update_tagebuch.py</code>. Käufe, Nachkäufe, Stops und Verkäufe unter <code>aktionen</code> desselben Eintrags. Die Nachverfolgung läuft mit jedem Refresh-Lauf automatisch mit.'}</p>`;
}

const INTRO = 'Jede Coin-Analyse aus einem CoinGecko-Screenshot landet hier mit Ranking, Signal und dem Kurs zum Zeitpunkt der Einschätzung. Danach läuft die Nachverfolgung automatisch: Kurs seit der Analyse, Vergleich zu Bitcoin im selben Zeitraum, Hoch und Tief seitdem, und ob die Rangfolge gestimmt hat. <strong>Ein Urteil gibt es erst ab dem dritten Tag</strong>, vorher ist jede Bewegung Rauschen. Kauf-Treffer heißt: im Plus und besser als Bitcoin. Meiden-Treffer heißt: schlechter als Bitcoin.';

export default {
    styles: `
        .tb-bilanz { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
        .tb-zelle { padding: 14px 16px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); min-width: 0; }
        .tb-zelle b { display: block; margin-top: 8px; font-size: 1.05rem; font-weight: 400; line-height: 1.3; }
        .tb-kopf { display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 28px; }
        .tb-kopf p { margin: 6px 0 0; font-size: .86rem; color: var(--ink-2); font-weight: 300; line-height: 1.5; }
        .tb-kopf p b { color: var(--ink); font-weight: 500; }
        .tb-zwei { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 22px; align-items: start; }
        .tb-rang { display: flex; flex-direction: column; gap: 5px; }
        .tb-rz { display: grid; grid-template-columns: 1.6rem 6.4rem minmax(0, 1fr) 4.8rem; gap: .5rem; align-items: center; font-family: var(--mono); font-size: .74rem; padding: 2px 4px; border-radius: 8px; cursor: pointer; transition: background .2s; }
        .tb-rz:hover { background: color-mix(in srgb, var(--ink) 4%, transparent); }
        .tb-rz .r { color: var(--ink-3); text-align: right; }
        .tb-rz .s { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tb-rz .s small { color: var(--ink-3); font-weight: 400; margin-left: .3rem; }
        .tb-rz .v { text-align: right; font-weight: 600; }
        .tb-bar { position: relative; height: 14px; border-radius: 6px; background: var(--bg); box-shadow: var(--sh-in); overflow: hidden; }
        .tb-bar i { position: absolute; top: 0; bottom: 0; display: block; border-radius: 4px; }
        .tb-bar i.pos { background: linear-gradient(90deg, color-mix(in srgb, var(--up) 55%, transparent), var(--up)); }
        .tb-bar i.neg { background: linear-gradient(270deg, color-mix(in srgb, var(--down) 55%, transparent), var(--down)); }
        .tb-bar em { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--warn); }
        .tb-bar u { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--ink-3); opacity: .6; }
        .tb-timeline { position: relative; padding-left: 1.5rem; border-left: 1px solid var(--line); margin-left: .4rem; max-height: 640px; overflow-y: auto; }
        .tb-ev { position: relative; padding: .1rem 0 .9rem; font-size: .82rem; line-height: 1.5; color: var(--ink-2); font-weight: 300; }
        .tb-ev::before { content: ''; position: absolute; left: calc(-1.5rem - 5px); top: .42rem; width: 9px; height: 9px; border-radius: 50%; background: var(--ink-3); box-shadow: 0 0 0 3px var(--surface); }
        .tb-ev.analyse::before { background: var(--warn); }
        .tb-ev.kauf::before, .tb-ev.nachkauf::before, .tb-ev.hoch::before { background: var(--up); }
        .tb-ev.tief::before, .tb-ev.stop::before, .tb-ev.verkauf::before { background: var(--down); }
        .tb-ev.post::before { background: var(--a2); }
        .tb-ev .d { display: block; font-family: var(--mono); font-size: .62rem; text-transform: uppercase; letter-spacing: .12em; color: var(--ink-3); }
        .tb-ev b { color: var(--ink); font-weight: 500; }
        .tb-coins .card-head { flex-wrap: wrap; }
        .tb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
        .tb-card { padding: 18px; border-left: 3px solid transparent; }
        .tb-card.gut { border-left-color: var(--up); }
        .tb-card.schwach { border-left-color: var(--down); }
        .tb-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; row-gap: 4px; cursor: pointer; }
        .tb-rangbadge { display: inline-grid; place-items: center; min-width: 24px; height: 24px; padding: 0 6px; border-radius: 8px; background: var(--surface); box-shadow: var(--sh-sm); font-family: var(--mono); font-size: .7rem; color: var(--ink-2); }
        .tb-sym { font-weight: 600; letter-spacing: .01em; }
        .tb-tier { font-size: .72rem; color: var(--ink-3); margin-top: 5px; }
        .tb-perf { font-size: 1.35rem; font-weight: 300; line-height: 1; }
        .tb-alpha { font-family: var(--mono); font-size: .64rem; color: var(--ink-3); margin-top: 5px; }
        .tb-spark { display: block; width: 100%; height: 44px; margin: 12px 0 4px; }
        .tb-zahlen { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 10px; font-size: .64rem; color: var(--ink-3); font-family: var(--mono); }
        .tb-zahlen b { display: block; margin-top: 3px; font-size: .76rem; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tb-zahlen b.up { color: var(--up); } .tb-zahlen b.down { color: var(--down); }
        .tb-card details { margin-top: 12px; border-top: 1px solid var(--line); padding-top: 10px; }
        .tb-card summary { cursor: pointer; font-size: .76rem; color: var(--ink-2); list-style: none; display: flex; align-items: center; gap: 6px; }
        .tb-card summary::-webkit-details-marker { display: none; }
        .tb-card summary svg { width: 13px; height: 13px; color: var(--pg); transition: transform .3s var(--ease); }
        .tb-card details[open] summary svg { transform: rotate(90deg); }
        .tb-txt { font-size: .8rem; line-height: 1.5; color: var(--ink-2); margin-top: 8px; font-weight: 300; }
        .tb-txt b { color: var(--pg); font-weight: 500; }
        .tb-page code { font-family: var(--mono); font-size: .9em; padding: 1px 6px; border-radius: 6px; background: var(--sunk); }
        @media (max-width: 1180px) { .tb-kopf { grid-template-columns: minmax(0, 1fr); gap: 18px; } .tb-zwei { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 860px) { .tb-rz { grid-template-columns: 1.4rem 4.6rem minmax(0, 1fr) 4.2rem; } .tb-rz .s small { display: none; } .tb-grid { grid-template-columns: minmax(0, 1fr); } }`,
    render(root) {
        root.classList.add('stack', 'tb-page');
        const d = D.tagebuch;
        if (!d || !d.eintraege || !d.eintraege.length) {
            root.innerHTML = pageHead('Heute', 'Analyse-Tagebuch', INTRO) +
                card({ body: `<div class="empty">Noch keine Analyse im Tagebuch. Erste Analyse in <code>tagebuch.json</code> anlegen und <code>python3 update_tagebuch.py</code> laufen lassen.</div>` });
            return;
        }
        state.eintrag = 0;
        const liste = d.eintraege.map((e, i) => [String(i), datumDE(e.datum) + ' · ' + e.titel]);
        root.innerHTML = pageHead('Heute', 'Analyse-Tagebuch', INTRO,
            `<span class="eyebrow">Stand ${esc(d.updated)}${d.kurse_live ? ' · Kurse live' : ' · Kurse aus der Historie'}</span>`) +
            card({ eyebrow: 'Gesamtbilanz aller Analysen', body: gesamt(d) }) +
            `<div>${seg('tbeintrag', liste, '0')}</div>` +
            `<div id="tbEintrag" class="stack anim">${eintrag(d)}</div>`;
        const box = root.querySelector('#tbEintrag');
        const zeichne = () => { box.innerHTML = eintrag(d); icons(box); };
        root.onclick = ev => {
            const b = ev.target.closest('.seg button');
            if (!b) return;
            const name = b.parentNode.dataset.seg;
            if (name === 'tbeintrag') {
                state.eintrag = parseInt(b.dataset.v, 10);
                b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
                zeichne();
            } else if (name === 'tbfilter' || name === 'tbsort') {
                state[name === 'tbfilter' ? 'filter' : 'sort'] = b.dataset.v;
                b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
                const g = root.querySelector('#tbGrid');
                g.innerHTML = grid(d.eintraege[state.eintrag]); icons(g);
            }
        };
    },
};
