
const FIB_RET = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_EXT = [1.272, 1.618];

const h = b => b.high ?? b.value, l = b => b.low ?? b.value, c = b => b.close ?? b.value;

function atr(bars, n = 14) {
    if (bars.length < 2) return 0;
    const tr = [];
    for (let i = 1; i < bars.length; i++) {
        const pc = c(bars[i - 1]);
        tr.push(Math.max(h(bars[i]) - l(bars[i]), Math.abs(h(bars[i]) - pc), Math.abs(l(bars[i]) - pc)));
    }
    const s = tr.slice(-n);
    const a = s.reduce((x, y) => x + y, 0) / s.length;
    return a > 0 ? a : Math.abs(c(bars[bars.length - 1])) * 0.02;
}
function ema(werte, n) {
    if (werte.length < n) return null;
    const k = 2 / (n + 1);
    let e = werte.slice(0, n).reduce((a, b) => a + b, 0) / n;
    for (let i = n; i < werte.length; i++) e = werte[i] * k + e * (1 - k);
    return e;
}
function rsi(werte, n = 14) {
    if (werte.length <= n) return null;
    let auf = 0, ab = 0;
    for (let i = 1; i <= n; i++) { const d = werte[i] - werte[i - 1]; if (d > 0) auf += d; else ab -= d; }
    auf /= n; ab /= n;
    for (let i = n + 1; i < werte.length; i++) {
        const d = werte[i] - werte[i - 1];
        auf = (auf * (n - 1) + Math.max(d, 0)) / n;
        ab = (ab * (n - 1) + Math.max(-d, 0)) / n;
    }
    return ab === 0 ? 100 : 100 - 100 / (1 + auf / ab);
}
function pivots(bars, k) {
    const hoch = [], tief = [];
    for (let i = k; i < bars.length - k; i++) {
        let istH = true, istL = true;
        for (let j = i - k; j <= i + k; j++) {
            if (j === i) continue;
            if (h(bars[j]) > h(bars[i])) istH = false;
            if (l(bars[j]) < l(bars[i])) istL = false;
        }
        if (istH) hoch.push(i);
        if (istL) tief.push(i);
    }
    return { hoch, tief };
}

function trendlinie(bars, idx, art, tol) {
    const n = bars.length, wert = art === 'widerstand' ? h : l;
    const kand = idx.slice(-8);
    let best = null;
    for (let a = 0; a < kand.length; a++) for (let b = a + 1; b < kand.length; b++) {
        const i = kand[a], j = kand[b];
        if (j - i < 5) continue;
        const m = (wert(bars[j]) - wert(bars[i])) / (j - i);
        const linie = x => wert(bars[i]) + m * (x - i);
        let ok = true, ber = 0;
        for (let x = i; x < n; x++) {
            const cl = c(bars[x]), lv = linie(x);
            if (art === 'widerstand' ? cl > lv + tol : cl < lv - tol) { ok = false; break; }
            if (Math.abs(wert(bars[x]) - lv) <= tol && (x === i || x === j || idx.includes(x))) ber++;
        }
        if (!ok || ber < 2) continue;
        const score = ber * 3 + (j - i) / n * 4 + j / n * 3;
        if (!best || score > best.score) best = { i, j, m, ber, score };
    }
    if (!best) return null;
    const neigung = best.m * n / Math.max(1e-12, Math.abs(wert(bars[best.i])));
    const richtung = Math.abs(neigung) < 0.03 ? 'flach' : best.m > 0 ? 'steigend' : 'fallend';
    return {
        art, richtung, name: (art === 'widerstand' ? 'Widerstand ' : 'Unterstützung ') + richtung, beruehrungen: best.ber,
        p1: { t: bars[best.i].time, p: wert(bars[best.i]) },
        p2: { t: bars[best.j].time, p: wert(bars[best.j]) },
        heute: wert(bars[best.i]) + best.m * (n - 1 - best.i),
    };
}

