import { D, coin, watch } from '../core/data.js?v=202610080950';
import { esc, fUsd, fBig, fNum, fPct, cls } from '../core/fmt.js?v=202610080950';
import { card, pageHead, coinImg, pct, seg, chip, icon, icons, empty, sparkline } from '../core/ui.js?v=202610080950';

const BATCH = 120;
const st = { q: '', cat: 'Alle', view: 'mcap', sort: 'market_cap_rank', dir: 1, n: BATCH };
const VIEWS = { mcap: ['market_cap_rank', 1], gain: ['price_change_percentage_24h', -1], loss: ['price_change_percentage_24h', 1], watch: ['market_cap_rank', 1] };
const COLS = [['market_cap_rank', '#', ''], ['name', 'Coin', ''], ['current_price', 'Kurs', 'r'], ['price_change_percentage_24h', '24h', 'r'],
    ['price_change_percentage_7d_in_currency', '7 Tage', 'r'], ['price_change_percentage_30d', '30 Tage', 'r'], ['market_cap', 'Marktkap.', 'r'],
    ['total_volume', 'Volumen', 'r'], ['dominanz', 'Dominanz', 'r'], ['ath_change_percentage', 'Zum Hoch', 'r']];

let io = null, onLive = null, sigMap = null, total = 0;

function spark(sym) {
    const k = String(sym || '').toLowerCase();
    if (!sigMap) { sigMap = new Map(); ((D.signals && D.signals.coins) || []).forEach(r => { if (!sigMap.has(r.symbol)) sigMap.set(r.symbol, r); }); }
    const r = sigMap.get(k);
    let werte = r && r.spark && r.spark.length >= 3 ? r.spark : null;
    if (!werte) {
        const reihe = D.series && D.series.coins && D.series.coins[k];
        if (reihe) {
            const g = reihe.filter(v => v != null);
            if (g.length >= 3) { const basis = g[0] || 1; werte = g.map(v => (v / basis - 1) * 100); }
        }
    }
    return werte ? sparkline(werte, 68, 22) : '';
}

