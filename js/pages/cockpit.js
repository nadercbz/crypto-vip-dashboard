import { D, coin, watch } from '../core/data.js';
import { esc, fBig, fPct, fUsd, cls, ago } from '../core/fmt.js';
import { card, pageHead, ring, bar, scoreVar, scoreBadge, sparkline, dotChart, coinRow, pct, empty, icon, chip } from '../core/ui.js';

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

function kacheln() {
    const mk = (D.series && D.series.market) || [], last = mk[mk.length - 1] || {}, first = mk[0] || {};
    const reihe = k => mk.map(r => r[k]).filter(v => v != null);
    const chg = k => (last[k] != null && first[k]) ? (last[k] / first[k] - 1) * 100 : null;
    const t = (label, wert, k, einheit) => card({ cls: 'stat', body: `
        <div class="eyebrow">${label}</div><div class="big num v">${wert}</div>
        <div class="foot">${einheit === 'pkt' ? (last[k] != null && first[k] != null ? `<span class="${cls(last[k] - first[k])} num">${last[k] - first[k] > 0 ? '+' : ''}${(last[k] - first[k]).toFixed(1).replace('.', ',')}</span>` : '') : pct(chg(k))}<span>seit ${mk.length} Tagen</span></div>
        ${dotChart(reihe(k))}` });
    const kach = [
        t('Gesamtmarkt', fBig(last.total_mcap), 'total_mcap'),
        t('Bitcoin-Anteil', last.btc_dominance != null ? last.btc_dominance.toFixed(1).replace('.', ',') + '%' : '—', 'btc_dominance', 'pkt'),
        t('Stablecoins', fBig(last.stablecoin_mcap), 'stablecoin_mcap'),
    ];
    return `<div class="grid g${kach.length}">${kach.join('')}</div>`;
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

const meineZeilen = () => {
    const list = watch.list();
    return list.length ? `<div class="list">${list.slice(0, 10).map(sym => {
        const c = coin(sym);
        return c ? coinRow(sym, c.name, c.image, sym + ' · ' + fUsd(c.current_price), pct(c.price_change_percentage_24h))
                 : coinRow(sym, sym, '', 'nicht in den Daten', '—');
    }).join('')}</div>` : empty('Noch keine Coins markiert. Setz in "Alle Kurse" einen Stern, dann erscheinen sie hier.');
};
function meineListe() {
    return card({ eyebrow: 'Deine Watchlist', right: `<a class="chip" data-go="watchlist" style="cursor:pointer">Alle</a>`, body: `<div id="ckWatch">${meineZeilen()}</div>` });
}

function news() {
    const n = (D.onchain && D.onchain.news) || [];
    return card({ eyebrow: 'Schlagzeilen', right: `<a class="chip" data-go="onchain" style="cursor:pointer">Mehr</a>`,
        body: n.length ? `<div class="grid g3" style="gap:12px">${n.slice(0, 6).map(x =>
            `<a class="card sunk click" style="padding:16px 18px" href="${esc(x.link)}" target="_blank" rel="noopener">
                <div class="eyebrow">${esc(x.source)}${x.ts ? ' · ' + ago(x.ts) : ''}</div>
                <div style="margin-top:8px;font-size:.92rem;line-height:1.4">${esc(x.title)}</div></a>`).join('')}</div>` : empty('Keine Nachrichten geladen.') });
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
        <div class="grid g-auto" style="gap:10px" id="ckFrische">${frischeGrid()}</div>
        ${steps.some(x => !x.ok) ? `<div class="eyebrow" style="margin:18px 0 8px">Fehlgeschlagen</div>` + steps.filter(x => !x.ok).map(x => `<div class="sub down">${esc(x.name)}: ${esc(x.note || x.script)}</div>`).join('') : ''}` });
}

let onLive = null, timer = null, onFocus = null;

export default {
    styles: `
        .ck-top { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 22px; }
        .ck-ampel { display: flex; align-items: center; gap: 34px; flex-wrap: wrap; padding: 8px 6px; }
        .ck-brief { max-height: 372px; overflow-y: auto; padding-right: 8px; }
        .ck-brief h4 { font-family: var(--mono); font-size: .64rem; letter-spacing: .18em; text-transform: uppercase; color: var(--pg); margin: 16px 0 6px; font-weight: 500; }
        .ck-brief h4:first-child { margin-top: 0; }
        .ck-brief p { margin: 0 0 7px; font-size: .9rem; color: var(--ink-2); font-weight: 300; }
        .ck-fr.voll { outline: 1px solid color-mix(in srgb, var(--warn) 30%, transparent); }
        .ck-voll { font-family: var(--mono); font-size: .6rem; letter-spacing: .08em; color: var(--warn); margin-top: 2px; }
        @media (max-width: 1180px) { .ck-top { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 860px) { .ck-ampel { justify-content: center; gap: 22px; } }`,
    render(root) {
        const h = new Date().getHours();
        const gruss = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
        root.innerHTML = pageHead('Cockpit', window.CB2_PUBLIC ? gruss : gruss + ', Nader', 'Der Markt in einem Blick. Ampel, Briefing, die stärksten Signale und was sich in deinen Coins tut.') +
            `<div class="ck-top">${ampel()}${briefing()}</div>` + kacheln() +
            `<div class="grid g3">${signale()}${sektoren()}${meineListe()}</div>` + news() + frische();
        root.classList.add('stack');
        onLive = () => { const el = root.querySelector('#ckWatch'); if (el && root.isConnected) el.innerHTML = meineZeilen(); };
        document.addEventListener('cb2:live', onLive);
        const neuFrische = () => { const el = root.querySelector('#ckFrische'); if (el) el.innerHTML = frischeGrid(); };
        timer = setInterval(neuFrische, 60000);
        onFocus = neuFrische; window.addEventListener('focus', onFocus);
    },
    destroy() {
        if (onLive) { document.removeEventListener('cb2:live', onLive); onLive = null; }
        if (timer) { clearInterval(timer); timer = null; }
        if (onFocus) { window.removeEventListener('focus', onFocus); onFocus = null; }
    },
};
