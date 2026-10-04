import { D, proxy } from '../core/data.js';
import { esc, fNum } from '../core/fmt.js';
import { card, pageHead, ring, empty, hydrate } from '../core/ui.js';

let FNG = null;        // { history: [{t, v}], current, quelle }
let BTC_HIST = null;   // [{t, p}]
let LOADING = false;
let lebt = false, wurzel = null, nachfassTimer = null;

const FNG_URL = 'https://api.alternative.me/fng/?limit=365';
const BTC_URL = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily';

function fngLabel(v) {
    if (v < 25) return 'Extreme Fear';
    if (v < 45) return 'Fear';
    if (v < 55) return 'Neutral';
    if (v < 75) return 'Greed';
    return 'Extreme Greed';
}
function fngColor(v) {
    return v < 25 ? 'var(--down)' : v < 45 ? 'color-mix(in srgb, var(--down) 55%, var(--warn))' : v < 55 ? 'var(--warn)'
        : v < 75 ? 'color-mix(in srgb, var(--up) 60%, var(--warn))' : 'var(--up)';
}

function ausExtras() {
    const h = (D.extras && D.extras.fng_history) || [];
    const raw = h.map(d => ({ t: Date.parse(d.date + 'T00:00:00Z'), v: +d.value })).filter(d => !isNaN(d.t) && !isNaN(d.v)).sort((a, b) => a.t - b.t);
    return raw.length ? { history: raw, current: raw[raw.length - 1].v, quelle: 'extras' } : null;
}

async function ladeBtc() {
    const j = await proxy(BTC_URL);
    if (j && Array.isArray(j.prices)) { BTC_HIST = j.prices.map(p => ({ t: p[0], p: p[1] })); return true; }
    return false;
}
async function laden() {
    if (LOADING) return;
    LOADING = true;
    const [fngRes] = await Promise.allSettled([
        FNG ? Promise.resolve(null) : proxy(FNG_URL).catch(() => fetch(FNG_URL).then(r => r.json())),
        BTC_HIST ? Promise.resolve(true) : ladeBtc(),
    ]);
    if (fngRes.status === 'fulfilled' && fngRes.value && fngRes.value.data) {
        const raw = fngRes.value.data.map(d => ({ t: +d.timestamp * 1000, v: +d.value })).sort((a, b) => a.t - b.t);
        if (raw.length) FNG = { history: raw, current: raw[raw.length - 1].v, quelle: 'live' };
    }
    LOADING = false;
    zeichne();
    if (!BTC_HIST) {
        clearTimeout(nachfassTimer);
        nachfassTimer = setTimeout(async () => { try { if (await ladeBtc()) zeichneHistorie(); } catch (e) {} }, 2500);
    }
}

const daten = () => FNG || ausExtras();

