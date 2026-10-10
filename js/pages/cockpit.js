import { D, coin, watch, store } from '../core/data.js?v=202610101938';
import { esc, fBig, fPct, fUsd, cls, ago } from '../core/fmt.js?v=202610101938';
import { card, pageHead, ring, bar, scoreVar, scoreBadge, sparkline, sparkFor, dotChart, coinRow, coinImg, pct, empty, icon, icons, chip, hydrate, toast } from '../core/ui.js?v=202610101938';


function ampel() {
    const m = (D.signals && D.signals.market) || {}, ex = D.extras || {};
    const fng = ex.fng_history && ex.fng_history.length ? ex.fng_history[ex.fng_history.length - 1] : null;
    let punkte = 0, teile = 0;
    if (m.pct_above_ema50 != null) { punkte += m.pct_above_ema50; teile++; }
    if (m.avg_score != null) { punkte += m.avg_score; teile++; }
    if (fng) { punkte += fng.value; teile++; }
    const g = teile ? punkte / teile : null;
    const urteil = g == null ? 'Keine Daten' : g >= 68 ? 'Risiko an' : g >= 52 ? 'Vorsichtig positiv' : g >= 38 ? 'Abwartend' : 'Risiko aus';
    const text = g == null ? '' : g >= 68 ? 'Breite, Stimmung und Momentum ziehen in dieselbe Richtung.'
        : g >= 52 ? 'Mehr Rücken- als Gegenwind, aber ohne Übertreibung.'
        : g >= 38 ? 'Gemischtes Bild. Einzelne Coins statt breiter Einstieg.'
        : 'Die Mehrheit liegt unter ihren Durchschnitten. Geduld schlägt Aktion.';
    const z = (k, v, val, farbe) => val == null ? '' :
        `<div><div class="row between" style="font-size:.8rem;margin-bottom:6px"><span class="dim">${k}</span><span class="num">${v}</span></div>${bar(val, farbe)}</div>`;
    return card({ eyebrow: 'Marktampel', cls: 'tint', body: `
        <div class="ck-ampel">
            ${ring(g, 'von 100', 210)}
            <div class="stack" style="gap:14px;flex:1;min-width:220px">
                <div><div class="h1" style="font-size:1.9rem;color:${scoreVar(g)}">${urteil}</div><p class="sub" style="margin-top:6px">${text}</p></div>
                ${z('Über 50-Tage-Linie', m.pct_above_ema50 + '%', m.pct_above_ema50, scoreVar(m.pct_above_ema50))}
                ${z('Über 200-Tage-Linie', m.pct_above_ema200 + '%', m.pct_above_ema200, scoreVar(m.pct_above_ema200))}
                ${fng ? z('Angst und Gier', fng.value + ' · ' + esc(fng.label || ''), fng.value, scoreVar(fng.value)) : ''}
                ${m.avg_rsi != null ? z('Ø RSI', m.avg_rsi.toFixed(0), m.avg_rsi, scoreVar(100 - Math.abs(m.avg_rsi - 50) * 2)) : ''}
                ${m.avg_score != null ? z('Ø Signal-Score', m.avg_score.toFixed(0), m.avg_score, scoreVar(m.avg_score)) : ''}
            </div>
        </div>` });
}

function briefing() {
    const b = D.briefing;
    const body = !b || !b.blocks || !b.blocks.length
        ? empty('Noch kein Briefing. Es entsteht beim nächsten Lauf von generate_briefing.py.')
        : `<div class="ck-brief">${b.blocks.map(bl => `<h4>${esc(bl.titel)}</h4>` + bl.punkte.map(p => `<p>${esc(p)}</p>`).join('')).join('')}</div>`;
    return card({ eyebrow: 'Was heute zählt', right: b && b.datum ? chip(b.datum.split('-').reverse().join('.')) : '', body });
}

function kachel(label, wert, k, einheit) {
    const mk = (D.series && D.series.market) || [], last = mk[mk.length - 1] || {}, first = mk[0] || {};
    const reihe = mk.map(r => r[k]).filter(v => v != null);
    const chg = (last[k] != null && first[k]) ? (last[k] / first[k] - 1) * 100 : null;
    const fuss = einheit === 'pkt'
        ? (last[k] != null && first[k] != null ? `<span class="${cls(last[k] - first[k])} num">${last[k] - first[k] > 0 ? '+' : ''}${(last[k] - first[k]).toFixed(1).replace('.', ',')}</span>` : '')
        : pct(chg);
    return card({ cls: 'stat', body: `
        <div class="eyebrow">${label}</div><div class="big num v">${wert(last)}</div>
        <div class="foot">${fuss}<span>seit ${mk.length} Tagen</span></div>
        ${dotChart(reihe)}` });
}

function angstGier() {
    const h = (D.extras && D.extras.fng_history) || [], f = h[h.length - 1];
    if (!f) return card({ eyebrow: 'Angst und Gier', body: empty('Keine Daten.') });
    const vorher = h.length > 7 ? h[h.length - 8].value : null;
    return card({ cls: 'stat', body: `
        <div class="eyebrow">Angst und Gier</div>
        <div class="ck-fng">${ring(f.value, f.label || '', 96)}
            <div class="stack" style="gap:6px;min-width:0">${sparkline(h.slice(-30).map(x => x.value), 90, 30, scoreVar(f.value))}
            ${vorher != null ? `<div class="foot"><span class="${cls(f.value - vorher)} num">${f.value - vorher > 0 ? '+' : ''}${f.value - vorher}</span><span>zur Vorwoche</span></div>` : ''}</div>
        </div>` });
}

function signale() {
    const rows = (D.signals && D.signals.coins) || [];
    return card({ eyebrow: 'Stärkste Signale', right: `<a class="chip" data-go="radar" style="cursor:pointer">Radar</a>`,
        body: rows.length ? `<div class="list">${rows.slice(0, 8).map(r => {
            const c = coin(r.symbol) || {};
            return coinRow(r.symbol.toUpperCase(), r.name || r.symbol.toUpperCase(), c.image || r.image,
                (r.cat && r.cat !== 'Other' ? r.cat + ' · ' : '') + 'RSI ' + (r.rsi != null ? r.rsi.toFixed(0) : '—'),
                sparkline(r.spark, 54, 20) + scoreBadge(r.score));
        }).join('')}</div>` : empty('Signal-Engine noch nicht gelaufen.') });
}

const SEK_ICON = { AI: 'bot', L1: 'link', L2: 'layers-2', DeFi: 'landmark', RWA: 'building-2', DePIN: 'radio-tower', Gaming: 'gamepad-2',
    SocialFi: 'message-circle', Oracle: 'eye', Payments: 'banknote', Privacy: 'eye-off', Meme: 'smile', Exchange: 'repeat' };
