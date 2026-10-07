import { esc, fUsd, fBig, fPct, cls, ago } from '../core/fmt.js?v=202610071831';
import { card, pageHead, ring, bar, chip, seg, icon, empty, hydrate, scoreVar } from '../core/ui.js?v=202610071831';

let kette = 'alle';
let einstieg = 'alle';      // 'alle' = alle Signale wie bisher, 'gut' = nur gute Einstiege

export function einstiegsCheck(x) {
    const c = x.chg || {}, ch = x.chart || {}, abst = ch.unter_lokalem_hoch_pct, crv = (ch.plan || {}).crv;
    if (abst != null && abst < 6) return { gut: false, grund: 'Steht fast am lokalen Hoch' };
    if ((c.h1 || 0) > 8) return { gut: false, grund: 'Läuft gerade senkrecht, plus ' + Math.round(c.h1) + ' Prozent in 1 Stunde' };
    if ((c.h24 || 0) > 150) return { gut: false, grund: 'Großteil der Bewegung schon gelaufen' };
    if (crv != null && crv < 1.3) return { gut: false, grund: 'Chance zu Risiko zu knapp' };
    if (abst != null && abst >= 8) return { gut: true, grund: Math.round(abst) + ' Prozent unter dem lokalen Hoch' + (crv != null ? ', Chance zu Risiko ' + String(crv).replace('.', ',') : '') };
    if (abst == null && (c.h1 || 0) <= 2 && (c.h6 || 0) <= 25) return { gut: true, grund: 'Kein frischer Anstieg, ruhige letzte Stunde' };
    return { gut: false, grund: 'Kein klarer Rücksetzer erkennbar' };
}
const daten = () => window.TAGESSIGNALE_DATA || null;
const de = (v, d = 1) => v == null ? '?' : Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const ts = s => s ? Date.parse(s) / 1000 : null;
const alter = h => h == null ? 'unbekannt' : h < 48 ? de(h, 0) + ' Std' : de(h / 24, 0) + ' Tage';
const STUFE = { stark: ['Starkes Signal', 'var(--up)'], solide: ['Solides Signal', 'var(--a2)'], beobachten: ['Beobachten', 'var(--warn)'] };
const KETTE = { solana: 'Solana', base: 'Base', bsc: 'BNB Chain', robinhood: 'Robinhood', monad: 'Monad' };
const KETTE_FARBE = { solana: 'var(--a2)', base: 'var(--a1)', bsc: 'var(--warn)', robinhood: 'var(--up)', monad: 'var(--a4)' };
const URTEIL = { 'bestanden': 'var(--up)', 'mit Vorbehalt': 'var(--warn)', 'durchgefallen': 'var(--down)', 'ungeprüft': 'var(--ink-3)' };

function trichter(d) {
    const zeile = c => {
        const s = d.stats[c] || {};
        const st = [['Gesammelt', s.kandidaten], ['Mit Marktdaten', s.mit_daten], ['Durch den Filter', s.durch_filter], ['Vertrag geprüft', s.sicherheit_geprueft], ['Signale', s.signale]];
        return `<div class="ts-fz"><div class="ts-fk"><b>${esc(d.chains[c])}</b></div>${st.map(([k, v], i) =>
            `<div class="ts-fs ${i === st.length - 1 ? 'ziel' : ''}"><div class="num">${v ?? 0}</div><div class="eyebrow">${k}</div></div>${i < st.length - 1 ? `<span class="ts-fp">${icon('chevron-right')}</span>` : ''}`).join('')}</div>`;
    };
    return card({ eyebrow: 'So wurde geprüft', title: 'Vom Kandidaten zum Signal', right: chip('Stand ' + ago(ts(d.stand)), 'var(--up)'),
        body: `<p class="sub" style="margin:0 0 18px">Kandidaten kommen aus DexScreener, GeckoTerminal, dem Memecoin-Sammler und aus den KOL-Käufen von MadeOnSol (Solana). Jeder Coin durchläuft Marktdaten, harte Filter, einen Score aus 8 Bausteinen und eine eigene Kerzenprüfung. Dazu kommt die Käuferbreite: wie viele verschiedene Wallets kaufen gegen wie viele verkaufen, mit Bot-Verdacht, wenn wenige Wallets sehr oft kaufen. Smart Money: für Solana über MadeOnSol (wer kauft, wer steigt aus), für alle Chains zusätzlich StalkChain (welche getrackten Trader halten, mit wie viel Geld und Followern, verkaufen sie gerade). Zum Schluss die Vertragsprüfung, RugCheck für Solana und GoPlus für die anderen Chains, inklusive Halter-Fluss: wächst die Zahl der Halter oder laufen sie weg. Ohne bestandene Prüfung gibt es kein Signal, und steigen die KOLs gerade aus, auch nicht.</p>
        ${Object.keys(d.chains).map(zeile).join('')}` });
}

function stalkKarte(x) {
    const k = x.stalk;
    if (!k || !k.halter) return '';
    const n = v => v == null ? '?' : Number(v).toLocaleString('de-DE');
    const farbe = (k.verkauf_anteil || 0) >= 0.5 ? 'var(--down)' : 'var(--up)';
    const z = (l, v) => `<div><div class="eyebrow">${l}</div><div class="num">${v}</div></div>`;
    return `<div class="card sunk ts-sm" style="--c:${farbe}">
        <div class="row between"><div class="row" style="gap:8px"><span class="ts-sm-ico">${icon('radar')}</span><b style="font-weight:500">${(k.verkauf_anteil || 0) >= 0.5 ? 'Getrackte Trader verkaufen' : 'Getrackte Trader halten'}</b></div><span class="eyebrow">StalkChain</span></div>
        <div class="ts-sm-kz">${z('Trader', n(k.halter))}${z('Halten zusammen', '$' + n(k.smart_wert_usd))}${z('Follower', n(k.follower_gesamt))}${z('Im Plus', k.winrate_kaeufer != null ? k.winrate_kaeufer + '%' : '?')}</div>
        ${(k.namen || []).length ? `<div class="sub" style="font-size:.76rem;margin:10px 0 0">Größte Namen: ${k.namen.map(esc).join(', ')}</div>` : ''}
    </div>`;
}

function smartMoney(x) {
    const k = x.kol;
    if (!k) return stalkKarte(x);
    const farbe = k.ausstieg ? 'var(--down)' : k.bestaetigt ? 'var(--up)' : 'var(--ink-3)';
    const titel = k.ausstieg ? 'KOLs steigen aus' : k.bestaetigt ? 'Von Smart Money bestätigt' : 'Kaum KOL-Aktivität';
    const z = (l, v) => `<div><div class="eyebrow">${l}</div><div class="num">${v}</div></div>`;
    return `<div class="card sunk ts-sm" style="--c:${farbe}">
        <div class="row between"><div class="row" style="gap:8px"><span class="ts-sm-ico">${icon(k.ausstieg ? 'log-out' : 'users')}</span><b style="font-weight:500">${titel}</b></div><span class="eyebrow">${esc(k.quelle || 'MadeOnSol')}</span></div>
        <div class="ts-sm-kz">${z('Gekauft 24h', k.kauf_24h ?? 0)}${z('Verkauft 24h', k.verkauf_24h ?? 0)}${z('Top-KOLs halten', k.top_halter ?? 0)}${k.verkauf_anteil != null ? z('Heute verkauft', de(k.verkauf_anteil * 100, 0) + '%') : z('Käufer-Qualität', k.kaeufer_score != null ? k.kaeufer_score : '?')}</div>
        ${(k.namen || []).length ? `<div class="sub" style="font-size:.76rem;margin:10px 0 0">Gekauft zuletzt: ${k.namen.map(esc).join(', ')}</div>` : ''}
    </div>`;
}