function regime(fng) {
    const db = D.coins, hist = D.history;
    const STABLE = new Set(['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usde', 'fdusd', 'usds', 'pyusd', 'usdd', 'gusd', 'frax', 'lusd', 'usdp']);
    const bySym = {};
    db.forEach(c => {
        const s = (c.symbol || '').toLowerCase();
        if (STABLE.has(s) || /usd$/.test(s)) return;
        const rank = c.market_cap_rank || 1e9;
        if (!bySym[s] || rank < (bySym[s].market_cap_rank || 1e9)) bySym[s] = c;
    });
    const coins = Object.values(bySym);

    const btc = db.find(c => c.id === 'bitcoin');
    const btc7 = btc ? (btc.price_change_percentage_7d_in_currency || 0) : 0;
    const top50 = coins.filter(c => (c.market_cap_rank || 1e9) <= 55 && c.id !== 'bitcoin' && c.price_change_percentage_7d_in_currency != null);
    const beating = top50.filter(c => c.price_change_percentage_7d_in_currency > btc7).length;
    const altPct = top50.length ? Math.round(beating / top50.length * 100) : null;

    const top100 = coins.filter(c => (c.market_cap_rank || 1e9) <= 100 && c.price_change_percentage_24h != null);
    const green = top100.filter(c => c.price_change_percentage_24h > 0).length;
    const breadth = top100.length ? Math.round(green / top100.length * 100) : null;

    let dom = null, domTrend = null;
    if (hist.length) {
        const last = hist[hist.length - 1];
        if (last && last.btc_dominance != null) dom = last.btc_dominance;
        const ref = [...hist].reverse().find(e => e.btc_dominance != null && e !== last && (last.date && e.date && last.date !== e.date));
        if (dom != null && ref && ref.btc_dominance != null) domTrend = dom - ref.btc_dominance;
    }

    let score = 0;
    if (breadth != null) { if (breadth > 60) score += 1; else if (breadth < 40) score -= 1; }
    if (fng != null) { if (fng >= 75) score -= 1; else if (fng <= 25) score += 1; } // Kontraindikator
    if (altPct != null) { if (altPct > 65) score += 1; else if (altPct < 30) score -= 1; }
    let verdict, vCol, vSub;
    if (score >= 2) { verdict = 'RISK-ON'; vCol = 'var(--up)'; vSub = 'Breite Stärke, Rotation läuft'; }
    else if (score <= -2) { verdict = 'RISK-OFF'; vCol = 'var(--down)'; vSub = 'Enger Markt, Vorsicht'; }
    else { verdict = 'NEUTRAL'; vCol = 'var(--warn)'; vSub = 'Gemischt, kein klares Signal'; }

    const altLabel = altPct == null ? '—' : altPct > 65 ? 'Altseason' : altPct < 30 ? 'BTC-Saison' : 'Neutral';
    const altCol = altPct == null ? 'var(--ink-3)' : altPct > 65 ? 'var(--a2)' : altPct < 30 ? 'var(--a4)' : 'var(--warn)';
    const brCol = breadth == null ? 'var(--ink-3)' : breadth > 60 ? 'var(--up)' : breadth < 40 ? 'var(--down)' : 'var(--warn)';
    const domTxt = dom == null ? '—' : fNum(dom, 1) + '%';
    const domSub = domTrend == null ? 'Trend baut sich auf'
        : (domTrend >= 0 ? '▲ +' : '▼ ') + fNum(domTrend, 1) + ' Pkt · ' + (domTrend >= 0 ? 'BTC zieht Kapital' : 'Kapital in Alts');
    const domCol = domTrend == null ? 'var(--ink-3)' : domTrend >= 0 ? 'var(--a4)' : 'var(--a2)';

    const zelle = (lbl, val, col, sub, extra = '') => `<div class="card sunk sm-rz ${extra}" style="--c:${col}">
        <div class="eyebrow">${lbl}</div><div class="sm-rv num">${val}</div><div class="sm-rs">${sub}</div></div>`;
    return zelle('Marktregime', `<span class="sm-dot"></span>${verdict}`, vCol, vSub, 'sm-urteil') +
        zelle('Altseason-Proxy', altPct == null ? '—' : altPct + '%', altCol, altLabel + ' · schlagen BTC/7T') +
        zelle('Breadth 24h', breadth == null ? '—' : breadth + '%', brCol, 'grüne Top-100') +
        zelle('BTC-Dominanz', domTxt, domCol, domSub);
}

function anzeige(cur, d) {
    if (cur == null) return empty(LOADING ? 'Lädt …' : 'Kein Stimmungswert verfügbar.');
    let meta = '';
    if (d && d.history.length) {
        const h = d.history;
        const wAgo = h.find(x => x.t >= h[h.length - 1].t - 7 * 864e5);
        const mAgo = h.find(x => x.t >= h[h.length - 1].t - 30 * 864e5);
        meta = `Jetzt ${cur} · vor 7T ${wAgo ? wAgo.v : '?'} · vor 30T ${mAgo ? mAgo.v : '?'}`;
    }
    return `<div class="sm-gauge">
        ${ring(cur, 'von 100', 230)}
        <div class="sm-gr">
            <div class="h1 sm-label" style="color:${fngColor(cur)}">${fngLabel(cur)}</div>
            <div class="sm-skala"><div class="sm-bahn"></div><div class="sm-nadel" style="left:${Math.max(0, Math.min(100, cur))}%"></div></div>
            <div class="sm-stufen"><span>Extreme Fear</span><span>Fear</span><span>Neutral</span><span>Greed</span><span>Extreme Greed</span></div>
            <div class="eyebrow sm-meta">${esc(meta)}</div>
        </div></div>`;
}

