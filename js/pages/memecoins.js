import { D } from '../core/data.js?v=202610070601';
import { esc } from '../core/fmt.js?v=202610070601';
import { card, pageHead, seg, chip, empty, icon, icons } from '../core/ui.js?v=202610070601';

const state = { seite: 'long', chain: 'alle', sort: 'score' };

const SEITEN = [['long', 'Long Calls'], ['short', 'Short Calls'], ['exit', 'Ausstieg'], ['watchlist', 'Watchlist'], ['paper', 'Papier-Depot']];
const SORTEN = [['score', 'Nach Qualität'], ['einstieg', 'Bester Einstieg jetzt']];
const CHAINS = [['alle', 'Alle Chains'], ['solana', 'Solana'], ['base', 'Base'], ['eth', 'Ethereum'], ['robinhood', 'Robinhood']];

const z = v => String(v).replace('.', ',');
function euro(n) {
    if (n === null || n === undefined) return '?';
    if (n >= 1e9) return z((n / 1e9).toFixed(2)) + ' Mrd';
    if (n >= 1e6) return z((n / 1e6).toFixed(2)) + ' Mio';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + ' Tsd';
    return Number(n).toFixed(0);
}
function alter(h) {
    if (h === null || h === undefined) return '?';
    return h < 48 ? Math.round(h) + ' Std' : Math.round(h / 24) + ' Tage';
}
const farbe = sc => sc >= 70 ? 'var(--up)' : sc >= 50 ? 'var(--warn)' : 'var(--down)';
const FLAG = { ja: 'var(--up)', nein: 'var(--down)', roh: 'var(--warn)', '': '' };

function dexUrl(e) {
    const c = { solana: 'solana', base: 'base', eth: 'ethereum', robinhood: 'robinhood' }[e.chain] || e.chain;
    return 'https://dexscreener.com/' + encodeURIComponent(c) + '/' + encodeURIComponent(e.pool || '');
}
const stand = s => String(s || '').replace('T', ' ').slice(0, 16);
const zahlen = paare => `<div class="mc-zahlen">${paare.map(([k, v]) => `<div><span>${k}</span><b class="num">${v}</b></div>`).join('')}</div>`;
const kopf = (sym, chain, rechts) => `<div class="row between" style="align-items:flex-start;gap:12px">
    <div style="min-width:0"><div class="mc-sym">${esc(sym || '?')}</div><div class="eyebrow" style="margin-top:4px">${esc(chain)}</div></div>
    <div style="text-align:right">${rechts}</div></div>`;

