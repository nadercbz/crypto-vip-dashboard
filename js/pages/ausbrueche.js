import { D } from '../core/data.js?v=202610060140';
import { esc, fUsd, fNum } from '../core/fmt.js?v=202610060140';
import { card, pageHead, seg, coinImg, pct, chip, empty } from '../core/ui.js?v=202610060140';

let brkFilter = 'all';

function computeBreakouts(db) {
    return db.filter(c => c.price_change_percentage_24h != null && c.price_change_percentage_7d_in_currency != null)
        .map(c => {
            const chg24 = c.price_change_percentage_24h || 0;
            const chg7 = c.price_change_percentage_7d_in_currency || 0;
            const avg7d = chg7 / 7;
            const accel = chg24 - avg7d; // Wie stark heute gegen den Wochenschnitt
            const vm = (c.total_volume && c.market_cap) ? c.total_volume / c.market_cap : 0;
            let signal = 'cool', signalText = 'NEUTRAL';
            if (accel > 5 && chg24 > 3 && vm > 0.03) { signal = 'hot'; signalText = 'BREAKOUT'; }
            else if (accel > 3 && chg24 > 1) { signal = 'warm'; signalText = 'MOMENTUM'; }
            else if (chg24 > 5 && chg7 < -5) { signal = 'warm'; signalText = 'DIP RECOVERY'; }
            else if (vm > 0.06 && chg24 > 2) { signal = 'hot'; signalText = 'VOL SPIKE'; }
            return { ...c, accel, vm, signal, signalText };
        });
}

const SIG_FARBE = { hot: 'var(--up)', warm: 'var(--warn)', cool: 'var(--ink-3)' };
const athFarbe = p => p == null ? 'var(--ink-3)' : p >= -20 ? 'var(--up)' : p >= -50 ? 'var(--warn)' : 'var(--down)';

function inhalt() {
    const all = computeBreakouts(D.coins);
    if (!all.length) return empty('Keine Kursdaten geladen.');
    let filtered;
    if (brkFilter === 'accel') filtered = all.filter(c => c.accel > 3).sort((a, b) => b.accel - a.accel);
    else if (brkFilter === 'volspike') filtered = all.filter(c => c.vm > 0.04 && c.price_change_percentage_24h > 0).sort((a, b) => b.vm - a.vm);
    else if (brkFilter === 'dip') filtered = all.filter(c => c.price_change_percentage_24h > 3 && c.price_change_percentage_7d_in_currency < -3).sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    else filtered = all.filter(c => c.signal !== 'cool').sort((a, b) => b.accel - a.accel);
    if (brkFilter === 'all' && filtered.length === 0) filtered = [...all].sort((a, b) => b.accel - a.accel).slice(0, 30);
    const top = filtered.slice(0, 50);

    const hotCount = all.filter(c => c.signal === 'hot').length;
    const warmCount = all.filter(c => c.signal === 'warm').length;
    const bestAccel = all.reduce((best, c) => c.accel > best.accel ? c : best, all[0]);
    const bestSym = bestAccel ? (bestAccel.symbol || '').toUpperCase() : '';
    const box = (label, wert, farbe, attr = '') => `<div class="card sunk ab-stat" ${attr}><div class="eyebrow">${label}</div>
        <div class="big num" style="margin-top:6px;${farbe ? 'color:' + farbe : ''}">${wert}</div></div>`;

    const zeilen = top.map((c, i) => {
        const S = (c.symbol || '').toUpperCase();
        const accelCol = c.accel >= 5 ? 'var(--up)' : c.accel >= 2 ? 'var(--warn)' : 'var(--ink-3)';
        const athP = c.ath_change_percentage;
        return `<tr data-coin="${esc(S)}">
            <td class="dim mono">${i + 1}</td>
            <td><div class="row" style="gap:10px">${coinImg(c.image)}<b style="font-weight:500">${esc(c.name)}</b><span class="dim mono" style="font-size:.72rem">${esc(S)}</span></div></td>
            <td class="r">${fUsd(c.current_price)}</td>
            <td class="r">${pct(c.price_change_percentage_24h || 0, 2)}</td>
            <td class="r">${pct(c.price_change_percentage_7d_in_currency || 0, 2)}</td>
            <td class="r" style="color:${accelCol};font-weight:600">${c.accel >= 0 ? '+' : ''}${fNum(c.accel, 1)}</td>
            <td class="r dim">${fNum(c.vm * 100, 1)}%</td>
            <td class="r" style="color:${athFarbe(athP)}">${athP != null ? fNum(athP, 1) + '%' : '—'}</td>
            <td>${chip(c.signalText, SIG_FARBE[c.signal])}</td></tr>`;
    }).join('');

    return `<div class="grid g4 ab-stats">
            ${box('Breakouts', hotCount, 'var(--up)')}
            ${box('Momentum', warmCount, 'var(--warn)')}
            ${box('Gefiltert', filtered.length, '')}
            ${box('Top Accel', esc(bestSym || '—'), 'var(--up)', bestSym ? `data-coin="${esc(bestSym)}" style="cursor:pointer"` : '')}
        </div>
        ${top.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>#</th><th>Coin</th><th class="r">Preis</th><th class="r">24h</th><th class="r">7d</th>
            <th class="r">Accel</th><th class="r">V/MC</th><th class="r">ATH</th><th>Signal</th></tr></thead><tbody>${zeilen}</tbody></table></div>`
            : empty('Kein Coin passt zu diesem Filter.')}
        <div class="eyebrow ab-foot">${filtered.length} Coins gefiltert · Accel = 24h Change minus 7d Tagesschnitt · ${new Date().toLocaleTimeString('de-DE')}</div>`;
}

export default {
    styles: `
        .ab-stats { gap: 12px; margin: 18px 0 14px; }
        .ab-stat { padding: 16px 18px; }
        .ab-stat .big { font-size: 1.7rem; }
        .ab-foot { margin-top: 16px; letter-spacing: .08em; text-transform: none; }
        @media (max-width: 860px) { .ab-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }`,
    render(root) {
        root.classList.add('stack');
        root.innerHTML = pageHead('Markt', 'Ausbrüche',
            'Coins die gerade ausbrechen: 24h-Momentum übertrifft 7d-Trend. Wer heute stärker ist als die ganze Woche = Beschleunigung.',
            `<span class="eyebrow">Stand ${esc(D.coinsStand)}</span>`) +
            card({ body: `<div class="filterleiste">${seg('abf', [['all', 'Alle'], ['accel', 'Acceleration'], ['volspike', 'Volume Spike'], ['dip', 'Dip Recovery']], brkFilter)}</div>
                <div id="abBody">${inhalt()}</div>` });
        const el = root.querySelector('[data-seg="abf"]'), body = root.querySelector('#abBody');
        el.onclick = e => {
            const b = e.target.closest('button'); if (!b) return;
            brkFilter = b.dataset.v;
            el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
            body.innerHTML = inhalt();
        };
    },
};