function historie(d) {
    if (!d || !d.history.length) return { svg: '', ex: '', tage: 0 };
    const W = 1000, H = 220, pad = 6, h = d.history;
    const t0 = h[0].t, t1 = h[h.length - 1].t, span = Math.max(1, t1 - t0);
    const x = t => pad + ((t - t0) / span) * (W - 2 * pad);
    const yF = v => pad + (1 - v / 100) * (H - 2 * pad);

    let bands = '';
    [[0, 25, 'sm-zf'], [75, 100, 'sm-zg']].forEach(([lo, hi, k]) => {
        bands += `<rect class="${k}" x="0" y="${yF(hi)}" width="${W}" height="${yF(lo) - yF(hi)}"/>`;
    });
    const fngLine = `<polyline class="sm-lf" points="${h.map(p => `${x(p.t).toFixed(1)},${yF(p.v).toFixed(1)}`).join(' ')}"/>`;

    let btcLine = '';
    if (BTC_HIST && BTC_HIST.length) {
        const inRange = BTC_HIST.filter(p => p.t >= t0 - 864e5);
        if (inRange.length) {
            const ps = inRange.map(p => p.p);
            const mn = Math.min(...ps), mx = Math.max(...ps), r = Math.max(1e-9, mx - mn);
            const yB = p => pad + (1 - (p - mn) / r) * (H - 2 * pad);
            btcLine = `<polyline class="sm-lb" points="${inRange.map(p => `${x(p.t).toFixed(1)},${yB(p.p).toFixed(1)}`).join(' ')}"/>`;
        }
    }
    const low = [...h].sort((a, b) => a.v - b.v).slice(0, 3);
    const ex = `<span class="sm-exl">Tiefste Angst (historische Böden-Signale):</span>` + low.map(p =>
        `<span class="chip" style="--c:var(--down)">${p.v} · ${esc(new Date(p.t).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' }))}</span>`).join('');
    return { svg: bands + btcLine + fngLine, ex, tage: Math.round(span / 864e5) + 1 };
}

function zeichneHistorie() {
    if (!lebt || !wurzel || !wurzel.isConnected) return;
    const d = daten(), r = historie(d);
    const svg = wurzel.querySelector('#smSvg'), ex = wurzel.querySelector('#smEx'), ttl = wurzel.querySelector('#smHistTitel');
    if (!svg) return;
    if (!r.svg) { wurzel.querySelector('#smChart').innerHTML = empty(LOADING ? 'Lädt …' : 'Keine Historie verfügbar.'); return; }
    svg.innerHTML = r.svg; ex.innerHTML = r.ex;
    ttl.textContent = d.quelle === 'live' ? 'Historie · 1 Jahr' : 'Historie · ' + r.tage + ' Tage';
}
function zeichne() {
    if (!lebt || !wurzel || !wurzel.isConnected) return;
    const d = daten(), cur = d && d.current != null ? d.current : null;
    const g = wurzel.querySelector('#smGauge');
    g.innerHTML = anzeige(cur, d); hydrate(g);
    wurzel.querySelector('#smRegime').innerHTML = regime(cur);
    zeichneHistorie();
}

