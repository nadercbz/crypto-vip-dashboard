import { D, coin, signal } from './data.js?v=202610102147';
import { esc, fPct, cls } from './fmt.js?v=202610102147';
import { card, chip, coinImg, icon, bar, hydrate } from './ui.js?v=202610102147';

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const tageSeit = d => d ? Math.max(0, (Date.now() - new Date(d + 'T12:00:00').getTime()) / 86400000) : 99;
const datumDE = d => { const t = String(d || '').split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' : (d || ''); };
const NICHT = new Set(['USDT', 'USDC', 'DAI', 'STETH', 'WSTETH', 'WBTC', 'WETH', 'CBBTC', 'USDE', 'USDS']);
const offen = new Set();

let eigenFuer = () => null;
let MODELL_PRIVAT = '', TITEL_PRIVAT = '';

function sammeln(d) {
    const m = new Map();
    for (const q of d.quellen || []) {
        for (const c of q.coins || []) {
            const k = String(c.sym).toUpperCase();
            if (NICHT.has(k)) continue;
            const e = m.get(k) || { sym: k, quellen: [] };
            const promo = !!c.promo || (q.kampagne && !!c.promo);
            e.quellen.push({ name: q.name, treffer: c.treffer || 0, titel: c.im_titel || 0, trans: c.im_transkript || 0, letzt: c.letzt, promo, videos: c.n_videos || 0 });
            m.set(k, e);
        }
    }
    return [...m.values()];
}

function influencerScore(e) {
    const echte = e.quellen.filter(q => !q.promo), promo = e.quellen.filter(q => q.promo);
    const breite = echte.length + promo.length * 0.25;
    const breiteS = breite <= 0 ? 0 : clamp(35 + (breite - 1) * 19, 10, 92);
    const eff = echte.reduce((a, q) => a + q.titel * 3 + q.trans, 0) + promo.reduce((a, q) => a + (q.titel * 3 + q.trans) * 0.2, 0);
    const tiefeS = clamp(30 * Math.log10(1 + eff) + 10);
    const tage = Math.min(...e.quellen.map(q => tageSeit(q.letzt)));
    const frischS = tage <= 2 ? 100 : tage <= 5 ? 85 : tage <= 10 ? 65 : tage <= 20 ? 40 : 20;
    let s = breiteS * 0.5 + tiefeS * 0.25 + frischS * 0.25;
    if (!echte.length) s = Math.min(s, 35);
    return { score: s, breite: echte.length, promo: promo.length, eff, tage };
}

function marktScore(sym, c) {
    const K = D.kaufsignale;
    let k = null;
    if (K) for (const t of K.tiers || []) { const x = t.coins.find(y => y.symbol === sym); if (x) { k = x; break; } }
    const sg = signal(sym);
    let s = null, quelle = '', status = null;
    if (k) { s = k.score + (k.status === 'kauf' ? 5 : 0); quelle = 'Kaufsignale'; status = k.status; }
    else if (sg && sg.score != null) { s = sg.score * 0.9; quelle = 'Signal-Engine'; }
    if (s == null && c) {
        const kz = D.kaufzonen && D.kaufzonen.coins && D.kaufzonen.coins[c.id];
        const p = c.current_price;
        if (kz && kz.status === 'zone' && p) {
            if (p >= kz.von * 0.97 && p <= kz.bis * 1.03) s = 68;
            else if (p > kz.bis) { const ab = (p - kz.bis) / p * 100; s = ab <= 10 ? 55 : ab <= 25 ? 45 : 35; }
            else s = 40;
            quelle = 'Kaufzone aus Tageskursen';
        } else if (kz && kz.status === 'keine') { s = 40; quelle = 'Keine klare Kaufzone'; }
    }
    const d7 = c && c.price_change_percentage_7d_in_currency;
    if (s != null && d7 != null && d7 > 35) s -= 15;
    return { score: s == null ? null : clamp(s), quelle, status, k, d7 };
}

export function berechneRang(d) {
    const liste = [];
    for (const e of sammeln(d)) {
        const c = coin(e.sym);
        if (!c) continue;
        const inf = influencerScore(e);
        const m = marktScore(e.sym, c);
        const eig = eigenFuer(e.sym);
        const teile = [[inf.score, 0.45]];
        if (m.score != null) teile.push([m.score, 0.25]);
        if (eig) teile.push([eig.score, 0.30]);
        const w = teile.reduce((a, t) => a + t[1], 0);
        let gesamt = teile.reduce((a, t) => a + t[0] * t[1], 0) / w;
        if (m.score == null) gesamt *= 0.9;   // ohne Marktprüfung 10 % Abzug
        liste.push({ sym: e.sym, c, e, inf, m, eig, gesamt });
    }
    return liste.sort((a, b) => b.gesamt - a.gesamt).slice(0, 10);
}

const farbe = v => v >= 70 ? 'var(--up)' : v >= 55 ? 'var(--warn)' : 'var(--ink-3)';
const z = (v, d = 0) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: d });

