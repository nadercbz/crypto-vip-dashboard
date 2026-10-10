import { D, proxy } from '../core/data.js?v=202610101132';
import { esc, fNum, fBig, fUsd } from '../core/fmt.js?v=202610101132';
import { card, pageHead, ring, empty, hydrate, seg, sparkline, icons } from '../core/ui.js?v=202610101132';

let FNG = null;        // { history: [{t, v}], current, quelle }
let BTC_HIST = null;   // [{t, p}]
let LOADING = false;
let lebt = false, wurzel = null, nachfassTimer = null;

const FNG_URL = 'https://api.alternative.me/fng/?limit=365';
const BTC_URL = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily';

function fngLabel(v) {
    if (v < 25) return 'Extreme Fear';
    if (v < 45) return 'Fear';
    if (v < 55) return 'Neutral';
    if (v < 75) return 'Greed';
    return 'Extreme Greed';
}
function fngColor(v) {
    return v < 25 ? 'var(--down)' : v < 45 ? 'color-mix(in srgb, var(--down) 55%, var(--warn))' : v < 55 ? 'var(--warn)'
        : v < 75 ? 'color-mix(in srgb, var(--up) 60%, var(--warn))' : 'var(--up)';
}

function ausExtras() {
    const h = (D.extras && D.extras.fng_history) || [];
    const raw = h.map(d => ({ t: Date.parse(d.date + 'T00:00:00Z'), v: +d.value })).filter(d => !isNaN(d.t) && !isNaN(d.v)).sort((a, b) => a.t - b.t);
    return raw.length ? { history: raw, current: raw[raw.length - 1].v, quelle: 'extras' } : null;
}

async function ladeBtc() {
    const j = await proxy(BTC_URL);
    if (j && Array.isArray(j.prices)) { BTC_HIST = j.prices.map(p => ({ t: p[0], p: p[1] })); return true; }
    return false;
}
async function laden() {
    if (LOADING) return;
    LOADING = true;
    const [fngRes] = await Promise.allSettled([
        FNG ? Promise.resolve(null) : proxy(FNG_URL).catch(() => fetch(FNG_URL).then(r => r.json())),
        BTC_HIST ? Promise.resolve(true) : ladeBtc(),
    ]);
    if (fngRes.status === 'fulfilled' && fngRes.value && fngRes.value.data) {
        const raw = fngRes.value.data.map(d => ({ t: +d.timestamp * 1000, v: +d.value })).sort((a, b) => a.t - b.t);
        if (raw.length) FNG = { history: raw, current: raw[raw.length - 1].v, quelle: 'live' };
    }
    LOADING = false;
    zeichne();
    if (!BTC_HIST) {
        clearTimeout(nachfassTimer);
        nachfassTimer = setTimeout(async () => { try { if (await ladeBtc()) zeichneHistorie(); } catch (e) {} }, 2500);
    }
}

const daten = () => FNG || ausExtras();

