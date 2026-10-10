import { esc, fBig } from '../core/fmt.js?v=202610102047';
import { card, pageHead, chip, empty } from '../core/ui.js?v=202610102047';

const ZONES = [
    { name: 'Asia Session',   time: '02:00 bis 09:00', start: 2 * 60,       end: 9 * 60 },
    { name: 'London Open',    time: '08:00 bis 11:00', start: 8 * 60,       end: 11 * 60 },
    { name: 'NY Open',        time: '14:30 bis 17:00', start: 14 * 60 + 30, end: 17 * 60 },
    { name: 'NY Close / Vol', time: '21:00 bis 23:00', start: 21 * 60,      end: 23 * 60 },
];
const BAND = [
    { von: 1, bis: 9, name: 'Asien', farbe: 'var(--a2)' },
    { von: 9, bis: 17, name: 'London', farbe: 'var(--up)' },
    { von: 15, bis: 22, name: 'New York', farbe: 'var(--warn)' },
];

let fmtBerlin = null;
function berlin(d) {
    try {
        if (!fmtBerlin) fmtBerlin = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hour12: false });
        const parts = fmtBerlin.formatToParts(d);
        return { h: +parts.find(p => p.type === 'hour').value % 24, m: +parts.find(p => p.type === 'minute').value };
    } catch (e) {
        return { h: d.getHours(), m: d.getMinutes() };
    }
}
function berlinNowMinutes() { const t = berlin(new Date()); return t.h * 60 + t.m; }

function zonen() {
    const nowM = berlinNowMinutes();
    return ZONES.map(z => {
        const active = nowM >= z.start && nowM < z.end;
        return `<div class="hz-zone ${active ? 'on' : ''}"><span class="hz-dot"></span>
            <div style="min-width:0"><div class="hz-name">${esc(z.name)}</div><div class="hz-time">${esc(z.time)}</div></div>
            ${active ? chip('Läuft gerade', 'var(--up)') : ''}</div>`;
    }).join('');
}
function uhr() {
    const t = berlin(new Date());
    return String(t.h).padStart(2, '0') + ':' + String(t.m).padStart(2, '0');
}

let kzDaten = null, kzLaeuft = null;
function ladeVerlauf() {
    if (kzDaten) return Promise.resolve(kzDaten);
    if (kzLaeuft) return kzLaeuft;
    kzLaeuft = (async () => {
        try {
            const res = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=336');
            const raw = await res.json();
            if (!Array.isArray(raw) || raw.length < 48) throw 0;
            const summe = new Array(24).fill(0), anzahl = new Array(24).fill(0), spanne = new Array(24).fill(0);
            raw.forEach(k => {
                const stunde = berlin(new Date(k[0])).h;
                summe[stunde] += parseFloat(k[7]) || 0;      // Quote-Volumen
                const hoch = parseFloat(k[2]), tief = parseFloat(k[3]);
                if (hoch && tief) spanne[stunde] += (hoch / tief - 1) * 100;
                anzahl[stunde]++;
            });
            kzDaten = {
                volumen: summe.map((v, i) => anzahl[i] ? v / anzahl[i] : 0),
                spanne: spanne.map((v, i) => anzahl[i] ? v / anzahl[i] : 0),
                tage: Math.round(raw.length / 24),
            };
        } catch (e) { kzDaten = null; }
        kzLaeuft = null;
        return kzDaten;
    })();
    return kzLaeuft;
}

function chart(d) {
    const B = 960, H = 240, links = 8, unten = 26;
    const max = Math.max(...d.volumen) || 1;
    const breite = (B - links * 2) / 24;
    const jetzt = berlin(new Date()).h;
    let svg = `<svg viewBox="0 0 ${B} ${H}" role="img" aria-label="Bitcoin-Volumen je Stunde">`;
    BAND.forEach(se => {
        const x = links + se.von * breite;
        svg += `<rect x="${x.toFixed(1)}" y="0" width="${((se.bis - se.von) * breite).toFixed(1)}" height="${H - unten}" rx="10" style="fill:color-mix(in srgb, ${se.farbe} 10%, transparent)"/>` +
            `<text x="${(x + 8).toFixed(1)}" y="16" class="hz-label">${se.name}</text>`;
    });
    d.volumen.forEach((v, i) => {
        const h = Math.max(2, (v / max) * (H - unten - 26));
        const x = links + i * breite + 2, y = H - unten - h;
        const aktiv = i === jetzt;
        const farbe = aktiv ? 'var(--warn)' : v / max > 0.75 ? 'var(--up)'
            : v / max > 0.45 ? 'color-mix(in srgb, var(--up) 50%, transparent)' : 'color-mix(in srgb, var(--ink-3) 45%, transparent)';
        svg += `<rect class="hz-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(breite - 4).toFixed(1)}" height="${h.toFixed(1)}" rx="4" style="fill:${farbe}">` +
            `<title>${i} Uhr: ${fBig(v)} Volumen, Spanne ${d.spanne[i].toFixed(2).replace('.', ',')}%</title></rect>`;
        if (i % 3 === 0 || aktiv) svg += `<text x="${(x + breite / 2 - 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="${aktiv ? 'hz-jetzt' : 'hz-label'}">${i}</text>`;
    });
    return svg + '</svg>';
}
function hinweis(d) {
    const jetzt = berlin(new Date()).h;
    const sortiert = d.volumen.map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v);
    const beste = sortiert.slice(0, 3).map(x => x.i + ' Uhr').join(', ');
    const ruhig = sortiert.slice(-3).map(x => x.i + ' Uhr').reverse().join(', ');
    const jetztRang = sortiert.findIndex(x => x.i === jetzt) + 1;
    return `Aus ${d.tage} Tagen Stundendaten: am meisten läuft um <b>${beste}</b>, am wenigsten um ${ruhig}. ` +
        `Gerade ist es <b>${jetzt} Uhr</b>, das ist Rang ${jetztRang} von 24 im Volumen. ` +
        (jetztRang <= 8 ? 'Gute Zeit für Ausführungen, die Spreads sind eng.' : 'Ruhige Phase. Größere Orders bewegen den Kurs stärker als üblich.');
}

