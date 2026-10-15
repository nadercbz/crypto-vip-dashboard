import { esc } from '../core/fmt.js?v=202610151130';
import { card, pageHead, chip, seg, empty, icon, hydrate } from '../core/ui.js?v=202610151130';
import { VIDEO_CSS } from '../core/influencer_videos.js?v=202610151130';

const M = () => window.MEDIA_DATA || null;
const de = (v, d = 0) => v == null ? '?' : Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
let sprache = 'alle';
let sort = 'score';
let ansicht = 'karten';
let coin = null;            // gewählter Coin im Konsens, filtert beide Ansichten
let nurMehrfach = true;     // im Konsens nur Coins zeigen, über die mindestens 2 Kanäle sprechen
let konsensMehr = false;

const wann = d => { const t = tageSeit(d); return t <= 0 ? 'heute' : t === 1 ? 'gestern' : 'vor ' + t + ' Tagen'; };
const heute = () => new Date().toISOString().slice(0, 10);
const tageSeit = d => d ? Math.round((Date.parse(heute()) - Date.parse(d)) / 864e5) : 99;
const scoreFarbe = s => s >= 60 ? 'var(--up)' : s >= 40 ? 'var(--warn)' : 'var(--ink-2)';
const yt = k => k.handle ? 'https://www.youtube.com/' + (String(k.handle).startsWith('@') ? k.handle : '@' + k.handle) : 'https://www.youtube.com/channel/' + k.id;
const playAttr = (v, k) => `data-play="${esc(v.id)}" data-kanal="${esc(k.name)}" data-titel="${esc(v.titel)}"`;

function coinChips(k, max = 5) {
    const c = (k.coins || []).slice(0, max);
    if (!c.length) return '';
    return `<div class="md-coins">${c.map(x => `<button class="md-cc${coin === x.sym ? ' on' : ''}" data-mdcoin="${esc(x.sym)}" title="${x.n} Video${x.n > 1 ? 's' : ''} mit ${esc(x.sym)} im Titel">${esc(x.sym)}${x.n > 1 ? ' <i>' + x.n + 'x</i>' : ''}</button>`).join('')}</div>`;
}

function konsensKarte(d) {
    const alle = d.konsens || [];
    if (!alle.length) return '';
    const mehr = alle.filter(x => x.n_kanaele >= 2);
    const zeig = nurMehrfach ? mehr : alle;
    const sicht = konsensMehr ? zeig : zeig.slice(0, 18);
    const chips = sicht.length ? sicht.map(x => `<button class="md-kc${x.n_kanaele >= 2 ? ' multi' : ''}${coin === x.sym ? ' on' : ''}" data-mdcoin="${esc(x.sym)}">
            <b>${esc(x.sym)}</b><span>${x.n_kanaele} Kanal${x.n_kanaele > 1 ? 'e' : ''}</span></button>`).join('') : `<span class="dim" style="font-size:.84rem">Noch spricht kein zweiter Kanal über denselben Coin. Sobald das passiert, steht er hier.</span>`;
    let detail = '';
    const sel = alle.find(x => x.sym === coin);
    if (sel) {
        detail = `<div class="md-kd"><div class="row between" style="gap:10px"><div><span class="eyebrow">Wer spricht über ${esc(sel.sym)}</span><div class="h2" style="margin-top:4px">${esc(sel.name)} <span class="dim mono" style="font-size:.78rem">${sel.rank ? '#' + sel.rank : ''}</span></div></div>
            <button class="btn soft" data-mdcoin="">${icon('x')}Auswahl aufheben</button></div>
            <div class="md-kl">${sel.kanaele.map(kk => `<div class="md-kr"><div class="md-kn"><b>${esc(kk.name)}</b><span class="dim mono">${de(kk.abos)} Abos · ${kk.sprache === 'de' ? 'Deutsch' : 'Englisch'} · ${kk.n}x im Titel</span></div>
                <div class="md-kv">${(kk.videos || []).map(v => `<button class="md-vl" ${playAttr(v, kk)}><span class="md-vt">${icon('play')}${esc(v.titel)}</span></button>`).join('')}</div></div>`).join('')}</div></div>`;
    }
    return card({
        eyebrow: 'Konsens', title: 'Worüber die kleinen Kanäle gerade sprechen',
        right: `<label class="md-sw"><input type="checkbox" id="mdMehr" ${nurMehrfach ? 'checked' : ''}> nur Coins, über die mindestens 2 Kanäle sprechen</label>`,
        body: `<p class="dim" style="font-size:.8rem;line-height:1.5;margin:0 0 12px">Aus den Titeln der letzten Videos aller Kanäle in der Liste. Ein Klick auf einen Coin zeigt, wer darüber spricht und filtert die Liste. ${mehr.length ? '<b>' + mehr.length + ' Coins</b> werden von mehreren Kanälen genannt.' : ''}</p>
            <div class="md-kcs">${chips}</div>${zeig.length > 18 ? `<button class="btn soft" id="mdKMehr" style="margin-top:12px">${konsensMehr ? 'Weniger zeigen' : 'Alle ' + zeig.length + ' zeigen'}</button>` : ''}${detail}`,
    });
}

