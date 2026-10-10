import { coin } from './data.js?v=202610101938';
import { esc, fUsd, fNum, fPct } from './fmt.js?v=202610101938';
import { aufbereich } from './coin.js?v=202610101938';

const ZB = 36;   // Breite der Zone auf der Leiste in Prozent
export function zoneHtml(z) {
    const mitte = (z.von + z.bis) / 2, p = v => fPct((v / z.kurs - 1) * 100);
    let pos, lage;
    if (z.im) {
        z.tiefe = z.bis > z.von ? Math.min(1, Math.max(0, (z.kurs - z.von) / (z.bis - z.von))) : 0;
        pos = Math.min(ZB - 2.5, Math.max(2.5, z.tiefe * ZB));
        lage = (z.tiefe <= 1 / 3 && (z.score || 0) >= 3) ? 'best' : 'zone';
    } else {
        pos = ZB + 3 + Math.min(1, z.abstandPct / 40) * (100 - ZB - 6);
        lage = 'warten';
    }
    const status = {
        best: `<span class="wl-st best"><i></i>Bester Kaufbereich</span>`,
        zone: `<span class="wl-st zone"><i></i>Im Kaufbereich</span>`,
        warten: `<span class="wl-st warten"><i></i>Abwarten, ${fPct((z.bis / z.kurs - 1) * 100)} bis Kaufbereich</span>`,
    }[lage];
    const tipKurs = `Aktueller Kurs ${fUsd(z.kurs)}\n` + (lage === 'best' ? 'Er steht im besten Kaufbereich.' : lage === 'zone' ? 'Er steht im Kaufbereich, aber in der oberen Zone oder die Zone ist weniger stark.' : `Er muss noch ${fPct((z.bis / z.kurs - 1) * 100)} fallen, bis der Kaufbereich erreicht ist.`);
    const info = `<span class="wl-iw"><button type="button" class="wl-i" aria-label="So liest du die Leiste">i</button><span class="wl-tip" role="tooltip">
        <b>So liest du die Leiste</b>
        <span><i class="k g1"></i><u>Dunkelgrün, Bester Kaufbereich:</u> unteres Drittel einer starken Zone mit mindestens 3 Gründen (Wendepunkte, Fibonacci, EMA 200, Volumen). Hier ist Chance zu Risiko am besten.</span>
        <span><i class="k g2"></i><u>Hellgrün, Kaufbereich:</u> restliche Zone. Einstieg möglich, aber etwas teurer oder die Zone ist weniger stark.</span>
        <span><i class="k y"></i><u>Gelb gestrichelt, Abwarten:</u> so weit muss der Kurs noch fallen. Je länger, desto weiter weg.</span>
        <span><i class="k p"></i><u>Der Punkt</u> ist der aktuelle Kurs. Je weiter links, desto besser für den Einstieg.</span>
        <span class="n">Die Zone kommt aus der Auto-TA: Wendepunkte im Chart, Fibonacci, EMA 200, Volumen. Regelbasiert, keine Anlageberatung.${z.quelle === 'tage' ? ' Bei diesem Coin aus Tageskursen berechnet (kein Binance-Paar), daher gröber als mit Kerzen.' : ''}</span></span></span>`;
    const weg = lage === 'warten' ? `<i class="wl-weg" tabindex="0" style="left:${ZB}%;width:${(pos - ZB).toFixed(1)}%" data-tip="Abwarten&#10;Der Kurs liegt noch ${fNum(z.abstandPct, 1)} % über dem Kaufbereich. Diese Strecke muss er noch fallen."></i>` : '';
    return `<div class="wl-zk">${status}${info}</div>
        <div class="wl-leiste wl-l-${lage}" style="--zb:${ZB}%">
            <i class="wl-g1" tabindex="0" data-tip="Bester Kaufbereich&#10;${fUsd(z.von)} bis ${fUsd(z.von + (z.bis - z.von) / 3)}, unteres Drittel der Zone. Vom Kurs aus ${p(z.von + (z.bis - z.von) / 3)} bis ${p(z.von)}. Hier ist Chance zu Risiko am besten."></i>
            <i class="wl-g2" tabindex="0" data-tip="Kaufbereich&#10;${fUsd(mitte)} bis ${fUsd(z.bis)}, restliche Zone. Einstieg möglich, aber etwas teurer oder die Zone ist weniger stark."></i>
            <i class="wl-rest" tabindex="0" data-tip="Abwarten&#10;Über ${fUsd(z.bis)} ist der Coin für einen Einstieg zu teuer."></i>
            ${weg}
            <b class="wl-m${pos < 30 ? ' tl' : pos > 70 ? ' tr' : ''}" tabindex="0" style="left:${pos.toFixed(1)}%" data-tip="${esc(tipKurs)}"><span>Jetzt</span></b>
        </div>
        <div class="wl-zu"><span class="g">Bester Kaufbereich</span><span class="r">Abwarten</span></div>
        <div class="wl-zz"><span>Zone ${fUsd(z.von)} bis ${fUsd(z.bis)}</span><span>Mitte ${p(mitte)} · Boden ${p(z.von)}</span></div>`;
}