function kerzenSvg(reihe, plan) {
    if (!reihe || reihe.length < 5) return '';
    const W = 360, H = 130, n = reihe.length, schritt = W / n;
    const lv = plan ? [plan.stop, plan.ziel1, plan.stuetze].filter(v => v > 0) : [];
    let lo = Math.min(...reihe.map(k => k[3]), ...lv), hi = Math.max(...reihe.map(k => k[2]), ...lv);
    const pad = (hi - lo) * 0.06 || hi * 0.05; lo -= pad; hi += pad;
    const y = v => (H - (v - lo) / (hi - lo) * H).toFixed(1);
    const vmax = Math.max(...reihe.map(k => k[5] || 0)) || 1;
    const kerzen = reihe.map((k, i) => {
        const [, o, h, l, c, v] = k, x = i * schritt + schritt / 2, auf = c >= o;
        const top = y(Math.max(o, c)), hoehe = Math.max(0.8, y(Math.min(o, c)) - top);
        return `<rect class="kv" x="${(x - schritt * .35).toFixed(1)}" y="${(H - (v || 0) / vmax * H * .22).toFixed(1)}" width="${(schritt * .7).toFixed(1)}" height="${((v || 0) / vmax * H * .22).toFixed(1)}"/>`
            + `<line class="${auf ? 'ku' : 'kd'}" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${y(h)}" y2="${y(l)}"/>`
            + `<rect class="${auf ? 'ku' : 'kd'}" x="${(x - schritt * .32).toFixed(1)}" y="${top}" width="${(schritt * .64).toFixed(1)}" height="${hoehe.toFixed(1)}"/>`;
    }).join('');
    const linie = (v, c) => v > 0 ? `<line class="kl ${c}" x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}"/>` : '';
    return `<svg class="ts-kc" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Kerzenchart">${kerzen}${plan ? linie(plan.stuetze, 'st') + linie(plan.stop, 'sp') + linie(plan.ziel1, 'z1') : ''}</svg>`;
}

function chartAnalyse(x) {
    const a = x.chart;
    if (!a || !a.analyse) return '';
    const p = a.plan || {}, farbe = scoreVar(a.score);
    const kz = (k, v, c) => `<div><div class="eyebrow">${k}</div><div class="num" style="${c ? 'color:' + c : ''}">${v}</div></div>`;
    return `<div class="card sunk ts-ca">
        <div class="row between" style="gap:10px"><div class="row" style="gap:8px;min-width:0"><span class="ts-sm-ico" style="--c:${farbe}">${icon('candlestick-chart')}</span><b style="font-weight:500">Chart-Analyse</b>${chip(a.fazit + ' · ' + de(a.score, 0), farbe)}</div>
            <span class="eyebrow ts-ca-n" title="Quelle ${esc(a.quelle || '')}">${(a.reihe || []).length} ${esc(a.tf === 'hour' ? 'Std-Kerzen' : '15-Min-Kerzen')}</span></div>
        ${kerzenSvg(a.reihe, p)}
        <div class="ts-leg"><span class="st">Unterstützung</span><span class="sp">Stop</span><span class="z1">Ziel 1</span></div>
        <div class="ts-sm-kz">${kz('Stop', p.stop_pct != null ? fPct(p.stop_pct) : '?', 'var(--down)')}${kz('Ziel 1', p.ziel1_pct != null ? fPct(p.ziel1_pct) : 'am Hoch', 'var(--up)')}${kz('Ziel 2', p.ziel2_pct != null ? fPct(p.ziel2_pct) : '—', 'var(--up)')}${kz('Chance/Risiko', p.crv != null ? de(p.crv) + ' : 1' : '?', p.crv >= 2 ? 'var(--up)' : p.crv != null && p.crv < 1.2 ? 'var(--down)' : '')}</div>
        <details class="ts-d" style="margin-top:12px"><summary>${icon('file-text')}<span>Analyse in Worten, ${esc(a.zeitraum || '')}</span>${icon('chevron-down')}</summary>
            <div class="ts-at">${a.analyse.map(t => `<p>${esc(t)}</p>`).join('')}
            <p class="dim" style="font-size:.72rem">Regelbasiert aus den Kerzen gerechnet (Struktur, Rücksetzer, Volumen, Swing-Hochs und Tiefs). Keine Vorhersage, keine Anlageberatung.</p></div></details>
    </div>`;
}

function kurzChips(x) {
    const s = x.sicherheit || {}, k = x.kol, g = (x.gruende || []).length, w = (x.warnungen || []).length;
    return [
        s.urteil ? chip('Vertrag ' + s.urteil, URTEIL[s.urteil]) : '',
        k ? chip(k.ausstieg ? 'KOLs steigen aus' : k.bestaetigt ? 'Smart Money kauft' : 'Kaum KOLs', k.ausstieg ? 'var(--down)' : k.bestaetigt ? 'var(--up)' : '') : '',
        x.stalk && x.stalk.halter ? chip(x.stalk.halter + ' Trader halten', (x.stalk.verkauf_anteil || 0) >= 0.5 ? 'var(--down)' : 'var(--up)') : '',
        x.kaeufer && x.kaeufer.h6 && (x.kaeufer.h6.buyers + x.kaeufer.h6.sellers) >= 20 ? chip(x.kaeufer.h6.buyers + ' Käufer · ' + x.kaeufer.h6.sellers + ' Verkäufer 6h', x.kaeufer.h6.buyers >= x.kaeufer.h6.sellers ? 'var(--up)' : 'var(--down)') : '',
        x.halter_fluss ? chip('Halter ' + (x.halter_fluss.pct > 0 ? '+' : '') + de(x.halter_fluss.pct, 0) + '% in ' + x.halter_fluss.stunden + 'h', x.halter_fluss.pct >= 0 ? 'var(--up)' : 'var(--down)') : '',
        g ? chip(g + (g === 1 ? ' Grund' : ' Gründe'), 'var(--up)') : '',
        w ? chip(w + (w === 1 ? ' Warnung' : ' Warnungen'), 'var(--warn)') : '',
    ].join('') + (w ? `<div class="ts-w1">${icon('triangle-alert')}<span>${esc(x.warnungen[0])}</span></div>` : '');
}

