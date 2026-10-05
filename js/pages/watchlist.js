import { D, coin, watch, store } from '../core/data.js?v=202610052250';
import { esc, fUsd, fNum, fPct, cls } from '../core/fmt.js?v=202610052250';
import { card, pageHead, coinImg, pct, scoreVar, sparkline, icon, empty } from '../core/ui.js?v=202610052250';

const NOTE = 'c2_watch_notes';
let onLive = null;

const preis = c => `${c ? fUsd(c.current_price) : '—'} <span class="wl-chg">${pct(c ? c.price_change_percentage_24h : null)}</span>`;
const kz = (k, v, stil = '', klasse = '') => `<div class="wl-kz"><div class="eyebrow">${k}</div><div class="num ${klasse}" style="${stil}">${v}</div></div>`;

export default {
    styles: `
        .wl-preis { font-size: 1.6rem; font-weight: 300; margin: 18px 0 10px; }
        .wl-chg { font-size: .8rem; font-family: var(--mono); }
        .wl-spark { margin-bottom: 14px; } .wl-spark svg { width: 100%; height: 44px; }
        .wl-kzs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; }
        .wl-kz { padding: 10px 12px; border-radius: 14px; background: var(--bg); box-shadow: var(--sh-in); }
        .wl-kz .num { font-size: 1.05rem; margin-top: 4px; }
        .wl-kopf [data-coin] { cursor: pointer; }`,
    render(root, ctx) {
        const list = watch.list(), notes = store.get(NOTE, {}) || {};
        const sigBy = {};
        ((D.signals && D.signals.coins) || []).forEach(r => { sigBy[r.symbol.toUpperCase()] = r; });
        root.classList.add('stack');
        root.innerHTML = pageHead('Portfolio', 'Watchlist', 'Die Coins, die du mit dem Stern markiert hast. Mit Kennzahlen aus dem Radar und Platz für eine eigene Notiz je Coin. Notizen bleiben in diesem Browser gespeichert.',
            `<a class="btn soft" data-go="kurse">${icon('plus')}Coins hinzufügen</a>`) +
            (list.length ? `<div class="grid g-auto" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${list.map(sym => {
                const c = coin(sym), r = sigBy[sym] || {};
                const chg7 = r.chg7 != null ? r.chg7 : (c ? c.price_change_percentage_7d_in_currency : null);
                return card({ attr: `data-wl="${esc(sym)}"`, body: `
                    <div class="row between wl-kopf"><div class="row" data-coin="${esc(sym)}">${coinImg(c && c.image)}<div><div style="font-weight:500">${esc(c ? c.name : sym)}</div>
                        <div class="eyebrow">${esc(sym)}${r.cat && r.cat !== 'Other' ? ' · ' + esc(r.cat) : ''}${c ? ' · Rang ' + (c.market_cap_rank || '—') : ' · nicht in den Daten'}</div></div></div>
                        <button class="ibtn" data-rm="${esc(sym)}" title="Entfernen" style="width:34px;height:34px">${icon('x')}</button></div>
                    <div class="num wl-preis">${preis(c)}</div>
                    ${r.spark && r.spark.length >= 3 ? `<div class="wl-spark" data-coin="${esc(sym)}">${sparkline(r.spark, 250, 44)}</div>` : ''}
                    <div class="wl-kzs">
                        ${kz('Score', r.score != null ? r.score.toFixed(0) : '—', 'color:' + scoreVar(r.score))}
                        ${kz('RSI', r.rsi != null ? r.rsi.toFixed(0) : '—')}
                        ${kz('7 Tage', fPct(chg7), '', cls(chg7))}
                        ${kz('Vola', r.vol30 != null ? fNum(r.vol30) + '%' : '—')}
                    </div>
                    <textarea class="textarea" data-note="${esc(sym)}" rows="2" placeholder="Notiz zu ${esc(sym)} …">${esc(notes[sym] || '')}</textarea>` });
            }).join('')}</div>` : card({ cls: 'tint', body: empty('Noch keine Coins markiert. Setz in "Alle Kurse" oder im Coin-Detail einen Stern.') }));
        root.onclick = e => { const b = e.target.closest('[data-rm]'); if (b) { e.stopPropagation(); watch.toggle(b.dataset.rm); ctx.rerender(); } };
        root.oninput = e => { const t = e.target.closest('[data-note]'); if (!t) return; const n = store.get(NOTE, {}) || {}, v = t.value.trim(); v ? n[t.dataset.note] = v : delete n[t.dataset.note]; store.set(NOTE, n); };
        onLive = () => {
            if (!root.isConnected) return;
            root.querySelectorAll('[data-wl]').forEach(k => { const c = coin(k.dataset.wl), p = k.querySelector('.wl-preis'); if (c && p) p.innerHTML = preis(c); });
        };
        document.addEventListener('cb2:live', onLive);
    },
    destroy() { if (onLive) { document.removeEventListener('cb2:live', onLive); onLive = null; } },
};