const LEER = {
    wenig: ['Kein Kursverlauf', 'Für diesen Coin liefern die Datenquellen keinen Kursverlauf mit mindestens 30 Tagen (typisch bei Wrapped- und Staking-Token, die dem Kurs eines anderen Coins folgen, und bei sehr neuen Coins). Deshalb ist kein Kaufbereich berechenbar.'],
    stabil: ['Kurs stabil', 'Der Kurs bewegt sich kaum (zum Beispiel Stablecoin oder an einen Wert gekoppelt). Ein Kaufbereich ist hier nicht sinnvoll.'],
    keine: ['Keine klare Zone', 'Im Chart gibt es unter dem Kurs gerade keine starke Zone mit mehreren Gründen.'],
    unter: ['Unter der Zone', 'Der Kurs ist unter die letzte Kaufzone gefallen. Eine neue Zone muss sich erst bilden.'],
};
function leerGrund(z) { return LEER[(z && z.grund) || 'keine'] || LEER.keine; }
function leerHtml(z) {
    const [t, tip] = leerGrund(z);
    return `<div class="wl-zk"><span class="wl-st leer"><i></i>${esc(t)}</span></div><div class="wl-leiste wl-l-leer" title="${esc(tip)}"><i class="wl-rest" style="left:0;right:0"></i></div><div class="wl-zz"><span>${esc(tip)}</span></div>`;
}
export function kompakt(z) {
    if (!z || z.keine) {
        const [t, tip] = leerGrund(z || { grund: 'wenig' });
        return `<div class="kbk kbk-leer" title="${esc(tip + ' Regelbasiert, keine Anlageberatung.')}"><div class="kbk-bar"></div><span class="kbk-t leer">${esc(t)}</span></div>`;
    }
    const mitte = (z.von + z.bis) / 2, ZB = 36;
    let pos, lage, txt;
    if (z.im) {
        const t = z.bis > z.von ? Math.min(1, Math.max(0, (z.kurs - z.von) / (z.bis - z.von))) : 0;
        pos = Math.min(ZB - 3, Math.max(3, t * ZB)); lage = (t <= 1 / 3 && (z.score || 0) >= 3) ? 'best' : 'zone';
        txt = lage === 'best' ? 'Bester Kaufbereich' : 'Im Kaufbereich';
    } else {
        pos = ZB + 3 + Math.min(1, z.abstandPct / 40) * (100 - ZB - 6); lage = 'warten';
        txt = 'Abwarten ' + fPct((z.bis / z.kurs - 1) * 100);
    }
    const tip = `${txt}. Kaufzone ${fUsd(z.von)} bis ${fUsd(z.bis)}, bester Bereich bis ${fUsd(z.von + (z.bis - z.von) / 3)}. Kurs ${fUsd(z.kurs)}. Je weiter links der Punkt, desto besser der Einstieg. Regelbasiert, keine Anlageberatung.${z.quelle === 'tage' ? ' Zone aus Tageskursen berechnet (kein Binance-Paar).' : ''}`;
    return `<div class="kbk wl-l-${lage}" title="${esc(tip)}" style="--zb:${ZB}%"><div class="kbk-bar"><i class="kg1"></i><i class="kg2"></i>${lage === 'warten' ? `<i class="kw" style="left:${ZB}%;width:${(pos - ZB).toFixed(1)}%"></i>` : ''}<b style="left:${pos.toFixed(1)}%"></b></div><span class="kbk-t ${lage}">${esc(txt)}</span></div>`;
}

