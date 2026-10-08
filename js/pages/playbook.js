import { D, coin, signal, store } from '../core/data.js?v=202610082050';
import { esc, fUsd, fBig, fPct, fNum } from '../core/fmt.js?v=202610082050';
import { pageHead, icon, icons, scoreVar, sparkline } from '../core/ui.js?v=202610082050';

const UP = 'var(--up)';                                               // alt #4ecdc4
const UP2 = 'color-mix(in srgb, var(--up) 70%, var(--warn))';         // alt #6bcf7f
const WARN = 'var(--warn)';                                           // alt #f5a623
const DOWN = 'var(--down)';                                           // alt #ff6b6b
const HOT = 'var(--a4)';                                              // alt #ff6b35
const VIO = 'var(--a2)';                                              // alt #a78bfa, #8c50c8
const BLUE = 'color-mix(in srgb, var(--a1) 45%, var(--a2))';          // alt #6b8cff
const DIM = 'var(--ink-3)';

const td = (html, c, b, span) => `<td${span ? ` colspan="${span}"` : ''} style="${c ? 'color:' + c + ';' : ''}${b ? 'font-weight:600;' : ''}">${html}</td>`;
const tbl = (heads, rows) => `<div class="tbl-wrap"><table class="tbl pb-tbl"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(z => Array.isArray(z) ? td(z[0], z[1], z[2], z[3]) : td(z)).join('')}</tr>`).join('')}</tbody></table></div>`;
const h4 = t => `<h4 class="pb-h4">${t}</h4>`;
const info = (label, value, c, sub) => `<div class="card sunk pb-info"><div class="eyebrow">${label}</div><div class="pb-val num" style="color:${c}">${value}</div><div class="pb-small">${sub}</div></div>`;

const SECTIONS = [
    ['pb-orderflow', 'Orderflow', 'activity'],
    ['pb-pillars', '5 Säulen', 'landmark'],
    ['pb-rules', 'Regeln A + B', 'scale'],
    ['pb-degen', 'Degen System', 'flame'],
    ['pb-rugcheck', 'RugCheck', 'shield-check'],
    ['pb-polymarket', 'Polymarket', 'percent'],
    ['pb-marktlage', 'Markt Lage', 'globe'],
    ['pb-scantimes', 'Scan Zeiten', 'clock'],
];
const ICON = Object.fromEntries(SECTIONS.map(s => [s[0], s[2]]));

const section = (id, anchor, title, desc, body) => `<section class="card pb-sec" id="${id}">
    <div class="pb-sec-head"><span class="ico-b pb-ico">${icon(ICON[id])}</span><div><div class="eyebrow">${anchor}</div><h3 class="h2" style="margin-top:6px">${title}</h3></div></div>
    <p class="sub pb-desc">${desc}</p>${body}</section>`;

/* ── 1. Orderflow ── */
function orderflow() {
    return section('pb-orderflow', 'Orderflow Interpretation', 'Orderflow lesen',
        'Funding Rate, Open Interest und Preis Kombination. CoinGlass ist dein S-Tier Tool dafür. Lerne die Kombinationen und erkenne Setups, bevor der Markt sich bewegt.',
        tbl(['Funding', 'OI', 'Preis', 'Bedeutung'], [
            [['Hoch positiv (&gt;0.05%)', DOWN], 'Steigend', 'Steigend', ['Overleveraged Longs. Vorsicht Long!', WARN]],
            [['Negativ (&lt;-0.05%)', UP], 'Steigend', 'Fallend', ['Shorts bauen auf. Potenzieller Squeeze.', UP]],
            ['Neutral', 'Flat', 'Range', ['Kein klares Signal. Warten.', DIM]],
            [['Hoch positiv', DOWN], 'Fallend', 'Fallend', ['Long Flush. Watch for Bounce.', WARN]],
            [['Negativ', UP], 'Fallend', 'Steigend', ['Short Squeeze in Aktion!', UP]],
        ]) +
        `<div class="pb-note"><strong>Tipp:</strong> Kombiniere Orderflow mit MTF Analyse. Funding Rate alleine ist kein Trade Signal. Immer im Kontext von Trend, Level und Killzone lesen. Check CoinGlass vor jedem BTC Trade.</div>`);
}

/* ── 2. Die 5 Säulen ── */
function pillars() {
    const trend = (kopf, zeilen) => `<div class="pb-kopf">${kopf}</div><div class="pb-quote">${zeilen.join('<br>')}</div>`;
    return section('pb-pillars', 'Fundament', 'Die 5 Basis Säulen',
        'Das komplette Trading Fundament. Jede Säule ist eine Voraussetzung. Nie eine überspringen.',
        h4('Säule 1: Quellen Hierarchie') +
        tbl(['Tier', 'Quelle', 'Was', 'Wann'], [
            [['S-Tier', UP, 1], 'TradingView', 'Price Action, Candlesticks, Marktstruktur', 'Immer zuerst'],
            [['A-Tier', UP2, 1], 'CoinGlass', 'Funding Rate, Open Interest, Liquidations', 'Orderflow Check'],
            [['B-Tier', WARN, 1], 'CoinGecko', 'Preise, Marktkapitalisierung', 'Quick Reference'],
            [['Modus B', WARN, 1], 'DEXScreener', 'Token Discovery, DEX Volume', 'Memecoin Scan'],
            [['Modus B', WARN, 1], 'RugCheck', 'Contract Safety, LP Status', 'Sicherheits Check'],
            [['F-Tier', DOWN, 1], 'Moon Phases, Elliott Wave', 'NICHTS', 'NIEMALS'],
        ]) +
        `<div class="grid g2 pb-gap">
            <div class="card sunk pb-pillar"><div class="eyebrow">Säule 2</div><h4 class="pb-h3">Multi Timeframe (MTF)</h4>
                ${tbl(['TF', 'Rolle', 'Was suchen'], [
                    [['W', '', 1], 'Der Boss', 'Übergeordneter Trend, Major Levels'],
                    [['D', '', 1], 'Kontext', 'Tagesstruktur, S/R, EMA 200'],
                    [['4H', '', 1], 'Richtung', 'Medium Term, EMA 50'],
                    [['1H', '', 1], 'Location', 'Entry Zone, S/D Zonen'],
                    [['15m', '', 1], 'Trigger', 'BOS/CHoCH, FVG'],
                ])}
            </div>
            <div class="card sunk pb-pillar"><div class="eyebrow">Säule 3</div><h4 class="pb-h3">Trend Check (9 Punkte)</h4>
                ${trend('Struktur (3P)', ['Saubere HH/HL oder LH/LL?', 'Flache, kontrollierte Pullbacks?', 'Marktstruktur intakt?'])}
                ${trend('Momentum (3P)', ['Große Körper in Trendrichtung?', 'Rhythmus konsistent?', 'Volumen bestätigt?'])}
                ${trend('Keine Erschöpfung (3P)', ['Keine Blow-off Kerze?', 'Keine Divergenz?', 'Charakter konstant?'])}
                <div class="pb-small" style="margin-top:12px">Score 7-9 = Go. Unter 7 = Kein Trade.</div>
            </div>
            <div class="card sunk pb-pillar"><div class="eyebrow">Säule 4</div><h4 class="pb-h3">Risk Management</h4>
                ${tbl(['Regel', 'Modus A', 'Modus B'], [
                    ['Max Risk/Trade', ['1-2%', UP], ['0.5-1%', WARN]],
                    ['Min R:R', '1:2', '1:3'],
                    ['Stop Loss', 'Strukturell +10-15 Pips', 'Fest -30%'],
                    ['Max Positionen', '3', '5'],
                    ['Max Loss/Tag', ['3% STOP', DOWN], ['2% Wallet', DOWN]],
                ])}
                <div class="pb-code">Size = Risk / (Entry - SL)<br><span class="dim">z.B. 1000 / (95000 - 94000) = 1.0 BTC</span></div>
            </div>
            <div class="card sunk pb-pillar"><div class="eyebrow">Säule 5</div><h4 class="pb-h3">Confluence Scoring</h4>
                ${tbl(['+1', 'Kriterium'], [
                    [['+1', UP, 1], 'HTF Trend Alignment'],
                    [['+1', UP, 1], 'Key Level erreicht (S/R, EMA)'],
                    [['+1', UP, 1], 'Orderflow Bestätigung'],
                    [['+1', UP, 1], 'Volumen Bestätigung'],
                    [['+1', UP, 1], 'Killzone Timing'],
                ])}
                <div class="pb-score">
                    <div><b class="mono" style="color:${UP}">5/5</b> <span>Perfekt. Volle Size</span></div>
                    <div><b class="mono" style="color:${UP2};font-weight:400">4/5</b> <span>Stark. 75% Size</span></div>
                    <div><b class="mono" style="color:${WARN};font-weight:400">3/5</b> <span>OK. 50% Size</span></div>
                    <div><b class="mono" style="color:${DOWN};font-weight:400">1-2</b> <span>Kein Trade</span></div>
                </div>
            </div>
        </div>`);
}

/* ── 3. Regeln A + B ── */
function rules() {
    const ul = items => `<ul class="pb-rules">${items.map(i => `<li${i[1] ? ' class="pb-hart"' : ''}>${i[0]}</li>`).join('')}</ul>`;
    return section('pb-rules', 'Trading Regeln', 'Modus A + B Regeln',
        'Nicht verhandelbar. Jede Verletzung kostet Geld.',
        `<div class="grid g2 pb-gap">
            <div><h4 class="pb-h4" style="--c:${UP}">Modus A (BTC Daytrading)</h4>${ul([
                ['Nur in aktiven Killzones traden (Ausnahme: Swing auf 4H+)'],
                ['MTF Trend Alignment erforderlich'],
                ['Confluence Score &gt;= 3/5 vor jedem Trade'],
                ['Stop Loss IMMER vor Entry definieren'],
                ['R:R &gt;= 1:2. Kein Trade darunter.'],
                ['Pre Trade Checklist abgeschlossen'],
                ['Max 3 Verluste hintereinander: 30 Min Pause. Kein Revenge Trading.'],
                ['Tages Limit 3% Loss: Session SOFORT beenden', 1],
            ])}</div>
            <div><h4 class="pb-h4" style="--c:${WARN}">Modus B (Memecoin / Degen)</h4>${ul([
                ['Max 0.5% Portfolio pro Memecoin. 100% Verlust möglich.'],
                ['Separates Degen Wallet. Max 5% Gesamtkapital.'],
                [`<b style="color:${UP}">2x Regel:</b> Bei +100% = 50% verkaufen (Einsatz raus)`],
                [`<b style="color:${UP}">5x Regel:</b> Bei +500% = weitere 25% verkaufen. Rest Trail Stop`],
                ['Fast Exit: Bei -20% sofort raus. Keine Gnade.', 1],
                ['Zeit Stop: Keine Bewegung in 24h = Exit'],
                ['Max 3 Memecoin Positionen gleichzeitig'],
                ['NIEMALS bei Memecoins nachkaufen (Average Down)'],
            ])}</div>
        </div>`);
}

/* ── 4. Degen System ── */
function degen() {
    const flow = ['Degen Scan', 'On-Chain Check', 'Entry setzen', 'Degen Update', 'Degen Close', 'Win Report'];
    const stufe = (t, c) => `<span class="chip pb-stufe" style="--c:${c}">${t}</span>`;
    return section('pb-degen', 'Degen Trading System', 'DEXScreener + Degen Score',
        'Echtzeit Degen Calls basierend auf DEXScreener Spot Käufen auf Solana und Base. Filtert nach Liquidity, Volume, On-Chain Safety und Degen Score.',
        `<div class="pb-flow">${flow.map(f => `<span class="pb-flow-item">${f}</span>`).join(`<span class="pb-flow-arrow">${icon('arrow-right')}</span>`)}</div>` +
        h4('DEXScreener Filter Kriterien') +
        tbl(['Kriterium', 'Minimum', 'Ideal'], [
            ['Liquidity', ['$5,000', WARN], ['$50,000+', UP]],
            ['24h Volume', ['$10,000', WARN], ['$100,000+', UP]],
            ['Market Cap', ['$10,000', WARN], ['$50K bis $500K', UP]],
            ['Token Alter', ['&lt; 24h', WARN], ['&lt; 6h (Fresh Launch)', UP]],
            ['Buys/Sells Ratio', ['&gt; 1.0', WARN], ['&gt; 2.0', UP]],
            ['LP Burned/Locked', ['Burned oder Locked', UP, 0, 2]],
            ['Honeypot Check', ['Clean', UP, 0, 2]],
        ]) +
        h4('Degen Score System (0 bis 100+)') +
        `<div class="row wrap" style="gap:8px;margin-bottom:14px">${stufe('90+ STRONG BUY', HOT)}${stufe('70-89 BUY', UP)}${stufe('50-69 WATCH', WARN)}${stufe('&lt;50 SKIP', DOWN)}</div>` +
        tbl(['Kriterium', 'Top Punkte', 'Mittel', 'Niedrig'], [
            ['Liquidity', ['&gt;$50K = +25', UP], '$20K-$50K = +15', ['$5K-$20K = +5', DIM]],
            ['Buy/Sell Ratio', ['&gt;2.0 = +20', UP], '1.5-2.0 = +12', ['1.0-1.5 = +6', DIM]],
            ['Token Alter', ['&lt;6h = +20', UP], '6h-24h = +10', ['&gt;24h = +3', DIM]],
            ['Momentum h1', ['&gt;20% = +15', UP], '5-20% = +8', ['&lt;5% = 0', DIM]],
            ['Market Cap', ['$50K-$500K = +10', UP], 'außerhalb = +5', ''],
            ['Polymarket Signal', ['passend = +10', UP], ['kein Signal = 0', DIM], ''],
            ['Fear &amp; Greed', ['&gt;50 = +5', UP], '25-50 = 0', ['&lt;25 = -10', DOWN]],
        ]) +
        h4('Degen Risk Management') +
        `<div class="grid g-auto pb-infos">
            ${info('Target 1', '+50%', UP, '30% verkaufen')}
            ${info('Target 2', '+100% (2x)', UP, '30% verkaufen')}
            ${info('Target 3', '+300% (4x)', UP, '30% verkaufen')}
            ${info('Stop Loss', '-30%', DOWN, 'Alles verkaufen')}
            ${info('Max Position', '1-2%', WARN, 'des Portfolios')}
            ${info('Chains', 'SOL + BASE', VIO, 'Nur diese zwei')}
        </div>`);
}

/* ── 5. RugCheck ── */
function rugcheck() {
    const ampel = (c, kopf, text, ico) => `<div class="pb-ampel" style="--c:${c}">${ico ? `<span class="pb-skull">${icon(ico)}</span>` : '<span class="pb-dot"></span>'}<div><strong>${kopf}</strong> ${text}</div></div>`;
    return section('pb-rugcheck', 'Safety System', 'RugCheck &amp; Honeypot',
        'Vor jedem Degen Entry. Kein Check, kein Trade. Die Ampel bestimmt ob du einsteigst oder nicht.',
        `<div class="stack" style="gap:10px;margin-bottom:22px">
            ${ampel(UP, 'GRÜN. Safe.', 'Honeypot Clean + LP Locked/Burned + Mint Revoked + Contract Verified. Entry möglich.')}
            ${ampel(WARN, 'GELB. Vorsicht.', 'Honeypot Clean, aber LP nicht gelockt oder keine Social Links. Kleinere Position, enger SL.')}
            ${ampel(DOWN, 'ROT. High Risk.', 'Honeypot detected ODER Top 10 Holder &gt;50% ODER Contract nicht verified. Auto-SKIP.')}
            ${ampel(VIO, 'SKULL. Rug.', 'Bekannter Rug Contract, Mint aktiv, oder Devs haben Liquidity gezogen. Kein Check mehr nötig.', 'skull')}
        </div>` +
        h4('Honeypot Auto Check') +
        `<div class="grid g2 pb-gap" style="margin-bottom:22px">
            <div class="card sunk pb-pillar"><div class="pb-chain" style="color:${VIO}">Solana</div>
                <div class="pb-mono">rugcheck.xyz/tokens/[ADDRESS]<br><span style="color:${UP}">"Looks Good" = CLEAN</span><br><span style="color:${DOWN}">Warning = SKIP</span></div></div>
            <div class="card sunk pb-pillar"><div class="pb-chain" style="color:${BLUE}">Base</div>
                <div class="pb-mono">honeypot.is/v2/IsHoneypot?<br>address=[TOKEN]&amp;chainID=8453<br><span style="color:${UP}">isHoneypot: false = CLEAN</span><br><span style="color:${DOWN}">isHoneypot: true = SKIP</span></div></div>
        </div>` +
        h4('Red Flags Tabelle') +
        tbl(['Red Flag', 'Was suchen', 'Ampel', 'Aktion'], [
            [['Honeypot detected', DOWN], 'isHoneypot: true / Warning', 'SKULL', ['AUTO-SKIP', DOWN, 1]],
            [['Mint Authority aktiv', DOWN], '"Mint: Active"', 'ROT', ['SKIP', DOWN, 1]],
            [['Top Holder &gt; 50%', DOWN], 'Holder Distribution', 'ROT', ['SKIP', DOWN, 1]],
            [['Contract nicht verifiziert', DOWN], 'Unverified Contract', 'ROT', ['SKIP', DOWN, 1]],
            [['LP nicht gelockt', WARN], 'Unlocked LP', 'GELB', ['Kleinere Position', WARN]],
            [['Keine Social Links', WARN], 'Leere Social Sektion', 'GELB', ['Höhere Vorsicht', WARN]],
            [['Alle Checks bestanden', UP], 'Clean + Locked + Verified', 'GRÜN', ['Entry möglich', UP, 1]],
        ]));
}

/* ── 6. Polymarket ── */
const PM_API = 'https://gamma-api.polymarket.com';
const PM_WEB = 'https://polymarket.com/event/';
const PM_KEY = 'cb2_playbook_pm';
const PM_ALT_STAND = '30.09.2026';
const PM_TAKT = 5 * 60 * 1000;
const FED_EVENT = 'fed-decision-in-october-20260617190323537';
const MONAT = { january: 'Januar', february: 'Februar', march: 'März', april: 'April', may: 'Mai', june: 'Juni', july: 'Juli',
    august: 'August', september: 'September', october: 'Oktober', november: 'November', december: 'Dezember' };
const FED_ALT = { cut: null, hold: 55.5, hike: 43.5, monat: 'Oktober', link: PM_WEB + FED_EVENT, closed: false };

const p1 = v => v == null ? 'unter 1%' : fNum(v, 1) + '%';
const band = p => p >= 85 ? 'Klarer Konsens für Ja.' : p >= 60 ? 'Eher ja.' : p >= 40 ? 'Münzwurf.' : p > 15 ? 'Eher nein.' : 'Klarer Konsens für Nein.';

const PM = [
    { key: 'btc', cat: 'Bitcoin Preis', c: WARN, q: 'Erreicht BTC $95K bis Ende 2026?',
      event: 'what-price-will-bitcoin-hit-before-2027', market: 'will-bitcoin-reach-95000-by-december-31-2026-from-june-8',
      alt: 49.5, altHint: 'Münzwurf. BTC steht bei rund 83,6k. 71 Mio Dollar Volumen, der meistgehandelte Krypto-Markt.',
      hint: (p, x) => { const b = coin('BTC'); return band(p) + (b ? ` BTC steht bei ${fUsd(b.current_price)}.` : '') + (x.vol ? ` ${fBig(x.vol)} Volumen im Gesamtmarkt "BTC Preis 2026".` : ''); } },
    { key: 'fed', cat: 'Fed Oktober', c: UP, q: 'Fed erhöht am 28.10. um 25 bps?', fed: true,
      alt: 43.5, altHint: 'Keine Änderung 55,5%, Senkung unter 1%. Erste Senkung erwartet der Markt erst 2027.' },
    { key: 'rez', cat: 'US Wirtschaft', c: DOWN, q: 'US Rezession bis Ende 2026?',
      event: 'us-recession-by-end-of-2026', market: 'us-recession-by-end-of-2026',
      alt: 8.5, altHint: 'Niedrig. Die Wirtschaft läuft robust, genau deshalb erhöht die Fed.',
      hint: (p, x) => band(p) + (x.fed && !x.fed.closed ? ` Zum Vergleich: Fed Erhöhung im ${x.fed.monat} ${p1(x.fed.hike)}.` : '') },
    { key: 'clarity', cat: 'Krypto Regulierung', c: BLUE, q: 'Clarity Act wird 2026 Gesetz?',
      event: 'clarity-act-signed-into-law-in-2026', market: 'clarity-act-signed-into-law-in-2026',
      alt: 5.5, altHint: 'Nach dem gescheiterten Senatsvotum am 15.09. (49 zu 50) praktisch abgeschrieben.',
      hint: p => band(p) + ' Nach dem gescheiterten Senatsvotum am 15.09. (49 zu 50).' },
    { key: 'eth', cat: 'Ethereum', c: VIO, q: 'ETH erreicht $3.000 bis Ende 2026?',
      event: 'what-price-will-ethereum-hit-before-2027', market: 'will-ethereum-reach-3000-by-december-31-2026-from-june-8',
      extra: ['ethereum-all-time-high-by', 'ethereum-all-time-high-by-december-31-2026'],
      alt: 67.5, altHint: 'ETH steht bei rund 2.680. Neues ATH noch 2026 sieht der Markt nur bei 7,4%.',
      hint: (p, x) => { const e = coin('ETH'); return band(p) + (e ? ` ETH steht bei ${fUsd(e.current_price)}.` : '') + (x.extra != null ? ` Neues ATH noch 2026 sieht der Markt bei ${p1(x.extra)}.` : ''); } },
    { key: 'senat', cat: 'Midterms 3.11.', c: DOWN, q: 'Demokraten gewinnen den Senat?',
      event: 'which-party-will-win-the-senate-in-2026', market: 'will-the-democratic-party-control-the-senate-after-the-2026-midterm-elections',
      extra: ['which-party-will-win-the-house-in-2026', 'will-the-democratic-party-control-the-house-after-the-2026-midterm-elections'],
      alt: 62.5, altHint: 'Repräsentantenhaus sogar 92,5%. Wichtig für jeden neuen Anlauf beim Clarity Act, den im September alle Demokraten abgelehnt haben.',
      hint: (p, x) => band(p) + (x.extra != null ? ` Repräsentantenhaus ${p1(x.extra)}.` : '') + ' Wichtig für jeden neuen Anlauf beim Clarity Act, den im September alle Demokraten abgelehnt haben.' },
];

let pm = pmStart();
function pmStart() {
    const c = store.get(PM_KEY, null);
    return c && c.cards ? { quelle: 'cache', ts: c.ts, cards: c.cards, fed: c.fed || null, laedt: true, fehler: '' }
                        : { quelle: 'alt', ts: null, cards: {}, fed: null, laedt: true, fehler: '' };
}
const zeit = ts => new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const istLive = obj => !!obj && pm.quelle === 'live' && obj.ts === pm.ts;
const liste = v => Array.isArray(v) ? v : (() => { try { return JSON.parse(v || '[]'); } catch (e) { return []; } })();
function yesP(m) {
    const o = liste(m.outcomes), p = liste(m.outcomePrices);
    const v = parseFloat(p[Math.max(0, o.indexOf('Yes'))]);
    return isNaN(v) ? null : v * 100;
}
const vorbei = e => !e || !!e.closed || (e.endDate && Date.parse(e.endDate) < Date.now()) || !(e.markets || []).some(m => !m.closed);

async function pmGet(path) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
    try {
        const r = await fetch(PM_API + path, { signal: ctl.signal });
        if (!r.ok) throw new Error('Polymarket ' + r.status);
        return await r.json();
    } finally { clearTimeout(t); }
}

function fedAus(e) {
    let cut = 0, hold = 0, hike = 0, n = 0;
    for (const m of e.markets || []) {
        const t = String(m.groupItemTitle || m.question || '').toLowerCase(), p = yesP(m);
        if (p == null) continue;
        if (/increase|hike/.test(t)) hike += p; else if (/decrease|cut/.test(t)) cut += p; else if (/no change/.test(t)) hold += p; else continue;
        n++;
    }
    if (!n) return null;
    const mm = /in ([a-z]+)/i.exec(e.title || '');
    const en = (mm ? mm[1] : new Date(e.endDate || Date.now()).toLocaleString('en', { month: 'long', timeZone: 'UTC' })).toLowerCase();
    return { cut, hold, hike, monat: MONAT[en] || en, link: PM_WEB + e.slug, closed: vorbei(e), folge: e.slug !== FED_EVENT };
}
function fedWort(f) {
    const r = [['Lockernd', f.cut == null ? 0.5 : f.cut, UP], ['Abwartend', f.hold, WARN], ['Straffend', f.hike, DOWN]].sort((a, b) => b[1] - a[1]);
    return { wort: r[0][0], c: r[0][2] };
}

async function pmLaden() {
    const slugs = new Set([FED_EVENT]);
    PM.forEach(c => { if (c.event) slugs.add(c.event); if (c.extra) slugs.add(c.extra[0]); });
    const evs = await pmGet('/events?' + [...slugs].map(s => 'slug=' + encodeURIComponent(s)).join('&'));
    const by = {};
    (Array.isArray(evs) ? evs : []).forEach(e => { by[e.slug] = e; });
    let fe = by[FED_EVENT];
    if (vorbei(fe)) {
        try {
            const s = await pmGet('/public-search?q=' + encodeURIComponent('fed decision') + '&limit_per_type=20&events_status=active');
            const kand = (s.events || []).filter(e => /^fed decision in /i.test(e.title || '') && !vorbei(e))
                .sort((a, b) => Date.parse(a.endDate) - Date.parse(b.endDate));
            if (kand[0]) fe = kand[0];
        } catch (e) { /* bleibt beim alten Event, Karte zeigt dann "Markt beendet" */ }
    }
    const ts = Date.now(), cards = {};
    const fed = fe ? fedAus(fe) : null;
    if (fed) fed.ts = ts;
    for (const c of PM) {
        if (c.fed) {
            if (!fed) continue;
            cards.fed = { ts, cat: 'Fed ' + fed.monat, q: `Fed erhöht im ${fed.monat} die Zinsen?`, p: fed.hike, closed: fed.closed,
                result: fed.closed ? 'Ergebnis: ' + fedWort(fed).wort : '', link: fed.link,
                hint: (fed.folge ? 'Oktober-Sitzung vorbei, das ist die nächste Sitzung. ' : '') + `Keine Änderung ${p1(fed.hold)}, Senkung ${p1(fed.cut)}.` };
            continue;
        }
        const e = by[c.event], m = e && (e.markets || []).find(x => x.slug === c.market);
        const p = m ? yesP(m) : null;
        if (p == null) continue;
        let extra = null;
        if (c.extra) { const e2 = by[c.extra[0]], m2 = e2 && (e2.markets || []).find(x => x.slug === c.extra[1]); extra = m2 ? yesP(m2) : null; }
        const closed = !!(m.closed || e.closed);
        cards[c.key] = { ts, cat: c.cat, q: c.q, p, closed, link: PM_WEB + e.slug,
            result: closed ? (p >= 99 ? 'Ergebnis: Ja' : p <= 1 ? 'Ergebnis: Nein' : 'Ergebnis offen') : '',
            hint: c.hint(p, { vol: Number(e.volume) || 0, extra, fed }) };
    }
    if (!Object.keys(cards).length) throw new Error('Keine passenden Märkte gefunden');
    return { ts, cards: Object.assign({}, pm.cards, cards), fed: fed || pm.fed };
}

function pmKarte(c) {
    const s = pm.cards[c.key], live = istLive(s);
    const d = s || { cat: c.cat, q: c.q, p: c.alt, hint: c.altHint, link: PM_WEB + (c.fed ? FED_EVENT : c.event) };
    const stand = s ? (live ? 'Stand ' + zeit(s.ts) : 'letzter Stand ' + zeit(s.ts)) : 'Stand ' + PM_ALT_STAND;
    const status = d.closed ? `<span class="chip" style="--c:var(--ink-3)">Markt beendet</span>`
        : live ? `<span class="chip" style="--c:${UP}">live</span>` : `<span class="chip" style="--c:var(--ink-3)">nicht live</span>`;
    const konsens = !d.closed && (d.p >= 85 || d.p <= 15)
        ? `<div class="pb-small pb-kons">${icon('triangle-alert')}Konsens über 85%. Laut Regel als Contra-Indikator prüfen.</div>` : '';
    return `<div class="card sunk pb-pm${live || d.closed ? '' : ' pb-stale'}">
        <div class="pb-pm-head"><div class="eyebrow" style="color:${c.c}">${esc(d.cat)}</div>${status}</div>
        <div class="pb-q">${esc(d.q)}</div>
        <div class="bar"><i data-w="${Math.max(0, Math.min(100, d.p || 0))}" style="--c:${c.c}"></i></div>
        <div class="pb-val num" style="color:${c.c};margin-top:10px">${d.closed ? esc(d.result || 'Markt beendet') + ` <span class="pb-small">(${p1(d.p)} Ja)</span>` : p1(d.p)}</div>
        <div class="pb-small">${esc(d.hint)}</div>${konsens}
        <div class="pb-pm-foot"><span>${esc(stand)}</span><a class="pb-link" href="${esc(d.link)}" target="_blank" rel="noopener">Markt öffnen ${icon('external-link')}</a></div></div>`;
}
const pmGrid = () => PM.map(pmKarte).join('');
function pmStand() {
    const q = pm.laedt ? 'Lade Live-Quoten von Polymarket. '
        : pm.quelle === 'live' ? `Quoten live von Polymarket, Stand ${zeit(pm.ts)}, alle 5 Minuten neu. `
        : pm.quelle === 'cache' ? `Polymarket gerade nicht erreichbar${pm.fehler ? ' (' + esc(pm.fehler) + ')' : ''}. Gezeigt wird der letzte Abruf vom ${zeit(pm.ts)}, nicht live. `
        : `Polymarket gerade nicht erreichbar${pm.fehler ? ' (' + esc(pm.fehler) + ')' : ''}. Gezeigt werden die festen Werte vom ${PM_ALT_STAND}, nicht live. `;
    return q + `Die Tabelle oben zeigt Beispiele. Täglich auf <a class="pb-link" href="https://polymarket.com" target="_blank" rel="noopener">polymarket.com</a> verifizieren. Sage "Polymarket Check" für Live Daten.`;
}

function polymarket() {
    return section('pb-polymarket', 'Prediction Markets', 'Polymarket Signals',
        'Echtgeld Prediction Markets als Narrative Intelligence. Wahrscheinlichkeiten &gt; Twitter Hype. Als Contra-Indikator nutzbar wenn Konsens über 85-90%.',
        `<div class="grid g3 pb-gap" style="margin-bottom:22px" id="pbPmGrid">${pmGrid()}</div>` +
        h4('Wie Polymarket die Strategie verbessert') +
        tbl(['Signal Typ', 'Polymarket Beispiel', 'Trading Implikation'], [
            [['Bullisch', UP, 1], '"Solana ETF Approval 2026?" &gt;65% Ja', 'SOL-basierte Degen Calls bevorzugen'],
            [['Bärisch', DOWN, 1], '"BTC unter $50k?" &gt;65% Ja', 'Positionsgröße reduzieren, SL enger'],
            [['Narrative', WARN, 1], '"AI Crypto Mcap &gt;$50B?" 72% Ja', 'AI Token Calls priorisieren'],
            [['Regulierung', VIO, 1], '"US Crypto Ban?" 8% Ja', 'Kein systemisches Risiko. Normal traden.'],
        ]) +
        `<p class="pb-small" style="margin-top:14px" id="pbPmStand">${pmStand()}</p>`);
}

/* ── 7. Markt Lage ── */
const fngHist = () => (D.extras && D.extras.fng_history) || [];
function regime() {
    const m = (D.signals && D.signals.market) || {}, h = fngHist(), fng = h.length ? h[h.length - 1] : null;
    let punkte = 0, teile = 0;
    if (m.pct_above_ema50 != null) { punkte += m.pct_above_ema50; teile++; }
    if (m.avg_score != null) { punkte += m.avg_score; teile++; }
    if (fng) { punkte += fng.value; teile++; }
    const g = teile ? punkte / teile : null;
    const urteil = g == null ? 'Keine Daten' : g >= 68 ? 'Risiko an' : g >= 52 ? 'Vorsichtig positiv' : g >= 38 ? 'Abwartend' : 'Risiko aus';
    const text = g == null ? '' : g >= 68 ? 'Breite, Stimmung und Momentum ziehen in dieselbe Richtung.'
        : g >= 52 ? 'Mehr Rücken- als Gegenwind, aber ohne Übertreibung.'
        : g >= 38 ? 'Gemischtes Bild. Einzelne Coins statt breiter Einstieg.'
        : 'Die Mehrheit liegt unter ihren Durchschnitten. Geduld schlägt Aktion.';
    return { g, urteil, text, m, fng };
}
const athAbstand = b => b && b.ath && b.current_price ? (b.current_price / b.ath - 1) * 100 : (b ? b.ath_change_percentage : null);
const dominanz = () => { const gl = D.extras && D.extras.global; return gl && gl.btc_dominance != null ? gl.btc_dominance : null; };
const domFarbe = d => d == null ? DIM : d >= 50 ? UP : d >= 45 ? WARN : DOWN;
const trendWort = sg => !sg ? null : sg.above_ema200 && sg.above_ema50 ? [UP, 'Aufwärts'] : sg.above_ema50 ? [WARN, 'Erholung'] : sg.above_ema200 ? [WARN, 'Korrektur'] : [DOWN, 'Abwärts'];
const jn = v => v == null ? 'unbekannt' : v ? 'ja' : 'nein';
const pz = (v, d = 1) => v == null ? '—' : fNum(v, d) + '%';

const TAG = 'Stand: Q2 2026, Einschätzung von Nader';
const tag = (t = TAG) => `<span class="pb-tag">${icon('user-round')}${t}</span>`;
const ueberholt = grund => `<div class="pb-alt"><span class="pb-alt-chip">${icon('triangle-alert')}überholt, bitte neu bewerten</span><span class="pb-alt-grund">${grund}</span></div>`;
const liveChip = (an = true) => `<span class="chip" style="--c:${an ? UP : 'var(--ink-3)'}">${an ? 'live' : 'nicht live'}</span>`;

function fedLage() {
    const f = pm.fed || FED_ALT, live = istLive(pm.fed);
    const stand = pm.fed ? (live ? 'live, Stand ' + zeit(pm.fed.ts) : 'letzter Stand ' + zeit(pm.fed.ts)) : 'Stand ' + PM_ALT_STAND;
    return Object.assign({ live, stand }, f, fedWort(f));
}
function pmP(key) { const s = pm.cards[key]; return s && !s.closed ? s.p : null; }

function liveKacheln() {
    const b = coin('BTC'), sg = signal('btc'), gl = (D.extras && D.extras.global) || {}, r = regime(), h = fngHist(), dom = dominanz();
    const k = [];
    if (b) {
        k.push(info('Bitcoin Kurs', fUsd(b.current_price), 'var(--ink)', `24h ${fPct(b.price_change_percentage_24h)} · 7 Tage ${fPct(b.price_change_percentage_7d_in_currency)}`));
        const ab = athAbstand(b);
        k.push(info('Abstand zum Allzeithoch', fPct(ab), ab == null ? DIM : ab >= -10 ? UP : ab >= -20 ? WARN : DOWN, `ATH ${fUsd(b.ath)} · 1 Jahr ${fPct(b.price_change_percentage_1y)}`));
    }
    const tw = trendWort(sg);
    if (tw) k.push(info('BTC Trend', tw[1], tw[0], `Über 50 Tage EMA: ${jn(sg.above_ema50)} · über 200 Tage EMA: ${jn(sg.above_ema200)}${sg.rsi != null ? ' · RSI ' + fNum(sg.rsi, 0) : ''}`));
    if (dom != null) k.push(info('BTC Dominanz', pz(dom), domFarbe(dom), 'Regel: über 50% Bias bullish, unter 45% Warnsignal'));
    if (gl.total_mcap != null) k.push(info('Gesamtmarkt', fBig(gl.total_mcap), 'var(--ink)', `24h ${fPct(gl.mcap_chg_24h)} · Volumen ${fBig(gl.volume_24h)}`));
    if (r.fng) {
        const vor = h.length > 7 ? h[h.length - 8] : null, diff = vor ? r.fng.value - vor.value : null;
        k.push(info('Angst und Gier', fNum(r.fng.value), scoreVar(r.fng.value), esc(r.fng.label || '') + (diff != null ? ` · 7 Tage ${diff > 0 ? '+' : ''}${diff}` : '')));
    }
    if (r.m.pct_above_ema50 != null) k.push(info('Marktbreite', pz(r.m.pct_above_ema50, 0), scoreVar(r.m.pct_above_ema50), `der Coins über der 50-Tage-Linie · über 200-Tage-Linie ${pz(r.m.pct_above_ema200, 0)}`));
    if (r.g != null) k.push(info('Marktregime', esc(r.urteil), scoreVar(r.g), `${fNum(r.g, 0)} von 100. ${r.text}`));
    if (!k.length) return `<div class="empty">Keine Marktdaten geladen.</div>`;
    return `<div class="grid g-auto pb-infos">${k.join('')}</div>`;
}

const MPD = () => (typeof window !== 'undefined' && window.MARKT_PLUS_DATA) || null;
const fred = id => { const d = MPD(); return (d && d.makro && d.makro[id]) || null; };
const datumDE = s => { const p = String(s || '').split('-'); return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : esc(s || ''); };
function fredWert(id, s) {
    if (!s || s.wert == null) return '—';
    if (id === 'M2SL') return fBig(s.wert * 1e9);
    if (id === 'SP500') return fNum(s.wert, 0);
    if (s.art === 'pp') return fNum(s.wert, 2) + '%';
    return fNum(s.wert, 2);
}
const fredChg = (s, v) => v == null ? '—' : s.art === 'pp' ? (v > 0 ? '+' : '') + fNum(v, 2) + ' Pp' : fPct(v, 1);
const FRED_KACHELN = [
    ['DTWEXBGS', 'Dollar-Index (breit)', -1, 'Fed-Index gegen einen breiten Währungskorb, nicht der ICE-DXY.'],
    ['SP500', 'S&P 500', 1, 'Risikoappetit an der Börse.'],
    ['T10YIE', 'Inflationserwartung 10 Jahre', -1, 'Aus Anleihen abgeleitet, nicht der CPI.'],
    ['DFF', 'Leitzins effektiv', -1, 'Fed Funds Rate, tägliches Mittel.'],
    ['DGS10', '10J-Rendite USA', -1, 'Steigende Renditen ziehen Geld aus Risiko.'],
    ['M2SL', 'Geldmenge M2', 1, 'Monatlich. Wachsende Liquidität trägt Krypto.'],
];
function fredWind(s, wirkung) {
    const v = s.chg_3m;
    if (v == null) return [DIM, 'Trend offen'];
    const schwelle = s.art === 'pp' ? 0.1 : 0.5;
    if (Math.abs(v) < schwelle) return [WARN, 'seitwärts'];
    return (v > 0) === (wirkung > 0) ? [UP, 'Rückenwind'] : [DOWN, 'Gegenwind'];
}
function fredZeile(id) {
    const s = fred(id);
    if (!s || s.wert == null) return '';
    return `FRED heute: ${esc(s.name)} ${fredWert(id, s)} (${datumDE(s.datum)}), 1 Monat ${fredChg(s, s.chg_1m)}, 3 Monate ${fredChg(s, s.chg_3m)}`;
}
function fredKacheln() {
    const d = MPD();
    if (!d || !d.makro) return `<div class="empty">Keine FRED-Daten. fetch_markt_plus.py ausführen.</div>`;
    const k = FRED_KACHELN.map(([id, label, wirkung, hinweis]) => {
        const s = fred(id); if (!s) return '';
        const [c, wort] = fredWind(s, wirkung);
        const verlauf = (s.verlauf || []).map(p => p[1]);
        const trend = id === 'M2SL' && s.chg_1j != null ? ` · 1 Jahr ${fPct(s.chg_1j, 1)}` : '';
        return `<div class="card sunk pb-info${s.veraltet ? ' pb-stale' : ''}">
            <div class="pb-pm-head"><div class="eyebrow">${esc(label)}</div><span class="chip" style="--c:${c}">${wort}</span></div>
            <div class="pb-val num">${fredWert(id, s)}</div>
            <div class="pb-small">1 Monat ${fredChg(s, s.chg_1m)} · 3 Monate ${fredChg(s, s.chg_3m)}${trend}</div>
            <div class="pb-fred-sp">${sparkline(verlauf, 160, 26, c)}</div>
            <div class="pb-small dim">${esc(hinweis)} Stand ${datumDE(s.datum)}${s.veraltet ? ', alter Stand' : ''}.</div></div>`;
    }).join('');
    return `<div class="grid g-auto pb-infos" style="margin-bottom:22px">${k}</div>`;
}

function makroKarten() {
    const f = fedLage();
    const fed = `<div class="card sunk pb-info${f.live ? '' : ' pb-stale'}">
        <div class="pb-pm-head"><div class="eyebrow">Fed Zinspolitik</div>${liveChip(f.live)}</div>
        <div class="pb-val num" style="color:${f.c}">${f.closed ? 'Sitzung vorbei' : f.wort}</div>
        <div class="pb-small">Abgeleitet aus Polymarket, Sitzung ${esc(f.monat)}: Keine Änderung ${p1(f.hold)}, Erhöhung ${p1(f.hike)}, Senkung ${p1(f.cut)}. ${esc(f.stand)}. <a class="pb-link" href="${esc(f.link)}" target="_blank" rel="noopener">Markt</a></div>
        <div class="pb-was">${tag('Q2 2026, Nader')}<div class="pb-small">Lockernd. Zinssenkungszyklus seit Sep 2024. Aktuell 4.00-4.25%.</div></div>
        ${f.wort !== 'Lockernd' ? ueberholt(`Polymarket preist für die Sitzung im ${esc(f.monat)} keine Lockerung ein (Senkung ${p1(f.cut)}).`) : ''}
    </div>`;
    const meinung = (label, value, c, sub, live = '', alt = '') => `<div class="card sunk pb-info">
        <div class="pb-pm-head"><div class="eyebrow">${label}</div>${tag('Q2 2026')}</div>
        <div class="pb-val num" style="color:${c}">${value}</div><div class="pb-small">${sub}</div>
        ${live ? `<div class="pb-livezeile">${icon('radio')}${live}</div>` : ''}${alt}</div>`;
    const rez = pmP('rez'), cla = pmP('clarity');
    const dx = fred('DTWEXBGS'), sp = fred('SP500');
    const dxAlt = dx && dx.chg_3m != null && dx.chg_3m > 1 ? ueberholt(`Der breite Dollar-Index ist in 3 Monaten um ${fPct(dx.chg_3m, 1)} gestiegen, also nicht schwächer.`) : '';
    const spAlt = sp && sp.chg_3m != null && sp.chg_3m > 5 ? ueberholt(`Der S&amp;P 500 liegt 3 Monate ${fPct(sp.chg_3m, 1)} im Plus, von Druck ist nichts zu sehen.`) : '';
    return `<div class="grid g-auto pb-infos" style="margin-bottom:22px">
        ${fed}
        ${meinung('US Dollar (DXY)', 'Schwächer', UP, 'Schwacher Dollar historisch positiv für BTC.', fredZeile('DTWEXBGS'), dxAlt)}
        ${meinung('Aktienmarkt', 'Volatil', WARN, 'S&amp;P unter Druck durch Zölle. Nasdaq KI Boom als Gegengewicht.', fredZeile('SP500'), spAlt)}
        ${meinung('Inflation (CPI)', '2.4-2.8%', WARN, 'Normalisiert aber über 2% Ziel. Hartnäckige Kerninflation.', fredZeile('T10YIE'))}
        ${meinung('Handelskrieg', 'Eskaliert', DOWN, 'Trump Zölle 2025. Rezessionsangst steigt.', rez != null ? `Polymarket heute: US Rezession bis Ende 2026 ${p1(rez)}` : '')}
        ${meinung('Krypto Regulierung', 'Pro-Krypto', UP, 'Trump Administration pro-Krypto. Strategic BTC Reserve diskutiert.', cla != null ? `Polymarket heute: Clarity Act wird 2026 Gesetz ${p1(cla)}` : '')}
    </div>`;
}

function urteile() {
    const r = regime(), f = fedLage(), sg = signal('btc'), dom = dominanz(), b = coin('BTC');
    const verdict = (label, value, c, sub, live, alt) => `<div class="card pb-verdict" style="--c:${c}"><div class="eyebrow">${label}</div><div class="big num pb-vv">${value}</div><div class="pb-small">${sub}</div>
        <div class="pb-livezeile pb-center">${icon('radio')}<span>${live}</span></div>${alt || ''}</div>`;
    const biasBruch = [];
    if (sg && sg.above_ema50 === false) biasBruch.push('BTC unter der 50 Tage EMA');
    if (dom != null && dom <= 50) biasBruch.push(`Dominanz ${pz(dom)}`);
    const tw = trendWort(sg);
    return `<div class="grid g3 pb-gap" style="margin-bottom:22px">
        ${verdict('Makro', 'BULLISH', UP, 'Liquiditäts Zyklus und Pro Krypto Politik',
            `Jetzt: Regime ${esc(r.urteil)}${r.g != null ? ' (' + fNum(r.g, 0) + ' von 100)' : ''}, Fed ${esc(f.wort.toLowerCase())}`,
            f.wort !== 'Lockernd' ? ueberholt(`Der Liquiditäts Zyklus setzt eine lockernde Fed voraus. Polymarket: Senkung ${p1(f.cut)}, Erhöhung ${p1(f.hike)} im ${esc(f.monat)}.`) : '')}
        ${verdict('Bitcoin', 'BULLISH', UP, 'Late Bull. ETF Flows stark. Reserve Narrativ als Wildcard.',
            `Jetzt: ${b ? fUsd(b.current_price) + ', ' + fPct(athAbstand(b)) + ' zum ATH' : 'keine Kursdaten'}${tw ? ', Trend ' + tw[1].toLowerCase() : ''}`,
            biasBruch.length ? ueberholt('Naders Bias Regel ist gebrochen: ' + biasBruch.join(', ') + '.') : '')}
        ${verdict('Altcoins', 'SELEKTIV', WARN, 'AI/RWA bullish. Breite Hausse nach BTC Stabilisierung möglich.',
            `Jetzt: ${pz(r.m.pct_above_ema50, 0)} der Coins über der 50-Tage-Linie, BTC Dominanz ${pz(dom)}`)}
    </div>`;
}

function abgleich() {
    const sg = signal('btc'), dom = dominanz(), b = coin('BTC'), ab = athAbstand(b);
    const monate = Math.floor((Date.now() - Date.parse('2024-04-20T00:00:00Z')) / (30.44 * 864e5));
    const zeilen = [
        [sg ? (sg.above_ema50 ? 'ok' : 'nein') : 'info', 'Bias Bedingung: BTC über 50 Tage EMA', sg ? (sg.above_ema50 ? 'erfüllt' : 'nicht erfüllt') : 'keine Signaldaten'],
        [dom == null ? 'info' : dom > 50 ? 'ok' : 'nein', 'Bias Bedingung: BTC Dominanz über 50%', dom == null ? 'keine Daten' : 'aktuell ' + pz(dom)],
        [dom == null ? 'info' : dom >= 45 ? 'ok' : 'nein', 'Warnsignal Zykluswende: Dominanz unter 45%', dom == null ? 'keine Daten' : dom >= 45 ? 'nicht ausgelöst' : 'ausgelöst'],
        [ab == null ? 'info' : ab > -20 ? 'ok' : 'nein', 'Phase "Late Bull"', ab == null ? 'keine Kursdaten' : `BTC ${fNum(Math.abs(ab), 1)}% unter dem Allzeithoch${b && b.price_change_percentage_1y != null ? ', 1 Jahr ' + fPct(b.price_change_percentage_1y) : ''}. Ab 20% unter dem Hoch spricht man üblicherweise von Bärenmarkt.`],
        ['info', 'Zeit seit dem Halving', `heute rund ${monate} Monate (Text: ca. 24 Monate)`],
    ];
    const ICO = { ok: ['check', UP], nein: ['x', DOWN], info: ['info', DIM] };
    const bias = (sg && sg.above_ema50 === false) || (dom != null && dom <= 50);
    const phase = ab != null && ab <= -20;
    const grund = [bias ? 'Die Bias Bedingungen sind nicht mehr erfüllt.' : '', phase ? `Late Bull passt nicht zu ${fNum(Math.abs(ab), 1)}% unter dem Allzeithoch.` : ''].filter(Boolean).join(' ');
    return `<div class="pb-abgleich">
        <div class="pb-h4row"><h4 class="pb-h4">Abgleich mit Live-Daten</h4>${grund ? ueberholt(grund) : ''}</div>
        ${zeilen.map(([st, k, v]) => `<div class="pb-check" style="--c:${ICO[st][1]}"><span class="pb-check-ico">${icon(ICO[st][0])}</span><span class="pb-check-k">${k}</span><span class="pb-check-v">${v}</span></div>`).join('')}
    </div>`;
}

function marktlageInhalt() {
    const st = D.extras && D.extras.updated;
    return `<div class="pb-h4row" style="margin-top:0"><h4 class="pb-h4">Live Lage aus den Dashboard-Daten</h4>${liveChip(true)}<span class="pb-small dim">Kurse live${st ? ', Marktdaten Stand ' + esc(st) : ''}</span></div>
        ${liveKacheln()}
        <div class="pb-h4row"><h4 class="pb-h4">Makro</h4><span class="pb-small dim">Fed live aus Polymarket, der Rest ist Naders Einschätzung, daneben die FRED-Werte</span></div>
        ${makroKarten()}
        <div class="pb-h4row"><h4 class="pb-h4">Makro live aus FRED</h4>${liveChip(!!(MPD() && MPD().makro))}<span class="pb-small dim">St. Louis Fed, täglich (M2 monatlich)${MPD() && MPD().updated ? ', abgerufen ' + esc(MPD().updated) : ''}. Rücken- oder Gegenwind für Krypto nach dem 3-Monats-Trend.</span></div>
        ${fredKacheln()}
        <div class="pb-h4row"><h4 class="pb-h4">Urteil</h4>${tag()}</div>
        ${urteile()}
        <div class="pb-note pb-cycle">
            <div style="margin-bottom:10px">${tag()}</div>
            <strong style="color:var(--ink)">Bitcoin Einschätzung Q2 2026:</strong> Ca. 24 Monate nach dem Halving (April 2024). Institutionelle Nachfrage via Spot ETFs (BlackRock IBIT, Fidelity FBTC) schafft permanenten Kaufdruck. Strategic Bitcoin Reserve wäre historischer Katalysator. Historisch "Late Bull" Phase mit hoher Volatilität. Volumenabnahme oder Divergenzen im Orderflow sind frühe Warnsignale.<br><br>
            <strong style="color:${UP}">Bias: Bullish</strong> solange über 50 Tage EMA und BTC Dominanz über 50%.<br>
            <strong style="color:${DOWN}">Watch Risiken:</strong> Aktiencrash, Inflationsanstieg, Geopolitik (Taiwan), Stablecoin Krise, Exchange Hack. BTC-Dominanz unter 45% = Warnsignal für Zykluswende.
            ${abgleich()}
        </div>`;
}

function marktlage() {
    return section('pb-marktlage', 'Makro Kontext', 'Markt Lage &amp; Makro',
        'Der große Rahmen. Fed, Dollar, Aktien, Inflation, Handelskrieg. Alles was den Krypto Markt von außen beeinflusst.',
        `<div id="pbMl">${marktlageInhalt()}</div>`);
}

/* ── 8. Scan Zeiten ── */
function scantimes() {
    const scan = (tag, c, hours, desc) => `<div class="card sunk pb-scan" style="--c:${c}"><div class="eyebrow" style="color:${c}">${tag}</div><div class="pb-hours num">${hours}</div><div class="pb-small">${desc}</div></div>`;
    return section('pb-scantimes', 'Timing', 'Beste Scan Zeiten',
        'Solana und Base Degen Activity ist stark zeitabhängig. Zur richtigen Zeit scannen = höhere Chance auf frische Calls mit echtem Momentum.',
        `<div class="grid g3 pb-gap" style="margin-bottom:22px">
            ${scan('Prime Time #1', HOT, '14:00 bis 17:00', 'US Pre Market + NY Open. Maximale Liquidität.')}
            ${scan('Prime Time #2', HOT, '21:00 bis 23:00', 'US Evening. Höchstes Retail Volume. PumpFun Peak.')}
            ${scan('Aktiv', UP, '09:00 bis 12:00', 'EU Morning, London Open. Base Chain oft aktiv.')}
            ${scan('Aktiv', UP, '18:00 bis 21:00', 'US Market Nachklang. Guter Entry Zeitraum.')}
            ${scan('Durchschnittlich', WARN, '12:00 bis 14:00', 'Pre US Session, oft ruhig. Watchlist Updates OK.')}
            ${scan('Schwach', DOWN, '00:00 bis 07:00', 'Nacht/Asia Session. Solana &amp; Base sehr ruhig.')}
        </div>` +
        h4('Wochentag Faktor') +
        `<div class="grid g-auto pb-infos">
            ${info('Freitag 20:00+', 'HOT', HOT, 'Höhere Degen Activity, Wochenend Hype beginnt')}
            ${info('Wochenende', 'HOT', HOT, 'Sa/So = maximale Retail Activity')}
            ${info('Montag morgens', 'SCHWACH', DOWN, 'Markt "erwacht" langsam, oft schwach')}
            ${info('Di bis Do Prime', 'STABIL', UP, 'Stabilste Wochentage für Momentum Calls')}
        </div>`);
}

let onScroll = null, scroller = null, onLive = null, pmTimer = null, lauf = 0;

function fuellen(el) {
    icons(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.bar i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; })));
}
function neuZeichnen(root, mitPm) {
    if (!root.isConnected) return;
    const ml = root.querySelector('#pbMl'), grid = root.querySelector('#pbPmGrid'), st = root.querySelector('#pbPmStand');
    if (ml) { ml.innerHTML = marktlageInhalt(); icons(ml); }
    if (mitPm && grid) { grid.innerHTML = pmGrid(); fuellen(grid); }
    if (st) st.innerHTML = pmStand();
}
async function pmAktualisieren(root) {
    const id = ++lauf;
    try {
        const neu = await pmLaden();
        if (id !== lauf) return;
        pm = Object.assign({ quelle: 'live', laedt: false, fehler: '' }, neu);
        store.set(PM_KEY, { ts: neu.ts, cards: neu.cards, fed: neu.fed });
    } catch (e) {
        if (id !== lauf) return;
        pm.laedt = false;
        if (pm.quelle === 'live') pm.quelle = 'cache';
        pm.fehler = e && e.name === 'AbortError' ? 'Zeitüberschreitung' : String((e && e.message) || 'Fehler');
    }
    neuZeichnen(root, true);
}

export default {
    styles: `
        .pb-nav { position: sticky; top: 0; z-index: 5; display: flex; gap: 8px; flex-wrap: wrap; padding: 10px 12px; border-radius: var(--r-lg); background: color-mix(in srgb, var(--surface) 88%, transparent); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: var(--sh-sm); }
        .pb-nav button { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: var(--r-pill); font-family: var(--mono); font-size: .66rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); transition: color .25s var(--ease), background .25s var(--ease), box-shadow .25s var(--ease); }
        .pb-nav button svg { width: 13px; height: 13px; }
        .pb-nav button:hover { color: var(--ink); }
        .pb-nav button.on { background: var(--bg); color: var(--ink); box-shadow: var(--sh-in); }
        .pb-nav button.on svg { color: var(--pg); }
        .pb-sec { scroll-margin-top: 78px; }
        .pb-sec-head { display: flex; align-items: center; gap: 14px; }
        .pb-ico { width: 40px; height: 40px; border-radius: 13px; color: var(--pg); flex: none; }
        .pb-ico svg { width: 18px; height: 18px; }
        .pb-desc { margin: 12px 0 20px; }
        .pb-h4 { font-family: var(--mono); font-size: .66rem; letter-spacing: .16em; text-transform: uppercase; color: var(--c, var(--pg)); font-weight: 500; margin: 24px 0 10px; }
        .pb-sec .pb-desc + .pb-h4, .pb-gap .pb-h4 { margin-top: 0; }
        .pb-h3 { font-size: 1.02rem; font-weight: 500; margin: 6px 0 12px; }
        .pb-tbl td { white-space: normal; min-width: 96px; line-height: 1.45; font-size: .84rem; }
        .pb-tbl th { background: transparent; position: static; }
        .pb-gap { gap: 18px; }
        .pb-pillar { padding: 18px 20px; }
        .pb-pillar .tbl-wrap { margin: 0 -6px; }
        .pb-kopf { font-family: var(--mono); font-size: .62rem; letter-spacing: .14em; text-transform: uppercase; color: var(--pg); margin-bottom: 6px; }
        .pb-quote { font-size: .86rem; color: var(--ink-2); line-height: 1.7; padding-left: 12px; border-left: 2px solid var(--line); margin-bottom: 14px; font-weight: 300; }
        .pb-small { font-size: .8rem; color: var(--ink-2); line-height: 1.5; font-weight: 300; }
        .pb-code, .pb-mono { font-family: var(--mono); font-size: .76rem; color: var(--ink-2); line-height: 1.7; word-break: break-word; }
        .pb-code { margin-top: 12px; padding: 12px 14px; border-radius: var(--r-sm); background: var(--surface); box-shadow: var(--sh-sm); }
        .pb-score { display: grid; gap: 5px; margin-top: 12px; font-size: .84rem; }
        .pb-score span { color: var(--ink-2); }
        .pb-note { margin-top: 18px; padding: 14px 18px; border-radius: var(--r-md); background: color-mix(in srgb, var(--pg) 8%, transparent); border-left: 3px solid var(--pg); font-size: .86rem; color: var(--ink-2); line-height: 1.65; font-weight: 300; }
        .pb-note strong { color: var(--pg); font-weight: 600; }
        .pb-cycle { margin-top: 0; }
        .pb-rules { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .pb-rules li { position: relative; padding: 10px 14px 10px 34px; border-radius: var(--r-sm); background: var(--bg); box-shadow: var(--sh-in); font-size: .86rem; color: var(--ink-2); line-height: 1.45; }
        .pb-rules li::before { content: ''; position: absolute; left: 14px; top: 17px; width: 7px; height: 7px; border-radius: 50%; background: var(--ink-3); }
        .pb-rules li.pb-hart { color: var(--down); font-weight: 600; }
        .pb-rules li.pb-hart::before { background: var(--down); }
        .pb-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
        .pb-flow-item { padding: 8px 14px; border-radius: var(--r-pill); background: var(--bg); box-shadow: var(--sh-in); font-family: var(--mono); font-size: .7rem; letter-spacing: .06em; color: var(--ink); }
        .pb-flow-arrow { color: var(--ink-3); display: grid; place-items: center; }
        .pb-flow-arrow svg { width: 14px; height: 14px; }
        .pb-stufe { font-weight: 600; padding: 5px 12px; }
        .pb-infos { gap: 14px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
        .pb-info { padding: 16px 18px; }
        .pb-val { font-size: 1.25rem; font-weight: 400; margin: 8px 0 6px; letter-spacing: -.01em; }
        .pb-ampel { display: flex; align-items: flex-start; gap: 14px; padding: 14px 18px; border-radius: var(--r-md); background: color-mix(in srgb, var(--c) 8%, transparent); border: 1px solid color-mix(in srgb, var(--c) 22%, transparent); font-size: .88rem; color: var(--ink-2); line-height: 1.55; }
        .pb-ampel strong { color: var(--c); }
        .pb-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--c); box-shadow: 0 0 10px color-mix(in srgb, var(--c) 50%, transparent); flex: none; margin-top: 5px; }
        .pb-skull { color: var(--c); flex: none; margin-top: 2px; display: grid; }
        .pb-skull svg { width: 16px; height: 16px; }
        .pb-chain { font-weight: 600; font-size: .92rem; margin-bottom: 8px; }
        .pb-pm { padding: 18px 20px; }
        .pb-q { font-size: .96rem; font-weight: 500; margin: 8px 0 14px; line-height: 1.35; }
        .pb-verdict { text-align: center; padding: 20px; background: linear-gradient(135deg, color-mix(in srgb, var(--c) 12%, var(--surface)), var(--surface)); }
        .pb-vv { color: var(--c); font-size: 1.7rem; margin: 8px 0; }
        .pb-scan { padding: 16px 18px; background: color-mix(in srgb, var(--c) 7%, var(--bg)); }
        .pb-hours { font-size: 1.3rem; font-weight: 400; margin: 8px 0 6px; }
        .pb-link { color: var(--pg); text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--pg) 40%, transparent); }
        .pb-foot { text-align: center; font-size: .74rem; color: var(--ink-3); line-height: 1.5; padding: 4px 12px; }
        .pb-link svg { width: 11px; height: 11px; vertical-align: -1px; }
        .pb-pm-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
        .pb-pm-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); font-family: var(--mono); font-size: .64rem; letter-spacing: .04em; color: var(--ink-3); }
        .pb-stale .bar, .pb-stale .pb-val { opacity: .62; }
        .pb-kons { display: flex; align-items: center; gap: 6px; margin-top: 8px; color: var(--warn); }
        .pb-kons svg { width: 13px; height: 13px; flex: none; }
        .pb-h4row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 24px 0 12px; }
        .pb-h4row .pb-h4 { margin: 0; }
        .pb-tag { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: var(--r-pill); border: 1px dashed color-mix(in srgb, var(--ink-3) 55%, transparent); font-family: var(--mono); font-size: .6rem; letter-spacing: .06em; color: var(--ink-2); white-space: nowrap; }
        .pb-tag svg { width: 11px; height: 11px; color: var(--pg); }
        .pb-was { margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--line); display: grid; gap: 6px; justify-items: start; }
        .pb-livezeile { display: flex; align-items: flex-start; gap: 7px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); font-size: .78rem; color: var(--ink); line-height: 1.45; }
        .pb-livezeile svg { width: 13px; height: 13px; color: var(--up); flex: none; margin-top: 2px; }
        .pb-center { justify-content: center; }
        .pb-alt { display: grid; gap: 5px; justify-items: start; margin-top: 10px; text-align: left; }
        .pb-h4row .pb-alt { margin-top: 0; }
        .pb-verdict .pb-alt { justify-items: center; text-align: center; }
        .pb-alt-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--warn) 14%, transparent); color: var(--warn); font-family: var(--mono); font-size: .62rem; letter-spacing: .06em; font-weight: 600; }
        .pb-alt-chip svg { width: 12px; height: 12px; }
        .pb-alt-grund { font-size: .76rem; color: var(--ink-2); line-height: 1.45; font-weight: 300; }
        .pb-abgleich { margin-top: 6px; padding-top: 4px; border-top: 1px solid color-mix(in srgb, var(--pg) 25%, transparent); }
        .pb-check { display: grid; grid-template-columns: 22px minmax(0, 1fr) minmax(0, 1.4fr); gap: 10px; align-items: start; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: .82rem; }
        .pb-check:last-child { border-bottom: 0; }
        .pb-check-ico { color: var(--c); display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: color-mix(in srgb, var(--c) 14%, transparent); }
        .pb-check-ico svg { width: 13px; height: 13px; }
        .pb-check-k { color: var(--ink); font-weight: 400; }
        .pb-check-v { color: var(--ink-2); }
        .pb-fred-sp { margin: 8px 0 6px; }
        .pb-fred-sp svg { display: block; max-width: 100%; }
        @media (max-width: 1180px) { .pb-gap.g3 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 860px) {
            .pb-gap.g2, .pb-gap.g3 { grid-template-columns: minmax(0, 1fr); }
            .pb-nav { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; border-radius: var(--r-md); }
            .pb-nav::-webkit-scrollbar { display: none; }
            .pb-nav button { white-space: nowrap; flex: none; }
            .pb-tbl td { min-width: 120px; }
            .pb-check { grid-template-columns: 22px minmax(0, 1fr); }
            .pb-check-v { grid-column: 2; }
            .pb-tag { white-space: normal; }
        }`,
    render(root) {
        root.classList.add('stack');
        root.innerHTML = pageHead('Wissen', 'Playbook', 'Dein komplettes Trading Wissen auf einer Seite. Orderflow, Degen System, RugCheck, Polymarket, Markt Lage, Scan Zeiten und alle Regeln.') +
            `<nav class="pb-nav" id="pbNav">${SECTIONS.map(([id, label, ic], i) => `<button data-pb="${id}" class="${i === 0 ? 'on' : ''}">${icon(ic)}${esc(label)}</button>`).join('')}</nav>` +
            orderflow() + pillars() + rules() + degen() + rugcheck() + polymarket() + marktlage() + scantimes() +
            `<div class="pb-foot">Keine Anlageberatung. Alle Analysen sind Perspektiven und Einschätzungen, keine Kauf- oder Verkaufsempfehlungen. NFA. DYOR.</div>`;

        const nav = root.querySelector('#pbNav');
        const mark = id => nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.pb === id));
        let lock = 0;
        nav.onclick = e => {
            const b = e.target.closest('button[data-pb]'); if (!b) return;
            const ziel = root.querySelector('#' + b.dataset.pb); if (!ziel) return;
            mark(b.dataset.pb); lock = Date.now() + 900;
            ziel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        this.destroy();
        scroller = document.querySelector('.main') || window;
        onScroll = () => {
            if (Date.now() < lock || !root.isConnected) return;
            let cur = SECTIONS[0][0];
            for (const [id] of SECTIONS) {
                const el = root.querySelector('#' + id);
                if (el && el.getBoundingClientRect().top - nav.getBoundingClientRect().bottom < 60) cur = id;
            }
            mark(cur);
        };
        scroller.addEventListener('scroll', onScroll, { passive: true });

        pmAktualisieren(root);
        pmTimer = setInterval(() => pmAktualisieren(root), PM_TAKT);
        onLive = () => neuZeichnen(root, false);
        document.addEventListener('cb2:live', onLive);
    },
    destroy() {
        if (scroller && onScroll) scroller.removeEventListener('scroll', onScroll);
        scroller = null; onScroll = null;
        if (onLive) { document.removeEventListener('cb2:live', onLive); onLive = null; }
        if (pmTimer) { clearInterval(pmTimer); pmTimer = null; }
        lauf++;
    },
};
