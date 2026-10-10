import { D } from '../core/data.js?v=202610102228';
import { esc, fBig, fPct, cls } from '../core/fmt.js?v=202610102228';
import { card, pageHead, seg, chip, empty, icon, bar, coinImg, hydrate } from '../core/ui.js?v=202610102228';

const st = { tier: 'low', offen: new Set(), sort: 'score' };
const STATUS = {
    kauf: { l: 'Kaufsignal', c: 'var(--up)', i: 'circle-check' },
    beobachten: { l: 'Beobachten', c: 'var(--warn)', i: 'eye' },
    kein: { l: 'Kein Signal', c: 'var(--ink-3)', i: 'circle-slash' },
};
const BELEG = { beleg: ['Belegt', 'var(--up)'], hyp: ['Hypothese', 'var(--a2)'], spek: ['Spekulativ', 'var(--ink-3)'] };
const SAEULE_ICON = { fundament: 'landmark', trend: 'trending-up', momentum: 'gauge', einstieg: 'crosshair', risiko: 'shield-alert' };
const HOR_LABEL = { lang: 'Langfristig', mittel: 'Mittelfristig', kurz: 'Kurzfristig' };

const z = (v, d = 1) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: d });
const p = v => {
    if (v == null) return '–';
    if (v >= 100) return '$' + z(v, 0);
    if (v >= 1) return '$' + z(v, 2);
    if (v >= 0.01) return '$' + z(v, 4);
    return '$' + Number(v).toPrecision(3).replace('.', ',');
};
const bel = t => { const [l, c] = BELEG[t] || BELEG.beleg; return `<span class="ks-bel" style="--c:${c}">${l}</span>`; };
const scoreFarbe = v => v >= 70 ? 'var(--up)' : v >= 55 ? 'var(--warn)' : 'var(--ink-3)';

function frische(K) {
    const ageH = K.generated_ts ? (Date.now() / 1000 - K.generated_ts) / 3600 : null;
    if (ageH != null && ageH >= 48) return `<div class="ks-stale bad">${icon('triangle-alert')}<div>Diese Analyse ist <b>${Math.floor(ageH / 24)} Tage alt</b>. Sie bewertet einen Markt, den es so nicht mehr gibt. Frisch ziehen mit <code class="mono">python3 fetch_kaufsignale.py</code>.</div></div>`;
    if (ageH != null && ageH >= 8) return `<div class="ks-stale">${icon('hourglass')}<div>Letzte Analyse vor <b>${Math.round(ageH)} Stunden</b>. Der Agent läuft mit jedem Dashboard-Update (täglich ab 07:30, dazu 12:30, 17:30 und 21:30).</div></div>`;
    return '';
}

function lageKarte(K) {
    const m = K.makro || {};
    const kenn = [
        ['Angst und Gier', m.fng != null ? m.fng : '–', m.fng_label || ''],
        ['BTC Dominanz', m.btc_dominanz != null ? z(m.btc_dominanz, 1) + ' %' : '–', ''],
        ['BTC vom Hoch', m.btc_vom_hoch != null ? fPct(m.btc_vom_hoch, 0) : '–', ''],
        ['Gesamtmarkt 24h', m.mcap_24h != null ? fPct(m.mcap_24h, 1) : '–', m.mcap ? fBig(m.mcap) : ''],
    ];
    return card({
        eyebrow: 'Marktlage', title: 'Der Rahmen für jedes Signal',
        right: `<span class="ks-stand mono">Stand ${esc(K.updated || '')}</span>`,
        body: `<div class="ks-kpis">${kenn.map(([l, v, s]) => `<div class="ks-kpi"><div class="eyebrow">${l}</div><div class="num big">${esc(v)}</div><div class="dim ks-kpis-s">${esc(s)}</div></div>`).join('')}</div>
        <div class="ks-lage">${(K.lage || []).map(x => `<div>${bel(x.t)}<span>${esc(x.text)}</span></div>`).join('')}
            <div>${bel('hyp')}<span>${esc((K.zyklus || {}).text || '')}</span></div></div>`,
    });
}