function karte(x) {
    const [stText, stFarbe] = STUFE[x.stufe] || STUFE.solide, s = x.sicherheit || {}, c = x.chg || {};
    const kz = (k, v) => `<div><div class="eyebrow">${k}</div><div class="num">${v}</div></div>`;
    const seit = x.preis_signal && x.signal_seit && Math.abs(x.preis / x.preis_signal - 1) > 0.002
        ? `<div class="ts-seit">Signal ${ago(ts(x.signal_seit))} bei ${fUsd(x.preis_signal)}, seitdem <b class="${cls(x.preis / x.preis_signal - 1)}">${fPct((x.preis / x.preis_signal - 1) * 100)}</b></div>` : '';
    const lk = x.links || {};
    return `<article class="card ts-k ${x.stufe === 'beobachten' ? 'ts-warten' : ''}">
        <div class="row between" style="align-items:flex-start">
            <div class="row" style="min-width:0">${x.img ? `<img class="coin-img" style="width:46px;height:46px" src="${esc(x.img)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : `<span class="ico-b" style="width:46px;height:46px">${icon('coins')}</span>`}
                <div style="min-width:0"><div class="h2" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.symbol)}</div><div class="sb dim" style="font-size:.76rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.name)}</div>
                <div class="row wrap" style="gap:6px;margin-top:8px">${chip(KETTE[x.chain] || x.chain, KETTE_FARBE[x.chain] || 'var(--ink-2)')}${chip(stText, stFarbe)}${(() => { const e = einstiegsCheck(x); return `<span title="${esc(e.grund)}">${chip(e.gut ? 'Guter Einstieg' : 'Nicht am Top kaufen', e.gut ? 'var(--up)' : 'var(--warn)')}</span>`; })()}</div></div></div>
            ${ring(x.score, 'Score', 92)}
        </div>
        <div class="ts-kz">${kz('Kurs', fUsd(x.preis))}${kz('Marktkap.', fBig(x.mcap))}${kz('Liquidität', fBig(x.liq))}${kz('Volumen 24h', fBig(x.vol24))}${kz('Alter', alter(x.alter_h))}${kz('Käufe 6h', x.kaufanteil6 != null ? de(x.kaufanteil6, 0) + '%' : '?')}</div>
        <div class="row wrap" style="gap:6px">${[['5 Min', c.m5], ['1 Std', c.h1], ['6 Std', c.h6], ['24 Std', c.h24]].map(([k, v]) => chip(k + ' ' + fPct(v), v >= 0 ? 'var(--up)' : 'var(--down)')).join('')}</div>
        <div class="card sunk ts-ein"><span class="ico-b">${icon(x.stufe === 'beobachten' ? 'hourglass' : 'crosshair')}</span><div><div class="eyebrow">Einstieg</div><div>${esc(x.einstieg)}</div>${seit}</div></div>
        ${chartAnalyse(x)}
        <div class="row wrap ts-kurz">${kurzChips(x)}</div>
        <details class="ts-d ts-mehr"><summary>${icon('list')}<span>Alle Details: Smart Money, Gründe, Warnungen, Vertrag, Score</span>${icon('chevron-down')}</summary>
        <div class="stack" style="gap:14px;margin-top:14px">
            ${smartMoney(x)}${x.kol ? stalkKarte(x) : ''}
            ${(x.gruende || []).length ? `<ul class="ts-l up">${x.gruende.map(g => `<li>${icon('check')}<span>${esc(g)}</span></li>`).join('')}</ul>` : ''}
            ${(x.warnungen || []).length ? `<ul class="ts-l warn">${x.warnungen.map(g => `<li>${icon('triangle-alert')}<span>${esc(g)}</span></li>`).join('')}</ul>` : ''}
            <details class="ts-d"><summary>${icon('shield-check')}<span>Vertragsprüfung: <b style="color:${URTEIL[s.urteil] || 'var(--ink-2)'}">${esc(s.urteil || 'ungeprüft')}</b> · ${esc(s.quelle || '')}</span>${icon('chevron-down')}</summary>
                <div class="sub" style="font-size:.82rem;margin:10px 0 0">${esc(s.text || '')}</div>
                ${(s.punkte || []).map(p => `<div class="ts-p"><span class="chip" style="--c:${p.stufe === 'danger' ? 'var(--down)' : 'var(--warn)'}">${p.stufe === 'danger' ? 'Risiko' : 'Hinweis'}</span><span>${esc(p.name)}${p.wert ? ' · ' + esc(p.wert) : ''}</span></div>`).join('')}
                <div class="row wrap mono dim" style="gap:14px;font-size:.72rem;margin-top:10px">${s.lp_gesperrt_pct != null ? `<span>LP gesperrt ${de(s.lp_gesperrt_pct, 0)}%</span>` : ''}${s.halter ? `<span>${de(s.halter, 0)} Halter</span>` : ''}${s.top10_pct ? `<span>Top 10 halten ${de(s.top10_pct, 0)}%</span>` : ''}</div></details>
            <details class="ts-d"><summary>${icon('bar-chart-3')}<span>Score im Detail${x.chart ? ` · Kerzenprüfung ${de(x.chart.score, 0)} von 100` : ' · ohne Kerzenprüfung'}</span>${icon('chevron-down')}</summary>
                <div class="stack" style="gap:10px;margin-top:12px">${Object.keys(x.teile || {}).map(k => { const max = (x.teile_max || {})[k] || 15, v = x.teile[k];
                    return `<div><div class="row between" style="font-size:.78rem;margin-bottom:5px"><span class="dim">${esc(k)}</span><span class="num">${de(v)} von ${max}</span></div>${bar(v / max * 100, scoreVar(v / max * 100))}</div>`; }).join('')}</div>
                <div class="sub" style="font-size:.74rem;margin-top:12px">Gefunden über: ${esc((x.quellen || []).join(', '))}${x.chart && x.chart.narrativ ? '. Narrativ: ' + esc(x.chart.narrativ) : ''}</div></details>
        </div></details>
        <div class="row wrap" style="gap:8px;margin-top:auto">
            <a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener">${icon('external-link')}DexScreener</a>
            ${lk.x ? `<a class="btn soft" href="${esc(lk.x)}" target="_blank" rel="noopener">X</a>` : ''}${lk.telegram ? `<a class="btn soft" href="${esc(lk.telegram)}" target="_blank" rel="noopener">Telegram</a>` : ''}${lk.web ? `<a class="btn soft" href="${esc(lk.web)}" target="_blank" rel="noopener">Website</a>` : ''}
            <button class="btn soft" data-kopie="${esc(x.token)}" title="Vertragsadresse kopieren">${icon('copy')}CA</button>
        </div></article>`;
}

function kolStatus(d) {
    const sk = d.stalk_status;
    const n = v => v == null ? '?' : Number(v).toLocaleString('de-DE');
    const stalk = !sk || !sk.schluessel ? ''
        : sk.fehler ? card({ cls: 'flat', body: `<div class="row" style="gap:10px;color:var(--down);font-size:.86rem">${icon('key-round')}<span>StalkChain aus: ${esc(sk.fehler)}</span></div>` })
        : card({ cls: 'flat', body: `<div class="row wrap" style="gap:10px 16px;font-size:.84rem">${icon('wallet')}<b style="font-weight:500">StalkChain</b>
            <span class="dim">Automatik diesen Monat ${n(sk.monat_verbraucht)} von ${n(sk.monats_budget)} Credits</span>
            ${sk.credits_rest != null ? `<span class="dim">Guthaben ${n(sk.credits_rest)}, Reserve ${n(sk.reserve)} bleibt für dich</span>` : ''}
            ${sk.hinweis ? `<span style="color:var(--warn)">${esc(sk.hinweis)}</span>` : ''}</div>` });
    return stalk + kolStatusSol(d);
}

function kolStatusSol(d) {
    const st = d.kol_status;
    if (!st || !st.schluessel) return '';
    if (st.fehler) return card({ cls: 'flat', body: `<div class="row" style="gap:10px;color:var(--down);font-size:.86rem">${icon('key-round')}<span>Smart Money aus: ${esc(st.fehler)}</span></div>` });
    if (st.tage_bis_ablauf != null && st.tage_bis_ablauf <= 5)
        return card({ cls: 'flat', body: `<div class="row" style="gap:10px;color:var(--warn);font-size:.86rem">${icon('key-round')}<span>Der kostenlose MadeOnSol-Schlüssel läuft ${st.tage_bis_ablauf <= 0 ? 'heute' : 'in ' + st.tage_bis_ablauf + (st.tage_bis_ablauf === 1 ? ' Tag' : ' Tagen')} ab. Auf madeonsol.com/developer mit einem Klick erneuern und in madeonsol_key.txt eintragen.</span></div>` });
    return '';
}

function kolMarkt(d) {
    const m = (d.kol_markt || []);
    if (!m.length || (kette !== 'alle' && kette !== 'solana')) return '';
    return card({ eyebrow: 'Smart Money live', title: 'Was KOLs gerade kaufen', right: chip('ungeprüft', 'var(--warn)'),
        body: `<p class="sub" style="margin:0 0 14px">Coins, bei denen mehrere KOL-Wallets in den letzten Stunden gekauft haben. Das ist nur der Rohstoff: was davon die 4 Stufen besteht, steht oben als Signal. Oft sind diese Coins erst Minuten alt und fallen deshalb noch durch die Filter.</p>
        <div class="list">${m.slice(0, 10).map(x => `<a class="li" style="grid-template-columns:minmax(0,1fr) auto" href="https://dexscreener.com/solana/${esc(x.mint)}" target="_blank" rel="noopener">
            <div><div class="nm">${esc(x.symbol || x.mint.slice(0, 6))}</div><div class="sb">${esc(x.quelle || '')}${x.beschleunigung ? ' · Tempo ' + de(x.beschleunigung, 1) + 'x' : ''}${x.winrate ? ' · Trefferquote ' + de(x.winrate, 0) + '%' : ''}</div></div>
            <div class="val"><span>${x.kols || 0} KOLs</span><span class="${cls(x.netto_sol)}" style="min-width:74px">${x.netto_sol != null ? (x.netto_sol > 0 ? '+' : '') + de(x.netto_sol, 0) + ' SOL' : ''}</span></div></a>`).join('')}</div>` });
}

function liste(d) {
    const ketten = Object.keys(d.chains).filter(c => kette === 'alle' || c === kette);
    const filt = x => einstieg === 'alle' || einstiegsCheck(x).gut;
    const sig = ketten.flatMap(c => (d.ergebnis[c] || {}).signale || []).filter(filt).sort((a, b) => b.score - a.score);
    const beo = ketten.flatMap(c => (d.ergebnis[c] || {}).beobachten || []).filter(filt).sort((a, b) => b.score - a.score);
    const abg = ketten.flatMap(c => ((d.ergebnis[c] || {}).abgelehnt || []).map(a => ({ ...a, chain: c })));
    const nae = ketten.flatMap(c => ((d.ergebnis[c] || {}).naechste || []).map(a => ({ ...a, chain: c }))).sort((a, b) => b.score - a.score).slice(0, 10);
    const aus = {};
    ketten.forEach(c => Object.entries((d.stats[c] || {}).ausschluss || {}).forEach(([k, v]) => { aus[k] = (aus[k] || 0) + v; }));
    const ausArr = Object.entries(aus).sort((a, b) => b[1] - a[1]), ausMax = ausArr.length ? ausArr[0][1] : 1;
    return `<div class="ts-sec"><div class="eyebrow">Signale heute</div><span class="eyebrow">${sig.length} ${sig.length === 1 ? 'Coin' : 'Coins'}</span></div>
        ${sig.length ? `<div class="ts-grid">${sig.map(karte).join('')}</div>` : card({ cls: 'tint', body: empty(einstieg === 'gut' ? 'Gerade kein Signal mit gutem Einstieg. Alle stehen nah am Hoch oder laufen schon. Geduld, der Rücksetzer kommt meistens.' : 'Heute hat kein Coin alle 4 Stufen bestanden. Kein Signal ist auch eine Aussage: lieber nichts kaufen als etwas Halbgares.') })}
        ${beo.length ? `<div class="ts-sec"><div class="eyebrow" style="color:var(--warn)">Geprüft, aber noch kein Einstieg</div><span class="eyebrow">${beo.length}</span></div><div class="ts-grid">${beo.map(karte).join('')}</div>` : ''}
        ${kolMarkt(d)}
        <div class="grid g2">
            ${card({ eyebrow: 'Warum Coins rausgeflogen sind', body: ausArr.length ? `<div class="stack" style="gap:11px">${ausArr.map(([k, v]) => `<div><div class="row between" style="font-size:.82rem;margin-bottom:5px"><span>${esc(k)}</span><span class="num dim">${v}</span></div>${bar(v / ausMax * 100, 'var(--ink-3)')}</div>`).join('')}</div>` : empty('Keine Ausschlüsse.') })}
            ${card({ eyebrow: 'Nach der Vertragsprüfung abgelehnt', body: (abg.length ? `<div class="list">${abg.map(a => `<a class="li" style="grid-template-columns:minmax(0,1fr) auto" href="${esc(a.url)}" target="_blank" rel="noopener"><div><div class="nm">${esc(a.symbol)} <span class="dim" style="font-weight:400">${esc(d.chains[a.chain])}</span></div><div class="sb" style="white-space:normal;font-family:var(--font)">${esc(a.grund)}</div></div><div class="val">${chip(a.urteil, URTEIL[a.urteil])}</div></a>`).join('')}</div>` : empty('Kein Coin ist an der Vertragsprüfung gescheitert.')) +
                (nae.length ? `<div class="eyebrow" style="margin:18px 0 10px">Knapp dahinter, noch nicht vertragsgeprüft</div><div class="row wrap" style="gap:6px">${nae.map(a => `<a class="chip" href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.symbol)} ${de(a.score, 0)}</a>`).join('')}</div>` : '') })}
        </div>`;
}

let tbFilter = 'alle', tbOffen = null;
const usd = v => v == null ? '?' : (v < 0 ? '-' : '') + '$' + Number(Math.abs(v)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dauer = h => h == null ? '?' : h < 1 ? de(h * 60, 0) + ' Min' : h < 48 ? de(h, h < 10 ? 1 : 0) + ' Std' : de(h / 24, 1) + ' Tage';
const datumZeit = s => { const t = new Date(s); return t.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' + t.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); };

function verlauf(e, w = 150, h = 44) {
    const a = e.serie || [];
    if (a.length < 2) return '<span class="dim mono" style="font-size:.7rem">misst noch</span>';
    const mx = Math.max(...a, 1), mn = Math.min(...a, 1), sp = mx - mn || 1;
    const y = v => (h - 4 - (v - mn) / sp * (h - 8)).toFixed(1), x = i => (i / (a.length - 1) * w).toFixed(1);
    const top = a.indexOf(mx), col = (e.jetzt_pct || 0) >= 0 ? 'var(--up)' : 'var(--down)';
    return `<svg class="tb-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <line x1="0" x2="${w}" y1="${y(1)}" y2="${y(1)}" class="tb-null"/>
        <path d="M${a.map((v, i) => x(i) + ',' + y(v)).join(' L')}" stroke="${col}"/>
        ${mx > 1.001 ? `<circle cx="${x(top)}" cy="${y(mx)}" r="3.2" class="tb-top"/>` : ''}</svg>`;
}

function tbBilanz(b) {
    if (!b) return `<div class="card sunk" style="padding:18px"><div class="sub" style="margin:0">Die Bilanz beginnt, sobald das erste Signal mindestens 1 Stunde alt und gemessen ist.</div></div>`;
    const k = (l, v, sub, farbe) => `<div class="card sunk tb-kpi"><div class="eyebrow">${l}</div><div class="num tb-kv" ${farbe ? `style="color:${farbe}"` : ''}>${v}</div>${sub ? `<div class="tb-ks">${sub}</div>` : ''}</div>`;
    const g = (w, e) => w - e;
    return `<div class="tb-drei">
        ${[['Perfekter Ausstieg', 'Verkauf genau am Hoch nach dem Signal', b.wert_perfekt, b.schnitt_max_pct, 'var(--up)'],
           ['Regel-Ausstieg', `Trailing-Stop ${de(b.trail_pct, 0)} Prozent unter dem Hoch`, b.wert_regel, b.schnitt_regel_pct, 'var(--a2)'],
           ['Gehalten bis jetzt', 'Kein Verkauf, aktueller Kurs', b.wert_jetzt, b.schnitt_jetzt_pct, 'var(--ink-2)']].map(([t, sub, wert, pct, farbe]) =>
            `<div class="card tb-weg" style="--c:${farbe}"><div class="eyebrow">${t}</div><div class="tb-wsub">${sub}</div>
                <div class="big num" style="margin-top:14px">${usd(wert)}</div>
                <div class="row" style="gap:10px;margin-top:8px"><span class="num ${cls(g(wert, b.summe_einsatz))}">${g(wert, b.summe_einsatz) >= 0 ? '+' : ''}${usd(g(wert, b.summe_einsatz)).replace('$-', '-$')}</span><span class="dim" style="font-size:.78rem">Ø ${fPct(pct)} je Signal</span></div></div>`).join('')}
    </div>
    <p class="sub" style="font-size:.78rem;margin:12px 2px 18px">Rechenbeispiel: ${b.n} Signale mit je ${usd(b.einsatz)} Einsatz, zusammen ${usd(b.summe_einsatz)}. Gebühren und Slippage sind nicht abgezogen.</p>
    <div class="grid g4" style="gap:12px">
        ${k('Signale gemessen', b.n)}
        ${k('Hoch über +20%', b.treffer_20 + ' von ' + b.n, `über +50%: ${b.treffer_50} · über +100%: ${b.treffer_100}`, 'var(--up)')}
        ${k('Nie spürbar im Plus', b.nie_im_plus + ' von ' + b.n, 'Hoch unter +3%', b.nie_im_plus ? 'var(--down)' : null)}
        ${k('Zeit bis zum Hoch', dauer(b.stunden_bis_hoch), 'im Schnitt' + (b.bester && b.bester.symbol ? ` · bestes Signal ${esc(b.bester.symbol)} ${fPct(b.bester.max_pct)}` : ''))}
    </div>
    ${kolVergleich(b.vergleich_kol)}`;
}

function kolVergleich(v) {
    if (!v || !v.mit_kol || !v.mit_kol.n) return `<p class="sub" style="font-size:.76rem;margin:14px 2px 0">Vergleich mit und ohne Smart Money: erscheint, sobald das erste KOL-bestätigte Signal gemessen ist.</p>`;
    const z = (t, g, farbe) => `<div class="card sunk tb-kpi" style="border-left:3px solid ${farbe}"><div class="eyebrow">${t}</div>
        <div class="row" style="gap:16px;margin-top:8px;flex-wrap:wrap"><div><div class="tb-ks">Signale</div><div class="num">${g.n}</div></div>
        <div><div class="tb-ks">Ø perfekt raus</div><div class="num ${cls(g.schnitt_max_pct)}">${fPct(g.schnitt_max_pct)}</div></div>
        <div><div class="tb-ks">Ø Regel raus</div><div class="num ${cls(g.schnitt_regel_pct)}">${fPct(g.schnitt_regel_pct)}</div></div>
        <div><div class="tb-ks">Über +20%</div><div class="num">${g.treffer_20 ?? 0}</div></div></div></div>`;
    return `<div class="eyebrow" style="margin:20px 2px 10px">Bringt Smart Money etwas?</div><div class="grid g2" style="gap:12px">${z('Mit KOL-Bestätigung', v.mit_kol, 'var(--up)')}${v.ohne_kol && v.ohne_kol.n ? z('Ohne KOL-Bestätigung', v.ohne_kol, 'var(--ink-3)') : ''}</div>`;
}

function tbZeile(e, d) {
    const offen = tbOffen === e.id, p0 = e.preis_signal;
    const gew = pct => pct == null ? '' : `<div class="tb-usd ${cls(pct)}">${pct >= 0 ? '+' : ''}${usd(100 * pct / 100).replace('$-', '-$')}</div>`;
    return `<div class="tb-z ${offen ? 'offen' : ''}" data-tb="${esc(e.id)}">
        <div class="tb-c">${e.img ? `<img class="coin-img" src="${esc(e.img)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : `<span class="ico-b">${icon('coins')}</span>`}
            <div style="min-width:0"><div class="nm">${esc(e.symbol)} <span class="dim" style="font-weight:400;font-size:.76rem">${esc(d.chains[e.chain] || e.chain)}</span></div>
            <div class="sb">${datumZeit(e.ts)} · Score ${de(e.score, 0)}${e.kol && e.kol.bestaetigt ? ' · KOL ✓' : ''}${e.status === 'abgeschlossen' ? ' · abgeschlossen' : ''}</div>${kolRaus(e)}</div></div>
        <div class="tb-v">${verlauf(e)}</div>
        <div class="tb-m tb-ein"><div class="eyebrow">Einstieg</div><div class="num">${fUsd(p0)}</div></div>
        <div class="tb-m"><div class="eyebrow">Perfekt raus</div><div class="num ${cls(e.max_pct)}" style="font-weight:600">${fPct(e.max_pct)}</div>${gew(e.max_pct)}<div class="tb-zeit">${e.stunden_bis_hoch != null ? 'nach ' + dauer(e.stunden_bis_hoch) : ''}</div></div>
        <div class="tb-m tb-regel"><div class="eyebrow">Regel raus</div><div class="num ${cls(e.regel_pct)}">${e.regel_pct != null ? fPct(e.regel_pct) : '<span class="dim">läuft</span>'}</div>${gew(e.regel_pct)}</div>
        <div class="tb-m"><div class="eyebrow">Jetzt</div><div class="num ${cls(e.jetzt_pct)}">${fPct(e.jetzt_pct)}</div>${gew(e.jetzt_pct)}</div>
        <span class="tb-pf">${icon('chevron-down')}</span>
        ${offen ? `<div class="tb-detail">
            <div class="grid g4" style="gap:10px">
                ${[['Kurs beim Signal', fUsd(p0)], ['Höchster Kurs', fUsd(e.hoch) + (e.hoch_ts ? ' · ' + datumZeit(e.hoch_ts) : '')], ['Tief vor dem Hoch', fPct(e.tief_vor_hoch_pct) + ' · so weit lief es erst gegen dich'], ['Tiefster Stand', fPct(e.tief_pct)],
                   ['Regel-Ausstieg', e.regel_preis ? fUsd(e.regel_preis) + ' · ' + datumZeit(e.regel_ts) : 'Stop noch nicht ausgelöst'], ['Kurs jetzt', fUsd(e.preis_jetzt)], ['Marktkap. beim Signal', fBig(e.mcap_signal)], ['Gemessen', (e.kerzen || 0) + (e.kerzen === 1 ? ' Kerze' : ' Kerzen') + (e.stand ? ' · ' + ago(ts(e.stand)) : '')]]
                    .map(([k, v]) => `<div class="card sunk" style="padding:12px 14px"><div class="eyebrow">${k}</div><div style="font-size:.84rem;margin-top:5px">${v}</div></div>`).join('')}
            </div>
            ${e.kol_ausstieg ? `<div class="card sunk ts-sm" style="--c:var(--down);margin-top:14px"><div class="row" style="gap:8px"><span class="ts-sm-ico">${icon('log-out')}</span><b style="font-weight:500">KOLs steigen aus</b></div>
                <div class="sub" style="font-size:.8rem;margin:8px 0 0">Am ${datumZeit(e.kol_ausstieg.ts)} hat der KOL-Wächter ${e.kol_ausstieg.verkauf_24h ?? '?'} Verkäufe in 24 Std gezählt${e.kol_ausstieg.top_verkauf_24h ? `, davon ${e.kol_ausstieg.top_verkauf_24h} aus den Top 100` : ''}. Stand seit dem Signal zu dem Zeitpunkt: <b class="${cls(e.kol_ausstieg.seit_signal_pct)}">${fPct(e.kol_ausstieg.seit_signal_pct)}</b>${e.kol_ausstieg.kurs ? ' bei ' + fUsd(e.kol_ausstieg.kurs) : ''}. Wer jetzt noch kauft, ist ihre Ausstiegs-Liquidität.</div></div>` : ''}
            ${(e.gruende || []).length ? `<ul class="ts-l up" style="margin-top:14px">${e.gruende.map(g => `<li>${icon('check')}<span>${esc(g)}</span></li>`).join('')}</ul>` : ''}
            ${(e.warnungen || []).length ? `<ul class="ts-l warn" style="margin-top:8px">${e.warnungen.map(g => `<li>${icon('triangle-alert')}<span>${esc(g)}</span></li>`).join('')}</ul>` : ''}
            <div class="row wrap" style="gap:8px;margin-top:14px">${e.url ? `<a class="btn soft" href="${esc(e.url)}" target="_blank" rel="noopener">${icon('external-link')}DexScreener</a>` : ''}<button class="btn soft" data-kopie="${esc(e.token)}">${icon('copy')}CA</button></div>
        </div>` : ''}
    </div>`;
}

