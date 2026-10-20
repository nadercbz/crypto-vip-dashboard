import { D } from './data.js?v=202610201331';
import { esc } from './fmt.js?v=202610201331';
import { card, icon, seg } from './ui.js?v=202610201331';

let tab = 'alle', anzahl = 8;
const tage = d => d ? Math.max(0, (Date.now() - new Date(d + 'T12:00:00').getTime()) / 86400000) : 99;
const zahl = n => n == null ? '' : n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' Mio' : n >= 1e3 ? Math.round(n / 1e3) + ' Tsd' : String(n);
const vorTagen = d => { const t = Math.round(tage(d)); return t <= 0 ? 'heute' : t === 1 ? 'gestern' : `vor ${t} Tagen`; };
const median = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

function sammeln() {
    const out = [], seen = new Set();
    const nimm = (kanal, abos, gruppe, videos, url) => {
        const med = median(videos.map(v => v.views)) || 1;
        videos.forEach(v => {
            if (!v.id || seen.has(v.id) || tage(v.datum) > 21) return;
            seen.add(v.id);
            const rel = Math.min(4, (v.views || 0) / med), rec = Math.exp(-tage(v.datum) / 5), gr = 0.6 + Math.log10(Math.max(abos || 1000, 1000)) / 7;
            out.push({ id: v.id, titel: v.titel, kanal, abos, gruppe, datum: v.datum, views: v.views, url, score: (0.5 + rel) * rec * gr, rel });
        });
    };
    const F = D.fluencer;
    ((F && F.quellen) || []).forEach(q => {
        const abos = parseInt(String(q.abos || '').replace(/[^\d]/g, ''), 10) || 1000;
        nimm(q.name, abos, 'eigene', q.videos || [], q.youtube_url);
    });
    return out;
}

function karten(liste) {
    return liste.map(v => `<article class="iv-k" data-iv="${esc(v.id)}">
        <button class="iv-th" data-play="${esc(v.id)}" aria-label="Video abspielen: ${esc(v.titel)}" style="--bild:url('https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg')">
            <span class="iv-pl">${icon('play')}</span>${v.rel >= 1.5 ? `<span class="iv-hot">${icon('flame')}${v.rel.toFixed(1).replace('.', ',')}x Aufrufe</span>` : ''}
        </button>
        <div class="iv-t"><a href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}" target="_blank" rel="noopener" title="${esc(v.titel)}">${esc(v.titel)}</a></div>
        <div class="iv-m"><b>${esc(v.kanal)}</b><span>${esc(vorTagen(v.datum))}${v.views != null ? ' · ' + zahl(v.views) + ' Aufrufe' : ''}</span></div>
    </article>`).join('');
}
const kanalListe = () => [...new Set(sammeln().map(v => v.kanal))];
const gefiltert = () => sammeln().filter(v => tab === 'alle' || v.kanal === tab).sort((a, b) => b.score - a.score).slice(0, anzahl);

export function videoKarte() {
    const alle = sammeln();
    if (!alle.length) return '';
    return card({
        eyebrow: 'Video', title: 'Die wichtigsten neuen Videos der Influencer',
        right: `<div class="iv-seg">${seg('ivtab', [['alle', 'Alle'], ...kanalListe().map(k => [k, k])], tab)}</div>`,
        body: `<p class="iv-p">Nur Kanäle aus deiner Influencer-Liste. Neu und ungewöhnlich stark angeschaut kommt zuerst. Ein Klick aufs Bild startet den Mini-Player links im Menü, das Video läuft beim Seitenwechsel weiter. Reihenfolge ist Aufmerksamkeit, kein Qualitätsurteil.</p>
            <div class="iv-grid" id="ivGrid">${karten(gefiltert())}</div>
            <div class="row" style="justify-content:center;margin-top:16px"><button class="btn soft" id="ivMehr">Mehr Videos</button></div>`,
    });
}

export function bindVideos(root) {
    const grid = root.querySelector('#ivGrid'); if (!grid) return;
    const neu = () => { grid.innerHTML = karten(gefiltert()); };
    root.querySelector('[data-seg="ivtab"]')?.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        tab = b.dataset.v; anzahl = 8;
        root.querySelectorAll('[data-seg="ivtab"] button').forEach(x => x.classList.toggle('on', x === b));
        neu();
    });
    root.querySelector('#ivMehr')?.addEventListener('click', () => { anzahl += 8; neu(); });
    grid.addEventListener('click', e => {
        const p = e.target.closest('[data-play]'); if (!p) return;
        const v = sammeln().find(x => x.id === p.dataset.play) || { id: p.dataset.play };
        if (window.cb2Player) {
            window.cb2Player.spiele({ id: v.id, titel: v.titel, kanal: v.kanal });
            grid.querySelectorAll('.iv-k.spielt').forEach(k => k.classList.remove('spielt'));
            p.closest('.iv-k')?.classList.add('spielt');
            if (window.matchMedia('(max-width: 860px)').matches) { const sd = document.getElementById('side'); if (sd) { sd.classList.add('on'); document.getElementById('scrim')?.classList.add('on'); } }
        }
    });

}

export const VIDEO_CSS = `
    .iv-seg { max-width: 100%; overflow-x: auto; scrollbar-width: none; } .iv-seg .seg { flex-wrap: nowrap; } .iv-seg button { flex: none; white-space: nowrap; }
    .iv-p { margin: 0 0 14px; font-size: .82rem; color: var(--ink-3); line-height: 1.6; font-weight: 300; }
    .iv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 14px; }
    .iv-k { display: flex; flex-direction: column; gap: 9px; min-width: 0; }
    .iv-th { all: unset; position: relative; display: block; width: 100%; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; cursor: pointer; background: var(--sunk) var(--bild) center / cover; box-shadow: var(--sh-sm); transition: transform .3s var(--ease), box-shadow .3s; }
    .iv-th:hover, .iv-th:focus-visible { transform: translateY(-2px) scale(1.01); box-shadow: var(--sh-md, var(--sh-sm)); outline: 2px solid color-mix(in srgb, var(--pg) 50%, transparent); outline-offset: 2px; }
    .iv-k.spielt .iv-th { outline: 2px solid var(--up); outline-offset: 2px; } .iv-th iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    .iv-pl { position: absolute; inset: 0; display: grid; place-items: center; background: linear-gradient(to top, rgba(0,0,0,.35), transparent 55%); } .iv-pl svg { width: 46px; height: 46px; padding: 12px; border-radius: 50%; background: rgba(255,255,255,.92); color: #111; fill: #111; transition: transform .25s var(--ease); } .iv-th:hover .iv-pl svg { transform: scale(1.12); }
    .iv-hot { position: absolute; left: 10px; top: 10px; display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 99px; background: rgba(0,0,0,.6); color: #fff; font-size: .66rem; font-family: var(--mono); } .iv-hot svg { width: 12px; height: 12px; color: #ffb347; }
    .iv-t { font-size: .88rem; font-weight: 500; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; } .iv-t a { color: var(--ink); text-decoration: none; } .iv-t a:hover { color: var(--pg); }
    .iv-m { display: flex; flex-direction: column; gap: 2px; font-size: .72rem; color: var(--ink-3); } .iv-m b { font-weight: 500; color: var(--ink-2); }
    @media (max-width: 640px) { .iv-grid { grid-template-columns: 1fr; } }`;