function karte(e) {
    const st = e.struktur || {};
    const flags = [];
    if (e.datenlage === 'momentaufnahme') flags.push(['roh', 'nur Momentaufnahme']);
    else {
        flags.push(st.extension ? ['ja', 'Extension'] : (st.chop_zum_ath ? ['nein', 'Chop zum ATH'] : ['', 'kein Ausbruch']));
        if (st.hh && st.hl) flags.push(['ja', 'HH und HL']);
        if (st.dip) flags.push(['ja', 'rote Kerze']);
        if (st.divergenz) flags.push(['nein', 'Divergenz']);
        if (st.pullback_pct !== null && st.pullback_pct !== undefined)
            flags.push([st.pullback_pct <= 35 ? 'ja' : (st.pullback_pct > 60 ? 'nein' : ''), 'Rücksetzer ' + Math.round(st.pullback_pct) + '%']);
    }
    flags.push(e.shortbar ? ['ja', 'shortbar: ' + e.short_venue + ' bis ' + (e.short_hebel || '?') + 'x'] : ['', 'nicht shortbar']);
    if (e.social) {
        if (e.social.x_handle) flags.push(['ja', 'X vorhanden']);
        if (e.social.cto) flags.push(['ja', 'Community Takeover']);
        if (e.social.boost_aktiv > 0) flags.push(['nein', 'bezahlte Promotion']);
    }

    const klasse = e.weckruf ? ' weckruf' : (e.score >= 60 ? ' gut' : (e.score < 25 ? ' schwach' : ''));
    const zeigeEinstieg = state.sort === 'einstieg' && state.seite === 'long' && e.einstieg;
    const kopfWert = zeigeEinstieg ? e.einstieg.score : e.score;
    let h = `<div class="card sunk mc-card${klasse}">`;
    h += kopf(e.symbol, e.chain, `<div class="mc-score num" style="color:${farbe(kopfWert)}">${esc(z(kopfWert))}</div>` +
        (zeigeEinstieg ? `<div class="eyebrow" style="margin-top:2px">Qualität ${esc(z(e.score))}</div>` : ''));
    h += zahlen([['MCap', euro(e.mcap)], ['Liq', euro(e.liq)], ['Vol 24h', euro(e.vol24)], ['Alter', alter(e.alter_h)]]);
    h += `<div class="row wrap" style="gap:6px">${flags.map(f => chip(f[1], FLAG[f[0]])).join('')}</div>`;
    h += `<ul class="mc-gruende">${(e.gruende || []).slice(0, 4).map(g => {
        const kl = g.deckel ? 'warn' : (g.p > 0 ? 'up' : (g.p < 0 ? 'down' : 'dim'));
        const wert = g.deckel ? 'max' : (g.p > 0 ? '+' + z(g.p) : z(g.p));
        return `<li><span class="num ${kl}">${esc(wert)}</span><span>${esc(g.text)}</span></li>`;
    }).join('')}</ul>`;
    if (e.einstieg && state.sort === 'einstieg' && state.seite === 'long') {
        const ei = e.einstieg;
        const label = ei.typ === 'ruecksetzer' ? 'Gesunder Rücksetzer' : 'Momentum nimmt Fahrt auf';
        h += `<div class="mc-box${ei.score >= 60 ? ' stark' : ''}"><div class="row between mc-box-kopf"><span>${label}</span><b class="num">${esc(z(ei.score))}</b></div>` +
            (ei.gruende || []).map(g => `<div>${esc(g)}</div>`).join('') + '</div>';
    }
    if (e.influencer && e.influencer.tage_her !== null && e.influencer.tage_her <= 30) {
        const inf = e.influencer;
        h += `<div class="mc-box inf${inf.tage_her <= 7 ? ' frisch' : ''}">${esc(inf.namen)} hat darüber gesprochen, vor ${esc(inf.tage_her)} Tagen` +
            (inf.videos > 1 ? ' in ' + esc(inf.videos) + ' Videos' : '') + '</div>';
    }
    if (e.narrativ) {
        const nv = e.narrativ;
        h += `<div class="mc-box${nv.bewertung === 'stark' ? ' stark' : ''}"><div class="mc-box-kopf">Narrativ geprüft: ${esc(nv.kurz)}</div>` +
            (nv.belege || []).slice(0, 2).map(b => `<div>· ${esc(b)}</div>`).join('') +
            (nv.warnung ? `<div class="warn" style="margin-top:6px">Aber: ${esc(nv.warnung)}</div>` : '') + '</div>';
    }
    if (e.peak_mcap) {
        const runter = Math.round((1 - (e.mcap || 0) / e.peak_mcap) * 100);
        h += `<div class="mc-zeile">Lief auf <b>${e.peak_geschaetzt ? 'ca. ' : ''}${euro(e.peak_mcap)}</b>, steht <b>${runter}%</b> darunter</div>`;
    }
    if (e.weckruf) h += `<div class="mc-box weck">${icon('bell-ring')}<span>Weckruf: ${esc(e.weckruf.text)}</span></div>`;
    h += `<a class="mc-link" href="${esc(dexUrl(e))}" target="_blank" rel="noopener">Chart auf Dexscreener ${icon('arrow-up-right')}</a>`;
    return h + '</div>';
}

