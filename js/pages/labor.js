import { esc } from '../core/fmt.js?v=202610080950';
import { card, pageHead, chip, seg, empty, icon, hydrate } from '../core/ui.js?v=202610080950';

let horizont = '7';
let verlaufB = 'momentum';

const L = () => (typeof window !== 'undefined' && window.LABOR_DATA) || null;

const n = (v, d = 2, plus = false) => {
    if (v == null || isNaN(v)) return '·';
    const s = Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
    return plus && v > 0 ? '+' + s : s;
};
const pz = v => v == null ? '·' : Math.round(v * 100) + ' %';

function icFarbe(ic) {
    if (ic == null) return 'transparent';
    const a = Math.min(1, Math.abs(ic) / 0.12) * 34 + 6;
    return `color-mix(in srgb, var(${ic >= 0 ? '--up' : '--down'}) ${a.toFixed(0)}%, transparent)`;
}

const MODUS = { trend: ['Trend', 'var(--up)'], reversal: ['Umkehr', 'var(--a3)'] };
const KL_FARBE = { top50: 'var(--a1)', '51_150': 'var(--a2)', '151_300': 'var(--a3)', rest: 'var(--a4)', alle: 'var(--ink-3)' };

function kopfzahlen(d) {
    const b = d.basis || {}, r = d.bereinigung || {};
    const k = [
        ['Stichtage mit Folgewoche', b.stichtage_7, `${esc(b.von || '')} bis ${esc(b.bis || '')}`],
        ['Unabhängige Wochen', n(b.unabhaengige_wochen, 1), 'überlappende Fenster herausgerechnet'],
        ['Coins je Tag', b.coins_je_tag, `${b.coins || 0} Coins insgesamt`],
        ['Ausgeklammert', (r.gesperrte_coins || 0) + (r.fehler_coins || 0), `${r.gesperrte_coins || 0} Kürzel-Kollisionen, ${r.fehler_coins || 0} mit Kurssprüngen`],
    ];
    return `<div class="grid g4 lb-g4">${k.map(x => `<div class="card" style="padding:16px 18px">
        <div class="eyebrow">${esc(x[0])}</div>
        <div class="num" style="font-size:1.6rem;font-weight:300;margin-top:6px">${esc(x[1] ?? '·')}</div>
        <div class="dim" style="font-size:.74rem;margin-top:4px">${x[2]}</div></div>`).join('')}</div>`;
}

function kernaussagen(d) {
    const k = d.kernaussagen || [];
    if (!k.length) return empty('Noch keine Kernaussagen.');
    return `<ul class="lb-kern">${k.map(t => `<li>${icon('flask-conical')}<span>${esc(t)}</span></li>`).join('')}</ul>`;
}

function modusKarten(d) {
    const m = d.momentum_modus || {}, heute = d.momentum_modus_heute || {}, det = d.momentum_detail || {}, gr = d.momentum_grund || {};
    return `<div class="grid g4 lb-g4">${(d.klassen || []).filter(k => k.id !== 'alle').map(k => {
        const mo = MODUS[m[k.id]] || MODUS.trend, x = det[k.id] || {};
        const abw = heute[k.id] && heute[k.id] !== m[k.id] ? `<div class="warn" style="font-size:.74rem;margin-top:8px">Heute gemessen: ${esc((MODUS[heute[k.id]] || [''])[0])}</div>` : '';
        return `<div class="card sunk lb-modus" style="--c:${mo[1]}" title="${esc(gr[k.id] || '')}">
            <div class="row between"><span class="eyebrow">${esc(k.label)}</span>${chip(mo[0], mo[1])}</div>
            <div class="lb-mrow"><span class="dim">IC Trend-Formel</span><b class="mono" style="color:${x.ic7_trend >= 0 ? 'var(--up)' : 'var(--down)'}">${n(x.ic7_trend, 3, true)}</b></div>
            <div class="lb-mrow"><span class="dim">IC Umkehr-Formel</span><b class="mono" style="color:${x.ic7_umkehr >= 0 ? 'var(--up)' : 'var(--down)'}">${n(x.ic7_umkehr, 3, true)}</b></div>
            <div class="lb-mrow"><span class="dim">Vorsprung Umkehr, t</span><b class="mono">${n(x.t7, 1, true)}</b></div>${abw}
        </div>`;
    }).join('')}</div>
    <details class="lb-det"><summary>Begründung je Größe</summary>${(d.klassen || []).filter(k => gr[k.id]).map(k => `<p>${esc(gr[k.id])}</p>`).join('')}</details>`;
}

