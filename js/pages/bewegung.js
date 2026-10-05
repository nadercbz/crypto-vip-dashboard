import { D } from '../core/data.js';
import { esc, fUsd, fPct } from '../core/fmt.js';
import { card, pageHead, seg, sparkFor, coinImg, empty, icon, icons } from '../core/ui.js';

const st = { tf: '24h', min: 50000000 };
const FELD = { '24h': 'price_change_percentage_24h', '7d': 'price_change_percentage_7d_in_currency', '30d': 'price_change_percentage_30d' };

function liste(coins, gewinner, feld) {
    if (!coins.length) return empty('Kein Coin passt zu diesem Filter.');
    return `<div class="list">${coins.map((c, i) => {
        const chg = c[feld] || 0, S = (c.symbol || '').toUpperCase();
        return `<div class="li bw-li" data-coin="${esc(S)}">
            ${coinImg(c.image)}
            <div style="min-width:0"><div class="nm">${esc(c.name)}</div><div class="sb">${i + 1} · ${esc(S)}</div></div>
            <div class="val"><span class="bw-spark">${sparkFor(c.symbol, 58, 20)}</span><span class="dim bw-preis">${fUsd(c.current_price)}</span>
                <span class="bw-pct ${gewinner ? 'up' : 'down'}">${fPct(chg, 2)}</span></div></div>`;
    }).join('')}</div>`;
}

function inhalt() {
    const feld = FELD[st.tf];
    const passend = D.coins.filter(c => c[feld] != null && (c.market_cap || 0) >= st.min);
    const gain = [...passend].sort((a, b) => b[feld] - a[feld]).slice(0, 12);
    const loss = [...passend].sort((a, b) => a[feld] - b[feld]).slice(0, 12);
    return { n: passend.length, html: `<div class="grid g2">
        ${card({ eyebrow: 'Stärkste', title: 'Gewinner', right: `<span class="ico-b up">${icon('trending-up')}</span>`, body: liste(gain, true, feld) })}
        ${card({ eyebrow: 'Schwächste', title: 'Verlierer', right: `<span class="ico-b down">${icon('trending-down')}</span>`, body: liste(loss, false, feld) })}
    </div>` };
}

export default {
    styles: `
        .bw-li .val { gap: 14px; }
        .bw-preis { font-size: .78rem; min-width: 84px; text-align: right; }
        .bw-pct { min-width: 78px; text-align: right; font-weight: 500; }
        .bw-filter { gap: 14px; }
        .ico-b.up { color: var(--up); } .ico-b.down { color: var(--down); }
        @media (max-width: 1180px) { .bw-spark { display: none; } }
        @media (max-width: 860px) { .bw-preis { display: none; } .bw-pct { min-width: 0; } }`,
    render(root) {
        root.classList.add('stack');
        if (!D.coins.length) {
            root.innerHTML = pageHead('Markt', 'Gewinner und Verlierer', '') + card({ body: empty('Keine Kursdaten geladen.') });
            return;
        }
        root.innerHTML = pageHead('Markt', 'Gewinner und Verlierer',
            'Wer bewegt sich am stärksten. Der Filter nach Marktgröße hält Coins draußen, die zwar prozentual explodieren, aber mangels Handelsvolumen nicht investierbar sind.',
            `<span class="eyebrow">Stand ${esc(D.coinsStand)}</span>`) +
            card({ body: `<div class="row wrap between bw-filter"><div class="row wrap bw-filter">
                ${seg('bwtf', [['24h', '24 Stunden'], ['7d', '7 Tage'], ['30d', '30 Tage']], st.tf)}
                ${seg('bwmin', [['0', 'Alle'], ['50000000', 'ab 50 Mio'], ['1000000000', 'ab 1 Mrd']], String(st.min))}
                </div><span class="eyebrow" id="bwCount"></span></div>` }) +
            `<div id="bwBody"></div>`;
        const body = root.querySelector('#bwBody'), count = root.querySelector('#bwCount');
        const draw = () => { const r = inhalt(); body.innerHTML = r.html; count.textContent = r.n + ' Coins im Filter'; icons(body); };
        const bind = (name, fn) => {
            const el = root.querySelector(`[data-seg="${name}"]`);
            el.onclick = e => { const b = e.target.closest('button'); if (!b) return; fn(b.dataset.v);
                el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
        };
        bind('bwtf', v => { st.tf = v; });
        bind('bwmin', v => { st.min = +v; });
        draw();
    },
};
