import { NAV, ALL, READY } from './nav.js';
import { D, coin, watch } from './core/data.js';
import { esc, fUsd, fBig, fPct, cls, ago, utcTs } from './core/fmt.js';
import { icon, icons, hydrate, toast, pageHead, card, coinImg } from './core/ui.js';
import { openCoin, closeCoin } from './core/coin.js';

const $ = id => document.getElementById(id);
const main = $('main');
let active = null, activeMod = null, lastCoin = null;

const OEFFENTLICH = !!window.CB2_PUBLIC;
let altLink = '';

/* ── Menü ── */
$('nav').innerHTML = NAV.map(g => `<div class="nav-group eyebrow">${esc(g.group)}</div>` +
    g.items.map(i => `<a data-go="${i.id}" title="${READY.has(i.id) ? '' : 'Früher: ' + esc(i.alt)}">${icon(i.icon)}<span>${esc(i.label)}</span>${READY.has(i.id) ? '' : '<span class="soon">BALD</span>'}</a>`).join('')).join('');

/* ── Seitenwechsel ── */
const styled = new Set();
async function go(id) {
    const item = ALL.find(i => i.id === id) || ALL[0];
    if (activeMod && activeMod.destroy) try { activeMod.destroy(); } catch (e) {}
    active = item.id; activeMod = null;
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.go === active));
    $('side').classList.remove('on');
    document.title = item.label + (OEFFENTLICH ? ' · Crypto Biz' : ' · Crypto Biz 2.0');
    const root = document.createElement('div');
    root.className = 'page'; root.dataset.page = active;
    main.replaceChildren(root); main.scrollTop = 0;
    const paint = async () => {
        if (READY.has(active)) {
            try {
                const mod = (await import(`./pages/${active}.js`)).default;
                if (mod.styles && !styled.has(active)) { const s = document.createElement('style'); s.textContent = mod.styles; document.head.appendChild(s); styled.add(active); }
                activeMod = mod;
                await mod.render(root, { go, openCoin, rerender: () => go(active) });
            } catch (e) {
                console.error(e);
                root.innerHTML = pageHead(item.group, item.label, '') + card({ eyebrow: 'Fehler', body: `<p class="sub">Diese Seite konnte nicht geladen werden: ${esc(e.message)}</p>` });
            }
        } else {
            root.innerHTML = pageHead(item.group, item.label, `Diese Seite wird gerade aus dem alten Dashboard übernommen. Dort heißt sie <b>${esc(item.alt)}</b>.`) +
                card({ eyebrow: 'In Arbeit', title: 'Kommt in der nächsten Ausbaustufe', cls: 'tint',
                    body: `<p class="sub">Daten und Funktionen bleiben vollständig erhalten. Bis dahin läuft die Seite weiter im alten Dashboard.</p>${altLink}` });
        }
        if (root.isConnected) hydrate(root);
    };
    await paint();
}
window.addEventListener('hashchange', () => go(location.hash.replace(/^#\/?/, '') || 'cockpit'));
document.addEventListener('click', e => {
    const c = e.target.closest('[data-coin]');
    if (c && !e.target.closest('[data-stop]')) { closePalette(); lastCoin = c.dataset.coin; openCoin(lastCoin); return; }
    const g = e.target.closest('[data-go]');
    if (g) { closePalette(); location.hash = '#/' + g.dataset.go; }
});
$('scrim').onclick = () => { closeCoin(); closePalette(); $('side').classList.remove('on'); $('scrim').classList.remove('on'); };
$('menuBtn').onclick = () => { $('side').classList.add('on'); $('scrim').classList.add('on'); };

/* ── Marktleiste ── */
function pills() {
    const ex = D.extras || {}, gl = ex.global || {}, btc = coin('BTC'), eth = coin('ETH');
    const fng = ex.fng_history && ex.fng_history.length ? ex.fng_history[ex.fng_history.length - 1] : null;
    const st = ex.stables || {};
    const p = (k, v, d) => `<div class="pill"><span class="k">${k}</span><span class="v">${v}</span>${d == null ? '' : `<span class="d ${cls(d)}">${fPct(d)}</span>`}</div>`;
    $('pills').innerHTML = [
        btc && `<div class="pill" data-coin="BTC" style="cursor:pointer"><span class="k">BTC</span><span class="v">${fUsd(btc.current_price)}</span><span class="d ${cls(btc.price_change_percentage_24h)}">${fPct(btc.price_change_percentage_24h)}</span></div>`,
        eth && `<div class="pill" data-coin="ETH" style="cursor:pointer"><span class="k">ETH</span><span class="v">${fUsd(eth.current_price)}</span><span class="d ${cls(eth.price_change_percentage_24h)}">${fPct(eth.price_change_percentage_24h)}</span></div>`,
        gl.total_mcap && p('Markt', fBig(gl.total_mcap), gl.mcap_chg_24h),
        gl.btc_dominance && p('BTC-Anteil', gl.btc_dominance.toFixed(1).replace('.', ',') + '%'),
        fng && p('Angst und Gier', fng.value + ' · ' + esc(fng.label || '')),
        st.total && p('Stablecoins', fBig(st.total)),
    ].filter(Boolean).join('');
}

/* ── Live-Kurse von Binance: BTC, ETH, SOL und die Watchlist ── */
async function live() {
    const syms = [...new Set(['BTC', 'ETH', 'SOL', ...watch.list()])].map(coin).filter(c => c && c.binance);
    if (!syms.length) return;
    try {
        const r = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=' + encodeURIComponent(JSON.stringify(syms.map(c => c.binance))));
        const rows = await r.json();
        if (!Array.isArray(rows)) return;
        rows.forEach(t => { const c = syms.find(x => x.binance === t.symbol); if (c) { c.current_price = +t.lastPrice; c.price_change_percentage_24h = +t.priceChangePercent; } });
        pills(); document.dispatchEvent(new CustomEvent('cb2:live'));
    } catch (e) {}
}

async function liveAlle() {
    if (document.hidden) return;
    try {
        const rows = await (await fetch('https://api.binance.com/api/v3/ticker/24hr?type=MINI')).json();
        if (!Array.isArray(rows)) return;
        const m = new Map(rows.map(t => [t.symbol, t]));
        D.coins.forEach(c => { const t = c.binance && m.get(c.binance); if (!t) return; const p = +t.lastPrice, o = +t.openPrice;
            if (p > 0) { c.current_price = p; if (o > 0) c.price_change_percentage_24h = (p / o - 1) * 100; } });
        pills(); document.dispatchEvent(new CustomEvent('cb2:live'));
    } catch (e) {}
}

/* ── Datenfrische und Refresh ── */
function fresh() {
    const s = D.status, f = $('fresh');
    if (OEFFENTLICH && !s) {
        const t = utcTs(D.coinsStand), h = t ? (Date.now() / 1000 - t) / 3600 : null;
        f.className = 'fresh' + (h == null || h > 26 ? ' tot' : h > 7 ? ' alt' : '');
        f.title = t ? 'Daten ' + ago(t) + ', Kurse oben live' : 'Kein Datenstand gefunden';
        return;
    }
    if (!s || !s.finished_ts) { f.className = 'fresh tot'; f.title = 'Kein Lauf gefunden'; return; }
    const h = (Date.now() / 1000 - s.finished_ts) / 3600;
    f.className = 'fresh' + (s.failed ? ' alt' : h > 26 ? ' tot' : h > 7 ? ' alt' : '');
    f.title = `Letzter Lauf ${ago(s.finished_ts)} (${s.mode === 'quick' ? 'schnell' : 'voll'})` + (s.failed ? `, ${s.failed} Schritte fehlgeschlagen` : '');
}

/* ── Hell und Dunkel ── */
function themeIcon() { $('themeBtn').innerHTML = icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon'); icons($('themeBtn')); }
$('themeBtn').onclick = e => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    const r = e.currentTarget.getBoundingClientRect();
    document.documentElement.style.setProperty('--vx', r.left + r.width / 2 + 'px');
    document.documentElement.style.setProperty('--vy', r.top + r.height / 2 + 'px');
    const set = () => { document.documentElement.dataset.theme = next; try { localStorage.setItem('cb2_theme', next); } catch (x) {} themeIcon(); document.dispatchEvent(new CustomEvent('cb2:theme')); };
    if (document.startViewTransition && !document.hidden) { const t = document.startViewTransition(set); [t.ready, t.finished, t.updateCallbackDone].forEach(p => p && p.catch(() => {})); } else set();
};

/* ── Suche (⌘K) ── */
let sel = 0, hits = [];
function closePalette() { $('palette').classList.remove('on'); if (!$('drawer').classList.contains('on')) $('scrim').classList.remove('on'); }
function openPalette() { $('palette').classList.add('on'); $('scrim').classList.add('on'); const i = $('paletteInput'); i.value = ''; search(''); setTimeout(() => i.focus(), 60); }
function search(q) {
    q = q.trim().toLowerCase();
    const pages = ALL.filter(p => !q || p.label.toLowerCase().includes(q) || p.alt.toLowerCase().includes(q)).slice(0, q ? 5 : 6)
        .map(p => ({ html: `<div class="li" data-go="${p.id}"><span class="ico-b">${icon(p.icon)}</span><div><div class="nm">${esc(p.label)}</div><div class="sb">${esc(p.group)}</div></div><div class="val dim">Seite</div></div>` }));
    const coins = !q ? [] : D.coins.filter(c => (c.symbol || '').toLowerCase().startsWith(q) || (c.name || '').toLowerCase().includes(q))
        .sort((a, b) => ((a.symbol.toLowerCase() === q ? 0 : 1) - (b.symbol.toLowerCase() === q ? 0 : 1)) || (a.market_cap_rank || 1e9) - (b.market_cap_rank || 1e9)).slice(0, 8)
        .map(c => ({ html: `<div class="li" data-coin="${esc(c.symbol.toUpperCase())}">${coinImg(c.image)}<div><div class="nm">${esc(c.name)}</div><div class="sb">${esc(c.symbol.toUpperCase())} · Rang ${c.market_cap_rank || '—'}</div></div><div class="val">${fUsd(c.current_price)}</div></div>` }));
    hits = [...coins, ...pages]; sel = 0;
    $('paletteRes').innerHTML = hits.map(h => h.html).join('') || '<div class="empty">Nichts gefunden.</div>';
    icons($('paletteRes')); mark();
}
function mark() { [...$('paletteRes').children].forEach((el, i) => el.classList.toggle('sel', i === sel)); const s = $('paletteRes').children[sel]; if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' }); }
$('searchBtn').onclick = openPalette;
$('paletteInput').oninput = e => search(e.target.value);
document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    if (e.key === 'Escape') { closeCoin(); closePalette(); $('side').classList.remove('on'); $('scrim').classList.remove('on'); return; }
    if (!$('palette').classList.contains('on')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(hits.length - 1, sel + 1); mark(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
    if (e.key === 'Enter') { const s = $('paletteRes').children[sel]; if (s) s.click(); }
});

/* ── Uhr und Start ── */
const tick = () => { $('clock').textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); };
tick(); setInterval(tick, 20000);
icons(); themeIcon(); pills(); fresh();
go(location.hash.replace(/^#\/?/, '') || 'cockpit');
live(); setInterval(live, 20000);
setTimeout(liveAlle, 4000); setInterval(liveAlle, 60000);
try { const r = sessionStorage.getItem('cb2_reopen'); if (r) { sessionStorage.removeItem('cb2_reopen'); lastCoin = r; setTimeout(() => openCoin(r), 400); } } catch (x) {}