function kanalKarte(k, i) {
    const neu = tageSeit(k.erst_gesehen) <= 7;
    const tr = k.trend;
    const v0 = (k.videos || [])[0];
    return `<article class="card md-k">
        <div class="row between" style="align-items:flex-start;gap:12px">
            <div class="row" style="min-width:0;gap:12px">
                <img class="md-av" src="${esc(k.avatar || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
                <div style="min-width:0"><div class="eyebrow">Platz ${i + 1} · ${k.sprache === 'de' ? 'Deutsch' : 'Englisch'}${neu ? ' · neu' : ''}</div>
                    <a class="h2 md-n" href="${esc(yt(k))}" target="_blank" rel="noopener">${esc(k.name)}</a></div></div>
            <div class="md-sc" style="color:${scoreFarbe(k.score)}" title="Score aus Aufrufen je Abonnent, Regelmäßigkeit und Aufrufe-Trend">${de(k.score, 0)}</div>
        </div>
        ${v0 ? `<div class="iv-k md-neu" data-v="${esc(v0.id)}">
            <button class="iv-th" ${playAttr(v0, k)} aria-label="Neuestes Video abspielen: ${esc(v0.titel)}" style="--bild:url('https://i.ytimg.com/vi/${encodeURIComponent(v0.id)}/hqdefault.jpg')"><span class="iv-pl">${icon('play')}</span></button>
            <div class="md-nt"><span class="eyebrow">Neuestes Video · ${esc(wann(v0.datum))}</span><div>${esc(v0.titel)}</div></div></div>` : ''}
        ${coinChips(k)}
        <div class="md-kz">
            <div><div class="eyebrow">Abonnenten</div><div class="num">${de(k.abos)}</div></div>
            <div><div class="eyebrow">Aufrufe je Abo</div><div class="num">${de(k.ratio, 2)}x</div></div>
            <div><div class="eyebrow">Videos/Monat</div><div class="num">${de(k.pro_monat, 1)}</div></div>
            <div><div class="eyebrow">Trend</div><div class="num ${tr > 0 ? 'up' : tr < 0 ? 'down' : ''}">${tr == null ? '?' : (tr > 0 ? '+' : '') + de(tr) + '%'}</div></div>
        </div>
        <div class="md-v">${(k.videos || []).slice(1, 4).map(v => `<button class="md-vl" ${playAttr(v, k)}>
            <span class="md-vt">${icon('play')}${esc(v.titel)}</span><span class="dim mono">${de(v.views)} Aufrufe</span></button>`).join('')}</div>
    </article>`;
}

function listenTabelle(l) {
    return `<div class="tbl-wrap"><table class="tbl md-tbl"><thead><tr><th class="r">#</th><th>Kanal</th><th>Sprache</th><th class="r">Abos</th><th class="r">Aufrufe je Abo</th><th class="r">Videos/Monat</th><th class="r">Trend</th><th class="r">Score</th><th>Coins</th><th>Neuestes Video</th></tr></thead><tbody>
        ${l.map((k, i) => {
            const v0 = (k.videos || [])[0], tr = k.trend;
            return `<tr><td class="r dim">${i + 1}</td>
                <td><div class="row" style="gap:10px;min-width:180px"><img class="md-av s" src="${esc(k.avatar || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><a href="${esc(yt(k))}" target="_blank" rel="noopener" class="md-ln">${esc(k.name)}</a></div></td>
                <td>${k.sprache === 'de' ? 'Deutsch' : 'Englisch'}</td>
                <td class="r num">${de(k.abos)}</td><td class="r num">${de(k.ratio, 2)}x</td><td class="r num">${de(k.pro_monat, 1)}</td>
                <td class="r num ${tr > 0 ? 'up' : tr < 0 ? 'down' : ''}">${tr == null ? '?' : (tr > 0 ? '+' : '') + de(tr) + '%'}</td>
                <td class="r num" style="color:${scoreFarbe(k.score)}">${de(k.score, 0)}</td>
                <td>${coinChips(k, 6) || '<span class="dim">·</span>'}</td>
                <td>${v0 ? `<button class="md-vl md-vlz" ${playAttr(v0, k)}><span class="md-vt">${icon('play')}${esc(v0.titel)}</span></button><div class="dim mono" style="font-size:.66rem;margin-top:2px">${esc(wann(v0.datum))} · ${de(v0.views)} Aufrufe</div>` : ''}</td></tr>`;
        }).join('')}
    </tbody></table></div>`;
}