function regime(fng) {
    const db = D.coins, hist = D.history;
    const STABLE = new Set(['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usde', 'fdusd', 'usds', 'pyusd', 'usdd', 'gusd', 'frax', 'lusd', 'usdp']);
    const bySym = {};
    db.forEach(c => {
        const s = (c.symbol || '').toLowerCase();
        if (STABLE.has(s) || /usd$/.test(s)) return;
        const rank = c.market_cap_rank || 1e9;
        if (!bySym[s] || rank < (bySym[s].market_cap_rank || 1e9)) bySym[s] = c;
    });
    const coins = Object.values(bySym);

    const btc = db.find(c => c.id === 'bitcoin');
    const btc7 = btc ? (btc.price_change_percentage_7d_in_currency || 0) : 0;
    const top50 = coins.filter(c => (c.market_cap_rank || 1e9) <= 55 && c.id !== 'bitcoin' && c.price_change_percentage_7d_in_currency != null);
    const beating = top50.filter(c => c.price_change_percentage_7d_in_currency > btc7).length;
    const altPct = top50.length ? Math.round(beating / top50.length * 100) : null;

    const top100 = coins.filter(c => (c.market_cap_rank || 1e9) <= 100 && c.price_change_percentage_24h != null);
    const green = top100.filter(c => c.price_change_percentage_24h > 0).length;
    const breadth = top100.length ? Math.round(green / top100.length * 100) : null;

    let dom = null, domTrend = null;
    if (hist.length) {
        const last = hist[hist.length - 1];
        if (last && last.btc_dominance != null) dom = last.btc_dominance;
        const ref = [...hist].reverse().find(e => e.btc_dominance != null && e !== last && (last.date && e.date && last.date !== e.date));
        if (dom != null && ref && ref.btc_dominance != null) domTrend = dom - ref.btc_dominance;
    }

    let score = 0;
    if (breadth != null) { if (breadth > 60) score += 1; else if (breadth < 40) score -= 1; }
    if (fng != null) { if (fng >= 75) score -= 1; else if (fng <= 25) score += 1; } // Kontraindikator
    if (altPct != null) { if (altPct > 65) score += 1; else if (altPct < 30) score -= 1; }
    let verdict, vCol, vSub;
    if (score >= 2) { verdict = 'RISK-ON'; vCol = 'var(--up)'; vSub = 'Breite Stärke, Rotation läuft'; }
    else if (score <= -2) { verdict = 'RISK-OFF'; vCol = 'var(--down)'; vSub = 'Enger Markt, Vorsicht'; }
    else { verdict = 'NEUTRAL'; vCol = 'var(--warn)'; vSub = 'Gemischt, kein klares Signal'; }

    const altLabel = altPct == null ? '—' : altPct > 65 ? 'Altseason' : altPct < 30 ? 'BTC-Saison' : 'Neutral';
    const altCol = altPct == null ? 'var(--ink-3)' : altPct > 65 ? 'var(--a2)' : altPct < 30 ? 'var(--a4)' : 'var(--warn)';
    const brCol = breadth == null ? 'var(--ink-3)' : breadth > 60 ? 'var(--up)' : breadth < 40 ? 'var(--down)' : 'var(--warn)';
    const domTxt = dom == null ? '—' : fNum(dom, 1) + '%';
    const domSub = domTrend == null ? 'Trend baut sich auf'
        : (domTrend >= 0 ? '▲ +' : '▼ ') + fNum(domTrend, 1) + ' Pkt · ' + (domTrend >= 0 ? 'BTC zieht Kapital' : 'Kapital in Alts');
    const domCol = domTrend == null ? 'var(--ink-3)' : domTrend >= 0 ? 'var(--a4)' : 'var(--a2)';

    const zelle = (lbl, val, col, sub, extra = '') => `<div class="card sunk sm-rz ${extra}" style="--c:${col}">
        <div class="eyebrow">${lbl}</div><div class="sm-rv num">${val}</div><div class="sm-rs">${sub}</div></div>`;
    return zelle('Marktregime', `<span class="sm-dot"></span>${verdict}`, vCol, vSub, 'sm-urteil') +
        zelle('Altseason-Proxy', altPct == null ? '—' : altPct + '%', altCol, altLabel + ' · schlagen BTC/7T') +
        zelle('Breadth 24h', breadth == null ? '—' : breadth + '%', brCol, 'grüne Top-100') +
        zelle('BTC-Dominanz', domTxt, domCol, domSub);
}

function anzeige(cur, d) {
    if (cur == null) return empty(LOADING ? 'Lädt …' : 'Kein Stimmungswert verfügbar.');
    let meta = '';
    if (d && d.history.length) {
        const h = d.history;
        const wAgo = h.find(x => x.t >= h[h.length - 1].t - 7 * 864e5);
        const mAgo = h.find(x => x.t >= h[h.length - 1].t - 30 * 864e5);
        meta = `Jetzt ${cur} · vor 7T ${wAgo ? wAgo.v : '?'} · vor 30T ${mAgo ? mAgo.v : '?'}`;
    }
    return `<div class="sm-gauge">
        ${ring(cur, 'von 100', 230)}
        <div class="sm-gr">
            <div class="h1 sm-label" style="color:${fngColor(cur)}">${fngLabel(cur)}</div>
            <div class="sm-skala"><div class="sm-bahn"></div><div class="sm-nadel" style="left:${Math.max(0, Math.min(100, cur))}%"></div></div>
            <div class="sm-stufen"><span>Extreme Fear</span><span>Fear</span><span>Neutral</span><span>Greed</span><span>Extreme Greed</span></div>
            <div class="eyebrow sm-meta">${esc(meta)}</div>
        </div></div>`;
}

