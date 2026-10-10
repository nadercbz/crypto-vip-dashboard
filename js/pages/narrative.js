import { D } from '../core/data.js?v=202610101938';
import { esc, fPct, fBig, cls } from '../core/fmt.js?v=202610101938';
import { pageHead, seg, sparkline, bar, empty, icon, icons, laden } from '../core/ui.js?v=202610101938';

const META = {
    AI:       { icon: 'bot',            blurb: 'Artificial Intelligence & Agents' },
    L1:       { icon: 'link',           blurb: 'Base Layer Chains' },
    L2:       { icon: 'layers-2',       blurb: 'Scaling & Rollups' },
    DeFi:     { icon: 'landmark',       blurb: 'Decentralized Finance' },
    RWA:      { icon: 'building-2',     blurb: 'Real World Assets' },
    DePIN:    { icon: 'radio-tower',    blurb: 'Physical Infrastructure' },
    Gaming:   { icon: 'gamepad-2',      blurb: 'GameFi & Play to Earn' },
    SocialFi: { icon: 'message-circle', blurb: 'Social, Creator & NFT' },
    Oracle:   { icon: 'eye',            blurb: 'Oracles & Data Feeds' },
    Payments: { icon: 'banknote',       blurb: 'Payments & Transfer' },
    Privacy:  { icon: 'eye-off',        blurb: 'Privacy & Security' },
    Meme:     { icon: 'smile',          blurb: 'Memecoins & Culture' },
};
const ORDER = ['AI', 'L1', 'L2', 'DeFi', 'RWA', 'DePIN', 'Gaming', 'SocialFi', 'Oracle', 'Payments', 'Privacy', 'Meme'];
const T = (n, k) => ({ n, t: 't', k: k || n });
const X = (n, k) => ({ n, t: 'x', k });
const SUB_DEFS = {
    AI: [T('AI Agents'), T('x402 Agents'), T('Cloud Compute'), T('Distributed Compute'), T('Data & Storage'),
        X('Layer 1 AI', 'L1'), X('DeFi AI', 'DeFi'), X('DePIN AI', 'DePIN'), X('Gaming AI', 'Gaming'), X('Payment AI', 'Payments')],
    DeFi: [T('DEX'), T('Perp / Derivatives'), T('AMM'), T('Lending'), T('Yield Farming'), T('Liquid Staking'), T('Restaking'), T('Staking'), T('Asset Management')],
    Meme: [T('Dog Memes'), T('Cat Memes'), T('Frog Memes'), T('Political Memes'), T('Pump.fun'), X('AI Memes', 'AI')],
    RWA: [T('Tokenized Assets'), T('Tokenized Stocks'), T('Real Estate'), T('Finance & Banking'), X('Layer 1 RWA', 'L1'), X('DeFi RWA', 'DeFi')],
    Gaming: [T('Metaverse'), T('Play to Earn'), T('Casino & Gambling'), T('Sports')],
    SocialFi: [T('NFT'), T('NFT Marketplace'), T('Metaverse'), T('Sports'), T('Play to Earn'), T('DAO'), T('Web3'), T('Identity')],
    DePIN: [T('Cloud Compute'), T('Data & Storage'), T('Wireless / Mobile'), T('IoT'), T('Energy'), T('Supply Chain'), T('Distributed Compute')],
    Privacy: [T('Zero Knowledge'), T('Identity'), T('Cybersecurity')],
    L1: [T('Smart Contracts'), T('High TPS'), T('Interoperability'), T('Proof of Stake'), T('Proof of Work')],
    L2: [T('Zero Knowledge'), T('Bitcoin L2'), T('Bitcoin Runes'), T('High TPS'), T('Smart Contracts')],
    Payments: [T('Payments Rails'), T('Crypto Cards'), X('Payment Chains', 'L1')],
    Oracle: [],
};
const TF_FIELD = { '24h': 'price_change_percentage_24h', '7d': 'price_change_percentage_7d_in_currency', '30d': 'price_change_percentage_30d' };
const TF_THRESH = { '24h': [1.5, -1.5], '7d': [4, -4], '30d': [8, -8] };
const LANES = [
    { key: 'hot',  label: 'Hot Right Now',     sub: 'Kapital fließt rein',       c: 'var(--up)' },
    { key: 'warm', label: 'Warm / Building',   sub: 'Solide, im Aufbau',         c: 'var(--warn)' },
    { key: 'cold', label: 'Cold / Contrarian', sub: 'Abverkauft, antizyklisch',  c: 'var(--a2)' },
];
const st = { tf: '24h' };
let last = [];