export default {
    styles: `
        .sm-regime { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 12px; }
        .sm-rz { padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
        .sm-urteil { background: color-mix(in srgb, var(--c) 9%, var(--bg)); outline: 1px solid color-mix(in srgb, var(--c) 40%, transparent); outline-offset: -1px; }
        .sm-rv { font-size: 1.55rem; font-weight: 400; line-height: 1.05; letter-spacing: -.02em; color: var(--c); }
        .sm-rs { font-size: .72rem; color: var(--ink-3); }
        .sm-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 8px; vertical-align: middle; background: var(--c); box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 18%, transparent); }
        .sm-gauge { display: flex; align-items: center; gap: 44px; flex-wrap: wrap; padding: 14px 8px 6px; }
        .sm-gr { flex: 1; min-width: 260px; }
        .sm-label { font-size: 2.1rem; transition: color .4s var(--ease); }
        .sm-skala { position: relative; height: 12px; margin-top: 22px; }
        .sm-bahn { position: absolute; inset: 0; border-radius: 99px; background: linear-gradient(90deg, var(--down), var(--warn) 50%, var(--up)); opacity: .85; }
        .sm-nadel { position: absolute; top: 50%; width: 22px; height: 22px; border-radius: 50%; background: var(--raised); box-shadow: var(--sh-sm); border: 3px solid var(--ink); transform: translate(-50%, -50%); transition: left 1s var(--ease); }
        .sm-stufen { display: flex; justify-content: space-between; gap: 6px; margin-top: 12px; font-family: var(--mono); font-size: .58rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
        .sm-meta { margin-top: 18px; letter-spacing: .08em; }
        .sm-chart { width: 100%; height: 220px; position: relative; }
        .sm-chart svg { width: 100%; height: 100%; display: block; }
        .sm-chart polyline { fill: none; vector-effect: non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; }
        .sm-lf { stroke: var(--pg); stroke-width: 2; }
        .sm-lb { stroke: var(--ink-3); stroke-width: 1.6; opacity: .75; }
        .sm-zf { fill: color-mix(in srgb, var(--down) 10%, transparent); }
        .sm-zg { fill: color-mix(in srgb, var(--up) 8%, transparent); }
        .sm-leg { display: flex; gap: 16px; font-family: var(--mono); font-size: .62rem; letter-spacing: .08em; color: var(--ink-3); }
        .sm-leg i { display: inline-block; width: 16px; height: 3px; border-radius: 3px; margin-right: 6px; vertical-align: middle; background: var(--c); }
        .sm-ex { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 16px; }
        .sm-exl { font-size: .72rem; color: var(--ink-3); }
        @media (max-width: 1180px) { .sm-regime { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 860px) { .sm-gauge { justify-content: center; gap: 24px; } .sm-label { font-size: 1.7rem; text-align: center; }
            .sm-stufen span:nth-child(even) { display: none; } .sm-meta { text-align: center; } }`,
    render(root) {
        lebt = true; wurzel = root;
        root.classList.add('stack');
        root.innerHTML = pageHead('Markt', 'Marktstimmung',
            'Fear and Greed Index. Die Stimmung ist ein Kontraindikator. Extreme Fear = Chance, Extreme Greed = Vorsicht.') +
            `<div class="sm-regime" id="smRegime"></div>` +
            card({ eyebrow: 'Fear and Greed Index', cls: 'tint', body: `<div id="smGauge"></div>` }) +
            card({ body: `<div class="row between wrap" style="margin-bottom:12px"><div class="eyebrow" id="smHistTitel">Historie · 1 Jahr</div>
                <div class="sm-leg"><span><i style="--c:var(--pg)"></i>Fear and Greed</span><span><i style="--c:var(--ink-3)"></i>Bitcoin</span></div></div>
                <div class="sm-chart" id="smChart"><svg id="smSvg" viewBox="0 0 1000 220" preserveAspectRatio="none"></svg></div>
                <div class="sm-ex" id="smEx"></div>` });
        zeichne();
        if (!FNG || !BTC_HIST) laden().catch(() => { LOADING = false; });
    },
    destroy() { lebt = false; wurzel = null; clearTimeout(nachfassTimer); },
};
