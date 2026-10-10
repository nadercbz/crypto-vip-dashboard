import { D, coin } from '../core/data.js?v=202610102047';
import { esc } from '../core/fmt.js?v=202610102047';
import { card, pageHead, chip, empty, icon, pct } from '../core/ui.js?v=202610102047';
import { rangKarte, bindRang, RANG_CSS } from '../core/influencer_rang.js?v=202610102047';

const datumDE = d => { const t = String(d || '').split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' : (d || ''); };
function zahl(n) {
    if (n == null) return '?';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' Mio';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.', ',') + ' Tsd';
    return String(n);
}
const abschnitt = t => `<div class="eyebrow fl-abschnitt">${t}</div>`;
const link = (url, text, ico) => `<a class="btn soft fl-link" href="${esc(url)}" target="_blank" rel="noopener">${icon(ico)}${esc(text)}</a>`;
const coinAttr = sym => coin(sym) ? ` data-coin="${esc(String(sym).toUpperCase())}" style="cursor:pointer"` : '';

function quelleHtml(q) {
    let h = `<div class="row between wrap" style="align-items:flex-start;gap:14px">
        <div style="min-width:0"><h3 class="h2">${esc(q.name)}</h3>
        <div class="sub" style="margin:6px 0 0;font-size:.84rem">${q.abos ? esc(q.abos) + ' Abonnenten · ' : ''}${esc(q.n_videos)} Videos in 30 Tagen · ${esc(q.n_transkripte)} mit Transkript${q.letztes_video ? ' · zuletzt ' + esc(datumDE(q.letztes_video)) : ''}</div></div>
        <div class="row wrap" style="gap:8px">${q.youtube_url ? link(q.youtube_url, 'YouTube', 'youtube') : ''}${q.x_url ? link(q.x_url, 'X @' + q.x, 'at-sign') : ''}${q.tiktok ? link('https://www.tiktok.com/@' + encodeURIComponent(q.tiktok), 'TikTok', 'music-2') : ''}</div></div>`;
    if (q.notiz) h += `<p class="sub" style="margin:10px 0 0;font-size:.84rem">${esc(q.notiz)}</p>`;

    if (q.kampagne) {
        const k = q.kampagne;
        h += `<div class="fl-kampagne">${icon('triangle-alert')}<div><b>Kampagne, kein Call.</b> „${esc(k.thema)}“ steht in <b>${esc(k.n)} von ${esc(k.von)}</b> Video-Titeln (${Math.round(k.anteil * 100)} Prozent)` +
            (k.ticker ? `, der Ticker lautet <b>$${esc(k.ticker)}</b>` : '') +
            (k.contract ? ` und in der Beschreibung steht die Kaufadresse: <code>${esc(k.contract)}</code>` : '') + '. ' +
            (k.contract ? 'Wer ein einzelnes Projekt so dicht bewirbt und den Contract gleich mitliefert, berichtet nicht, sondern wird bezahlt.'
                : 'Ein einzelnes Projekt trägt hier den halben Kanal. Eine Kaufadresse steht nicht dabei, der Schwerpunkt ist trotzdem zu eng für Berichterstattung.') +
            ' Als Werbung lesen, nicht als Einschätzung.</div></div>';
    }

    if ((q.coins || []).length) {
        const max = Math.max(...q.coins.map(c => c.treffer));
        h += abschnitt('Coins, über die gesprochen wird') + '<div class="fl-coins">' + q.coins.slice(0, 12).map(c => {
            const anteil = Math.max(8, Math.round(100 * c.treffer / max));
            return `<div class="fl-c${c.im_titel ? ' titel' : ''}"${coinAttr(c.sym)}>
                <i class="fl-bal" style="opacity:${(0.25 + 0.75 * anteil / 100).toFixed(2)}"></i>
                <div class="fl-txt"><b>${esc(c.sym)}${c.rank ? `<small>#${esc(c.rank)}</small>` : ''}</b>
                <span>${esc(c.n_videos)} Videos${c.im_titel ? ', ' + esc(c.im_titel) + 'x im Titel' : ''} · zuletzt ${esc(datumDE(c.letzt))}</span></div>
                <em class="num">${pct(c.ch7d)}</em></div>`;
        }).join('') + '</div>';
    }

    if ((q.unbekannt || []).length) {
        h += abschnitt('Genannt, aber nicht in der Top 1000') + '<div class="row wrap" style="gap:8px">' +
            q.unbekannt.map(u => `<span class="chip" style="--c:var(--warn)">$<b>${esc(u.sym)}</b> · ${esc(u.n_videos)} Videos · zuletzt ${esc(datumDE(u.letzt))}</span>`).join('') + '</div>';
    }

    if ((q.themen || []).length) {
        h += abschnitt('Begriffe in den Titeln') + '<div class="row wrap" style="gap:8px">' +
            q.themen.map(t => `<span class="chip"><b>${esc(t.begriff)}</b> ${esc(t.n)}x</span>`).join('') + '</div>';
    }

    if ((q.videos || []).length) {
        h += abschnitt('Letzte Videos') + '<ul class="fl-vids">' + q.videos.map(v =>
            `<li><span class="d mono">${esc(datumDE(v.datum))}</span>
                <a href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id || '')}" target="_blank" rel="noopener">${esc(v.titel)}</a>
                <span class="v mono">${v.views != null ? zahl(v.views) + ' Aufrufe' : ''}${v.transkript ? ' · gelesen' : ''}</span></li>`).join('') + '</ul>';
    }
    return card({ body: h });
}

const SUB = 'Naders Influencer-Liste, dauerhaft verfolgt. Gelesen wird der öffentliche YouTube-Feed: Titel, Beschreibung und, wo YouTube es zulässt, das Transkript. Daraus wird gezählt, über welche Coins gerade gesprochen wird. <strong>X lässt sich seit 2023 nicht mehr automatisiert lesen</strong>, die API kostet Geld, deshalb steht dort nur der direkte Link. Ein Coin im Titel wiegt dreifach, ein Coin im Transkript einfach. <strong>Kampagnen werden getrennt ausgewiesen:</strong> wenn ein Thema die Titel beherrscht und in der Beschreibung eine Contract-Adresse steht, ist das bezahlte Werbung und kein Call.';

export default {
    styles: RANG_CSS + `
        .fl-abschnitt { margin: 22px 0 10px; }
        .fl-link { padding: 7px 14px; font-size: .78rem; }
        .fl-link svg { width: 14px; height: 14px; }
        .fl-kampagne { display: flex; gap: 14px; align-items: flex-start; margin-top: 18px; padding: 16px 18px; border-radius: var(--r-md); font-size: .86rem; line-height: 1.55; color: var(--ink-2);
            background: color-mix(in srgb, var(--warn) 14%, transparent); border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent); }
        .fl-kampagne > svg { width: 20px; height: 20px; flex: none; color: var(--warn); margin-top: 2px; }
        .fl-kampagne b { color: var(--ink); font-weight: 500; }
        .fl-kampagne code { font-family: var(--mono); font-size: .74rem; overflow-wrap: anywhere; color: var(--ink); }
        .fl-coins { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
        .fl-c { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px 12px 20px; border-radius: var(--r-sm); background: var(--bg); box-shadow: var(--sh-in); overflow: hidden; transition: transform .25s var(--ease); }
        .fl-c[data-coin]:hover { transform: translateY(-2px); }
        .fl-bal { position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: var(--ink-3); }
        .fl-c.titel .fl-bal { background: var(--pg); }
        .fl-c.titel { background: color-mix(in srgb, var(--pg) 8%, var(--bg)); }
        .fl-txt { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .fl-txt b { font-weight: 500; font-size: .92rem; }
        .fl-txt small { font-family: var(--mono); font-size: .64rem; color: var(--ink-3); margin-left: 6px; font-weight: 400; }
        .fl-txt span { font-size: .72rem; color: var(--ink-3); }
        .fl-c em { font-style: normal; font-size: .8rem; flex: none; }
        .fl-vids { list-style: none; margin: 0; padding: 0; }
        .fl-vids li { display: grid; grid-template-columns: 52px minmax(0, 1fr) auto; gap: 12px; align-items: baseline; padding: 9px 0; border-bottom: 1px solid var(--line); font-size: .86rem; }
        .fl-vids li:last-child { border-bottom: 0; }
        .fl-vids .d, .fl-vids .v { font-size: .68rem; color: var(--ink-3); white-space: nowrap; }
        .fl-vids a { color: var(--ink); transition: color .2s var(--ease); }
        .fl-vids a:hover { color: var(--pg); }
        .fl-note code, .fl-hinweis code { font-family: var(--mono); font-size: .78rem; color: var(--ink); }
        @media (max-width: 860px) { .fl-coins { grid-template-columns: minmax(0, 1fr); } .fl-vids li { grid-template-columns: 46px minmax(0, 1fr); } .fl-vids .v { grid-column: 2; } }`,
    render(root) {
        const d = D.fluencer;
        root.classList.add('stack');
        if (!d || !(d.quellen || []).length) {
            root.innerHTML = pageHead('Entdecken', 'Influencer', SUB) +
                card({ body: empty('Noch keine Quelle eingetragen. Influencer in cryptofluencer.json anlegen und python3 fetch_cryptofluencer.py laufen lassen.') });
            return;
        }
        const n = d.quellen.length;
        let kons = '';
        if ((d.konsens || []).length) {
            kons = card({ eyebrow: 'Konsens', title: 'Mehr als eine Quelle nennt denselben Coin', cls: 'tint',
                body: `<div class="row wrap" style="gap:8px">${d.konsens.map(k =>
                    `<span class="chip" style="--c:var(--pg);padding:6px 12px${coin(k.sym) ? ';cursor:pointer' : ''}"${coin(k.sym) ? ` data-coin="${esc(String(k.sym).toUpperCase())}"` : ''} title="${esc((k.quellen || []).map(x => x.quelle).join(', '))}"><b>${esc(k.sym)}</b> · ${esc(k.n_quellen)} Quellen</span>`).join('')}</div>` });
        } else if (n <= 1) {
            kons = card({ eyebrow: 'Konsens', body: `<p class="sub fl-hinweis" style="margin:0">Konsens zeigt sich ab der zweiten Quelle. Weitere Influencer in <code>cryptofluencer.json</code> ergänzen, dann steht hier, worauf sich mehrere unabhängig einigen.</p>` });
        }
        root.innerHTML = pageHead('Entdecken', 'Influencer', SUB, `<span class="eyebrow">Stand ${esc(d.updated)}</span>`) +
            `<div class="row wrap" style="gap:8px">${chip(n + ' Quelle' + (n === 1 ? '' : 'n'))}${chip('Fenster ' + d.fenster_tage + ' Tage')}</div>` +
            rangKarte(d) + kons + d.quellen.map(quelleHtml).join('') +
            `<p class="sub fl-note" style="margin:0;font-size:.84rem">${window.CB2_PUBLIC ? '' : 'Neue Quelle: Eintrag in <code>cryptofluencer.json</code>, danach <code>python3 fetch_cryptofluencer.py</code>. Läuft bei jedem vollen Refresh automatisch mit. '}${esc(d.hinweis_x || '')}</p>`;
        bindRang(root, d);
    },
};