function historie(d) {
    if (!d || !d.history.length) return { svg: '', ex: '', tage: 0 };
    const W = 1000, H = 220, pad = 6, h = d.history;
    const t0 = h[0].t, t1 = h[h.length - 1].t, span = Math.max(1, t1 - t0);
    const x = t => pad + ((t - t0) / span) * (W - 2 * pad);
    const yF = v => pad + (1 - v / 100) * (H - 2 * pad);

    let bands = '';
    [[0, 25, 'sm-zf'], [75, 100, 'sm-zg']].forEach(([lo, hi, k]) => {
        bands += `<rect class="${k}" x="0" y="${yF(hi)}" width="${W}" height="${yF(lo) - yF(hi)}"/>`;
    });
    const fngLine = `<polyline class="sm-lf" points="${h.map(p => `${x(p.t).toFixed(1)},${yF(p.v).toFixed(1)}`).join(' ')}"/>`;

    let btcLine = '';
    if (BTC_HIST && BTC_HIST.length) {
        const inRange = BTC_HIST.filter(p => p.t >= t0 - 864e5);
        if (inRange.length) {
            const ps = inRange.map(p => p.p);
            const mn = Math.min(...ps), mx = Math.max(...ps), r = Math.max(1e-9, mx - mn);
            const yB = p => pad + (1 - (p - mn) / r) * (H - 2 * pad);
            btcLine = `<polyline class="sm-lb" points="${inRange.map(p => `${x(p.t).toFixed(1)},${yB(p.p).toFixed(1)}`).join(' ')}"/>`;
        }
    }
    const low = [...h].sort((a, b) => a.v - b.v).slice(0, 3);
    const ex = `<span class="sm-exl">Tiefste Angst (historische Böden-Signale):</span>` + low.map(p =>
        `<span class="chip" style="--c:var(--down)">${p.v} · ${esc(new Date(p.t).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' }))}</span>`).join('');
    return { svg: bands + btcLine + fngLine, ex, tage: Math.round(span / 864e5) + 1 };
}

function zeichneHistorie() {
    if (!lebt || !wurzel || !wurzel.isConnected) return;
    const d = daten(), r = historie(d);
    const svg = wurzel.querySelector('#smSvg'), ex = wurzel.querySelector('#smEx'), ttl = wurzel.querySelector('#smHistTitel');
    if (!svg) return;
    if (!r.svg) { wurzel.querySelector('#smChart').innerHTML = empty(LOADING ? 'Lädt …' : 'Keine Historie verfügbar.'); return; }
    svg.innerHTML = r.svg; ex.innerHTML = r.ex;
    ttl.textContent = d.quelle === 'live' ? 'Historie · 1 Jahr' : 'Historie · ' + r.tage + ' Tage';
}
function zeichne() {
    if (!lebt || !wurzel || !wurzel.isConnected) return;
    const d = daten(), cur = d && d.current != null ? d.current : null;
    const g = wurzel.querySelector('#smGauge');
    g.innerHTML = anzeige(cur, d); hydrate(g);
    wurzel.querySelector('#smRegime').innerHTML = regime(cur);
    zeichneHistorie();
}

const MP = () => (typeof window !== 'undefined' && window.MARKT_PLUS_DATA) || null;
const mpWahl = { opt: 'BTC', etf: 'BTC' };
let mpKlick = null;

