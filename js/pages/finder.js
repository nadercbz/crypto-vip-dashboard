import { D, watch } from '../core/data.js';
import { esc, fUsd, fBig } from '../core/fmt.js';
import { card, pageHead, coinImg, pct, chip, empty, icon, icons } from '../core/ui.js';

const CAT_NARR = { L1: 90, AI: 85, DeFi: 82, RWA: 85, Oracle: 88, L2: 80, DePIN: 70, Payments: 72, Privacy: 65, Gaming: 55, Other: 40, Meme: 20 };
const CAT_COLOR = { AI: 'var(--a2)', L1: 'var(--warn)', L2: 'color-mix(in srgb, var(--a2) 55%, var(--a1))', DeFi: 'var(--a1)', RWA: 'var(--up)', DePIN: 'var(--a4)',
    Gaming: 'var(--a3)', Oracle: 'color-mix(in srgb, var(--a1) 60%, var(--a2))', Payments: 'color-mix(in srgb, var(--up) 60%, var(--a1))', Privacy: 'var(--ink-2)', Meme: 'var(--down)', Other: 'var(--ink-3)' };
const MOM_FIELD = { '24h': 'price_change_percentage_24h', '7d': 'price_change_percentage_7d_in_currency', '30d': 'price_change_percentage_30d' };
const SEKTOREN = ['all', 'AI', 'L1', 'L2', 'DeFi', 'RWA', 'DePIN', 'Gaming', 'Oracle', 'Payments', 'Privacy', 'Meme', 'Other'];
const REGLER = [
    ['Market Cap', 'Large Cap', 'Micro Cap'],
    ['Narrative Strength', 'Strong (AI, L1, DeFi)', 'Risky (Meme, Spec)'],
    ['Momentum', 'Abverkauf', 'Starker Pump'],
    ['ATH Distance', 'Deep Drawdown', 'Near ATH'],
    ['Popularity / Buzz', 'Low Activity', 'Viral'],
];
const PRESETS = {
    bluechip:  { s: [20, 15, 40, 25, 45], sectors: ['all'],  mom: '7d',  sort: 'score', label: 'Blue Chip Dip' },
    ai:        { s: [45, 15, 55, 35, 55], sectors: ['AI'],   mom: '7d',  sort: 'score', label: 'AI Narrativ' },
    recovery:  { s: [40, 30, 72, 20, 55], sectors: ['all'],  mom: '7d',  sort: 'c7d',   label: 'Recovery Play' },
    gems:      { s: [80, 25, 50, 30, 40], sectors: ['all'],  mom: '7d',  sort: 'score', label: 'Hidden Gems' },
    meme:      { s: [70, 90, 80, 40, 70], sectors: ['Meme'], mom: '24h', sort: 'c24',   label: 'Meme Degen' },
    portfolio: { s: [50, 50, 50, 50, 50], sectors: ['all'], watch: true, mom: '7d', sort: 'score', label: 'Mein Portfolio' },
};
const SIGNALE = [['rsi_tief', 'RSI unter 35'], ['rsi_hoch', 'RSI über 70'], ['trend', 'Über beiden Linien'], ['score', 'Score über 65'],
    ['ruhig', 'Volatilität unter 60'], ['beta', 'Beta über 1,2'], ['volumen', 'Volumen-Schub'], ['funding', 'Funding negativ']];
const SPALTEN = [['score', 'Score'], ['price', 'Preis'], ['c24', '24h'], ['c7d', '7d'], ['mcap', 'Market Cap'], ['vm', 'Vol/MC'], ['ath', 'ATH']];
const DIM_LBL = { mcap: 'Market Cap', narr: 'Narrativ', mom: 'Momentum', ath: 'ATH Distanz', buzz: 'Buzz' };

const st = {
    s: [50, 50, 50, 50, 50], signale: new Set(), sectors: new Set(['all']), search: '', count: 100, mom: '24h',
    liqOnly: false, watchOnly: false, sortKey: 'score', sortDir: 'desc', preset: null, watch: new Set(), last: [], offen: null,
};
let root = null, debounce = null, onWatch = null;
const $ = sel => root.querySelector(sel);
const $$ = sel => root.querySelectorAll(sel);

function watchlistSet() {
    const s = new Set(watch.list().map(x => x.toLowerCase()));
    if (s.size) return s;
    try {
        ((D.script && D.script.youtube) || []).forEach(t => {
            const sym = (t.tags && t.tags[0]) ? String(t.tags[0]).toLowerCase() : null;
            if (sym) s.add(sym);
        });
    } catch (e) {}
    return s;
}