function liste(d) {
    let l = d.kanaele.filter(k => (sprache === 'alle' || k.sprache === sprache) && (!coin || (k.coins || []).some(c => c.sym === coin)));
    if (sort === 'neu') l = [...l].sort((a, b) => String(b.erst_gesehen).localeCompare(String(a.erst_gesehen)) || b.score - a.score);
    else if (sort === 'klein') l = [...l].sort((a, b) => a.abos - b.abos);
    else if (sort === 'abos') l = [...l].sort((a, b) => b.abos - a.abos);
    const kopf = coin ? `<div class="row wrap" style="gap:10px;margin-bottom:12px">${chip('Filter: ' + coin, 'var(--pg)')}<button class="btn soft" data-mdcoin="">${icon('x')}Filter aufheben</button><span class="dim" style="font-size:.8rem">${l.length} Kanal${l.length === 1 ? '' : 'e'} sprechen über ${esc(coin)}</span></div>` : '';
    if (!l.length) return kopf + empty('In dieser Auswahl gibt es noch keine Treffer. Der Agent sucht bei jedem Lauf weiter.');
    return kopf + (ansicht === 'liste' ? listenTabelle(l) : `<div class="grid g2 md-grid">${l.map(kanalKarte).join('')}</div>`);
}

export default {
    styles: VIDEO_CSS + `
        .md-nt { margin-top: 10px; font-size: .9rem; line-height: 1.4; } .md-nt .eyebrow { display: block; margin-bottom: 4px; }
        .md-k { padding: 18px 20px; display: grid; gap: 14px; align-content: start; min-width: 0; overflow: hidden; }
        .md-k > * { min-width: 0; }
        .md-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .md-av { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; background: var(--bg); box-shadow: var(--sh-in); flex: none; } .md-av.s { width: 30px; height: 30px; }
        .md-n { display: block; color: var(--ink); text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .md-n:hover, .md-ln:hover { color: var(--pg); }
        .md-ln { color: var(--ink); text-decoration: none; font-weight: 500; }
        .md-sc { font-family: var(--mono); font-size: 1.7rem; font-weight: 300; line-height: 1; }
        .md-kz { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .md-kz .num { font-size: 1.05rem; margin-top: 4px; }
        .md-v { display: grid; gap: 6px; }
        .md-vl { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; font-size: .8rem; color: var(--ink-2); text-decoration: none; padding: 7px 10px; border-radius: 10px; background: var(--bg); box-shadow: var(--sh-in); box-sizing: border-box; cursor: pointer; border: 0; font-family: inherit; text-align: left; width: 100%; min-width: 0; }
        .md-vl:hover { color: var(--ink); }
        .md-vl svg { width: 12px; height: 12px; margin-right: 8px; vertical-align: -1px; flex: none; }
        .md-vt { display: block; min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .md-vl .mono { font-size: .68rem; flex: none; }
        .md-vlz { max-width: 340px; }
        .md-coins { display: flex; flex-wrap: wrap; gap: 6px; }
        .md-cc { font-family: var(--mono); font-size: .68rem; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--line); color: var(--ink-2); background: transparent; cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
        .md-cc i { font-style: normal; color: var(--ink-3); } .md-cc:hover, .md-cc.on { background: color-mix(in srgb, var(--pg) 18%, transparent); border-color: var(--pg); color: var(--ink); }
        .md-kcs { display: flex; flex-wrap: wrap; gap: 8px; }
        .md-kc { display: inline-flex; align-items: baseline; gap: 8px; padding: 8px 14px; border-radius: 14px; border: 1px solid var(--line); background: var(--bg); box-shadow: var(--sh-in); color: var(--ink-2); cursor: pointer; font-family: inherit; transition: border-color .2s, transform .2s var(--ease); }
        .md-kc b { font-family: var(--mono); font-weight: 600; font-size: .86rem; color: var(--ink); } .md-kc span { font-size: .7rem; color: var(--ink-3); }
        .md-kc.multi { border-color: color-mix(in srgb, var(--up) 55%, var(--line)); } .md-kc.multi span { color: var(--up); }
        .md-kc:hover, .md-kc.on { transform: translateY(-2px); border-color: var(--pg); }
        .md-kc.on { background: color-mix(in srgb, var(--pg) 14%, var(--bg)); }
        .md-sw { font-size: .76rem; color: var(--ink-2); display: inline-flex; align-items: center; gap: 8px; cursor: pointer; } .md-sw input { accent-color: var(--pg); }
        .md-kd { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); display: grid; gap: 14px; }
        .md-kl { display: grid; gap: 10px; } .md-kr { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.3fr); gap: 14px; align-items: start; padding: 10px 0; border-bottom: 1px solid var(--line); }
        .md-kn { display: grid; gap: 3px; min-width: 0; } .md-kn b { font-weight: 500; } .md-kn span { font-size: .7rem; }
        .md-kv { display: grid; gap: 6px; min-width: 0; }
        .md-tbl td { vertical-align: top; } .md-tbl .md-coins { max-width: 260px; }
        @media (max-width: 860px) { .md-grid { grid-template-columns: minmax(0, 1fr); } .md-kr { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 700px) { .md-kz { grid-template-columns: repeat(2, minmax(0, 1fr)); } }`,
    render(root) {
        root.classList.add('stack');
        const d = M();
        const kopf = pageHead('Entdecken', 'Media', 'Neue, gute Krypto-YouTuber, die noch klein sind: 100 bis 5.000 Abonnenten, Deutsch und Englisch, zuletzt aktiv. Jeden Tag sucht der Agent nach neuen Namen. Der Score misst Erfolg gemessen an der Größe, nicht an der Reichweite.',
            d ? chip('Stand ' + (d.updated || ''), 'var(--pg)') : '');
        if (!d) { root.innerHTML = kopf + card({ body: empty('Der Media-Agent ist noch nicht gelaufen. Starte ihn mit python3 fetch_media.py im Ordner Agent Dashboard.') }); return; }
        const de_n = d.kanaele.filter(k => k.sprache === 'de').length, en_n = d.kanaele.length - de_n;
        root.innerHTML = kopf +
            `<div class="row between wrap" style="gap:12px">
                <div class="row wrap" style="gap:10px">${chip(d.treffer + ' Treffer', 'var(--up)')}${chip(de_n + ' deutsch')}${chip(en_n + ' englisch')}${chip(d.geprueft + ' Kanäle geprüft')}</div>
                <div class="row wrap" style="gap:10px">${seg('mdV', [['karten', 'Karten'], ['liste', 'Liste']], ansicht)}${seg('mdS', [['alle', 'Alle'], ['de', 'Deutsch'], ['en', 'Englisch']], sprache)}${seg('mdO', [['score', 'Score'], ['neu', 'Neu'], ['klein', 'Kleinste'], ['abos', 'Größte']], sort)}</div>
            </div><div id="mdKonsens">${konsensKarte(d)}</div><div id="mdListe">${liste(d)}</div>
            <p class="dim" style="font-size:.76rem;line-height:1.5;margin:0">Der Score (0 bis 100) setzt sich zusammen aus Aufrufen je Abonnent (60), Regelmäßigkeit (20) und Aufrufe-Trend (20). Das ist ein Hinweis, kein Urteil über Qualität. Coins stammen aus den Videotiteln, nicht aus dem Gesprochenen. Kleine Kanäle schwanken stark, schau dir immer ein paar Videos an.</p>`;
        const neuZeichnen = () => {
            const k = root.querySelector('#mdKonsens'); k.innerHTML = konsensKarte(d); hydrate(k);
            const l = root.querySelector('#mdListe'); l.innerHTML = liste(d); hydrate(l);
            bindKonsens();
        };
        const bindKonsens = () => { const c = root.querySelector('#mdMehr'); if (c) c.onchange = () => { nurMehrfach = c.checked; konsensMehr = false; neuZeichnen(); }; const m = root.querySelector('#mdKMehr'); if (m) m.onclick = () => { konsensMehr = !konsensMehr; neuZeichnen(); }; };
        bindKonsens();
        for (const [name, set] of [['mdV', v => { ansicht = v; }], ['mdS', v => { sprache = v; }], ['mdO', v => { sort = v; }]]) {
            const s = root.querySelector(`[data-seg="${name}"]`);
            if (s) s.onclick = e => { const b = e.target.closest('button'); if (!b) return; set(b.dataset.v); s.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); const l = root.querySelector('#mdListe'); l.innerHTML = liste(d); hydrate(l); };
        }
        root.addEventListener('click', e => {
            const c = e.target.closest('[data-mdcoin]');
            if (c) { const s = c.dataset.mdcoin; coin = (!s || coin === s) ? null : s; neuZeichnen(); if (coin) root.querySelector('#mdKonsens')?.scrollIntoView({ block: 'nearest' }); return; }
            const p = e.target.closest('[data-play]'); if (!p || !window.cb2Player) return;
            window.cb2Player.spiele({ id: p.dataset.play, titel: p.dataset.titel, kanal: p.dataset.kanal });
            root.querySelectorAll('.iv-k.spielt').forEach(k => k.classList.remove('spielt'));
            p.closest('.iv-k')?.classList.add('spielt');
            if (window.matchMedia('(max-width: 860px)').matches) { const sd = document.getElementById('side'); if (sd) { sd.classList.add('on'); document.getElementById('scrim')?.classList.add('on'); } }
        });
    },
};