const STIL = `
        .wl-zone { position: relative; display: flex; flex-direction: column; align-items: stretch; gap: 9px; margin-top: -2px; margin-bottom: 16px; font-family: var(--mono); font-size: .66rem; letter-spacing: .04em; color: var(--ink-3); }
        .wl-zk { display: flex; align-items: center; gap: 8px; min-height: 24px; }
        .wl-st { white-space: nowrap; display: inline-flex; align-items: center; gap: 7px; padding: 4px 11px 4px 9px; border-radius: 99px; font-size: .64rem; letter-spacing: .05em; background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--c); }
        .wl-st i { width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
        .wl-st.best { --c: var(--up); } .wl-st.best i { animation: wlPuls 1.8s ease-out infinite; }
        .wl-st.zone { --c: color-mix(in srgb, var(--up) 70%, var(--ink-2)); } .wl-st.warten { --c: var(--warn); }
        .wl-iw { margin-left: auto; }
        .wl-i { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: var(--surface); box-shadow: var(--sh-sm); color: var(--ink-2); font-family: Georgia, serif; font-size: .78rem; font-style: italic; font-weight: 600; cursor: help; transition: transform .25s var(--ease-spring), color .2s; }
        .wl-i:hover, .wl-i:focus { color: var(--ink); outline: 0; transform: scale(1.12); }
        .wl-tip { position: absolute; left: 0; right: 0; top: 34px; z-index: 30; padding: 15px 17px; border-radius: var(--r-md); background: var(--surface); box-shadow: var(--sh-float); font-family: var(--font, inherit); font-size: .76rem; letter-spacing: 0; line-height: 1.5; color: var(--ink-2); display: flex; flex-direction: column; gap: 9px;
            opacity: 0; visibility: hidden; transform: translateY(-6px) scale(.98); transform-origin: top right; transition: opacity .22s var(--ease), transform .28s var(--ease-spring), visibility .22s; pointer-events: none; }
        .wl-iw:hover .wl-tip, .wl-iw:focus-within .wl-tip { opacity: 1; visibility: visible; transform: none; }
        .wl-tip b { color: var(--ink); font-size: .84rem; font-weight: 500; } .wl-tip u { text-decoration: none; color: var(--ink); font-weight: 500; }
        .wl-tip .n { color: var(--ink-3); font-size: .68rem; }
        .wl-tip .k { display: inline-block; width: 18px; height: 8px; border-radius: 99px; margin-right: 8px; vertical-align: middle; }
        .wl-tip .k.g1 { background: var(--up); } .wl-tip .k.g2 { background: color-mix(in srgb, var(--up) 40%, transparent); }
        .wl-tip .k.p { width: 10px; height: 10px; border-radius: 50%; background: var(--ink); }
        .wl-tip .k.y { background: repeating-linear-gradient(90deg, var(--warn) 0 4px, transparent 4px 8px); }
        .wl-leiste { position: relative; height: 14px; margin: 18px 0 2px; border-radius: 99px; background: var(--bg); box-shadow: var(--sh-in); }
        .wl-leiste > i { position: absolute; top: 0; bottom: 0; cursor: help; outline: 0; transition: filter .2s, transform .25s var(--ease-spring); }
        .wl-g1 { left: 0; width: calc(var(--zb) / 3); border-radius: 99px 0 0 99px; background: linear-gradient(90deg, color-mix(in srgb, var(--up) 95%, #000), var(--up)); transform-origin: left; animation: wlWachsen .7s var(--ease) both; }
        .wl-g2 { left: calc(var(--zb) / 3); width: calc(var(--zb) * 2 / 3); border-radius: 0 99px 99px 0; background: linear-gradient(90deg, color-mix(in srgb, var(--up) 60%, transparent), color-mix(in srgb, var(--up) 28%, transparent)); transform-origin: left; animation: wlWachsen .7s .15s var(--ease) both; }
        .wl-g1::before { content: ''; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%); background-size: 220% 100%; animation: wlGlanz 3.2s 1s ease-in-out infinite; }
        .wl-rest { left: var(--zb); right: 0; border-radius: 0 99px 99px 0; }
        .wl-weg { top: 4px !important; bottom: 4px !important; background: repeating-linear-gradient(90deg, var(--warn) 0 5px, transparent 5px 10px); opacity: .85; animation: wlLaufen 1s linear infinite, wlBlende .6s .5s both; }
        .wl-leiste > i:hover, .wl-leiste > i:focus { filter: brightness(1.15) saturate(1.2); transform: scaleY(1.35); }
        .wl-m { position: absolute; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; background: var(--ink); box-shadow: 0 0 0 3px var(--surface), 0 3px 10px rgba(0,0,0,.35); cursor: help; outline: 0; z-index: 2; animation: wlRein 1.1s .25s var(--ease) both; transition: transform .25s var(--ease-spring); }
        .wl-m::before { content: ''; position: absolute; inset: -6px; border-radius: 50%; border: 2px solid var(--mc, var(--warn)); opacity: 0; animation: wlRing 2.2s 1.4s ease-out infinite; }
        .wl-l-best .wl-m, .wl-l-zone .wl-m { --mc: var(--up); } .wl-l-warten .wl-m { --mc: var(--warn); }
        .wl-m:hover, .wl-m:focus { transform: scale(1.18); }
        .wl-m span { position: absolute; bottom: calc(100% + 7px); left: 50%; transform: translateX(-50%); font-size: .56rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-2); white-space: nowrap; pointer-events: none; }
        [data-tip] { --tx: -50%; }
        .wl-leiste [data-tip]::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 14px); left: 50%; width: max-content; max-width: 230px; padding: 9px 12px; border-radius: 12px; background: var(--ink); color: var(--surface); font-family: var(--font, inherit); font-size: .72rem; letter-spacing: 0; line-height: 1.45; text-transform: none; white-space: pre-line; font-style: normal; font-weight: 400; box-shadow: var(--sh-float); z-index: 40;
            opacity: 0; visibility: hidden; transform: translate(var(--tx), 6px); transition: opacity .2s var(--ease), transform .25s var(--ease-spring), visibility .2s; pointer-events: none; }
        .wl-leiste [data-tip]:hover::after, .wl-leiste [data-tip]:focus::after { opacity: 1; visibility: visible; transform: translate(var(--tx), 0); }
        .wl-g1[data-tip]::after { left: 0; --tx: 0; } .wl-rest[data-tip]::after { left: auto; right: 0; --tx: 0; }
        .wl-m[data-tip]::after { bottom: calc(100% + 26px); }
        .wl-m.tl[data-tip]::after { left: -10px; --tx: 0; } .wl-m.tr[data-tip]::after { left: auto; right: -10px; --tx: 0; }
        .wl-zu { display: flex; justify-content: space-between; gap: 8px; font-size: .58rem; letter-spacing: .1em; text-transform: uppercase; }
        .wl-zu .g { color: var(--up); } .wl-zu .r { color: var(--warn); opacity: .8; }
        .wl-zz { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; font-size: .62rem; color: var(--ink-3); }
        @keyframes wlWachsen { from { transform: scaleX(0); } }
        @keyframes wlRein { from { left: 100%; opacity: 0; } }
        @keyframes wlBlende { from { opacity: 0; } }
        @keyframes wlLaufen { to { background-position: -10px 0; } }
        @keyframes wlGlanz { 0%, 60% { background-position: 120% 0; } 100% { background-position: -120% 0; } }
        @keyframes wlRing { 0% { opacity: .7; transform: scale(.6); } 100% { opacity: 0; transform: scale(1.5); } }
        @keyframes wlPuls { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--up) 60%, transparent); } 100% { box-shadow: 0 0 0 7px transparent; } }
        @media (prefers-reduced-motion: reduce) { .wl-zone *, .wl-zone *::before, .wl-zone *::after { animation: none !important; transition: none !important; } }

        .kbk { display: flex; flex-direction: column; gap: 4px; width: 100%; max-width: 168px; margin-top: 5px; cursor: help; }
        .kbk-bar { position: relative; height: 7px; border-radius: 99px; background: var(--bg); box-shadow: var(--sh-in); }
        .kbk-bar i { position: absolute; top: 0; bottom: 0; }
        .kbk-bar .kg1 { left: 0; width: calc(var(--zb) / 3); border-radius: 99px 0 0 99px; background: var(--up); transform-origin: left; animation: wlWachsen .6s var(--ease) both; }
        .kbk-bar .kg2 { left: calc(var(--zb) / 3); width: calc(var(--zb) * 2 / 3); border-radius: 0 99px 99px 0; background: color-mix(in srgb, var(--up) 35%, transparent); transform-origin: left; animation: wlWachsen .6s .1s var(--ease) both; }
        .kbk-bar .kw { top: 2px; bottom: 2px; background: repeating-linear-gradient(90deg, var(--warn) 0 4px, transparent 4px 8px); animation: wlLaufen 1s linear infinite; }
        .kbk-bar b { position: absolute; top: 50%; width: 11px; height: 11px; margin: -5.5px 0 0 -5.5px; border-radius: 50%; background: var(--ink); box-shadow: 0 0 0 2px var(--surface), 0 2px 6px rgba(0,0,0,.3); animation: wlRein .9s .15s var(--ease) both; }
        .kbk-t { font-family: var(--mono); font-size: .56rem; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
        .kbk-t.best { color: var(--up); } .kbk-t.zone { color: color-mix(in srgb, var(--up) 70%, var(--ink-2)); } .kbk-t.warten { color: var(--warn); }
        .kbk-t:empty { display: none; }
        .kbk-t.leer { color: var(--ink-3); }
        .kbk-leer .kbk-bar { background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--ink-3) 35%, transparent) 0 5px, transparent 5px 10px), var(--bg); }
        .wl-st.leer { --c: var(--ink-3); } .wl-l-leer { opacity: .55; }
        .kb-voll { margin: 4px 0 14px; }
        th.kb-th { cursor: pointer; user-select: none; }
        th.kb-th:hover, th.kb-th.kb-an { color: var(--up); }
        .kb-ind { font-family: var(--mono); letter-spacing: .06em; }
        .kb-ls { align-self: flex-start; display: inline-flex; align-items: center; gap: 7px; margin: 0 0 10px; padding: 5px 12px 5px 10px; border-radius: 99px; background: var(--bg); box-shadow: var(--sh-in); font-family: var(--mono); font-size: .6rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); cursor: pointer; transition: color .2s, box-shadow .2s; }
        .kb-ls i { width: 16px; height: 6px; border-radius: 99px; background: linear-gradient(90deg, var(--up) 0 50%, color-mix(in srgb, var(--up) 35%, transparent) 50% 100%); }
        .kb-ls:hover { color: var(--ink); } .kb-ls.kb-an { color: var(--up); background: var(--surface); box-shadow: var(--sh-sm); }
        .kb-slot { display: block; }
        .cd-pricerow + .kb-voll { margin-top: -2px; }
        @media (prefers-reduced-motion: reduce) { .kbk *, .kbk *::before { animation: none !important; } }
`;