function zeile(r, i) {
    const on = offen.has(r.sym);
    const ks = r.m.status ? { kauf: ['Kaufsignal', 'var(--up)'], beobachten: ['Beobachten', 'var(--warn)'], kein: ['Kein Signal', 'var(--ink-3)'] }[r.m.status] : null;
    const chips = [];
    chips.push(chip(`${r.inf.breite} Quelle${r.inf.breite === 1 ? '' : 'n'}`, r.inf.breite >= 2 ? 'var(--pg)' : 'var(--ink-3)'));
    if (r.inf.promo) chips.push(chip(r.inf.breite ? 'auch Werbung' : 'nur Werbung', 'var(--warn)'));
    if (ks) chips.push(chip(ks[0], ks[1]));
    if (r.m.score == null) chips.push(chip('Markt ungeprüft', 'var(--warn)'));
    if (r.eig) r.eig.chips.forEach(([t, c]) => chips.push(chip(t, c)));
    if (r.m.d7 != null && r.m.d7 > 35) chips.push(chip(`Pump ${fPct(r.m.d7, 0)} in 7T`, 'var(--down)'));
    const saeule = (l, v, t) => v == null
        ? `<div class="ir-s"><span>${l}</span><i class="dim">keine Daten</i><b class="mono">–</b></div>`
        : `<div class="ir-s" title="${esc(t || '')}"><span>${l}</span>${bar(v, farbe(v))}<b class="mono">${z(v)}</b></div>`;
    return `<div class="ir-item${on ? ' on' : ''}">
        <button class="ir-row" data-ir="${esc(r.sym)}" aria-expanded="${on}">
            <span class="ir-rank mono">${i + 1}</span>
            <span class="ir-coin">${coinImg(r.c.image)}<span><b>${esc(r.sym)}</b> <span class="dim">${esc(r.c.name)}</span><span class="ir-chips">${chips.join('')}</span></span></span>
            <span class="ir-sa">${saeule('Influencer', r.inf.score, 'Quellen, Häufigkeit und Frische')}${saeule('Markt', r.m.score, r.m.quelle)}${r.eig !== undefined && r.eig !== null ? saeule('Eigene', r.eig.score, 'Eigene Analyse') : ''}</span>
            <span class="ir-score num" style="color:${farbe(r.gesamt)}">${z(r.gesamt)}</span>
            <span class="ir-chev">${icon('chevron-down')}</span>
        </button>
        ${on ? detail(r) : ''}
    </div>`;
}

function detail(r) {
    const q = r.e.quellen.slice().sort((a, b) => String(b.letzt).localeCompare(String(a.letzt)));
    const quellen = q.map(x => `<li><b>${esc(x.name)}</b>${x.promo ? ' ' + chip('Werbung', 'var(--warn)') : ''}<span class="dim"> · ${x.titel} im Titel, ${x.trans} im Transkript, zuletzt ${esc(datumDE(x.letzt))}</span></li>`).join('');
    const extra = r.eig && r.eig.text.length ? `<div class="ir-box"><div class="eyebrow">Deine Analyse</div><ul class="ir-ul">${r.eig.text.map(([t, x]) => `<li><span class="ir-bel ${t}">${t === 'spek' ? 'Spekulativ' : 'Belegt'}</span><span>${esc(x)}</span></li>`).join('')}</ul></div>` : '';
    const k = r.m.k, mk = k ? `<div class="ir-box"><div class="eyebrow">Markt</div><p class="ir-p">Kaufsignale-Score ${z(k.score)} (${esc(k.narrativ ? k.narrativ.sektor : '')}). ${k.status === 'kauf' ? 'Kurs steht in der Kaufzone, Chance zu Risiko passt.' : (k.gruende_nein || []).length ? 'Kein Kaufsignal: ' + esc(k.gruende_nein.join('. ')) + '.' : ''}</p></div>`
        : `<div class="ir-box"><div class="eyebrow">Markt</div><p class="ir-p">${r.m.score == null ? 'Für diesen Coin liegt keine Marktbewertung vor.' : 'Signal-Engine Score ' + z(r.m.score) + '. Der Coin gehört nicht zu den Top 10 der Kaufsignale-Klassen, deshalb gibt es keine Chartanalyse mit Zone.'}</p></div>`;
    return `<div class="ir-detail">
        <div class="ir-grid">
            <div class="ir-box"><div class="eyebrow">Wer spricht darüber</div><ul class="ir-ul">${quellen}</ul></div>
            ${mk}${extra}
        </div>
        <div class="row wrap"><button class="btn soft" data-coin="${esc(r.sym)}">${icon('chart-candlestick')}Chart öffnen</button></div>
    </div>`;
}

