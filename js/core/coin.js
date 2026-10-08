import { D, coin, signal, watch, store, proxy } from './data.js?v=202610082050';
import { esc, fUsd, fBig, fPct, fNum, cls } from './fmt.js?v=202610082050';
import { icon, icons, scoreBadge, seg, bar, scoreVar, hydrate } from './ui.js?v=202610082050';
import { zeichner, WERKZEUGE } from './zeichnen.js?v=202610082050';
import { berechneTA, mystik } from './auto_ta.js?v=202610082050';

const NOTE = 'c2_watch_notes';
const NA = fNum(null);
const $ = id => document.getElementById(id);
const el = () => $('drawer');
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const upper = s => String(s || '').toUpperCase();

/* ── Zeiträume, 1 zu 1 aus dem alten Panel ──
   ALL: Binance deckelt bei 1000 Kerzen, 1000 Wochen sind rund 19 Jahre. Das ist
   ohne Bezahl-Key das Maximum an echter Historie (CoinGecko days=max ist tot). */
const TF = {
    '1h': { interval: '1h', limit: 336 },
    '4h': { interval: '4h', limit: 360 },
    '1d': { interval: '1d', limit: 365 },
    '1w': { interval: '1w', limit: 260 },
    'all': { interval: '1w', limit: 1000 },
};
const TF_LABEL = [['1h', '1H'], ['4h', '4H'], ['1d', '1D'], ['1w', '1W'], ['all', 'ALL']];
const CMP_VARS = ['--a4', '--a1', '--a2'];
const CMP_DAYS = [[7, '7T'], [30, '30T'], [90, '90T'], [365, '1J']];

/* ── Zustand ── */
let current = null;                 // Symbol des offenen Coins, groß
let curTf = '1d', showEma = false, showVol = true;
let taAn = store.get('cb2_ta_an', true) !== false, mystAn = store.get('cb2_ta_mystik', true) !== false;
let chart = null, chartRO = null, mainSer = null, mainKind = '', areaVar = '';
let volSer = null, volKey = '', emaSers = [];
let loadSeq = 0, shownPrice = null, liveTimer = null;
const klineCache = {}, klineVol = {}, geckoCache = {}, dailyCache = {};
let cmpSyms = [], cmpDays = 30, cmpChart = null, cmpRO = null, cmpSers = [], cmpSeq = 0;
let zoomPh = null, zoomBd = null;
let zc = null, zcMagnet = true, zcAus = false;     // Zeichenwerkzeuge, siehe zeichnen.js