function sektoren() {
    const acc = {};
    D.coins.forEach(c => {
        const k = c.cat, v = c.price_change_percentage_7d_in_currency;
        if (!k || k === 'Other' || k === 'Wrapped' || k === 'LST' || v == null) return;
        (acc[k] = acc[k] || []).push(v);
    });
    const rows = Object.keys(acc).filter(k => acc[k].length >= 3)
        .map(k => ({ k, avg: acc[k].reduce((a, b) => a + b, 0) / acc[k].length, n: acc[k].length })).sort((a, b) => b.avg - a.avg);
    const verlauf = (D.signals && D.signals.sector_history) || {};
    const max = Math.max(...rows.map(r => Math.abs(r.avg))) || 1;
    return card({ eyebrow: 'Sektoren, 7 Tage', body: rows.length ? `<div class="list">${rows.slice(0, 8).map(r => {
        const h = verlauf[r.k], farbe = r.avg >= 0 ? 'var(--up)' : 'var(--down)';
        const kurve = h && h.serie && h.serie.length >= 5 ? sparkline(h.serie, 70, 22, farbe)
            : `<span style="width:70px;display:block">${bar(Math.max(3, Math.abs(r.avg) / max * 100), farbe)}</span>`;
        return `<div class="li" data-go="narrative"><span class="ico-b">${icon(SEK_ICON[r.k] || 'circle')}</span>
            <div><div class="nm">${esc(r.k)}</div><div class="sb">${r.n} Coins</div></div>
            <div class="val">${kurve}<span style="min-width:58px">${pct(r.avg)}</span></div></div>`;
    }).join('')}</div>` : empty('Keine Sektordaten.') });
}

function meineListe() {
    const list = watch.list();
    return card({ eyebrow: 'Deine Watchlist', right: `<a class="chip" data-go="watchlist" style="cursor:pointer">Alle</a>`,
        body: list.length ? `<div class="list">${list.slice(0, 10).map(sym => {
            const c = coin(sym);
            return c ? coinRow(sym, c.name, c.image, sym + ' · ' + fUsd(c.current_price), pct(c.price_change_percentage_24h))
                     : coinRow(sym, sym, '', 'nicht in den Daten', '—');
        }).join('')}</div>` : empty('Noch keine Coins markiert. Setz in "Alle Kurse" einen Stern, dann erscheinen sie hier.') });
}

function leitwerte() {
    return card({ eyebrow: 'Leitwährungen live', right: `<a class="chip" data-go="kurse" style="cursor:pointer">Kurse</a>`,
        body: `<div class="list">${['BTC', 'ETH', 'SOL', 'BNB', 'XRP'].map(sym => {
            const c = coin(sym);
            return c ? coinRow(sym, c.name, c.image, fUsd(c.current_price), sparkFor(sym, 56, 20) + pct(c.price_change_percentage_24h)) : '';
        }).join('')}</div>` });
}

function news() {
    const n = (D.onchain && D.onchain.news) || [];
    return card({ eyebrow: 'Schlagzeilen', right: `<a class="chip" data-go="onchain" style="cursor:pointer">Mehr</a>`,
        body: n.length ? `<div class="ck-news">${n.slice(0, 6).map(x =>
            `<a class="card sunk click" style="padding:16px 18px" href="${esc(x.link)}" target="_blank" rel="noopener">
                <div class="eyebrow">${esc(x.source)}${x.ts ? ' · ' + ago(x.ts) : ''}</div>
                <div style="margin-top:8px;font-size:.92rem;line-height:1.4">${esc(x.title)}</div></a>`).join('')}</div>` : empty('Keine Nachrichten geladen.') });
}

const TS = () => window.TAGESSIGNALE_DATA || null;
function tagessignale() {
    const d = TS(), erg = (d && d.ergebnis) || {}, namen = (d && d.chains) || {};
    const alle = Object.keys(erg).flatMap(ch => (erg[ch].signale || []).map(s => ({ ...s, ch })))
        .sort((a, b) => (b.score || 0) - (a.score || 0));
    const warten = Object.keys(erg).reduce((a, ch) => a + ((erg[ch].beobachten || []).length), 0);
    return card({ eyebrow: 'Tages-Signale Memecoins', right: `<a class="chip" data-go="signale" style="cursor:pointer">Alle</a>`,
        body: alle.length ? `<div class="list">${alle.slice(0, 6).map(s => `<div class="li" data-go="signale">${coinImg(s.img)}
            <div style="min-width:0"><div class="nm">${esc(s.symbol)}${s.kol_bestaetigt ? ` <span class="chip" style="--c:var(--a3)">Smart Money</span>` : ''}</div>
            <div class="sb">${esc(namen[s.ch] || s.ch)} · MC ${fBig(s.mcap)}</div></div>
            <div class="val">${pct((s.chg || {}).h24)}${scoreBadge(s.score)}</div></div>`).join('')}</div>
            ${warten ? `<p class="sub" style="font-size:.76rem;margin-top:10px">${warten} weitere auf der Beobachtungsliste.</p>` : ''}`
            : empty('Heute kein Memecoin, der alle Prüfungen besteht.') });
}