function kolRaus(e) {
    const a = e.kol_ausstieg;
    if (!a) return '';
    return `<span class="tb-kol" title="${esc(a.verkauf_24h ?? '?')} KOL-Verkäufe in 24 Std">${icon('log-out')}KOLs raus · ${esc(datumZeit(a.ts))} · ${esc(fPct(a.seit_signal_pct))} seit Signal</span>`;
}

const VERTRAUEN = { keins: ['zu wenig Daten', 'var(--ink-3)'], 'dünn': ['dünne Datenlage', 'var(--warn)'], mittel: ['mittlere Datenlage', 'var(--a2)'], belastbar: ['belastbar', 'var(--up)'] };

function waZeile(x, d) {
    return `<details class="wa-z"><summary>
        <div style="min-width:0"><div class="nm">${esc(x.symbol)} <span class="dim" style="font-weight:400;font-size:.74rem">${esc(d.chains[x.chain] || x.chain)}</span></div>
            <div class="sb">${datumZeit(x.ts)} · Score ${de(x.score, 0)}${x.kol_ausstieg ? ' · KOLs raus' : ''}</div></div>
        <div class="wa-erg"><div class="num ${cls(x.ergebnis_pct)}">${fPct(x.ergebnis_pct)}</div><div class="wa-art">${x.ergebnis_art === 'jetzt' ? 'Stand jetzt' : 'Regel-Ausstieg'}</div></div>
        <span class="tb-pf">${icon('chevron-down')}</span></summary>
        <div class="wa-detail">
            ${(x.gruende || []).length ? `<ul class="ts-l up">${x.gruende.map(g => `<li>${icon('check')}<span>${esc(g)}</span></li>`).join('')}</ul>` : ''}
            ${(x.warnungen || []).length ? `<ul class="ts-l warn" style="margin-top:8px">${x.warnungen.map(g => `<li>${icon('triangle-alert')}<span>${esc(g)}</span></li>`).join('')}</ul>` : ''}
            ${!(x.gruende || []).length && !(x.warnungen || []).length ? '<div class="sub" style="font-size:.78rem;margin:0">Für dieses Signal sind keine Gründe oder Warnungen gespeichert.</div>' : ''}
            <div class="row wrap mono dim" style="gap:14px;font-size:.7rem;margin-top:10px"><span>Hoch ${fPct(x.max_pct)}</span><span>Jetzt ${fPct(x.jetzt_pct)}</span>${x.regel_pct != null ? `<span>Regel ${fPct(x.regel_pct)}</span>` : ''}${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener" style="color:var(--pg)">DexScreener</a>` : ''}</div>
        </div></details>`;
}

function waMuster(m) {
    const verl = m.richtung === 'verlierer', je = m.je_gruppe || 1;
    const balken = (l, v, farbe) => `<div class="wa-b"><span class="dim">${l}</span>${bar(v / je * 100, farbe)}<span class="num">${v} von ${je}</span></div>`;
    return `<div class="card sunk wa-m" style="--c:${verl ? 'var(--down)' : 'var(--up)'}">
        <div class="row between" style="gap:10px;align-items:flex-start"><div class="row" style="gap:8px;min-width:0"><span class="ts-sm-ico">${icon(verl ? 'trending-down' : 'trending-up')}</span><b style="font-weight:500">${esc(m.merkmal)}</b></div>${chip(verl ? 'bei Verlierern' : 'bei Gewinnern', verl ? 'var(--down)' : 'var(--up)')}</div>
        <div class="stack" style="gap:7px;margin-top:12px">${balken('Verlierer', m.bei_verlierern, 'var(--down)')}${balken('Gewinner', m.bei_gewinnern, 'var(--up)')}</div>
        ${m.schnitt_mit != null && m.schnitt_ohne != null ? `<div class="sub" style="font-size:.76rem;margin:10px 0 0">Alle gemessenen Signale: mit <b class="${cls(m.schnitt_mit)}">${fPct(m.schnitt_mit)}</b> im Schnitt (${m.n_mit} ${m.n_mit === 1 ? 'Fall' : 'Fälle'}), ohne <b class="${cls(m.schnitt_ohne)}">${fPct(m.schnitt_ohne)}</b> (${m.n_ohne} ${m.n_ohne === 1 ? 'Fall' : 'Fälle'})</div>` : ''}
    </div>`;
}

function woche(d) {
    const w = d.wochen_analyse;
    if (!w) return card({ eyebrow: 'Wochenanalyse', title: 'Was Gewinner und Verlierer unterscheidet', body: empty('Noch keine Wochenanalyse. Sie entsteht sonntags automatisch oder mit python3 wochen_analyse.py --jetzt.') });
    const [vText, vFarbe] = VERTRAUEN[w.vertrauen] || VERTRAUEN.keins;
    const k = (l, v, sub, farbe) => `<div class="card sunk tb-kpi"><div class="eyebrow">${l}</div><div class="num tb-kv" ${farbe ? `style="color:${farbe}"` : ''}>${v}</div>${sub ? `<div class="tb-ks">${sub}</div>` : ''}</div>`;
    const gruppe = (titel, liste, farbe, ic) => `<div><div class="wa-gk" style="--c:${farbe}">${icon(ic)}<span>${titel}</span><span class="dim">${liste.length}</span></div>
        ${liste.length ? `<div class="stack" style="gap:8px">${liste.map(x => waZeile(x, d)).join('')}</div>` : empty('Noch keine gemessenen Signale.')}</div>`;
    const verl = (w.muster || []).filter(m => m.richtung === 'verlierer'), gew = (w.muster || []).filter(m => m.richtung !== 'verlierer');
    return card({ eyebrow: 'Wochenanalyse', title: 'Was Gewinner und Verlierer unterscheidet',
        right: `<div class="row wrap" style="gap:6px">${chip(vText, vFarbe)}${chip('Stand ' + ago(ts(w.stand)), 'var(--ink-3)')}</div>`,
        body: `<p class="sub" style="margin:0 0 18px">Jeden Sonntag werden die Signale der letzten ${w.tage} Tage ausgewertet. Die ${w.je_gruppe || 5} besten und die ${w.je_gruppe || 5} schlechtesten werden verglichen: welche Gründe, Warnungen und Merkmale standen bei den Verlierern gehäuft und bei den Gewinnern selten? Gezählt wird der Regel-Ausstieg, solange der nicht ausgelöst hat der Stand jetzt. Signale unter ${w.min_alter_h} Stunden zählen noch nicht.</p>
        <div class="grid g4" style="gap:12px">
            ${k('Signale in ' + w.tage + ' Tagen', w.n_signale, `${w.n_gemessen} gemessen`)}
            ${k('Im Plus', w.n_gemessen ? w.im_plus + ' von ' + w.n_gemessen : '0', 'nach Regel-Ausstieg oder jetzt', w.n_gemessen && w.im_plus >= w.n_gemessen / 2 ? 'var(--up)' : 'var(--down)')}
            ${k('Ø je Signal', w.schnitt_pct != null ? fPct(w.schnitt_pct) : '?', w.median_pct != null ? 'Median ' + fPct(w.median_pct) : '', w.schnitt_pct != null ? (w.schnitt_pct >= 0 ? 'var(--up)' : 'var(--down)') : null)}
            ${k('Muster gefunden', (w.muster || []).length, `${(w.vorschlaege || []).length} ${(w.vorschlaege || []).length === 1 ? 'Vorschlag' : 'Vorschläge'}`)}
        </div>
        <div class="grid g2" style="gap:18px;margin-top:22px">${gruppe('Verlierer', w.verlierer || [], 'var(--down)', 'arrow-down-right')}${gruppe('Gewinner', w.gewinner || [], 'var(--up)', 'arrow-up-right')}</div>
        <div class="eyebrow" style="margin:26px 2px 10px">Muster</div>
        ${(w.muster || []).length ? `<div class="grid g2" style="gap:12px">${[...verl, ...gew].map(waMuster).join('')}</div>` : `<div class="card sunk" style="padding:16px 18px"><div class="sub" style="margin:0;font-size:.84rem">${w.je_gruppe >= 2 ? 'Kein Merkmal trennt Gewinner und Verlierer um mindestens 40 Prozentpunkte.' : 'Zu wenige gemessene Signale für einen Vergleich.'}</div></div>`}
        ${(w.vorschlaege || []).length ? `<div class="eyebrow" style="margin:26px 2px 10px">Vorschläge</div><div class="stack" style="gap:10px">${w.vorschlaege.map(v => `<div class="card sunk wa-v"><span class="ico-b">${icon('lightbulb')}</span><div><div>${esc(v.text)}</div><div class="tb-ks">${esc(v.fallzahl)}</div></div></div>`).join('')}</div>` : ''}
        ${(w.beobachtungen || []).length ? `<div class="eyebrow" style="margin:26px 2px 10px">${w.modus === 'vorschlaege' ? 'Weitere Beobachtungen' : 'Beobachtungen'}</div><ul class="ts-l wa-o">${w.beobachtungen.map(b => `<li>${icon('eye')}<span>${esc(b)}</span></li>`).join('')}</ul>` : ''}
        ${(w.hinweise || []).length ? `<div class="wa-h">${w.hinweise.map(h => `<div>${icon('info')}<span>${esc(h)}</span></div>`).join('')}</div>` : ''}
        <p class="sub" style="font-size:.74rem;margin-top:16px">Regelbasiert und ohne KI. Vorschläge gibt es erst ab ${w.min_fuer_vorschlaege} gemessenen Signalen und nur, wenn das Merkmal auch im Schnitt aller Signale schlechter abschneidet. Bei kleinen Fallzahlen ist jedes Muster ein Hinweis, kein Beweis. Nichts davon ändert die Regeln automatisch.</p>` });
}

function historie(d) {
    const alle = (d.tagebuch || []).filter(x => kette === 'alle' || x.chain === kette);
    const liste = alle.filter(x => tbFilter === 'alle' || (tbFilter === 'aktiv' ? x.status !== 'abgeschlossen' : tbFilter === 'treffer' ? (x.max_pct || 0) >= 20 : (x.max_pct || 0) < 3));
    const tage = {};
    liste.forEach(x => { (tage[x.datum] = tage[x.datum] || []).push(x); });
    return card({ eyebrow: 'Signal-Tagebuch', title: 'Was du mit jedem Signal hättest machen können',
        right: d.tagebuch_stand ? chip('Gemessen ' + ago(ts(d.tagebuch_stand)), 'var(--up)') : '',
        body: `<p class="sub" style="margin:0 0 18px">Jedes Signal wird hier dauerhaft festgehalten, mit Kurs und Uhrzeit. Danach wird es ${d.bilanz ? d.bilanz.aktiv_tage : 14} Tage lang aus den Kerzen nachgemessen: wie hoch es nach dem Signal lief, also der Gewinn beim Verkauf zum perfekten Zeitpunkt, was ein fester Trailing-Stop gebracht hätte und wo es heute steht.</p>
        ${tbBilanz(d.bilanz)}
        <div class="row between wrap" style="margin:26px 0 12px;gap:12px"><div class="eyebrow">${liste.length} ${liste.length === 1 ? 'Eintrag' : 'Einträge'}</div>${seg('tbfilter', [['alle', 'Alle'], ['aktiv', 'Wird gemessen'], ['treffer', 'Über +20%'], ['flop', 'Nie im Plus']], tbFilter)}</div>
        ${liste.length ? Object.keys(tage).sort().reverse().map(t => `<div class="tb-tag"><span>${esc(t.split('-').reverse().join('.'))}</span><span class="dim">${tage[t].length} ${tage[t].length === 1 ? 'Signal' : 'Signale'}</span></div><div class="tb-liste">${tage[t].map(e => tbZeile(e, d)).join('')}</div>`).join('')
            : empty(alle.length ? 'Kein Eintrag passt zu diesem Filter.' : 'Noch keine Signale im Tagebuch. Jedes neue Signal wird ab jetzt automatisch eingetragen.')}
        <p class="sub" style="font-size:.74rem;margin-top:16px">Perfekter Ausstieg heißt Verkauf am höchsten Kerzenhoch nach dem Signal. Das trifft in der Praxis niemand genau, es zeigt das Potenzial. Der Regel-Ausstieg ist der realistische Vergleich: verkauft wird, sobald der Kurs ${d.bilanz ? de(d.bilanz.trail_pct, 0) : 30} Prozent unter das bisherige Hoch fällt. Die Kerze, in die das Signal fällt, zählt nur mit ihrem Schlusskurs.</p>` });
}

export default {
    styles: `
        .ts-fz { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 0; border-top: 1px solid var(--line); }
        .ts-fk { width: 80px; } .ts-fs { flex: 1; min-width: 96px; padding: 12px 14px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); }
        .ts-fs .num { font-size: 1.5rem; font-weight: 300; line-height: 1.1; } .ts-fs .eyebrow { font-size: .56rem; letter-spacing: .12em; margin-top: 4px; }
        .ts-fs.ziel { background: var(--surface); box-shadow: var(--sh-sm); } .ts-fs.ziel .num { color: var(--up); font-weight: 500; }
        .ts-fp { color: var(--ink-3); display: grid; } .ts-fp svg { width: 14px; height: 14px; }
        .ts-sec { display: flex; justify-content: space-between; align-items: baseline; margin: 4px 4px -8px; } .ts-sec .eyebrow:first-child { color: var(--pg); }
        .ts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 22px; }
        .ts-k { display: flex; flex-direction: column; gap: 16px; transition: transform .35s var(--ease); } .ts-k:hover { transform: translateY(-3px); }
        .ts-warten { box-shadow: none; border: 1px dashed color-mix(in srgb, var(--warn) 45%, transparent); }
        .ts-kz { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 10px; } .ts-kz .num { font-size: .9rem; margin-top: 3px; }
        .ts-ein { display: flex; gap: 12px; padding: 14px 16px; font-size: .88rem; align-items: flex-start; } .ts-ein .eyebrow { margin-bottom: 3px; }
        .ts-seit { font-size: .76rem; color: var(--ink-3); margin-top: 6px; }
        .ts-l { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; font-size: .84rem; color: var(--ink-2); }
        .ts-l li { display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 9px; align-items: start; } .ts-l svg { width: 15px; height: 15px; margin-top: 3px; }
        .ts-l.up svg { color: var(--up); } .ts-l.warn svg { color: var(--warn); }
        .ts-d { border-top: 1px solid var(--line); padding-top: 12px; }
        .ts-d summary { display: flex; align-items: center; gap: 10px; cursor: pointer; list-style: none; font-size: .82rem; color: var(--ink-2); }
        .ts-d summary::-webkit-details-marker { display: none; } .ts-d summary svg { width: 15px; height: 15px; flex: none; }
        .ts-d summary span { flex: 1; } .ts-d summary svg:last-child { transition: transform .3s var(--ease); } .ts-d[open] > summary svg:last-child { transform: rotate(180deg); }
        .ts-p { display: flex; gap: 10px; align-items: center; font-size: .8rem; margin-top: 8px; }
        .ts-sm { padding: 14px 16px; border-left: 3px solid var(--c); }
        .ts-kurz { gap: 6px; }
        .ts-w1 { flex-basis: 100%; display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 8px; font-size: .8rem; color: var(--ink-2); margin-top: 4px; }
        .ts-w1 svg { width: 14px; height: 14px; color: var(--warn); margin-top: 2px; }
        .ts-mehr > summary { font-weight: 500; }
        .ts-mehr .ts-d { border-top: 0; padding-top: 0; }
        .ts-ca { padding: 14px 16px; } .ts-ca .chip, .ts-ca b { white-space: nowrap; }
        .ts-kc { display: block; width: 100%; height: 130px; margin: 12px 0 6px; overflow: visible; }
        .ts-kc .ku { fill: var(--up); stroke: var(--up); stroke-width: 1; vector-effect: non-scaling-stroke; }
        .ts-kc .kd { fill: var(--down); stroke: var(--down); stroke-width: 1; vector-effect: non-scaling-stroke; }
        .ts-kc .kv { fill: var(--ink-3); opacity: .18; }
        .ts-kc .kl { stroke-width: 1.2; stroke-dasharray: 5 4; vector-effect: non-scaling-stroke; }
        .ts-kc .st { stroke: var(--ink-3); } .ts-kc .sp { stroke: var(--down); } .ts-kc .z1 { stroke: var(--up); }
        .ts-leg { display: flex; gap: 14px; flex-wrap: wrap; font-family: var(--mono); font-size: .6rem; letter-spacing: .08em; color: var(--ink-3); margin-bottom: 4px; }
        .ts-leg span::before { content: ''; display: inline-block; width: 14px; border-top: 1.5px dashed; margin-right: 6px; vertical-align: middle; }
        .ts-leg .st::before { border-color: var(--ink-3); } .ts-leg .sp::before { border-color: var(--down); } .ts-leg .z1::before { border-color: var(--up); }
        .ts-at { margin-top: 10px; } .ts-at p { margin: 0 0 8px; font-size: .84rem; color: var(--ink-2); line-height: 1.5; }
        .ts-sm-ico { color: var(--c); display: grid; } .ts-sm-ico svg { width: 16px; height: 16px; }
        .ts-sm-kz { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
        .ts-sm-kz .eyebrow { font-size: .52rem; letter-spacing: .1em; } .ts-sm-kz .num { font-size: .92rem; margin-top: 3px; }
        @media (max-width: 860px) { .ts-sm-kz { grid-template-columns: repeat(2, minmax(0, 1fr)); } .ts-ca-n { display: none; } }
        .tb-drei { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .tb-weg { position: relative; overflow: hidden; padding: 20px 22px; }
        .tb-weg::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--c); }
        .tb-wsub { font-size: .76rem; color: var(--ink-3); margin-top: 4px; }
        .tb-kpi { padding: 14px 16px; } .tb-kv { font-size: 1.3rem; font-weight: 300; margin-top: 6px; } .tb-ks { font-size: .72rem; color: var(--ink-3); margin-top: 4px; }
        .tb-tag { display: flex; justify-content: space-between; font-family: var(--mono); font-size: .66rem; letter-spacing: .14em; text-transform: uppercase; color: var(--pg); margin: 18px 4px 8px; }
        .tb-liste { display: grid; gap: 8px; }
        .tb-z { display: grid; grid-template-columns: minmax(150px, 1.3fr) 150px repeat(4, minmax(78px, .8fr)) 20px; gap: 14px; align-items: center; padding: 12px 14px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); cursor: pointer; transition: background .2s; }
        .tb-z:hover { background: color-mix(in srgb, var(--ink) 3%, var(--bg)); }
        .tb-c { display: flex; gap: 10px; align-items: center; min-width: 0; } .tb-c .nm { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .tb-c .sb { font-size: .7rem; color: var(--ink-3); font-family: var(--mono); }
        .tb-m .eyebrow { font-size: .54rem; letter-spacing: .12em; } .tb-m .num { font-size: .9rem; margin-top: 3px; }
        .tb-usd { font-family: var(--mono); font-size: .68rem; } .tb-zeit { font-size: .66rem; color: var(--ink-3); }
        .tb-svg path { fill: none; stroke-width: 1.6; stroke-linejoin: round; stroke-linecap: round; }
        .tb-null { stroke: var(--ink-3); stroke-dasharray: 2 3; opacity: .55; } .tb-top { fill: var(--up); }
        .tb-pf { color: var(--ink-3); display: grid; transition: transform .3s var(--ease); } .tb-pf svg { width: 16px; height: 16px; } .tb-z.offen .tb-pf { transform: rotate(180deg); }
        .tb-detail { grid-column: 1 / -1; padding-top: 8px; cursor: default; }
        @media (max-width: 1180px) { .tb-z { grid-template-columns: minmax(140px, 1fr) repeat(3, minmax(70px, .7fr)) 20px; } .tb-v, .tb-ein { display: none; } }
        @media (max-width: 860px) { .tb-drei { grid-template-columns: minmax(0, 1fr); } .tb-z { grid-template-columns: minmax(0, 1fr) repeat(2, auto) 16px; gap: 10px; } .tb-regel { display: none; } }
        .tb-kol { display: inline-flex; align-items: center; gap: 5px; margin-top: 5px; padding: 3px 9px 3px 7px; border-radius: 999px; font-size: .66rem; font-weight: 500; line-height: 1.3;
            color: var(--down); background: color-mix(in srgb, var(--down) 13%, transparent); border: 1px solid color-mix(in srgb, var(--down) 30%, transparent); max-width: 100%; }
        .tb-kol svg { width: 12px; height: 12px; flex: none; }
        .wa-gk { display: flex; align-items: center; gap: 8px; margin: 0 2px 10px; font-family: var(--mono); font-size: .66rem; letter-spacing: .14em; text-transform: uppercase; color: var(--c); }
        .wa-gk svg { width: 14px; height: 14px; } .wa-gk .dim { margin-left: auto; }
        .wa-z { border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); transition: background .2s; }
        .wa-z:hover { background: color-mix(in srgb, var(--ink) 3%, var(--bg)); }
        .wa-z summary { display: grid; grid-template-columns: minmax(0, 1fr) auto 16px; gap: 12px; align-items: center; padding: 11px 14px; cursor: pointer; list-style: none; }
        .wa-z summary::-webkit-details-marker { display: none; }
        .wa-z .nm { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .wa-z .sb { font-size: .7rem; color: var(--ink-3); font-family: var(--mono); }
        .wa-z[open] .tb-pf { transform: rotate(180deg); }
        .wa-erg { text-align: right; } .wa-erg .num { font-size: .95rem; } .wa-art { font-size: .62rem; color: var(--ink-3); }
        .wa-detail { padding: 2px 14px 14px; }
        .wa-m { padding: 14px 16px; border-left: 3px solid var(--c); }
        .wa-b { display: grid; grid-template-columns: 64px minmax(0, 1fr) 54px; gap: 10px; align-items: center; font-size: .74rem; } .wa-b .num { text-align: right; font-size: .76rem; }
        .wa-v { display: flex; gap: 12px; padding: 14px 16px; font-size: .88rem; align-items: flex-start; }
        .wa-o svg { color: var(--a2); }
        .wa-h { display: grid; gap: 6px; margin-top: 18px; } .wa-h div { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 8px; font-size: .74rem; color: var(--ink-3); }
        .wa-h svg { width: 13px; height: 13px; margin-top: 2px; }
        @media (max-width: 860px) { .ts-grid { grid-template-columns: minmax(0, 1fr); } .ts-fk { width: 100%; } .ts-fp { display: none; } }`,
    render(root) {
        const d = daten();
        const kopf = pageHead('Heute', 'Tages-Signale', 'Tägliche Memecoin-Vorschläge für Solana, Base, BNB Chain, Robinhood und Monad aus DexScreener. Jeder Coin ist vorher durch 4 Stufen gelaufen: Marktdaten, harte Filter, Score und Vertragsprüfung. Unten im Signal-Tagebuch steht, was jedes Signal gebracht hätte.',
            d ? seg('tseinstieg', [['alle', 'Alle Signale'], ['gut', 'Guter Einstieg ' + Object.values(d.ergebnis).flatMap(e => e.signale || []).filter(x => einstiegsCheck(x).gut).length]], einstieg) +
                seg('tskette', [['alle', 'Alle'], ...Object.entries(d.chains)], kette) : '');
        root.classList.add('stack');
        if (!d) { root.innerHTML = kopf + card({ body: empty('Noch keine Signale. Sie entstehen beim nächsten Lauf von fetch_tagessignale.py, also beim nächsten Refresh.') }); return; }
        root.innerHTML = kopf + ((d.fehler || []).length ? card({ cls: 'flat', body: `<div class="warn" style="font-size:.86rem">${d.fehler.map(esc).join('. ')}</div>` }) : '') +
            kolStatus(d) + trichter(d) + `<div class="stack" id="tsListe">${liste(d)}</div><div id="tsHist">${historie(d)}</div><div id="tsWoche">${woche(d)}</div>` +
            `<p class="sub" style="font-size:.76rem;max-width:none">Mechanisches Raster, keine Anlageberatung und kein Kaufbefehl. Memecoins können in Minuten auf null fallen. Die Vertragsprüfung senkt das Risiko eines Betrugs, sie schließt ihn nicht aus. Nur Geld einsetzen, dessen Verlust du verkraftest.</p>`;
        root.onclick = e => {
            const k = e.target.closest('[data-kopie]');
            if (k) { navigator.clipboard && navigator.clipboard.writeText(k.dataset.kopie).then(() => { const alt = k.innerHTML; k.textContent = 'Kopiert'; setTimeout(() => { k.innerHTML = alt; }, 1300); }); return; }
            const f = e.target.closest('[data-seg="tbfilter"] button');
            if (f) { tbFilter = f.dataset.v; const h = root.querySelector('#tsHist'); h.innerHTML = historie(d); hydrate(h); return; }
            const z = e.target.closest('[data-tb]');
            if (z && !e.target.closest('.tb-detail')) { tbOffen = tbOffen === z.dataset.tb ? null : z.dataset.tb; const h = root.querySelector('#tsHist'); h.innerHTML = historie(d); hydrate(h); h.querySelector(`[data-tb="${CSS.escape(z.dataset.tb)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
            const ei = e.target.closest('[data-seg="tseinstieg"] button');
            if (ei) { einstieg = ei.dataset.v; root.querySelectorAll('[data-seg="tseinstieg"] button').forEach(x => x.classList.toggle('on', x === ei));
                const l = root.querySelector('#tsListe'); l.innerHTML = liste(d); hydrate(l); return; }
            const b = e.target.closest('[data-seg="tskette"] button');
            if (b) { kette = b.dataset.v; root.querySelectorAll('[data-seg="tskette"] button').forEach(x => x.classList.toggle('on', x === b));
                const l = root.querySelector('#tsListe'), h = root.querySelector('#tsHist'); l.innerHTML = liste(d); h.innerHTML = historie(d); hydrate(l); hydrate(h); }
        };
    },
};