/* ── Eigenes CSS, einmalig ── */
const STYLE = `
.cd-head { display: flex; align-items: center; gap: 14px; }
.cd-head .coin-img { width: 46px; height: 46px; flex: none; }
.cd-title { min-width: 0; flex: 1; }
.cd-name { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.cd-sym { font-family: var(--mono); font-size: .7rem; letter-spacing: .12em; color: var(--ink-3); }
.cd-rank { font-family: var(--mono); font-size: .62rem; color: var(--ink-2); padding: 2px 9px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); }
.cd-cats { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 7px; }
.cd-cat { font-family: var(--mono); font-size: .56rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-2); padding: 3px 9px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--pg) 13%, transparent); }
.cd-btns { display: flex; gap: 8px; flex: none; }
.cd-btns .ibtn.on { color: var(--warn); }
.cd-btns .ibtn.on svg { fill: currentColor; }
.cd-pricerow { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin: 24px 0 12px; }
.cd-price { transition: color .5s var(--ease); }
.cd-price.cd-tick-up { color: var(--up); transition: none; }
.cd-price.cd-tick-down { color: var(--down); transition: none; }
.cd-live { display: inline-flex; align-items: center; gap: 6px; margin-left: 12px; font-family: var(--mono); font-size: .58rem; letter-spacing: .2em; color: var(--ink-3); vertical-align: middle; }
.cd-live i { width: 7px; height: 7px; border-radius: 50%; background: var(--up); box-shadow: 0 0 0 0 color-mix(in srgb, var(--up) 60%, transparent); animation: cdPulse 1.8s var(--ease) infinite; }
.cd-live.off { opacity: .45; } .cd-live.off i { background: var(--ink-3); animation: none; }
@keyframes cdPulse { to { box-shadow: 0 0 0 8px color-mix(in srgb, var(--up) 0%, transparent); } }
.cd-badges { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 18px; }
.cd-badge { font-family: var(--mono); font-size: .66rem; letter-spacing: .04em; padding: 5px 11px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); color: var(--ink-3); }
.cd-badge b { font-weight: 600; margin-left: 6px; color: var(--ink-2); }
.cd-badge b.up { color: var(--up); } .cd-badge b.down { color: var(--down); }
.cd-wrap { border-radius: var(--r-lg); background: var(--bg); box-shadow: var(--sh-in); overflow: hidden; }
.cd-tabs { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 9px 10px 4px; }
.cd-tabs .seg { box-shadow: none; background: transparent; padding: 0; }
.cd-tabs .seg button { padding: 5px 10px; }
.cd-tog { font-family: var(--mono); font-size: .62rem; letter-spacing: .12em; padding: 5px 10px; border-radius: var(--r-pill); color: var(--ink-3); border: 1px solid var(--line); opacity: .7; transition: all .25s var(--ease); display: inline-flex; align-items: center; }
.cd-tog:hover { color: var(--ink); opacity: 1; }
.cd-tog.on { opacity: 1; color: var(--ink); background: var(--surface); box-shadow: var(--sh-sm); border-color: transparent; }
.cd-tog svg { width: 13px; height: 13px; }
.cd-zo { display: none; } .cd-wrap.zoom .cd-zo { display: inline-flex; } .cd-wrap.zoom .cd-zi { display: none; }
.cd-zi, .cd-zo { display: inline-flex; }
.cd-wrap:not(.zoom) .cd-zo { display: none; }
.cd-note { margin-left: auto; font-family: var(--mono); font-size: .58rem; letter-spacing: .05em; color: var(--ink-3); text-align: right; }
.cd-note:empty { display: none; }
.cd-body { position: relative; }
.cd-chart { height: clamp(300px, 40vh, 460px); position: relative; cursor: zoom-in; padding: 0 4px 4px; overflow: hidden; }
.cd-tools { display: none; }
.cd-tb { width: 36px; height: 36px; flex: none; border-radius: 12px; display: grid; place-items: center; color: var(--ink-3); transition: color .2s, background .2s, box-shadow .2s, transform .2s var(--ease-spring); }
.cd-tb svg { width: 17px; height: 17px; }
.cd-tb:hover { color: var(--ink); background: var(--bg); }
.cd-tb:active { transform: scale(.92); }
.cd-tb.on { color: var(--a2); background: var(--bg); box-shadow: var(--sh-in); }
.cd-tb.weg:hover { color: var(--down); }
.cd-tb[disabled] { opacity: .3; pointer-events: none; }
.cd-tsep { flex: none; height: 1px; background: var(--line); margin: 4px 6px; }
.zc-svg { position: absolute; z-index: 3; pointer-events: none; overflow: hidden; }
.zc-svg.aktiv { pointer-events: all; cursor: crosshair; touch-action: none; }
.zc-svg.hand, .zc-svg.hand * { pointer-events: none !important; }
.cd-chart.hand, .cd-chart.hand * { cursor: grab !important; }
.cd-chart.hand.greift, .cd-chart.hand.greift * { cursor: grabbing !important; }
.zc-hit { stroke: transparent; stroke-width: 14; fill: none; pointer-events: stroke; cursor: move; }
.zc-hitf { pointer-events: all; cursor: move; }
.zc-h { fill: var(--surface); stroke-width: 2; pointer-events: all; cursor: grab; }
.zc-t { font-family: var(--mono); font-size: 10px; pointer-events: none; paint-order: stroke; stroke: var(--surface); stroke-width: 3px; stroke-linejoin: round; }
.zc-tf { font-weight: 600; letter-spacing: .02em; }
.zc-svg.aktiv .zc-hit, .zc-svg.aktiv .zc-hitf, .zc-svg.aktiv .zc-h { cursor: crosshair; }
.cd-chart .skel { height: 100%; }
.cd-msg { display: grid; place-content: center; justify-items: center; gap: 12px; height: 100%; padding: 20px; text-align: center; color: var(--ink-3); font-size: .8rem; }
.cd-msg::before { content: ''; width: 30px; height: 30px; border-radius: 50%; border: 1.5px dashed color-mix(in srgb, var(--ink-3) 55%, transparent); }
.cd-backdrop { position: fixed; inset: 0; z-index: 96; background: color-mix(in srgb, var(--bg) 78%, transparent); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); animation: cdFade .2s var(--ease) both; }
@keyframes cdFade { from { opacity: 0; } }
.cd-wrap.zoom { position: fixed; inset: 3vh 3vw; z-index: 97; margin: 0; background: var(--surface); box-shadow: var(--sh-float); border-radius: var(--r-xl); display: flex; flex-direction: column; animation: cdZoom .25s var(--ease) both; }
@keyframes cdZoom { from { opacity: 0; transform: scale(.985); } }
.cd-wrap.zoom .cd-tabs { padding: 16px 18px 8px; }
/* min-height: 0, sonst wächst der Chart im Flex-Rahmen mit seinem eigenen Inhalt mit */
.cd-wrap.zoom .cd-body { flex: 1; min-height: 0; display: flex; }
.cd-wrap.zoom .cd-tools { display: flex; flex-direction: column; gap: 4px; padding: 2px 4px 10px 12px; overflow-y: auto; }
.cd-wrap.zoom .cd-chart { flex: 1; min-width: 0; min-height: 0; height: auto; cursor: default; padding: 0 10px 10px; }
.cd-wrap.zoom .cd-note { font-size: .68rem; }
.cd-sec { margin: 24px 0 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.cd-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
.cd-stat { background: var(--bg); box-shadow: var(--sh-in); border-radius: var(--r-md); padding: 12px 14px; min-width: 0; }
.cd-stat .k { font-family: var(--mono); font-size: .56rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); }
.cd-stat .v { font-family: var(--mono); font-size: .9rem; margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cd-stat .v.up { color: var(--up); } .cd-stat .v.down { color: var(--down); }
.cd-stat .s { font-size: .66rem; color: var(--ink-3); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cd-stat .cd-bar { height: 4px; border-radius: 4px; background: var(--sunk); margin-top: 9px; overflow: hidden; }
.cd-stat .cd-bar i { display: block; height: 100%; border-radius: 4px; background: var(--grad); }
.cd-deriv { display: none; } .cd-deriv.on { display: block; }
.cd-deriv .cd-stats { margin-top: 0; }
.cd-compare { display: none; } .cd-compare.on { display: block; }
.cd-hint { font-family: var(--font); text-transform: none; letter-spacing: 0; color: var(--ink-3); font-size: .74rem; margin-left: 6px; }
.cd-cmprow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.cd-cmprow .input { width: auto; flex: 1; min-width: 150px; padding: 8px 14px; font-size: .8rem; }
.cd-cchips { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 10px; }
.cd-cchip { display: inline-flex; align-items: center; gap: 7px; font-family: var(--mono); font-size: .66rem; padding: 4px 6px 4px 11px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); }
.cd-cchip i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.cd-cchip button { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; color: var(--ink-3); }
.cd-cchip button:hover { color: var(--ink); } .cd-cchip svg { width: 11px; height: 11px; }
.cd-cmpchart { height: 190px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); padding: 4px; }
.cd-links { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
@media (max-width: 860px) {
    .cd-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cd-chart { height: clamp(260px, 38vh, 380px); }
    .cd-wrap.zoom { inset: 10px; }
    .cd-wrap.zoom .cd-body { flex-direction: column; }
    .cd-wrap.zoom .cd-tools { flex-direction: row; overflow-x: auto; overflow-y: hidden; padding: 0 10px 6px; scrollbar-width: none; }
    .cd-wrap.zoom .cd-tsep { width: 1px; height: auto; margin: 6px 4px; }
    .cd-tabs .seg button, .cd-tog { padding-left: 8px; padding-right: 8px; }
}`;
function ensureStyle() {
    if ($('cdStyle')) return;
    const s = document.createElement('style');
    s.id = 'cdStyle'; s.textContent = STYLE;
    document.head.appendChild(s);
}