function tabelle(d) {
    const tab = d.tabelle || {}, kl = d.klassen || [];
    const rows = (d.bausteine || []).filter(b => tab[b.id] && tab[b.id][horizont]);
    if (!rows.length) return empty('Für diesen Horizont gibt es noch keine Messung.');
    return `<div class="tbl-wrap"><table class="tbl lb-tbl"><thead><tr><th>Baustein</th>${kl.map(k => `<th class="r">${esc(k.label)}</th>`).join('')}</tr></thead><tbody>
        ${rows.map(b => `<tr><td><div class="lb-bn">${esc(b.label)}${b.art === 'historie' ? ' <span class="lb-tag">Historie</span>' : b.art === 'beide' ? ' <span class="lb-tag">teils rekonstruiert</span>' : ''}</div><div class="lb-bt">${esc(b.text)}</div></td>
            ${kl.map(k => {
                const z = tab[b.id][horizont][k.id];
                if (!z) return '<td class="r dim">·</td>';
                const tip = `IC ${n(z.ic, 3, true)}, t ${n(z.t, 1, true)}, an ${pz(z.pos)} der Tage positiv, Fünftel-Abstand ${n(z.spread, 1, true)} Punkte, ${z.tage} Stichtage, ${z.beob} Beobachtungen, rund ${z.coins_tag} Coins je Tag, ${pz(z.rek)} rekonstruiert`;
                return `<td class="r lb-cell${z.duenn ? ' duenn' : ''}" style="--bgc:${icFarbe(z.ic)}" title="${esc(tip)}">
                    <b>${n(z.ic, 3, true)}</b><span>${n(z.spread, 1, true)} P · ${pz(z.pos)}</span></td>`;
            }).join('')}</tr>`).join('')}
    </tbody></table></div>
    <p class="dim lb-fuss">Großer Wert: IC, die Rang-Korrelation zwischen Baustein und Rendite der nächsten ${esc(horizont)} Tage. Darunter: stärkstes minus schwächstes Fünftel in Prozentpunkten und Anteil der Tage mit positivem IC. Blasse Zellen haben weniger als 14 Stichtage. Details beim Darüberfahren.</p>`;
}

function gewichte(d) {
    const g = d.gewichte || {}, teile = d.teile || [], lab = {};
    (d.bausteine || []).forEach(b => { lab[b.id] = b.label; });
    const max = (g.grenzen && g.grenzen.max) || 2;
    const alt = g.vorher || g.gleich || {}, neu = g.aktiv || {}, heute = g.empfohlen || {}, begr = g.begruendung || {};
    const b = (v, farbe) => `<div class="lb-wbar"><i style="width:${Math.max(2, (v || 0) / max * 100).toFixed(1)}%;background:${farbe}"></i></div>`;
    return `<div class="row wrap lb-leg"><span><i style="background:var(--ink-3)"></i>Alt${g.vorher_stand ? ' (' + esc(g.vorher_stand) + ')' : ', gleich gewichtet'}</span><span><i style="background:var(--pg)"></i>Neu${g.aktiv_stand ? ' (' + esc(g.aktiv_stand) + ')' : ''}</span><span class="dim">Skala 0 bis ${n(max, 1)}x, 1,0 ist Gleichgewicht</span></div>
    <div class="stack" style="gap:16px">${teile.map(t => {
        const diff = heute[t] != null && neu[t] != null && heute[t] !== neu[t];
        return `<div class="lb-w">
            <div class="row between"><b style="font-weight:500">${esc(lab[t] || t)}</b><span class="mono"><span class="dim">${n(alt[t], 2)}x</span> ${icon('arrow-right', 'class="lb-ar"')} <b>${n(neu[t], 2)}x</b></span></div>
            ${b(alt[t], 'var(--ink-3)')}${b(neu[t], 'var(--pg)')}
            <div class="lb-wt">${esc(begr[t] || '')}${diff ? ` <span class="warn">Heute gemessen wären es ${n(heute[t], 2)}x.</span>` : ''}</div></div>`;
    }).join('')}</div>
    <p class="dim lb-fuss">Neu berechnet wird höchstens einmal pro Woche: ${esc(g.naechste || 'sonntags')}.</p>`;
}