const nf = (v, d = 0) => v == null || isNaN(v) ? '?' : Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const sgnBig = v => v == null || isNaN(v) ? '?' : (v > 0 ? '+' : v < 0 ? '-' : '') + fBig(Math.abs(v));
const sgnPct = (v, d = 1) => v == null || isNaN(v) ? '?' : (v > 0 ? '+' : '') + nf(v, d) + ' %';
const tagMon = s => { const p = String(s || '').split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' : esc(s); };
const tagVoll = s => { const p = String(s || '').split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : esc(s); };
const tageBis = s => { const t = Date.parse(s + 'T08:00:00Z'); return isNaN(t) ? null : Math.max(0, (t - Date.now()) / 864e5); };
const kc = v => v == null ? 'var(--ink-3)' : v > 0 ? 'var(--up)' : v < 0 ? 'var(--down)' : 'var(--ink-3)';

function pcDeutung(v) {
    if (v == null) return ['Keine Daten', 'var(--ink-3)'];
    if (v < 0.5) return ['Calls dominieren klar. Bullische Wetten.', 'var(--up)'];
    if (v < 0.7) return ['Mehr Calls als Puts. Eher bullisch.', 'color-mix(in srgb, var(--up) 70%, var(--warn))'];
    if (v < 1) return ['Ausgeglichen.', 'var(--warn)'];
    return ['Puts überwiegen. Absicherung gefragt.', 'var(--down)'];
}
function skewDeutung(v) {
    if (v == null) return ['Keine Daten', 'var(--ink-3)'];
    if (v > 5) return ['Puts deutlich teurer. Der Markt sichert sich gegen einen Abverkauf ab.', 'var(--down)'];
    if (v > 2) return ['Leichte Absicherung nach unten.', 'color-mix(in srgb, var(--down) 55%, var(--warn))'];
    if (v >= -2) return ['Neutral. Keine Seite wird teurer bezahlt.', 'var(--warn)'];
    return ['Calls teurer. Spekulation auf Anstieg.', 'var(--up)'];
}
const mpKpi = (lbl, val, sub, c = 'var(--ink)', extra = '') => `<div class="card sunk sm-kpi"><div class="eyebrow">${lbl}</div>
    <div class="sm-kv num" style="color:${c}">${val}</div><div class="sm-ks">${sub}</div>${extra}</div>`;

function mpVerlauf(key) {
    const h = (MP() && MP().historie) || [];
    const a = h.map(x => x[key]).filter(v => v != null);
    return a.length >= 3 ? `<div class="sm-ksp">${sparkline(a, 120, 22, 'var(--pg)')}<span>${a.length} Tage</span></div>` : '';
}

function optionenInhalt() {
    const d = MP(), o = d && d.optionen && d.optionen[mpWahl.opt];
    if (!o) return empty('Keine Optionsdaten für ' + mpWahl.opt + '.');
    const k = mpWahl.opt.toLowerCase();
    const [pcT, pcC] = pcDeutung(o.pc_oi), [pvT] = pcDeutung(o.pc_vol), [skT, skC] = skewDeutung(o.skew);
    const tage = tageBis(o.monat);
    const zug = o.atm_iv != null && tage != null ? o.atm_iv * Math.sqrt(tage / 365) : null;
    const mpAb = o.max_pain_abstand;
    const kpis = mpKpi('Put/Call nach Open Interest', nf(o.pc_oi, 2), esc(pcT), pcC, mpVerlauf(k + '_pc_oi')) +
        mpKpi('Put/Call 24h-Volumen', nf(o.pc_vol, 2), 'Heute gehandelt: ' + esc(pvT)) +
        mpKpi('ATM-IV ' + tagMon(o.monat), nf(o.atm_iv, 1) + ' %',
            zug != null ? `Erwartete Schwankung bis zum Verfall rund ±${nf(zug, 1)} % (${nf(tage, 0)} Tage)` : 'Implizite Volatilität am Geld', 'var(--ink)', mpVerlauf(k + '_atm_iv')) +
        mpKpi('Skew 25 Delta', (o.skew > 0 ? '+' : '') + nf(o.skew, 1) + ' Pkt', esc(skT) + ` Put ${nf(o.iv_put25, 1)} %, Call ${nf(o.iv_call25, 1)} %.`, skC) +
        mpKpi('Max Pain ' + tagMon(o.max_pain_datum), fUsd(o.max_pain),
            mpAb == null ? '' : `${nf(Math.abs(mpAb), 1)} % ${mpAb < 0 ? 'unter' : 'über'} dem Kurs (${fUsd(o.index)}). Zum Verfall zieht der Preis oft in diese Richtung, ein Gesetz ist das nicht.`);
    const fl = o.faelligkeiten || [], max = Math.max(1, ...fl.map(f => f.oi || 0));
    const reihen = fl.map(f => `<div class="sm-fz">
        <div class="sm-fz-k"><b>${tagVoll(f.datum)}</b><span>${fBig(f.oi_usd)} · P/C ${nf(f.pc, 2)}</span></div>
        <div class="sm-fz-bar" style="width:${Math.max(4, (f.oi || 0) / max * 100).toFixed(1)}%">
            <i class="sm-fz-c" style="flex:${f.calls || 0}" title="Calls ${nf(f.calls, 0)} ${esc(mpWahl.opt)}"></i><i class="sm-fz-p" style="flex:${f.puts || 0}" title="Puts ${nf(f.puts, 0)} ${esc(mpWahl.opt)}"></i></div></div>`).join('');
    return `<div class="sm-kpis">${kpis}</div>
        <div class="row between wrap" style="margin:22px 0 10px"><div class="eyebrow">Open Interest je Fälligkeit · Top 4</div>
            <div class="sm-leg"><span><i style="--c:var(--up)"></i>Calls</span><span><i style="--c:var(--down)"></i>Puts</span></div></div>
        <div class="sm-fzs">${reihen || empty('Keine Fälligkeiten.')}</div>
        <div class="sm-fuss">Gesamt-OI ${fBig(o.oi_usd)} (${nf((o.oi_calls || 0) + (o.oi_puts || 0), 0)} ${esc(mpWahl.opt)}). Skew-Methode: ${esc(o.skew_methode || '?')}, Fälligkeit ${tagVoll(o.monat)}.
            Max Pain: Fälligkeit mit dem höchsten Open Interest in den nächsten 45 Tagen. Quelle Deribit${o.veraltet ? ', <b class="warn">alter Stand</b>' : ''}.</div>`;
}

function etfChart(tage) {
    const W = 600, H = 170, mitte = H / 2, n = tage.length;
    if (!n) return '';
    const max = Math.max(1, ...tage.map(t => Math.abs(t.flow || 0)));
    const bw = W / n, gap = Math.min(4, bw * 0.25);
    const bars = tage.map((t, i) => {
        const v = t.flow || 0, h = Math.max(1, Math.abs(v) / max * (mitte - 6));
        const y = v >= 0 ? mitte - h : mitte;
        return `<rect class="${v >= 0 ? 'sm-pos' : 'sm-neg'}" x="${(i * bw + gap / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - gap).toFixed(1)}" height="${h.toFixed(1)}" rx="2"><title>${tagVoll(t.datum)}: ${sgnBig(v)}</title></rect>`;
    }).join('');
    return `<svg class="sm-etf-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><line x1="0" x2="${W}" y1="${mitte}" y2="${mitte}" class="sm-null"/>${bars}</svg>
        <div class="sm-etf-ax"><span>${tagMon(tage[0].datum)}</span><span>±${fBig(max)} je Tag</span><span>${tagMon(tage[n - 1].datum)}</span></div>`;
}

function etfInhalt() {
    const d = MP(), e = d && d.etf && d.etf[mpWahl.etf];
    if (!e || !e.tage || !e.tage.length) return empty('Keine ETF-Daten für ' + mpWahl.etf + '.');
    const l = e.letzter || {};
    const serie = e.serie ? `${Math.abs(e.serie)} ${Math.abs(e.serie) === 1 ? 'Tag' : 'Tage'} in Folge ${e.serie > 0 ? 'Zufluss' : 'Abfluss'}` : '';
    const etfs = (e.etfs || []).filter(x => x.flow != null).slice(0, 6).map(x =>
        `<div class="sm-etf-z"><b>${esc(x.ticker)}</b><span>${esc(x.anbieter)}</span><em style="color:${kc(x.flow)}">${x.flow ? sgnBig(x.flow) : '0'}</em></div>`).join('');
    return `<div class="sm-etf-top">
            <div><div class="eyebrow">7 Handelstage</div><div class="big num" style="color:${kc(e.sum7)}">${sgnBig(e.sum7)}</div></div>
            <div class="sm-etf-neben"><span>Letzter Tag ${tagMon(l.datum)} <b style="color:${kc(l.flow)}">${sgnBig(l.flow)}</b></span>
                <span>30 Handelstage <b style="color:${kc(e.sum30)}">${sgnBig(e.sum30)}</b></span>
                <span>Verwaltet <b>${fBig(e.aum)}</b></span>${serie ? `<span>${serie}</span>` : ''}</div>
        </div>
        ${etfChart(e.tage)}
        ${etfs ? `<div class="eyebrow" style="margin:18px 0 6px">Einzelne ETFs am ${tagMon(l.datum)}</div><div class="sm-etf-l">${etfs}</div>` : ''}
        <div class="sm-fuss">Netto-Zufluss aller US-Spot-ETFs je Handelstag. Quelle SoSoValue${e.veraltet ? ', <b class="warn">alter Stand</b>' : ''}.</div>`;
}

function squeezeInhalt() {
    const d = MP(), q = d && d.squeeze;
    if (!q || !q.perps) return empty('Keine Futures-Daten.');
    const zeile = (k, schwach) => {
        const c = k.seite === 'short' ? 'var(--up)' : 'var(--down)';
        return `<div class="sm-sq${schwach ? ' sm-sq-schwach' : ''}" data-coin="${esc(k.symbol)}" role="button" tabindex="0" title="Coin-Detail öffnen">
            <span class="score" style="--c:${c}">${esc(k.score)}</span>
            <div class="sm-sq-t"><div class="sm-sq-k"><b>${esc(k.symbol)}</b><span>${esc(k.name || '')}</span>
                <span class="chip" style="--c:${c}">${k.seite === 'short' ? 'Short-Squeeze' : 'Long-Squeeze'}</span></div>
                <div class="sm-sq-g">${esc(k.grund)}</div></div></div>`;
    };
    const kand = q.kandidaten || [], beob = q.beobachten || [];
    const kopf = kand.length ? kand.map(k => zeile(k, false)).join('')
        : `<div class="sm-sq-leer">Gerade erfüllt keiner der ${q.perps.length} größten Perps alle drei Bedingungen.</div>`;
    const nah = beob.length ? `<div class="eyebrow" style="margin:16px 0 4px">Nahe dran</div>` + beob.map(k => zeile(k, true)).join('') : '';
    const r = q.regeln || {};
    return kopf + nah + `<div class="sm-fuss"><b>Short-Squeeze:</b> ${esc(r.short || '')}. <b>Long-Squeeze:</b> ${esc(r.long || '')}.
        Score 0 bis 100: Funding 40, Open Interest 30, Kurs 20, Top-Trader 10. Quelle Binance Futures${q.veraltet ? ', <b class="warn">alter Stand</b>' : ''}. Keine Finanzberatung.</div>`;
}

function mpBereich() {
    const d = MP();
    if (!d) return card({ eyebrow: 'Optionen, ETF-Zuflüsse, Squeeze', body: empty('Noch keine Markt-Plus-Daten. fetch_markt_plus.py ausführen.') });
    const stand = `<span class="eyebrow" style="letter-spacing:.08em">Stand ${esc(d.updated || '')}</span>`;
    const opt = d.optionen || {}, etf = d.etf || {};
    const optSeg = seg('smOpt', ['BTC', 'ETH'].filter(k => opt[k]).map(k => [k, k]), mpWahl.opt);
    const etfSeg = seg('smEtf', ['BTC', 'ETH', 'SOL'].filter(k => etf[k]).map(k => [k, k]), mpWahl.etf);
    return card({ eyebrow: 'Optionen · Deribit', title: 'Wie sich der Optionsmarkt aufstellt', right: `<div class="row wrap" style="gap:10px">${stand}${optSeg}</div>`,
            body: `<div id="smOptBody">${optionenInhalt()}</div>` }) +
        `<div class="grid g2">` +
        card({ eyebrow: 'Spot-ETF-Zuflüsse', title: 'Institutionelles Geld', right: etfSeg, body: `<div id="smEtfBody">${etfInhalt()}</div>` }) +
        card({ eyebrow: 'Squeeze-Kandidaten', title: 'Wo es eng werden kann', right: `<span class="chip" style="--c:var(--pg)">${esc(((d.squeeze || {}).perps || []).length)} Perps</span>`,
            body: `<div class="sm-sqs">${squeezeInhalt()}</div>` }) +
        `</div>`;
}

export default {
    styles: `
        .sm-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
        .sm-kpi { padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
        .sm-kv { font-size: 1.55rem; font-weight: 300; letter-spacing: -.02em; line-height: 1.1; }
        .sm-ks { font-size: .74rem; color: var(--ink-2); line-height: 1.45; font-weight: 300; }
        .sm-ksp { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-family: var(--mono); font-size: .58rem; color: var(--ink-3); }
        .sm-fzs { display: grid; gap: 10px; }
        .sm-fz { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 14px; align-items: center; }
        .sm-fz-k { display: flex; flex-direction: column; gap: 2px; font-family: var(--mono); font-size: .74rem; }
        .sm-fz-k b { font-weight: 500; color: var(--ink); }
        .sm-fz-k span { font-size: .64rem; color: var(--ink-3); }
        .sm-fz-bar { display: flex; height: 14px; border-radius: 99px; overflow: hidden; background: var(--sunk); animation: smWachs .9s var(--ease) both; transform-origin: left; }
        .sm-fz-bar i { display: block; height: 100%; min-width: 2px; }
        .sm-fz-c { background: color-mix(in srgb, var(--up) 75%, transparent); }
        .sm-fz-p { background: color-mix(in srgb, var(--down) 75%, transparent); }
        @keyframes smWachs { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .sm-fuss { margin-top: 16px; font-size: .72rem; color: var(--ink-3); line-height: 1.55; font-weight: 300; }
        .sm-fuss b { color: var(--ink-2); font-weight: 500; }
        .sm-etf-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; flex-wrap: wrap; margin-bottom: 16px; }
        .sm-etf-top .big { margin-top: 8px; }
        .sm-etf-neben { display: flex; flex-direction: column; gap: 4px; font-family: var(--mono); font-size: .7rem; color: var(--ink-3); text-align: right; }
        .sm-etf-neben b { font-weight: 500; color: var(--ink); }
        .sm-etf-svg { display: block; width: 100%; height: 170px; }
        .sm-pos { fill: color-mix(in srgb, var(--up) 80%, transparent); }
        .sm-neg { fill: color-mix(in srgb, var(--down) 80%, transparent); }
        .sm-etf-svg rect { transition: opacity .2s; }
        .sm-etf-svg rect:hover { opacity: .65; }
        .sm-null { stroke: var(--line); stroke-width: 1; vector-effect: non-scaling-stroke; }
        .sm-etf-ax { display: flex; justify-content: space-between; margin-top: 6px; font-family: var(--mono); font-size: .6rem; color: var(--ink-3); }
        .sm-etf-l { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }
        .sm-etf-z { display: grid; grid-template-columns: 54px minmax(0, 1fr) auto; gap: 8px; align-items: baseline; padding: 6px 0; border-bottom: 1px solid var(--line); font-size: .78rem; }
        .sm-etf-z b { font-family: var(--mono); font-weight: 500; font-size: .74rem; }
        .sm-etf-z span { color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .72rem; }
        .sm-etf-z em { font-style: normal; font-family: var(--mono); font-size: .74rem; }
        .sm-sqs { display: flex; flex-direction: column; }
        .sm-sq { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 12px; align-items: start; padding: 12px 6px; border-radius: 12px; cursor: pointer; border-top: 1px solid var(--line); transition: background .2s, transform .25s var(--ease); }
        .sm-sq:first-child { border-top: 0; }
        .sm-sq:hover { background: color-mix(in srgb, var(--ink) 4%, transparent); transform: translateX(3px); }
        .sm-sq:focus-visible { outline: 2px solid var(--pg); outline-offset: -2px; }
        .sm-sq-schwach .score { opacity: .7; }
        .sm-sq-k { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .sm-sq-k b { font-weight: 500; font-size: .92rem; }
        .sm-sq-k > span:not(.chip) { font-size: .74rem; color: var(--ink-3); }
        .sm-sq-g { margin-top: 5px; font-size: .76rem; color: var(--ink-2); line-height: 1.5; font-weight: 300; }
        .sm-sq-leer { padding: 14px 6px; font-size: .84rem; color: var(--ink-2); }
        @media (max-width: 860px) { .sm-fz { grid-template-columns: minmax(0, 1fr); gap: 6px; } .sm-etf-l { grid-template-columns: minmax(0, 1fr); }
            .sm-etf-neben { text-align: left; } .sm-kv { font-size: 1.35rem; } }
        .sm-regime { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 12px; }
        .sm-rz { padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
        .sm-urteil { background: color-mix(in srgb, var(--c) 9%, var(--bg)); outline: 1px solid color-mix(in srgb, var(--c) 40%, transparent); outline-offset: -1px; }
        .sm-rv { font-size: 1.55rem; font-weight: 400; line-height: 1.05; letter-spacing: -.02em; color: var(--c); }
        .sm-rs { font-size: .72rem; color: var(--ink-3); }
        .sm-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 8px; vertical-align: middle; background: var(--c); box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 18%, transparent); }
        .sm-gauge { display: flex; align-items: center; gap: 44px; flex-wrap: wrap; padding: 14px 8px 6px; }
        .sm-gr { flex: 1; min-width: 260px; }
        .sm-label { font-size: 2.1rem; transition: color .4s var(--ease); }
        .sm-skala { position: relative; height: 12px; margin-top: 22px; }
        .sm-bahn { position: absolute; inset: 0; border-radius: 99px; background: linear-gradient(90deg, var(--down), var(--warn) 50%, var(--up)); opacity: .85; }
        .sm-nadel { position: absolute; top: 50%; width: 22px; height: 22px; border-radius: 50%; background: var(--raised); box-shadow: var(--sh-sm); border: 3px solid var(--ink); transform: translate(-50%, -50%); transition: left 1s var(--ease); }
        .sm-stufen { display: flex; justify-content: space-between; gap: 6px; margin-top: 12px; font-family: var(--mono); font-size: .58rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
        .sm-meta { margin-top: 18px; letter-spacing: .08em; }
        .sm-chart { width: 100%; height: 220px; position: relative; }
        .sm-chart svg { width: 100%; height: 100%; display: block; }
        .sm-chart polyline { fill: none; vector-effect: non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; }
        .sm-lf { stroke: var(--pg); stroke-width: 2; }
        .sm-lb { stroke: var(--ink-3); stroke-width: 1.6; opacity: .75; }
        .sm-zf { fill: color-mix(in srgb, var(--down) 10%, transparent); }
        .sm-zg { fill: color-mix(in srgb, var(--up) 8%, transparent); }
        .sm-leg { display: flex; gap: 16px; font-family: var(--mono); font-size: .62rem; letter-spacing: .08em; color: var(--ink-3); }
        .sm-leg i { display: inline-block; width: 16px; height: 3px; border-radius: 3px; margin-right: 6px; vertical-align: middle; background: var(--c); }
        .sm-ex { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 16px; }
        .sm-exl { font-size: .72rem; color: var(--ink-3); }
        @media (max-width: 1180px) { .sm-regime { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 860px) { .sm-gauge { justify-content: center; gap: 24px; } .sm-label { font-size: 1.7rem; text-align: center; }
            .sm-stufen span:nth-child(even) { display: none; } .sm-meta { text-align: center; } }`,
    render(root) {
        lebt = true; wurzel = root;
        root.classList.add('stack');
        root.innerHTML = pageHead('Markt', 'Marktstimmung',
            'Fear and Greed Index. Die Stimmung ist ein Kontraindikator. Extreme Fear = Chance, Extreme Greed = Vorsicht.') +
            `<div class="sm-regime" id="smRegime"></div>` +
            card({ eyebrow: 'Fear and Greed Index', cls: 'tint', body: `<div id="smGauge"></div>` }) +
            card({ body: `<div class="row between wrap" style="margin-bottom:12px"><div class="eyebrow" id="smHistTitel">Historie · 1 Jahr</div>
                <div class="sm-leg"><span><i style="--c:var(--pg)"></i>Fear and Greed</span><span><i style="--c:var(--ink-3)"></i>Bitcoin</span></div></div>
                <div class="sm-chart" id="smChart"><svg id="smSvg" viewBox="0 0 1000 220" preserveAspectRatio="none"></svg></div>
                <div class="sm-ex" id="smEx"></div>` }) +
            `<div class="stack" id="smPlus">${mpBereich()}</div>`;
        if (mpKlick) root.removeEventListener('click', mpKlick);
        mpKlick = ev => {
            const b = ev.target.closest('[data-seg] button[data-v]'); if (!b) return;
            const s = b.closest('[data-seg]'), name = s.dataset.seg;
            if (name !== 'smOpt' && name !== 'smEtf') return;
            s.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
            if (name === 'smOpt') { mpWahl.opt = b.dataset.v; const el = root.querySelector('#smOptBody'); el.innerHTML = optionenInhalt(); icons(el); }
            else { mpWahl.etf = b.dataset.v; const el = root.querySelector('#smEtfBody'); el.innerHTML = etfInhalt(); icons(el); }
        };
        root.addEventListener('click', mpKlick);
        root.onkeydown = ev => {
            if (ev.key !== 'Enter' && ev.key !== ' ') return;
            const z = ev.target.closest && ev.target.closest('.sm-sq[data-coin]');
            if (z) { ev.preventDefault(); z.click(); }
        };
        zeichne();
        if (!FNG || !BTC_HIST) laden().catch(() => { LOADING = false; });
    },
    destroy() {
        if (wurzel && mpKlick) { wurzel.removeEventListener('click', mpKlick); wurzel.onkeydown = null; }
        mpKlick = null;
        lebt = false; wurzel = null; clearTimeout(nachfassTimer);
    },
};
