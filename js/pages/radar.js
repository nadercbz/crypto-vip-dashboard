import { D, coin, store } from '../core/data.js';
import { esc, fNum, fPct, cls } from '../core/fmt.js';
import { card, pageHead, scoreBadge, scoreVar, sparkline, coinImg, pct, seg, chip, empty, hydrate } from '../core/ui.js';

let sort = 'score';
const SORT = {
    score: (a, b) => (b.score || 0) - (a.score || 0),
    momentum: (a, b) => ((b.parts || {}).momentum || 0) - ((a.parts || {}).momentum || 0),
    trend: (a, b) => ((b.parts || {}).trend || 0) - ((a.parts || {}).trend || 0),
    risiko: (a, b) => ((b.parts || {}).risiko || 0) - ((a.parts || {}).risiko || 0),
    rsi_low: (a, b) => (a.rsi == null ? 999 : a.rsi) - (b.rsi == null ? 999 : b.rsi),
    vol_trend: (a, b) => (b.vol_trend || -999) - (a.vol_trend || -999),
};

function tabelle(s) {
    const rows = s.coins.slice().sort(SORT[sort] || SORT.score).slice(0, 60);
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Coin</th><th>Score</th><th>30 Tage</th><th class="r">RSI</th><th class="r">Vola</th><th class="r">Beta</th><th>Trend</th><th class="r">7 Tage</th></tr></thead><tbody>
        ${rows.map((r, i) => {
            const t = r.above_ema200 && r.above_ema50 ? ['var(--up)', 'Aufwärts'] : r.above_ema50 ? ['var(--warn)', 'Erholung'] : r.above_ema200 ? ['var(--warn)', 'Korrektur'] : ['var(--down)', 'Abwärts'];
            const c = coin(r.symbol) || {};
            return `<tr data-coin="${esc(r.symbol.toUpperCase())}"><td class="dim mono">${i + 1}</td>
                <td><div class="row" style="gap:10px">${coinImg(c.image || r.image)}<b style="font-weight:500">${esc(r.name || r.symbol)}</b><span class="dim mono" style="font-size:.72rem">${esc(r.symbol.toUpperCase())}</span></div></td>
                <td>${scoreBadge(r.score)}</td><td>${sparkline(r.spark, 76, 22)}</td>
                <td class="r ${r.rsi >= 70 ? 'down' : r.rsi != null && r.rsi <= 32 ? 'up' : ''}">${fNum(r.rsi)}</td>
                <td class="r dim">${r.vol30 != null ? fNum(r.vol30) + '%' : '—'}</td><td class="r dim">${r.beta != null ? fNum(r.beta, 2) : '—'}</td>
                <td>${chip(t[1], t[0])}</td><td class="r">${pct(r.chg7)}</td></tr>`;
        }).join('')}</tbody></table></div>`;
}

/* ── VIP-Bereich ──
   Zeigt die Bausteine hinter jedem Score. Der Code wird nicht im Klartext
   hinterlegt, sondern nur seine Prüfsumme. Das hält neugierige Blicke im
   Quelltext ab, ist aber ausdrücklich kein Sicherheitsmerkmal: ohne Server
   lässt sich im Browser nichts wirklich schützen. */
const VIP_KEY = 'c2_vip_frei';
const VIP_HASH = 499389620;   // Prüfsumme des gültigen Codes
function pruefsumme(text) {
    let h = 0;
    const t = (text || '').trim().toLowerCase();
    for (let i = 0; i < t.length; i++) h = ((h << 5) - h + t.charCodeAt(i)) | 0;
    return h >>> 0;
}
const vipFrei = () => store.raw(VIP_KEY) === '1';
function vipSetzen(an) {
    try { an ? localStorage.setItem(VIP_KEY, '1') : localStorage.removeItem(VIP_KEY); } catch (e) {}
}
const teil = v => v == null ? '<span class="dim">—</span>' : `<span style="color:${scoreVar(v)}">${v.toFixed(0)}</span>`;
function vip(s, hinweis) {
    if (!vipFrei()) return `
        <h3 class="h2">Die fünf Bausteine hinter jedem Score</h3>
        <p class="sub" style="margin:8px 0 16px">Momentum, Trend, Risiko, Aufmerksamkeit und Substanz einzeln aufgeschlüsselt, dazu Korrelation, Volumen-Trend und Funding je Coin. Damit siehst du nicht nur was hoch bewertet ist, sondern warum.</p>
        <div class="row wrap" style="gap:12px">
            <div style="width:220px;max-width:100%"><input class="input" id="rdVipCode" type="text" placeholder="Zugangscode" autocomplete="off" spellcheck="false"></div>
            <button class="btn" id="rdVipGo">Freischalten</button>
            <span class="rd-hint ${hinweis ? 'down' : ''}" id="rdVipHint">${esc(hinweis || '')}</span>
        </div>`;
    const rows = s.coins || [];
    return `<div class="row between wrap" style="margin-bottom:14px"><span class="eyebrow">${rows.length} Coins mit allen Bausteinen</span>
            <button class="btn soft" id="rdVipLock">Sperren</button></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Coin</th><th>Score</th><th class="r">Momentum</th><th class="r">Trend</th>
            <th class="r">Risiko</th><th class="r">Buzz</th><th class="r">Substanz</th><th class="r">Korrelation</th><th class="r">Volumen</th><th class="r">Funding</th></tr></thead><tbody>
        ${rows.slice(0, 80).map(r => {
            const p = r.parts || {};
            const fund = r.funding != null ? r.funding * 100 : null;
            return `<tr data-coin="${esc(r.symbol.toUpperCase())}">
                <td><b style="font-weight:500">${esc(r.symbol.toUpperCase())}</b> <span class="dim">${esc((r.name || '').slice(0, 18))}</span></td>
                <td>${scoreBadge(r.score)}</td>
                <td class="r">${teil(p.momentum)}</td><td class="r">${teil(p.trend)}</td><td class="r">${teil(p.risiko)}</td>
                <td class="r">${teil(p.buzz)}</td><td class="r">${teil(p.substanz)}</td>
                <td class="r dim">${r.corr != null ? fNum(r.corr, 2) : '—'}</td>
                <td class="r ${cls(r.vol_trend)}">${r.vol_trend != null ? fPct(r.vol_trend, 0) : '—'}</td>
                <td class="r ${cls(fund)}">${fund != null ? fPct(fund, 3) : '—'}</td></tr>`;
        }).join('')}</tbody></table></div>`;
}

const RICHTUNG = { bullisch: 'var(--up)', 'bärisch': 'var(--down)', beobachten: 'var(--warn)' };

export default {
    styles: `
        .rd-div { padding: 16px 18px; border-left: 3px solid var(--c, var(--line)); }
        .rd-hint { font-size: .8rem; color: var(--ink-3); }
        .rd-hint.down { color: var(--down); }`,
    render(root, ctx) {
        const s = D.signals;
        const kopf = pageHead('Heute', 'Signal-Radar', 'Ein Gesamt-Score je Coin aus fünf Bausteinen: Momentum, Trend, Risiko, Aufmerksamkeit und Substanz. Darunter die Divergenzen, also die Fälle in denen zwei Signale auseinanderlaufen. Genau dort liegt die Chance, weil der Markt eine Seite noch nicht eingepreist hat.');
        root.classList.add('stack');
        if (!s || !s.coins || !s.coins.length) { root.innerHTML = kopf + card({ body: empty('Die Signal-Engine ist noch nicht gelaufen. Starte sie mit compute_signals.py oder über den Refresh-Knopf.') }); return; }
        const m = s.market || {};
        const k = [['Coins gerechnet', m.coins],
            ['Ø Signal-Score', m.avg_score != null ? m.avg_score.toFixed(0) : '—'],
            ['Ø RSI', m.avg_rsi != null ? m.avg_rsi.toFixed(0) : '—'],
            ['Ø Volatilität', m.avg_vol != null ? m.avg_vol.toFixed(0) + '%' : '—'],
            ['Über EMA 50', m.pct_above_ema50 != null ? m.pct_above_ema50 + '%' : '—'],
            ['Über EMA 200', m.pct_above_ema200 != null ? m.pct_above_ema200 + '%' : '—'],
            ['Golden Cross', m.pct_golden_cross != null ? m.pct_golden_cross + '%' : '—']];
        const d = s.divergences || [];
        root.innerHTML = kopf +
            `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px">${k.map(x => `<div class="card" style="padding:16px 18px"><div class="eyebrow">${x[0]}</div><div class="num" style="font-size:1.5rem;font-weight:300;margin-top:6px">${x[1] ?? '—'}</div></div>`).join('')}</div>` +
            card({ eyebrow: 'Rangliste · ' + s.coins.length + ' Coins', title: 'Die 60 stärksten Coins', right: seg('radar', [['score', 'Gesamt-Score'], ['momentum', 'Momentum'], ['trend', 'Trend'], ['risiko', 'Risiko'], ['rsi_low', 'RSI niedrig'], ['vol_trend', 'Volumen-Schub']], sort), body: `<div id="rdTab">${tabelle(s)}</div>` }) +
            card({ eyebrow: 'VIP Analyse', body: `<div id="rdVip">${vip(s)}</div>` }) +
            card({ eyebrow: 'Divergenzen', title: 'Wo Aufmerksamkeit, Substanz und Kurs nicht zusammenpassen', body: d.length
                ? `<div class="grid g-auto" style="gap:12px">${d.map(x => { const f = RICHTUNG[x.richtung] || 'var(--warn)'; return `<div class="card sunk click rd-div" style="--c:${f}" data-coin="${esc(x.symbol.toUpperCase())}">
                    <div class="row between"><b class="mono">${esc(x.symbol.toUpperCase())}</b>${chip(x.richtung, f)}</div>
                    <div class="eyebrow" style="margin:8px 0 6px">${esc(x.typ)}</div><div class="sub" style="margin:0;font-size:.84rem">${esc(x.text)}</div></div>`; }).join('')}</div>`
                : empty('Gerade laufen keine Signale auseinander. Das ist selbst eine Information: der Markt bewegt sich einheitlich.') });
        root.querySelector('[data-seg="radar"]').onclick = e => {
            const b = e.target.closest('button'); if (!b) return;
            sort = b.dataset.v; root.querySelectorAll('[data-seg="radar"] button').forEach(x => x.classList.toggle('on', x === b));
            const t = root.querySelector('#rdTab'); t.innerHTML = tabelle(s); hydrate(t);
        };
        const box = root.querySelector('#rdVip');
        const pruefen = () => {
            const feld = box.querySelector('#rdVipCode');
            const ok = pruefsumme(feld ? feld.value : '') === VIP_HASH;
            if (ok) { vipSetzen(true); box.innerHTML = vip(s); hydrate(box); }
            else { const h = box.querySelector('#rdVipHint'); if (h) { h.textContent = 'Der Code stimmt nicht.'; h.className = 'rd-hint down'; } }
        };
        box.onclick = e => {
            if (e.target.closest('#rdVipGo')) { pruefen(); return; }
            if (e.target.closest('#rdVipLock')) { vipSetzen(false); box.innerHTML = vip(s); hydrate(box); }
        };
        box.onkeydown = e => { if (e.key === 'Enter' && e.target && e.target.id === 'rdVipCode') { e.preventDefault(); pruefen(); } };
    },
};
