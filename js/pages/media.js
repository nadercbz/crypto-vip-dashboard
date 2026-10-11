import { esc } from '../core/fmt.js?v=202610111230';
import { card, pageHead, chip, seg, empty, icon, hydrate } from '../core/ui.js?v=202610111230';
import { VIDEO_CSS } from '../core/influencer_videos.js?v=202610111230';

const M = () => window.MEDIA_DATA || null;
const de = (v, d = 0) => v == null ? '?' : Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
let sprache = 'alle';
let sort = 'score';

const wann = d => { const t = tageSeit(d); return t <= 0 ? 'heute' : t === 1 ? 'gestern' : 'vor ' + t + ' Tagen'; };
const heute = () => new Date().toISOString().slice(0, 10);
const tageSeit = d => d ? Math.round((Date.parse(heute()) - Date.parse(d)) / 864e5) : 99;
const scoreFarbe = s => s >= 60 ? 'var(--up)' : s >= 40 ? 'var(--warn)' : 'var(--ink-2)';
const yt = k => k.handle ? 'https://www.youtube.com/' + (String(k.handle).startsWith('@') ? k.handle : '@' + k.handle) : 'https://www.youtube.com/channel/' + k.id;

function kanalKarte(k, i) {
    const neu = tageSeit(k.erst_gesehen) <= 7;
    const tr = k.trend;
    return `<article class="card md-k">
        <div class="row between" style="align-items:flex-start;gap:12px">
            <div class="row" style="min-width:0;gap:12px">
                <img class="md-av" src="${esc(k.avatar || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
                <div style="min-width:0"><div class="eyebrow">Platz ${i + 1} · ${k.sprache === 'de' ? 'Deutsch' : 'Englisch'}${neu ? ' · neu' : ''}</div>
                    <a class="h2 md-n" href="${esc(yt(k))}" target="_blank" rel="noopener">${esc(k.name)}</a></div></div>
            <div class="md-sc" style="color:${scoreFarbe(k.score)}" title="Score aus Aufrufen je Abonnent, Regelmäßigkeit und Aufrufe-Trend">${de(k.score, 0)}</div>
        </div>
        ${(k.videos || [])[0] ? `<div class="iv-k md-neu" data-v="${esc(k.videos[0].id)}">
            <button class="iv-th" data-play="${esc(k.videos[0].id)}" data-kanal="${esc(k.name)}" data-titel="${esc(k.videos[0].titel)}" aria-label="Neuestes Video abspielen: ${esc(k.videos[0].titel)}" style="--bild:url('https://i.ytimg.com/vi/${encodeURIComponent(k.videos[0].id)}/hqdefault.jpg')"><span class="iv-pl">${icon('play')}</span></button>
            <div class="md-nt"><span class="eyebrow">Neuestes Video · ${esc(wann(k.videos[0].datum))}</span><div>${esc(k.videos[0].titel)}</div></div></div>` : ''}
        <div class="md-kz">
            <div><div class="eyebrow">Abonnenten</div><div class="num">${de(k.abos)}</div></div>
            <div><div class="eyebrow">Aufrufe je Abo</div><div class="num">${de(k.ratio, 2)}x</div></div>
            <div><div class="eyebrow">Videos/Monat</div><div class="num">${de(k.pro_monat, 1)}</div></div>
            <div><div class="eyebrow">Trend</div><div class="num ${tr > 0 ? 'up' : tr < 0 ? 'down' : ''}">${tr == null ? '?' : (tr > 0 ? '+' : '') + de(tr) + '%'}</div></div>
        </div>
        <div class="md-v">${(k.videos || []).slice(1, 4).map(v => `<button class="md-vl" data-play="${esc(v.id)}" data-kanal="${esc(k.name)}" data-titel="${esc(v.titel)}">
            <span class="md-vt">${icon('play')}${esc(v.titel)}</span><span class="dim mono">${de(v.views)} Aufrufe</span></button>`).join('')}</div>
    </article>`;
}

function liste(d) {
    let l = d.kanaele.filter(k => sprache === 'alle' || k.sprache === sprache);
    if (sort === 'neu') l = [...l].sort((a, b) => String(b.erst_gesehen).localeCompare(String(a.erst_gesehen)) || b.score - a.score);
    else if (sort === 'klein') l = [...l].sort((a, b) => a.abos - b.abos);
    if (!l.length) return empty('In dieser Auswahl gibt es noch keine Treffer. Der Agent sucht bei jedem Lauf weiter.');
    return `<div class="grid g2 md-grid">${l.map(kanalKarte).join('')}</div>`;
}

