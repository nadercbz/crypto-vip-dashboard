import { D, store } from '../core/data.js?v=202610101938';
import { esc, fUsd, fBig, fPct, fNum, cls } from '../core/fmt.js?v=202610101938';
import { card, pageHead, seg, scoreBadge, coinImg, empty, icon, icons } from '../core/ui.js?v=202610101938';

const ARENA_KEY = 'c2_arena_elo_v1';
const DEFAULT_ELO = 1200;
const PAGE_SIZE = 50;
const st = { page: 0, sort: { key: 'elo', dir: 1 }, filter: 'rated', search: '' };
const COLS = [['rank', '#', ''], ['name', 'Coin', ''], ['elo', 'ELO', 'r'], ['wins', 'S', 'r'], ['losses', 'N', 'r'],
    ['winrate', 'Siegquote', 'r'], ['mcap', 'Marktkap.', 'r'], ['price', 'Kurs', 'r']];

function auto() {
    const rows = (D.signals && D.signals.coins) || [];
    if (!rows.length) return empty('Die Signal-Engine ist noch nicht gelaufen.');
    const listen = [
        { titel: 'Höchster Gesamt-Score', sort: (a, b) => (b.score || 0) - (a.score || 0), wert: r => scoreBadge(r.score) },
        { titel: 'Stärkster Trend', sort: (a, b) => ((b.parts || {}).trend || 0) - ((a.parts || {}).trend || 0),
          wert: r => `<span class="${cls(r.chg30)}">${fPct(r.chg30)}</span>` },
        { titel: 'Ruhigster Verlauf', sort: (a, b) => (a.vol30 == null ? 1e9 : a.vol30) - (b.vol30 == null ? 1e9 : b.vol30),
          wert: r => r.vol30 != null ? fNum(r.vol30, 0) + '%' : '—' },
        { titel: 'Am weitesten vom Hoch', sort: (a, b) => (a.dd90 == null ? 1 : a.dd90) - (b.dd90 == null ? 1 : b.dd90),
          wert: r => `<span class="down">${r.dd90 != null ? fPct(r.dd90, 0) : '—'}</span>` },
    ];
    return `<div class="bl-auto">${listen.map(l => {
        const top = rows.filter(r => r.score != null).slice().sort(l.sort).slice(0, 6);
        return `<div class="bl-card"><div class="eyebrow">${l.titel}</div>${top.map((r, i) => {
            const S = String(r.symbol || '').toUpperCase();
            return `<div class="bl-zeile" data-coin="${esc(S)}"><span class="n">${i + 1}</span><span class="s">${esc(S)}</span><span class="w">${l.wert(r)}</span></div>`;
        }).join('')}</div>`;
    }).join('')}</div>`;
}

function ranked(elo) {
    let list = D.coins.map(c => {
        const e = elo[c.id] || { elo: DEFAULT_ELO, wins: 0, losses: 0, battles: 0 };
        return { id: c.id, name: c.name, symbol: c.symbol, image: c.image, price: c.current_price, mcap: c.market_cap,
            elo: e.elo, wins: e.wins, losses: e.losses, battles: e.battles,
            winrate: e.battles > 0 ? (e.wins / e.battles * 100) : 0, rated: e.battles > 0 };
    });
    if (st.filter === 'rated') list = list.filter(c => c.rated);
    if (st.search) {
        const q = st.search.toLowerCase();
        list = list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.symbol || '').toLowerCase().includes(q));
    }
    const { key, dir } = st.sort;
    list.sort((a, b) => {
        const va = a[key], vb = b[key];
        if (typeof va === 'string') return dir * va.localeCompare(vb);
        return dir * ((vb || 0) - (va || 0));
    });
    return list;
}

