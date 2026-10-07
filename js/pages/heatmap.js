import { D } from '../core/data.js?v=202610070601';
import { esc, fUsd, fNum, fPct } from '../core/fmt.js?v=202610070601';
import { card, pageHead, seg, coinImg, pct, empty } from '../core/ui.js?v=202610070601';
import { SECTORS, computeTopNarratives } from '../core/sektoren.js?v=202610070601';

const FELD = { '24h': 'price_change_percentage_24h', '7d': 'price_change_percentage_7d_in_currency', '30d': 'price_change_percentage_30d' };
const st = { tf: '24h', sektor: null };

function staerke(avg) {
    const spanne = st.tf === '30d' ? 30 : st.tf === '7d' ? 15 : 6;
    if (Math.abs(avg) < 0.15) return 0;
    return Math.round((0.2 + 0.6 * Math.min(1, Math.abs(avg) / spanne)) * 100);
}
const mix = (farbe, p) => `color-mix(in srgb, var(${farbe}) ${p}%, var(--sunk))`;
const NULL_FARBE = 'color-mix(in srgb, var(--ink) 9%, var(--sunk))';
function heatColor(avg) {
    const p = staerke(avg);
    return p === 0 ? NULL_FARBE : mix(avg > 0 ? '--up' : '--down', p);
}

function squarify(eintraege, x, y, breite, hoehe) {
    const summe = eintraege.reduce((a, b) => a + b.wert, 0);
    if (!summe || breite <= 0 || hoehe <= 0) return [];
    const faktor = (breite * hoehe) / summe;
    const rest = eintraege.map(e => ({ ...e, flaeche: e.wert * faktor })).sort((a, b) => b.flaeche - a.flaeche);
    const out = [];
    let px = x, py = y, pb = breite, ph = hoehe;

    function schlechtestes(reihe, kurz) {
        if (!reihe.length || !kurz) return Infinity;
        const s = reihe.reduce((a, b) => a + b.flaeche, 0);
        if (!s) return Infinity;
        const max = Math.max(...reihe.map(r => r.flaeche));
        const min = Math.min(...reihe.map(r => r.flaeche));
        const k2 = kurz * kurz, s2 = s * s;
        return Math.max((k2 * max) / s2, s2 / (k2 * min));
    }

    let i = 0;
    while (i < rest.length) {
        const kurz = Math.min(pb, ph);
        const reihe = [rest[i]];
        let j = i + 1;
        while (j < rest.length && schlechtestes(reihe.concat(rest[j]), kurz) <= schlechtestes(reihe, kurz)) { reihe.push(rest[j]); j++; }
        const reihenFlaeche = reihe.reduce((a, b) => a + b.flaeche, 0);
        const dicke = reihenFlaeche / kurz;
        let versatz = 0;
        reihe.forEach(r => {
            const laenge = r.flaeche / dicke;
            if (pb >= ph) out.push({ ...r, x: px, y: py + versatz, b: dicke, h: laenge });
            else out.push({ ...r, x: px + versatz, y: py, b: laenge, h: dicke });
            versatz += laenge;
        });
        if (pb >= ph) { px += dicke; pb -= dicke; } else { py += dicke; ph -= dicke; }
        i = j;
        if (pb <= 0.5 || ph <= 0.5) break;
    }
    return out;
}

function karte() {
    const ranked = computeTopNarratives(D.coins, FELD[st.tf]);
    if (!ranked.length) return empty('Keine Sektordaten.');
    const schmal = typeof matchMedia === 'function' && matchMedia('(max-width: 860px)').matches;
    const B = 1000, H = schmal ? 820 : 560, zoom = schmal ? 1.35 : 1;
    const gross = ranked.slice().sort((a, b) => (b.mcap || 0) - (a.mcap || 0)).slice(0, 18)
        .map(s => ({ ...s, wert: Math.sqrt(Math.max(s.mcap || 1, 1)) }));
    const kacheln = squarify(gross, 0, 0, B, H);

    const teile = kacheln.map(t => {
        const sign = t.avg >= 0 ? '+' : '';
        const kurz = Math.min(t.b, t.h);
        const istGross = kurz > 150, mittel = kurz > 78;
        const nameGr = (istGross ? 21 : mittel ? 16 : 12) * zoom;
        const pctGr = (istGross ? 18 : mittel ? 14 : 11) * zoom;
        const platzName = t.b > 62 * zoom && t.h > 34 * zoom;
        const platzZahl = t.b > 44 * zoom && t.h > 20 * zoom;
        const platzAnzahl = !schmal && t.b > 112 && t.h > 84;
        const px = (t.x + (mittel ? 12 : 6)).toFixed(1);
        const maxZeichen = Math.floor((t.b - 14) / (nameGr * 0.56));
        const name = t.name.length > maxZeichen ? t.name.slice(0, Math.max(3, maxZeichen - 1)) + '…' : t.name;
        const stark = staerke(t.avg) >= 60;
        const w = Math.max(0, t.b - 3).toFixed(1), h = Math.max(0, t.h - 3).toFixed(1);
        return `<g class="hm-tile${stark ? ' stark' : ''}${st.sektor === t.name ? ' on' : ''}" data-sector="${esc(t.name)}">
            <title>${esc(t.name)} · ${sign}${t.avg.toFixed(2).replace('.', ',')}% · ${t.count} Coins</title>
            <rect x="${t.x.toFixed(1)}" y="${t.y.toFixed(1)}" width="${w}" height="${h}" rx="12" style="fill:${heatColor(t.avg)}"/>
            ${platzName ? `<text x="${px}" y="${(t.y + nameGr + 8).toFixed(1)}" class="hm-name" style="font-size:${nameGr}px">${esc(name)}</text>` : ''}
            ${platzZahl ? `<text x="${px}" y="${(t.y + (platzName ? nameGr + pctGr + 14 : pctGr + 6)).toFixed(1)}" class="hm-pct" style="font-size:${pctGr}px">${sign}${t.avg.toFixed(1).replace('.', ',')}%</text>` : ''}
            ${platzAnzahl ? `<text x="${px}" y="${(t.y + t.h - 16).toFixed(1)}" class="hm-count">${t.count} Coins</text>` : ''}
        </g>`;
    }).join('');
    return `<svg viewBox="0 0 ${B} ${H}" class="hm-svg" style="aspect-ratio:${B} / ${H}">${teile}</svg>`;
}