function horizonte(c) {
    return `<div class="ks-hor">${['lang', 'mittel', 'kurz'].map(k => `<div class="ks-hor-i${c.beste === k ? ' best' : ''}" title="${HOR_LABEL[k]}: Score ${z(c.horizonte[k], 0)}">
        <span>${k === 'lang' ? 'Lang' : k === 'mittel' ? 'Mittel' : 'Kurz'}</span>${bar(c.horizonte[k], scoreFarbe(c.horizonte[k]))}<b class="mono">${z(c.horizonte[k], 0)}</b></div>`).join('')}</div>`;
}

function zeile(c) {
    const s = STATUS[c.status] || STATUS.kein;
    const offen = st.offen.has(c.id);
    const move = c.rang_vorher == null ? '<span class="ks-mv neu">NEU</span>' : c.rang_vorher === c.rang_klasse ? '' :
        c.rang_vorher > c.rang_klasse ? `<span class="ks-mv up">▲${c.rang_vorher - c.rang_klasse}</span>` : `<span class="ks-mv down">▼${c.rang_klasse - c.rang_vorher}</span>`;
    return `<div class="ks-item${offen ? ' on' : ''}" data-id="${esc(c.id)}">
        <button class="ks-row" data-toggle="${esc(c.id)}" aria-expanded="${offen}">
            <span class="ks-rank mono">${c.rang_klasse}</span>
            <span class="ks-coin">${coinImg(c.image)}<span><b>${esc(c.symbol)}</b> <span class="dim">${esc(c.name)}</span><span class="ks-sub">${esc(c.narrativ.sektor)}</span></span></span>
            <span class="ks-cap"><b class="num">${fBig(c.mcap)}</b><span class="${cls(c.d30)}">${c.d30 != null ? fPct(c.d30, 1) + ' 30T' : ''}</span></span>
            ${horizonte(c)}
            <span class="ks-st">${chip(s.l, s.c)}${move}</span>
            <span class="ks-score num" style="color:${scoreFarbe(c.score)}">${z(c.score, 0)}</span>
            <span class="ks-chev">${icon('chevron-down')}</span>
        </button>
        ${offen ? detail(c) : ''}
    </div>`;
}

function liste(items) {
    return `<ul class="ks-ul">${items.map(x => `<li>${typeof x === 'string' ? esc(x) : `${bel(x.t)}<span>${esc(x.text)}${x.link ? ` <a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${esc(x.quelle || 'Quelle')}</a>` : ''}</span>`}</li>`).join('')}</ul>`;
}