/* ── Farben für Canvas-Charts, immer frisch aus den CSS-Variablen ── */
function alpha(col, a) {
    let m = /^#([0-9a-f]{6})$/i.exec(col);
    if (!m) { const k = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(col); if (k) m = [0, k[1] + k[1] + k[2] + k[2] + k[3] + k[3]]; }
    if (!m) return col;
    const n = parseInt(m[1], 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
function pal() {
    return { up: css('--up'), down: css('--down'), ink3: css('--ink-3'), line: css('--line'), btn: css('--btn'), mono: css('--mono') || 'monospace' };
}
const chartOpts = p => ({
    layout: { background: { color: 'transparent' }, textColor: p.ink3, fontFamily: p.mono, fontSize: 10 },
    grid: { vertLines: { color: p.line }, horzLines: { color: p.line } },
    rightPriceScale: { borderColor: p.line },
    timeScale: { borderColor: p.line, timeVisible: true },
    crosshair: { mode: 0, horzLine: { labelBackgroundColor: p.btn }, vertLine: { labelBackgroundColor: p.btn } },
});
const candleOpts = p => ({ upColor: p.up, downColor: p.down, wickUpColor: p.up, wickDownColor: p.down, borderVisible: false });
const areaOpts = col => ({ lineColor: col, topColor: alpha(col, .25), bottomColor: alpha(col, 0), lineWidth: 2 });
const volData = (key, p) => (klineVol[key] || []).map(v => ({ time: v.time, value: v.value, color: alpha(v.up ? p.up : p.down, .3) }));
function priceFmt(p) {
    const a = Math.abs(p || 0);
    const d = a >= 100 ? 2 : a >= 1 ? 4 : a >= 0.01 ? 6 : 8;
    return { type: 'price', precision: d, minMove: 1 / Math.pow(10, d) };
}
function repaint() {
    const p = pal();
    if (chart) {
        chart.applyOptions(chartOpts(p));
        if (mainSer) mainSer.applyOptions(mainKind === 'candle' ? candleOpts(p) : areaOpts(css(areaVar)));
        if (volSer && volKey) volSer.setData(volData(volKey, p));
        emaSers.forEach(e => e.ser.applyOptions({ color: css(e.v) }));
    }
    if (cmpChart) {
        cmpChart.applyOptions(chartOpts(p));
        cmpSers.forEach(e => e.ser.applyOptions({ color: css(e.v) }));
    }
}

/* ── Daten holen ── */
async function fetchKlines(pair, tf) {
    const key = pair + '_' + tf;
    if (klineCache[key]) return key;
    const cfg = TF[tf];
    const res = await fetch('https://api.binance.com/api/v3/klines?symbol=' + encodeURIComponent(pair) + '&interval=' + cfg.interval + '&limit=' + cfg.limit);
    const raw = await res.json();
    if (!Array.isArray(raw) || !raw.length) throw new Error('klines');
    klineCache[key] = raw.map(k => ({ time: Math.floor(k[0] / 1000), open: +k[1], high: +k[2], low: +k[3], close: +k[4] }));
    klineVol[key] = raw.map(k => ({ time: Math.floor(k[0] / 1000), value: +k[7], up: +k[4] >= +k[1] }));
    return key;
}
function dayPoints(rows) {
    const out = [];
    rows.forEach(([t, v]) => {
        if (v == null || !isFinite(v)) return;
        const time = Math.floor(t / 86400000) * 86400;
        if (out.length && out[out.length - 1].time === time) out[out.length - 1].value = v;
        else if (!out.length || time > out[out.length - 1].time) out.push({ time, value: v });
    });
    return out;
}
function geckoDaily(c) {
    if (!c || !c.id) return Promise.resolve(null);
    if (!geckoCache[c.id]) {
        geckoCache[c.id] = proxy('https://api.coingecko.com/api/v3/coins/' + encodeURIComponent(c.id) + '/market_chart?vs_currency=usd&days=365&interval=daily')
            .then(d => (d && Array.isArray(d.prices) && d.prices.length) ? dayPoints(d.prices) : null)
            .catch(() => null)
            .then(r => { if (!r || r.length < 2) { delete geckoCache[c.id]; return null; } return r; });
    }
    return geckoCache[c.id];
}
async function dailySeries(c, days) {
    const key = (c.symbol || '').toLowerCase() + '|' + days;
    if (dailyCache[key]) return dailyCache[key];
    try {
        if (c.binance) {
            const res = await fetch('https://api.binance.com/api/v3/klines?symbol=' + encodeURIComponent(c.binance) + '&interval=1d&limit=' + days);
            const raw = await res.json();
            if (Array.isArray(raw) && raw.length > 1) return (dailyCache[key] = dayPoints(raw.map(k => [k[0], +k[4]])));
        }
    } catch (e) {}
    const g = await geckoDaily(c);
    if (g && g.length > 1) return (dailyCache[key] = g.slice(-days));
    return null;
}

/* ── Kopf: Wertänderungen ── */
function renderBadges(c) {
    const box = $('cdBadges');
    if (!box) return;
    box.innerHTML = [['24h', c.price_change_percentage_24h], ['7T', c.price_change_percentage_7d_in_currency],
        ['30T', c.price_change_percentage_30d], ['1J', c.price_change_percentage_1y]]
        .map(([l, v]) => `<span class="cd-badge">${l}<b class="${!v ? '' : v >= 0 ? 'up' : 'down'}">${v == null || v === 0 ? NA : fPct(v, 2)}</b></span>`).join('');
}
async function ensureLongChanges(c) {
    if (c.price_change_percentage_30d && c.price_change_percentage_1y) return;
    const S = upper(c.symbol);
    try {
        let closes = null;
        if (c.binance) { try { closes = klineCache[await fetchKlines(c.binance, '1d')].map(k => k.close); } catch (e) {} }
        if (!closes) { const g = await geckoDaily(c); closes = g ? g.map(x => x.value) : null; }
        if (!closes || !closes.length) return;
        const last = closes[closes.length - 1];
        if (!c.price_change_percentage_30d && closes.length > 31) c.price_change_percentage_30d = (last / closes[closes.length - 31] - 1) * 100;
        if (!c.price_change_percentage_1y && closes.length >= 360) c.price_change_percentage_1y = (last / closes[0] - 1) * 100;
        if (current === S) renderBadges(c);
    } catch (e) {}
}

/* ── Live-Kurs ── */
function patchPrice(c) {
    const e = $('cdPrice'), p = c && c.current_price;
    if (!e || p == null || !isFinite(p)) return;
    const txt = fUsd(p);
    if (e.textContent === txt) { shownPrice = p; return; }
    const up = shownPrice == null || p >= shownPrice;
    shownPrice = p;
    e.textContent = txt;
    e.classList.remove('cd-tick-up', 'cd-tick-down');
    void e.offsetWidth;
    e.classList.add(up ? 'cd-tick-up' : 'cd-tick-down');
    setTimeout(() => e.classList.remove('cd-tick-up', 'cd-tick-down'), 900);
}
async function pollOne() {
    const c = current && coin(current);
    if (!c || !c.binance || document.hidden) return;
    try {
        const t = await (await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=' + encodeURIComponent(c.binance))).json();
        const p = parseFloat(t && t.lastPrice), chg = parseFloat(t && t.priceChangePercent);
        if (isFinite(p) && p > 0) c.current_price = p;
        if (isFinite(chg)) c.price_change_percentage_24h = chg;
        if (current === upper(c.symbol)) { patchPrice(c); renderBadges(c); }
    } catch (e) {}
}

/* ── Kennzahlen ── */
function statCard(k, v, sub, c, barPct) {
    return `<div class="cd-stat"><div class="k">${esc(k)}</div><div class="v${c ? ' ' + c : ''}">${v}</div>` +
        (sub ? `<div class="s">${sub}</div>` : '') +
        (barPct != null ? `<div class="cd-bar"><i style="width:${Math.max(2, Math.min(100, barPct))}%"></i></div>` : '') + '</div>';
}
function renderStats(c) {
    const box = $('cdStats');
    if (!box) return;
    const s = signal(c.symbol);
    const fdv = (c.current_price && c.total_supply) ? c.current_price * c.total_supply : null;
    const float = (fdv && c.market_cap) ? c.market_cap / fdv * 100 : null;
    const volR = (c.total_volume && c.market_cap) ? c.total_volume / c.market_cap * 100 : null;
    const athDist = c.ath_change_percentage;
    const cards = [
        statCard('Marktkapitalisierung', fBig(c.market_cap), c.market_cap_rank ? 'Rang ' + c.market_cap_rank : ''),
        statCard('Volumen 24h', fBig(c.total_volume), volR != null ? fNum(volR, 1) + '% der Marktkap.' : ''),
        statCard('Allzeithoch', fUsd(c.ath), athDist != null ? fPct(athDist) + ' vom Hoch' : '', athDist != null && athDist > -20 ? 'up' : '', athDist != null ? 100 + athDist : null),
        statCard('FDV', fdv ? fBig(fdv) : NA, c.max_supply ? 'Max Supply fix' : 'Kein Max Supply'),
        statCard('Float', float != null ? fNum(float, 0) + '%' : NA, 'Umlauf zu Gesamt', '', float),
        statCard('Sektor', esc(c.cat || NA), esc((c.cats || []).slice(0, 2).join(' · '))),
        statCard('Umlauf gesamt', c.total_supply ? fBig(c.total_supply, '') : NA, ''),
        statCard('Maximal', c.max_supply ? fBig(c.max_supply, '') : 'unbegrenzt', ''),
    ];
    if (s) {
        cards.push(statCard('RSI', fNum(s.rsi), ''));
        cards.push(statCard('Volatilität 30T', s.vol30 != null ? fNum(s.vol30) + '%' : NA, ''));
    }
    box.innerHTML = cards.join('');
}
function renderDeriv(c) {
    const box = $('cdDeriv');
    if (!box) return;
    const ex = D.extras, sym = (c.symbol || '').toLowerCase();
    const f = ex && ex.funding && ex.funding[sym];
    const oi = ex && Array.isArray(ex.oi) && ex.oi.find(r => r.symbol === sym);
    if (!f && !oi) { box.classList.remove('on'); box.innerHTML = ''; return; }
    const cards = [];
    if (f && f.rate != null) {
        const r = f.rate * 100;
        cards.push(statCard('Funding 8h', fPct(r, 3), r > 0.03 ? 'Longs zahlen · heiß' : r < 0 ? 'Shorts zahlen' : 'neutral', r >= 0 ? 'up' : 'down'));
    }
    if (oi && oi.oi_usd) cards.push(statCard('Open Interest', fBig(oi.oi_usd), 'Binance Perp'));
    if (oi && oi.long_short) cards.push(statCard('Long/Short', fNum(oi.long_short, 2), oi.long_short >= 1 ? 'mehr Longs' : 'mehr Shorts', oi.long_short >= 1 ? 'up' : 'down'));
    if (!cards.length) { box.classList.remove('on'); box.innerHTML = ''; return; }
    box.innerHTML = `<div class="cd-sec"><span class="eyebrow">Derivate</span></div><div class="cd-stats">${cards.join('')}</div>`;
    box.classList.add('on');
}

/* ── Chart: Binance-Kerzen, dann CoinGecko, dann eigene Historie ── */
function emaSeries(bars, closes, period) {
    if (closes.length < period) return [];
    const k = 2 / (period + 1), out = [];
    let e = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    out.push({ time: bars[period - 1].time, value: e });
    for (let i = period; i < closes.length; i++) { e = closes[i] * k + e * (1 - k); out.push({ time: bars[i].time, value: e }); }
    return out;
}
function innen(box) {
    const s = getComputedStyle(box);
    return {
        width: Math.max(0, Math.floor(box.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0))),
        height: Math.max(0, Math.floor(box.clientHeight - (parseFloat(s.paddingTop) || 0) - (parseFloat(s.paddingBottom) || 0))),
    };
}
function folgeGroesse(ch, box) {
    let alt = '';
    const ro = new ResizeObserver(() => {
        if (!ch || !box.clientWidth) return;
        const m = innen(box), k = m.width + 'x' + m.height;
        if (k !== alt) { alt = k; ch.applyOptions(m); }
    });
    ro.observe(box);
    return ro;
}
function destroyChart() {
    if (zc) { zc.destroy(); zc = null; }
    if (chartRO) { chartRO.disconnect(); chartRO = null; }
    if (chart) { try { chart.remove(); } catch (e) {} chart = null; }
    mainSer = null; mainKind = ''; areaVar = ''; volSer = null; volKey = ''; emaSers = [];
}
function makeChart(box) {
    destroyChart();
    box.innerHTML = '';
    chart = LightweightCharts.createChart(box, { ...chartOpts(pal()), ...innen(box) });
    chartRO = folgeGroesse(chart, box);
    return chart;
}
function syncTabs() {
    const tabs = $('cdTabs');
    if (!tabs) return;
    tabs.querySelectorAll('[data-seg="cdtf"] button').forEach(b => b.classList.toggle('on', b.dataset.v === curTf));
    const te = $('cdEma'), tv = $('cdVol');
    if (te) te.classList.toggle('on', showEma);
    if (tv) tv.classList.toggle('on', showVol);
}
function areaChart(box, pts, v) {
    const ch = makeChart(box);
    mainKind = 'area'; areaVar = v;
    mainSer = ch.addAreaSeries({ ...areaOpts(css(v)), priceFormat: priceFmt(pts[pts.length - 1].value) });
    mainSer.setData(pts);
    ch.timeScale().fitContent();
    zeichnenAn(box, pts);
    const cc = coin(current);
    if (cc) taStarten(cc, curTf, pts, null, loadSeq);
}
/* ── Zeichnen: Trendlinien, Preislevel, Zonen, Fibonacci, je Coin gespeichert ── */
function zeichnenAn(box, bars) {
    if (zc) { zc.destroy(); zc = null; }
    if (!chart || !mainSer || !current || bars.length < 2) { syncTools(); return; }
    zc = zeichner({ chart, series: mainSer, box, bars, sym: current, magnet: zcMagnet, onTool: syncTools });
    if (zcAus) zc.ausblenden(true);
    zc.setAutoAn(taAn, false); zc.setMystikAn(mystAn);
    syncTools();
}
const WEB_KEY = 'c2_web_links';
async function webseiteFuer(c) {
    if (!c || !c.id) return null;
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem(WEB_KEY) || '{}'); } catch (e) {}
    const hit = cache[c.id];
    if (hit && Date.now() - hit.t < 30 * 86400000) return hit.u || null;
    let u = null;
    try {
        const r = await proxy('https://api.coingecko.com/api/v3/coins/' + encodeURIComponent(c.id) + '?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false');
        const h = r && r.links && (r.links.homepage || []).find(x => /^https?:\/\//.test(x));
        u = h || null;
        if (r && r.links) { cache[c.id] = { t: Date.now(), u }; try { localStorage.setItem(WEB_KEY, JSON.stringify(cache)); } catch (e) {} }
    } catch (e) { return null; }
    return u;
}
async function webseiteLaden(c, S) {
    const u = await webseiteFuer(c), a = $('cdWeb');
    if (!a || current !== S || !u) return;
    a.href = u; a.hidden = false; a.title = u.replace(/^https?:\/\//, '');
}

const zoneCache = new Map();
try { Object.entries(JSON.parse(localStorage.getItem('c2_kb_cache2') || '{}')).forEach(([k, v]) => zoneCache.set(k, v)); } catch (e) {}
let kbSpeichern = null;
const kbMerken = () => { clearTimeout(kbSpeichern); kbSpeichern = setTimeout(() => {
    const o = {}, alt = Date.now() - 30 * 60 * 1000; zoneCache.forEach((v, k) => { if (v.t > alt) o[k] = v; });
    try { localStorage.setItem('c2_kb_cache2', JSON.stringify(o)); } catch (e) {}
}, 1500); };
export async function aufbereich(c) {
    if (!c || !c.binance) return null;
    const k = upper(c.symbol), hit = zoneCache.get(k);
    if (hit && Date.now() - hit.t < 30 * 60 * 1000) return hit.v;
    let v = null;
    try {
        const kd = await fetchKlines(c.binance, '1d'), bars = klineCache[kd];
        let lang = bars;
        try { lang = klineCache[await fetchKlines(c.binance, 'all')] || bars; } catch (e) {}
        const fh = D.extras && D.extras.fng_history, fng = fh && fh.length ? fh[fh.length - 1].value : null;
        const vol = klineVol[kd] && klineVol[kd].length === bars.length ? klineVol[kd].map(x => x.value) : null;
        const ta = berechneTA({ bars, lang, vol, athDb: c.ath, fng });
        v = ta && ta.zone ? { ...ta.zone, kurs: ta.jetzt } : { im: false, keine: true };
    } catch (e) { v = null; }
    zoneCache.set(k, { t: Date.now(), v });
    if (v) kbMerken();
    return v;
}
async function taStarten(c, tf, bars, volKey2, token) {
    if (!zc) return;
    const norm = a => a.map(b => typeof b.time === 'number' ? b : { ...b, time: Date.parse(b.time) / 1000 });
    const fb = norm(bars);
    let lang = fb;
    if (c.binance && tf !== 'all') {
        try { const k2 = await fetchKlines(c.binance, 'all'); lang = klineCache[k2] || fb; } catch (e) {}
    }
    if (!zc || current !== upper(c.symbol) || token !== loadSeq) return;
    const fh = D.extras && D.extras.fng_history, fng = fh && fh.length ? fh[fh.length - 1].value : null;
    const vol = volKey2 && klineVol[volKey2] && klineVol[volKey2].length === fb.length ? klineVol[volKey2].map(v => v.value) : null;
    let ta = null;
    try { ta = berechneTA({ bars: fb, lang, vol, athDb: c.ath, fng }); } catch (e) { ta = null; }
    zc.setAuto(ta, ta ? mystik(ta, fb) : []);
}
function toolsHtml() {
    return WERKZEUGE.map(([id, ic, t]) => `<button class="cd-tb" data-tool="${id}" title="${esc(t)}">${icon(ic)}</button>`).join('') +
        `<span class="cd-tsep"></span>
        <button class="cd-tb" id="cdTA" title="Automatische Analyse ein oder aus: Fibonacci vom Allzeithoch bis zum Allzeittief, Trendlinien, Einstiegs- und Verkaufszonen, Prognose. Regelbasiert nach unserem Playbook, keine Anlageberatung.">${icon('sparkles')}</button>
        <button class="cd-tb" id="cdMyst" title="Mystik ein oder aus: Mondphasen, Fibonacci-Zeiten und Portale in der Zukunft. Verändert keine Zone und keine Prognose.">${icon('moon')}</button>
        <button class="cd-tb" id="cdAuto" title="Ansicht zurücksetzen: Preisachse wieder automatisch anpassen und alle Kerzen ins Bild holen (Doppelklick auf die Preisachse geht auch)">${icon('scan')}</button>
        <button class="cd-tb" id="cdMagnet" title="Magnet: rastet auf Hoch, Tief, Eröffnung und Schluss der Kerzen ein">${icon('magnet')}</button>
        <button class="cd-tb" id="cdZcAus" title="Zeichnungen aus- und einblenden">${icon('eye-off')}</button>
        <button class="cd-tb weg" id="cdZcDel" title="Ausgewählte Zeichnung löschen (Entf)">${icon('trash-2')}</button>
        <button class="cd-tb weg" id="cdZcAll" title="Alle Zeichnungen dieses Coins löschen">${icon('eraser')}</button>`;
}
function syncTools() {
    const t = $('cdTools');
    if (!t) return;
    const tool = zc ? zc.tool : 'zeiger';
    t.querySelectorAll('[data-tool]').forEach(b => { b.classList.toggle('on', b.dataset.tool === tool); b.disabled = !zc; });
    const ta = $('cdTA'), my = $('cdMyst');
    if (ta) ta.classList.toggle('on', taAn);
    if (my) my.classList.toggle('on', mystAn);
    const m = $('cdMagnet'), a = $('cdZcAus'), d = $('cdZcDel'), all = $('cdZcAll');
    if (m) m.classList.toggle('on', zcMagnet);
    if (a) a.classList.toggle('on', zcAus);
    if (d) d.disabled = !(zc && zc.auswahl);
    if (all) all.disabled = !(zc && zc.anzahl);
}
async function loadChart(c, tf) {
    curTf = tf;
    syncTabs();
    const box = $('cdChart'), note = $('cdNote');
    if (!box || !note) return;
    destroyChart();
    box.innerHTML = '<div class="skel"></div>';
    note.textContent = '…';
    const S = upper(c.symbol), token = ++loadSeq;
    const stale = () => current !== S || token !== loadSeq || !box.isConnected;
    const none = () => { box.innerHTML = '<div class="cd-msg">Kein Chart verfügbar (kein Binance-Paar, API-Limit oder zu junge Historie)</div>'; note.textContent = ''; };
    if (!window.LightweightCharts) { none(); return; }

    if (c.binance) {
        try {
            const key = await fetchKlines(c.binance, tf);
            if (stale()) return;
            const bars = klineCache[key], p = pal();
            const ch = makeChart(box);
            mainKind = 'candle';
            mainSer = ch.addCandlestickSeries({ ...candleOpts(p), priceFormat: priceFmt(bars[bars.length - 1].close) });
            mainSer.setData(bars);
            if (showVol && klineVol[key]) {
                volSer = ch.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol', color: alpha(p.ink3, .3) });
                ch.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
                volKey = key;
                volSer.setData(volData(key, p));
            }
            if (showEma) {
                const closes = bars.map(k => k.close);
                [[50, '--a2'], [200, '--warn']].forEach(([n, v]) => {
                    const line = emaSeries(bars, closes, n);
                    if (!line.length) return;
                    const ser = ch.addLineSeries({ color: css(v), lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
                    ser.setData(line);
                    emaSers.push({ ser, v });
                });
            }
            ch.timeScale().fitContent();
            zeichnenAn(box, bars);
            taStarten(c, tf, bars, key, token);
            const ema = showEma ? ' · EMA 50/200' : '';
            if (tf === 'all' && bars.length) {
                const ab = new Date(bars[0].time * 1000);
                const jahre = (Date.now() / 1000 - bars[0].time) / 31557600;
                note.textContent = 'Binance · alles seit ' + ('0' + (ab.getUTCMonth() + 1)).slice(-2) + '/' + ab.getUTCFullYear() + ' · ' + fNum(jahre, 1) + ' Jahre' + ema;
            } else note.textContent = 'Binance · ' + c.binance + ema;
            return;
        } catch (e) { if (stale()) return; destroyChart(); }
    }
    try {
        const days = (tf === '1w' || tf === 'all') ? 365 : 90;
        const all = await geckoDaily(c);
        if (stale()) return;
        if (all && all.length > 1) {
            areaChart(box, all.slice(-days), '--a4');
            note.textContent = 'CoinGecko · ' + days + ' Tage' + (tf === 'all' ? ' (mehr gibt die kostenlose Stufe nicht her)' : '');
            return;
        }
    } catch (e) { if (stale()) return; destroyChart(); }
    try {
        const sd = D.series, arr = sd && sd.coins && sd.coins[(c.symbol || '').toLowerCase()];
        const pts = arr && sd.dates ? sd.dates.map((d, i) => ({ time: d, value: arr[i] })).filter(x => x.value != null) : [];
        if (pts.length >= 2) {
            areaChart(box, pts, '--a1');
            note.textContent = 'Eigene Historie · ' + sd.dates.length + ' Tage';
            return;
        }
    } catch (e) { destroyChart(); }
    none();
}

/* ── Chart vergrößern ──
   Der Chart-Block wandert dafür direkt in den body und wird per Platzhalter
   zurückgesetzt. Die Schublade bewegt sich per transform, darin würde
   position:fixed am Kind nicht greifen. Der ResizeObserver passt die Maße an. */
function zoomOff() {
    const w = $('cdWrap');
    if (!w || !w.classList.contains('zoom')) return;
    w.classList.remove('zoom');
    if (zoomPh && zoomPh.isConnected) zoomPh.replaceWith(w); else w.remove();
    zoomPh = null;
    if (zoomBd) { zoomBd.remove(); zoomBd = null; }
    neuEinpassen();
}
function zoomOn() {
    const w = $('cdWrap');
    if (!w || w.classList.contains('zoom')) return;
    zoomPh = document.createElement('div');
    zoomPh.style.height = w.offsetHeight + 'px';
    w.replaceWith(zoomPh);
    zoomBd = document.createElement('div');
    zoomBd.className = 'cd-backdrop';
    zoomBd.addEventListener('click', zoomOff);
    document.body.appendChild(zoomBd);
    document.body.appendChild(w);
    w.classList.add('zoom');
    neuEinpassen();
}
function neuEinpassen() {
    setTimeout(() => { if (zc) zc.ansichtAuto(); else if (chart) chart.timeScale().fitContent(); }, 120);
}
const zoomed = () => { const w = $('cdWrap'); return !!(w && w.classList.contains('zoom')); };
function zoomToggle() { zoomed() ? zoomOff() : zoomOn(); }

/* ── Vergleich: bis 3 Coins, auf den Startwert normiert ── */
function destroyCmp() {
    if (cmpRO) { cmpRO.disconnect(); cmpRO = null; }
    if (cmpChart) { try { cmpChart.remove(); } catch (e) {} cmpChart = null; }
    cmpSers = [];
}
function cmpHint() { return '(' + (cmpDays >= 365 ? '1 Jahr' : cmpDays + ' Tage') + ', normalisiert)'; }
function renderCompare() {
    const box = $('cdCompare');
    if (!box) return;
    box.classList.toggle('on', cmpSyms.length > 0);
    const chips = $('cdCmpChips');
    chips.innerHTML = cmpSyms.map((s, i) =>
        `<span class="cd-cchip"><i style="background:var(${CMP_VARS[i % 3]})"></i>${esc(s)}<button data-x="${esc(s)}" title="Aus dem Vergleich nehmen">${icon('x')}</button></span>`).join('');
    icons(chips);
    $('cdCmpHint').textContent = cmpHint();
    box.querySelectorAll('[data-seg="cdcmp"] button').forEach(b => b.classList.toggle('on', +b.dataset.v === cmpDays));
    if (cmpSyms.length) drawCompare();
    else { cmpSeq++; destroyCmp(); }
}
async function drawCompare() {
    const box = $('cdCmpChart');
    if (!box) return;
    if (!window.LightweightCharts) { box.innerHTML = '<div class="cd-msg">Chart-Bibliothek nicht geladen.</div>'; return; }
    const token = ++cmpSeq, syms = [...cmpSyms], days = cmpDays;
    const sets = await Promise.all(syms.map(async (s, i) => {
        const c = coin(s);
        if (!c) return null;
        const ser = await dailySeries(c, days);
        if (!ser || ser.length < 2) return null;
        const base = ser[0].value;
        if (!base) return null;
        return { sym: s, v: CMP_VARS[i % 3], data: ser.map(x => ({ time: x.time, value: (x.value / base - 1) * 100 })) };
    }));
    if (token !== cmpSeq || !box.isConnected) return;
    destroyCmp();
    box.innerHTML = '';
    const ok = sets.filter(Boolean);
    if (!ok.length) { box.innerHTML = '<div class="cd-msg">Für diese Auswahl gibt es keine Tagesdaten.</div>'; return; }
    cmpChart = LightweightCharts.createChart(box, { ...chartOpts(pal()), ...innen(box) });
    cmpChart.applyOptions({ timeScale: { timeVisible: false }, crosshair: { mode: 1 } });
    cmpRO = folgeGroesse(cmpChart, box);
    ok.forEach(set => {
        const ser = cmpChart.addLineSeries({ color: css(set.v), lineWidth: 2, priceLineVisible: false, title: set.sym,
            priceFormat: { type: 'custom', minMove: 0.1, formatter: v => fPct(v, 1) } });
        ser.setData(set.data);
        cmpSers.push({ ser, v: set.v });
    });
    cmpChart.timeScale().fitContent();
}
function cmpAdd(sym) {
    const S = upper(sym);
    if (!S || !coin(S)) return false;
    if (!cmpSyms.includes(S)) { cmpSyms.push(S); if (cmpSyms.length > 3) cmpSyms.shift(); }
    renderCompare();
    return true;
}

/* ── Öffnen und Schließen ── */
export function closeCoin() {
    zoomOff();
    loadSeq++; cmpSeq++;
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
    destroyChart(); destroyCmp();
    current = null; shownPrice = null;
    document.dispatchEvent(new CustomEvent('cb2:fokus', { detail: null }));
    const d = el(), sc = $('scrim');
    if (d) { d.classList.remove('on'); d.setAttribute('aria-hidden', 'true'); }
    if (sc) sc.classList.remove('on');
}

export function openCoin(sym) {
    const c = coin(sym), d = el();
    if (!c || !d) return;
    ensureStyle();
    zoomOff();
    destroyChart(); destroyCmp();
    const S = upper(c.symbol);
    current = S;
    shownPrice = c.current_price;
    document.dispatchEvent(new CustomEvent('cb2:fokus', { detail: S }));
    const s = signal(c.symbol), p = (s && s.parts) || {};
    const notes = store.get(NOTE, {}) || {};
    const cats = [...new Set([c.cat, ...(c.cats || []), ...(c.subs || [])].filter(x => x && x !== 'Other'))].slice(0, 4);
    const part = (k, v) => v == null ? '' : `<div><div class="row between" style="font-size:.78rem;margin-bottom:5px"><span class="dim">${k}</span><span class="num">${v.toFixed(0)}</span></div>${bar(v, scoreVar(v))}</div>`;
    const parts = part('Momentum', p.momentum) + part('Trend', p.trend) + part('Risiko', p.risiko) +
        part('Aufmerksamkeit', p.buzz ?? p.attention ?? p.aufmerksamkeit) + part('Substanz', p.substanz);

    d.innerHTML = `
        <div class="cd-head">
            <img class="coin-img" src="${esc(c.image || '')}" alt="" onerror="this.style.visibility='hidden'">
            <div class="cd-title">
                <div class="cd-name"><span class="h2">${esc(c.name || S)}</span><span class="cd-sym">${esc(S)}</span>${c.market_cap_rank ? `<span class="cd-rank">Rang ${esc(c.market_cap_rank)}</span>` : ''}</div>
                ${cats.length ? `<div class="cd-cats">${cats.map(x => `<span class="cd-cat">${esc(x)}</span>`).join('')}</div>` : ''}
            </div>
            <div class="cd-btns">
                <button class="ibtn ${watch.has(S) ? 'on' : ''}" id="cdStar" title="Watchlist">${icon('star')}</button>
                <button class="ibtn" id="cdCmpAdd" title="Zum Vergleich hinzufügen">${icon('arrow-left-right')}</button>
                <button class="ibtn" id="cdClose" title="Schließen (Esc)">${icon('x')}</button>
            </div>
        </div>
        <div class="cd-pricerow">
            <div><span class="big num cd-price" id="cdPrice">${fUsd(c.current_price)}</span><span class="cd-live ${c.binance ? '' : 'off'}" title="${c.binance ? 'Kurs kommt live von Binance' : 'Kein Binance-Paar, Kurs aus dem letzten Datenlauf'}"><i></i>LIVE</span></div>
            ${s ? `<div style="text-align:right"><div class="eyebrow" style="margin-bottom:6px">Signal-Score</div>${scoreBadge(s.score)}</div>` : ''}
        </div>
        ${c.binance ? `<div class="kb-voll" data-kbvoll="${esc(S)}"></div>` : ''}
        <div class="cd-badges" id="cdBadges"></div>
        <div class="cd-wrap" id="cdWrap">
            <div class="cd-tabs" id="cdTabs">
                ${seg('cdtf', TF_LABEL, curTf)}
                <button class="cd-tog" id="cdEma" title="Gleitende Durchschnitte 50 und 200">EMA</button>
                <button class="cd-tog" id="cdVol" title="Volumen einblenden">VOL</button>
                <button class="cd-tog cd-zi" id="cdDraw" title="Zeichnen: Trendlinien, Preislevel, Zonen, Fibonacci">${icon('pencil')}</button>
                <button class="cd-tog" id="cdZoom" title="Chart vergrößern (Klick in den Chart geht auch, Esc schließt)"><span class="cd-zi">${icon('maximize-2')}</span><span class="cd-zo">${icon('minimize-2')}</span></button>
                <span class="cd-note" id="cdNote"></span>
            </div>
            <div class="cd-body"><div class="cd-tools" id="cdTools">${toolsHtml()}</div>
            <div class="cd-chart" id="cdChart"><div class="skel"></div></div></div>
        </div>
        <div class="cd-stats" id="cdStats"></div>
        <div class="cd-deriv" id="cdDeriv"></div>
        ${s && parts ? `<div class="cd-sec"><span class="eyebrow">Warum dieser Score</span></div><div class="stack" style="gap:12px">${parts}</div>` : ''}
        <div class="cd-compare" id="cdCompare">
            <div class="cd-sec"><span class="eyebrow">Vergleich<span class="cd-hint" id="cdCmpHint"></span></span><button class="btn soft" id="cdCmpClear" style="padding:6px 14px;font-size:.74rem" title="Vergleich leeren">Leeren</button></div>
            <div class="cd-cmprow">${seg('cdcmp', CMP_DAYS.map(([k, l]) => [String(k), l]), String(cmpDays))}<input class="input" id="cdCmpIn" placeholder="Coin dazu, z. B. ETH" autocomplete="off" spellcheck="false"></div>
            <div class="cd-cchips" id="cdCmpChips"></div>
            <div class="cd-cmpchart" id="cdCmpChart"></div>
        </div>
        <div class="cd-sec"><span class="eyebrow">Deine Notiz</span></div>
        <textarea class="textarea" id="cdNote2" rows="3" placeholder="Setup, Einstieg, Gedanke. Bleibt in diesem Browser.">${esc(notes[S] || '')}</textarea>
        <div class="cd-links">
            <a class="btn soft" target="_blank" rel="noopener" href="https://www.coingecko.com/en/coins/${esc(encodeURIComponent(c.id || ''))}">${icon('external-link')}CoinGecko</a>
            ${c.binance ? `<a class="btn soft" target="_blank" rel="noopener" href="https://www.tradingview.com/chart/?symbol=BINANCE:${esc(encodeURIComponent(c.binance))}">${icon('line-chart')}TradingView</a>` : ''}
            <a class="btn soft" target="_blank" rel="noopener" href="https://dexscreener.com/search?q=${esc(encodeURIComponent(S))}">${icon('activity')}DexScreener</a>
            <a class="btn soft" id="cdWeb" target="_blank" rel="noopener" href="#" hidden>${icon('globe')}Website</a>
        </div>`;
    hydrate(d);
    webseiteLaden(c, S);
    d.classList.add('on'); d.setAttribute('aria-hidden', 'false'); d.scrollTop = 0;
    $('scrim').classList.add('on');

    $('cdClose').onclick = closeCoin;
    $('cdStar').onclick = e => { e.currentTarget.classList.toggle('on', watch.toggle(S)); };
    $('cdCmpAdd').onclick = () => { if (cmpAdd(S)) { const b = $('cdCompare'); if (b && b.scrollIntoView) b.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } };
    $('cdNote2').oninput = e => { const n = store.get(NOTE, {}) || {}, t = e.target.value.trim(); if (t) n[S] = t; else delete n[S]; store.set(NOTE, n); };

    $('cdTabs').onclick = e => {
        const b = e.target.closest('button');
        if (!b || !current) return;
        if (b.id === 'cdZoom') { zoomToggle(); return; }
        if (b.id === 'cdDraw') { zoomOn(); if (zc) zc.setTool('trend'); return; }
        const cc = coin(current);
        if (!cc) return;
        if (b.id === 'cdEma') showEma = !showEma;
        else if (b.id === 'cdVol') showVol = !showVol;
        else if (!b.dataset.v) return;
        loadChart(cc, b.dataset.v || curTf);
    };
    $('cdChart').onclick = () => { if (!zoomed()) zoomOn(); };
    $('cdTools').onclick = e => {
        const b = e.target.closest('button');
        if (!b || !zc) return;
        if (b.dataset.tool) { zc.setTool(b.dataset.tool === zc.tool && b.dataset.tool !== 'zeiger' ? 'zeiger' : b.dataset.tool); }
        else if (b.id === 'cdAuto') zc.ansichtAuto();
        else if (b.id === 'cdTA') { taAn = !taAn; store.set('cb2_ta_an', taAn); zc.setAutoAn(taAn); }
        else if (b.id === 'cdMyst') { mystAn = !mystAn; store.set('cb2_ta_mystik', mystAn); zc.setMystikAn(mystAn); }
        else if (b.id === 'cdMagnet') { zcMagnet = !zcMagnet; zc.setMagnet(zcMagnet); }
        else if (b.id === 'cdZcAus') { zcAus = !zcAus; zc.ausblenden(zcAus); }
        else if (b.id === 'cdZcDel') zc.loeschen();
        else if (b.id === 'cdZcAll') { if (zc.anzahl && confirm('Alle ' + zc.anzahl + ' Zeichnungen für ' + current + ' löschen?')) zc.alleLoeschen(); }
        syncTools();
    };
    $('cdChart').addEventListener('pointerup', () => setTimeout(syncTools, 0));

    $('cdCompare').onclick = e => {
        const x = e.target.closest('[data-x]');
        if (x) { cmpSyms = cmpSyms.filter(v => v !== x.dataset.x); renderCompare(); return; }
        const r = e.target.closest('[data-seg="cdcmp"] button');
        if (r) { cmpDays = +r.dataset.v; renderCompare(); }
    };
    $('cdCmpClear').onclick = () => { cmpSyms = []; renderCompare(); };
    $('cdCmpIn').onkeydown = e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const v = e.target.value.trim();
        if (cmpAdd(v)) e.target.value = '';
        else { e.target.value = ''; e.target.placeholder = 'Nicht gefunden: ' + v.slice(0, 12); }
    };

    renderBadges(c);
    renderStats(c);
    renderDeriv(c);
    loadChart(c, curTf);
    ensureLongChanges(c);
    renderCompare();

    if (liveTimer) clearInterval(liveTimer);
    liveTimer = setInterval(pollOne, 45000);
    pollOne();
}

/* ── Einmalige Listener ── */
if (typeof document !== 'undefined') {
    document.addEventListener('cb2:live', () => {
        const c = current && coin(current);
        if (c) { patchPrice(c); renderBadges(c); }
    });
    document.addEventListener('cb2:theme', () => { repaint(); requestAnimationFrame(repaint); });
    document.addEventListener('cb2:watch', () => { const b = $('cdStar'); if (b && current) b.classList.toggle('on', watch.has(current)); });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape' || !zoomed()) return;
        e.stopPropagation(); e.preventDefault();
        zoomOff();
    }, true);

    const LISTE = 'tr[data-coin], .li[data-coin], .gm-row[data-coin], .bz-row[data-coin], .cs-row[data-coin], .card[data-coin], article[data-coin]';
    function blaettere(delta) {
        const alle = [...document.querySelectorAll('#main ' + LISTE.split(', ').join(', #main '))].filter(r => r.offsetParent !== null || r.getClientRects().length);
        const meine = alle.find(r => upper(r.dataset.coin) === current);
        let zeilen = meine ? alle.filter(r => r.parentNode === meine.parentNode) : alle;
        if (zeilen.length < 2) zeilen = alle;
        const syms = zeilen.map(r => ({ r, s: upper(r.dataset.coin) })).filter((x, i, a) => x.s && coin(x.s) && a.findIndex(y => y.s === x.s) === i);
        if (syms.length < 2) return false;
        let i = syms.findIndex(x => x.s === current); if (i < 0) i = delta > 0 ? -1 : 0;
        const ziel = syms[(i + delta + syms.length) % syms.length];
        openCoin(ziel.s);
        try { ziel.r.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
        return true;
    }
    document.addEventListener('keydown', e => {
        if (!current || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || zoomed()) return;
        const t = document.activeElement || {};
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || '') || t.isContentEditable) return;
        const k = e.key, runter = k === 'ArrowDown' || k.toLowerCase() === 'j', hoch = k === 'ArrowUp' || k.toLowerCase() === 'k';
        if (!runter && !hoch) return;
        if (blaettere(runter ? 1 : -1)) { e.preventDefault(); e.stopPropagation(); }
    });
}