export default {
    styles: VIDEO_CSS + `
        .md-nt { margin-top: 10px; font-size: .9rem; line-height: 1.4; } .md-nt .eyebrow { display: block; margin-bottom: 4px; }
        .md-vl { box-sizing: border-box; cursor: pointer; border: 0; font: inherit; font-size: .8rem; text-align: left; width: 100%; min-width: 0; } .md-vl svg { width: 12px; height: 12px; margin-right: 8px; vertical-align: -1px; flex: none; } .md-vt { display: block; min-width: 0; flex: 1; }
        .md-k { padding: 18px 20px; display: grid; gap: 14px; align-content: start; min-width: 0; overflow: hidden; }
        .md-k > * { min-width: 0; }
        .md-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .md-av { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; background: var(--bg); box-shadow: var(--sh-in); flex: none; }
        .md-n { display: block; color: var(--ink); text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .md-n:hover { color: var(--pg); }
        .md-sc { font-family: var(--mono); font-size: 1.7rem; font-weight: 300; line-height: 1; }
        .md-kz { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .md-kz .num { font-size: 1.05rem; margin-top: 4px; }
        .md-v { display: grid; gap: 6px; }
        .md-vl { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; font-size: .8rem; color: var(--ink-2); text-decoration: none; padding: 7px 10px; border-radius: 10px; background: var(--bg); box-shadow: var(--sh-in); }
        .md-vl:hover { color: var(--ink); }
        .md-vt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .md-vl .mono { font-size: .68rem; flex: none; }
        @media (max-width: 860px) { .md-grid { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 700px) { .md-kz { grid-template-columns: repeat(2, minmax(0, 1fr)); } }`,
    render(root) {
        root.classList.add('stack');
        const d = M();
        const kopf = pageHead('Entdecken', 'Media', 'Neue, gute Krypto-YouTuber, die noch klein sind: 100 bis 5.000 Abonnenten, Deutsch und Englisch, in den letzten 30 Tagen aktiv. Jeden Tag sucht der Agent nach neuen Namen. Der Score misst Erfolg gemessen an der Größe, nicht an der Reichweite.',
            d ? chip('Stand ' + (d.updated || ''), 'var(--pg)') : '');
        if (!d) { root.innerHTML = kopf + card({ body: empty('Der Media-Agent ist noch nicht gelaufen. Starte ihn mit python3 fetch_media.py im Ordner Agent Dashboard.') }); return; }
        const de_n = d.kanaele.filter(k => k.sprache === 'de').length, en_n = d.kanaele.length - de_n;
        root.innerHTML = kopf +
            `<div class="row between wrap" style="gap:12px">
                <div class="row wrap" style="gap:10px">${chip(d.treffer + ' Treffer', 'var(--up)')}${chip(de_n + ' deutsch')}${chip(en_n + ' englisch')}${chip(d.geprueft + ' Kanäle geprüft')}</div>
                <div class="row wrap" style="gap:10px">${seg('mdS', [['alle', 'Alle'], ['de', 'Deutsch'], ['en', 'Englisch']], sprache)}${seg('mdO', [['score', 'Score'], ['neu', 'Neu'], ['klein', 'Kleinste']], sort)}</div>
            </div><div id="mdListe">${liste(d)}</div>
            <p class="dim" style="font-size:.76rem;line-height:1.5;margin:0">Der Score (0 bis 100) setzt sich zusammen aus Aufrufen je Abonnent (60), Regelmäßigkeit (20) und Aufrufe-Trend (20). Das ist ein Hinweis, kein Urteil über Qualität. Kleine Kanäle schwanken stark, schau dir immer ein paar Videos an.</p>`;
        root.addEventListener('click', e => {
            const p = e.target.closest('[data-play]'); if (!p || !window.cb2Player) return;
            window.cb2Player.spiele({ id: p.dataset.play, titel: p.dataset.titel, kanal: p.dataset.kanal });
            root.querySelectorAll('.iv-k.spielt').forEach(k => k.classList.remove('spielt'));
            p.closest('.iv-k')?.classList.add('spielt');
            if (window.matchMedia('(max-width: 860px)').matches) { const sd = document.getElementById('side'); if (sd) { sd.classList.add('on'); document.getElementById('scrim')?.classList.add('on'); } }
        });
        const neuZeichnen = () => { const l = root.querySelector('#mdListe'); l.innerHTML = liste(d); hydrate(l); };
        for (const [name, set] of [['mdS', v => { sprache = v; }], ['mdO', v => { sort = v; }]]) {
            const s = root.querySelector(`[data-seg="${name}"]`);
            if (s) s.onclick = e => { const b = e.target.closest('button'); if (!b) return; set(b.dataset.v); s.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); neuZeichnen(); };
        }
    },
};