let timer = null, lauf = 0;

export default {
    styles: `
        .hz-zones { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .hz-zone { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 18px 20px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in);
            border: 1px solid transparent; transition: border-color .4s var(--ease), background .4s var(--ease); }
        .hz-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--ink-3); opacity: .45; flex: none; transition: all .4s var(--ease); }
        .hz-name { font-weight: 500; font-size: .95rem; }
        .hz-time { font-family: var(--mono); font-size: .74rem; color: var(--ink-3); margin-top: 3px; }
        .hz-zone.on { border-color: color-mix(in srgb, var(--up) 55%, transparent); background: color-mix(in srgb, var(--up) 8%, var(--bg)); }
        .hz-zone.on .hz-dot { background: var(--up); opacity: 1; box-shadow: 0 0 0 5px color-mix(in srgb, var(--up) 20%, transparent); animation: hzPuls 2s var(--ease) infinite; }
        @keyframes hzPuls { 50% { box-shadow: 0 0 0 9px color-mix(in srgb, var(--up) 0%, transparent); } }
        .hz-scroll { overflow-x: auto; }
        .hz-chart { min-width: 620px; }
        .hz-chart svg { width: 100%; height: auto; display: block; }
        .hz-bar { transition: opacity .2s var(--ease); } .hz-bar:hover { opacity: .7; }
        .hz-label { fill: var(--ink-3); font-size: 11px; font-family: var(--mono); }
        .hz-jetzt { fill: var(--warn); font-size: 11px; font-weight: 700; font-family: var(--mono); }
        .hz-hinweis { margin-top: 18px; font-size: .9rem; line-height: 1.6; color: var(--ink-2); font-weight: 300; }
        .hz-hinweis b { color: var(--ink); font-weight: 500; }
        .hz-legende { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 14px; font-size: .74rem; color: var(--ink-3); }
        .hz-legende[hidden] { display: none; }
        .hz-legende i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
        @media (max-width: 1180px) { .hz-zones { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 860px) { .hz-zones { grid-template-columns: minmax(0, 1fr); } }`,
    async render(root) {
        const id = ++lauf;
        root.classList.add('stack');
        root.innerHTML = pageHead('Trading', 'Handelszeiten', 'Die aktiven Sessions werden live markiert. Die goldenen Stunden für Volatilität und Volumen.',
            `<span class="eyebrow">Berlin <span id="hzUhr">${uhr()}</span></span>`) +
            card({ eyebrow: 'Trading Sessions', title: 'Sessions in Berliner Zeit', body: `<div class="hz-zones" id="hzZones">${zonen()}</div>` }) +
            card({ eyebrow: 'Tagesverlauf', title: 'Wann wirklich gehandelt wird', body: `
                <p class="sub" style="margin:0 0 18px">Durchschnittliches Bitcoin-Volumen je Stunde der letzten 14 Tage, in Berliner Zeit. Die Sessions sind Theorie, das hier ist die Praxis.</p>
                <div class="hz-scroll"><div class="hz-chart" id="hzChart"><div class="skel" style="height:200px"></div></div></div>
                <div class="hz-legende" id="hzLegende" hidden>
                    <span><i style="background:var(--warn)"></i>Aktuelle Stunde</span><span><i style="background:var(--up)"></i>Über 75% vom Spitzenwert</span>
                    <span><i style="background:color-mix(in srgb, var(--up) 50%, transparent)"></i>Über 45%</span><span><i style="background:color-mix(in srgb, var(--ink-3) 45%, transparent)"></i>Ruhig</span>
                </div>
                <div class="hz-hinweis" id="hzHinweis"></div>` });

        const zonesEl = root.querySelector('#hzZones'), uhrEl = root.querySelector('#hzUhr');
        const chartEl = root.querySelector('#hzChart'), hinweisEl = root.querySelector('#hzHinweis');
        let stunde = berlin(new Date()).h;
        const zeichne = () => {
            if (!kzDaten) return;
            chartEl.innerHTML = chart(kzDaten);
            hinweisEl.innerHTML = hinweis(kzDaten);
            root.querySelector('#hzLegende').hidden = false;
        };
        clearInterval(timer);
        timer = setInterval(() => {
            if (!zonesEl.isConnected) { clearInterval(timer); return; }
            zonesEl.innerHTML = zonen(); uhrEl.textContent = uhr();
            const h = berlin(new Date()).h;
            if (h !== stunde) { stunde = h; zeichne(); }
        }, 30000);

        const d = await ladeVerlauf();
        if (id !== lauf || !chartEl.isConnected) return;
        if (!d) { chartEl.innerHTML = empty('Stundendaten gerade nicht erreichbar.'); return; }
        zeichne();
    },
    destroy() { clearInterval(timer); timer = null; lauf++; },
};