const norm = (v, lo, hi) => Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
const gauss = (v, target, sigma) => { const d = v - target; return Math.exp(-(d * d) / (2 * sigma * sigma)); };
function scoreColor(s) {
    if (s >= 0.70) return 'var(--up)';
    if (s >= 0.50) return 'var(--warn)';
    if (s >= 0.35) return 'var(--down)';
    return 'color-mix(in srgb, var(--down) 60%, transparent)';
}

function scoreCoin(c, sv) {
    const rank = c.market_cap_rank || 500;
    const mcapN = 100 * (1 - (rank - 1) / 499);
    const catBase = CAT_NARR[c.cat] != null ? CAT_NARR[c.cat] : 40;
    const narrN = 0.75 * catBase + 0.25 * mcapN;
    const momRaw = c[MOM_FIELD[st.mom]] || 0;
    const momN = norm(momRaw, -30, 40);
    const athN = norm(c.ath_change_percentage != null ? c.ath_change_percentage : -50, -99, -1);
    const volMcap = (c.total_volume && c.market_cap) ? c.total_volume / c.market_cap : 0.01;
    const buzzN = norm(Math.log10(Math.max(0.0001, volMcap)), -3, 0);
    const d = {
        mcap: gauss(mcapN, 100 - sv[0], 28),
        narr: gauss(narrN, 100 - sv[1], 25),
        mom: gauss(momN, sv[2], 28),
        ath: gauss(athN, sv[3], 28),
        buzz: gauss(buzzN, sv[4], 28),
    };
    return { _s: (d.mcap + d.narr + d.mom + d.ath + d.buzz) / 5, _vm: volMcap, _dims: d };
}

function passesFilters(c, sigMap) {
    if (!st.sectors.has('all') && st.sectors.size && !st.sectors.has(c.cat)) return false;
    if (st.liqOnly && (c._vm < 0.01)) return false;
    if (st.watchOnly && !st.watch.has((c.symbol || '').toLowerCase())) return false;
    if (st.signale.size) {
        const sg = sigMap.get((c.symbol || '').toLowerCase());
        if (!sg) return false;
        for (const f of st.signale) {
            if (f === 'rsi_tief' && !(sg.rsi != null && sg.rsi < 35)) return false;
            if (f === 'rsi_hoch' && !(sg.rsi != null && sg.rsi > 70)) return false;
            if (f === 'trend' && !(sg.above_ema50 && sg.above_ema200)) return false;
            if (f === 'score' && !(sg.score != null && sg.score > 65)) return false;
            if (f === 'ruhig' && !(sg.vol30 != null && sg.vol30 < 60)) return false;
            if (f === 'beta' && !(sg.beta != null && sg.beta > 1.2)) return false;
            if (f === 'volumen' && !(sg.vol_trend != null && sg.vol_trend > 40)) return false;
            if (f === 'funding' && !(sg.funding != null && sg.funding < 0)) return false;
        }
    }
    if (st.search) {
        const q = st.search;
        if (!((c.name || '').toLowerCase().includes(q) || (c.symbol || '').toLowerCase().includes(q))) return false;
    }
    return true;
}

function sortKeyVal(c, key) {
    switch (key) {
        case 'score': return c._s;
        case 'price': return c.current_price || 0;
        case 'c24': return c.price_change_percentage_24h || -999;
        case 'c7d': return c.price_change_percentage_7d_in_currency || -999;
        case 'mcap': return c.market_cap || 0;
        case 'vm': return c._vm || 0;
        case 'ath': return c.ath_change_percentage != null ? c.ath_change_percentage : -999;
        default: return c._s;
    }
}

