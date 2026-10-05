import { D, coin, watch, store } from './data.js?v=202610052250';
import { esc, fPct, ago } from './fmt.js?v=202610052250';
import { icon, icons } from './ui.js?v=202610052250';

const GELESEN = 'cb2_meldungen_gelesen';
const $ = id => document.getElementById(id);
const sek = s => { const t = s ? Date.parse(String(s).replace(' UTC', 'Z').replace(' ', 'T')) : NaN; return isNaN(t) ? null : t / 1000; };
const TAG = 86400;

export function sammeln() {
    const jetzt = Date.now() / 1000, m = [];
    const ts = window.TAGESSIGNALE_DATA;
    if (ts && ts.ergebnis) {
        Object.keys(ts.ergebnis).forEach(ch => (ts.ergebnis[ch].signale || []).forEach(x => {
            const t = sek(x.signal_seit) || sek(ts.stand);
            if (t && jetzt - t < TAG) m.push({ id: 'sig:' + x.token + ':' + x.signal_seit, t, icon: 'crosshair', farbe: 'var(--up)',
                titel: `Neues Tages-Signal: ${x.symbol}`, text: `${(ts.chains || {})[ch] || ch}, Score ${Math.round(x.score)}${x.chart ? ', ' + x.chart.fazit : ''}`, go: 'signale' });
        }));
        (ts.tagebuch || []).forEach(e => {
            const k = e.kol_ausstieg;
            if (k && k.ts && jetzt - sek(k.ts) < 3 * TAG) m.push({ id: 'kol:' + e.id, t: sek(k.ts), icon: 'log-out', farbe: 'var(--down)',
                titel: `KOLs steigen aus: ${e.symbol}`, text: `${k.verkauf_24h || 'Mehrere'} Verkäufe in 24 Stunden${k.seit_signal_pct != null ? ', seit Signal ' + fPct(k.seit_signal_pct) : ''}`, go: 'signale' });
            if (e.max_pct >= 50 && e.hoch_ts && jetzt - sek(e.hoch_ts) < 2 * TAG) m.push({ id: 'lauf:' + e.id + ':' + Math.floor(e.max_pct / 50), t: sek(e.hoch_ts), icon: 'rocket', farbe: 'var(--up)',
                titel: `${e.symbol} lief ${fPct(e.max_pct, 0)} seit dem Signal`, text: `Jetzt ${fPct(e.jetzt_pct, 0)}. Gewinne sichern ist kein Fehler.`, go: 'signale' });
        });
    }
    watch.list().forEach(sym => {
        const c = coin(sym), v = c && c.price_change_percentage_24h;
        if (v != null && Math.abs(v) >= 10) m.push({ id: 'wl:' + sym + ':' + (v > 0 ? 'auf' : 'ab'), t: Math.floor(jetzt / TAG) * TAG,
            icon: v > 0 ? 'trending-up' : 'trending-down', farbe: v > 0 ? 'var(--up)' : 'var(--down)',
            titel: `${sym} ${fPct(v)} in 24 Stunden`, text: 'Starke Bewegung in deiner Watchlist', coin: sym });
    });
    const mp = window.MARKT_PLUS_DATA, sq = mp && mp.squeeze && mp.squeeze.kandidaten;
    if (sq && sq.length) sq.slice(0, 3).forEach(x => m.push({ id: 'sq:' + x.symbol + ':' + (mp.updated || '').slice(0, 10), t: sek(mp.updated) || jetzt,
        icon: 'flame', farbe: 'var(--warn)', titel: `Squeeze-Kandidat: ${x.symbol}`, text: x.grund || '', coin: x.symbol }));
    const h = D.extras && D.extras.fng_history, f = h && h[h.length - 1];
    if (f && (f.value <= 20 || f.value >= 80)) m.push({ id: 'fng:' + (f.date || f.timestamp || f.value), t: sek(D.extras.updated) || jetzt,
        icon: 'thermometer', farbe: f.value <= 20 ? 'var(--a1)' : 'var(--down)',
        titel: `Angst und Gier bei ${f.value}`, text: f.value <= 20 ? 'Extreme Angst. Historisch eher Kauf- als Verkaufszone.' : 'Extreme Gier. Historisch Zeit für Vorsicht.', go: 'stimmung' });
    const st = D.status;
    if (st && st.failed && st.finished_ts) m.push({ id: 'lauf:' + st.finished_ts, t: st.finished_ts, icon: 'triangle-alert', farbe: 'var(--down)',
        titel: `Datenlauf mit ${st.failed} ${st.failed === 1 ? 'Fehler' : 'Fehlern'}`, text: 'Details im Cockpit unter Datenfrische', go: 'cockpit' });
    return m.sort((a, b) => b.t - a.t);
}

const gelesen = () => +store.raw(GELESEN, 0) || 0;
export function zaehlen() {
    const g = gelesen();
    return sammeln().filter(x => x.t > g).length;
}
export function badge() {
    const b = $('bellBtn'); if (!b) return;
    const n = zaehlen();
    let i = b.querySelector('.bell-n');
    if (!n) { if (i) i.remove(); return; }
    if (!i) { i = document.createElement('span'); i.className = 'bell-n'; b.appendChild(i); }
    i.textContent = n > 9 ? '9+' : n;
}
export function panel() {
    const p = $('bellPanel'); if (!p) return;
    const g = gelesen(), liste = sammeln();
    p.innerHTML = `<div class="row between" style="margin-bottom:10px"><span class="eyebrow">Meldungen</span><span class="eyebrow">${liste.length}</span></div>` +
        (liste.length ? `<div class="list">${liste.slice(0, 30).map(x => `<div class="li bell-li${x.t > g ? ' neu' : ''}" ${x.coin ? `data-coin="${esc(x.coin)}"` : `data-go="${esc(x.go || 'cockpit')}"`}>
            <span class="ico-b" style="color:${x.farbe}">${icon(x.icon)}</span>
            <div style="min-width:0"><div class="nm" style="white-space:normal">${esc(x.titel)}</div><div class="sb" style="white-space:normal;font-family:var(--font)">${esc(x.text)}</div></div>
            <div class="val dim" style="font-size:.66rem">${ago(x.t)}</div></div>`).join('')}</div>`
            : '<div class="empty">Gerade nichts Besonderes. Neue Signale, KOL-Ausstiege und starke Bewegungen erscheinen hier.</div>');
    icons(p);
}
export function umschalten(an) {
    const p = $('bellPanel'); if (!p) return;
    const auf = an == null ? !p.classList.contains('on') : an;
    if (auf) { panel(); p.classList.add('on'); try { localStorage.setItem(GELESEN, String(Math.floor(Date.now() / 1000))); } catch (e) {} badge(); }
    else p.classList.remove('on');
}
