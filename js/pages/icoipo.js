import { D } from '../core/data.js?v=202610102000';
import { esc, fBig, fPct, fUsd, cls, ago } from '../core/fmt.js?v=202610102000';
import { card, pageHead, seg, chip, empty, icon, icons } from '../core/ui.js?v=202610102000';

const TABS = [['heute', 'Heute'], ['30', 'Nächste 30 Tage'], ['6m', '3 bis 6 Monate'], ['3j', '1 bis 3 Jahre'], ['offen', 'Ohne Termin'], ['abgeschlossen', 'Abgeschlossen'], ['alle', 'Alle']];
const STATUS_FARBE = { 'durchgeführt': 'var(--up)', 'aktiv': 'var(--a1)', 'angekündigt': 'var(--a2)', 'geplant': 'var(--ink-2)', 'verschoben': 'var(--warn)', 'abgesagt': 'var(--down)' };
const PHASE_FARBE = { 'Anfang': 'var(--a1)', 'Wachstum': 'var(--up)', 'Hype': 'var(--warn)', 'rückläufig': 'var(--down)' };
const st = { tab: 'heute', art: 'alle', narr: '', q: '', status: '' };
let overlays = [], onKey = null;

const dash = v => (v == null || v === '' || (Array.isArray(v) && !v.length)) ? '–' : v;
const dat = d => { if (!d) return null; const t = new Date(d.length === 10 ? d + 'T12:00:00' : d); return isNaN(t) ? d : t.toLocaleDateString('de-DE', d.length === 10 ? { day: '2-digit', month: '2-digit', year: 'numeric' } : { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
const wann = e => e.datum && e.datum.length === 10 ? dat(e.datum) : (e.zeitraum || e.datum || 'kein Termin bekannt');
const get = () => D.icoipo;
const link = (u, t) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" class="io-l">${esc(t)}</a>` : esc(t);
const mcap = v => v == null ? '–' : fBig(v);

function zaehle(daten) {
    const c = {}; TABS.forEach(([k]) => { c[k] = 0; });
    daten.eintraege.forEach(e => { c.alle++; if (c[e.horizont] != null) c[e.horizont]++; });
    return c;
}
function gefiltert(daten) {
    const q = st.q.trim().toLowerCase();
    return daten.eintraege.filter(e =>
        (st.tab === 'alle' || e.horizont === st.tab) && (st.art === 'alle' || e.art === st.art) && (!st.status || e.status === st.status) &&
        (!st.narr || (e.narrative || []).includes(st.narr)) &&
        (!q || [e.name, e.ticker, e.branche, (e.narrative || []).join(' '), e.chain].join(' ').toLowerCase().includes(q)))
        .sort((a, b) => (a.datum || '9999').localeCompare(b.datum || '9999') || a.name.localeCompare(b.name));
}

function zeile(e) {
    const sc = STATUS_FARBE[e.status] || 'var(--ink-3)';
    const m = e.markt || {};
    return `<button class="io-row" data-io="${esc(e.id)}">
        <div class="io-r1"><span class="io-art ${e.art}">${e.art}</span><b>${esc(e.name)}</b>${e.ticker ? `<span class="io-tk">${esc(e.ticker)}</span>` : ''}
            ${e.pruefen ? `<span class="io-warn" title="${esc(e.pruefen)}">${icon('triangle-alert')}prüfen</span>` : ''}</div>
        <div class="io-r2"><span>${esc(wann(e))}</span>${chip(e.status, sc)}</div>
        <div class="io-r3">${(e.narrative || []).map(n => `<span class="io-n">${esc(n)}</span>`).join('')}</div>
        <div class="io-r4"><span class="dim">Bewertung</span><span>${esc(dash(e.bewertung))}</span></div>
        <div class="io-r5">${m.preis != null ? `<span class="num">${m.preis < 1 ? '$' + m.preis.toPrecision(3) : fUsd(m.preis)}</span> <span class="${cls(m.c30)}">${m.c30 != null ? fPct(m.c30) + ' 30T' : ''}</span>` : '<span class="dim">kein Kurs</span>'}</div>
    </button>`;
}

function narrKarte(n, aktiv) {
    const pf = PHASE_FARBE[n.phase] || 'var(--ink-3)';
    return `<button class="io-nk ${aktiv ? 'on' : ''}" data-narr="${esc(n.name)}">
        <div class="io-nk1"><b>${esc(n.name)}</b>${n.neu ? '<span class="io-neu">neu erkannt</span>' : ''}</div>
        <div class="io-nk2">${n.phase ? chip(n.phase, pf) : '<span class="dim">–</span>'}<span class="io-tr ${n.trend === 'aufwärts' ? 'up' : n.trend === 'abwärts' ? 'down' : 'dim'}">${icon(n.trend === 'aufwärts' ? 'trending-up' : n.trend === 'abwärts' ? 'trending-down' : 'minus')}${esc(n.trend || '')}</span></div>
        <div class="io-bar"><i style="width:${Math.max(3, n.staerke || 0)}%;background:${pf}"></i></div>
        <div class="io-nk3"><span>Stärke ${n.staerke == null ? '–' : n.staerke}</span><span>${(n.projekte || []).length} Projekt${(n.projekte || []).length === 1 ? '' : 'e'}</span></div>
    </button>`;
}

function kv(l, w, s = '') { return `<div class="io-kv"><div class="eyebrow">${l}</div><div class="io-kvw">${w}</div>${s ? `<div class="io-kvs">${s}</div>` : ''}</div>`; }

function detail(daten, e) {
    const m = e.markt || {}, a = e.analyse || {};
    const sc = STATUS_FARBE[e.status] || 'var(--ink-3)';
    const prot = (daten.protokoll || []).filter(p => p.id === e.id).slice(0, 8);
    const vergl = e.vergleich_aufgeloest || [];
    const narr = (a.narrative || []).map(n => `<div class="io-an">
        <div class="io-an1"><b>${esc(n.name)}</b>${n.phase ? chip(n.phase, PHASE_FARBE[n.phase]) : ''}${n.neu ? '<span class="io-neu">neu erkannt</span>' : ''}</div>
        <div class="io-ang">${kv('Stärke', n.staerke == null ? '–' : n.staerke + ' von 100')}${kv('Trend', esc(dash(n.trend)))}${kv('Wachstum 30 Tage', n.wachstum30 == null ? '–' : `<span class="${cls(n.wachstum30)}">${fPct(n.wachstum30)}</span>`)}${kv('Marktgröße (Top 25)', mcap(n.mcap_top))}${kv('Nachfrage (Volumen zu Kapital)', n.nachfrage == null ? '–' : (n.nachfrage * 100).toFixed(1) + ' %')}${kv('Dominantes Projekt', n.dominant ? `${esc(n.dominant.name)} (${n.dominant.anteil} % des Segments)` : '–')}</div></div>`).join('');
    const o = document.createElement('div'); o.className = 'io-ov';
    o.innerHTML = `<div class="io-panel" role="dialog" aria-label="${esc(e.name)}">
        <div class="io-pk"><div><div class="eyebrow">${e.art === 'ICO' ? 'Token-Verkauf (ICO)' : 'Börsengang (IPO)'}</div><h2 class="h1" style="margin-top:6px">${esc(e.name)}${e.ticker ? ` <span class="io-tk big">${esc(e.ticker)}</span>` : ''}</h2>
            <div class="io-chips">${chip(e.status, sc)}${(e.narrative || []).map(n => chip(n, 'var(--a2)')).join('')}${(e.sub || []).map(n => chip(n, 'var(--ink-3)')).join('')}${chip('Vertrauen ' + (e.vertrauen || 'niedrig'), e.vertrauen === 'hoch' ? 'var(--up)' : e.vertrauen === 'mittel' ? 'var(--warn)' : 'var(--down)')}</div></div>
            <button class="io-x" data-zu title="Schließen">${icon('x')}</button></div>
        ${e.pruefen ? `<div class="io-hinw">${icon('triangle-alert')}<div><b>Prüfhinweis.</b> ${esc(e.pruefen)}</div></div>` : ''}
        <div class="io-kvs4">${kv('Datum oder Zeitraum', esc(wann(e)))}${kv('Branche', esc(dash(e.branche)))}${kv('Bewertung', esc(dash(e.bewertung)))}${kv('Ziel', esc(dash(e.ziel)))}${kv('Eingesammelt', esc(dash(e.eingesammelt)))}${kv('Blockchain', esc(dash(e.chain)))}${kv('Börsen', esc(dash((e.boersen || []).join(', '))))}${kv('Preis zum Start', esc(dash(e.ausgabepreis || (e.verkaufspreis_usd ? '$' + e.verkaufspreis_usd : null))))}</div>
        ${m.preis != null ? `<section class="io-sec"><div class="eyebrow">Marktdaten (${esc(m.quelle || '')}, ${esc(dat(m.stand) || '')})</div><div class="io-kvs4">${kv('Kurs jetzt', m.preis < 1 ? '$' + m.preis.toPrecision(4) : fUsd(m.preis))}${kv('Marktkapital', mcap(m.mcap))}${m.fdv ? kv('Voll verwässert (FDV)', mcap(m.fdv)) : ''}${kv('Änderung 7 Tage', m.c7 == null ? '–' : `<span class="${cls(m.c7)}">${fPct(m.c7)}</span>`)}${kv('Änderung 30 Tage', m.c30 == null ? '–' : `<span class="${cls(m.c30)}">${fPct(m.c30)}</span>`)}${m.x_seit_verkauf != null ? kv('Seit Verkaufspreis', m.x_seit_verkauf + 'x') : ''}${m.pct_seit_start != null ? kv('Seit Handelsstart', `<span class="${cls(m.pct_seit_start)}">${fPct(m.pct_seit_start)}</span>`) : ''}${e.erster_kurs ? kv('Erster Handelstag', esc(e.erster_kurs)) : ''}</div></section>` : (e.erster_kurs ? `<section class="io-sec"><div class="eyebrow">Erster Handelstag</div><div>${esc(e.erster_kurs)}</div></section>` : '')}
        <section class="io-sec"><div class="eyebrow">Narrativ und Begründung</div><p class="io-p">${esc(dash(e.narrativ_grund))}</p>${narr || ''}</section>
        <section class="io-sec"><div class="eyebrow">Wettbewerbsanalyse (regelbasiert, ohne Wertung)</div>
            ${vergl.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Vergleich</th><th>Art</th><th>Marktkapital</th><th>7 Tage</th><th>30 Tage</th></tr></thead><tbody>${vergl.map(v => `<tr><td><b>${esc(v.name)}</b>${v.sym ? ` <span class="dim">${esc(v.sym)}</span>` : ''}${v.hinweis ? `<div class="dim" style="font-size:.7rem;white-space:normal">${esc(v.hinweis)}</div>` : ''}</td><td>${esc(v.typ)}${v.status ? ' · ' + esc(v.status) : ''}</td><td class="num">${mcap(v.mcap)}</td><td class="${cls(v.c7)}">${v.c7 == null ? '–' : fPct(v.c7)}</td><td class="${cls(v.c30)}">${v.c30 == null ? '–' : fPct(v.c30)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="dim">Keine direkten Vergleichsprojekte hinterlegt.</p>'}
            ${(e.etablierte_aufgeloest || []).length ? `<div class="io-refs"><span class="eyebrow">Etablierte Projekte im selben Narrativ</span>${e.etablierte_aufgeloest.map(v => `<span class="io-ref">${esc(v.name)} · ${mcap(v.mcap)}${v.c30 != null ? ` · <span class="${cls(v.c30)}">${fPct(v.c30)} 30T</span>` : ''}</span>`).join('')}</div>` : ''}
            ${(a.aehnliche || []).length ? `<div class="io-refs"><span class="eyebrow">Ähnliche ICOs im selben Narrativ</span>${a.aehnliche.map(v => `<span class="io-ref">${esc(v.name)}${v.x_seit_verkauf != null ? ` · ${v.x_seit_verkauf}x seit Verkauf` : ''}${v.pct_seit_start != null ? ` · <span class="${cls(v.pct_seit_start)}">${fPct(v.pct_seit_start)}</span> seit Start` : ''}</span>`).join('')}</div>` : ''}
            <p class="io-p"><b>Rolle:</b> ${esc(dash(a.rolle))}</p>
            ${(a.neues_narrativ || []).length ? `<p class="io-p"><b>Anzeichen eines neuen Narrativs:</b> ${esc(a.neues_narrativ.join(', '))} wurde vom Agenten neu erkannt.</p>` : ''}
        </section>
        <div class="io-cols">
            <section class="io-sec"><div class="eyebrow">Investoren und Partner</div><p class="io-p">${esc(dash(e.investoren))}</p></section>
            <section class="io-sec"><div class="eyebrow">Alleinstellungsmerkmal</div><p class="io-p">${esc(dash(e.usp))}</p></section>
            <section class="io-sec"><div class="eyebrow">Risiken und Unklarheiten</div><p class="io-p">${esc(dash(e.risiken))}</p></section>
        </div>
        ${(e.news || []).length ? `<section class="io-sec"><div class="eyebrow">Nachrichten</div><ul class="io-ul">${e.news.slice(0, 8).map(n => `<li><span class="dim">${esc(dat(n.d) || '')}</span> ${link(n.u, n.t)}</li>`).join('')}</ul></section>` : ''}
        <section class="io-sec"><div class="eyebrow">Quellen (${(e.quellen || []).length}) · letztes Update ${esc(dat(e.stand) || '–')}${e.geaendert ? ' · zuletzt geändert ' + esc(dat(e.geaendert)) : ''}</div><ul class="io-ul">${(e.quellen || []).map(q => `<li>${link(q.u, q.t)}</li>`).join('') || '<li class="dim">Keine Quelle hinterlegt.</li>'}</ul></section>
        ${prot.length ? `<section class="io-sec"><div class="eyebrow">Was sich geändert hat</div><ul class="io-ul">${prot.map(p => `<li><span class="dim">${esc(p.tag)}</span> <b>${esc(p.feld)}</b>: ${p.alt != null ? esc(String(p.alt)) + ' → ' : ''}${esc(String(p.neu))} <span class="dim">(${esc(p.quelle)})</span></li>`).join('')}</ul></section>` : ''}
        <p class="io-haft">${esc(daten.haftung)}</p>
    </div>`;
    o.onclick = ev => { if (ev.target === o || ev.target.closest('[data-zu]')) zu(o); };
    document.body.appendChild(o); overlays.push(o); icons(o);
}
function zu(o) { o.remove(); overlays = overlays.filter(x => x !== o); }

function zeichne(root, daten) {
    const c = zaehle(daten), liste = gefiltert(daten);
    root.querySelector('#ioTabs').innerHTML = TABS.map(([k, l]) => `<button data-tab="${k}" class="${st.tab === k ? 'on' : ''}">${l}<i>${c[k]}</i></button>`).join('');
    root.querySelector('#ioListe').innerHTML = liste.length ? liste.map(zeile).join('') : empty('Für diese Auswahl gibt es keine Einträge.');
    root.querySelector('#ioNarr').innerHTML = daten.narrative.map(n => narrKarte(n, st.narr === n.name)).join('');
    root.querySelector('#ioAnz').textContent = `${liste.length} von ${daten.eintraege.length} Einträgen`;
    icons(root);
}

export default {
    styles: `
        .io-info { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; }
        .io-info b { font-family: var(--mono); font-weight: 500; }
        .io-q { display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: .64rem; color: var(--ink-2); }
        .io-q i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); display: inline-block; }
        .io-haft, .io-note { font-size: .78rem; color: var(--ink-3); line-height: 1.55; font-weight: 300; max-width: 900px; }
        .io-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
        .io-tabs button { padding: 9px 16px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); font-size: .82rem; color: var(--ink-3); display: inline-flex; gap: 8px; align-items: center; transition: color .2s, transform .2s var(--ease-spring); }
        .io-tabs button i { font-style: normal; font-family: var(--mono); font-size: .66rem; padding: 1px 8px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--ink) 8%, transparent); }
        .io-tabs button.on { background: var(--surface); box-shadow: var(--sh-sm); color: var(--ink); }
        .io-ctl { display: flex; flex-wrap: wrap; gap: 12px 18px; align-items: center; }
        .io-ctl input, .io-ctl select { padding: 9px 14px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); color: var(--ink); border: 0; font: inherit; font-size: .84rem; min-width: 0; max-width: 100%; }
        .io-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
        .io-row { text-align: left; display: flex; flex-direction: column; gap: 9px; padding: 16px 18px; border-radius: var(--r-lg); background: var(--surface); box-shadow: var(--sh-sm); min-width: 0; transition: transform .22s var(--ease-spring); }
        .io-row:hover { transform: translateY(-3px); }
        .io-r1 { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; } .io-r1 b { font-size: 1rem; font-weight: 600; }
        .io-r2 { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-family: var(--mono); font-size: .72rem; color: var(--ink-2); flex-wrap: wrap; }
        .io-r3 { display: flex; gap: 6px; flex-wrap: wrap; min-height: 22px; }
        .io-r4 { display: flex; justify-content: space-between; gap: 10px; font-size: .78rem; } .io-r4 span:last-child { text-align: right; min-width: 0; overflow-wrap: anywhere; }
        .io-r5 { font-family: var(--mono); font-size: .76rem; min-height: 18px; }
        .io-art { font-family: var(--mono); font-size: .58rem; letter-spacing: .12em; padding: 2px 8px; border-radius: var(--r-pill); }
        .io-art.ICO { background: color-mix(in srgb, var(--a1) 18%, transparent); color: var(--a1); } .io-art.IPO { background: color-mix(in srgb, var(--a3) 18%, transparent); color: var(--a3); }
        .io-tk { font-family: var(--mono); font-size: .68rem; color: var(--ink-2); padding: 1px 8px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); } .io-tk.big { font-size: .9rem; vertical-align: middle; }
        .io-n { font-size: .66rem; padding: 2px 9px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--a2) 14%, transparent); color: var(--a2); }
        .io-warn { display: inline-flex; gap: 4px; align-items: center; font-family: var(--mono); font-size: .6rem; color: var(--warn); } .io-warn svg { width: 13px; height: 13px; }
        .io-neu { font-family: var(--mono); font-size: .56rem; padding: 1px 7px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--warn) 18%, transparent); color: var(--warn); letter-spacing: .06em; }
        .io-nar { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
        .io-nk { text-align: left; display: flex; flex-direction: column; gap: 8px; padding: 14px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); min-width: 0; transition: transform .2s var(--ease-spring); }
        .io-nk:hover { transform: translateY(-2px); } .io-nk.on { background: var(--surface); box-shadow: var(--sh-sm); outline: 2px solid var(--a2); }
        .io-nk1, .io-nk2, .io-nk3 { display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap; }
        .io-nk3 { font-family: var(--mono); font-size: .62rem; color: var(--ink-3); }
        .io-tr { display: inline-flex; gap: 4px; align-items: center; font-family: var(--mono); font-size: .62rem; } .io-tr svg { width: 14px; height: 14px; }
        .io-bar { height: 6px; border-radius: 4px; background: color-mix(in srgb, var(--ink) 9%, transparent); overflow: hidden; } .io-bar i { display: block; height: 100%; border-radius: 4px; transition: width .8s var(--ease); }
        .io-ov { position: fixed; inset: 0; z-index: 120; display: grid; place-items: center; padding: 18px; background: color-mix(in srgb, var(--bg) 66%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        .io-panel { width: min(1040px, 100%); max-height: calc(100dvh - 36px); overflow-y: auto; background: var(--surface); border-radius: var(--r-xl); box-shadow: 0 30px 80px rgba(0,0,0,.35); padding: 26px; display: flex; flex-direction: column; gap: 20px; }
        .io-pk { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
        .io-x { width: 38px; height: 38px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--surface); box-shadow: var(--sh-sm); color: var(--ink-2); } .io-x svg { width: 18px; height: 18px; }
        .io-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
        .io-kvs4 { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
        .io-kv { padding: 14px 16px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); min-width: 0; }
        .io-kvw { font-family: var(--mono); font-size: .88rem; margin-top: 6px; overflow-wrap: anywhere; } .io-kvs { font-size: .72rem; color: var(--ink-3); margin-top: 4px; }
        .io-sec { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
        .io-p { font-size: .9rem; line-height: 1.6; color: var(--ink-2); font-weight: 300; margin: 0; }
        .io-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
        .io-an { display: flex; flex-direction: column; gap: 10px; padding-top: 6px; } .io-an1 { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .io-ang { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
        .io-refs { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .io-refs .eyebrow { flex-basis: 100%; }
        .io-ref { padding: 6px 12px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); font-family: var(--mono); font-size: .68rem; color: var(--ink-2); }
        .io-ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: .84rem; color: var(--ink-2); } .io-ul li { overflow-wrap: anywhere; }
        .io-l { color: var(--a2); text-decoration: underline; text-underline-offset: 3px; } .io-l:hover { color: var(--ink); }
        .io-hinw { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: var(--r-md); background: color-mix(in srgb, var(--warn) 14%, var(--bg)); color: var(--ink); font-size: .86rem; } .io-hinw svg { width: 18px; height: 18px; color: var(--warn); flex: none; }
        .io-log { display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto; font-size: .82rem; }
        .io-log div { padding: 9px 12px; border-radius: var(--r-sm); background: var(--bg); box-shadow: var(--sh-in); overflow-wrap: anywhere; }
        @media (max-width: 700px) { .io-panel { padding: 18px; } .io-grid { grid-template-columns: minmax(0, 1fr); } }
`,
    render(root) {
        const daten = get();
        root.classList.add('stack');
        if (!daten) { root.innerHTML = pageHead('Entdecken', 'ICOs und IPOs', 'Die Daten fehlen noch. Der Agent fetch_icoipo.py schreibt sie.') + card({ body: empty('Noch keine Daten vorhanden.') }); return; }
        const q = daten.quellen || [], seit = daten.seit_update || [];
        root.innerHTML = pageHead('Entdecken', 'ICOs und IPOs',
            'Laufend gepflegte Recherche zu Token-Verkäufen und Börsengängen: was gelaufen ist, was gerade läuft und was kommt. Mit Narrativ-Analyse und Wettbewerbsvergleich. Das ist Recherche, keine Anlageberatung.') +
            card({ cls: 'tint', body: `<div class="io-info">
                <div><div class="eyebrow">Letztes Update</div><b>${esc(dat(daten.stand) || '–')}</b> <span class="dim">(${esc(ago(Date.parse(daten.stand) / 1000))})</span></div>
                <div><div class="eyebrow">Quellen im letzten Lauf</div><div class="row wrap" style="gap:12px;margin-top:4px">${q.map(x => `<span class="io-q" title="${esc(x.info || '')}"><i style="--c:${x.ok ? 'var(--up)' : 'var(--down)'}"></i>${esc(x.quelle)}</span>`).join('') || '<span class="dim">Offline-Stand</span>'}</div></div>
                <div><div class="eyebrow">Seit dem Lauf davor</div><button class="btn soft" id="ioSeit" style="margin-top:4px">${icon('history')}${seit.length} Änderung${seit.length === 1 ? '' : 'en'}</button></div>
            </div><p class="io-note" style="margin-top:12px">${esc(daten.haftung)} Zahlen mit Quelle und Datum. Fehlende Angaben stehen als Strich, nichts wird geschätzt. Prüfhinweise (Dreieck) bedeuten: eine Meldung oder ein vergangener Termin passt nicht mehr zum Status.</p>` }) +
            `<div class="io-tabs" id="ioTabs"></div>` +
            card({ body: `<div class="io-ctl">
                <input id="ioQ" type="search" placeholder="Suchen: Name, Ticker, Branche, Narrativ" value="${esc(st.q)}" style="flex:1;min-width:200px;max-width:380px">
                ${seg('ioart', [['alle', 'Alle'], ['ICO', 'ICOs'], ['IPO', 'IPOs']], st.art)}
                <select id="ioSt"><option value="">Alle Status</option>${['durchgeführt', 'aktiv', 'angekündigt', 'geplant', 'verschoben', 'abgesagt'].map(s => `<option ${st.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
                <span class="eyebrow" id="ioAnz"></span>${st.narr ? `<button class="btn soft" id="ioNarrAus">${icon('x')}Narrativ: ${esc(st.narr)}</button>` : ''}</div>` }) +
            `<div class="io-grid" id="ioListe"></div>` +
            card({ eyebrow: 'Narrative', title: 'Welche Erzählungen tragen die Projekte?', right: '<span class="eyebrow">Klick filtert die Liste</span>',
                body: `<p class="io-note" style="margin:0 0 14px">Stärke = Mischung aus Median der Kursänderung (7 und 30 Tage) der 25 größten Coins je Kategorie, Marktkapital-Änderung 24h und Handelsvolumen im Verhältnis zum Kapital. Phase nach festen Regeln: Anfang, Wachstum, Hype, rückläufig. Quelle CoinGecko. Neue Kategorien, die mehrere Läufe lang groß und wachsend sind, legt der Agent selbst als Narrativ an.</p><div class="io-nar" id="ioNarr"></div>` }) +
            ((daten.hinweise || []).length ? card({ eyebrow: 'Unbestätigte Hinweise', title: 'Vom Agenten gefunden, noch nicht geprüft', body: `<div class="io-log">${daten.hinweise.slice(0, 20).map(h => `<div><span class="dim">${esc(dat(h.seit))} · ${esc(h.quelle)}</span><br>${link(h.u, h.t)}</div>`).join('')}</div>` }) : '') +
            card({ eyebrow: 'Protokoll', title: 'Letzte Änderungen der Datenbank', body: `<div class="io-log">${(daten.protokoll || []).slice(0, 40).map(p => `<div><span class="dim">${esc(p.tag)}</span> <b>${esc(p.name)}</b> · ${esc(p.feld)}${p.alt != null ? `: ${esc(String(p.alt))} → ` : ': '}${esc(String(p.neu))} <span class="dim">(${esc(p.quelle)})</span></div>`).join('') || '<div class="dim">Noch keine Änderungen protokolliert. Das Protokoll füllt sich ab dem nächsten Lauf.</div>'}</div>` });
        zeichne(root, daten);
        root.onclick = ev => {
            const t = ev.target.closest('[data-tab]'); if (t) { st.tab = t.dataset.tab; zeichne(root, daten); return; }
            const r = ev.target.closest('[data-io]'); if (r) { const e = daten.eintraege.find(x => x.id === r.dataset.io); if (e) detail(daten, e); return; }
            const n = ev.target.closest('[data-narr]'); if (n) { st.narr = st.narr === n.dataset.narr ? '' : n.dataset.narr; st.tab = 'alle'; this.render(root); return; }
            if (ev.target.closest('#ioNarrAus')) { st.narr = ''; this.render(root); return; }
            if (ev.target.closest('#ioSeit')) { st.tab = 'alle'; root.querySelector('.io-log') && root.querySelector('.io-log').scrollIntoView({ behavior: 'smooth' }); }
            const sg = ev.target.closest('[data-seg="ioart"] button'); if (sg) { st.art = sg.dataset.v; root.querySelectorAll('[data-seg="ioart"] button').forEach(b => b.classList.toggle('on', b === sg)); zeichne(root, daten); }
        };
        root.querySelector('#ioQ').oninput = ev => { st.q = ev.target.value; zeichne(root, daten); };
        root.querySelector('#ioSt').onchange = ev => { st.status = ev.target.value; zeichne(root, daten); };
        onKey = ev => { if (ev.key === 'Escape' && overlays.length) zu(overlays[overlays.length - 1]); };
        document.addEventListener('keydown', onKey);
    },
    destroy() { overlays.forEach(o => o.remove()); overlays = []; if (onKey) { document.removeEventListener('keydown', onKey); onKey = null; } },
};
