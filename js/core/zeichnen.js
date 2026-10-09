import { store } from './data.js?v=202610090840';
import { fUsd } from './fmt.js?v=202610090840';

const KEY = 'cb2_zeichnungen_v1';
const FIB = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FARBE = { trend: '--a2', strahl: '--a2', hlinie: '--warn', rechteck: '--a1', fib: '--a4' };
export const WERKZEUGE = [
    ['zeiger', 'mouse-pointer-2', 'Auswählen und verschieben (V)'],
    ['hand', 'hand', 'Hand: den Chart greifen und frei verschieben, auch nach oben und unten (G)'],
    ['trend', 'trending-up', 'Trendlinie (T)'],
    ['strahl', 'move-up-right', 'Strahl, läuft nach rechts weiter (R)'],
    ['hlinie', 'minus', 'Preislevel, mit der Maus verschiebbar (H)'],
    ['rechteck', 'square', 'Zone (Z)'],
    ['fib', 'percent', 'Fibonacci-Retracement (F)'],
];
const TASTE = { v: 'zeiger', g: 'hand', t: 'trend', r: 'strahl', h: 'hlinie', z: 'rechteck', f: 'fib' };
const STAND = 'cb2_zeichnungen_stand';       // je Coin der Zeitpunkt der letzten Änderung
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const alle = () => store.get(KEY, {}) || {};
let sichern = () => {};                        // öffentliche Fassung: nur im Browser

const neueId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const de = (v, d) => v.toFixed(d).replace('.', ',');

