import { esc, fUsd, fBig, fPct, ago, utcTs } from '../core/fmt.js?v=202610060140';
import { card, pageHead, chip, seg, icon, empty, bar, coinImg, hydrate } from '../core/ui.js?v=202610060140';

const H = () => window.HASS_DATA || null;
const de = (v, d = 0) => v == null ? '?' : Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const TEIL = { daumen: 'Daumen runter', ath: 'Weit unter dem Hoch', btc: 'Schwach gegen BTC', wette: 'Markt wettet dagegen', verwaesserung: 'Verwässerung', bekannt: 'Bekanntheit' };
let filter = 'alle';

const hassVar = s => s >= 60 ? 'var(--down)' : s >= 45 ? 'var(--warn)' : 'var(--ink-2)';

function kennzahlen(z) {
    const k = (l, v, c) => `<div><div class="eyebrow">${l}</div><div class="num" style="${c ? 'color:' + c : ''}">${v}</div></div>`;
    return `<div class="gh-kz">
        ${k('Daumen runter', z.down_pct != null ? de(z.down_pct) + '%' + (z.einseitig ? '*' : '') : 'keine Abst.', z.down_pct >= 25 ? 'var(--down)' : '')}
        ${k('Vom Hoch', fPct(z.ath_pct, 0), 'var(--down)')}
        ${k('30T gg. BTC', z.rel30_btc != null ? (z.rel30_btc > 0 ? '+' : '') + de(z.rel30_btc, 1) + ' Pkt' : '?', z.rel30_btc < 0 ? 'var(--down)' : 'var(--up)')}
        ${k('Im Umlauf', z.float_pct != null ? de(z.float_pct) + '%' : '?', z.float_pct < 40 ? 'var(--warn)' : '')}
    </div>`;
}

function podest(z) {
    return `<article class="card gh-pod" data-coin="${esc(z.symbol)}">
        <div class="row between" style="align-items:flex-start">
            <div class="row" style="min-width:0">${coinImg(z.image)}<div style="min-width:0"><div class="eyebrow">Platz ${z.platz}</div>
                <div class="h2" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(z.name)}</div><div class="sb dim mono" style="font-size:.72rem">${esc(z.symbol)} · Rang ${z.rang}</div></div></div>
            <div class="gh-score" style="--c:${hassVar(z.score)}"><b>${de(z.score)}</b><span>Hass</span></div>
        </div>
        ${kennzahlen(z)}
        ${z.gruende.length ? `<ul class="gh-l">${z.gruende.map(g => `<li>${icon('thumbs-down')}<span>${esc(g)}</span></li>`).join('')}</ul>` : ''}
        ${z.lebenszeichen ? `<div class="gh-leben">${icon('heart-pulse')}<span>Lebenszeichen: ${esc(z.lebenszeichen)}</span></div>` : ''}
    </article>`;
}

function zeile(z, max) {
    return `<div class="gh-z" data-coin="${esc(z.symbol)}">
        <span class="gh-pl">${z.platz}</span>${coinImg(z.image)}
        <div style="min-width:0"><div class="nm">${esc(z.name)} <span class="dim mono" style="font-size:.7rem">${esc(z.symbol)}</span>${z.lebenszeichen ? ` ${chip('Lebenszeichen', 'var(--up)')}` : ''}</div>
            <div class="sb gh-gr">${esc(z.gruende[0] || 'Mehrere schwache Signale zusammen')}</div></div>
        <div class="gh-mini">${z.down_pct != null ? chip(de(z.down_pct) + '% runter', z.down_pct >= 25 ? 'var(--down)' : '') : ''}${chip(fPct(z.ath_pct, 0) + ' vom Hoch', 'var(--down)')}</div>
        <div class="gh-bar"><div class="row between" style="font-size:.72rem;margin-bottom:4px"><span class="dim">Hass</span><b class="num" style="color:${hassVar(z.score)}">${de(z.score)}</b></div>${bar(z.score / max * 100, hassVar(z.score))}</div>
    </div>`;
}

function methode(d) {
    const g = d.gewichte || {};
    return card({ eyebrow: 'So wird gemessen', cls: 'tint', body: `
        <p class="sub" style="margin:0 0 16px">Gehasst heißt: bekannt, aber abgeschrieben. Ein Coin, den niemand kennt, wird nicht gehasst, sondern ignoriert. Deshalb zählt die Bekanntheit mit. Geprüft wurden die ${d.geprueft} schwächsten von ${d.universum} großen Coins.</p>
        <div class="gh-gew">${Object.keys(TEIL).map(k => `<div><div class="row between" style="font-size:.8rem;margin-bottom:5px"><span class="dim">${TEIL[k]}</span><span class="num">${g[k] || 0}%</span></div>${bar((g[k] || 0) / 30 * 100, 'var(--down)')}</div>`).join('')}</div>
        <p class="sub" style="font-size:.76rem;margin:16px 0 0">${esc(d.hinweis || '')} Ein Stern (*) heißt: die Abstimmung ist fast einseitig und hat vermutlich nur wenige Stimmen, sie zählt deshalb weniger. Für Antizykliker: <b>Lebenszeichen</b> heißt, der Coin läuft in 7 Tagen klar stärker als Bitcoin, obwohl ihn alle abgeschrieben haben. Keine Anlageberatung.</p>` });
}