function verlaufSvg(d) {
    const v = ((d.verlauf || {})[verlaufB] || {})['7'] || {};
    const kl = (d.klassen || []).filter(k => v[k.id] && v[k.id].length);
    if (!kl.length) return empty('Für diesen Baustein gibt es noch keinen Verlauf.');
    const wochen = [...new Set(kl.flatMap(k => v[k.id].map(x => x.woche)))].sort();
    const alle = kl.flatMap(k => v[k.id].map(x => x.ic));
    const lim = Math.max(0.1, ...alle.map(Math.abs));
    const W = 640, H = 190, pl = 40, pr = 12, pt = 12, pb = 26;
    const X = i => pl + (wochen.length < 2 ? (W - pl - pr) / 2 : i / (wochen.length - 1) * (W - pl - pr));
    const Y = ic => pt + (1 - (ic + lim) / (2 * lim)) * (H - pt - pb);
    const gitter = [lim, lim / 2, 0, -lim / 2, -lim].map(s => `<line x1="${pl}" x2="${W - pr}" y1="${Y(s).toFixed(1)}" y2="${Y(s).toFixed(1)}" class="${s === 0 ? 'lb-null' : 'lb-git'}"/><text x="${pl - 6}" y="${(Y(s) + 3).toFixed(1)}" class="lb-ax" text-anchor="end">${n(s, 2, true)}</text>`).join('');
    const xl = wochen.map((w, i) => `<text x="${X(i).toFixed(1)}" y="${H - 6}" class="lb-ax" text-anchor="middle">${esc(w.slice(5))}</text>`).join('');
    const linien = kl.map(k => {
        const pts = v[k.id].map(x => [X(wochen.indexOf(x.woche)), Y(x.ic), x]);
        return `<path d="M${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L')}" fill="none" stroke="${KL_FARBE[k.id]}" stroke-width="${k.id === 'alle' ? 1.2 : 2}" ${k.id === 'alle' ? 'stroke-dasharray="4 4"' : ''} stroke-linecap="round" stroke-linejoin="round"/>` +
            pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${KL_FARBE[k.id]}"><title>${esc(k.label)}, ${esc(p[2].woche)}: IC ${n(p[2].ic, 3, true)} aus ${p[2].tage} Tagen</title></circle>`).join('');
    }).join('');
    return `<svg class="lb-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${gitter}${xl}${linien}</svg>
        <div class="row wrap lb-leg">${kl.map(k => `<span><i style="background:${KL_FARBE[k.id]}"></i>${esc(k.label)}</span>`).join('')}</div>
        <p class="dim lb-fuss">Mittlerer IC je Kalenderwoche des Stichtags, Horizont 7 Tage. Über der Nulllinie hat der Baustein in dieser Woche richtig gelegen.</p>`;
}