function breakdown(c) {
    const bars = Object.keys(DIM_LBL).map(k => {
        const v = Math.round(c._dims[k] * 100), col = scoreColor(c._dims[k]);
        return `<div class="fd-bd-item"><div class="eyebrow">${DIM_LBL[k]}</div>
            <div class="fd-track"><i style="width:${v}%;background:${col}"></i></div>
            <div class="num" style="color:${col}">${v}</div></div>`;
    }).join('');
    const S = esc((c.symbol || '').toUpperCase());
    return `<tr class="fd-detail"><td colspan="10"><div class="fd-bd">
        <div class="row between wrap" style="gap:10px;margin-bottom:14px"><span class="sub" style="margin:0;font-size:.84rem">Warum Score ${Math.round(c._s * 100)}? Beitrag jeder Dimension (Treffer gegen deine Regler)</span>
            <span class="row" style="gap:8px"><button class="btn soft fd-mini" data-coin="${S}">${icon('maximize-2')}Coin-Detail</button>
            <a class="btn soft fd-mini" href="https://coinmarketcap.com/currencies/${encodeURIComponent(c.id || '')}/" target="_blank" rel="noopener">CMC öffnen${icon('arrow-up-right')}</a></span></div>
        <div class="fd-bd-grid">${bars}</div></div></td></tr>`;
}

function rows(top) {
    return top.map((c, i) => {
        const pctS = Math.round(c._s * 100), col = scoreColor(c._s);
        const chg = c.price_change_percentage_24h || 0, c7d = c.price_change_percentage_7d_in_currency, ath = c.ath_change_percentage;
        const athCol = ath == null ? 'var(--ink-3)' : ath >= -20 ? 'var(--up)' : ath >= -50 ? 'var(--warn)' : 'var(--down)';
        const sym = (c.symbol || '').toLowerCase(), isW = st.watch.has(sym), cat = c.cat || 'Other', open = st.offen === sym;
        return `<tr class="fd-row${isW ? ' watch' : ''}${open ? ' open' : ''}" data-sym="${esc(sym)}">
            <td class="dim mono">${i + 1}</td>
            <td><div class="row" style="gap:10px">${isW ? `<span class="fd-star">${icon('star')}</span>` : ''}${coinImg(c.image)}<b style="font-weight:500">${esc(c.name)}</b><span class="dim mono" style="font-size:.72rem">${esc(sym.toUpperCase())}</span></div></td>
            <td>${chip(cat, CAT_COLOR[cat] || 'var(--ink-3)')}</td>
            <td><div class="fd-score"><span class="num" style="color:${col}">${pctS}</span><div class="fd-track"><i style="width:${pctS}%;background:${col}"></i></div></div></td>
            <td class="r">${fUsd(c.current_price)}</td>
            <td class="r">${pct(chg, 2)}</td>
            <td class="r">${c7d != null ? pct(c7d, 2) : '<span class="dim">—</span>'}</td>
            <td class="r dim">${fBig(c.market_cap)}</td>
            <td class="r dim">${(c._vm * 100).toFixed(1).replace('.', ',')}%</td>
            <td class="r" style="color:${athCol}">${ath != null ? ath.toFixed(1).replace('.', ',') + '%' : '—'}</td>
        </tr>` + (open && c._dims ? breakdown(c) : '');
    }).join('');
}

function runScan() {
    if (!root) return;
    const body = $('#fdBody'), status = $('#fdStatus');
    if (!body) return;
    if (!D.coins.length) return;
    const sigMap = new Map();
    if (st.signale.size && D.signals && D.signals.coins) D.signals.coins.forEach(x => { if (!sigMap.has(x.symbol)) sigMap.set(x.symbol, x); });
    let scored = D.coins.map(c => ({ ...c, ...scoreCoin(c, st.s) }));
    scored = scored.filter(c => passesFilters(c, sigMap));
    if (st.watchOnly) {
        const seen = new Map();
        scored.forEach(c => {
            const k = (c.symbol || '').toLowerCase(), ex = seen.get(k);
            if (!ex || (c.market_cap_rank || 9999) < (ex.market_cap_rank || 9999)) seen.set(k, c);
        });
        scored = [...seen.values()];
    }
    const dir = st.sortDir === 'asc' ? 1 : -1;
    scored.sort((a, b) => (sortKeyVal(a, st.sortKey) - sortKeyVal(b, st.sortKey)) * dir);
    const top = scored.slice(0, st.count);
    st.last = top;
    if (st.offen && !top.some(c => (c.symbol || '').toLowerCase() === st.offen)) st.offen = null;
    body.innerHTML = top.length ? rows(top) : `<tr><td colspan="10">${empty('Kein Coin passt zu diesen Filtern.')}</td></tr>`;
    icons(body);
    const secTxt = st.sectors.has('all') ? 'alle Sektoren' : [...st.sectors].join(', ');
    const sortLbl = (SPALTEN.find(x => x[0] === st.sortKey) || [])[1] || st.sortKey;
    status.textContent = `${top.length} von ${scored.length} Treffer · ${secTxt} · Sortierung: ${sortLbl} ${st.sortDir === 'asc' ? '↑' : '↓'} · ${new Date().toLocaleTimeString('de-DE')}`;
}

