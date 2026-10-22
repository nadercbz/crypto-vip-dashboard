import { esc, fUsd, fBig, fPct, cls } from '../core/fmt.js?v=202610220924';
import { card, pageHead, chip, icon, empty, laden, hydrate, icons } from '../core/ui.js?v=202610220924';
import { coinKey, coinById } from '../core/data.js?v=202610220924';
import { externChart } from '../core/coin.js?v=202610220924';

const S = () => window.SYMBOLIK_DATA || null;
const PRO_SEITE = 120;
const SPEICHER = 'cb2_symbolik_filter_v1';
const de = (v, d = 0) => v == null ? '?' : Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const ZAHLEN = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '22', '33'];
const GROESSE = [['alle', 'Alle 5000'], ['100', 'Top 100'], ['500', 'Top 500'], ['1000', 'Top 1000'], ['klein', 'Ab Rang 1000']];
const SORT = [['mc', 'Marktwert'], ['sa', 'Saturn-Marker'], ['nm', 'Namens-Symbolik'], ['d7', '7 Tage'], ['d24', '24 Stunden'], ['d30', '30 Tage'], ['n', 'Name']];

let F = leer();
let sichtbar = PRO_SEITE;
let wurzel = null, ctxRef = null, onKey = null;

function leer() { return { q: '', g: null, m: [], f: [], fo: [], st: [], el: [], pl: [], z: [], sa: [], nk: [], nw: [], gr: 'alle', sort: 'mc', puls: 'motiv' }; }
function merken() { try { localStorage.setItem(SPEICHER, JSON.stringify(F)); } catch (e) {} }
function laden_() { try { const x = JSON.parse(localStorage.getItem(SPEICHER) || 'null'); if (x) F = { ...leer(), ...x }; } catch (e) {} }

function datenLaden() {
    if (S()) return Promise.resolve(S());
    return new Promise((ok, fehler) => {
        const s = document.createElement('script');
        s.src = (window.CB2_PUBLIC ? '' : '/') + 'data/symbolik_data.js?v=' + new Date().toISOString().slice(0, 10);
        s.onload = () => S() ? ok(S()) : fehler(new Error('leer'));
        s.onerror = fehler;
        document.head.appendChild(s);
    });
}

const W = () => S().wissen || {};
const motiv = k => (W().motive || {})[k] || null;
const farbe = k => (W().farben || {})[k] || null;
const form = k => (W().formen || {})[k] || null;
const element = k => (W().elemente || {})[k] || null;
const bild = c => S().bild_basis + c.i;
const gruppeVon = c => c.m ? (motiv(c.m) || {}).g || 'abstrakt' : null;
const elementVon = c => (motiv(c.m) || {}).el || (farbe(c.h) || {}).el || null;
const planetVon = c => (farbe(c.h) || {}).pl || null;
const archetyp = c => (W().archetypen || {})[c.s] || null;
const LEX = () => ((W().namen || {}).lexikon) || [];
const namenVon = c => (c.nm || []).map(([i, w]) => ({ ...LEX()[i], wort: w, i })).filter(x => x.k);
const sektorTyp = c => c.cat ? (W().sektoren || {})[c.cat] || null : null;
function median(a) { const b = a.filter(x => x != null).sort((x, y) => x - y); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }

function passt(c, ohne) {
    if (F.q) { const q = F.q.toLowerCase(); if (!c.s.toLowerCase().includes(q) && !c.n.toLowerCase().includes(q)) return false; }
    if (ohne !== 'g' && F.g && gruppeVon(c) !== F.g) return false;
    if (ohne !== 'm' && F.m.length && !F.m.includes(c.m) && !F.m.includes(c.m2)) return false;
    if (ohne !== 'f' && F.f.length && !F.f.some(x => (c.f || []).includes(x))) return false;
    if (ohne !== 'fo' && F.fo.length && !F.fo.includes(c.fo)) return false;
    if (ohne !== 'st' && F.st.length && !F.st.includes(c.st)) return false;
    if (ohne !== 'el' && F.el.length && !F.el.includes(elementVon(c))) return false;
    if (ohne !== 'pl' && F.pl.length && !F.pl.includes(planetVon(c))) return false;
    if (ohne !== 'sa' && F.sa.length && !F.sa.some(x => (c.sa || []).includes(x))) return false;
    if (ohne !== 'sa' && F.saSicht && !c.ss) return false;
    if (ohne !== 'nk' && F.nk.length && !namenVon(c).some(x => F.nk.includes(x.k))) return false;
    if (ohne !== 'nw' && F.nw.length && !namenVon(c).some(x => F.nw.includes(x.wort))) return false;
    if (ohne !== 'z' && F.z.length && !F.z.includes(String(c.z))) return false;
    const r = c.r || 99999;
    if (F.gr === '100' && r > 100) return false;
    if (F.gr === '500' && r > 500) return false;
    if (F.gr === '1000' && r > 1000) return false;
    if (F.gr === 'klein' && r <= 1000) return false;
    return true;
}
function sortiere(liste) {
    const k = F.sort;
    if (k === 'n') return liste.sort((a, b) => a.n.localeCompare(b.n, 'de'));
    if (k === 'nm') return liste.sort((a, b) => (b.nm || []).length - (a.nm || []).length || (b.mc || 0) - (a.mc || 0));
    if (k === 'sa') { const n = c => (c.sa || []).filter(x => x !== 'dunkel').length * 2 + ((c.sa || []).includes('dunkel') ? 1 : 0); return liste.sort((a, b) => n(b) - n(a) || (b.mc || 0) - (a.mc || 0)); }
    if (k === 'mc') return liste.sort((a, b) => (b.mc || 0) - (a.mc || 0));
    return liste.sort((a, b) => (b[k] ?? -1e9) - (a[k] ?? -1e9));
}
function zaehle(feld, ohne) {
    const z = new Map();
    for (const c of S().coins) {
        if (!passt(c, ohne)) continue;
        const werte = feld(c);
        for (const v of (Array.isArray(werte) ? werte : [werte])) if (v != null) z.set(v, (z.get(v) || 0) + 1);
    }
    return z;
}

function pill(art, wert, label, n, an, farbeHex) {
    return `<button class="sy-pill ${an ? 'on' : ''}" data-f="${art}" data-v="${esc(wert)}">${farbeHex ? `<i class="sy-dot" style="background:${esc(farbeHex)}"></i>` : ''}${esc(label)}${n != null ? `<span>${de(n)}</span>` : ''}</button>`;
}