function cluster(bars, punkte, band, maxSpan = Infinity) {
    const sortiert = punkte.slice().sort((a, b) => a.p - b.p), out = [];
    sortiert.forEach(pt => {
        const g = out[out.length - 1];
        if (g && pt.p - g.bis <= band && pt.p - g.von <= maxSpan) { g.bis = Math.max(g.bis, pt.p); g.pts.push(pt); }
        else out.push({ von: pt.p, bis: pt.p, pts: [pt] });
    });
    return out;
}

export function berechneTA({ bars, lang, vol, athDb, fng }) {
    if (!bars || bars.length < 30) return null;
    const n = bars.length, jetzt = c(bars[n - 1]), A = atr(bars);
    const closes = bars.map(c);

    const basis = lang && lang.length > 10 ? lang : bars;
    let ath = { t: basis[0].time, p: h(basis[0]) }, atl = { t: basis[0].time, p: l(basis[0]) };
    basis.forEach(b => { if (h(b) > ath.p) ath = { t: b.time, p: h(b) }; if (l(b) < atl.p) atl = { t: b.time, p: l(b) }; });
    let athVorher = false;
    if (athDb && athDb > ath.p * 1.03) { ath = { t: basis[0].time, p: athDb }; athVorher = true; }
    const spanne = ath.p - atl.p;
    const fib = spanne > 0 ? {
        ath, atl, athVorher,
        levels: [...FIB_RET.map(f => ({ f, p: ath.p - spanne * f })), ...FIB_EXT.map(f => ({ f, p: atl.p + spanne * f, ext: true }))],
    } : null;
    const wClose = basis.map(c);
    const w50 = wClose.length >= 20 ? wClose.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, wClose.length) : null;
    const htf = w50 == null ? null : (wClose[wClose.length - 1] > w50 ? 'auf' : 'ab');

    const k = Math.max(3, Math.min(10, Math.round(n / 45)));
    const pv = pivots(bars, k);
    const lh = pv.hoch.slice(-2).map(i => h(bars[i])), ll = pv.tief.slice(-2).map(i => l(bars[i]));
    let struktur = 'seitwärts';
    if (lh.length === 2 && ll.length === 2) {
        if (lh[1] > lh[0] && ll[1] > ll[0]) struktur = 'aufwärts (HH/HL)';
        else if (lh[1] < lh[0] && ll[1] < ll[0]) struktur = 'abwärts (LH/LL)';
    }
    const ema50 = ema(closes, 50), ema200 = ema(closes, 200);
    const tol = A * 0.6;
    const linien = [trendlinie(bars, pv.hoch, 'widerstand', tol), trendlinie(bars, pv.tief, 'unterstuetzung', tol)].filter(Boolean);

    const punkte = [...pv.hoch.map(i => ({ p: h(bars[i]), i })), ...pv.tief.map(i => ({ p: l(bars[i]), i }))];
    const volMed = vol && vol.length ? vol.slice().sort((a, b) => a - b)[Math.floor(vol.length / 2)] : null;
    const zonen = cluster(bars, punkte, A * 0.9, Math.max(A * 2.2, jetzt * 0.05)).map(z => {
        let von = z.von, bis = z.bis;
        if (bis - von < A * 0.5) { const m = (von + bis) / 2; von = m - A * 0.25; bis = m + A * 0.25; }
        const gruende = [];
        const fibIn = fib && fib.levels.find(x => !x.ext && x.p >= von - A * 0.3 && x.p <= bis + A * 0.3 && x.f > 0 && x.f < 1);
        if (fibIn) gruende.push('Fib ' + String(fibIn.f).replace('.', ','));
        if (z.pts.length >= 3) gruende.push(z.pts.length + ' Wendepunkte');
        if (ema200 && ema200 >= von - A && ema200 <= bis + A) gruende.push('EMA 200');
        if (volMed && vol && z.pts.some(pt => (vol[pt.i] || 0) > volMed * 1.3)) gruende.push('Volumen');
        const unten = bis < jetzt;
        if (htf && ((unten && htf === 'auf') || (!unten && htf === 'ab'))) gruende.push('Weekly-Trend');
        const start = Math.min(...z.pts.map(pt => pt.i));
        return { von, bis, mitte: (von + bis) / 2, stark: gruende.length >= 2 && z.pts.length >= 2, score: gruende.length, gruende, n: z.pts.length, start: bars[start].time, letzte: Math.max(...z.pts.map(pt => pt.i)) };
    }).filter(z => z.n >= 2 || z.score >= 2);

    const wertung = z => z.score * 2 + z.n + (z.letzte / n) * 2;
    let kauf = zonen.filter(z => z.bis < jetzt - A * 0.15).sort((a, b) => wertung(b) - wertung(a)).slice(0, 2).sort((a, b) => b.mitte - a.mitte);
    let verkauf = zonen.filter(z => z.von > jetzt + A * 0.15).sort((a, b) => wertung(b) - wertung(a)).slice(0, 2).sort((a, b) => a.mitte - b.mitte);
    if (!verkauf.length && fib) {
        verkauf = FIB_EXT.map(f => { const p = atl.p + spanne * f; return { von: p - A * 0.4, bis: p + A * 0.4, mitte: p, score: 1, gruende: ['Fib-Erweiterung ' + String(f).replace('.', ',')], n: 0, start: bars[Math.max(0, n - 60)].time, ext: true }; })
            .filter(z => z.von > jetzt);
    }
    const widerstaende = [
        ...zonen.filter(z => z.von > jetzt + A * 0.15).map(z => z.von),
        ...(fib ? fib.levels.filter(x => !x.ext && x.p > jetzt + A * 0.5).map(x => x.p) : []),
        ...(fib && fib.ath.p > jetzt + A * 0.5 ? [fib.ath.p] : []),
    ].sort((a, b) => a - b);
    kauf.forEach(z => {
        z.stopp = z.von - Math.max(A * 0.8, (z.bis - z.von) * 0.6, z.mitte * 0.015);
        const ziel = widerstaende.find(p => p > Math.max(jetzt, z.bis) + A * 0.3) || null;
        z.ziel = ziel;
        z.rr = ziel ? (ziel - z.mitte) / Math.max(1e-12, z.mitte - z.stopp) : null;
        z.einstieg = z.rr != null && z.rr >= 2;
    });

    const starke = zonen.filter(z => z.stark);
    const imZone = starke.filter(z => jetzt >= z.von - A * 0.15 && jetzt <= z.bis + A * 0.15).sort((a, b) => wertung(b) - wertung(a))[0] || null;
    const unter = starke.filter(z => z.bis < jetzt - A * 0.15).sort((a, b) => b.bis - a.bis)[0] || null;
    const naechste = unter || kauf[0] || null;
    const zone = imZone ? { im: true, von: imZone.von, bis: imZone.bis, abstandPct: 0, gruende: imZone.gruende, score: imZone.score,
            tiefe: imZone.bis > imZone.von ? Math.min(1, Math.max(0, (jetzt - imZone.von) / (imZone.bis - imZone.von))) : 0 }
        : naechste ? { im: false, von: naechste.von, bis: naechste.bis, abstandPct: (jetzt - naechste.bis) / jetzt * 100, gruende: naechste.gruende, score: naechste.score } : null;

    const r = rsi(closes);
    const heiss = r != null && r > 70 && (fng == null || fng > 75);

    const H = Math.max(12, Math.min(60, Math.round(n * 0.18)));
    const m = Math.min(60, Math.max(20, Math.round(n / 3)));
    const lg = closes.slice(-m).map(v => Math.log(Math.max(v, 1e-12)));
    const xm = (m - 1) / 2, ym = lg.reduce((a, b) => a + b, 0) / m;
    let sxy = 0, sxx = 0; lg.forEach((v, i) => { sxy += (i - xm) * (v - ym); sxx += (i - xm) * (i - xm); });
    let drift = (sxy / sxx) * 0.5;
    const ret = []; for (let i = Math.max(1, n - 60); i < n; i++) ret.push(Math.log(c(bars[i]) / c(bars[i - 1])));
    const mu = ret.reduce((a, b) => a + b, 0) / ret.length;
    const sigma = Math.sqrt(ret.reduce((a, b) => a + (b - mu) ** 2, 0) / Math.max(1, ret.length - 1));
    const grenze = 0.8 * sigma * Math.sqrt(H) / H;
    drift = Math.max(-grenze, Math.min(grenze, drift));
    const dt = n > 1 ? bars[n - 1].time - bars[n - 2].time : 86400;
    const pfad = [];
    for (let s = 0; s <= H; s += Math.max(1, Math.round(H / 16))) {
        const lm = Math.log(jetzt) + drift * s, sd = sigma * Math.sqrt(s);
        pfad.push({ t: bars[n - 1].time + s * dt, mitte: Math.exp(lm), oben: Math.exp(lm + sd), unten: Math.exp(lm - sd) });
    }
    if (pfad[pfad.length - 1].t !== bars[n - 1].time + H * dt) {
        const lm = Math.log(jetzt) + drift * H, sd = sigma * Math.sqrt(H);
        pfad.push({ t: bars[n - 1].time + H * dt, mitte: Math.exp(lm), oben: Math.exp(lm + sd), unten: Math.exp(lm - sd) });
    }
    const end = pfad[pfad.length - 1];
    const prognose = { pfad, H, dt, basis: end.mitte, oben: end.oben, unten: end.unten,
        bull: widerstaende.find(p => p > jetzt + A * 0.3) || null, baer: kauf[0] ? kauf[0].bis : null };

    return { zone, jetzt, atr: A, fib, htf, struktur, ema50, ema200, linien, kauf, verkauf, rsi: r, fng, heiss, prognose, k, letzteZeit: bars[n - 1].time, dt };
}