function detail(c) {
    const ch = c.chart, e = ch && ch.einstieg, s = STATUS[c.status] || STATUS.kein;
    const saeulen = (window.__KS_MODELL || []).map(m => `<div class="ks-bd-row"><span>${icon(SAEULE_ICON[m.k] || 'circle')}${esc(m.label)} <i class="dim">${m.gewicht} %</i></span>${bar(c.saeulen[m.k], scoreFarbe(c.saeulen[m.k]))}<b class="mono">${z(c.saeulen[m.k], 0)}</b></div>`).join('');
    let einstieg;
    if (!ch) {
        einstieg = `<div class="ks-note">Für diesen Coin liegt kein ausreichender Kursverlauf vor. Ohne Chart gibt es keine Einstiegszone und kein Kaufsignal.</div>`;
    } else {
        const zeilen = [];
        if (ch.zone) zeilen.push(['Lage', ch.zone.im ? 'Der Kurs steht in einer Kaufzone' : `Kurs ${z(ch.abstand, 1)} % über der nächsten Kaufzone`]);
        if (e) zeilen.push([c.status === 'kauf' ? 'Einstiegszone' : 'Mögliche Einstiegszone', `${p(e.von)} bis ${p(e.bis)}`]);
        if (e && e.gruende && e.gruende.length) zeilen.push(['Gestützt durch', e.gruende.join(', ')]);
        if (e && e.stopp) zeilen.push(['Invalidierung', `Schlusskurs unter ${p(e.stopp)}`]);
        if (ch.ziele && ch.ziele.length) zeilen.push(['Ziele', ch.ziele.map(p).join(' und ')]);
        if (e && e.rr != null) zeilen.push(['Chance zu Risiko', `1 zu ${z(e.rr, 1)}`]);
        if (ch.prognose && ch.prognose.unten) zeilen.push([`Spanne ${ch.prognose.tage} Tage`, `${p(ch.prognose.unten)} bis ${p(ch.prognose.oben)} (1 Sigma, Mitte ${p(ch.prognose.mitte)})`]);
        zeilen.push(['Chart', `RSI ${ch.rsi != null ? z(ch.rsi, 0) : '–'}, Wochen-Trend ${ch.htf === 'auf' ? 'aufwärts' : ch.htf === 'ab' ? 'abwärts' : '–'}, Struktur ${esc(ch.struktur || '–')}${ch.heiss ? ', überhitzt' : ''}`]);
        einstieg = `<div class="ks-kv">${zeilen.map(([l, w]) => `<div><span class="dim">${l}</span><span>${w}</span></div>`).join('')}</div>`;
    }
    const warum = c.status !== 'kauf' && (c.gruende_nein || []).length
        ? `<div class="ks-warum">${icon('info')}<div><b>Warum kein Kaufsignal:</b> ${c.gruende_nein.map(esc).join('. ')}.</div></div>` : '';
    const q = c.quality || {};
    return `<div class="ks-detail">
        <div class="ks-d-head">
            <div>${chip(s.l, s.c)} <span class="dim ks-q" title="So viele der 5 Säulen konnten mit echten Daten bewertet werden.">Datenqualität ${q.have}/${q.total}${(q.fehlt || []).length ? ' (fehlt: ' + esc(q.fehlt.join(', ')) + ')' : ''}</span></div>
            <div class="row wrap"><button class="btn soft" data-coin="${esc(c.symbol)}">${icon('chart-candlestick')}Chart öffnen</button></div>
        </div>
        ${warum}
        <div class="ks-grid">
            <div class="ks-box"><div class="eyebrow">Score-Aufschlüsselung</div><div class="ks-bd">${saeulen}</div>
                <div class="ks-note">Beste Eignung: <b>${HOR_LABEL[c.beste]}</b>. Gesamt ${z(c.score, 1)} von 100.</div></div>
            <div class="ks-box"><div class="eyebrow">Einstieg und Chart</div>${einstieg}</div>
            <div class="ks-box"><div class="eyebrow">Narrativ</div><p class="ks-p"><b>${esc(c.narrativ.sektor)}.</b> ${esc(c.narrativ.text)}</p>
                <div class="ks-note">Einordnung: ${chip(c.narrativ.lage, c.narrativ.lage === 'Rückenwind' ? 'var(--up)' : c.narrativ.lage === 'Gegenwind' ? 'var(--down)' : 'var(--ink-3)')} ${bel('hyp')}</div></div>
            <div class="ks-box"><div class="eyebrow">Stärken</div>${liste(c.staerken)}</div>
            <div class="ks-box"><div class="eyebrow">Schwächen</div>${liste(c.schwaechen)}</div>
            <div class="ks-box"><div class="eyebrow">Katalysatoren</div>${liste(c.katalysatoren)}</div>
            <div class="ks-box wide"><div class="eyebrow">Hauptrisiken und negative Szenarien</div>${liste(c.risiken)}</div>
        </div>
    </div>`;
}

function tierBody(K) {
    const t = K.tiers.find(x => x.key === st.tier) || K.tiers[0];
    window.__KS_MODELL = (K.modell || {}).saeulen || [];
    const kaufe = t.coins.filter(c => c.status === 'kauf').length;
    const bereich = t.bis ? `${fBig(t.von)} bis ${fBig(t.bis)}` : `über ${fBig(t.von)}`;
    return `${card({
        eyebrow: t.label + ' · ' + bereich, title: `Top ${t.coins.length} nach Score`,
        right: `<div class="row wrap"><span class="chip" style="--c:${kaufe ? 'var(--up)' : 'var(--ink-3)'}">${kaufe} Kaufsignal${kaufe === 1 ? '' : 'e'}</span><span class="dim ks-u">${t.universum} Coins im Universum, ${t.kandidaten} mit Chartanalyse</span></div>`,
        body: `<p class="ks-blurb">${esc(t.blurb)}</p>${t.coins.length ? `<div class="ks-list">${t.coins.map(zeile).join('')}</div>` : empty('Keine Coins in dieser Klasse.')}`,
    })}`;
}