function median(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function agg(coins, field) {
    const vals = coins.map(c => c[field]).filter(v => v != null);
    if (!vals.length) return null;
    const green = vals.filter(v => v > 0).length;
    const cap = coins.reduce((a, c) => a + (c.market_cap || 0), 0);
    const leaders = coins.filter(c => c[field] != null).sort((a, b) => b[field] - a[field]).slice(0, 3);
    return { avg: median(vals), breadth: green / vals.length * 100, green, total: vals.length, cap, count: coins.length, leaders };
}
function tier(avg, breadth, tf) {
    const [hi, lo] = TF_THRESH[tf];
    if (avg >= hi || (avg > 0 && breadth >= 62)) return 'hot';
    if (avg <= lo || (avg < 0 && breadth <= 38)) return 'cold';
    return 'warm';
}
function compute(db, tf) {
    const field = TF_FIELD[tf], out = [];
    for (const cat of ORDER) {
        const coins = db.filter(c => c.cat === cat);
        if (coins.length < 3) continue;
        const a = agg(coins, field);
        if (!a) continue;
        const subs = (SUB_DEFS[cat] || []).map(def => {
            const sc = coins.filter(c => def.t === 'x' ? (c.cats || []).includes(def.k) : (c.subs || []).includes(def.k));
            if (sc.length < 2) return null;
            const sa = agg(sc, field);
            return sa ? { name: def.n, def, ...sa } : null;
        }).filter(Boolean).sort((a2, b2) => b2.avg - a2.avg);
        out.push({ cat, ...a, subs, tier: tier(a.avg, a.breadth, tf) });
    }
    return out;
}

function verlauf(cat, avg) {
    const sh = D.signals && D.signals.sector_history ? D.signals.sector_history[cat] : null;
    if (!sh || !sh.serie || sh.serie.length < 6) return '';
    const start = sh.serie[0], ende = sh.serie[sh.serie.length - 1];
    const richtung = ende > start ? 'zieht an' : ende < start ? 'gibt nach' : 'seitwärts';
    return `<div class="nv-verlauf">${sparkline(sh.serie, 230, 34, avg >= 0 ? 'var(--up)' : 'var(--down)')}
        <span class="eyebrow" style="letter-spacing:.1em">${sh.serie.length} Tage · ${richtung}</span></div>`;
}
const meta = (green, total, cap, count) => `${green}/${total} grün · ${fBig(cap)} · ${count} Coins`;

function cardHtml(n, idx) {
    const m = META[n.cat] || { icon: 'circle', blurb: '' }, f = TF_FIELD[st.tf];
    const leaders = n.leaders.map(c => `<span class="nv-leader"><img src="${esc(c.image || '')}" alt="" onerror="this.style.display='none'">
        <b>${esc((c.symbol || '').toUpperCase())}</b><i class="${cls(c[f] || 0)}">${fPct(c[f] || 0, 2)}</i></span>`).join('');
    return `<div class="card click nv-card" data-key="${esc(n.cat)}" style="--i:${idx}">
        <div class="nv-top"><span class="ico-b">${icon(m.icon)}</span>
            <div style="min-width:0"><div class="nv-name">${esc(n.cat)}</div><div class="nv-blurb">${esc(m.blurb)}</div></div>
            <div class="nv-mom num ${cls(n.avg)}">${fPct(n.avg, 2)}</div></div>
        ${verlauf(n.cat, n.avg)}
        <div class="nv-breadth">${bar(n.breadth.toFixed(0), n.avg >= 0 ? 'var(--up)' : 'var(--down)')}
            <div class="nv-meta">${meta(n.green, n.total, n.cap, n.count)}</div></div>
        <div class="nv-leaders">${leaders}</div>
        ${n.subs.length ? `<div class="nv-expand">${n.subs.length} Sub-Narrative ${icon('chevron-down')}</div>` : ''}
        <div class="nv-subs"></div>
    </div>`;
}

const fill = el => requestAnimationFrame(() => requestAnimationFrame(() =>
    el.querySelectorAll('.bar i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; })));

function drawCards(wrap, list) {
    wrap.innerHTML = LANES.map(lane => {
        const cards = list.filter(n => n.tier === lane.key);
        return `<section class="nv-lane">
            <div class="nv-lane-head"><span class="nv-dot" style="--c:${lane.c}"></span><h3 class="h2">${lane.label}</h3>
                <span class="sub" style="margin:0">${lane.sub}</span><span class="chip" style="margin-left:auto">${cards.length}</span></div>
            ${cards.length ? `<div class="nv-grid">${cards.map((n, i) => cardHtml(n, i)).join('')}</div>` : `<div class="card sunk">${empty('Gerade nichts hier')}</div>`}
        </section>`;
    }).join('');
    icons(wrap); fill(wrap);
}
function positions(wrap) {
    const map = new Map();
    wrap.querySelectorAll('.nv-card').forEach(el => map.set(el.dataset.key, el.getBoundingClientRect()));
    return map;
}
function flip(wrap, old) {
    wrap.querySelectorAll('.nv-card').forEach(el => {
        const prev = old.get(el.dataset.key);
        if (!prev) return;
        const now = el.getBoundingClientRect(), dx = prev.left - now.left, dy = prev.top - now.top;
        if (!dx && !dy) return;
        el.style.transition = 'none';
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
            el.style.transition = 'transform .5s var(--ease)';
            el.style.transform = '';
            setTimeout(() => { el.style.transition = ''; }, 540);
        });
    });
}
function draw(root, animate) {
    const wrap = root.querySelector('#nvWrap');
    if (!wrap) return;
    const db = D.coins;
    if (!db.length) { wrap.innerHTML = `<div class="card">${laden('Lade Coins …')}</div>`; return; }
    const list = compute(db, st.tf);
    last = list;
    const old = animate ? positions(wrap) : null;
    drawCards(wrap, list);
    if (old) flip(wrap, old);
    const hot = list.filter(n => n.tier === 'hot').length;
    const s = root.querySelector('#nvStatus');
    if (s) s.textContent = `${list.length} Narrative · ${hot} hot · Stand ${new Date().toLocaleTimeString('de-DE')}`;
}

function toggleSubs(wrap, cardEl, cat) {
    const holder = cardEl.querySelector('.nv-subs');
    if (!holder) return;
    if (cardEl.classList.contains('open')) { cardEl.classList.remove('open'); holder.innerHTML = ''; return; }
    wrap.querySelectorAll('.nv-card.open').forEach(c => { c.classList.remove('open'); c.querySelector('.nv-subs').innerHTML = ''; });
    const n = last.find(x => x.cat === cat);
    if (!n || !n.subs.length) return;
    holder.innerHTML = n.subs.map(s => `<div class="nv-sub" data-sub="${esc(s.name)}">
        <div class="row between"><span class="nv-sub-name">${esc(s.name)}</span><span class="mono ${cls(s.avg)}" style="font-size:.82rem">${fPct(s.avg, 2)}</span></div>
        ${bar(s.breadth.toFixed(0), s.avg >= 0 ? 'var(--up)' : 'var(--down)')}
        <div class="nv-meta">${meta(s.green, s.total, s.cap, s.count)}</div>
        <div class="nv-sub-coins"></div></div>`).join('');
    cardEl.classList.add('open');
    fill(holder);
}
function toggleSubCoins(subEl, cat, subName) {
    const holder = subEl.querySelector('.nv-sub-coins');
    if (!holder) return;
    if (subEl.classList.contains('open')) { subEl.classList.remove('open'); holder.innerHTML = ''; return; }
    const field = TF_FIELD[st.tf];
    const n = last.find(x => x.cat === cat), hit = n && n.subs.find(s => s.name === subName), def = hit && hit.def;
    const match = def && def.t === 'x' ? (c => (c.cats || []).includes(def.k)) : (c => (c.subs || []).includes(def ? def.k : subName));
    const coins = D.coins.filter(c => c.cat === cat && match(c) && c[field] != null).sort((a, b) => b[field] - a[field]).slice(0, 8);
    holder.innerHTML = coins.map(c => `<span class="nv-coin" data-coin="${esc((c.symbol || '').toUpperCase())}">
        <img src="${esc(c.image || '')}" alt="" onerror="this.style.display='none'"><b>${esc((c.symbol || '').toUpperCase())}</b>
        <i class="${cls(c[field])}">${fPct(c[field], 2)}</i></span>`).join('');
    subEl.classList.add('open');
}

export default {
    styles: `
        .nv-lane-head { display: flex; align-items: center; gap: 12px; margin: 4px 4px 14px; flex-wrap: wrap; }
        .nv-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 18%, transparent); flex: none; }
        .nv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; align-items: start; }
        .nv-card { display: flex; flex-direction: column; gap: 14px; }
        .nv-card.open:hover { transform: none; }
        .nv-top { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px; align-items: center; }
        .nv-name { font-size: 1.05rem; font-weight: 500; }
        .nv-blurb { font-size: .74rem; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nv-mom { font-size: 1.3rem; font-weight: 300; letter-spacing: -.02em; }
        .nv-verlauf { display: flex; flex-direction: column; gap: 6px; }
        .nv-verlauf svg { width: 100%; }
        .nv-breadth { display: flex; flex-direction: column; gap: 7px; }
        .nv-meta { font-family: var(--mono); font-size: .66rem; color: var(--ink-3); }
        .nv-leaders, .nv-sub-coins { display: flex; flex-wrap: wrap; gap: 6px; }
        .nv-leader, .nv-coin { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px 4px 5px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); font-family: var(--mono); font-size: .68rem; }
        .nv-leader img, .nv-coin img { width: 16px; height: 16px; border-radius: 50%; }
        .nv-leader b, .nv-coin b { font-weight: 500; } .nv-leader i, .nv-coin i { font-style: normal; }
        .nv-coin { cursor: pointer; background: var(--surface); box-shadow: var(--sh-sm); transition: transform .25s var(--ease); }
        .nv-coin:hover { transform: translateY(-2px); }
        .nv-expand { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: .64rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
        .nv-expand svg { width: 14px; height: 14px; transition: transform .3s var(--ease); }
        .nv-card.open .nv-expand svg { transform: rotate(180deg); }
        .nv-subs { display: none; flex-direction: column; gap: 10px; }
        .nv-card.open .nv-subs { display: flex; }
        .nv-sub { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); transition: background .2s; }
        .nv-sub:hover { background: color-mix(in srgb, var(--pg) 6%, var(--bg)); }
        .nv-sub-name { font-size: .86rem; font-weight: 500; }
        .nv-sub-coins:empty { display: none; }
        @media (max-width: 860px) { .nv-grid { grid-template-columns: minmax(0, 1fr); } }`,
    render(root) {
        root.classList.add('stack');
        root.innerHTML = pageHead('Entdecken', 'Narrative',
            `Was läuft gerade? Live aus ${D.coins.length} Coins. Momentum, Breadth und Kapital pro Erzählung. Klick auf eine Karte öffnet die Sub-Narrative und die führenden Coins.`,
            `<span class="eyebrow">Zeitfenster</span>${seg('nvtf', [['24h', '24h'], ['7d', '7d'], ['30d', '30d']], st.tf)}<span class="eyebrow" id="nvStatus" style="letter-spacing:.08em"></span>`) +
            `<div id="nvWrap" class="stack"></div>`;
        draw(root, false);
        root.querySelector('[data-seg="nvtf"]').onclick = e => {
            const b = e.target.closest('button'); if (!b) return;
            st.tf = b.dataset.v;
            root.querySelectorAll('[data-seg="nvtf"] button').forEach(x => x.classList.toggle('on', x === b));
            draw(root, true);
        };
        const wrap = root.querySelector('#nvWrap');
        wrap.onclick = e => {
            if (e.target.closest('[data-coin]')) return;   // Coin-Detail öffnet die Hülle
            const subEl = e.target.closest('.nv-sub');
            if (subEl) { toggleSubCoins(subEl, subEl.closest('.nv-card').dataset.key, subEl.dataset.sub); return; }
            const c = e.target.closest('.nv-card');
            if (c) toggleSubs(wrap, c, c.dataset.key);
        };
    },
};