function zeitqualitaet() {
    const k = W().kalender; if (!k) return '';
    const heute = new Date().toISOString().slice(0, 10);
    const jahre = Object.entries(k.jahr || {}).sort();
    let jahr = null, naechstes = null;
    for (const [j, e] of jahre) { if (e.von <= heute) jahr = [j, e]; else if (!naechstes) naechstes = [j, e]; }
    const monat = (k.monate || []).find(m => m[0] <= heute && heute <= m[1]);
    const stueck = (titel, tierKey, unter, text) => {
        const mo = motiv(tierKey) || {};
        const coins = sortiere(S().coins.filter(c => c.m === tierKey || c.m2 === tierKey)).slice(0, 6);
        return `<button class="sy-zq" data-tier="${esc(tierKey)}">
            <div class="eyebrow">${esc(titel)}</div>
            <div class="h2" style="margin:6px 0 2px">${esc(mo.l || tierKey)}</div>
            <div class="sub" style="margin:0;font-size:.8rem">${esc(unter)}</div>
            ${text ? `<p class="sy-zq-t">${esc(text)}</p>` : ''}
            <div class="sy-zq-coins">${coins.map(c => `<img src="${esc(bild(c))}" alt="" title="${esc(c.n)}" loading="lazy">`).join('')}<span>${de(S().coins.filter(c => c.m === tierKey || c.m2 === tierKey).length)} Coins</span></div>
        </button>`;
    };
    return card({ eyebrow: 'Zeitqualität im Chinesischen Kalender', title: 'Tier des Jahres und des Monats',
        right: `<span class="dim" style="font-size:.74rem">Quelle: ${esc(k.q)}</span>`,
        body: `<div class="sy-zq-grid">
            ${jahr ? stueck('Jahr ' + jahr[0], jahr[1].tier, jahr[1].label, (motiv(jahr[1].tier) || {}).b) : ''}
            ${monat ? stueck('Aktueller Monat', monat[2], monat[3] + ', ' + new Date(monat[0]).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) + ' bis ' + new Date(monat[1]).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }), monat[4]) : ''}
            ${naechstes ? stueck('Ab ' + new Date(naechstes[1].von).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }), naechstes[1].tier, naechstes[1].label, '') : ''}
        </div>
        <p class="sub" style="font-size:.74rem;margin:14px 0 0">Das Jahr wechselt an Li Chun (um den 4. Februar), nicht am Mondneujahr. Ein Klick filtert die Coins mit diesem Tier im Logo.</p>` });
}