function bilanz() {
    const b = TS() && TS().bilanz;
    if (!b || !b.n) return card({ eyebrow: 'Signal-Bilanz', body: empty('Noch keine gemessenen Signale.') });
    const z = (k, v, c) => `<div class="card sunk" style="padding:12px 14px"><div class="eyebrow" style="letter-spacing:.1em">${k}</div><div class="num" style="font-size:1.25rem;margin-top:4px;${c ? 'color:' + c : ''}">${v}</div></div>`;
    const de = v => (v > 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + '%';
    return card({ eyebrow: 'Signal-Bilanz', right: `<a class="chip" data-go="signale" style="cursor:pointer">Tagebuch</a>`, body: `
        <div class="ck-mini">
            ${z('Signale', b.n)}
            ${z('Über +20%', b.treffer_20 + ' von ' + b.n)}
            ${z('Ø bestes Hoch', de(b.schnitt_max_pct), 'var(--up)')}
            ${z('Ø mit Regel', de(b.schnitt_regel_pct), b.schnitt_regel_pct >= 0 ? 'var(--up)' : 'var(--down)')}
        </div>
        <p class="sub" style="font-size:.78rem;margin-top:12px">Je 100 $ pro Signal: perfekt verkauft ${fUsd(b.wert_perfekt)}, mit Trailing-Stop ${fUsd(b.wert_regel)} aus ${fUsd(b.summe_einsatz)}.${b.bester ? ` Bester Lauf ${esc(b.bester.symbol)} mit ${de(b.bester.max_pct)}.` : ''}</p>` });
}

const MP = () => window.MARKT_PLUS_DATA || null;
function optionen() {
    const o = MP() && MP().optionen;
    if (!o) return card({ eyebrow: 'Optionen', body: empty('Keine Optionsdaten.') });
    const de = (v, d = 2) => v == null ? '—' : v.toFixed(d).replace('.', ',');
    const block = k => {
        const x = o[k]; if (!x) return '';
        const zeile = (l, v) => `<div class="row between" style="font-size:.82rem;padding:5px 0"><span class="dim">${l}</span><span class="num">${v}</span></div>`;
        return `<div class="card sunk" style="padding:14px 16px"><div class="row between"><b>${k}</b>${chip(x.pc_oi < 0.7 ? 'Calls vorn' : x.pc_oi > 1 ? 'Puts vorn' : 'ausgeglichen', x.pc_oi < 0.7 ? 'var(--up)' : x.pc_oi > 1 ? 'var(--down)' : '')}</div>
            ${zeile('Put/Call offen', de(x.pc_oi))}
            ${zeile('Max Pain ' + (x.max_pain_datum || '').split('-').reverse().slice(0, 2).join('.'), fUsd(x.max_pain) + ` <span class="${cls(x.max_pain_abstand)}">${fPct(x.max_pain_abstand)}</span>`)}
            ${zeile('ATM-Vola', de(x.atm_iv, 1) + '%')}
            ${zeile('Skew 25 Delta', de(x.skew))}</div>`;
    };
    return card({ eyebrow: 'Optionen, Deribit', right: `<a class="chip" data-go="stimmung" style="cursor:pointer">Stimmung</a>`, body: `<div class="ck-zwei">${block('BTC')}${block('ETH')}</div>` });
}

function etf() {
    const e = MP() && MP().etf;
    if (!e || !e.BTC) return card({ eyebrow: 'ETF-Zuflüsse', body: empty('Keine ETF-Daten.') });
    const tage = (e.BTC.tage || []).slice(-14), max = Math.max(...tage.map(t => Math.abs(t.flow || 0))) || 1;
    const summe = (k, n) => ((e[k] && e[k].tage) || []).slice(-n).reduce((a, t) => a + (t.flow || 0), 0);
    const zeile = k => e[k] ? `<div class="row between" style="font-size:.82rem;padding:5px 0"><span class="dim">${k}, 5 Handelstage</span><span class="num ${cls(summe(k, 5))}">${summe(k, 5) >= 0 ? '+' : '−'}${fBig(Math.abs(summe(k, 5)))}</span></div>` : '';
    return card({ eyebrow: 'ETF-Zuflüsse', right: `<a class="chip" data-go="stimmung" style="cursor:pointer">Mehr</a>`, body: `
        <div class="ck-bars" title="Bitcoin-ETF, Nettozufluss je Handelstag">${tage.map(t => `<i style="height:${Math.max(4, Math.abs(t.flow || 0) / max * 100)}%;background:${(t.flow || 0) >= 0 ? 'var(--up)' : 'var(--down)'}" title="${esc(t.datum)}: ${fBig(t.flow)}"></i>`).join('')}</div>
        <div class="eyebrow" style="margin:6px 0 10px;letter-spacing:.1em">Bitcoin, ${tage.length} Handelstage</div>
        ${zeile('BTC')}${zeile('ETH')}${zeile('SOL')}` });
}

function labor() {
    const l = window.LABOR_DATA;
    if (!l) return card({ eyebrow: 'Signal-Labor', body: empty('Noch keine Laborauswertung.') });
    return card({ eyebrow: 'Signal-Labor', right: `<a class="chip" data-go="labor" style="cursor:pointer">Labor</a>`, body: `
        ${(l.kernaussagen || []).slice(0, 2).map(t => `<p class="sub" style="margin:0 0 10px;font-size:.86rem">${esc(t)}</p>`).join('')}
        ${l.basis ? `<div class="row wrap" style="gap:8px">${chip(l.basis.stichtage_7 + ' Stichtage')}${chip(String(l.basis.unabhaengige_wochen).replace('.', ',') + ' unabhängige Wochen', 'var(--warn)')}</div>` : ''}` });
}

function squeeze() {
    const s = MP() && MP().squeeze;
    const liste = s ? ((s.kandidaten || []).length ? s.kandidaten : (s.beobachten || [])) : [];
    const echt = !!(s && (s.kandidaten || []).length);
    return card({ eyebrow: echt ? 'Squeeze-Kandidaten' : 'Squeeze-Beobachtung', right: `<a class="chip" data-go="stimmung" style="cursor:pointer">Mehr</a>`,
        body: liste.length ? `<div class="list">${liste.slice(0, 5).map(x => {
            const c = coin(x.symbol) || {};
            return `<div class="li" data-coin="${esc(x.symbol)}">${coinImg(c.image)}<div style="min-width:0"><div class="nm">${esc(x.symbol)} ${chip(x.seite === 'short' ? 'Short-Squeeze' : 'Long-Squeeze', x.seite === 'short' ? 'var(--up)' : 'var(--down)')}</div>
                <div class="sb" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.grund || '')}</div></div><div class="val">${scoreBadge(x.score)}</div></div>`;
        }).join('')}</div>${echt ? '' : '<p class="sub" style="font-size:.76rem;margin-top:10px">Kein Coin erfüllt gerade alle Bedingungen. Das sind die nächsten.</p>'}`
            : empty('Keine Squeeze-Daten.') });
}