function trefferTabelle(gruppen, mitHoch) {
    if (!gruppen || !gruppen.length) return '';
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Gruppe</th><th class="r">Signale</th><th class="r">Treffer</th><th class="r">Hoch +20 %</th><th class="r">Median Ergebnis</th>${mitHoch ? '<th class="r">Median Hoch</th>' : ''}</tr></thead><tbody>
        ${gruppen.map(g => `<tr class="${g.duenn || g.n < 10 ? 'lb-blass' : ''}"><td>${esc(g.gruppe)}</td><td class="r">${g.n}</td>
            <td class="r" style="color:${g.treffer == null ? 'var(--ink-3)' : g.treffer >= 0.5 ? 'var(--up)' : 'var(--down)'}">${pz(g.treffer)}</td>
            <td class="r">${pz(g.hoch20)}</td><td class="r ${g.median_ergebnis > 0 ? 'up' : g.median_ergebnis < 0 ? 'down' : 'dim'}">${n(g.median_ergebnis, 1, true)} %</td>
            ${mitHoch ? `<td class="r">${n(g.median_hoch, 1, true)} %</td>` : ''}</tr>`).join('')}
    </tbody></table></div>`;
}

function tagessignale(d) {
    const t = d.tagessignale;
    if (!t) return empty('Kein Signal-Tagebuch gefunden.');
    const kopf = `<div class="row wrap" style="gap:10px;margin-bottom:12px">${chip(t.signale + ' im Tagebuch')}${chip(t.messbar + ' messbar', t.messbar ? 'var(--up)' : 'var(--warn)')}</div>`;
    if (!t.messbar) return kopf + empty('Noch kein Signal ist älter als 24 Stunden. Die erste Trefferquote erscheint mit den nächsten Läufen.') + `<p class="dim lb-fuss">${esc(t.erklaerung || '')}</p>`;
    return kopf + (t.duenn ? `<p class="warn lb-fuss">Unter 30 messbaren Signalen ist jede Quote noch Zufall.</p>` : '') +
        trefferTabelle([t.gesamt, ...(t.gruppen || [])].filter(Boolean), true) + `<p class="dim lb-fuss">${esc(t.erklaerung || '')}</p>`;
}

function memecoins(d) {
    const m = d.memecoins;
    if (!m || !m.gruppen || !m.gruppen.length) return empty('Für die Memecoin-Signale liegen noch keine messbaren Kerzen vor.');
    return `<div class="row wrap" style="gap:10px;margin-bottom:12px">${chip(m.beobachtungen + ' Messungen')}${chip(m.pools + ' Pools mit Kerzen')}${m.ic != null ? chip('IC Score zu 24 h ' + n(m.ic, 3, true), m.ic >= 0 ? 'var(--up)' : 'var(--down)') : ''}</div>` +
        trefferTabelle(m.gruppen, true) + `<p class="dim lb-fuss">${esc(m.erklaerung || '')} Höhere Score-Stufen fehlen, solange es für ihre Pools keine Kerzen gibt.</p>`;
}

export default {
    styles: `
        .lb-kern { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .lb-kern li { display: grid; grid-template-columns: 22px 1fr; gap: 10px; align-items: start; font-size: .92rem; line-height: 1.5; color: var(--ink); }
        .lb-kern li svg { width: 16px; height: 16px; margin-top: 3px; color: var(--pg); }
        .lb-warn { display: grid; grid-template-columns: 24px 1fr; gap: 12px; align-items: start; border-left: 3px solid var(--warn); font-size: .9rem; line-height: 1.5; }
        .lb-warn svg { color: var(--warn); width: 18px; height: 18px; margin-top: 2px; }
        .lb-modus { padding: 16px 18px; border-left: 3px solid var(--c, var(--line)); }
        .lb-mrow { display: flex; justify-content: space-between; gap: 10px; font-size: .8rem; margin-top: 8px; }
        .lb-det { margin-top: 14px; font-size: .84rem; color: var(--ink-2); }
        .lb-det summary { cursor: pointer; font-family: var(--mono); font-size: .66rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); }
        .lb-det p { margin: 10px 0 0; line-height: 1.5; }
        .lb-tbl td { vertical-align: top; }
        .lb-bn { font-weight: 500; }
        .lb-bt { font-size: .72rem; color: var(--ink-3); white-space: normal; max-width: 280px; margin-top: 3px; line-height: 1.35; }
        .lb-tag { font-family: var(--mono); font-size: .56rem; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); border: 1px solid var(--line); border-radius: var(--r-pill); padding: 1px 6px; margin-left: 4px; }
        .lb-cell { background: var(--bgc); border-radius: 10px; transition: opacity .3s var(--ease); }
        .lb-cell b { display: block; font-weight: 500; }
        .lb-cell span { display: block; font-size: .66rem; color: var(--ink-3); margin-top: 2px; }
        .lb-cell.duenn { opacity: .42; }
        .lb-blass td { opacity: .55; }
        .lb-fuss { font-size: .76rem; margin: 12px 0 0; line-height: 1.5; }
        .lb-leg { gap: 16px; font-size: .74rem; color: var(--ink-2); margin: 4px 0 14px; }
        .lb-leg i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: -1px; }
        .lb-w .row { margin-bottom: 6px; }
        .lb-wbar { height: 8px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); margin-top: 5px; overflow: hidden; }
        .lb-wbar i { display: block; height: 100%; border-radius: inherit; transition: width .9s var(--ease); }
        .lb-wt { font-size: .76rem; color: var(--ink-3); margin-top: 7px; line-height: 1.45; }
        .lb-ar { width: 12px; height: 12px; vertical-align: -1px; color: var(--ink-3); }
        .lb-svg { width: 100%; height: auto; display: block; }
        .lb-svg .lb-git { stroke: var(--line); stroke-width: 1; }
        .lb-svg .lb-null { stroke: var(--ink-3); stroke-width: 1; stroke-dasharray: 2 3; }
        .lb-svg .lb-ax { fill: var(--ink-3); font-family: var(--mono); font-size: 9px; }
        .lb-methode p { margin: 0 0 10px; line-height: 1.6; font-size: .9rem; color: var(--ink-2); }
        @media (max-width: 860px) { .lb-g4 { grid-template-columns: minmax(0, 1fr); } .lb-bt { max-width: 180px; } .lb-kern li { font-size: .86rem; } }`,
    render(root) {
        root.classList.add('stack');
        const d = L();
        const kopf = pageHead('Wissen', 'Signal-Labor', 'Welche Bausteine der Signal-Engine sagen die nächsten Tage wirklich voraus? Das Labor hält jeden Tag alle Werte fest, misst danach die Kursentwicklung und leitet daraus vorsichtige Gewichte für den Gesamt-Score ab.',
            d ? chip('Stand ' + (d.stand || ''), 'var(--pg)') : '');
        if (!d) { root.innerHTML = kopf + card({ body: empty('Das Signal-Labor ist noch nicht gelaufen. Starte es mit python3 signal_labor.py im Ordner Agent Dashboard.') }); return; }

        const verlaufOpts = (d.bausteine || []).filter(b => d.verlauf && d.verlauf[b.id] && d.verlauf[b.id]['7']).map(b => [b.id, b.label]);
        if (!verlaufOpts.find(o => o[0] === verlaufB) && verlaufOpts.length) verlaufB = verlaufOpts[0][0];

        root.innerHTML = kopf +
            (d.warnung ? `<section class="card lb-warn">${icon('triangle-alert')}<div>${esc(d.warnung)}</div></section>` : '') +
            kopfzahlen(d) +
            card({ eyebrow: 'Kernaussagen', title: 'Was die Daten bisher sagen', body: kernaussagen(d), cls: 'tint' }) +
            card({ eyebrow: 'Momentum je Größe', title: 'Trend oder Umkehr', body: modusKarten(d) }) +
            card({ eyebrow: 'Baustein mal Größe', title: 'Vorhersagekraft je Baustein', right: seg('lbH', [['3', '3 Tage'], ['7', '7 Tage']], horizont), body: `<div id="lbTab">${tabelle(d)}</div>` }) +
            `<div class="grid g2">` +
                card({ eyebrow: 'Gewichte', title: 'Alt gegen neu', body: gewichte(d) }) +
                card({ eyebrow: 'IC-Verlauf', title: 'Woche für Woche', right: verlaufOpts.length > 1 ? `<select class="select" id="lbVB" style="max-width:200px">${verlaufOpts.map(o => `<option value="${esc(o[0])}"${o[0] === verlaufB ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>` : '', body: `<div id="lbVerlauf">${verlaufSvg(d)}</div>` }) +
            `</div><div class="grid g2">` +
                card({ eyebrow: 'Tages-Signale', title: 'Trefferquote je Stufe', body: tagessignale(d) }) +
                card({ eyebrow: 'Memecoin-Radar', title: 'Trefferquote je Score', body: memecoins(d) }) +
            `</div>` +
            card({ eyebrow: 'Methode', title: 'So misst das Labor', body: `<div class="lb-methode">${(d.methode || []).map(t => `<p>${esc(t)}</p>`).join('')}</div>` });

        const segH = root.querySelector('[data-seg="lbH"]');
        if (segH) segH.onclick = e => {
            const b = e.target.closest('button'); if (!b) return;
            horizont = b.dataset.v;
            segH.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
            const t = root.querySelector('#lbTab'); t.innerHTML = tabelle(d); hydrate(t);
        };
        const sel = root.querySelector('#lbVB');
        if (sel) sel.onchange = () => {
            verlaufB = sel.value;
            const v = root.querySelector('#lbVerlauf'); v.innerHTML = verlaufSvg(d); hydrate(v);
        };
    },
};
