import { NAV, ALL, READY } from './nav.js?v=202610121013';
import { D, coin, watch } from './core/data.js?v=202610121013';
import { esc, fUsd, fBig, fPct, cls, ago, utcTs } from './core/fmt.js?v=202610121013';
import { icon, icons, hydrate, toast, pageHead, card, coinImg } from './core/ui.js?v=202610121013';
import * as glocke from './core/meldungen.js?v=202610121013';
import { openCoin, closeCoin } from './core/coin.js?v=202610121013';
import { kbInit } from './core/kaufbalken.js?v=202610121013';

const $ = id => document.getElementById(id);
const main = $('main');
setTimeout(() => kbInit([main, $('drawer')]), 0);
let active = null, activeMod = null, lastCoin = null;

const OEFFENTLICH = !!window.CB2_PUBLIC;
let altLink = '';

/* ── Mini-Player im Menü: Video läuft weiter, auch wenn man die Seite wechselt ── */
(function () {
    const side = $('side'), foot = side && side.querySelector('.side-foot');
    if (!side || !foot) return;
    const box = document.createElement('div');
    box.className = 'mp'; box.id = 'miniPlayer'; box.hidden = true;
    box.innerHTML = `<div class="mp-v" id="mpV"></div>
        <div class="mp-b">
            <button class="mp-pp" id="mpPP" type="button" aria-label="Pause oder Abspielen">${icon('pause')}</button>
            <div class="mp-t"><a id="mpT" target="_blank" rel="noopener"></a><span id="mpK"></span></div>
            <button class="mp-x" id="mpX" type="button" aria-label="Player schließen" title="Schließen">${icon('x')}</button>
        </div>`;
    side.insertBefore(box, foot);
    let frame = null, spielt = false, aktuell = null;
    const sende = (func, args = '') => { try { frame && frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch (e) {} };
    const knopf = () => { const b = $('mpPP'); b.innerHTML = icon(spielt ? 'pause' : 'play'); b.setAttribute('aria-pressed', String(spielt)); icons(b); box.classList.toggle('laeuft', spielt); };
    window.addEventListener('message', e => {
        if (!frame || e.source !== frame.contentWindow || typeof e.data !== 'string') return;
        let m; try { m = JSON.parse(e.data); } catch (x) { return; }
        const st = m.event === 'onStateChange' ? m.info : (m.info && m.info.playerState);
        if (st === 1) { spielt = true; knopf(); } else if (st === 2 || st === 0 || st === -1 || st === 5) { if (st === 2 || st === 0) { spielt = false; knopf(); } }
    });
    function spiele(v) {
        aktuell = v;
        box.hidden = false;
        $('mpT').textContent = v.titel || 'Video'; $('mpT').href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.id); $('mpK').textContent = v.kanal || '';
        $('mpV').innerHTML = '';
        frame = document.createElement('iframe');
        frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
        frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; frame.allowFullscreen = true; frame.title = v.titel || 'Video';
        frame.addEventListener('load', () => { try { frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) {} });
        $('mpV').appendChild(frame);
        spielt = true; knopf();
    }
    $('mpPP').onclick = () => { if (!frame) return; spielt ? sende('pauseVideo') : sende('playVideo'); spielt = !spielt; knopf(); };
    $('mpX').onclick = () => { $('mpV').innerHTML = ''; frame = null; spielt = false; box.hidden = true; box.classList.remove('laeuft'); };
    window.cb2Player = { spiele };
    icons(box);
})();

/* ── Menü ── */
$('nav').innerHTML = NAV.map(g => `<div class="nav-group eyebrow">${esc(g.group)}</div>` +
    g.items.map(i => `<a data-go="${i.id}" title="${READY.has(i.id) ? '' : 'Früher: ' + esc(i.alt)}">${icon(i.icon)}<span class="nav-l">${esc(i.label)}</span>${READY.has(i.id) ? '' : '<span class="soon">BALD</span>'}<span class="nav-i" role="button" tabindex="0" aria-label="Was ist ${esc(i.label)}?" data-tip="${esc(i.info || '')}">${icon('info')}</span></a>`).join('')).join('');