const bereiche = () => [
    ['Kurse',            D.coinsStand,                          false, 8],
    ['Signale',          D.signals && D.signals.updated,        false, 8],
    ['Markt, TVL, F&G',  D.extras && D.extras.updated,          false, 8],
    ['Briefing',         D.briefing && D.briefing.updated,      false, 26],
    ['Tagebuch',         D.tagebuch && D.tagebuch.updated,      false, 26],
    ['Memecoin-Signale', D.memecoins && D.memecoins.stand,      false, 12],
    ['Narrativ Scan',    D.narrativ && D.narrativ.updated,      false, 12],
    ['Hidden Gems',      D.gems && D.gems.updated,              true,  26],
    ['Social Buzz',      D.social && D.social.updated,          true,  26],
    ['Onchain und News', D.onchain && D.onchain.updated,        true,  26],
];
function parseUtc(v) {
    if (!v) return null;
    let s = String(v).trim().replace(' UTC', '').replace(' ', 'T');
    if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z';
    const t = Date.parse(s);
    return isNaN(t) ? null : t;
}
function alter(h) {
    if (h == null) return 'unbekannt';
    if (h < 1) return 'gerade eben';
    if (h < 48) return 'vor ' + Math.round(h) + ' Stunden';
    return 'vor ' + (h / 24).toFixed(1).replace('.', ',') + ' Tagen';
}
const STUFE = { ok: 'var(--up)', warn: 'var(--warn)', alt: 'var(--down)', unbekannt: 'var(--ink-3)' };
const frischeGrid = () => bereiche().map(b => {
    const t = parseUtc(b[1]);
    const h = t == null ? null : (Date.now() - t) / 36e5;
    const stufe = h == null ? 'unbekannt' : h >= b[3] * 2 ? 'alt' : h >= b[3] ? 'warn' : 'ok';
    return `<div class="card sunk row between ck-fr${b[2] ? ' voll' : ''}" style="padding:12px 16px"><div class="row" style="gap:10px"><span class="fresh" style="background:${STUFE[stufe]};box-shadow:none"></span>
        <div><div style="font-size:.86rem">${esc(b[0])}</div>${b[2] ? '<div class="ck-voll">nur im vollen Lauf</div>' : ''}</div></div><span class="eyebrow" style="letter-spacing:.08em">${alter(h)}</span></div>`;
}).join('');
function frische() {
    const s = D.status, steps = (s && s.steps) || [];
    return card({ eyebrow: 'Datenfrische', right: s ? chip(`Letzter Lauf ${ago(s.finished_ts)} · ${s.mode === 'quick' ? 'schnell' : 'voll'}`, s.failed ? 'var(--down)' : 'var(--up)') : '',
        body: `<p class="sub" style="margin:0 0 16px">${window.CB2_PUBLIC ? 'Welcher Bereich wann zuletzt gezogen wurde. Kurse, Markt und Onchain werden mehrmals am Tag automatisch aktualisiert, die Kurse oben laufen live über Binance.' : 'Welcher Bereich wann zuletzt gezogen wurde. <b>Klick auf Refresh</b> oben rechts aktualisiert nur die schnellen Bereiche, rund 10 Sekunden. <b>Shift und Klick auf Refresh</b> zieht alles, auch Hidden Gems, Social Buzz, Onchain und den Memecoin-Sammler, rund 8 Minuten. Der Lauf um 07:30 macht jeden Morgen automatisch alles.'}</p>
        <div class="grid g-auto ck-frische" style="gap:10px">${frischeGrid()}</div>
        ${steps.some(x => !x.ok) ? `<div class="eyebrow" style="margin:18px 0 8px">Fehlgeschlagen</div>` + steps.filter(x => !x.ok).map(x => `<div class="sub down">${esc(x.name)}: ${esc(x.note || x.script)}</div>`).join('') : ''}` });
}

const GROESSE = { S: 'Klein', M: 'Mittel', L: 'Halb', X: 'Groß', F: 'Volle Breite' };
const W = [
    { id: 'ampel',     titel: 'Marktampel',        icon: 'gauge',          info: 'Gesamturteil aus Breite, Stimmung und Score.', groessen: ['M', 'L', 'X', 'F'], std: 'L', html: ampel },
    { id: 'briefing',  titel: 'Briefing',          icon: 'newspaper',      info: 'Was heute zählt, aus dem Morgen-Briefing.',   groessen: ['M', 'L', 'X', 'F'], std: 'L', html: briefing },
    { id: 'gesamt',    titel: 'Gesamtmarkt',       icon: 'globe',          info: 'Marktkapitalisierung aller Coins.',           groessen: ['S', 'M'], std: 'S', html: () => kachel('Gesamtmarkt', l => fBig(l.total_mcap), 'total_mcap') },
    { id: 'btcanteil', titel: 'Bitcoin-Anteil',    icon: 'bitcoin',        info: 'Dominanz von Bitcoin am Gesamtmarkt.',        groessen: ['S', 'M'], std: 'S', html: () => kachel('Bitcoin-Anteil', l => l.btc_dominance != null ? l.btc_dominance.toFixed(1).replace('.', ',') + '%' : '—', 'btc_dominance', 'pkt') },
    { id: 'stables',   titel: 'Stablecoins',       icon: 'circle-dollar-sign', info: 'Trockenpulver am Rand des Marktes.',      groessen: ['S', 'M'], std: 'S', html: () => kachel('Stablecoins', l => fBig(l.stablecoin_mcap), 'stablecoin_mcap') },
    { id: 'fng',       titel: 'Angst und Gier',    icon: 'thermometer',    info: 'Fear and Greed mit 30-Tage-Verlauf.',         groessen: ['S', 'M'], std: 'S', html: angstGier },
    { id: 'signale',   titel: 'Stärkste Signale',  icon: 'zap',            info: 'Top 8 der Signal-Engine.',                    groessen: ['M', 'L'], std: 'M', html: signale },
    { id: 'sektoren',  titel: 'Sektoren',          icon: 'pie-chart',      info: 'Welche Narrative in 7 Tagen laufen.',         groessen: ['M', 'L'], std: 'M', html: sektoren },
    { id: 'watchlist', titel: 'Watchlist',         icon: 'star',           info: 'Deine markierten Coins, live.',               groessen: ['M', 'L'], std: 'M', html: meineListe, live: true },
    { id: 'leitwerte', titel: 'Leitwährungen',     icon: 'activity',       info: 'BTC, ETH, SOL, BNB und XRP live.',            groessen: ['M', 'L'], std: 'M', html: leitwerte, live: true },
    { id: 'tagessig',  titel: 'Tages-Signale',     icon: 'crosshair',      info: 'Geprüfte Memecoins auf Solana, Base, BNB, Robinhood und Monad.',     groessen: ['M', 'L'], std: 'M', html: tagessignale },
    { id: 'bilanz',    titel: 'Signal-Bilanz',     icon: 'trophy',         info: 'Was die Tages-Signale wirklich gebracht hätten.', groessen: ['M', 'L'], std: 'M', html: bilanz },
    { id: 'optionen',  titel: 'Optionen',          icon: 'scale',          info: 'Put/Call, Max Pain und Vola für BTC und ETH.', groessen: ['M', 'L'], std: 'M', html: optionen },
    { id: 'etf',       titel: 'ETF-Zuflüsse',      icon: 'landmark',       info: 'Nettozuflüsse der Spot-ETFs.',                groessen: ['M', 'L'], std: 'M', html: etf },
    { id: 'squeeze',   titel: 'Squeeze',           icon: 'flame',          info: 'Funding und Open Interest auf Binance.',      groessen: ['M', 'L'], std: 'M', html: squeeze },
    { id: 'labor',     titel: 'Signal-Labor',      icon: 'flask-conical',  info: 'Was die Signal-Bausteine wirklich vorhersagen.', groessen: ['M', 'L', 'X'], std: 'L', html: labor },
    { id: 'news',      titel: 'Schlagzeilen',      icon: 'rss',            info: 'Die 6 neuesten Nachrichten.',                 groessen: ['L', 'X', 'F'], std: 'F', html: news },
    { id: 'frische',   titel: 'Datenfrische',      icon: 'timer',          info: 'Wann welcher Bereich zuletzt gezogen wurde.', groessen: ['L', 'X', 'F'], std: 'F', html: frische },
];