const SYN = 29.530588853 * 86400, NEU0 = Date.UTC(2000, 0, 6, 18, 14) / 1000;
const FIB_ZEIT = [8, 13, 21, 34, 55, 89, 144, 233];
export function mystik(ta, bars) {
    if (!ta) return [];
    const von = ta.letzteZeit, bis = von + ta.prognose.H * ta.dt, out = [];
    let t = NEU0 + Math.ceil((von - NEU0) / SYN) * SYN;
    for (; t - SYN / 2 <= bis; t += SYN) {
        if (t - SYN / 2 > von) out.push({ t: t - SYN / 2, art: 'mond', text: 'Vollmond' });
        if (t > von && t <= bis) out.push({ t, art: 'mond', text: 'Neumond' });
    }
    const n = bars.length, k = ta.k;
    let pivot = null;
    for (let i = n - 1 - k; i >= k && pivot == null; i--) {
        let istH = true, istL = true;
        for (let j = i - k; j <= i + k; j++) { if (j === i) continue; if (h(bars[j]) > h(bars[i])) istH = false; if (l(bars[j]) < l(bars[i])) istL = false; }
        if (istH || istL) pivot = i;
    }
    if (pivot != null) FIB_ZEIT.forEach(f => {
        const ti = bars[pivot].time + f * ta.dt;
        if (ti > von && ti <= bis) out.push({ t: ti, art: 'fibzeit', text: 'Fib-Zeit ' + f });
    });
    const d0 = new Date(von * 1000), d1 = new Date(bis * 1000);
    for (let y2 = d0.getUTCFullYear(); y2 <= d1.getUTCFullYear(); y2++) {
        const ts = Date.UTC(y2, 10, 11) / 1000;
        if (ts > von && ts <= bis) out.push({ t: ts, art: 'zahl', text: '11:11' });
    }
    return out.sort((a, b) => a.t - b.t);
}