function listings(K) {
    const L = K.listings || {};
    const body = !L.ok ? empty('Binance war beim letzten Lauf nicht erreichbar.') : !L.baseline
        ? empty('Der Agent hat die Liste der Binance-Handelspaare heute als Vergleichsbasis gespeichert. Ab dem nächsten Lauf erscheinen hier neue Listings.')
        : !(L.liste || []).length ? empty('In den letzten 21 Tagen kam kein neues USDT-Paar auf Binance dazu.')
            : `<div class="ks-ul2">${L.liste.map(x => `<div class="ks-li" ${x.name ? `data-coin="${esc(x.symbol)}"` : ''}><b>${esc(x.symbol)}</b><span class="dim">${esc(x.name || 'noch nicht im Dashboard')}</span><span class="mono dim">seit ${esc(x.datum)}</span><span class="${cls(x.d7)}">${x.d7 != null ? fPct(x.d7, 1) + ' 7T' : ''}</span><span class="num">${x.mcap ? fBig(x.mcap) : ''}</span></div>`).join('')}</div>`;
    return card({ eyebrow: 'Neue Listings', title: 'Frisch auf Binance (USDT-Paare, 21 Tage)', body: body + `<p class="ks-note">Neue Listings sind Aufmerksamkeit, kein Qualitätsurteil. Häufig folgt auf den Listing-Tag ein Rücksetzer. Ein Listing allein macht nie ein Kaufsignal.</p>` });
}

function bilanz(K) {
    const b = K.bilanz || {};
    const body = !b.ausgewertet
        ? `<p class="ks-p">Seit ${esc(b.seit || 'heute')} hält der Agent jedes Kaufsignal mit Datum und Kurs fest. Bisher gab es ${b.signale_gesamt || 0} Signal${b.signale_gesamt === 1 ? '' : 'e'}, aber keines ist alt genug (mindestens 7 Tage) für eine ehrliche Auswertung. Hier steht ab dann, wie die Signale gegen Bitcoin abgeschnitten haben, auch wenn es schlecht aussieht.</p>`
        : `<div class="ks-kpis"><div class="ks-kpi"><div class="eyebrow">Ausgewertet</div><div class="num big">${b.ausgewertet}</div></div>
            <div class="ks-kpi"><div class="eyebrow">Im Plus</div><div class="num big">${b.trefferquote} %</div></div>
            <div class="ks-kpi"><div class="eyebrow">Gegen Bitcoin</div><div class="num big ${cls(b.mittel_gegen_btc)}">${b.mittel_gegen_btc != null ? fPct(b.mittel_gegen_btc, 1) : '–'}</div></div></div>
            <div class="ks-ul2">${(b.liste || []).slice().reverse().map(x => `<div class="ks-li"><b>${esc(x.symbol)}</b><span class="dim">${esc(x.klasse)}</span><span class="mono dim">${esc(x.datum)} (${x.tage} T)</span><span class="${cls(x.rendite)}">${fPct(x.rendite, 1)}</span><span class="${cls(x.gegen_btc)}">${x.gegen_btc != null ? fPct(x.gegen_btc, 1) + ' vs BTC' : ''}</span></div>`).join('')}</div>`;
    return card({ eyebrow: 'Bilanz', title: 'Wie liegen die Signale im Nachhinein?', body });
}

