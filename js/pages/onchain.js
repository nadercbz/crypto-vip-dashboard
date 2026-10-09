import { D, coin } from '../core/data.js?v=202610090840';
import { esc, fBig, fPct, fNum } from '../core/fmt.js?v=202610090840';
import { card, pageHead, sparkline, coinRow, empty, chip } from '../core/ui.js?v=202610090840';

function zeitHer(ts) {
    const min = Math.round((Date.now() / 1000 - ts) / 60);
    if (min < 60) return min + ' Min';
    if (min < 1440) return Math.round(min / 60) + ' Std';
    return Math.round(min / 1440) + ' Tage';
}

function netz(o) {
    if (!o || !o.btc_network) return empty('Noch keine Onchain-Daten. Sie kommen beim nächsten vollen Lauf.');
    const n = o.btc_network, k = [];
    const karte = (titel, wert, sub, extra = '') => k.push(`<div class="card sunk oc-k"><div class="eyebrow">${titel}</div>
        <div class="big num oc-v">${wert}</div>${sub ? `<div class="sub oc-s">${sub}</div>` : ''}${extra}</div>`);
    if (n.fees) karte('Gebühr, schnell', esc(n.fees.fast) + ' sat/vB',
        'Halbe Stunde: ' + esc(n.fees.halfhour) + ' · Stunde: ' + esc(n.fees.hour));
    if (n.hashrate) {
        const reihe = (n.hashrate_series || []).map(h => h.v / 1e18);
        const kurve = reihe.length >= 5
            ? `<div class="oc-spark">${sparkline(reihe, 200, 40, n.hashrate_chg_30d >= 0 ? 'var(--up)' : 'var(--down)')}</div>` : '';
        karte('Rechenleistung', fNum(n.hashrate / 1e18, 0) + ' EH/s',
            n.hashrate_chg_30d != null ? fPct(n.hashrate_chg_30d, 1) + ' in 30 Tagen' : '', kurve);
    }
    if (n.difficulty_adjustment) {
        const d = n.difficulty_adjustment;
        karte('Nächste Anpassung', fPct(d.change, 1),
            esc(d.remaining_blocks) + ' Blöcke, ' + (d.progress || 0).toFixed(0) + '% der Periode');
    }
    if (n.halving) karte('Nächste Halbierung', Math.round(n.halving.days_left) + ' Tage',
        fNum(n.halving.blocks_left) + ' Blöcke bis ' + fNum(n.halving.block));
    if (n.block_height) karte('Blockhöhe', fNum(n.block_height), '');
    if (n.mempool) karte('Wartende Zahlungen', fNum(n.mempool.count || 0), 'im Mempool');
    return k.length ? `<div class="grid oc-grid">${k.join('')}</div>` : empty('Noch keine Onchain-Daten. Sie kommen beim nächsten vollen Lauf.');
}

function taker(o) {
    const tk = (o && o.taker) || {};
    const rows = (tk.rows || []).slice().sort((a, b) => (b.ratio || 0) - (a.ratio || 0));
    if (tk.ratio == null && !rows.length) return empty('Keine Daten zum Taker-Druck.');
    return (tk.ratio != null
        ? `<p class="sub" style="margin:0 0 12px;color:var(--ink-2)">Über alle beobachteten Perpetuals liegt das Verhältnis bei <b class="num ${tk.ratio >= 1 ? 'up' : 'down'}">${fNum(tk.ratio, 2)}</b>. ${tk.ratio >= 1 ? 'Die Käufer sind aggressiver.' : 'Die Verkäufer sind aggressiver.'}</p>` : '') +
        `<div class="list oc-taker">${rows.slice(0, 12).map(r => {
            const c = coin(r.symbol) || {}, S = String(r.symbol || '').toUpperCase();
            return coinRow(S, c.name || S, c.image, 'Käufe ' + fBig(r.buy_vol),
                `<span class="${r.ratio >= 1 ? 'up' : 'down'}">${r.ratio != null ? fNum(r.ratio, 2) : '—'}</span>`);
        }).join('')}</div>`;
}

function news(o) {
    const list = (o && o.news) || [];
    if (!list.length) return empty('Keine Nachrichten geladen.');
    return `<div class="grid g3 oc-news">${list.slice(0, 24).map(x =>
        `<a class="card sunk click oc-n" href="${esc(x.link)}" target="_blank" rel="noopener">
            <div class="eyebrow">${esc(x.source)}${x.ts ? ' · vor ' + zeitHer(x.ts) : ''}</div>
            <div class="oc-t">${esc(x.title)}</div></a>`).join('')}</div>`;
}

export default {
    styles: `
        .oc-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .oc-k { padding: 18px 20px; }
        .oc-v { font-size: 1.8rem; margin-top: 8px; }
        .oc-s { margin-top: 4px; font-size: .78rem; }
        .oc-spark { margin-top: 12px; } .oc-spark svg { width: 100%; height: 40px; }
        .oc-taker { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 28px; }
        .oc-taker > * + * { border-top: 0; } .oc-taker > * { border-bottom: 1px solid var(--line); }
        .oc-news { gap: 12px; }
        .oc-n { padding: 16px 18px; display: block; text-decoration: none; color: inherit; }
        .oc-t { margin-top: 8px; font-size: .92rem; line-height: 1.4; }
        @media (max-width: 1180px) { .oc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 860px) { .oc-grid, .oc-taker { grid-template-columns: minmax(0, 1fr); } }`,
    render(root) {
        const o = D.onchain;
        root.classList.add('stack');
        root.innerHTML = pageHead('Markt', 'Onchain und News',
            'Die Zahlen unter dem Kurs: Gebühren, Rechenleistung, Schwierigkeit und der Weg zur nächsten Halbierung.',
            o && o.updated ? `<span class="eyebrow">Stand ${esc(o.updated)}</span>` : '') +
            card({ eyebrow: 'Bitcoin Netzwerk', title: 'Onchain', body: netz(o) }) +
            card({ eyebrow: 'Taker-Druck, 24 Stunden', right: o && o.taker && o.taker.ratio != null ? chip(o.taker.ratio >= 1 ? 'Käufer vorn' : 'Verkäufer vorn', o.taker.ratio >= 1 ? 'var(--up)' : 'var(--down)') : '',
                body: `<p class="sub" style="margin:0 0 14px">Verhältnis von aggressiven Käufen zu Verkäufen an den Terminmärkten. Über 1 heißt, die Käufer nehmen den Preis.</p>${taker(o)}` }) +
            card({ eyebrow: 'Nachrichten', body: news(o) });
    },
};