const ZEILEN = 'tr[data-coin], .li[data-coin], .gm-row[data-coin], .bz-row[data-coin], .cs-row[data-coin], .card[data-coin], article[data-coin]';
let io = null, wartend = [], laeuft = 0;

function slotFuer(el) {
    if (el.tagName === 'TR') {
        const tds = [...el.children].filter(x => x.tagName === 'TD');
        return tds.find(td => td.querySelector('.coin-img')) || tds[1] || tds[0] || null;
    }
    return el.querySelector('.nm, .name, .cs-name, h3, .h2') || el;
}

const zonen = new Map();
function zFuer(sym) {
    if (!zonen.has(sym)) { const c = coin(sym); zonen.set(sym, c ? aufbereich(c).catch(() => null) : Promise.resolve(null)); }
    return zonen.get(sym);
}
export function rang(z) {
    if (!z || z.keine) return null;
    if (z.im) { const t = z.bis > z.von ? Math.min(1, Math.max(0, (z.kurs - z.von) / (z.bis - z.von))) : 0; return ((t <= 1 / 3 && (z.score || 0) >= 3) ? -100 : -50) + t * 40; }
    return z.abstandPct;
}
const raenge = new Map();

async function fuelle(el) {
    const sym = el.dataset.kb;
    const z = await zFuer(sym);
    raenge.set(sym, rang(z));
    if (!el.isConnected) return;
    const html = z && !z.keine ? (el.dataset.kbvoll ? zoneHtml(z) : kompakt(z)) : (el.dataset.kbvoll ? leerHtml(z) : kompakt(z));
    el.innerHTML = html;
    if (!html) el.remove();
}
function schiebe() {
    while (laeuft < 3 && wartend.length) {
        const el = wartend.shift(); laeuft++;
        fuelle(el).finally(() => { laeuft--; schiebe(); });
    }
}
function sichtbar(el) {
    if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); wartend.push(e.target); schiebe(); } }), { rootMargin: '300px' });
    io.observe(el);
}
const sortZustand = {};        // schluessel -> 1 (beste zuerst) oder -1
const gruppen = new Set();     // aktive Gruppen {key, box, items(), kopf}
let laedt = 0;