function toggleBreakdown(sym) {
    st.offen = st.offen === sym ? null : sym;
    const body = $('#fdBody');
    body.innerHTML = rows(st.last); icons(body);
}

function syncSlider(i) {
    const inp = $('#fdR' + (i + 1));
    inp.value = st.s[i];
    inp.style.setProperty('--fill', st.s[i] + '%');
    $('#fdVal' + (i + 1)).textContent = st.s[i] + '%';
}
const syncSectors = () => $$('#fdSectors button').forEach(b => b.classList.toggle('on', st.sectors.has(b.dataset.sector)));
const syncMom = () => $$('#fdMom button').forEach(b => b.classList.toggle('on', b.dataset.mom === st.mom));
const syncSort = () => $$('th[data-sort]').forEach(th => {
    const on = th.dataset.sort === st.sortKey;
    th.classList.toggle('on', on);
    th.querySelector('span').textContent = on ? (st.sortDir === 'asc' ? ' ↑' : ' ↓') : '';
});
const syncPresets = () => $$('#fdPresets button').forEach(b => b.classList.toggle('on', b.dataset.preset === st.preset));
const syncSignale = () => $$('#fdSignal button').forEach(b => b.classList.toggle('on', st.signale.has(b.dataset.sigf)));
const syncToggles = () => { $('#fdLiq').classList.toggle('on', st.liqOnly); $('#fdWatch').classList.toggle('on', st.watchOnly); };
const clearPreset = () => { st.preset = null; syncPresets(); };

function applyPreset(key) {
    const p = PRESETS[key];
    if (!p) return;
    st.s = p.s.slice();
    st.sectors = new Set(p.sectors);
    st.mom = p.mom;
    st.sortKey = p.sort; st.sortDir = 'desc';
    st.watchOnly = !!p.watch;
    st.preset = key;
    st.s.forEach((_, i) => syncSlider(i));
    syncToggles(); syncSectors(); syncMom(); syncSort(); syncPresets();
    runScan();
}
function resetFinder() {
    st.s = [50, 50, 50, 50, 50];
    st.sectors = new Set(['all']); st.search = ''; st.count = 100; st.mom = '24h';
    st.liqOnly = false; st.watchOnly = false; st.sortKey = 'score'; st.sortDir = 'desc';
    st.s.forEach((_, i) => syncSlider(i));
    $('#fdSearch').value = ''; $('#fdCount').value = '100';
    clearPreset(); syncToggles(); syncSectors(); syncMom(); syncSort(); runScan();
}

const pille = (attr, key, label, on) => `<button class="fd-pill${on ? ' on' : ''}" ${attr}="${esc(key)}">${esc(label)}</button>`;