export function rangKarte(d) {
    const top = berechneRang(d);
    if (!top.length) return '';
    const privat = top.some(r => r.eig);
    const modell = privat && MODELL_PRIVAT ? MODELL_PRIVAT : 'Influencer 64 %, Markt 36 %. Fehlt eine Säule, entfällt sie und die anderen zählen entsprechend mehr.';
    return card({
        eyebrow: 'Top 10 Influencer-Coins', title: 'Worauf sich die Influencer einigen, geprüft gegen Markt' + (privat ? TITEL_PRIVAT : ''),
        cls: 'tint',
        right: `<span class="eyebrow">${top.length} von ${new Set((d.quellen || []).flatMap(q => (q.coins || []).map(c => c.sym))).size} Coins</span>`,
        body: `<p class="ir-p">Wenn mehrere unabhängige Quellen denselben Coin nennen, steigt er im Ranking. Bezahlte Kampagnen zählen kaum. Danach wird jeder Coin am Markt geprüft: Ein Coin, über den alle reden, den der Chart aber gerade nicht hergibt, rutscht ab. <b>Das ist ein Ranking der Aufmerksamkeit mit Gegenprobe, keine Kaufempfehlung und keine Anlageberatung.</b></p>
        <div class="ir-list">${top.map(zeile).join('')}</div>
        <p class="ir-note">So wird gerechnet: ${modell} Influencer-Score: Breite (wie viele unabhängige Quellen) 50 %, Häufigkeit (Titel dreifach, Transkript einfach) 25 %, Frische 25 %. Eine Quelle mit Kampagnen-Markierung zählt für die Breite nur ein Viertel und für die Häufigkeit ein Fünftel. Nach einem Pump über 35 % in 7 Tagen gibt es 15 Punkte Abzug. Ohne Marktdaten bleibt ein Coin ungeprüft und verliert 10 % seines Scores.</p>`,
    });
}

export function bindRang(root, d) {
    const el = root.querySelector('.ir-list');
    if (!el) return;
    el.onclick = e => {
        const b = e.target.closest('[data-ir]');
        if (!b) return;
        const s = b.dataset.ir;
        offen.has(s) ? offen.delete(s) : offen.add(s);
        const top = berechneRang(d);
        el.innerHTML = top.map(zeile).join('');
        hydrate(el);
    };
}

export const RANG_CSS = `
    .ir-p { margin: 0 0 14px; font-size: .86rem; color: var(--ink-2); font-weight: 300; line-height: 1.6; } .ir-p b { color: var(--ink); font-weight: 500; }
    .ir-note { margin: 16px 0 0; font-size: .76rem; color: var(--ink-3); line-height: 1.6; font-weight: 300; }
    .ir-list { display: flex; flex-direction: column; }
    .ir-item + .ir-item { border-top: 1px solid var(--line); }
    .ir-row { all: unset; box-sizing: border-box; width: 100%; display: grid; grid-template-columns: 28px minmax(180px, 1.5fr) minmax(220px, 1.3fr) 46px 22px; align-items: center; gap: 16px; padding: 14px 8px; border-radius: 14px; cursor: pointer; transition: background .2s; }
    .ir-row:hover { background: color-mix(in srgb, var(--ink) 3.5%, transparent); } .ir-row:focus-visible { outline: 2px solid var(--pg); outline-offset: 2px; }
    .ir-rank { color: var(--ink-3); text-align: center; font-size: .8rem; }
    .ir-coin { display: flex; align-items: center; gap: 11px; min-width: 0; font-size: .92rem; } .ir-coin > span { display: flex; flex-direction: column; gap: 5px; min-width: 0; } .ir-coin b { font-weight: 500; }
    .ir-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
    .ir-sa { display: flex; flex-direction: column; gap: 5px; }
    .ir-s { display: grid; grid-template-columns: 62px minmax(0, 1fr) 26px; gap: 8px; align-items: center; font-size: .62rem; color: var(--ink-3); } .ir-s b { text-align: right; font-weight: 500; color: var(--ink-2); } .ir-s i { font-style: normal; font-size: .62rem; }
    .ir-score { font-size: 1.35rem; text-align: right; }
    .ir-chev svg { width: 18px; height: 18px; color: var(--ink-3); transition: transform .3s var(--ease); } .ir-item.on .ir-chev svg { transform: rotate(180deg); }
    .ir-detail { padding: 6px 8px 20px; display: flex; flex-direction: column; gap: 14px; }
    .ir-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
    .ir-box { padding: 14px 18px; border-radius: 18px; background: var(--sunk); display: flex; flex-direction: column; gap: 9px; min-width: 0; }
    .ir-ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; font-size: .82rem; color: var(--ink-2); font-weight: 300; line-height: 1.5; } .ir-ul li { display: flex; gap: 9px; flex-wrap: wrap; align-items: baseline; }
    .ir-bel { padding: 2px 9px; border-radius: var(--r-pill); font-family: var(--mono); font-size: .6rem; letter-spacing: .06em; text-transform: uppercase; color: var(--up); background: color-mix(in srgb, var(--up) 14%, transparent); } .ir-bel.spek { color: var(--ink-3); background: color-mix(in srgb, var(--ink-3) 16%, transparent); }
    @media (max-width: 860px) { .ir-row { grid-template-columns: 22px minmax(0, 1fr) auto 18px; gap: 10px; } .ir-sa { display: none; } }`;