export default {
    styles: `
        .gh-podium { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }
        .gh-pod { display: flex; flex-direction: column; gap: 14px; cursor: pointer; transition: transform .35s var(--ease); }
        .gh-pod:hover { transform: translateY(-3px); }
        .gh-pod .coin-img { width: 44px; height: 44px; }
        .gh-pod:first-child { background: linear-gradient(150deg, color-mix(in srgb, var(--down) 14%, var(--surface)), var(--surface) 70%); }
        .gh-score { display: grid; justify-items: center; padding: 8px 12px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); color: var(--c); flex: none; }
        .gh-score b { font-family: var(--mono); font-size: 1.5rem; font-weight: 500; line-height: 1; }
        .gh-score span { font-family: var(--mono); font-size: .54rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); margin-top: 4px; }
        .gh-kz { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
        .gh-kz .eyebrow { font-size: .52rem; letter-spacing: .08em; } .gh-kz .num { font-size: .86rem; margin-top: 3px; }
        .gh-l { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: .8rem; color: var(--ink-2); }
        .gh-l li { display: grid; grid-template-columns: 15px minmax(0, 1fr); gap: 8px; } .gh-l svg { width: 13px; height: 13px; color: var(--down); margin-top: 3px; }
        .gh-leben { display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 8px; font-size: .8rem; color: var(--up); padding: 10px 12px; border-radius: var(--r-md); background: color-mix(in srgb, var(--up) 9%, transparent); }
        .gh-leben svg { width: 15px; height: 15px; margin-top: 1px; }
        .gh-z { display: grid; grid-template-columns: 28px 30px minmax(0, 1fr) auto 150px; gap: 14px; align-items: center; padding: 12px 8px; border-radius: 14px; cursor: pointer; transition: background .2s, transform .25s var(--ease); }
        .gh-z:hover { background: color-mix(in srgb, var(--ink) 4%, transparent); transform: translateX(3px); }
        .gh-z + .gh-z { border-top: 1px solid var(--line); }
        .gh-pl { font-family: var(--mono); font-size: .8rem; color: var(--ink-3); text-align: right; }
        .gh-gr { font-family: var(--font); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gh-mini { display: flex; gap: 6px; }
        .gh-gew { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 22px; }
        @media (max-width: 1180px) { .gh-podium { grid-template-columns: minmax(0, 1fr); } .gh-mini { display: none; } .gh-z { grid-template-columns: 28px 30px minmax(0, 1fr) 120px; } }
        @media (max-width: 860px) {
            .gh-gew { grid-template-columns: minmax(0, 1fr); }
            .gh-kz { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .gh-z { grid-template-columns: 22px 28px minmax(0, 1fr) 76px; gap: 10px; padding: 12px 4px; }
        }`,
    render(root) {
        const d = H();
        root.classList.add('stack');
        if (!d || !(d.ranking || []).length) {
            root.innerHTML = pageHead('Markt', 'Meistgehasst', 'Die Projekte, über die gerade am meisten gemeckert wird.') +
                card({ body: empty('Noch keine Daten. Sie entstehen mit python3 fetch_gehasst.py im Ordner Agent Dashboard, danach im vollen Lauf jeden Morgen.') });
            return;
        }
        const zeichne = () => {
            const alle = d.ranking, liste = filter === 'leben' ? alle.filter(z => z.lebenszeichen) : alle;
            const max = Math.max(...alle.map(z => z.score)) || 1;
            const top = filter === 'alle' ? liste.slice(0, 3) : [], rest = filter === 'alle' ? liste.slice(3) : liste;
            root.innerHTML = pageHead('Markt', 'Meistgehasst', 'Die 30 Krypto-Projekte, über die gerade am meisten gemeckert wird. Bekannt, aber abgeschrieben. Klick öffnet den Coin mit Chart.',
                    chip('Stand ' + ago(utcTs(d.updated)), 'var(--down)')) +
                (top.length ? `<div class="gh-podium">${top.map(podest).join('')}</div>` : '') +
                card({ eyebrow: filter === 'alle' ? 'Platz 4 bis 30' : 'Gehasst, aber mit Lebenszeichen',
                    right: seg('ghf', [['alle', 'Alle 30'], ['leben', 'Mit Lebenszeichen ' + alle.filter(z => z.lebenszeichen).length]], filter),
                    body: rest.length ? `<div>${rest.map(z => zeile(z, max)).join('')}</div>` : empty('Gerade zeigt keiner der gehassten Coins ein Lebenszeichen.') }) +
                methode(d);
            root.querySelector('[data-seg="ghf"]').onclick = e => { const b = e.target.closest('button'); if (b) { filter = b.dataset.v; zeichne(); hydrate(root); } };
        };
        zeichne();
    },
};