function schluessel(root, el, art) {
    const alle = [...root.querySelectorAll(art === 'tab' ? 'table' : '.kb-ls')];
    return location.hash + '|' + art + '|' + alle.indexOf(el);
}
function anzeige(g) {
    const d = sortZustand[g.key], ind = g.kopf.querySelector('.kb-ind');
    if (!ind) return;
    g.kopf.classList.toggle('kb-an', !!d);
    const pre = g.kopf.classList.contains('kb-ls') ? ', ' : ' Kaufbereich, ';
    ind.textContent = laedt && d ? pre + 'lädt ' + laedt : d === 1 ? pre + 'beste zuerst ↓' : d === -1 ? pre + 'beste zuletzt ↑' : '';
}
async function ordne(g, laden) {
    const d = sortZustand[g.key]; if (!d) return;
    const items = g.items(); if (items.length < 2) return;
    const syms = items.map(el => (el.dataset.coin || '').toUpperCase());
    if (laden) {
        const offen = [...new Set(syms)].filter(x => !raenge.has(x));
        laedt = offen.length; anzeige(g);
        let i = 0;
        const arbeiter = async () => { while (i < offen.length) { const x = offen[i++]; raenge.set(x, rang(await zFuer(x))); laedt--; if (laedt % 5 === 0) anzeige(g); } };
        await Promise.all([arbeiter(), arbeiter(), arbeiter(), arbeiter(), arbeiter(), arbeiter()]);
        laedt = 0;
    }
    if (!g.box.isConnected) return;
    const wert = el => { const r = raenge.get((el.dataset.coin || '').toUpperCase()); return r == null ? null : r; };
    const neu = items.slice().sort((a, b) => {
        const ra = wert(a), rb = wert(b);
        if (ra == null && rb == null) return 0; if (ra == null) return 1; if (rb == null) return -1;
        return (ra - rb) * d;
    });
    if (neu.every((el, i) => el === items[i])) { anzeige(g); return; }
    const nach = items[items.length - 1].nextSibling;
    neu.forEach(el => g.box.insertBefore(el, nach));
    anzeige(g);
}
function klick(g) {
    sortZustand[g.key] = sortZustand[g.key] === 1 ? -1 : 1;
    ordne(g, true);
}
function gruppenFinden(root) {
    root.querySelectorAll('table').forEach(t => {
        const rows = [...t.querySelectorAll('tbody > tr[data-coin]')];
        if (rows.length < 2 || t.closest('#drawer')) return;
        const key = schluessel(root, t, 'tab');
        let th = t.querySelector('th[data-kb-th]');
        if (!th) {
            const slot = slotFuer(rows[0]), idx = slot ? [...rows[0].children].indexOf(slot) : -1;
            const kopfZeile = t.querySelector('thead tr'); if (!kopfZeile || idx < 0) return;
            th = kopfZeile.children[idx]; if (!th) return;
            th.dataset.kbTh = '1'; th.classList.add('kb-th');
            th.title = 'Nach Kaufgelegenheit sortieren: zuerst Coins im besten Kaufbereich, dann im Kaufbereich, dann nach Abstand. Nochmal klicken dreht um.';
            const ind = document.createElement('span'); ind.className = 'kb-ind'; th.appendChild(ind);
        }
        const tbody = rows[0].parentNode;
        const g = { key, box: tbody, kopf: th, items: () => [...tbody.children].filter(x => x.matches('tr[data-coin]')) };
        th._kbGruppe = g;
        gruppen.add(g);
        if (sortZustand[key]) ordne(g, true); else anzeige(g);
    });
    const LISTE = '.li[data-coin], .gm-row[data-coin], .bz-row[data-coin], .cs-row[data-coin], .card[data-coin], article[data-coin]';
    const boxen = new Set();
    root.querySelectorAll(LISTE).forEach(el => { if (!el.closest('[data-wl], #drawer, table')) boxen.add(el.parentNode); });
    boxen.forEach(box => {
        const items = () => [...box.children].filter(x => x.matches(LISTE));
        if (items().length < 3) return;
        let btn = box.previousElementSibling && box.previousElementSibling.classList.contains('kb-ls') ? box.previousElementSibling : null;
        if (!btn) {
            btn = document.createElement('button'); btn.type = 'button'; btn.className = 'kb-ls';
            btn.title = 'Nach Kaufgelegenheit sortieren: zuerst Coins im besten Kaufbereich, dann im Kaufbereich, dann nach Abstand. Nochmal klicken dreht um.';
            btn.innerHTML = '<i></i><span>Nach Kaufbereich<span class="kb-ind"></span></span>';
            box.parentNode.insertBefore(btn, box);
        }
        const g = { key: schluessel(root, btn, 'liste'), box, kopf: btn, items };
        btn._kbGruppe = g;
        gruppen.add(g);
        if (sortZustand[g.key]) ordne(g, true); else anzeige(g);
    });
    gruppen.forEach(g => { if (!g.box.isConnected) gruppen.delete(g); });
}