function html() {
    const slider = (r, i) => `<div class="fd-slider">
        <div class="row between" style="gap:10px"><span class="row wrap" style="gap:10px"><b style="font-weight:500;font-size:.9rem">${r[0]}</b>${i === 2
            ? `<span class="seg" id="fdMom"><button data-mom="24h" class="${st.mom === '24h' ? 'on' : ''}">24h</button><button data-mom="7d" class="${st.mom === '7d' ? 'on' : ''}">7d</button></span>` : ''}</span>
            <span class="num" id="fdVal${i + 1}" style="font-size:1.25rem;font-weight:300">${st.s[i]}%</span></div>
        <input type="range" class="fd-range" id="fdR${i + 1}" min="0" max="100" value="${st.s[i]}" style="--fill:${st.s[i]}%" aria-label="${esc(r[0])}">
        <div class="row between eyebrow" style="letter-spacing:.1em"><span>${r[1]}</span><span>${r[2]}</span></div></div>`;
    return pageHead('Entdecken', 'Coin-Finder', 'Fünf Regler, fünf Dimensionen. Bewertet jeden Coin gegen dein ideales Profil. Sektor-Filter, Suche und Presets verfeinern das Ergebnis.') +
        card({ eyebrow: 'Coin Discovery Engine', body: `
            <div class="fd-zeile" id="fdPresets"><span class="eyebrow">Presets</span>${Object.keys(PRESETS).map(k => pille('data-preset', k, PRESETS[k].label, st.preset === k)).join('')}</div>
            <div class="fd-zeile" id="fdSignal"><span class="eyebrow">Signale</span>${SIGNALE.map(([k, l]) => pille('data-sigf', k, l, st.signale.has(k))).join('')}</div>
            <div class="fd-sliders">${REGLER.map(slider).join('')}</div>
            <div class="fd-zeile" id="fdSectors"><span class="eyebrow">Sektor</span>${SEKTOREN.map(s => pille('data-sector', s, s === 'all' ? 'Alle' : s, st.sectors.has(s))).join('')}</div>
            <div class="row wrap fd-bar">
                <div style="flex:1;min-width:220px;max-width:360px"><input class="input" id="fdSearch" placeholder="Coin suchen (Name oder Symbol)" value="${esc(st.search)}"></div>
                <label class="row fd-tg"><button class="toggle${st.liqOnly ? ' on' : ''}" id="fdLiq" aria-label="Nur liquide"></button><span>Nur liquide</span></label>
                <label class="row fd-tg"><button class="toggle${st.watchOnly ? ' on' : ''}" id="fdWatch" aria-label="Watchlist"></button><span class="row" style="gap:5px">${icon('star')}Watchlist</span></label>
                <label class="row fd-tg"><span>Top</span><select class="select" id="fdCount" style="width:auto;padding:8px 12px">${[25, 50, 100, 250].map(n => `<option value="${n}"${st.count === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
            </div>
            <div class="row wrap" style="gap:12px">
                <button class="btn" id="fdScan">${icon('scan-search')}Scan ausführen</button>
                <button class="btn soft" id="fdReset">Reset</button>
                <span class="eyebrow" id="fdStatus" style="letter-spacing:.08em">Bereit</span>
            </div>` }) +
        card({ eyebrow: 'Ergebnis', body: D.coins.length ? `<div class="tbl-wrap"><table class="tbl fd-tbl"><thead><tr><th>#</th><th>Coin</th><th>Sektor</th>${SPALTEN.map(([k, l]) =>
            `<th data-sort="${k}" class="${k === 'score' ? '' : 'r'}" style="cursor:pointer">${l}<span></span></th>`).join('')}</tr></thead><tbody id="fdBody"></tbody></table></div>
            <p class="sub" style="margin:14px 0 0;font-size:.8rem">Klick auf eine Zeile zeigt, welche Dimension wie viel zum Score beiträgt.</p>`
            : empty('Keine Kursdaten geladen. Starte den Refresh, dann rechnet der Finder.') });
}

export default {
    styles: `
        .fd-zeile { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }
        .fd-zeile > .eyebrow { min-width: 74px; }
        .fd-pill { padding: 7px 14px; border-radius: var(--r-pill); font-size: .78rem; color: var(--ink-2); background: var(--bg); box-shadow: var(--sh-sm); transition: color .25s var(--ease), background .25s var(--ease), box-shadow .25s var(--ease), transform .25s var(--ease); }
        .fd-pill:hover { color: var(--ink); transform: translateY(-1px); }
        .fd-pill.on { color: var(--ink); background: color-mix(in srgb, var(--pg) 18%, var(--bg)); box-shadow: var(--sh-in); }
        .fd-sliders { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin: 22px 0; }
        .fd-slider { display: flex; flex-direction: column; gap: 12px; padding: 18px 20px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); }
        .fd-range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 99px; outline: none; cursor: pointer;
            background: linear-gradient(to right, var(--pg) var(--fill, 50%), var(--line) var(--fill, 50%)); }
        .fd-range::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--raised); border: 2px solid var(--pg); box-shadow: var(--sh-sm); cursor: grab; transition: transform .25s var(--ease-spring); }
        .fd-range::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .fd-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: var(--raised); border: 2px solid var(--pg); cursor: grab; }
        .fd-bar { gap: 18px; margin: 18px 0; }
        .fd-tg { gap: 10px; font-size: .84rem; color: var(--ink-2); cursor: pointer; }
        .fd-tg svg { width: 14px; height: 14px; }
        .fd-tbl th.on { color: var(--ink); }
        .fd-row { cursor: pointer; }
        .fd-row.watch { background: color-mix(in srgb, var(--warn) 8%, transparent); }
        .fd-row.open { background: color-mix(in srgb, var(--pg) 10%, transparent); }
        .fd-star { color: var(--warn); display: inline-grid; place-items: center; }
        .fd-star svg { width: 13px; height: 13px; fill: currentColor; }
        .fd-score { display: flex; align-items: center; gap: 10px; min-width: 110px; }
        .fd-score .num { min-width: 26px; font-weight: 500; }
        .fd-track { flex: 1; height: 5px; border-radius: 99px; background: var(--line); overflow: hidden; }
        .fd-track i { display: block; height: 100%; border-radius: 99px; transition: width .5s var(--ease); }
        .fd-detail td { padding: 0 14px 16px !important; }
        .fd-bd { padding: 18px 20px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); }
        .fd-bd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px 22px; }
        .fd-bd-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 10px; align-items: center; }
        .fd-bd-item .eyebrow { grid-column: 1 / -1; }
        .fd-mini { padding: 6px 12px; font-size: .74rem; }
        .fd-mini svg { width: 13px; height: 13px; }
        @media (max-width: 860px) { .fd-sliders { grid-template-columns: minmax(0, 1fr); } .fd-zeile > .eyebrow { min-width: 100%; } }`,
    render(el) {
        root = el;
        root.classList.add('stack');
        st.watch = watchlistSet();
        root.innerHTML = html();

        st.s.forEach((_, i) => {
            const inp = $('#fdR' + (i + 1));
            inp.oninput = () => {
                clearPreset();
                st.s[i] = parseInt(inp.value);
                inp.style.setProperty('--fill', st.s[i] + '%');
                $('#fdVal' + (i + 1)).textContent = st.s[i] + '%';
                clearTimeout(debounce); debounce = setTimeout(runScan, 200);
            };
        });
        $('#fdPresets').onclick = e => { const b = e.target.closest('[data-preset]'); if (b) applyPreset(b.dataset.preset); };
        $('#fdSignal').onclick = e => {
            const b = e.target.closest('[data-sigf]'); if (!b) return;
            const f = b.dataset.sigf;
            st.signale.has(f) ? st.signale.delete(f) : st.signale.add(f);
            syncSignale(); runScan();
        };
        $('#fdSectors').onclick = e => {
            const b = e.target.closest('[data-sector]'); if (!b) return;
            const sec = b.dataset.sector;
            if (sec === 'all') st.sectors = new Set(['all']);
            else {
                st.sectors.delete('all');
                st.sectors.has(sec) ? st.sectors.delete(sec) : st.sectors.add(sec);
                if (st.sectors.size === 0) st.sectors = new Set(['all']);
            }
            clearPreset(); syncSectors(); runScan();
        };
        $('#fdMom').onclick = e => { const b = e.target.closest('[data-mom]'); if (!b) return; st.mom = b.dataset.mom; clearPreset(); syncMom(); runScan(); };
        $('#fdSearch').oninput = e => { st.search = e.target.value.trim().toLowerCase(); clearTimeout(debounce); debounce = setTimeout(runScan, 180); };
        $('#fdLiq').onclick = e => { e.preventDefault(); st.liqOnly = !st.liqOnly; syncToggles(); runScan(); };
        $('#fdWatch').onclick = e => { e.preventDefault(); st.watchOnly = !st.watchOnly; syncToggles(); clearPreset(); runScan(); };
        $('#fdCount').onchange = e => { st.count = parseInt(e.target.value); runScan(); };
        $('#fdScan').onclick = runScan;
        $('#fdReset').onclick = resetFinder;

        const tbl = $('.fd-tbl');
        if (tbl) {
            tbl.querySelector('thead').onclick = e => {
                const th = e.target.closest('th[data-sort]'); if (!th) return;
                const key = th.dataset.sort;
                if (st.sortKey === key) st.sortDir = st.sortDir === 'desc' ? 'asc' : 'desc';
                else { st.sortKey = key; st.sortDir = 'desc'; }
                syncSort(); runScan();
            };
            $('#fdBody').onclick = e => {
                if (e.target.closest('.fd-detail')) return;
                const tr = e.target.closest('.fd-row');
                if (tr) toggleBreakdown(tr.dataset.sym);
            };
            syncSort();
        }
        runScan();
        onWatch = () => { st.watch = watchlistSet(); runScan(); };
        document.addEventListener('cb2:watch', onWatch);
    },
    destroy() {
        clearTimeout(debounce); debounce = null;
        if (onWatch) { document.removeEventListener('cb2:watch', onWatch); onWatch = null; }
        root = null;
    },
};