function modell(K) {
    const M = K.modell || {};
    return card({
        eyebrow: 'Transparenz', title: 'So wird bewertet', body: `<div class="ks-model">
        <div><div class="eyebrow">Fünf Säulen, gleiche Regeln für jeden Coin</div>
            ${(M.saeulen || []).map(m => `<div class="ks-m-row"><span>${icon(SAEULE_ICON[m.k] || 'circle')}<b>${esc(m.label)}</b></span><span class="mono">${m.gewicht} %</span><span class="dim">${esc(m.text)}</span></div>`).join('')}</div>
        <div><div class="eyebrow">Drei Zeithorizonte</div>
            ${Object.entries(M.horizonte || {}).map(([k, h]) => `<div class="ks-m-row"><span><b>${esc(h.label)}</b></span><span class="mono dim">${Object.entries(h.gewichte).map(([s, w]) => `${s} ${Math.round(w * 100)}`).join(' · ')}</span></div>`).join('')}
            <p class="ks-note">Der Score oben ist die Gesamtwertung. Lang, Mittel und Kurz zeigen, für welche Haltedauer ein Coin am besten passt.</p></div>
        <div><div class="eyebrow">Wann gibt es ein Kaufsignal?</div>
            <ul class="ks-ul"><li>Gesamt-Score ab ${M.schwelle_kauf} (bei Gier im Markt +5), Beobachten ab ${M.schwelle_beobachten}.</li>
            <li>Der Kurs steht in einer Kaufzone oder höchstens 3 % darüber, die Zone hat mindestens 2 Gründe (starke Zone wie im Chart).</li>
            <li>Chance zu Risiko mindestens 1 zu 2, nicht überhitzt, Trend nicht abwärts, kein Pump über 35 % in 7 Tagen.</li>
            <li>Mindestens 3 von 5 Säulen mit echten Daten belegt, keine harte Warnung (Unlock, Mini-Umlauf).</li>
            <li>Sonst steht am Coin der Grund, warum es keines gibt. Das ist gewollt.</li></ul></div>
        <div><div class="eyebrow">Belegstufen</div>
            <ul class="ks-ul"><li>${bel('beleg')}<span>Gemessen aus Kurs-, Chart- oder Onchain-Daten mit Quelle.</span></li>
            <li>${bel('hyp')}<span>Plausibel und oft beobachtet, aber nicht bewiesen (Narrative, Zyklen, Makro).</span></li>
            <li>${bel('spek')}<span>Reine Perspektive. Fließt nie in den Score ein.</span></li></ul></div>
        </div>`,
    });
}

function mystik(K) {
    const m = K.mystik || {};
    return card({
        eyebrow: 'Perspektivwechsel', title: 'Mystik und Zeitmuster', right: bel('spek'), cls: 'sunk',
        body: `<p class="ks-p">Heute: <b>${esc(m.mond || '')}</b>. Nächster Vollmond am ${esc(m.naechster_vollmond || '')}, nächster Neumond am ${esc(m.naechster_neumond || '')}.</p><p class="ks-p">${esc(m.text || '')}</p>`,
    });
}

function quellen(K) {
    return `<p class="ks-note">Quellen: ${(K.quellen || []).map(esc).join(' · ')}. Keine Anlageberatung. Das sind Auswertungen nach festen Regeln und persönliche Meinung, keine Kauf- oder Verkaufsempfehlung. Jede Zahl kann falsch oder veraltet sein, entscheide immer selbst und setze nur Geld ein, dessen Verlust du verkraftest.</p>`;
}