function tabelle() {
    const v = store.get(ARENA_KEY, {});
    const list = ranked(v && typeof v === 'object' ? v : {});
    if (!list.length) {
        return { count: 0, html: `<div class="empty">${st.filter === 'rated' && !st.search
            ? `Keine gewerteten Coins. Starte ein Duell im Coin-Duell.<div style="margin-top:16px"><a class="btn soft" data-go="duell" style="cursor:pointer">${icon('swords')}Zum Coin-Duell</a></div>`
            : 'Kein Coin passt zu dieser Suche.'}</div>` };
    }
    const totalPages = Math.ceil(list.length / PAGE_SIZE);
    if (st.page >= totalPages) st.page = totalPages - 1;
    if (st.page < 0) st.page = 0;
    const start = st.page * PAGE_SIZE;
    const pfeil = k => st.sort.key === k ? (st.sort.dir > 0 ? ' ↓' : ' ↑') : '';
    const html = `<div class="tbl-wrap"><table class="tbl"><thead><tr>${COLS.map(([k, l, c]) =>
        `<th class="${c}"${k === 'rank' || k === 'name' ? '' : ` data-sort="${k}"`}>${l}${pfeil(k)}</th>`).join('')}</tr></thead><tbody>
        ${list.slice(start, start + PAGE_SIZE).map((c, i) => {
            const rank = start + i + 1, S = (c.symbol || '').toUpperCase();
            const wr = c.battles > 0 ? fNum(c.winrate, 1) + '%' : '—';
            const wrCol = c.winrate >= 60 ? 'var(--up)' : c.winrate >= 40 ? 'var(--ink-2)' : 'var(--down)';
            return `<tr data-coin="${esc(S)}">
                <td class="mono"><span class="bl-rank ${rank <= 3 ? 'p' + rank : ''}">${rank}</span></td>
                <td><div class="row" style="gap:10px">${coinImg(c.image)}<b style="font-weight:500">${esc(c.name)}</b><span class="dim mono" style="font-size:.72rem">${esc(S)}</span></div></td>
                <td class="r" style="font-weight:600">${c.elo}</td><td class="r up">${c.wins}</td><td class="r down">${c.losses}</td>
                <td class="r" style="color:${wrCol}">${wr}</td><td class="r dim">${fBig(c.mcap)}</td><td class="r">${fUsd(c.price)}</td></tr>`;
        }).join('')}</tbody></table></div>
        <div class="row" style="justify-content:center;gap:16px;margin-top:18px">
            <button class="btn soft" id="blPrev"${st.page <= 0 ? ' disabled' : ''}>Zurück</button>
            <span class="eyebrow">${st.page + 1} / ${totalPages}</span>
            <button class="btn soft" id="blNext"${st.page >= totalPages - 1 ? ' disabled' : ''}>Weiter</button>
        </div>`;
    return { count: list.length, html };
}

export default {
    styles: `
        .bl-auto { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .bl-card { padding: 18px 16px 10px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); }
        .bl-card .eyebrow { margin: 0 6px 10px; }
        .bl-zeile { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 8px 6px; border-radius: 10px; cursor: pointer;
            transition: background .2s var(--ease), transform .25s var(--ease); }
        .bl-zeile:hover { background: color-mix(in srgb, var(--ink) 5%, transparent); transform: translateX(3px); }
        .bl-zeile .n { font-family: var(--mono); font-size: .68rem; color: var(--ink-3); }
        .bl-zeile .s { font-size: .88rem; font-weight: 500; }
        .bl-zeile .w { font-family: var(--mono); font-size: .78rem; }
        .bl-filter { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
        .bl-rank { display: inline-grid; place-items: center; min-width: 26px; height: 24px; padding: 0 6px; border-radius: 8px; color: var(--ink-3); font-size: .78rem; }
        .bl-rank.p1 { color: var(--warn); background: color-mix(in srgb, var(--warn) 16%, transparent); font-weight: 600; }
        .bl-rank.p2 { color: var(--ink-2); background: color-mix(in srgb, var(--ink-2) 14%, transparent); font-weight: 600; }
        .bl-rank.p3 { color: var(--a4); background: color-mix(in srgb, var(--a4) 14%, transparent); font-weight: 600; }
        #blTab .btn[disabled] { opacity: .4; pointer-events: none; }
        @media (max-width: 1180px) { .bl-auto { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 860px) { .bl-auto { grid-template-columns: minmax(0, 1fr); } }`,
    render(root) {
        root.classList.add('stack');
        root.innerHTML = pageHead('Trading', 'Bestenliste', 'Zwei Bestenlisten: die gemessene aus der Signal-Engine und deine eigene aus den Coin-Duellen. Wo beide auseinanderlaufen, lohnt ein zweiter Blick.') +
            card({ eyebrow: 'Signal-Engine', title: 'Gemessen', body: auto() }) +
            card({ eyebrow: 'Deine Duell-Wertung', title: 'ELO aus dem Coin-Duell', body: `
                <div class="bl-filter">
                    <div style="flex:1;min-width:200px;max-width:320px"><input class="input" id="blQ" type="text" placeholder="Coin suchen..." value="${esc(st.search)}"></div>
                    ${seg('blfilter', [['rated', 'Gewertet'], ['all', 'Alle']], st.filter)}
                    <span class="eyebrow" id="blCount"></span>
                </div>
                <div id="blTab"></div>` });

        const tab = root.querySelector('#blTab'), count = root.querySelector('#blCount');
        const draw = () => { const t = tabelle(); tab.innerHTML = t.html; count.textContent = t.count + ' Coins'; icons(tab); };
        root.querySelector('#blQ').oninput = e => { st.search = e.target.value; st.page = 0; draw(); };
        root.querySelector('[data-seg="blfilter"]').onclick = e => {
            const b = e.target.closest('button');
            if (!b) return;
            st.filter = b.dataset.v; st.page = 0;
            root.querySelectorAll('[data-seg="blfilter"] button').forEach(x => x.classList.toggle('on', x === b));
            draw();
        };
        tab.onclick = e => {
            const h = e.target.closest('th[data-sort]');
            if (h) {
                const key = h.dataset.sort;
                if (st.sort.key === key) st.sort.dir *= -1;
                else { st.sort.key = key; st.sort.dir = -1; }
                draw(); return;
            }
            if (e.target.closest('#blPrev')) { st.page--; draw(); return; }
            if (e.target.closest('#blNext')) { st.page++; draw(); }
        };
        draw();
    },
};