export function zeichner({ chart, series, box, bars, sym, magnet = true, onTool }) {
    const ts = chart.timeScale();
    const zeiten = bars.map(b => typeof b.time === 'number' ? b.time : Date.parse(b.time) / 1000);
    let liste = (alle()[sym] || []).map(d => ({ ...d }));
    let tool = 'zeiger', sel = null, entwurf = null, start = null, zieh = null, raf = 0, aus = false;
    const levels = new Map();     // id -> PriceLine der Bibliothek, mit Preis an der Achse

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'zc-svg');
    box.appendChild(svg);

    const speichern = () => {
        const a = alle(), st = store.get(STAND, {}) || {};
        a[sym] = liste; st[sym] = Date.now();
        store.set(KEY, a); store.set(STAND, st);
        sichern();
    };

    function zuLogisch(t) {
        const n = zeiten.length;
        if (n < 2) return null;
        if (t <= zeiten[0]) return (t - zeiten[0]) / (zeiten[1] - zeiten[0]);
        if (t >= zeiten[n - 1]) return n - 1 + (t - zeiten[n - 1]) / (zeiten[n - 1] - zeiten[n - 2]);
        let lo = 0, hi = n - 1;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (zeiten[m] <= t) lo = m; else hi = m; }
        return lo + (t - zeiten[lo]) / (zeiten[hi] - zeiten[lo]);
    }
    function zuZeit(l) {
        const n = zeiten.length;
        if (l <= 0) return zeiten[0] + l * (zeiten[1] - zeiten[0]);
        if (l >= n - 1) return zeiten[n - 1] + (l - (n - 1)) * (zeiten[n - 1] - zeiten[n - 2]);
        const i = Math.floor(l);
        return zeiten[i] + (l - i) * (zeiten[i + 1] - zeiten[i]);
    }
    const xy = pt => {
        const l = zuLogisch(pt.t), x = l == null ? null : ts.logicalToCoordinate(l), y = series.priceToCoordinate(pt.p);
        return x == null || y == null ? null : { x, y };
    };
    function punkt(x, y, mitMagnet = true) {
        const l = ts.coordinateToLogical(x);
        let p = series.coordinateToPrice(y);
        if (l == null || p == null) return null;
        let t = zuZeit(l);
        if (magnet && mitMagnet) {
            const i = Math.round(l), b = bars[i];
            if (b && b.open != null) {
                let best = null, bd = 10;
                for (const v of [b.open, b.high, b.low, b.close]) {
                    const yy = series.priceToCoordinate(v);
                    if (yy != null && Math.abs(yy - y) < bd) { bd = Math.abs(yy - y); best = v; }
                }
                if (best != null) { p = best; t = zeiten[i]; }
            }
        }
        return { t, p };
    }

    function levelsSync() {
        const da = new Set();
        liste.forEach(d => {
            if (d.typ !== 'hlinie') return;
            da.add(d.id);
            const opt = { price: d.p1.p, color: css(FARBE.hlinie), lineWidth: d.id === sel ? 2 : 1, lineStyle: 2, axisLabelVisible: !aus, lineVisible: !aus, title: '' };
            const pl = levels.get(d.id);
            if (pl) pl.applyOptions(opt); else levels.set(d.id, series.createPriceLine(opt));
        });
        levels.forEach((pl, id) => { if (!da.has(id)) { try { series.removePriceLine(pl); } catch (e) {} levels.delete(id); } });
    }

    const griff = (p, i, c) => `<circle class="zc-h" data-h="${i}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" stroke="${c}"/>`;
    function form(d, w, h) {
        const c = css(FARBE[d.typ] || '--a2'), an = d.id === sel, sw = an ? 2.2 : 1.6;
        const g = inner => `<g data-id="${d.id}">${inner}</g>`;
        if (d.typ === 'hlinie') {
            const y = series.priceToCoordinate(d.p1.p);
            if (y == null) return '';
            return g(`<line class="zc-hit" x1="0" x2="${w}" y1="${y}" y2="${y}"/>` + (an ? griff({ x: w - 46, y }, 1, c) : ''));
        }
        const a = xy(d.p1), b = xy(d.p2);
        if (!a || !b) return '';
        if (d.typ === 'trend' || d.typ === 'strahl') {
            let x2 = b.x, y2 = b.y;
            if (d.typ === 'strahl') {
                if (Math.abs(b.x - a.x) < 0.5) { y2 = b.y < a.y ? 0 : h; }
                else { x2 = b.x >= a.x ? w : 0; y2 = a.y + (b.y - a.y) / (b.x - a.x) * (x2 - a.x); }
            }
            return g(`<line class="zc-hit" x1="${a.x}" y1="${a.y}" x2="${x2}" y2="${y2}"/>
                <line x1="${a.x}" y1="${a.y}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>` + (an ? griff(a, 1, c) + griff(b, 2, c) : ''));
        }
        if (d.typ === 'rechteck') {
            const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), rw = Math.abs(b.x - a.x), rh = Math.abs(b.y - a.y);
            return g(`<rect class="zc-hitf" x="${x}" y="${y}" width="${rw}" height="${rh}" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-width="${sw}" stroke-opacity=".8" rx="2"/>`
                + (an ? griff(a, 1, c) + griff(b, 2, c) : ''));
        }
        if (d.typ === 'fib') {
            const x0 = Math.min(a.x, b.x), oben = d.p2.p, unten = d.p1.p;
            const zeilen = FIB.map(f => {
                const p = oben - (oben - unten) * f, y = series.priceToCoordinate(p);
                if (y == null) return '';
                const stark = f === 0.5 || f === 0.618;
                return `<line x1="${x0}" x2="${w}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="${stark ? 1.4 : 1}" stroke-opacity="${stark ? .95 : .55}"/>
                    <text class="zc-t" x="${Math.max(x0, 0) + 4}" y="${y - 4}" fill="${c}">${de(f, 3).replace(/0+$/, '').replace(/,$/, '')} · ${fUsd(p)}</text>`;
            }).join('');
            const y5 = series.priceToCoordinate(oben - (oben - unten) * 0.5), y6 = series.priceToCoordinate(oben - (oben - unten) * 0.618);
            const zone = y5 != null && y6 != null ? `<rect x="${x0}" y="${Math.min(y5, y6)}" width="${Math.max(0, w - x0)}" height="${Math.abs(y6 - y5)}" fill="${c}" fill-opacity=".09"/>` : '';
            return g(zone + zeilen + `<line class="zc-hit" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>
                <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${c}" stroke-width="1" stroke-dasharray="4 4"/>` + (an ? griff(a, 1, c) + griff(b, 2, c) : ''));
        }
        return '';
    }
    let auto = null, myst = [], autoAn = true, mystAn = true;
    const X = t => { const l = zuLogisch(t); return l == null ? null : ts.logicalToCoordinate(l); };
    const Y = p => series.priceToCoordinate(p);
    const dollar = p => fUsd(p);
    function autoForm(w, h) {
        if (!auto || !autoAn) return '';
        const ta = auto, gross = w >= 640;
        const cu = css('--up'), cd = css('--down'), cw = css('--warn'), c2 = css('--a2'), c3 = css('--a3'), ci = css('--ink-3');
        const xl = X(ta.letzteZeit);
        let o = '';
        if (ta.fib) {
            const L = f => ta.fib.levels.find(x => x.f === f && !x.ext);
            const y5 = L(0.5) && Y(L(0.5).p), y6 = L(0.618) && Y(L(0.618).p);
            if (y5 != null && y6 != null) o += `<rect x="0" y="${Math.min(y5, y6)}" width="${w}" height="${Math.abs(y6 - y5)}" fill="${cw}" fill-opacity=".08"/>`;
            ta.fib.levels.forEach(lv => {
                const y = Y(lv.p);
                if (y == null || y < -6 || y > h + 6) return;
                const rand = !lv.ext && (lv.f === 0 || lv.f === 1), gold = lv.f === 0.5 || lv.f === 0.618;
                const c = rand ? ci : gold ? cw : lv.ext ? c3 : c2;
                o += `<line x1="0" x2="${w}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="${rand || gold ? 1.2 : 1}" stroke-opacity="${rand ? .8 : gold ? .85 : .45}"${rand ? '' : ' stroke-dasharray="2 4"'}/>`;
                if (gross) {
                    const f = de(lv.f, 3).replace(/0+$/, '').replace(/,$/, '');
                    const t = lv.ext ? `Fib Ext ${f} · ${dollar(lv.p)}` : lv.f === 0 ? `Allzeithoch · ${dollar(lv.p)}` : lv.f === 1 ? `Allzeittief · ${dollar(lv.p)}` : `Fib ${f} · ${dollar(lv.p)}`;
                    o += `<text class="zc-t" x="${w - 6}" y="${y - 4}" text-anchor="end" fill="${c}">${t}</text>`;
                }
            });
        }
        const zone = (z, farbe, titel) => {
            const ya = Y(z.bis), yb = Y(z.von);
            if (ya == null || yb == null || Math.max(ya, yb) < 0 || Math.min(ya, yb) > h) return '';
            const x0 = Math.max(0, z.ext ? 0 : (X(z.start) ?? 0));
            let s = `<rect x="${x0}" y="${Math.min(ya, yb)}" width="${Math.max(0, w - x0)}" height="${Math.max(3, Math.abs(yb - ya))}" fill="${farbe}" fill-opacity=".11" stroke="${farbe}" stroke-opacity=".6"${z.einstieg === false ? ' stroke-dasharray="5 4"' : ''} rx="2"/>`;
            if (gross) s += `<text class="zc-t" x="${Math.max(6, Math.min(x0 + 6, w - 12 - titel.length * 6.1))}" y="${Math.min(ya, yb) + 13}" fill="${farbe}">${titel}</text>`;
            return s;
        };
        ta.kauf.forEach(z => {
            const rr = z.rr != null ? 'R:R 1:' + (z.rr > 10 ? '10+' : de(z.rr, 1)) : '';
            const titel = z.einstieg ? `EINSTIEG ${dollar(z.von)} bis ${dollar(z.bis)} · Stopp ${dollar(z.stopp)} · ${rr} · ${z.gruende.join(' + ') || 'Struktur'}`
                : `BEOBACHTEN ${dollar(z.von)} bis ${dollar(z.bis)} · ${rr ? rr + ' zu klein' : 'kein Ziel'}${z.gruende.length ? ' · ' + z.gruende.join(' + ') : ''}`;
            o += zone(z, cu, titel);
        });
        ta.verkauf.forEach(z => { o += zone(z, cd, `VERKAUF, Gewinne mitnehmen ${dollar(z.von)} bis ${dollar(z.bis)} · ${z.gruende.join(' + ') || 'Struktur'}`); });
        ta.linien.forEach(L => {
            const a = xy(L.p1), b = xy(L.p2);
            if (!a || !b || Math.abs(b.x - a.x) < 1) return;
            const m = (b.y - a.y) / (b.x - a.x), c = L.art === 'widerstand' ? cd : cu, y2 = a.y + m * (w - a.x);
            o += `<line x1="${a.x}" y1="${a.y}" x2="${w}" y2="${y2}" stroke="${c}" stroke-width="1.5" stroke-dasharray="7 4" stroke-opacity=".9"/>`
                + `<circle cx="${a.x}" cy="${a.y}" r="3" fill="${c}"/><circle cx="${b.x}" cy="${b.y}" r="3" fill="${c}"/>`;
            if (gross && xl != null) o += `<text class="zc-t" x="${xl - 8}" y="${a.y + m * (xl - a.x) + (L.art === 'widerstand' ? -6 : 14)}" text-anchor="end" fill="${c}">${L.name} · ${L.beruehrungen} Berührungen</text>`;
        });
        const P = ta.prognose, pk = P.pfad.map(q => ({ x: X(q.t), m: Y(q.mitte), o: Y(q.oben), u: Y(q.unten) }));
        if (xl != null && pk.every(q => q.x != null && q.m != null && q.o != null && q.u != null)) {
            const oben = pk.map(q => `${q.x},${q.o}`).join(' L'), unten = pk.slice().reverse().map(q => `${q.x},${q.u}`).join(' L');
            o += `<line x1="${xl}" x2="${xl}" y1="0" y2="${h}" stroke="${ci}" stroke-opacity=".5" stroke-dasharray="3 4"/>`;
            o += `<path d="M${oben} L${unten} Z" fill="${c2}" fill-opacity=".13" stroke="${c2}" stroke-opacity=".5" stroke-width="1"/>`;
            o += `<path d="M${pk.map(q => `${q.x},${q.m}`).join(' L')}" fill="none" stroke="${c2}" stroke-width="1.8" stroke-dasharray="6 4"/>`;
            if (gross) {
                const x0 = w - 8;
                o += `<text class="zc-t zc-tf" x="${x0}" y="18" text-anchor="end" fill="${c2}">PROGNOSE · nächste ${P.H} Kerzen</text>`
                    + `<text class="zc-t" x="${x0}" y="32" text-anchor="end" fill="${c2}">Basis ${dollar(P.basis)} · Spanne ${dollar(P.unten)} bis ${dollar(P.oben)}</text>`
                    + (P.bull || P.baer ? `<text class="zc-t" x="${x0}" y="46" text-anchor="end" fill="${c2}">${P.bull ? 'Bullisch bis ' + dollar(P.bull) : ''}${P.bull && P.baer ? ' · ' : ''}${P.baer ? 'Bärisch unter ' + dollar(P.baer) : ''}</text>` : '');
            }
        }
        if (mystAn) myst.forEach(m => {
            const x = X(m.t);
            if (x == null || x < 0 || x > w) return;
            const c = m.art === 'mond' ? ci : m.art === 'fibzeit' ? c2 : c3;
            o += `<line x1="${x}" x2="${x}" y1="0" y2="${h}" stroke="${c}" stroke-opacity=".5" stroke-dasharray="1 5" stroke-width="1.2"/>`;
            if (gross) o += `<text class="zc-t" transform="translate(${x - 4},${h - 8}) rotate(-90)" fill="${c}">${m.art === 'mond' ? (m.text === 'Vollmond' ? '○ ' : '● ') : '✦ '}${m.text}</text>`;
        });
        if (gross) {
            const htf = ta.htf === 'auf' ? 'aufwärts' : ta.htf === 'ab' ? 'abwärts' : 'offen';
            o += `<text class="zc-t zc-tf" x="10" y="16" fill="${ci}">AUTO-TA · Weekly ${htf} · Struktur ${ta.struktur}${ta.rsi != null ? ' · RSI ' + de(ta.rsi, 0) : ''}</text>`;
            let y = 30;
            if (ta.heiss) { o += `<text class="zc-t zc-tf" x="10" y="${y}" fill="${cd}">ÜBERHITZT: RSI über 70 und Angst und Gier über 75. Nicht jagen.</text>`; y += 14; }
            o += `<text class="zc-t" x="10" y="${y}" fill="${ci}" fill-opacity=".8">Regelbasiert nach Playbook, keine Anlageberatung</text>`;
        }
        return o;
    }
    function autoskala() {
        series.applyOptions({ autoscaleInfoProvider: orig => {
            const r = orig();
            if (!auto || !autoAn || !r || !r.priceRange) return r;
            let lo = r.priceRange.minValue, hi = r.priceRange.maxValue;
            const P = auto.prognose, j = auto.jetzt;
            hi = Math.max(hi, P.oben); lo = Math.min(lo, P.unten);
            auto.kauf.forEach(z => { if (z.mitte > j * 0.6) lo = Math.min(lo, z.von); });
            auto.verkauf.forEach(z => { if (z.mitte < j * 1.7) hi = Math.max(hi, z.bis); });
            return { ...r, priceRange: { minValue: lo, maxValue: hi } };
        } });
    }
    function zukunftZeigen() {
        if (!auto || !autoAn) { ts.fitContent(); return; }
        ts.setVisibleLogicalRange({ from: -1, to: zeiten.length - 1 + auto.prognose.H * 1.3 });
    }

    function zeichne() {
        raf = 0;
        if (!box.isConnected) return;
        const s = getComputedStyle(box);
        const pl = parseFloat(s.paddingLeft) || 0, pt = parseFloat(s.paddingTop) || 0, pb = parseFloat(s.paddingBottom) || 0;
        const w = Math.max(0, ts.width()), h = Math.max(0, box.clientHeight - pt - pb - ts.height());
        svg.style.cssText = `left:${pl}px;top:${pt}px;width:${w}px;height:${h}px`;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.innerHTML = autoForm(w, h) + (aus ? '' : [...liste, ...(entwurf ? [entwurf] : [])].map(d => form(d, w, h)).join(''));
        levelsSync();
    }
    const plan = () => { if (!raf) raf = requestAnimationFrame(zeichne); };

    const lokal = e => { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    function setTool(t) {
        tool = t; entwurf = null;
        svg.classList.toggle('aktiv', t !== 'zeiger' && t !== 'hand');
        svg.classList.toggle('hand', t === 'hand');
        box.classList.toggle('hand', t === 'hand');
        if (t === 'hand') chart.priceScale('right').applyOptions({ autoScale: false });
        if (t !== 'zeiger') sel = null;
        if (onTool) onTool(t);
        plan();
    }
    function neu(d) {
        d.id = neueId();
        liste.push(d);
        sel = d.id; entwurf = null;
        speichern();
        setTool('zeiger');
    }
    function fadenkreuz(x, y) {
        if (!chart.setCrosshairPosition) return;
        const l = ts.coordinateToLogical(x), p = series.coordinateToPrice(y);
        if (l == null || p == null) return;
        const i = Math.max(0, Math.min(zeiten.length - 1, Math.round(l)));
        try { chart.setCrosshairPosition(p, bars[i].time, series); } catch (e) {}
    }

    svg.addEventListener('pointerdown', e => {
        if (e.button > 0 || aus) return;
        const { x, y } = lokal(e);
        if (tool === 'zeiger') {
            const gr = e.target.closest('[data-id]');
            if (!gr) return;
            const d = liste.find(z => z.id === gr.dataset.id);
            if (!d) return;
            e.preventDefault(); e.stopPropagation();
            sel = d.id;
            zieh = { d, h: e.target.dataset.h ? +e.target.dataset.h : 0, x, y, orig: { p1: { ...d.p1 }, p2: { ...d.p2 } } };
            plan();
            return;
        }
        e.preventDefault(); e.stopPropagation();
        const pt = punkt(x, y);
        if (!pt) return;
        if (tool === 'hlinie') { neu({ typ: 'hlinie', p1: pt, p2: pt }); return; }
        if (entwurf) { entwurf.p2 = pt; neu(entwurf); return; }
        entwurf = { id: '_entwurf', typ: tool, p1: pt, p2: { ...pt } };
        start = { x, y };
        plan();
    });
    const bewegen = e => {
        if (!zieh && !entwurf && tool === 'zeiger') return;
        const { x, y } = lokal(e);
        if (zieh) {
            const d = zieh.d;
            if (zieh.h && d.typ !== 'hlinie') {
                const pt = punkt(x, y); if (pt) d['p' + zieh.h] = pt;
            } else {
                const l0 = ts.coordinateToLogical(zieh.x), l1 = ts.coordinateToLogical(x);
                const q0 = series.coordinateToPrice(zieh.y), q1 = series.coordinateToPrice(y);
                if (l0 == null || l1 == null || q0 == null || q1 == null) return;
                ['p1', 'p2'].forEach(k => { d[k] = { t: zuZeit(zuLogisch(zieh.orig[k].t) + (l1 - l0)), p: zieh.orig[k].p + (q1 - q0) }; });
            }
            plan();
            return;
        }
        if (tool !== 'zeiger') fadenkreuz(x, y);
        if (entwurf) { const pt = punkt(x, y); if (pt) { entwurf.p2 = pt; plan(); } }
    };
    const loslassen = e => {
        if (zieh) {
            zieh = null;
            speichern(); plan();
            return;
        }
        if (entwurf && start) {
            const { x, y } = lokal(e);
            if (Math.hypot(x - start.x, y - start.y) > 6) neu(entwurf);
            start = null;
        }
    };
    const taste = e => {
        if (!box.isConnected || !box.closest('.cd-wrap.zoom, .drawer.on')) return;
        if (/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) return;
        if (e.key === 'Escape' && (entwurf || tool !== 'zeiger' || sel)) {
            e.stopImmediatePropagation(); e.preventDefault();
            if (entwurf || tool !== 'zeiger') setTool('zeiger'); else { sel = null; plan(); }
            return;
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); loeschen(); return; }
        if (e.metaKey || e.ctrlKey || e.altKey || !box.closest('.cd-wrap.zoom')) return;
        const t = TASTE[(e.key || '').toLowerCase()];
        if (t) { e.preventDefault(); setTool(t); }
    };
    const greifen = () => { if (tool === 'hand') box.classList.add('greift'); };
    const loslassenHand = () => box.classList.remove('greift');
    box.addEventListener('pointerdown', greifen, true);
    window.addEventListener('pointerup', loslassenHand);
    window.addEventListener('pointermove', bewegen);
    window.addEventListener('pointerup', loslassen);
    window.addEventListener('keydown', taste, true);
    svg.addEventListener('pointerleave', () => { if (chart.clearCrosshairPosition) try { chart.clearCrosshairPosition(); } catch (e) {} });

    ts.subscribeVisibleLogicalRangeChange(plan);
    chart.subscribeCrosshairMove(plan);
    const ro = new ResizeObserver(plan);
    ro.observe(box);
    plan();

    function loeschen() {
        if (!sel) return;
        liste = liste.filter(d => d.id !== sel);
        sel = null; speichern(); plan();
    }
    return {
        setTool, get tool() { return tool; },
        setMagnet(v) { magnet = v; },
        ansichtAuto() { chart.priceScale('right').applyOptions({ autoScale: true }); zukunftZeigen(); plan(); },
        setAuto(ta, mst, ansicht = true) { auto = ta; myst = mst || []; autoskala(); if (ansicht && ta && autoAn) zukunftZeigen(); plan(); },
        setAutoAn(v, ansicht = true) { autoAn = v; if (ansicht) { chart.priceScale('right').applyOptions({ autoScale: true }); zukunftZeigen(); } plan(); },
        setMystikAn(v) { mystAn = v; plan(); },
        get autoDa() { return !!auto; },
        get anzahl() { return liste.length; },
        get auswahl() { return sel; },
        loeschen,
        alleLoeschen() { liste = []; sel = null; entwurf = null; speichern(); plan(); },
        ausblenden(v) { aus = v; sel = null; plan(); },
        destroy() {
            box.removeEventListener('pointerdown', greifen, true);
            window.removeEventListener('pointerup', loslassenHand);
            box.classList.remove('hand', 'greift');
            window.removeEventListener('pointermove', bewegen);
            window.removeEventListener('pointerup', loslassen);
            window.removeEventListener('keydown', taste, true);
            try { ts.unsubscribeVisibleLogicalRangeChange(plan); chart.unsubscribeCrosshairMove(plan); } catch (e) {}
            ro.disconnect();
            if (raf) cancelAnimationFrame(raf);
            levels.forEach(pl => { try { series.removePriceLine(pl); } catch (e) {} });
            levels.clear();
            svg.remove();
        },
    };
}