const athFarbe = p => p == null ? 'var(--ink-3)' : p >= -20 ? 'var(--up)' : p >= -50 ? 'var(--warn)' : 'var(--down)';

function drill(sectorName) {
    const coins = D.coins.filter(c => { const tags = SECTORS[c.id]; return tags && tags.includes(sectorName); })
        .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    const avg = coins.length ? coins.reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) / coins.length : 0;
    const zeilen = coins.map((c, i) => {
        const S = (c.symbol || '').toUpperCase(), athP = c.ath_change_percentage;
        const vm = (c.total_volume && c.market_cap) ? fNum(c.total_volume / c.market_cap * 100, 1) + '%' : '—';
        return `<tr data-coin="${esc(S)}">
            <td class="dim mono">${i + 1}</td>
            <td><div class="row" style="gap:10px">${coinImg(c.image)}<b style="font-weight:500">${esc(c.name)}</b><span class="dim mono" style="font-size:.72rem">${esc(S)}</span></div></td>
            <td class="r">${fUsd(c.current_price)}</td>
            <td class="r">${pct(c.price_change_percentage_24h || 0, 2)}</td>
            <td class="r">${pct(c.price_change_percentage_7d_in_currency || 0, 2)}</td>
            <td class="r" style="color:${athFarbe(athP)}">${athP != null ? fNum(athP, 1) + '%' : '—'}</td>
            <td class="r dim">${vm}</td></tr>`;
    }).join('');
    return card({ eyebrow: 'Sektor Drill-Down', title: sectorName,
        right: `<div class="row" style="gap:14px"><span class="big num hm-avg ${avg >= 0 ? 'up' : 'down'}">${fPct(avg, 2)}</span><span class="eyebrow">${coins.length} Coins</span></div>`,
        body: coins.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Coin</th><th class="r">Preis</th><th class="r">24h</th><th class="r">7d</th><th class="r">ATH</th><th class="r">V/MC</th></tr></thead><tbody>${zeilen}</tbody></table></div>`
            : empty('Keine Coins in diesem Sektor.') });
}

export default {
    styles: `
        .hm-leg { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 16px 0 14px; font-family: var(--mono); font-size: .62rem; letter-spacing: .08em; color: var(--ink-3); }
        .hm-leg span { display: inline-flex; align-items: center; gap: 7px; }
        .hm-leg i { width: 14px; height: 14px; border-radius: 5px; background: var(--c); }
        .hm-svg { width: 100%; height: auto; display: block; }
        .hm-tile { cursor: pointer; }
        .hm-tile rect { stroke: var(--line); stroke-width: 1.5; transition: filter .25s var(--ease), stroke .25s var(--ease), stroke-width .25s var(--ease); }
        .hm-tile:hover rect { filter: brightness(1.08) saturate(1.15); }
        .hm-tile.on rect { stroke: var(--ink); stroke-width: 3; }
        .hm-tile text { fill: var(--ink); pointer-events: none; }
        .hm-tile.stark text { fill: var(--bg); }
        .hm-name { font-weight: 500; }
        .hm-pct { font-family: var(--mono); font-weight: 500; }
        .hm-count { font-family: var(--mono); font-size: 12px; opacity: .65; }
        .hm-avg { font-size: 1.5rem; }
        #hmDrill:empty { display: none; }`,
    render(root) {
        root.classList.add('stack');
        const sw = (c, l) => `<span><i style="--c:${c}"></i>${l}</span>`;
        root.innerHTML = pageHead('Markt', 'Sektor-Heatmap',
            'Wo fließt das Geld? Jede Kachel ist ein Sektor. Die Fläche entspricht der Marktkapitalisierung, die Farbe der Performance. Klick auf eine Kachel für die Top-Coins.',
            `<span class="eyebrow">Stand ${esc(D.coinsStand)}</span>`) +
            card({ body: `${seg('hmtf', [['24h', '24 Stunden'], ['7d', '7 Tage'], ['30d', '30 Tage']], st.tf)}
                <div class="hm-leg">${sw(mix('--down', 80), 'stark im Minus')}${sw(mix('--down', 35), 'im Minus')}${sw(NULL_FARBE, 'um null')}${sw(mix('--up', 38), 'im Plus')}${sw(mix('--up', 80), 'stark im Plus')}</div>
                <div id="hmGrid">${karte()}</div>` }) +
            `<div id="hmDrill">${st.sektor ? drill(st.sektor) : ''}</div>`;
        const grid = root.querySelector('#hmGrid'), panel = root.querySelector('#hmDrill'), tf = root.querySelector('[data-seg="hmtf"]');
        tf.onclick = e => {
            const b = e.target.closest('button'); if (!b) return;
            st.tf = b.dataset.v;
            tf.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
            grid.innerHTML = karte();
        };
        grid.onclick = e => {
            const tile = e.target.closest('.hm-tile'); if (!tile) return;
            grid.querySelectorAll('.hm-tile').forEach(t => t.classList.toggle('on', t === tile));
            st.sektor = tile.dataset.sector;
            panel.innerHTML = drill(st.sektor);
        };
    },
};