function paper() {
    const p = D.paper;
    if (!p) return { html: empty('Noch keine Daten. Bitte python3 paper_trades.py laufen lassen.'), note: '' };
    const b = p.bilanz || {}, r = p.regeln || {}, offen = p.offen || [], zu = p.geschlossen || [];
    const kachel = (k, v) => `<div class="card sunk" style="padding:16px 18px"><div class="eyebrow">${k}</div><div class="num" style="font-size:1.5rem;font-weight:300;margin-top:6px">${v}</div></div>`;
    const leer = v => v !== null && v !== undefined;
    let html = `<div class="grid g4" style="gap:12px">${kachel('Abgeschlossen', esc(b.abgeschlossen))}${kachel('Trefferquote', leer(b.trefferquote) ? esc(z(b.trefferquote)) + '%' : 'noch offen')}` +
        `${kachel('Schnitt je Trade', leer(b.schnitt_pct) ? esc(z(b.schnitt_pct)) + '%' : 'noch offen')}${kachel('Offene Positionen', offen.length)}</div>`;
    const typen = Object.keys(b.nach_typ || {});
    if (typen.length) html += `<div class="grid g-auto" style="gap:12px;margin-top:12px">${typen.map(t => {
        const d2 = b.nach_typ[t];
        return kachel((t === 'ruecksetzer' ? 'Rücksetzer' : 'Anlauf') + ' (' + esc(d2.n) + ')', esc(z(d2.quote)) + '% · ' + esc(z(d2.schnitt)) + '%');
    }).join('')}</div>`;

    const zeile = (x, istOffen) => {
        const wert = istOffen ? x.lauf_pct : x.ergebnis_pct;
        const fw = !leer(wert) ? 'var(--ink-3)' : (wert >= 0 ? 'var(--up)' : 'var(--down)');
        return `<div class="card sunk mc-card">` +
            kopf(x.symbol, x.chain, `<div class="mc-score num" style="color:${fw}">${!leer(wert) ? '?' : (wert > 0 ? '+' : '') + esc(z(wert)) + '%'}</div>`) +
            zahlen([['Einstieg', esc(z(Number(x.einstieg).toPrecision(4)))], ['Score', esc(z(x.einstiegs_score))], ['Typ', x.typ === 'ruecksetzer' ? 'Rücksetzer' : 'Anlauf']]) +
            (x.teil_raus ? `<div>${chip('Initialeinsatz raus', 'var(--warn)')}</div>` : '') +
            `<div class="mc-zeile">${istOffen ? 'Seit ' + esc(stand(x.eroeffnet)) : 'Geschlossen: ' + esc(x.grund_aus || '')}</div>` +
            (x.begruendung ? `<div class="mc-box">${esc(x.begruendung)}</div>` : '') + '</div>';
    };
    html += `<div class="eyebrow mc-abschnitt">Offen (${offen.length})</div>` +
        (offen.length ? `<div class="mc-grid">${offen.map(x => zeile(x, true)).join('')}</div>` : empty('Keine offene Position.'));
    if (zu.length) html += `<div class="eyebrow mc-abschnitt">Abgeschlossen (${esc(b.abgeschlossen)})</div><div class="mc-grid">${zu.map(x => zeile(x, false)).join('')}</div>`;
    const note = 'Fiktives Depot mit ' + esc(z(r.einsatz)) + ' USD je Position, maximal ' + esc(r.max_offen) + ' gleichzeitig. Eröffnet ab Einstiegs-Score ' + esc(z(r.einstieg_min)) +
        '. Initialeinsatz raus bei ' + esc(z(r.teil_bei)) + 'x, Stop bei ' + esc(z(r.stop_pct)) + ' Prozent, Trailing ' + esc(z(r.trail_pct)) + ' Prozent unter dem Hoch, Zeitstopp nach ' +
        esc(z(r.max_stunden / 24)) + ' Tagen. Kein echtes Geld. Der Zweck ist zu messen, ob die Bewertung trägt, bevor du selbst welches einsetzt.';
    return { html, note };
}

function inhalt() {
    const d = D.memecoins, a = d.anzahl || {};
    const zeilen = [seg('mcSeite', SEITEN, state.seite)];
    let html, note;
    if (state.seite === 'paper') {
        ({ html, note } = paper());
    } else {
        zeilen.push(seg('mcChain', CHAINS, state.chain));
        if (state.seite === 'long') zeilen.push(seg('mcSort', SORTEN, state.sort));
        let liste = (d[state.seite] || []).filter(e => state.chain === 'alle' || e.chain === state.chain);
        if (state.sort === 'einstieg' && state.seite === 'long')
            liste = liste.slice().sort((x, y) => ((y.einstieg && y.einstieg.score) || 0) - ((x.einstieg && x.einstieg.score) || 0));
        html = liste.length ? `<div class="mc-grid">${liste.map(karte).join('')}</div>` : empty('Für diese Auswahl gibt es gerade kein Signal.');
        if (state.seite === 'short') note = 'Short-Kandidaten sind ausschließlich Coins mit echtem Perp-Markt. Aktuell ' + esc(a.shortbar) + ' von ' + esc(a.gesamt) + ' Pools.';
        else if (state.seite === 'watchlist') note = 'Coins, die einmal gelaufen und dann mindestens 60 Prozent gefallen sind. Wer sie auf der Liste hat, sieht einen erneuten Ausbruch Tage vor den Tradern, die nur neue Coins ansehen. Ein Weckruf braucht zwei Belege: Volumen deutlich über Tagestempo und steigender Kurs.';
        else if (state.seite === 'exit') note = 'Diese Coins sind schwach, aber nicht shortbar. Die einzige Konsequenz ist reduzieren oder rausgehen.';
        else {
            const mom = (d.long || []).filter(x => x.datenlage === 'momentaufnahme');
            const max = mom.length ? Math.max(...mom.map(x => x.score)) : 0;
            note = 'Coins mit dem Hinweis "nur Momentaufnahme" sind gedeckelt, aktuell bei ' + esc(z(max)) + ', ihre Chartstruktur wurde noch nicht geprüft. ' +
                esc(a.mit_struktur) + ' von ' + esc(a.gesamt) + ' Pools sind vollständig geprüft.';
        }
    }
    return `<div class="stack filterleiste" style="gap:12px;margin-bottom:22px">${zeilen.map(x => `<div>${x}</div>`).join('')}</div>${html}` +
        (note ? `<p class="sub mc-note">${note}</p>` : '');
}