function scan(root) {
    root.querySelectorAll(ZEILEN).forEach(el => {
        if (el.dataset.kbDone || el.closest('[data-wl], #drawer')) return;
        const sym = (el.dataset.coin || '').toUpperCase(), c = sym && coin(sym);
        el.dataset.kbDone = '1';
        if (!c) return;
        const slot = slotFuer(el); if (!slot) return;
        const k = document.createElement('span'); k.className = 'kb-slot'; k.dataset.kb = sym;
        slot.appendChild(k); sichtbar(k);
    });
    root.querySelectorAll('[data-kbvoll]:not([data-kb-ok])').forEach(k => { k.dataset.kbOk = '1'; k.dataset.kb = k.dataset.kbvoll; sichtbar(k); });
    if (root.id !== 'drawer') gruppenFinden(root);
}
export function kbInit(wurzeln) {
    if (!document.getElementById('kb-stil')) { const s = document.createElement('style'); s.id = 'kb-stil'; s.textContent = STIL; document.head.appendChild(s); }
    document.addEventListener('click', ev => {
        const k = ev.target.closest('th[data-kb-th], .kb-ls');
        if (!k || !k._kbGruppe) {
            const th = ev.target.closest('th'), t = th && th.closest('table'), ours = t && t.querySelector('th[data-kb-th]');
            if (ours && ours._kbGruppe && sortZustand[ours._kbGruppe.key]) { delete sortZustand[ours._kbGruppe.key]; anzeige(ours._kbGruppe); }
            return;
        }
        ev.stopPropagation(); ev.preventDefault();
        klick(k._kbGruppe);
    }, true);
    let t = null;
    const lauf = () => { clearTimeout(t); t = setTimeout(() => wurzeln.forEach(r => r && scan(r)), 120); };
    const mo = new MutationObserver(lauf);
    wurzeln.forEach(r => r && mo.observe(r, { childList: true, subtree: true }));
    lauf();
}