let STANDARD = ['ampel', 'briefing', 'gesamt', 'btcanteil', 'stables', 'fng', 'signale', 'sektoren', 'watchlist', 'news', 'frische'];


const WID = new Map(W.map(w => [w.id, w]));

const KEY = window.CB2_PUBLIC ? 'cb2_cockpit_oeff_v1' : 'cb2_cockpit_v1';
function laden() {
    const s = store.get(KEY, null);
    const order = (s && Array.isArray(s.order) ? s.order : STANDARD).filter(id => WID.has(id));
    const size = {};
    order.forEach(id => {
        const w = WID.get(id), g = s && s.size && s.size[id];
        size[id] = g && w.groessen.includes(g) ? g : w.std;
    });
    return { order: [...new Set(order)], size };
}
let L = laden();
const speichern = () => store.set(KEY, { v: 1, order: L.order, size: L.size });

const inhalt = w => {
    try { return w.html(); }
    catch (e) { console.error(e); return card({ eyebrow: w.titel, body: empty('Dieses Widget konnte nicht geladen werden.') }); }
};
const werkzeuge = (w, g) => `<div class="ck-tools" aria-label="${esc(w.titel)} anpassen">
    <button class="ck-t ck-griff" data-t="griff" title="Ziehen zum Verschieben">${icon('grip-vertical')}</button>
    <button class="ck-t ck-dir" data-t="vor" title="Nach vorn">${icon('chevron-left')}</button>
    <button class="ck-t ck-dir" data-t="zurueck" title="Nach hinten">${icon('chevron-right')}</button>
    ${w.groessen.length > 1 ? `<button class="ck-t ck-gr" data-t="groesse" title="Größe: ${GROESSE[g]}">${icon('maximize-2')}<span>${g}</span></button>` : ''}
    <button class="ck-t" data-t="weg" title="Ausblenden">${icon('eye-off')}</button></div>`;
const widget = (w, g) => `<div class="ck-w" data-w="${w.id}" data-size="${g}">${werkzeuge(w, g)}${inhalt(w)}</div>`;

const galerie = () => {
    const frei = W.filter(w => !L.order.includes(w.id));
    return frei.length
        ? `<div class="ck-gal">${frei.map(w =>
            `<button class="ck-add" data-add="${w.id}"><span class="ico-b">${icon(w.icon)}</span><span style="min-width:0"><b>${esc(w.titel)}</b><small>${esc(w.info)}</small></span>${icon('plus')}</button>`).join('')}</div>`
        : `<p class="sub" style="margin:0;font-size:.8rem">Alle Widgets sind im Cockpit. Über das Auge blendest du eins aus, dann liegt es wieder hier.</p>`;
};
const freiZahl = () => W.filter(w => !L.order.includes(w.id)).length;
let galerieAuf = false;
const leiste = () => `<div class="ck-bar card tint${galerieAuf ? ' auf' : ''}">
    <div class="row between wrap" style="gap:12px">
        <div style="min-width:0;flex:1"><div class="eyebrow">Cockpit einrichten</div>
            <p class="sub ck-hilfe" style="margin-top:6px">Widget ziehen (am Handy lange drücken) oder mit den Pfeilen verschieben. Das Größen-Symbol schaltet die Breite, das Auge blendet aus. Alles wird sofort gespeichert.</p></div>
        <div class="row wrap" style="gap:10px">
            <button class="btn soft" data-ck="galerie">${icon('plus')}<span class="ck-std">Widget</span> hinzufügen<span class="chip ck-zahl">${freiZahl()}</span></button>
            <button class="btn soft" data-ck="standard" title="Standard wiederherstellen">${icon('rotate-ccw')}<span class="ck-std">Standard</span></button>
            <button class="btn grad" data-ck="fertig">${icon('check')}Fertig</button></div>
    </div>
    <div class="ck-galw"><div class="ck-gali">${galerie()}</div></div></div>`;
const leer = () => `<div class="ck-leer">${card({ eyebrow: 'Cockpit', cls: 'tint', body: `<p class="sub" style="margin:0 0 14px">Dein Cockpit ist leer. Hol dir die Widgets zurück, die du sehen willst.</p><button class="btn grad" data-ck="bearbeiten">${icon('layout-grid')}Cockpit einrichten</button>` })}</div>`;