function rows() {
    const q = st.q.toLowerCase(), wl = new Set(watch.list());
    const r = D.coins.filter(c => (st.cat === 'Alle' || c.cat === st.cat) &&
        (st.view !== 'watch' || wl.has((c.symbol || '').toUpperCase())) &&
        (!q || (c.name || '').toLowerCase().includes(q) || (c.symbol || '').toLowerCase().includes(q)));
    const k = st.sort === 'dominanz' ? 'market_cap' : st.sort;
    r.sort((a, b) => {
        const x = a[k], y = b[k];
        if (x == null) return 1; if (y == null) return -1;
        return (typeof x === 'string' ? x.localeCompare(y) : x - y) * st.dir;
    });
    return r;
}
function zeile(c, wl) {
    const S = (c.symbol || '').toUpperCase();
    const dom = total ? fNum((c.market_cap || 0) / total * 100, 2) + '%' : '—';
    return `<tr data-coin="${esc(S)}" data-id="${esc(c.id || '')}">
        <td data-stop><button class="kr-star ${wl.has(S) ? 'on' : ''}" data-star="${esc(S)}" title="Watchlist">${icon('star')}</button></td>
        <td class="dim mono">${c.market_cap_rank || '—'}</td>
        <td><div class="row" style="gap:10px">${coinImg(c.image)}<b style="font-weight:500">${esc(c.name)}</b><span class="dim mono" style="font-size:.72rem">${esc(S)}</span>${c.cat && c.cat !== 'Other' ? chip(c.cat) : ''}</div></td>
        <td class="r kr-p">${fUsd(c.current_price)}</td><td class="r kr-d">${pct(c.price_change_percentage_24h, 2)}</td><td class="r">${pct(c.price_change_percentage_7d_in_currency, 2)}</td>
        <td class="r"><span class="kr-30">${spark(c.symbol)}${pct(c.price_change_percentage_30d)}</span></td>
        <td class="r dim">${fBig(c.market_cap)}</td><td class="r dim">${fBig(c.total_volume)}</td><td class="r dim">${dom}</td><td class="r">${pct(c.ath_change_percentage, 0)}</td></tr>`;
}
const fuss = all => `<span class="eyebrow">${Math.min(st.n, all.length)} von ${all.length} Coins</span>${all.length > st.n ? `<button class="btn soft" id="krMore">${all.length - st.n} weitere Coins laden</button>` : ''}`;
function tabelle(all) {
    const wl = new Set(watch.list());
    if (!all.length) return empty(st.view === 'watch' && !wl.size ? 'Deine Watchlist ist leer. Setz einen Stern in der Market-Cap-Ansicht.' : 'Kein Coin passt zu diesem Filter.');
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th>${COLS.map(([k, l, c]) => `<th data-sort="${k}" class="${c}">${l}${st.sort === k ? (st.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('')}</tr></thead><tbody id="krBody">
        ${all.slice(0, st.n).map(c => zeile(c, wl)).join('')}
        </tbody></table></div>
        <div class="row between" style="margin-top:16px" id="krFuss">${fuss(all)}</div>`;
}

function leiste() {
    const list = watch.list();
    if (!list.length) return `<span class="dim" style="font-size:.82rem">Noch keine Watchlist. Klick den Stern neben einem Coin.</span>`;
    return list.map(sym => {
        const c = coin(sym), chg = c ? (c.price_change_percentage_24h || 0) : null;
        return `<div class="kr-pill" data-coin="${esc(sym)}"><b class="mono">${esc(sym)}</b><span class="num">${c ? fUsd(c.current_price) : '—'}</span>
            <span class="mono ${chg == null ? 'dim' : chg >= 0 ? 'up' : 'down'}">${chg == null ? '' : fPct(chg, 1)}</span>
            <button class="kr-x" data-stop data-unwatch="${esc(sym)}" title="Entfernen">${icon('x')}</button></div>`;
    }).join('');
}

export default {
    styles: `.kr-star { color: var(--ink-3); display: grid; place-items: center; transition: transform .25s var(--ease-spring), color .2s; } .kr-star svg { width: 15px; height: 15px; }
        .kr-star:hover { transform: scale(1.25); color: var(--ink); } .kr-star.on { color: var(--warn); } .kr-star.on svg { fill: currentColor; }
        .kr-strip { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
        .kr-pill { display: inline-flex; align-items: center; gap: 10px; padding: 8px 8px 8px 14px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); font-size: .8rem; cursor: pointer; transition: transform .25s var(--ease); }
        .kr-pill:hover { transform: translateY(-1px); }
        .kr-x { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; color: var(--ink-3); transition: color .2s, background .2s; }
        .kr-x:hover { color: var(--down); background: color-mix(in srgb, var(--down) 14%, transparent); } .kr-x svg { width: 12px; height: 12px; }
        .kr-30 { display: inline-flex; align-items: center; gap: 10px; justify-content: flex-end; }
        @media (max-width: 860px) { .kr-30 .spark { display: none; } }`,
    render(root) {
        sigMap = null;
        total = D.coins.reduce((s, c) => s + (c.market_cap || 0), 0);
        const cats = ['Alle', ...[...new Set(D.coins.map(c => c.cat).filter(c => c && c !== 'Other'))].sort()];
        root.classList.add('stack');
        root.innerHTML = pageHead('Markt', 'Alle Kurse', `Alle ${D.coins.length} Coins mit Preis, Momentum und Dominanz. Sortier per Klick auf die Spalte oder such direkt. Stern setzen für deine Watchlist.`,
            `<span class="eyebrow">Stand ${esc(D.coinsStand)}</span>`) +
            card({ body: `<div class="kr-strip" id="krStrip">${leiste()}</div>
                <div class="filterleiste"><div class="row wrap" style="margin-bottom:12px;gap:14px"><div style="flex:1;min-width:220px;max-width:340px"><input class="input" id="krQ" placeholder="Coin suchen (Name oder Symbol)" value="${esc(st.q)}"></div>
                    ${seg('krview', [['mcap', 'Market Cap'], ['gain', 'Top Gainer'], ['loss', 'Top Loser'], ['watch', '★ Watchlist']], st.view)}<span class="eyebrow" id="krCount"></span></div>
                <div>${seg('krcat', cats.map(c => [c, c]), st.cat)}</div></div><div id="krTab" style="margin-top:16px"></div>` });
        const tab = root.querySelector('#krTab'), strip = root.querySelector('#krStrip'), count = root.querySelector('#krCount');
        let all = [];
        const beobachte = () => {
            if (io) { io.disconnect(); io = null; }
            const b = tab.querySelector('#krMore');
            if (b && typeof IntersectionObserver !== 'undefined') { io = new IntersectionObserver(e => { if (e.some(x => x.isIntersecting)) mehr(); }, { rootMargin: '500px' }); io.observe(b); }
        };
        const draw = () => { all = rows(); tab.innerHTML = tabelle(all); count.textContent = all.length + ' Coins'; icons(tab); beobachte(); };
        const mehr = () => {
            const body = tab.querySelector('#krBody'); if (!body || st.n >= all.length) return;
            const wl = new Set(watch.list()), von = st.n; st.n += BATCH;
            body.insertAdjacentHTML('beforeend', all.slice(von, st.n).map(c => zeile(c, wl)).join(''));
            tab.querySelector('#krFuss').innerHTML = fuss(all); icons(tab); beobachte();
        };
        const leisteNeu = () => { strip.innerHTML = leiste(); icons(strip); };
        root.querySelector('#krQ').oninput = e => { st.q = e.target.value; st.n = BATCH; draw(); };
        root.querySelector('[data-seg="krcat"]').onclick = e => { const b = e.target.closest('button'); if (!b) return; st.cat = b.dataset.v; st.n = BATCH;
            root.querySelectorAll('[data-seg="krcat"] button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
        const viewSeg = root.querySelector('[data-seg="krview"]');
        const viewMark = () => viewSeg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.v === st.view));
        viewSeg.onclick = e => { const b = e.target.closest('button'); if (!b) return; st.view = b.dataset.v; [st.sort, st.dir] = VIEWS[st.view]; st.n = BATCH; viewMark(); draw(); };
        strip.onclick = e => { const x = e.target.closest('[data-unwatch]'); if (!x) return; e.stopPropagation(); watch.toggle(x.dataset.unwatch); leisteNeu(); draw(); };
        tab.onclick = e => {
            const s = e.target.closest('[data-star]');
            if (s) { e.stopPropagation(); const an = watch.toggle(s.dataset.star); leisteNeu();
                if (st.view === 'watch') draw(); else tab.querySelectorAll(`[data-star="${CSS.escape(s.dataset.star)}"]`).forEach(x => x.classList.toggle('on', an));
                return; }
            const h = e.target.closest('th[data-sort]');
            if (h) { const k = h.dataset.sort; st.sort === k ? st.dir *= -1 : (st.sort = k, st.dir = k === 'market_cap_rank' || k === 'name' ? 1 : -1);
                if (st.view !== 'watch') { st.view = Object.keys(VIEWS).find(v => v !== 'watch' && VIEWS[v][0] === st.sort && VIEWS[v][1] === st.dir) || ''; viewMark(); }
                st.n = BATCH; draw(); return; }
            if (e.target.closest('#krMore')) mehr();
        };
        onLive = () => {
            if (!root.isConnected) return;
            tab.querySelectorAll('tr[data-coin]').forEach(tr => {
                const c = coin(tr.dataset.coin); if (!c || (c.id || '') !== tr.dataset.id) return;
                const p = tr.querySelector('.kr-p'), d = tr.querySelector('.kr-d');
                if (p) p.textContent = fUsd(c.current_price);
                if (d) d.innerHTML = pct(c.price_change_percentage_24h, 2);
            });
            leisteNeu();
        };
        document.addEventListener('cb2:live', onLive);
        draw();
    },
    destroy() {
        if (io) { io.disconnect(); io = null; }
        if (onLive) { document.removeEventListener('cb2:live', onLive); onLive = null; }
    },
};