export default {
    styles: `
        .mc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
        .mc-card { padding: 20px; display: flex; flex-direction: column; gap: 14px; border: 1px solid transparent; transition: transform .3s var(--ease), border-color .3s var(--ease); }
        .mc-card:hover { transform: translateY(-2px); }
        .mc-card.gut { border-color: color-mix(in srgb, var(--up) 35%, transparent); }
        .mc-card.schwach { opacity: .72; }
        .mc-card.weckruf { border-color: color-mix(in srgb, var(--warn) 60%, transparent); background: color-mix(in srgb, var(--warn) 7%, var(--bg)); }
        .mc-sym { font-size: 1.15rem; font-weight: 500; overflow-wrap: anywhere; }
        .mc-score { font-size: 2rem; font-weight: 300; line-height: 1; }
        .mc-zahlen { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 14px; font-size: .8rem; }
        .mc-zahlen > div { display: flex; justify-content: space-between; gap: 8px; }
        .mc-zahlen span { color: var(--ink-3); }
        .mc-zahlen b { font-weight: 500; }
        .mc-gruende { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; font-size: .82rem; color: var(--ink-2); }
        .mc-gruende li { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 8px; }
        .mc-gruende li span:first-child { text-align: right; font-size: .76rem; }
        .mc-box { padding: 12px 14px; border-radius: var(--r-sm); background: color-mix(in srgb, var(--ink-3) 10%, transparent); font-size: .8rem; color: var(--ink-2); line-height: 1.45; }
        .mc-box.stark { background: color-mix(in srgb, var(--up) 12%, transparent); }
        .mc-box.inf { background: color-mix(in srgb, var(--a2) 12%, transparent); }
        .mc-box.inf.frisch { background: color-mix(in srgb, var(--a2) 22%, transparent); color: var(--ink); }
        .mc-box.weck { display: flex; gap: 10px; align-items: flex-start; background: color-mix(in srgb, var(--warn) 18%, transparent); color: var(--ink); }
        .mc-box.weck svg { width: 16px; height: 16px; flex: none; color: var(--warn); margin-top: 2px; }
        .mc-box-kopf { font-weight: 500; color: var(--ink); margin-bottom: 4px; }
        .mc-zeile { font-size: .8rem; color: var(--ink-2); }
        .mc-zeile b { color: var(--ink); font-weight: 500; }
        .mc-link { margin-top: auto; display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: .66rem; letter-spacing: .1em; text-transform: uppercase; color: var(--pg); transition: gap .25s var(--ease); }
        .mc-link:hover { gap: 10px; }
        .mc-link svg { width: 13px; height: 13px; }
        .mc-abschnitt { margin: 26px 0 12px; }
        .mc-note { margin: 22px 0 0; font-size: .84rem; }
        @media (max-width: 860px) { .mc-grid { grid-template-columns: minmax(0, 1fr); } }`,
    render(root) {
        const d = D.memecoins;
        root.classList.add('stack');
        const sub = 'Pools von Solana, Base, Ethereum und Robinhood, bewertet nach 11 Chartregeln. Entscheidend sind Extension statt Chop, flache Rücksetzer, steigendes Volumen und ein Einstieg im Dip statt im Ausbruch. Kleine Marktkapitalisierung zählt positiv, weil der Weg zum Vielfachen kürzer ist. <strong>Shorten geht nur dort, wo es einen echten Perp-Markt gibt.</strong> Alles andere läuft über AMM-Pools und ist nicht shortbar, deshalb steht dort Ausstieg statt Short.';
        if (!d) {
            root.innerHTML = pageHead('Entdecken', 'Memecoin-Radar', sub) +
                card({ body: empty('Noch keine Daten. Bitte python3 fetch_memecoins.py und python3 compute_memecoin_signals.py laufen lassen.') });
            return;
        }
        const a = d.anzahl || {};
        root.innerHTML = pageHead('Entdecken', 'Memecoin-Radar', sub, `<span class="eyebrow">Stand ${esc(stand(d.stand))}</span>`) +
            `<div class="row wrap" style="gap:8px">${chip(a.gesamt + ' Pools')}${chip(a.mit_struktur + ' mit geprüfter Chartstruktur', 'var(--up)')}${chip(a.shortbar + ' shortbar', 'var(--a2)')}</div>` +
            card({ body: `<div id="mcBody">${inhalt()}</div>` });
        const body = root.querySelector('#mcBody');
        const FELD = { mcSeite: 'seite', mcChain: 'chain', mcSort: 'sort' };
        body.onclick = e => {
            const b = e.target.closest('[data-seg] button'); if (!b) return;
            const feld = FELD[b.parentElement.dataset.seg]; if (!feld) return;
            state[feld] = b.dataset.v;
            body.innerHTML = inhalt(); icons(body);
        };
    },
};