function flip(grid, aendern) {
    const vorher = new Map([...grid.querySelectorAll('.ck-w')].map(el => [el, el.getBoundingClientRect()]));
    aendern();
    grid.querySelectorAll('.ck-w').forEach(el => {
        const a = vorher.get(el); if (!a || el.classList.contains('ck-ph')) return;
        const b = el.getBoundingClientRect();
        const dx = a.left - b.left, dy = a.top - b.top, sx = a.width / (b.width || 1), sy = a.height / (b.height || 1);
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;
        el.animate([{ transformOrigin: '0 0', transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})` }, { transformOrigin: '0 0', transform: 'none' }],
            { duration: 420, easing: 'cubic-bezier(.22,.9,.24,1)' });
    });
}
const aufbauen = el => { hydrate(el); el.classList.add('done'); };
const fertig = (anim, ms) => Promise.race([anim.finished.catch(() => {}), new Promise(r => setTimeout(r, ms + 60))]);

let onLive = null, onWatch = null, timer = null, onFocus = null, onKey = null, ziehen = null, ziehRaus = null;

export default {
    styles: `
        .ck-ampel { display: flex; align-items: center; gap: 34px; flex-wrap: wrap; padding: 8px 6px; }
        .ck-brief { max-height: 372px; overflow-y: auto; padding-right: 8px; }
        .ck-brief h4 { font-family: var(--mono); font-size: .64rem; letter-spacing: .18em; text-transform: uppercase; color: var(--pg); margin: 16px 0 6px; font-weight: 500; }
        .ck-brief h4:first-child { margin-top: 0; }
        .ck-brief p { margin: 0 0 7px; font-size: .9rem; color: var(--ink-2); font-weight: 300; }
        .ck-fr.voll { outline: 1px solid color-mix(in srgb, var(--warn) 30%, transparent); }
        .ck-voll { font-family: var(--mono); font-size: .6rem; letter-spacing: .08em; color: var(--warn); margin-top: 2px; }
        .ck-news { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); }
        .ck-fng { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; margin-top: 10px; min-width: 0; }
        .ck-fng .spark { max-width: 100%; }
        .ck-mini { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .ck-zwei { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
        .ck-bars { display: flex; align-items: flex-end; gap: 4px; height: 74px; padding: 4px 0; }
        .ck-bars i { flex: 1; border-radius: 4px 4px 2px 2px; opacity: .8; min-width: 4px; transform-origin: bottom; animation: ckBar .7s var(--ease) both; }
        @keyframes ckBar { from { transform: scaleY(0); } }

        /* Das Raster: 12 Spalten, dichte Füllung, Zeilen so hoch wie ihr größtes Widget */
        .ck-grid { position: relative; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 22px; grid-auto-flow: row dense; }
        .ck-w { position: relative; grid-column: span 4; display: flex; flex-direction: column; min-width: 0; }
        .ck-w > .card { flex: 1; }
        .ck-w[data-size="S"] { grid-column: span 3; } .ck-w[data-size="M"] { grid-column: span 4; }
        .ck-w[data-size="L"] { grid-column: span 6; } .ck-w[data-size="X"] { grid-column: span 8; } .ck-w[data-size="F"] { grid-column: span 12; }
        .ck-grid > .ck-w { animation: rise .6s var(--ease) both; animation-delay: calc(var(--j, 0) * 45ms); }
        .done .ck-grid > .ck-w, .ck-grid > .ck-w.done { animation: none; }

        /* Werkzeuge je Widget, nur im Bearbeiten-Modus */
        .ck-tools { position: absolute; top: 12px; right: 12px; z-index: 4; display: flex; gap: 2px; padding: 4px; border-radius: 99px;
            background: var(--surface); box-shadow: var(--sh-float), inset 0 0 0 1px var(--line);
            opacity: 0; transform: translateY(-6px) scale(.94); pointer-events: none; transition: opacity .25s var(--ease), transform .35s var(--ease-spring); }
        .ck-t { height: 32px; min-width: 32px; padding: 0 7px; border-radius: 99px; display: inline-flex; align-items: center; justify-content: center; gap: 4px;
            color: var(--ink-2); font-family: var(--mono); font-size: .62rem; letter-spacing: .08em; transition: background .2s, color .2s, transform .2s var(--ease-spring); }
        .ck-t svg { width: 15px; height: 15px; }
        .ck-t:hover { background: var(--bg); color: var(--ink); } .ck-t:active { transform: scale(.9); }
        .ck-t[data-t="weg"]:hover { color: var(--down); }
        .ck-griff { cursor: grab; touch-action: none; }
        .ck-edit .ck-tools { opacity: 1; transform: none; pointer-events: auto; }
        .ck-edit .ck-w > .card { pointer-events: none; user-select: none; -webkit-user-select: none;
            outline: 1.5px dashed color-mix(in srgb, var(--pg) 45%, transparent); outline-offset: 5px; transition: outline-color .2s, transform .3s var(--ease); }
        .ck-edit .ck-w { cursor: grab; -webkit-touch-callout: none; }
        .ck-edit .ck-w.ck-halten > .card { transform: scale(.97); transition: transform .4s var(--ease); outline-color: var(--pg); }
        .ck-edit .ck-w:hover > .card { outline-color: var(--pg); }
        .ck-edit .ck-w > .card .ck-brief { overflow: hidden; }

        /* Platzhalter und gezogenes Widget */
        .ck-ph { border-radius: var(--r-lg); background: color-mix(in srgb, var(--pg) 7%, transparent); box-shadow: var(--sh-in);
            outline: 1.5px dashed color-mix(in srgb, var(--pg) 60%, transparent); outline-offset: -1px; animation: none !important; }
        .ck-drag { position: fixed !important; z-index: 120; pointer-events: none; margin: 0; cursor: grabbing; will-change: transform; animation: none !important; }
        .ck-drag > .card { box-shadow: var(--sh-float) !important; outline: 1.5px solid var(--pg) !important; }
        .ck-drag .ck-tools { opacity: 0; }
        body.ck-ziehen, body.ck-ziehen * { cursor: grabbing !important; user-select: none !important; -webkit-user-select: none !important; }

        /* Leiste und Galerie */
        .ck-bar { position: sticky; top: 6px; z-index: 30; margin-bottom: 22px; animation: rise .45s var(--ease) both;
            box-shadow: var(--sh-float); background: linear-gradient(150deg, color-mix(in srgb, var(--pg) 14%, var(--surface)), var(--surface) 70%); }
        .ck-galw { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s var(--ease); margin: 0 -6px; }
        .ck-bar.auf .ck-galw { grid-template-rows: 1fr; }
        .ck-gali { min-height: 0; overflow: hidden; padding: 0 6px; }
        .ck-bar.auf .ck-gali { overflow-y: auto; max-height: 38vh; padding: 16px 6px 4px; }
        .ck-bar .chip.ck-zahl { --c: var(--pg); margin-left: 2px; }
        .ck-bar .btn { padding: 9px 16px; white-space: nowrap; gap: 7px; }
        .ck-gal { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
        .ck-add { display: grid; grid-template-columns: 34px minmax(0, 1fr) 18px; gap: 12px; align-items: center; text-align: left; padding: 12px 14px;
            border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); color: var(--ink); transition: transform .25s var(--ease-spring), box-shadow .25s; }
        .ck-add:hover { transform: translateY(-2px); box-shadow: var(--sh-sm); }
        .ck-add:active { transform: scale(.97); }
        .ck-add b { display: block; font-size: .86rem; font-weight: 500; }
        .ck-add small { display: block; font-size: .72rem; color: var(--ink-3); line-height: 1.35; margin-top: 2px; }
        .ck-add > svg { width: 16px; height: 16px; color: var(--pg); }
        .ck-leer { margin-top: 4px; }

        @media (max-width: 1180px) {
            .ck-w[data-size="S"], .ck-w[data-size="M"] { grid-column: span 6; }
            .ck-w[data-size="L"], .ck-w[data-size="X"], .ck-w[data-size="F"] { grid-column: span 12; }
            .ck-gr { display: none !important; }
        }
        @media (max-width: 860px) {
            .ck-ampel { justify-content: center; gap: 22px; }
            .ck-grid { gap: 14px; }
            .ck-w[data-size] { grid-column: span 12; }
            .ck-w[data-size="S"] { grid-column: span 6; }
            .ck-w[data-size="S"] > .card { padding: 14px 15px; } .ck-w[data-size="S"] .big { font-size: 1.32rem; } .ck-w[data-size="S"] .eyebrow { letter-spacing: .12em; }
            .ck-w[data-size="S"] .num { overflow-wrap: anywhere; }
            .ck-w[data-size="S"] .ck-tools { top: 6px; right: 6px; }
            .ck-w[data-size="S"] .ck-dir { display: none; }
            .ck-dir svg { transform: rotate(90deg); }
            .ck-t { height: 36px; min-width: 36px; }
            .ck-bar { top: 4px; padding: 14px 16px; } .ck-hilfe { display: none; } .ck-std { display: none; }
            .ck-bar .row.wrap { width: 100%; } .ck-bar .btn { flex: 1; justify-content: center; padding: 10px 12px; } .ck-bar .btn.soft[data-ck="standard"] { flex: none; }
            .ck-gal { grid-template-columns: minmax(0, 1fr); }
        }`,
    render(root) {
        const h = new Date().getHours();
        const gruss = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
        L = laden();
        root.innerHTML = pageHead('Cockpit', window.CB2_PUBLIC ? gruss : gruss + ', Nader', 'Der Markt in einem Blick. Stell dir dein Cockpit selbst zusammen: Widgets verschieben, vergrößern, ausblenden.',
                `<button class="btn soft" data-ck="bearbeiten" id="ckEditBtn">${icon('layout-grid')}Cockpit einrichten</button>`) +
            `<div class="ck-barw"></div><div class="ck-grid">${L.order.map((id, i) => widget(WID.get(id), L.size[id]).replace('class="ck-w"', `class="ck-w" style="--j:${i}"`)).join('')}</div>` +
            (L.order.length ? '' : leer());
        root.classList.add('stack');
        root.style.gap = '0';
        const grid = root.querySelector('.ck-grid'), barW = root.querySelector('.ck-barw');
        let bearbeiten = false;

        const sync = () => { L.order = [...grid.querySelectorAll('.ck-w:not(.ck-ph)')].map(el => el.dataset.w); speichern(); };
        const galerieNeu = () => {
            const g = root.querySelector('.ck-gali'); if (g) { g.innerHTML = galerie(); icons(g); }
            const z = root.querySelector('.ck-zahl'); if (z) z.textContent = freiZahl();
        };
        const leerPruefen = () => {
            const da = root.querySelector('.ck-leer');
            if (!L.order.length && !da && !bearbeiten) { root.insertAdjacentHTML('beforeend', leer()); icons(root.querySelector('.ck-leer')); }
            if ((L.order.length || bearbeiten) && da) da.remove();
        };

        const modus = an => {
            bearbeiten = an;
            root.classList.toggle('ck-edit', an);
            root.querySelector('#ckEditBtn').style.display = an ? 'none' : '';
            if (an) { barW.innerHTML = leiste(); icons(barW); }
            else { barW.innerHTML = ''; toast('Cockpit gespeichert'); }
            leerPruefen();
        };

        const verschieben = (el, richtung) => {
            const nachbar = richtung < 0 ? el.previousElementSibling : el.nextElementSibling;
            if (!nachbar) return;
            flip(grid, () => richtung < 0 ? nachbar.before(el) : nachbar.after(el));
            sync();
        };
        const groesse = el => {
            const w = WID.get(el.dataset.w), i = w.groessen.indexOf(el.dataset.size), g = w.groessen[(i + 1) % w.groessen.length];
            flip(grid, () => { el.dataset.size = g; });
            const knopf = el.querySelector('.ck-gr'); if (knopf) { knopf.querySelector('span').textContent = g; knopf.title = 'Größe: ' + GROESSE[g]; }
            L.size[el.dataset.w] = g; speichern();
        };
        const ausblenden = el => {
            el.style.pointerEvents = 'none';
            const a = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.9)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
            fertig(a, 220).then(() => {
                flip(grid, () => el.remove());
                sync(); galerieNeu(); leerPruefen();
            });
        };
        const hinzu = id => {
            const w = WID.get(id); if (!w || L.order.includes(id)) return;
            L.size[id] = L.size[id] && w.groessen.includes(L.size[id]) ? L.size[id] : w.std;
            const tmp = document.createElement('div'); tmp.innerHTML = widget(w, L.size[id]);
            const el = tmp.firstElementChild;
            flip(grid, () => grid.appendChild(el));
            aufbauen(el);
            el.animate([{ opacity: 0, transform: 'translateY(18px) scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.22,.9,.24,1)' });
            sync(); galerieNeu(); leerPruefen();
            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
        };

        const main = document.getElementById('main');
        const ziehStart = (e, el) => {
            const r = el.getBoundingClientRect();
            const ph = document.createElement('div');
            ph.className = 'ck-w ck-ph'; ph.dataset.size = el.dataset.size; ph.style.height = r.height + 'px';
            el.before(ph);
            el.classList.add('ck-drag');
            Object.assign(el.style, { width: r.width + 'px', height: r.height + 'px', left: r.left + 'px', top: r.top + 'px' });
            document.body.appendChild(el);
            document.body.classList.add('ck-ziehen');
            const dx = e.clientX - r.left, dy = e.clientY - r.top;
            let x = e.clientX, y = e.clientY, sperre = 0, raf = 0;
            const setzen = () => { el.style.transform = `translate3d(${x - dx - r.left}px,${y - dy - r.top}px,0) rotate(1.2deg) scale(1.025)`; };
            el.animate([{ transform: 'none' }, { transform: `rotate(1.2deg) scale(1.025)` }], { duration: 180, easing: 'ease-out' });
            setzen();
            const ziel = () => {
                if (performance.now() < sperre) return;
                const g = grid.getBoundingClientRect();
                const w = [...grid.children].find(k => {
                    if (k === ph) return false;
                    const l = g.left + k.offsetLeft, t = g.top + k.offsetTop;
                    return x >= l && x <= l + k.offsetWidth && y >= t && y <= t + k.offsetHeight;
                });
                if (w) {
                    const danach = ph.compareDocumentPosition(w) & Node.DOCUMENT_POSITION_FOLLOWING;
                    flip(grid, () => danach ? w.after(ph) : w.before(ph));
                    sperre = performance.now() + 260;
                } else if (!w) {
                    const letzt = grid.lastElementChild;
                    if (y > g.bottom - 10 && letzt !== ph) { flip(grid, () => grid.appendChild(ph)); sperre = performance.now() + 260; }
                }
            };
            const rollen = () => {
                const m = main.getBoundingClientRect(), rand = 80;
                let v = 0;
                if (y < m.top + rand) v = -Math.ceil((m.top + rand - y) / 5);
                else if (y > m.bottom - rand) v = Math.ceil((y - (m.bottom - rand)) / 5);
                if (v) { main.scrollTop += v; ziel(); }
                raf = requestAnimationFrame(rollen);
            };
            raf = requestAnimationFrame(rollen);
            const bewegen = ev => { x = ev.clientX; y = ev.clientY; setzen(); ziel(); };
            const ende = () => {
                document.removeEventListener('pointermove', bewegen);
                document.removeEventListener('pointerup', ende);
                document.removeEventListener('pointercancel', ende);
                if (ziehRaus) { ziehRaus(); ziehRaus = null; }
                cancelAnimationFrame(raf);
                const p = ph.getBoundingClientRect();
                const anim = el.animate([{ transform: el.style.transform }, { transform: `translate3d(${p.left - r.left}px,${p.top - r.top}px,0)` }],
                    { duration: 240, easing: 'cubic-bezier(.22,.9,.24,1)', fill: 'forwards' });
                fertig(anim, 240).then(() => {
                    if (!el.classList.contains('ck-drag')) return;
                    anim.cancel();
                    el.classList.remove('ck-drag');
                    ['width', 'height', 'left', 'top', 'transform'].forEach(k => { el.style[k] = ''; });
                    ph.replaceWith(el);
                    document.body.classList.remove('ck-ziehen');
                    ziehen = null;
                    sync();
                });
            };
            document.addEventListener('pointermove', bewegen);
            document.addEventListener('pointerup', ende);
            document.addEventListener('pointercancel', ende);
            const halt = ev => { if (ev.cancelable) ev.preventDefault(); };
            document.addEventListener('touchmove', halt, { passive: false });
            ziehRaus = () => document.removeEventListener('touchmove', halt);
            ziehen = ende;
        };

        root.addEventListener('pointerdown', e => {
            if (!bearbeiten || ziehen || e.button > 0) return;
            const el = e.target.closest('.ck-grid > .ck-w'); if (!el) return;
            const amGriff = !!e.target.closest('.ck-griff');
            if (e.target.closest('.ck-t') && !amGriff) return;
            if (e.pointerType === 'touch' && !amGriff) {
                const sx = e.clientX, sy = e.clientY;
                let letzt = e;
                el.classList.add('ck-halten');
                const t = setTimeout(() => { aus(); if (navigator.vibrate) navigator.vibrate(12); ziehStart(letzt, el); }, 400);
                const mv = ev => { letzt = ev; if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { clearTimeout(t); aus(); } };
                const aus = () => { el.classList.remove('ck-halten'); document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', stop); document.removeEventListener('pointercancel', stop); };
                const stop = () => { clearTimeout(t); aus(); };
                document.addEventListener('pointermove', mv); document.addEventListener('pointerup', stop); document.addEventListener('pointercancel', stop);
                return;
            }
            e.preventDefault();
            if (amGriff) { ziehStart(e, el); return; }
            const sx = e.clientX, sy = e.clientY;
            const mv = ev => { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 5) { weg(); ziehStart(ev, el); } };
            const weg = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', weg); };
            document.addEventListener('pointermove', mv); document.addEventListener('pointerup', weg);
        });

        root.addEventListener('click', e => {
            const ck = e.target.closest('[data-ck]');
            if (ck) {
                e.preventDefault();
                const a = ck.dataset.ck;
                if (a === 'bearbeiten') modus(true);
                else if (a === 'galerie') { galerieAuf = !galerieAuf; root.querySelector('.ck-bar').classList.toggle('auf', galerieAuf); }
                else if (a === 'fertig') modus(false);
                else if (a === 'standard') {
                    store.set(KEY, null); try { localStorage.removeItem(KEY); } catch (er) {}
                    L = laden();
                    flip(grid, () => {
                        const da = new Map([...grid.querySelectorAll('.ck-w')].map(el => [el.dataset.w, el]));
                        grid.replaceChildren(...L.order.map(id => {
                            let el = da.get(id);
                            if (!el) { const t = document.createElement('div'); t.innerHTML = widget(WID.get(id), L.size[id]); el = t.firstElementChild; aufbauen(el); }
                            el.dataset.size = L.size[id];
                            const k = el.querySelector('.ck-gr span'); if (k) k.textContent = L.size[id];
                            return el;
                        }));
                    });
                    speichern(); galerieNeu(); leerPruefen();
                    toast('Standard wiederhergestellt');
                }
                return;
            }
            const add = e.target.closest('[data-add]');
            if (add) { hinzu(add.dataset.add); return; }
            if (!bearbeiten) return;
            const t = e.target.closest('.ck-t');
            if (t) {
                const el = t.closest('.ck-w');
                if (t.dataset.t === 'vor') verschieben(el, -1);
                else if (t.dataset.t === 'zurueck') verschieben(el, 1);
                else if (t.dataset.t === 'groesse') groesse(el);
                else if (t.dataset.t === 'weg') ausblenden(el);
            }
            if (e.target.closest('.ck-grid')) { e.preventDefault(); e.stopPropagation(); }
        }, true);

        onKey = e => { if (e.key === 'Escape' && bearbeiten && !ziehen) modus(false); };
        document.addEventListener('keydown', onKey);

        const neuLive = () => {
            if (!root.isConnected) return;
            grid.querySelectorAll('.ck-w:not(.ck-drag)').forEach(el => {
                const w = WID.get(el.dataset.w);
                if (!w || !w.live) return;
                const alt = el.querySelector(':scope > .card'); if (!alt) return;
                const t = document.createElement('div'); t.innerHTML = inhalt(w);
                const neu = t.firstElementChild; if (!neu) return;
                alt.replaceWith(neu); icons(neu);
            });
        };
        onLive = neuLive; onWatch = neuLive;
        document.addEventListener('cb2:live', onLive);
        document.addEventListener('cb2:watch', onWatch);
        const neuFrische = () => { const el = root.querySelector('.ck-frische'); if (el) el.innerHTML = frischeGrid(); };
        timer = setInterval(neuFrische, 60000);
        onFocus = neuFrische; window.addEventListener('focus', onFocus);
    },
    destroy() {
        if (ziehen) try { ziehen(); } catch (e) {}
        document.body.classList.remove('ck-ziehen');
        document.querySelectorAll('body > .ck-drag').forEach(el => el.remove());
        if (onLive) { document.removeEventListener('cb2:live', onLive); onLive = null; }
        if (onWatch) { document.removeEventListener('cb2:watch', onWatch); onWatch = null; }
        if (onKey) { document.removeEventListener('keydown', onKey); onKey = null; }
        if (timer) { clearInterval(timer); timer = null; }
        if (onFocus) { window.removeEventListener('focus', onFocus); onFocus = null; }
    },
};