/* ── Info-Icon neben jedem Menüpunkt: Hover, Fokus oder Tippen zeigt eine kurze Erklärung ── */
(function () {
    const tip = document.createElement('div');
    tip.className = 'nav-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    document.body.appendChild(tip);
    let aktuell = null, timer = 0;
    const zu = () => { tip.classList.remove('on'); tip.hidden = true; aktuell = null; clearTimeout(timer); };
    const auf = el => {
        if (!el || !el.dataset.tip) return;
        clearTimeout(timer);
        aktuell = el;
        tip.textContent = el.dataset.tip;
        tip.hidden = false;
        const r = el.getBoundingClientRect(), w = Math.min(260, window.innerWidth - 24);
        tip.style.width = w + 'px';
        let left = r.right + 12;
        if (left + w > window.innerWidth - 12) left = Math.max(12, r.left - w - 12);
        const h = tip.offsetHeight;
        tip.style.left = left + 'px';
        tip.style.top = Math.max(12, Math.min(window.innerHeight - h - 12, r.top + r.height / 2 - h / 2)) + 'px';
        requestAnimationFrame(() => tip.classList.add('on'));
    };
    const nav = $('nav');
    nav.addEventListener('pointerover', e => { const i = e.target.closest('.nav-i'); if (i && e.pointerType !== 'touch') auf(i); });
    nav.addEventListener('pointerout', e => { if (e.target.closest('.nav-i') && e.pointerType !== 'touch') zu(); });
    nav.addEventListener('focusin', e => { const i = e.target.closest('.nav-i'); if (i) auf(i); });
    nav.addEventListener('focusout', e => { if (e.target.closest('.nav-i')) zu(); });
    nav.addEventListener('click', e => {
        const i = e.target.closest('.nav-i');
        if (!i) return;
        e.preventDefault(); e.stopPropagation();
        if (aktuell === i) { zu(); return; }
        auf(i);
        timer = setTimeout(zu, 5000);
    }, true);
    nav.addEventListener('keydown', e => { if (e.key === 'Escape') zu(); if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.nav-i')) { e.preventDefault(); e.stopPropagation(); auf(e.target.closest('.nav-i')); } }, true);
    document.addEventListener('pointerdown', e => { if (aktuell && !e.target.closest('.nav-i')) zu(); });
    nav.addEventListener('scroll', zu, { passive: true });
})();

/* ── Leiste unten auf dem Handy: die vier meistgenutzten Seiten plus Menü ── */
const TABS = ['cockpit', 'signale', 'kurse', 'radar'].map(id => ALL.find(i => i.id === id)).filter(Boolean);
$('tabbar').innerHTML = TABS.map(t => `<a data-go="${t.id}" data-tab="${t.id}">${icon(t.icon)}<span>${esc({ cockpit: 'Cockpit', signale: 'Signale', kurse: 'Kurse', radar: 'Radar' }[t.id] || t.label)}</span></a>`).join('') +
    `<button id="tabMenu" type="button">${icon('menu')}<span>Menü</span></button>`;
$('tabMenu').onclick = () => { $('side').classList.add('on'); $('scrim').classList.add('on'); };

/* ── Seitenwechsel ── */
const styled = new Set();
async function go(id) {
    const item = ALL.find(i => i.id === id) || ALL[0];
    if (activeMod && activeMod.destroy) try { activeMod.destroy(); } catch (e) {}
    active = item.id; activeMod = null;
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.go === active));
    document.querySelectorAll('#tabbar [data-tab]').forEach(a => a.classList.toggle('on', a.dataset.tab === active));
    $('scrim').classList.remove('on');
    $('side').classList.remove('on');
    document.title = item.label + (OEFFENTLICH ? ' · Crypto Biz' : ' · Crypto Biz 2.0');
    const root = document.createElement('div');
    root.className = 'page'; root.dataset.page = active;
    main.replaceChildren(root); main.scrollTop = 0;
    const paint = async () => {
        if (READY.has(active)) {
            try {
                const mod = (await import(`./pages/${active}.js?v=202610121013`)).default;
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
/* ── Klick auf das Logo eines Coins öffnet überall die Detailansicht ── */
let logoMap = null;
const logoKey = u => String(u || '').split('?')[0];
function logoCoin(img) {
    if (!img || img.tagName !== 'IMG') return null;
    if (img.closest('.cd, .coin-detail, #cd, #coinD, [data-stop]')) return null;
    if (!logoMap || logoMap.n !== D.coins.length) {
        logoMap = new Map(); logoMap.n = D.coins.length;
        D.coins.forEach(c => { if (c.image && !logoMap.has(logoKey(c.image))) logoMap.set(logoKey(c.image), (c.symbol || '').toUpperCase()); });
    }
    return logoMap.get(logoKey(img.getAttribute('src'))) || null;
}
document.addEventListener('pointerover', e => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && !t.dataset.logo) { const s = logoCoin(t); t.dataset.logo = s ? '1' : '0'; if (s) { t.style.cursor = 'pointer'; if (!t.title) t.title = s + ' öffnen'; } }
}, true);
document.addEventListener('click', e => {
    const s = logoCoin(e.target);
    if (!s) return;
    e.preventDefault(); e.stopPropagation();
    closePalette(); lastCoin = s; openCoin(s);
}, true);
document.addEventListener('click', e => {
    const c = e.target.closest('[data-coin]');
    if (c && !e.target.closest('[data-stop]')) { closePalette(); lastCoin = c.dataset.coin; openCoin(lastCoin); return; }
    const tk = e.target.closest('[data-tk]');
    if (tk && !e.target.closest('a, details, [data-stop]')) { const [ch, tok] = tk.dataset.tk.split('|'); import('./pages/signale.js?v=202610121013').then(m => { if (m.default.styles && !styled.has('signale')) { const st = document.createElement('style'); st.textContent = m.default.styles; document.head.appendChild(st); styled.add('signale'); } m.openToken(ch, tok); }); return; }
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

/* ── Live-Kurse in Echtzeit: Binance-WebSocket (kostenlos, ohne Schlüssel) ──
   Abonniert BTC, ETH, SOL, die Watchlist und den gerade geöffneten Coin als
   Mini-Ticker. Binance schickt Änderungen etwa jede Sekunde, die Oberfläche
   wird höchstens alle 1,5 Sekunden neu gezeichnet. Bricht die Verbindung ab,
   übernimmt der Abruf alle 20 Sekunden, und nach kurzer Pause wird neu verbunden.
   Im Hintergrund-Tab ist die Verbindung zu, das spart Akku und Daten. */
const WS = { sock: null, abo: new Set(), fokus: null, offen: false, timer: 0, zeichnen: 0, versuch: 0, nachrichten: 0 };
window.CB2_WS = WS;   // zur Fehlersuche in der Konsole: CB2_WS.offen, CB2_WS.abo, CB2_WS.nachrichten
function wsWunsch() {
    const syms = new Set(['BTC', 'ETH', 'SOL', ...watch.list()]);
    if (WS.fokus) syms.add(WS.fokus);
    return new Set([...syms].map(coin).filter(c => c && c.binance).map(c => c.binance.toLowerCase() + '@miniTicker'));
}
function wsAbgleich() {
    if (!WS.sock || WS.sock.readyState !== 1) return;
    const soll = wsWunsch(), neu = [...soll].filter(x => !WS.abo.has(x)), weg = [...WS.abo].filter(x => !soll.has(x));
    if (neu.length) WS.sock.send(JSON.stringify({ method: 'SUBSCRIBE', params: neu, id: Date.now() % 1e6 }));
    if (weg.length) WS.sock.send(JSON.stringify({ method: 'UNSUBSCRIBE', params: weg, id: (Date.now() + 1) % 1e6 }));
    WS.abo = soll;
}
function wsAuf() {
    if (WS.sock || document.hidden || !('WebSocket' in window)) return;
    let s;
    try { s = new WebSocket('wss://stream.binance.com:9443/ws'); } catch (e) { return; }
    WS.sock = s; WS.abo = new Set();
    s.onopen = () => { WS.offen = true; WS.versuch = 0; wsAbgleich(); };
    s.onmessage = ev => {
        let t; try { t = JSON.parse(ev.data); } catch (e) { return; }
        if (!t || t.e !== '24hrMiniTicker') return;
        WS.nachrichten++;
        const p = +t.c, o = +t.o;
        D.coins.forEach(c => { if (c.binance === t.s && p > 0) { c.current_price = p; if (o > 0) c.price_change_percentage_24h = (p / o - 1) * 100; } });
        if (!WS.zeichnen) WS.zeichnen = setTimeout(() => { WS.zeichnen = 0; pills(); document.dispatchEvent(new CustomEvent('cb2:live')); }, 1500);
    };
    s.onclose = () => {
        WS.sock = null; WS.offen = false;
        if (!document.hidden) { WS.versuch++; clearTimeout(WS.timer); WS.timer = setTimeout(wsAuf, Math.min(30000, 2000 * WS.versuch)); }
    };
    s.onerror = () => { try { s.close(); } catch (e) {} };
}
function wsZu() { clearTimeout(WS.timer); if (WS.sock) { const s = WS.sock; WS.sock = null; s.onclose = null; try { s.close(); } catch (e) {} } WS.offen = false; }
document.addEventListener('visibilitychange', () => { if (document.hidden) wsZu(); else { wsAuf(); live(); } });
document.addEventListener('cb2:watch', wsAbgleich);
document.addEventListener('cb2:fokus', e => { WS.fokus = e.detail || null; wsAbgleich(); });

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
    const mehr = q.length >= 2 ? inhalte(q) : [];
    hits = [...coins, ...mehr, ...pages]; sel = 0;
    $('paletteRes').innerHTML = hits.map(h => h.html).join('') || '<div class="empty">Nichts gefunden.</div>';
    icons($('paletteRes')); mark();
}
function inhalte(q) {
    const out = [], lies = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
    const stelle = (txt, q) => { const i = txt.toLowerCase().indexOf(q); if (i < 0) return ''; const a = Math.max(0, i - 30);
        return (a ? '…' : '') + txt.slice(a, i + q.length + 50).replace(/\s+/g, ' ') + (i + q.length + 50 < txt.length ? '…' : ''); };
    const zeile = (attr, ic, titel, sub, art) => ({ html: `<div class="li" ${attr}><span class="ico-b">${icon(ic)}</span><div style="min-width:0"><div class="nm">${esc(titel)}</div><div class="sb" style="font-family:var(--font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(sub)}</div></div><div class="val dim">${art}</div></div>` });
    const ts = window.TAGESSIGNALE_DATA;
    if (ts && ts.ergebnis) Object.keys(ts.ergebnis).forEach(ch => ['signale', 'beobachten'].forEach(k => (ts.ergebnis[ch][k] || []).forEach(x => {
        if ((x.symbol || '').toLowerCase().includes(q) || (x.name || '').toLowerCase().includes(q))
            out.push(zeile('data-go="signale"', 'crosshair', x.symbol + ' · ' + x.name, `${(ts.chains || {})[ch] || ch}, Score ${Math.round(x.score)}${k === 'beobachten' ? ', beobachten' : ''}`, 'Signal'));
    })));
    let notizen = {}; try { notizen = JSON.parse(lies('c2_watch_notes') || '{}') || {}; } catch (e) {}
    Object.entries(notizen).forEach(([sym, t]) => {
        if (sym.toLowerCase().includes(q) || String(t).toLowerCase().includes(q))
            out.push(zeile(`data-coin="${esc(sym)}"`, 'sticky-note', 'Notiz zu ' + sym, stelle(String(t), q) || String(t).slice(0, 80), 'Notiz'));
    });
    [['c2_notes_general', 'General Notes'], ['c2_notes_buys', 'Buy Zone']].forEach(([k, n]) => {
        const t = lies(k); if (t && t.toLowerCase().includes(q)) out.push(zeile('data-go="notizen"', 'pencil-line', n, stelle(t, q), 'Notiz'));
    });
    ((D.tagebuch && D.tagebuch.eintraege) || []).forEach(e => {
        const txt = JSON.stringify(e).toLowerCase();
        if (txt.includes(q)) out.push(zeile('data-go="tagebuch"', 'book-open', e.titel || e.datum, (e.datum || '').split('-').reverse().join('.') + ' · ' + (stelle(e.titel + ' ' + (e.fazit || e.quelle || ''), q) || 'Treffer im Eintrag'), 'Tagebuch'));
    });
    return out.slice(0, 8);
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


/* ── Meldungen (Glocke) ── */
$('bellBtn').onclick = e => { e.stopPropagation(); glocke.umschalten(); };
document.addEventListener('click', e => {
    const p = $('bellPanel');
    if (!p.classList.contains('on') || e.target.closest('#bellBtn')) return;
    if (!e.target.closest('#bellPanel') || e.target.closest('[data-go],[data-coin]')) glocke.umschalten(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') glocke.umschalten(false); });
document.addEventListener('cb2:live', () => glocke.badge());
glocke.badge();


/* ── Uhr und Start ── */
const tick = () => { $('clock').textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); };
tick(); setInterval(tick, 20000);
icons(); themeIcon(); pills(); fresh();
go(location.hash.replace(/^#\/?/, '') || 'cockpit');
live(); setInterval(() => { if (!WS.offen) live(); }, 20000); wsAuf();
setTimeout(liveAlle, 4000); setInterval(liveAlle, 60000);
try { const r = sessionStorage.getItem('cb2_reopen'); if (r) { sessionStorage.removeItem('cb2_reopen'); lastCoin = r; setTimeout(() => openCoin(r), 400); } } catch (x) {}