function spektrum(liste) {
    const hue = hx => { const n = parseInt(String(hx || '#888').slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
        if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        const s = mx ? d / mx : 0; return s < 0.15 ? 400 + (1 - mx) * 100 : ((h * 60) + 360) % 360; };
    const a = liste.filter(c => c.hx).map(c => [hue(c.hx), c.hx, c.h]).sort((x, y) => x[0] - y[0]);
    if (!a.length) return '';
    const w = 1000, n = a.length;
    return `<svg class="sy-spek" viewBox="0 0 ${w} 40" preserveAspectRatio="none" aria-label="Farbspektrum der Logos">${a.map((x, i) =>
        `<rect x="${(i / n * w).toFixed(2)}" y="0" width="${(w / n + 0.6).toFixed(2)}" height="40" fill="${esc(x[1])}" data-f="f" data-v="${esc(x[2] || '')}"/>`).join('')}</svg>`;
}

function puls() {
    const liste = S().coins.filter(c => passt(c, 'puls'));
    const nach = F.puls;
    const feld = nach === 'motiv' ? c => c.m : nach === 'farbe' ? c => c.h : nach === 'form' ? c => c.fo : nach === 'saturn' ? c => (c.sa || []).filter(x => x !== 'dunkel') : c => elementVon(c);
    const name = nach === 'saturn' ? k => (((W().saturn || {}).marker || {})[k] || {}).l || k : nach === 'motiv' ? k => (motiv(k) || {}).l || k : nach === 'farbe' ? k => (farbe(k) || {}).l || k : nach === 'form' ? k => (form(k) || {}).l || k : k => (element(k) || {}).l || k;
    const art = nach === 'motiv' ? 'm' : nach === 'farbe' ? 'f' : nach === 'form' ? 'fo' : nach === 'saturn' ? 'sa' : 'el';
    const g = new Map();
    for (const c of liste) for (const k of [].concat(feld(c) || [])) { if (!k || k === 'abstract shape' || k === 'letter') continue; if (!g.has(k)) g.set(k, []); g.get(k).push(c); }
    const zeilen = [...g.entries()].filter(([, a]) => a.length >= (nach === 'saturn' ? 3 : 5)).map(([k, a]) => ({ k, n: a.length, mc: a.reduce((s, c) => s + (c.mc || 0), 0), d7: median(a.map(c => c.d7)) }))
        .sort((a, b) => b.mc - a.mc).slice(0, 14);
    const maxMc = Math.max(1, ...zeilen.map(z => z.mc));
    const maxD = Math.max(5, ...zeilen.map(z => Math.abs(z.d7 || 0)));
    return card({ eyebrow: 'Symbolik-Puls', title: 'Welche Bildsprache gerade läuft',
        right: `<div class="seg" data-seg="puls">${[['motiv', 'Motiv'], ['farbe', 'Farbe'], ['form', 'Form'], ['element', 'Element'], ['saturn', 'Saturn']].map(([k, l]) => `<button data-v="${k}" class="${F.puls === k ? 'on' : ''}">${l}</button>`).join('')}</div>`,
        body: `${spektrum(liste)}
        <div class="sy-puls">${zeilen.length ? zeilen.map(z => `<button class="sy-pz" data-f="${art}" data-v="${esc(z.k)}">
            <span class="sy-pz-n">${art === 'f' ? `<i class="sy-dot" style="background:${esc((farbe(z.k) || {}).sw || '#888')}"></i>` : ''}${esc(name(z.k))}<em>${de(z.n)}</em></span>
            <span class="sy-pz-mc"><i style="width:${(z.mc / maxMc * 100).toFixed(1)}%"></i><b>${fBig(z.mc)}</b></span>
            <span class="sy-pz-d"><i class="${(z.d7 || 0) >= 0 ? 'up' : 'down'}" style="width:${(Math.abs(z.d7 || 0) / maxD * 50).toFixed(1)}%;${(z.d7 || 0) >= 0 ? 'left:50%' : 'right:50%'}"></i><b class="${cls(z.d7)}">${fPct(z.d7, 1)}</b></span>
        </button>`).join('') : empty('Zu wenige Coins für einen Vergleich.')}</div>
        <p class="sub" style="font-size:.74rem;margin:12px 0 0">Balken links: Marktwert aller Coins mit dieser Symbolik. Rechts: Median der 7-Tage-Veränderung. Gruppen ab 5 Coins (Saturn ab 3), der aktuelle Filter gilt mit. Ein Stimmungsthermometer, kein Signal.</p>` });
}

function filterLeiste() {
    const gruppen = W().gruppen || [];
    const gz = zaehle(c => gruppeVon(c), 'g');
    const mz = zaehle(c => [c.m, c.m2], 'm');
    const motivKeys = [...mz.keys()].filter(k => !F.g || (motiv(k) || {}).g === F.g).sort((a, b) => mz.get(b) - mz.get(a));
    const fz = zaehle(c => c.f || [], 'f');
    const foz = zaehle(c => c.fo, 'fo');
    const stz = zaehle(c => c.st, 'st');
    const elz = zaehle(c => elementVon(c), 'el');
    const plz = zaehle(c => planetVon(c), 'pl');
    const zz = zaehle(c => c.z != null ? String(c.z) : null, 'z');
    const zeile = (titel, inhalt) => inhalt ? `<div class="sy-fz"><div class="eyebrow">${titel}</div><div class="sy-pills">${inhalt}</div></div>` : '';
    const zeigeMotive = F.g ? motivKeys : motivKeys.slice(0, 28);
    const sat = W().saturn, saz = zaehle(c => c.sa || [], 'sa');
    const BELEG = { Belegt: 'var(--up)', Datenbank: 'var(--up)', Tradition: 'var(--a2, var(--warn))', Allgemeinwissen: 'var(--warn)', Hypothese: 'var(--warn)', Spekulativ: 'var(--down)' };
    const nurSicht = F.saSicht;
    const saturnBlock = sat ? `<div class="sy-sat">
        <div class="sy-sat-kopf"><div class="eyebrow">${icon('orbit')}Saturn-Symbolik</div><button class="sy-sat-i" id="sySatInfo" aria-expanded="${F.satInfo ? 'true' : 'false'}">${icon('info')}Was heißt das?</button></div>
        <div class="row wrap" style="gap:6px;margin-bottom:2px"><button class="sy-pill ${nurSicht ? 'on' : ''}" id="sySicht" title="Nur Logos, die von Hand auf Saturn-Symbolik geprüft wurden. Ohne diesen Schalter kommen auch Treffer des Bildmodells und der Farbe dazu.">${icon('eye')}Nur von Hand gesichtet<span>${de(S().coins.filter(c => c.ss).length)}</span></button></div>
        <div class="sy-pills">${Object.entries(sat.marker).filter(([k]) => saz.get(k) || F.sa.includes(k)).map(([k, m]) => `<button class="sy-pill ${F.sa.includes(k) ? 'on' : ''}" data-f="sa" data-v="${k}" title="${esc(m.b)}"><i class="sy-bel" style="background:${BELEG[m.beleg] || 'var(--ink-3)'}"></i>${esc(m.l)}<span>${de(saz.get(k) || 0)}</span></button>`).join('')}</div>
        ${F.satInfo ? `<div class="sy-sat-info">
            <p>${esc(sat.kopf)}</p>
            <p>Ausführlich, mit 15 Bildmerkmalen, Mythos, Alchemie, Kabbala, Shani, China, Saturnalien, Palantir und Quellen: <span class="mono">Knowledge_Base/08_Symbolik/saturn_symbolik.md</span>.</p>
            <div class="sy-q">${icon('book-open')}${esc(sat.kopf_q.join(' · '))}</div>
            ${F.sa.map(k => { const m = sat.marker[k]; return m ? `<div class="sy-sat-m"><b>${esc(m.l)}</b> ${chip(m.beleg, BELEG[m.beleg])}<p>${esc(m.b)}</p><div class="sy-q">${icon('book-open')}${esc(m.q)}</div></div>` : ''; }).join('')}
            <div class="sy-grenze" style="margin-top:12px">${icon('triangle-alert')}<div><b>Saturn-Kult-Theorie, Stufe Spekulativ.</b> ${esc(sat.theorie)}<div class="sy-q">${icon('book-open')}${esc(sat.theorie_q.join(' · '))}</div></div></div>
            <p class="dim" style="font-size:.72rem;margin:10px 0 0">Beleg-Punkte: <i class="sy-bel" style="background:var(--up)"></i>belegt (Geschichte, Astronomie), <i class="sy-bel" style="background:var(--a2, var(--warn))"></i>Tradition (Astrologie, Alchemie, Mythos), <i class="sy-bel" style="background:var(--warn)"></i>Hypothese, <i class="sy-bel" style="background:var(--down)"></i>Behauptung ohne Beleg. Alle 5000 Logos wurden von Hand auf die Saturn-Merkmale gesichtet, zusätzlich liest ein Bildmodell neue Logos. Die Zahl 8 kommt aus dem Kürzel, die Farbe aus den Pixeln.</p></div>` : ''}
    </div>` : '';
    const NK = (W().namen || {}).kategorien || [];
    const nkz = zaehle(c => [...new Set(namenVon(c).map(x => x.k))], 'nk');
    const nwz = zaehle(c => namenVon(c).map(x => x.wort), 'nw');
    const woerter = [...nwz.entries()].filter(([w]) => !F.nk.length || S().coins.some(c => namenVon(c).some(x => x.wort === w && F.nk.includes(x.k)))).sort((a, b) => b[1] - a[1]).slice(0, F.nk.length ? 60 : 24);
    const namenBlock = NK.length ? `<div class="sy-sat">
        <div class="sy-sat-kopf"><div class="eyebrow">${icon('signature')}Name und Herkunft</div><span class="dim" style="font-size:.72rem">${esc((W().namen || {}).hinweis || '')}</span></div>
        <div class="sy-pills">${NK.filter(([k]) => nkz.get(k) || F.nk.includes(k)).map(([k, l, ic]) => `<button class="sy-pill ${F.nk.includes(k) ? 'on' : ''}" data-f="nk" data-v="${k}">${icon(ic)}${esc(l)}<span>${de(nkz.get(k) || 0)}</span></button>`).join('')}</div>
        <div class="sy-pills">${woerter.map(([w, n]) => pill('nw', w, w.charAt(0).toUpperCase() + w.slice(1), n, F.nw.includes(w))).join('')}</div>
    </div>` : '';
    return `<div class="sy-filter card flat">
        <div class="sy-top">
            <label class="sy-such">${icon('search')}<input class="input" id="syQ" placeholder="Coin suchen, zum Beispiel Pepe" value="${esc(F.q)}"></label>
            <div class="seg" data-seg="gr">${GROESSE.map(([k, l]) => `<button data-v="${k}" class="${F.gr === k ? 'on' : ''}">${l}</button>`).join('')}</div>
            <select class="select" id="sySort">${SORT.map(([k, l]) => `<option value="${k}" ${F.sort === k ? 'selected' : ''}>Sortieren: ${l}</option>`).join('')}</select>
        </div>
        <div class="sy-gruppen">
            <button class="sy-gr ${!F.g ? 'on' : ''}" data-f="g" data-v="">${icon('layers')}Alle</button>
            ${gruppen.map(([k, l, ic]) => `<button class="sy-gr ${F.g === k ? 'on' : ''}" data-f="g" data-v="${k}">${icon(ic)}${esc(l)}<span>${de(gz.get(k) || 0)}</span></button>`).join('')}
        </div>
        ${zeile('Motiv' + (F.g ? '' : ' (die häufigsten)'), zeigeMotive.map(k => pill('m', k, (motiv(k) || {}).l || k, mz.get(k), F.m.includes(k))).join(''))}
        ${saturnBlock}
        ${namenBlock}
        ${zeile('Farbe', Object.entries(W().farben || {}).filter(([k]) => fz.get(k)).map(([k, f]) => pill('f', k, f.l, fz.get(k), F.f.includes(k), f.sw)).join(''))}
        <details class="sy-mehr" ${F.fo.length || F.st.length || F.el.length || F.pl.length || F.z.length ? 'open' : ''}><summary>${icon('sliders-horizontal')}Form, Stil, Element, Planet, Zahl</summary>
            ${zeile('Form', Object.entries(W().formen || {}).filter(([k]) => foz.get(k)).sort((a, b) => foz.get(b[0]) - foz.get(a[0])).map(([k, f]) => pill('fo', k, f.l, foz.get(k), F.fo.includes(k))).join(''))}
            ${zeile('Stil', Object.entries(W().stile || {}).filter(([k]) => stz.get(k)).map(([k, l]) => pill('st', k, l, stz.get(k), F.st.includes(k))).join(''))}
            ${zeile('Element (Wandlungsphase)', Object.entries(W().elemente || {}).map(([k, e]) => pill('el', k, e.l, elz.get(k) || 0, F.el.includes(k))).join(''))}
            ${zeile('Planet der Hauptfarbe', [...plz.keys()].sort().map(k => pill('pl', k, k, plz.get(k), F.pl.includes(k))).join(''))}
            ${zeile('Zahl des Kürzels', ZAHLEN.filter(k => zz.get(k)).map(k => pill('z', k, k, zz.get(k), F.z.includes(k))).join(''))}
        </details>
    </div>`;
}

function kachel(c) {
    const mo = motiv(c.m);
    return `<button class="sy-k" data-id="${esc(c.id)}">
        <div class="sy-k-bild"><img src="${esc(bild(c))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">${c.ok === 0 ? '<em title="Noch nicht vom Bildmodell erkannt">neu</em>' : ''}</div>
        <div class="sy-k-s">${esc(c.s)}</div>
        <div class="sy-k-n">${esc(c.n)}</div>
        <div class="sy-k-farben">${(c.f || []).slice(0, 4).map((f, i) => `<i style="background:${esc((farbe(f) || {}).sw || '#888')};flex:${c.fa ? c.fa[i] : 1}"></i>`).join('')}</div>
        ${c.nm ? `<div class="sy-k-nm" title="${esc(namenVon(c).map(x => x.wort + ': ' + x.h).join(' · '))}">${icon('signature')}${esc(namenVon(c).map(x => x.wort).join(', '))}</div>` : ''}
        <div class="sy-k-u"><span>${mo ? esc(mo.l) : '·'}${c.mq ? ` <i class="sy-mq" title="Dieses Motiv steht im Namen. Das Logo selbst zeigt es nicht oder wurde nicht als solches erkannt.">Name</i>` : ''}</span><span class="${cls(c.d7)}">${fPct(c.d7, 0)}</span></div>
        <div class="sy-k-r">#${c.r || '?'}</div>
        ${(c.sa || []).some(x => x !== 'dunkel') ? `<div class="sy-k-sa" title="Saturn-Marker: ${esc((c.sa || []).map(x => ((W().saturn.marker[x] || {}).l || x)).join(', '))}">${icon('orbit')}</div>` : ''}
    </button>`;
}

function ergebnis() {
    const liste = sortiere(S().coins.filter(c => passt(c)));
    const aktiv = [];
    if (F.g) aktiv.push(['g', F.g, ((W().gruppen || []).find(g => g[0] === F.g) || [])[1]]);
    F.m.forEach(v => aktiv.push(['m', v, (motiv(v) || {}).l || v]));
    F.f.forEach(v => aktiv.push(['f', v, (farbe(v) || {}).l || v]));
    F.fo.forEach(v => aktiv.push(['fo', v, (form(v) || {}).l || v]));
    F.st.forEach(v => aktiv.push(['st', v, (W().stile || {})[v] || v]));
    F.el.forEach(v => aktiv.push(['el', v, (element(v) || {}).l || v]));
    F.pl.forEach(v => aktiv.push(['pl', v, v]));
    F.nk.forEach(v => aktiv.push(['nk', v, 'Name: ' + ((((W().namen || {}).kategorien || []).find(x => x[0] === v) || [])[1] || v)]));
    F.nw.forEach(v => aktiv.push(['nw', v, 'Name: ' + v]));
    if (F.saSicht) aktiv.push(['saSicht', '1', 'Von Hand gesichtet']);
    F.sa.forEach(v => aktiv.push(['sa', v, 'Saturn: ' + (((W().saturn || {}).marker || {})[v] || {}).l]));
    F.z.forEach(v => aktiv.push(['z', v, 'Zahl ' + v]));
    const median7 = median(liste.map(c => c.d7));
    const VS = W().vollsichtung || null, d = S();
    const ungeprueft = F.m.filter(k => !(VS && (VS.motive || []).includes(k)));
    const abdeckung = !F.m.length ? '' : (!ungeprueft.length && VS
        ? `<div class="sy-abd ok">${icon('shield-check')}<div>${esc(VS.text)}</div></div>`
        : (d.erkannt < d.anzahl ? `<div class="sy-abd">${icon('triangle-alert')}<div><b>Liste unvollständig.</b> Das Bildmodell hat erst ${de(d.erkannt)} von ${de(d.anzahl)} Logos gelesen. Für ${esc(ungeprueft.map(k => (motiv(k) || {}).l || k).join(', '))} fehlt die Handsichtung, es kommen noch Treffer dazu.</div></div>` : ''));
    return abdeckung + `<div class="row between wrap sy-erg-kopf">
            <div><span class="big num">${de(liste.length)}</span> <span class="dim">Coins</span>${liste.length ? ` <span class="dim" style="margin-left:10px">Median 7 Tage</span> <b class="${cls(median7)}">${fPct(median7, 1)}</b>` : ''}</div>
            <div class="row wrap" style="gap:6px">${aktiv.map(([a, v, l]) => `<button class="sy-aktiv" data-weg="${a}" data-v="${esc(v)}">${esc(l)}${icon('x')}</button>`).join('')}${aktiv.length || F.q ? `<button class="btn soft" id="syReset">${icon('rotate-ccw')}Zurücksetzen</button>` : ''}</div>
        </div>
        ${liste.length ? `<div class="sy-grid">${liste.slice(0, sichtbar).map(kachel).join('')}</div>
        ${liste.length > sichtbar ? `<div style="text-align:center;margin-top:18px"><button class="btn" id="syMehr">${icon('chevrons-down')}Weitere ${de(Math.min(PRO_SEITE, liste.length - sichtbar))} von ${de(liste.length - sichtbar)} zeigen</button></div>` : ''}`
        : empty('Keine Coins mit dieser Symbolik. Einen Filter entfernen.')}`;
}

function lesung(c) {
    const mo = motiv(c.m), mo2 = motiv(c.m2), fa = farbe(c.h), fo = form(c.fo), elM = (mo || {}).el, elF = (fa || {}).el;
    const ar = archetyp(c), sek = sektorTyp(c), zahlText = (W().zahlen || {})[String(c.z)], nameText = (W().zahlen || {})[String(c.zn)];
    const quelle = q => q ? `<div class="sy-q">${icon('book-open')}${esc(q)}</div>` : '';
    const offen = c.ok === 0 ? 'Noch nicht vom Bildmodell erkannt, kommt mit dem nächsten Lauf.' : 'Das Bildmodell hat hier nichts Eindeutiges erkannt.';
    const block = (titel, wert, text, q, extra = '', leer = 'Noch kein Eintrag in der Mystic-Datenbank.') => `<div class="sy-l-b"><div class="eyebrow">${titel}</div><div class="sy-l-w">${wert}</div>${text ? `<p>${esc(text)}</p>` : `<p class="dim">${esc(leer)}</p>`}${extra}${text ? quelle(q) : ''}</div>`;
    const key = coinKey({ id: c.id, s: c.s });
    const aehnlich = sortiere(S().coins.filter(x => x.id !== c.id && x.m && x.m === c.m && x.h === c.h)).slice(0, 8);
    return `<div class="sy-l-kopf">
            <div class="sy-l-logo"><img src="${esc(bild(c).replace('/small/', '/large/'))}" alt=""></div>
            <div style="min-width:0;flex:1">
                <div class="eyebrow">Rang ${c.r || '?'}${c.cat && c.cat !== 'Other' ? ' · ' + esc(c.cat) : ''}</div>
                <div class="h1" style="margin:4px 0">${esc(c.n)}</div>
                <div class="mono dim">${esc(c.s)}</div>
                <div class="sy-l-farben">${(c.f || []).map((f, i) => `<span><i style="background:${esc((farbe(f) || {}).sw || '#888')}"></i>${esc((farbe(f) || {}).l || f)} ${c.fa ? de(c.fa[i] * 100) + '%' : ''}</span>`).join('')}</div>
            </div>
            <button class="ibtn" id="syZu" title="Schließen (Esc)">${icon('x')}</button>
        </div>
        <div class="sy-chart-box"><div class="sy-chart" id="syChart"><div class="empty lade">Chart lädt …</div></div><div class="sy-chart-note" id="syChartNote"></div></div>
        ${c.no ? `<div class="sy-notiz">${icon('pen-line')}${esc(c.no)}</div>` : ''}
        <div class="sy-l-schicht"><div class="sy-l-titel">${icon('sparkles')}<span>Schicht 1: Mystisch</span><em>das Warum der Symbolik</em></div>
            <div class="sy-l-grid">
                ${block('Motiv', esc(mo ? mo.l : (c.m ? c.m : 'Nicht erkannt')) + (mo2 ? ` <span class="dim">und ${esc(mo2.l)}</span>` : ''), mo && mo.b, mo && mo.q,
                    (mo && mo.zo ? `<div class="sy-tag">${icon('orbit')}${esc(mo.zo)}</div>` : '') + (mo && mo.ta ? `<div class="sy-tag">${icon('layers')}Tarot ${esc(mo.ta)}</div>` : '') +
                    (c.mq ? `<div class="sy-tag">${icon('signature')}Dieses Motiv kommt aus dem Namen. Das Logo selbst zeigt es nicht oder wurde nicht als solches erkannt.</div>` : '') +
                    (c.c ? `<div class="sy-tag" title="Freie Beschreibung des Bildmodells, daraus wird das Motiv gelesen">${icon('scan-eye')}<i>„${esc(c.c)}“</i></div>` : ''), mo ? undefined : offen)}
                ${block('Hauptfarbe', `<i class="sy-dot" style="background:${esc(c.hx || '#888')}"></i>${esc(fa ? fa.l : '?')}`, fa && fa.b, fa && fa.q,
                    fa ? `<div class="sy-tag">${icon('orbit')}Planet ${esc(fa.pl || 'ohne Zuordnung')}${fa.ch ? ' · Chakra ' + esc(fa.ch) : ''}</div>` : '')}
                ${block('Form', esc(fo ? fo.l : 'Nicht erkannt'), fo && fo.b, fo && fo.q, c.st ? `<div class="sy-tag">${icon('brush')}Stil ${esc((W().stile || {})[c.st] || c.st)}</div>` : '', fo ? undefined : offen)}
                ${block('Zahl', `${c.z ?? '?'} <span class="dim">aus ${esc(c.s)}</span>${c.zn != null ? ` <span class="dim">· Name ${c.zn}</span>` : ''}`, zahlText, W().zahlen_q,
                    nameText && c.zn !== c.z ? `<p class="dim" style="margin-top:6px">Name ${c.zn}: ${esc(nameText)}</p>` : '')}
                ${block('Element', esc([elM && (element(elM) || {}).l + ' (Motiv)', elF && elF !== elM && (element(elF) || {}).l + ' (Farbe)'].filter(Boolean).join(', ') || 'Ohne Zuordnung'),
                    (element(elM || elF) || {}).b, (element(elM || elF) || {}).q)}
                ${ar || sek ? block('Archetyp', esc((ar || sek).a), (ar || sek).mantra ? '„' + (ar || sek).mantra + '“' : '', W().archetypen_q,
                    `<div class="sy-tag">${icon('orbit')}${esc((ar || sek).pl || '')}${(ar || sek).ta ? ' · Tarot ' + esc((ar || sek).ta) : ''}${(ar || sek).gott ? ' · ' + esc((ar || sek).gott) : ''}</div>${!ar && sek ? `<p class="dim" style="margin-top:6px">Archetyp des Sektors ${esc(c.cat)}${sek.hinweis ? ', ' + esc(sek.hinweis) : ''}.</p>` : ''}`) : ''}
            </div>
        </div>
        ${namenVon(c).length ? `<div class="sy-l-schicht"><div class="sy-l-titel">${icon('signature')}<span>Name und Herkunft</span><em>was im Namen ${esc(c.n)} steckt</em></div>
            <div class="sy-l-grid">${namenVon(c).map(x => `<div class="sy-l-b"><div class="eyebrow">${esc((((W().namen || {}).kategorien || []).find(k => k[0] === x.k) || [])[1] || x.k)}</div><div class="sy-l-w">„${esc(x.wort)}“${x.sat ? ` ${chip('Saturn', 'var(--a2, var(--warn))')}` : ''}</div><p>${esc(x.h)}</p><div class="sy-q">${icon('book-open')}${esc(x.q)}</div></div>`).join('')}</div>
            <p class="dim" style="font-size:.72rem;margin:10px 0 0">${esc((W().namen || {}).hinweis || '')}</p></div>` : ''}
        ${c.sa && c.sa.length && W().saturn ? `<div class="sy-l-schicht"><div class="sy-l-titel">${icon('orbit')}<span>Saturn-Marker</span><em>Bildmerkmale, keine Aussage über den Coin</em></div>
            <div class="sy-l-grid">${c.sa.map(k => { const m = W().saturn.marker[k]; if (!m) return ''; return `<div class="sy-l-b"><div class="eyebrow">${chip(m.beleg, m.beleg === 'Belegt' || m.beleg === 'Datenbank' ? 'var(--up)' : m.beleg === 'Spekulativ' ? 'var(--down)' : 'var(--warn)')}</div><div class="sy-l-w">${esc(m.l)}</div><p>${esc(m.b)}</p><div class="sy-q">${icon('book-open')}${esc(m.q)}</div></div>`; }).join('')}</div>
            ${c.ss ? `<div class="sy-tag" style="margin-top:12px">${icon('eye')}Von Hand gesichtet</div>` : ''}
            ${c.sx ? `<div class="sy-tag" style="margin-top:12px">${icon('scan-eye')}Aufbau laut Bildmodell: <i>„${esc(c.sx)}“</i></div>` : ''}</div>` : ''}
        <div class="sy-l-schicht"><div class="sy-l-titel">${icon('bar-chart-3')}<span>Schicht 2: Fundamental</span><em>das Warum der Realität</em></div>
            <div class="sy-l-zahlen">
                <div><div class="eyebrow">Preis</div><div class="num">${fUsd(c.p)}</div></div>
                <div><div class="eyebrow">Marktwert</div><div class="num">${fBig(c.mc)}</div></div>
                <div><div class="eyebrow">24 Std</div><div class="num ${cls(c.d24)}">${fPct(c.d24, 1)}</div></div>
                <div><div class="eyebrow">7 Tage</div><div class="num ${cls(c.d7)}">${fPct(c.d7, 1)}</div></div>
                <div><div class="eyebrow">30 Tage</div><div class="num ${cls(c.d30)}">${fPct(c.d30, 1)}</div></div>
            </div>
            <div class="row wrap" style="gap:8px;margin-top:14px">
                ${key ? `<button class="btn" data-oeffne="${esc(key)}">${icon('candlestick-chart')}Chart und Detail</button>` : ''}
                <a class="btn soft" target="_blank" rel="noopener" href="https://www.coingecko.com/en/coins/${esc(encodeURIComponent(c.id))}">${icon('external-link')}CoinGecko</a>
                <a class="btn soft" target="_blank" rel="noopener" href="https://dexscreener.com/search?q=${esc(encodeURIComponent(c.s))}">${icon('activity')}DexScreener</a>
            </div>
            <p class="sub" style="font-size:.74rem;margin:12px 0 0">Kurse aus dem letzten Lauf des Symbolik-Agenten. Liquidität, Halter, Sperren und Tokenomics vor jeder Entscheidung selbst prüfen.</p>
        </div>
        ${aehnlich.length ? `<div class="sy-l-schicht"><div class="sy-l-titel">${icon('shapes')}<span>Gleiche Symbolik</span><em>${esc(mo ? mo.l : '')}, ${esc(fa ? fa.l : '')}</em></div>
            <div class="sy-aehnlich">${aehnlich.map(x => `<button data-id="${esc(x.id)}"><img src="${esc(bild(x))}" alt="" loading="lazy"><span>${esc(x.s)}</span></button>`).join('')}</div></div>` : ''}
        <div class="sy-grenze">${icon('triangle-alert')}<div><b>Grenze der Aussagekraft.</b> ${esc(W().grenze || '')} Keine Anlageberatung.</div></div>`;
}

let chartRef = null, chartSeq = 0;
function chartWeg() { if (chartRef) { try { chartRef.destroy(); } catch (e) {} chartRef = null; } }
async function ladeChart(c) {
    const token = ++chartSeq, box = document.getElementById('syChart'), note = document.getElementById('syChartNote');
    if (!box) return;
    const stale = () => token !== chartSeq || !box.isConnected;
    const db = coinById(c.id);
    let kerzen = null, quelle = '';
    try {
        if (db && db.binance) {
            const r = await fetch('https://api.binance.com/api/v3/klines?symbol=' + encodeURIComponent(db.binance) + '&interval=1d&limit=500');
            const raw = await r.json();
            if (Array.isArray(raw) && raw.length > 30) { kerzen = raw.map(k => [Math.floor(k[0] / 1000), +k[1], +k[2], +k[3], +k[4], +k[7]]); quelle = 'Binance ' + db.binance + ' · Tageskerzen'; }
        }
    } catch (e) {}
    if (!kerzen) {
        try {
            const r = await fetch('https://coins.llama.fi/chart/coingecko:' + encodeURIComponent(c.id) + '?span=365&period=1d');
            const d = await r.json(), p = d && d.coins && d.coins['coingecko:' + c.id] && d.coins['coingecko:' + c.id].prices;
            if (p && p.length > 30) { kerzen = p.filter(x => x.price > 0).map(x => [Math.floor(x.timestamp / 86400) * 86400, x.price, x.price, x.price, x.price, 0]); quelle = 'DefiLlama · Tagesschlusskurse (keine Hochs und Tiefs)'; }
        } catch (e) {}
    }
    if (stale()) return;
    chartWeg();
    if (!kerzen) { box.innerHTML = '<div class="empty">Kein Kursverlauf verfügbar (kein Binance-Paar, zu junge oder unbekannte Historie).</div>'; return; }
    box.innerHTML = '';
    chartRef = externChart(box, kerzen, { sym: c.s, ath: null });
    if (!chartRef) box.innerHTML = '<div class="empty">Zu wenig Kerzen für einen Chart.</div>';
    else if (note) note.textContent = quelle + ' · mit Kaufzonen, Verkaufszonen, Trendlinien und Prognose (Auto-Analyse, keine Anlageberatung)';
}

function oeffneLesung(id) {
    const c = S().coins.find(x => x.id === id); if (!c) return;
    let el = document.getElementById('syLesung');
    if (!el) {
        el = document.createElement('div'); el.id = 'syLesung'; el.className = 'sy-overlay';
        el.innerHTML = '<div class="sy-scrim"></div><div class="sy-panel" role="dialog" aria-modal="true"></div>';
        document.body.appendChild(el);
        el.addEventListener('click', e => {
            if (e.target.classList.contains('sy-scrim') || e.target.closest('#syZu')) return schliesseLesung();
            const o = e.target.closest('[data-oeffne]'); if (o) { schliesseLesung(); ctxRef && ctxRef.openCoin(o.dataset.oeffne); return; }
            const b = e.target.closest('[data-id]'); if (b) oeffneLesung(b.dataset.id);
        });
    }
    const p = el.querySelector('.sy-panel');
    chartWeg();
    p.innerHTML = lesung(c); p.scrollTop = 0;
    icons(p);
    ladeChart(c);
    requestAnimationFrame(() => el.classList.add('on'));
}
function schliesseLesung() { chartSeq++; chartWeg(); const el = document.getElementById('syLesung'); if (el) el.classList.remove('on'); }

function zeichneFilterUndErgebnis() {
    const fl = wurzel.querySelector('#syFilterBox'), er = wurzel.querySelector('#syErgebnis'), pu = wurzel.querySelector('#syPuls');
    if (fl) { fl.innerHTML = filterLeiste(); icons(fl); }
    if (er) { er.innerHTML = ergebnis(); icons(er); }
    if (pu) { pu.innerHTML = puls(); hydrate(pu); }
    merken();
}

function umschalten(art, wert) {
    if (art === 'g') { F.g = wert || null; F.m = []; }
    else if (art === 'saSicht') F.saSicht = false;
    else if (F[art]) { const a = F[art]; const i = a.indexOf(wert); if (i >= 0) a.splice(i, 1); else a.push(wert); }
    sichtbar = PRO_SEITE;
    zeichneFilterUndErgebnis();
}

export default {
    styles: `
        .sy-zq-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .sy-zq { text-align: left; border: 1px solid var(--line); background: var(--sunk); border-radius: 18px; padding: 16px; cursor: pointer; color: var(--ink); transition: transform .3s var(--ease), border-color .3s var(--ease); }
        .sy-zq:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--pg, var(--a1)) 50%, var(--line)); }
        .sy-zq-t { font-size: .8rem; color: var(--ink-2); margin: 10px 0 0; line-height: 1.45; }
        .sy-zq-coins { display: flex; align-items: center; gap: 4px; margin-top: 12px; }
        .sy-zq-coins img { width: 26px; height: 26px; border-radius: 50%; background: var(--surface); border: 2px solid var(--surface); margin-right: -8px; object-fit: cover; }
        .sy-zq-coins span { margin-left: 16px; font-size: .74rem; color: var(--ink-3); }
        .sy-spek { width: 100%; height: 40px; border-radius: 12px; display: block; margin-bottom: 16px; cursor: crosshair; }
        .sy-puls { display: grid; gap: 6px; }
        .sy-pz { display: grid; grid-template-columns: minmax(120px, 1.1fr) 1.6fr 1.2fr; gap: 14px; align-items: center; padding: 7px 10px; border-radius: 12px; border: 0; background: none; color: var(--ink); cursor: pointer; text-align: left; font: inherit; }
        .sy-pz:hover { background: var(--sunk); }
        .sy-pz-n { display: flex; align-items: center; gap: 7px; font-size: .84rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sy-pz-n em { font-style: normal; color: var(--ink-3); font-size: .72rem; }
        .sy-pz-mc { position: relative; height: 22px; background: var(--sunk); border-radius: 7px; overflow: hidden; }
        .sy-pz-mc i { position: absolute; inset: 0 auto 0 0; background: color-mix(in srgb, var(--pg, var(--a1)) 45%, transparent); border-radius: 7px; transition: width .6s var(--ease); }
        .sy-pz-mc b, .sy-pz-d b { position: relative; font-size: .72rem; font-weight: 500; padding: 0 8px; line-height: 22px; font-family: var(--mono, ui-monospace, monospace); }
        .sy-pz-d { position: relative; height: 22px; background: var(--sunk); border-radius: 7px; overflow: hidden; text-align: right; }
        .sy-pz-d i { position: absolute; top: 4px; bottom: 4px; border-radius: 4px; }
        .sy-pz-d i.up { background: color-mix(in srgb, var(--up) 55%, transparent); }
        .sy-pz-d i.down { background: color-mix(in srgb, var(--down) 55%, transparent); }
        .sy-pz-d::after { content: ''; position: absolute; left: 50%; top: 3px; bottom: 3px; width: 1px; background: var(--line); }
        .sy-dot { display: inline-block; width: 11px; height: 11px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--ink) 20%, transparent); flex: none; vertical-align: -1px; margin-right: 2px; }
        .sy-filter { box-sizing: border-box; min-width: 0; max-width: 100%; position: sticky; top: 8px; z-index: 5; padding: 16px 18px; display: grid; gap: 12px; backdrop-filter: blur(14px); background: color-mix(in srgb, var(--surface) 88%, transparent); max-height: calc(100vh - 40px); overflow: auto; }
        .sy-top { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; min-width: 0; }
        .sy-top .seg { max-width: 100%; overflow-x: auto; scrollbar-width: none; }
        .sy-top .select { max-width: 100%; }
        #syFilterBox, #syErgebnis, #syPuls { min-width: 0; }
        .sy-such { flex: 1 1 220px; position: relative; display: flex; align-items: center; }
        .sy-such svg { position: absolute; left: 12px; width: 16px; height: 16px; color: var(--ink-3); }
        .sy-such input { width: 100%; padding-left: 36px; }
        .sy-gruppen { display: flex; gap: 6px; flex-wrap: wrap; }
        .sy-gr { display: inline-flex; align-items: center; gap: 6px; padding: 8px 13px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--ink-2); font: inherit; font-size: .8rem; cursor: pointer; transition: all .25s var(--ease); }
        .sy-gr svg { width: 15px; height: 15px; }
        .sy-gr span { font-size: .68rem; color: var(--ink-3); }
        .sy-gr.on { background: var(--ink); color: var(--bg); border-color: var(--ink); }
        .sy-gr.on span { color: color-mix(in srgb, var(--bg) 70%, transparent); }
        .sy-fz .eyebrow { margin-bottom: 6px; }
        .sy-sat { padding: 12px 14px; border-radius: 16px; background: color-mix(in srgb, var(--ink) 5%, var(--sunk)); border: 1px solid var(--line); display: grid; gap: 8px; min-width: 0; }
        .sy-sat-kopf { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
        .sy-sat-kopf .eyebrow { display: inline-flex; align-items: center; gap: 6px; margin: 0; }
        .sy-sat-kopf .eyebrow svg, .sy-sat-i svg { width: 14px; height: 14px; }
        .sy-sat-i { display: inline-flex; align-items: center; gap: 5px; border: 0; background: none; color: var(--ink-2); font: inherit; font-size: .74rem; cursor: pointer; padding: 2px 4px; }
        .sy-sat-info { font-size: .8rem; line-height: 1.5; color: var(--ink-2); display: grid; gap: 8px; }
        .sy-sat-info p { margin: 0; }
        .sy-sat-m { padding: 10px 12px; border-radius: 12px; background: var(--surface); }
        .sy-sat-m p { margin: 6px 0 0; }
        .sy-bel { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; flex: none; }
        .sy-k-nm { display: flex; align-items: center; gap: 3px; font-size: .64rem; color: var(--ink-2); max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; margin-bottom: 3px; }
        .sy-k-nm svg { width: 11px; height: 11px; flex: none; }
        .sy-mq { font-style: normal; font-size: .58rem; padding: 1px 5px; border-radius: 999px; background: color-mix(in srgb, var(--ink) 10%, transparent); color: var(--ink-2); vertical-align: 1px; }
        .sy-abd { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px; font-size: .78rem; line-height: 1.5; color: var(--ink-2); padding: 12px 16px; border-radius: 16px; background: color-mix(in srgb, var(--warn) 12%, transparent); }
        .sy-abd.ok { background: color-mix(in srgb, var(--up) 12%, transparent); }
        .sy-abd svg { width: 16px; height: 16px; flex: none; margin-top: 2px; }
        .sy-k-sa { position: absolute; right: 8px; top: 8px; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; background: color-mix(in srgb, var(--ink) 12%, var(--sunk)); color: var(--ink-2); }
        .sy-k-sa svg { width: 12px; height: 12px; }
        .sy-pills { display: flex; flex-wrap: wrap; gap: 5px; }
        .sy-pill { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; border: 1px solid var(--line); background: var(--sunk); color: var(--ink); font: inherit; font-size: .76rem; cursor: pointer; transition: all .2s var(--ease); }
        .sy-pill span { font-size: .66rem; color: var(--ink-3); }
        .sy-pill:hover { border-color: var(--ink-3); }
        .sy-pill.on { background: color-mix(in srgb, var(--pg, var(--a1)) 22%, var(--surface)); border-color: color-mix(in srgb, var(--pg, var(--a1)) 70%, transparent); }
        .sy-mehr summary { cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: .78rem; color: var(--ink-2); list-style: none; }
        .sy-mehr summary svg { width: 15px; height: 15px; }
        .sy-mehr[open] summary { margin-bottom: 10px; }
        .sy-mehr > .sy-fz + .sy-fz { margin-top: 10px; }
        .sy-erg-kopf { margin: 22px 2px 14px; gap: 12px; }
        .sy-aktiv { display: inline-flex; align-items: center; gap: 4px; padding: 5px 8px 5px 11px; border-radius: 999px; border: 0; background: var(--ink); color: var(--bg); font: inherit; font-size: .74rem; cursor: pointer; }
        .sy-aktiv svg { width: 13px; height: 13px; }
        .sy-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 12px; }
        .sy-k { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 16px 10px 12px; border-radius: 20px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font: inherit; cursor: pointer; transition: transform .3s var(--ease), box-shadow .3s var(--ease); }
        .sy-k:hover { transform: translateY(-3px); box-shadow: 0 14px 30px -18px color-mix(in srgb, var(--ink) 50%, transparent); }
        .sy-k-bild { position: relative; width: 64px; height: 64px; margin-bottom: 8px; }
        .sy-k-bild img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; background: var(--sunk); }
        .sy-k-bild em { position: absolute; right: -8px; top: -4px; font-style: normal; font-size: .6rem; padding: 2px 6px; border-radius: 999px; background: var(--sunk); color: var(--ink-3); }
        .sy-k-s { font-weight: 600; font-size: .86rem; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sy-k-n { font-size: .7rem; color: var(--ink-3); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sy-k-farben { display: flex; width: 70%; height: 5px; border-radius: 3px; overflow: hidden; margin: 8px 0 6px; gap: 1px; }
        .sy-k-farben i { display: block; min-width: 4px; }
        .sy-k-u { display: flex; justify-content: space-between; width: 100%; font-size: .7rem; color: var(--ink-2); gap: 6px; }
        .sy-k-u span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sy-k-r { position: absolute; left: 10px; top: 9px; font-size: .62rem; color: var(--ink-3); font-family: var(--mono, ui-monospace, monospace); }
        .sy-overlay { position: fixed; inset: 0; z-index: 80; pointer-events: none; }
        .sy-scrim { position: absolute; inset: 0; background: color-mix(in srgb, var(--ink) 35%, transparent); backdrop-filter: blur(6px); opacity: 0; transition: opacity .35s var(--ease); }
        .sy-panel { box-sizing: border-box; position: absolute; right: 0; top: 0; bottom: 0; width: min(1180px, 100%); background: var(--bg); overflow: auto; padding: 28px; transform: translateX(105%); transition: transform .45s var(--ease); box-shadow: -30px 0 60px -30px color-mix(in srgb, var(--ink) 40%, transparent); }
        .sy-overlay.on { pointer-events: auto; }
        .sy-overlay.on .sy-scrim { opacity: 1; }
        .sy-overlay.on .sy-panel { transform: none; }
        .sy-l-kopf { display: flex; gap: 20px; align-items: flex-start; }
        .sy-l-logo img { width: 96px; height: 96px; border-radius: 28px; object-fit: contain; background: var(--surface); padding: 8px; box-shadow: 0 18px 40px -24px color-mix(in srgb, var(--ink) 60%, transparent); }
        .sy-l-farben { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; font-size: .74rem; color: var(--ink-2); }
        .sy-l-farben span { display: inline-flex; align-items: center; gap: 5px; }
        .sy-l-farben i { width: 14px; height: 14px; border-radius: 5px; border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent); }
        .sy-notiz { display: flex; gap: 8px; align-items: center; margin-top: 16px; font-size: .82rem; padding: 10px 14px; border-radius: 14px; background: var(--sunk); }
        .sy-notiz svg { width: 16px; height: 16px; flex: none; }
        .sy-l-schicht { margin-top: 24px; padding: 18px; border-radius: 22px; background: var(--surface); border: 1px solid var(--line); }
        .sy-l-titel { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-weight: 600; }
        .sy-l-titel svg { width: 18px; height: 18px; color: var(--pg, var(--a1)); }
        .sy-l-titel em { font-style: normal; font-weight: 400; font-size: .76rem; color: var(--ink-3); }
        .sy-l-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .sy-chart-box { margin-top: 20px; }
        .sy-chart { position: relative; height: 420px; border-radius: 20px; background: var(--surface); border: 1px solid var(--line); overflow: hidden; }
        .sy-chart .empty { position: absolute; inset: 0; display: grid; place-items: center; }
        .sy-chart-note { font-size: .7rem; color: var(--ink-3); margin: 8px 4px 0; }
        .sy-l-b { padding: 14px; border-radius: 16px; background: var(--sunk); min-width: 0; overflow-wrap: anywhere; }
        .sy-l-w { font-size: 1.05rem; font-weight: 600; margin: 6px 0 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .sy-l-b p { margin: 0; font-size: .8rem; line-height: 1.5; color: var(--ink-2); }
        .sy-tag { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; font-size: .72rem; color: var(--ink-2); }
        .sy-tag svg, .sy-q svg { width: 13px; height: 13px; }
        .sy-q { display: flex; align-items: flex-start; gap: 5px; margin-top: 8px; font-size: .64rem; color: var(--ink-3); font-family: var(--mono, ui-monospace, monospace); overflow-wrap: anywhere; min-width: 0; }
        .sy-q svg { flex: none; margin-top: 1px; }
        .sy-l-zahlen { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
        .sy-aehnlich { display: flex; flex-wrap: wrap; gap: 8px; }
        .sy-aehnlich button { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px; width: 74px; border-radius: 14px; border: 1px solid var(--line); background: var(--sunk); color: var(--ink); font: inherit; font-size: .68rem; cursor: pointer; }
        .sy-aehnlich img { width: 36px; height: 36px; border-radius: 50%; }
        .sy-aehnlich span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sy-grenze { display: flex; gap: 10px; margin-top: 24px; font-size: .76rem; line-height: 1.5; color: var(--ink-2); padding: 14px 16px; border-radius: 16px; background: color-mix(in srgb, var(--warn) 12%, transparent); }
        .sy-grenze svg { width: 18px; height: 18px; flex: none; color: var(--warn); }
        @media (max-width: 860px) {
            .sy-zq-grid { grid-template-columns: 1fr; }
            .sy-pz { grid-template-columns: minmax(96px, 1fr) 1.2fr 1fr; gap: 8px; }
            .sy-filter { position: static; max-height: none; padding: 14px; }
            .sy-gruppen { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: 0 -14px; padding: 0 14px; }
            .sy-gr { flex: none; }
            .sy-l-kopf { gap: 14px; }
            .sy-l-schicht { padding: 14px; }
            .sy-l-farben { gap: 8px; }
            .sy-grid { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
            .sy-k { padding: 12px 6px 10px; border-radius: 16px; }
            .sy-k-bild, .sy-k-bild img { width: 52px; height: 52px; }
            .sy-panel { padding: 18px; width: 100%; }
            .sy-l-logo img { width: 76px; height: 76px; border-radius: 20px; }
            .sy-l-grid { grid-template-columns: 1fr; }
            .sy-chart { height: 300px; }
            .sy-l-zahlen { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
    `,

    async render(root, ctx) {
        wurzel = root; ctxRef = ctx;
        laden_();
        sichtbar = PRO_SEITE;
        root.innerHTML = pageHead('Entdecken', 'Symbolik', 'Die Top 5000 Coins nach der Bildsprache ihrer Logos: Motiv, Farbe, Form, Element, Zahl. Die Deutung kommt aus der Mystic-Datenbank.') + laden('Symbolik wird geladen …');
        let d;
        try { d = await datenLaden(); } catch (e) { root.innerHTML = pageHead('Entdecken', 'Symbolik', '') + empty('Noch keine Symbolik-Daten. Der Agent fetch_symbolik.py muss einmal laufen.'); return; }
        if (wurzel !== root) return;
        root.innerHTML = pageHead('Entdecken', 'Symbolik',
            `Die Top ${de(d.anzahl)} Coins nach der Bildsprache ihrer Logos. Motiv, Form und Stil erkennt ein Bildmodell, die Farben werden aus den Pixeln gemessen, die Deutung kommt aus der Mystic-Datenbank. Stand ${esc(d.erzeugt)}.`,
            d.erkannt < d.anzahl ? chip(`${de(d.erkannt)} von ${de(d.anzahl)} erkannt`, 'var(--warn)') : chip('Alle Logos erkannt', 'var(--up)')) + `
            <div class="stack">
                ${zeitqualitaet()}
                <div id="syPuls"></div>
                <div id="syFilterBox"></div>
                <div id="syErgebnis"></div>
            </div>`;
        zeichneFilterUndErgebnis();
        hydrate(root);

        let tippen = null;
        root.addEventListener('input', e => {
            if (e.target.id !== 'syQ') return;
            clearTimeout(tippen);
            tippen = setTimeout(() => { F.q = e.target.value.trim(); sichtbar = PRO_SEITE; const er = root.querySelector('#syErgebnis'); er.innerHTML = ergebnis(); icons(er); merken(); }, 160);
        });
        root.addEventListener('change', e => { if (e.target.id === 'sySort') { F.sort = e.target.value; sichtbar = PRO_SEITE; zeichneFilterUndErgebnis(); } });
        root.addEventListener('click', e => {
            const t = e.target;
            const zq = t.closest('.sy-zq'); if (zq) { F = { ...leer(), sort: F.sort, puls: F.puls, m: [zq.dataset.tier] }; sichtbar = PRO_SEITE; zeichneFilterUndErgebnis(); root.querySelector('#syErgebnis').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
            const sg = t.closest('.seg[data-seg] button');
            if (sg) { const name = sg.parentElement.dataset.seg; if (name === 'gr') { F.gr = sg.dataset.v; sichtbar = PRO_SEITE; zeichneFilterUndErgebnis(); } if (name === 'puls') { F.puls = sg.dataset.v; const pu = root.querySelector('#syPuls'); pu.innerHTML = puls(); hydrate(pu); merken(); } return; }
            const f = t.closest('[data-f]'); if (f && f.dataset.v !== undefined) { if (f.dataset.f === 'f' && !f.dataset.v) return; umschalten(f.dataset.f, f.dataset.v); return; }
            if (t.closest('#sySicht')) { F.saSicht = !F.saSicht; sichtbar = PRO_SEITE; zeichneFilterUndErgebnis(); return; }
            if (t.closest('#sySatInfo')) { F.satInfo = !F.satInfo; zeichneFilterUndErgebnis(); return; }
            const weg = t.closest('[data-weg]'); if (weg) { umschalten(weg.dataset.weg, weg.dataset.v); return; }
            if (t.closest('#syReset')) { F = { ...leer(), sort: F.sort, puls: F.puls }; sichtbar = PRO_SEITE; zeichneFilterUndErgebnis(); return; }
            if (t.closest('#syMehr')) { sichtbar += PRO_SEITE; const er = root.querySelector('#syErgebnis'); er.innerHTML = ergebnis(); icons(er); return; }
            const k = t.closest('.sy-k'); if (k) oeffneLesung(k.dataset.id);
        });
        onKey = e => { if (e.key === 'Escape') schliesseLesung(); };
        document.addEventListener('keydown', onKey);
    },

    destroy() {
        if (onKey) document.removeEventListener('keydown', onKey);
        const el = document.getElementById('syLesung'); if (el) el.remove();
        wurzel = null;
    },
};