export default {
    styles: `
        .ks-disc { display: flex; gap: 12px; align-items: flex-start; padding: 14px 18px; border-radius: 18px; background: color-mix(in srgb, var(--warn) 11%, transparent); color: var(--ink-2); font-size: .85rem; font-weight: 300; line-height: 1.55; }
        .ks-disc svg { width: 18px; height: 18px; flex: none; color: var(--warn); margin-top: 2px; }
        .ks-stale { display: flex; gap: 12px; align-items: flex-start; padding: 12px 16px; border-radius: 16px; background: color-mix(in srgb, var(--warn) 12%, transparent); font-size: .84rem; color: var(--ink-2); }
        .ks-stale.bad { background: color-mix(in srgb, var(--down) 12%, transparent); }
        .ks-stale svg { width: 18px; height: 18px; flex: none; color: var(--warn); } .ks-stale.bad svg { color: var(--down); }
        .ks-stand { font-size: .68rem; color: var(--ink-3); }
        .ks-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 18px; margin-bottom: 18px; }
        .ks-kpi .num { margin-top: 4px; } .ks-kpis-s { font-size: .72rem; margin-top: 2px; }
        .ks-lage { display: flex; flex-direction: column; gap: 9px; font-size: .86rem; color: var(--ink-2); font-weight: 300; line-height: 1.55; }
        .ks-lage > div, .ks-ul li { display: flex; align-items: flex-start; gap: 10px; }
        .ks-bel { flex: none; margin-top: 2px; padding: 2px 9px; border-radius: var(--r-pill); font-family: var(--mono); font-size: .6rem; letter-spacing: .06em; text-transform: uppercase; color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); white-space: nowrap; }
        .ks-blurb { font-size: .86rem; color: var(--ink-3); font-weight: 300; margin: 0 0 14px; }
        .ks-u { font-size: .74rem; }
        .ks-list { display: flex; flex-direction: column; }
        .ks-item + .ks-item { border-top: 1px solid var(--line); }
        .ks-row { all: unset; box-sizing: border-box; width: 100%; display: grid; grid-template-columns: 28px minmax(150px, 1.3fr) 110px minmax(190px, 1.4fr) 110px 46px 22px; align-items: center; gap: 16px; padding: 14px 8px; border-radius: 14px; cursor: pointer; transition: background .2s; }
        .ks-row:hover { background: color-mix(in srgb, var(--ink) 3.5%, transparent); }
        .ks-row:focus-visible { outline: 2px solid var(--pg); outline-offset: 2px; }
        .ks-rank { color: var(--ink-3); text-align: center; font-size: .8rem; }
        .ks-coin { display: flex; align-items: center; gap: 11px; min-width: 0; font-size: .92rem; }
        .ks-coin > span { display: flex; flex-direction: column; min-width: 0; } .ks-coin b { font-weight: 500; }
        .ks-coin .dim { font-size: .76rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ks-sub { font-size: .68rem; color: var(--ink-3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ks-cap { display: flex; flex-direction: column; font-size: .76rem; } .ks-cap b { font-size: .86rem; font-weight: 500; }
        .ks-hor { display: flex; flex-direction: column; gap: 4px; }
        .ks-hor-i { display: grid; grid-template-columns: 38px minmax(0, 1fr) 24px; gap: 8px; align-items: center; font-size: .62rem; color: var(--ink-3); }
        .ks-hor-i.best span { color: var(--ink); font-weight: 500; } .ks-hor-i b { text-align: right; font-weight: 500; color: var(--ink-2); }
        .ks-st { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .ks-mv { font-family: var(--mono); font-size: .62rem; } .ks-mv.neu { color: var(--pg); letter-spacing: .1em; } .ks-mv.up { color: var(--up); } .ks-mv.down { color: var(--down); }
        .ks-score { font-size: 1.35rem; text-align: right; }
        .ks-chev svg { width: 18px; height: 18px; color: var(--ink-3); transition: transform .3s var(--ease); } .ks-item.on .ks-chev svg { transform: rotate(180deg); }
        .ks-detail { padding: 8px 8px 22px; display: flex; flex-direction: column; gap: 16px; animation: ksIn .35s var(--ease); }
        @keyframes ksIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .ks-d-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
        .ks-q { font-size: .72rem; margin-left: 8px; }
        .ks-warum { display: flex; gap: 10px; padding: 12px 16px; border-radius: 14px; background: color-mix(in srgb, var(--warn) 11%, transparent); font-size: .84rem; color: var(--ink-2); line-height: 1.55; }
        .ks-warum svg { width: 17px; height: 17px; flex: none; color: var(--warn); margin-top: 2px; }
        .ks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
        .ks-box { padding: 16px 18px; border-radius: 18px; background: var(--sunk); display: flex; flex-direction: column; gap: 10px; min-width: 0; }
        .ks-box.wide { grid-column: 1 / -1; }
        .ks-bd { display: flex; flex-direction: column; gap: 9px; }
        .ks-bd-row { display: grid; grid-template-columns: minmax(130px, 1.2fr) minmax(0, 1fr) 28px; gap: 10px; align-items: center; font-size: .76rem; color: var(--ink-2); }
        .ks-bd-row span { display: flex; align-items: center; gap: 7px; } .ks-bd-row svg { width: 14px; height: 14px; color: var(--ink-3); flex: none; } .ks-bd-row i { font-style: normal; font-size: .64rem; }
        .ks-bd-row b { text-align: right; font-weight: 500; }
        .ks-kv { display: flex; flex-direction: column; gap: 7px; font-size: .82rem; }
        .ks-kv > div { display: grid; grid-template-columns: 118px minmax(0, 1fr); gap: 12px; } .ks-kv span:last-child { color: var(--ink); }
        .ks-p { margin: 0; font-size: .84rem; line-height: 1.6; color: var(--ink-2); font-weight: 300; }
        .ks-note { font-size: .76rem; color: var(--ink-3); line-height: 1.55; font-weight: 300; margin: 0; } .ks-note b { color: var(--ink-2); font-weight: 500; }
        .ks-ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; font-size: .82rem; color: var(--ink-2); font-weight: 300; line-height: 1.5; }
        .ks-ul a { color: var(--pg); }
        .ks-ul2 { display: flex; flex-direction: column; margin-top: 12px; }
        .ks-li { display: grid; grid-template-columns: 80px minmax(0, 1fr) 120px 90px 90px; gap: 12px; align-items: center; padding: 10px 6px; font-size: .82rem; cursor: pointer; border-top: 1px solid var(--line); }
        .ks-li:first-child { border-top: 0; }
        .ks-model { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 26px; }
        .ks-m-row { display: grid; grid-template-columns: minmax(0, 1.2fr) 46px; gap: 4px 12px; padding: 9px 0; border-top: 1px solid var(--line); font-size: .82rem; }
        .ks-m-row:first-of-type { border-top: 0; } .ks-m-row > span:first-child { display: flex; align-items: center; gap: 8px; } .ks-m-row svg { width: 14px; height: 14px; color: var(--ink-3); }
        .ks-m-row .dim { grid-column: 1 / -1; font-size: .74rem; font-weight: 300; line-height: 1.5; }
        @media (max-width: 860px) {
            .ks-row { grid-template-columns: 22px minmax(0, 1fr) auto 18px; gap: 10px; }
            .ks-cap, .ks-hor { display: none; } .ks-st { grid-column: 3; grid-row: 1; } .ks-score { grid-column: 3; grid-row: 1; display: none; }
            .ks-coin { grid-column: 2; }
            .ks-st { align-items: flex-end; }
            .ks-li { grid-template-columns: 60px minmax(0, 1fr) 80px; } .ks-li > :nth-child(n+4) { display: none; }
            .ks-grid { grid-template-columns: 1fr; } .ks-kv > div { grid-template-columns: 1fr; gap: 0; }
        }`,
    render(root) {
        const K = D.kaufsignale;
        const kopf = pageHead('Entdecken', 'Kaufsignale', 'Die 10 interessantesten Coins je Größenklasse nach Score von 0 bis 100. Nicht nur gehypte Coins: bewertet werden Fundament, Trend, Momentum, Einstiegssituation im Chart und Risiko, für alle Coins nach denselben Regeln. Nicht jeder Coin bekommt ein Kaufsignal. Spricht die Datenlage dagegen, steht der Grund direkt dabei. Der Analyse-Agent aktualisiert alles automatisch.');
        root.classList.add('stack');
        if (!K || !K.tiers || !K.tiers.length) {
            root.innerHTML = kopf + card({ body: empty('Noch keine Kaufsignale. Lauf python3 fetch_kaufsignale.py (oder refresh_all.py), dann neu laden.') });
            return;
        }
        window.__KS_MODELL = (K.modell || {}).saeulen || [];
        const tabs = K.tiers.map(t => [t.key, `${t.label} (${t.coins.filter(c => c.status === 'kauf').length})`]);
        root.innerHTML = kopf
            + `<div class="ks-disc">${icon('triangle-alert')}<div><b>Keine Anlageberatung.</b> Das sind Auswertungen nach festen Regeln und meine persönliche Meinung, keine Kauf- oder Verkaufsempfehlung. Ein Kaufsignal heißt nur, dass Daten, Chart und Risiko gerade zusammenpassen. Es kann trotzdem verlieren. Die Zahl in Klammern zeigt, wie viele Kaufsignale in der Klasse stehen.</div></div>`
            + frische(K) + lageKarte(K)
            + `<div class="row between wrap">${seg('kstier', tabs, st.tier)}</div>`
            + `<div id="ksBody" class="stack">${tierBody(K)}</div>`
            + listings(K) + bilanz(K) + modell(K) + mystik(K) + quellen(K);
        const body = root.querySelector('#ksBody');
        root.onclick = e => {
            const sg = e.target.closest('[data-seg="kstier"] button');
            if (sg) {
                st.tier = sg.dataset.v;
                root.querySelectorAll('[data-seg="kstier"] button').forEach(b => b.classList.toggle('on', b === sg));
                body.innerHTML = tierBody(K); hydrate(body);
                return;
            }
            const t = e.target.closest('[data-toggle]');
            if (t) {
                const id = t.dataset.toggle;
                st.offen.has(id) ? st.offen.delete(id) : st.offen.add(id);
                body.innerHTML = tierBody(K); hydrate(body);
            }
        };
    },
    destroy() { window.__KS_MODELL = null; },
};
