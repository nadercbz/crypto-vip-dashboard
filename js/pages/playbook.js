import { esc } from '../core/fmt.js';
import { pageHead, icon } from '../core/ui.js';

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
const PM = [
    ['Bitcoin Preis', WARN, 'Erreicht BTC $95K bis Ende 2026?', 49.5, '49,5%', 'Münzwurf. BTC steht bei rund 83,6k. 71 Mio Dollar Volumen, der meistgehandelte Krypto-Markt.'],
    ['Fed Oktober', UP, 'Fed erhöht am 28.10. um 25 bps?', 43.5, '43,5%', 'Keine Änderung 55,5%, Senkung unter 1%. Erste Senkung erwartet der Markt erst 2027.'],
    ['US Wirtschaft', DOWN, 'US Rezession bis Ende 2026?', 8.5, '8,5%', 'Niedrig. Die Wirtschaft läuft robust, genau deshalb erhöht die Fed.'],
    ['Krypto Regulierung', BLUE, 'Clarity Act wird 2026 Gesetz?', 5.5, '5,5%', 'Nach dem gescheiterten Senatsvotum am 15.09. (49 zu 50) praktisch abgeschrieben.'],
    ['Ethereum', VIO, 'ETH erreicht $3.000 bis Ende 2026?', 67.5, '67,5%', 'ETH steht bei rund 2.680. Neues ATH noch 2026 sieht der Markt nur bei 7,4%.'],
    ['Midterms 3.11.', DOWN, 'Demokraten gewinnen den Senat?', 62.5, '62,5%', 'Repräsentantenhaus sogar 92,5%. Wichtig für jeden neuen Anlauf beim Clarity Act, den im September alle Demokraten abgelehnt haben.'],
];
function polymarket() {
    return section('pb-polymarket', 'Prediction Markets', 'Polymarket Signals',
        'Echtgeld Prediction Markets als Narrative Intelligence. Wahrscheinlichkeiten &gt; Twitter Hype. Als Contra-Indikator nutzbar wenn Konsens über 85-90%.',
        `<div class="grid g3 pb-gap" style="margin-bottom:22px">${PM.map(([cat, c, q, w, p, hint]) => `<div class="card sunk pb-pm">
            <div class="eyebrow" style="color:${c}">${cat}</div>
            <div class="pb-q">${q}</div>
            <div class="bar"><i data-w="${w}" style="--c:${c}"></i></div>
            <div class="pb-val num" style="color:${c};margin-top:10px">${p}</div>
            <div class="pb-small">${hint}</div></div>`).join('')}</div>` +
        h4('Wie Polymarket die Strategie verbessert') +
        tbl(['Signal Typ', 'Polymarket Beispiel', 'Trading Implikation'], [
            [['Bullisch', UP, 1], '"Solana ETF Approval 2026?" &gt;65% Ja', 'SOL-basierte Degen Calls bevorzugen'],
            [['Bärisch', DOWN, 1], '"BTC unter $50k?" &gt;65% Ja', 'Positionsgröße reduzieren, SL enger'],
            [['Narrative', WARN, 1], '"AI Crypto Mcap &gt;$50B?" 72% Ja', 'AI Token Calls priorisieren'],
            [['Regulierung', VIO, 1], '"US Crypto Ban?" 8% Ja', 'Kein systemisches Risiko. Normal traden.'],
        ]) +
        `<p class="pb-small" style="margin-top:14px">Quoten: Stand 30.09.2026, live von Polymarket gezogen. Die Tabelle oben zeigt Beispiele. Täglich auf <a class="pb-link" href="https://polymarket.com" target="_blank" rel="noopener">polymarket.com</a> verifizieren. Sage "Polymarket Check" für Live Daten.</p>`);
}

/* ── 7. Markt Lage ── */
function marktlage() {
    const verdict = (label, value, c, sub) => `<div class="card pb-verdict" style="--c:${c}"><div class="eyebrow">${label}</div><div class="big num pb-vv">${value}</div><div class="pb-small">${sub}</div></div>`;
    return section('pb-marktlage', 'Makro Kontext', 'Markt Lage &amp; Makro',
        'Der große Rahmen. Fed, Dollar, Aktien, Inflation, Handelskrieg. Alles was den Krypto Markt von außen beeinflusst.',
        `<div class="grid g-auto pb-infos" style="margin-bottom:22px">
            ${info('Fed Zinspolitik', 'Lockernd', UP, 'Zinssenkungszyklus seit Sep 2024. Aktuell 4.00-4.25%.')}
            ${info('US Dollar (DXY)', 'Schwächer', UP, 'Schwacher Dollar historisch positiv für BTC.')}
            ${info('Aktienmarkt', 'Volatil', WARN, 'S&amp;P unter Druck durch Zölle. Nasdaq KI Boom als Gegengewicht.')}
            ${info('Inflation (CPI)', '2.4-2.8%', WARN, 'Normalisiert aber über 2% Ziel. Hartnäckige Kerninflation.')}
            ${info('Handelskrieg', 'Eskaliert', DOWN, 'Trump Zölle 2025. Rezessionsangst steigt.')}
            ${info('Krypto Regulierung', 'Pro-Krypto', UP, 'Trump Administration pro-Krypto. Strategic BTC Reserve diskutiert.')}
        </div>
        <div class="grid g3 pb-gap" style="margin-bottom:22px">
            ${verdict('Makro', 'BULLISH', UP, 'Liquiditäts Zyklus und Pro Krypto Politik')}
            ${verdict('Bitcoin', 'BULLISH', UP, 'Late Bull. ETF Flows stark. Reserve Narrativ als Wildcard.')}
            ${verdict('Altcoins', 'SELEKTIV', WARN, 'AI/RWA bullish. Breite Hausse nach BTC Stabilisierung möglich.')}
        </div>
        <div class="pb-note pb-cycle">
            <strong style="color:var(--ink)">Bitcoin Einschätzung Q2 2026:</strong> Ca. 24 Monate nach dem Halving (April 2024). Institutionelle Nachfrage via Spot ETFs (BlackRock IBIT, Fidelity FBTC) schafft permanenten Kaufdruck. Strategic Bitcoin Reserve wäre historischer Katalysator. Historisch "Late Bull" Phase mit hoher Volatilität. Volumenabnahme oder Divergenzen im Orderflow sind frühe Warnsignale.<br><br>
            <strong style="color:${UP}">Bias: Bullish</strong> solange über 50 Tage EMA und BTC Dominanz über 50%.<br>
            <strong style="color:${DOWN}">Watch Risiken:</strong> Aktiencrash, Inflationsanstieg, Geopolitik (Taiwan), Stablecoin Krise, Exchange Hack. BTC-Dominanz unter 45% = Warnsignal für Zykluswende.
        </div>`);
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

let onScroll = null, scroller = null;

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
        @media (max-width: 1180px) { .pb-gap.g3 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 860px) {
            .pb-gap.g2, .pb-gap.g3 { grid-template-columns: minmax(0, 1fr); }
            .pb-nav { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; border-radius: var(--r-md); }
            .pb-nav::-webkit-scrollbar { display: none; }
            .pb-nav button { white-space: nowrap; flex: none; }
            .pb-tbl td { min-width: 120px; }
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
    },
    destroy() {
        if (scroller && onScroll) scroller.removeEventListener('scroll', onScroll);
        scroller = null; onScroll = null;
    },
};
