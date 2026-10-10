import { esc, fPct } from '../core/fmt.js?v=202610102228';
import { card, pageHead, chip, empty, icon, hydrate } from '../core/ui.js?v=202610102228';

const H = () => window.HERDEN_DATA || null;
const ZONEN = [[0, 20, 'Kapitulation', 'var(--up)'], [20, 40, 'Angst', 'color-mix(in srgb, var(--up) 55%, var(--ink-3))'], [40, 60, 'Neutral', 'var(--ink-3)'], [60, 80, 'Gier', 'color-mix(in srgb, var(--down) 55%, var(--ink-3))'], [80, 100, 'Euphorie', 'var(--down)']];
const SKALA = ['Sehr bearish', 'Bearish', 'Neutral', 'Bullish', 'Sehr bullish'];
const z = (v, d = 0) => v == null ? '–' : Number(v).toLocaleString('de-DE', { maximumFractionDigits: d });
const ton = w => w == null ? 'var(--ink-3)' : w >= 15 ? 'var(--up)' : w <= -15 ? 'var(--down)' : 'var(--warn)';
const tonText = w => w == null ? 'keine Daten' : w >= 40 ? 'sehr bullish' : w >= 15 ? 'bullish' : w > -15 ? 'neutral' : w > -40 ? 'bearish' : 'sehr bearish';
const vorTagen = d => { const t = Math.round((Date.now() - new Date(d + 'T12:00:00')) / 86400000); return t <= 0 ? 'heute' : t === 1 ? 'gestern' : `vor ${t} T`; };
const initialen = n => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('');
const reduziert = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function tacho(idx, stufe) {
    const R = 120, cxp = 150, cyp = 150, pt = (wert, r = R) => { const a = Math.PI * (1 - wert / 100); return [cxp + r * Math.cos(a), cyp - r * Math.sin(a)]; };
    const bogen = (a, b) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); return `M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}`; };
    const segs = ZONEN.map(([a, b, l, c]) => `<path d="${bogen(a + 0.8, b - 0.8)}" stroke="${c}" stroke-width="16" fill="none" stroke-linecap="round" opacity="${idx != null && idx >= a && idx < (b === 100 ? 101 : b) ? 1 : 0.32}"/>`).join('');
    const labels = ZONEN.map(([a, b, l]) => { const [x, y] = pt((a + b) / 2, R + 24); return `<text x="${x}" y="${y}" text-anchor="middle" class="hr-tl">${l}</text>`; }).join('');
    return `<div class="hr-tacho"><svg viewBox="-36 0 372 166" role="img" aria-label="Herden-Index ${z(idx)} von 100, ${esc(stufe ? stufe.label : '')}">
        ${segs}${labels}
        <g class="hr-nadel" data-ziel="${idx == null ? 50 : idx}" style="transform-origin:150px 150px;transform:rotate(-90deg)">
            <line x1="150" y1="150" x2="150" y2="52" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>
            <circle cx="150" cy="150" r="9" fill="var(--ink)"/><circle cx="150" cy="150" r="3.5" fill="var(--surface)"/>
        </g></svg>
        <div class="hr-wert"><b class="num" data-count="${idx == null ? '' : Math.round(idx)}">${idx == null ? '–' : 0}</b><span>${esc(stufe ? stufe.label : 'keine Daten')}</span></div></div>`;
}

function heldKarte(D) {
    const teile = (D.teile || []).map(t => `<div class="hr-teil"><div class="row between"><span>${esc(t.name)} <i class="dim">${t.gewicht} %</i></span><b class="mono">${z(t.wert)}</b></div>
        <div class="hr-spur"><i style="--w:${t.wert == null ? 0 : t.wert}%;--c:${t.wert == null ? 'var(--ink-3)' : t.wert >= 60 ? 'var(--down)' : t.wert <= 40 ? 'var(--up)' : 'var(--warn)'}"></i></div></div>`).join('');
    const m = D.markt || {};
    return `<section class="card hr-held">
        <div class="hr-held-l">${tacho(D.index, D.stufe)}</div>
        <div class="hr-held-r">
            <div class="eyebrow">Herden-Index jetzt</div>
            <h2 class="h2 hr-stufe">${esc(D.stufe ? D.stufe.label : 'Keine Daten')}</h2>
            <p class="hr-kontra">${icon('repeat-2')}<span><b>Konträr gelesen:</b> ${esc(D.stufe ? D.stufe.kontra : '')}</span></p>
            <div class="hr-teile">${teile}</div>
            <div class="hr-mini"><span>Angst und Gier <b>${z(m.fng)}</b></span><span>Long/Short <b>${m.long_short != null ? z(m.long_short, 2) : '–'}</b></span><span>Funding <b>${m.funding != null ? z(m.funding * 100, 4) + ' %' : '–'}</b></span><span>Community <b>${z(m.community)} % Daumen hoch</b></span></div>
        </div></section>`;
}

const feed = { items: [], eintraege: [], gelesen: new Set(), cursor: 0, pause: false, timer: 0, timers: [], el: null };
const INTERVALL = 1800, START = 3;
function feedLeeren() { feed.timers.forEach(clearTimeout); feed.timers = []; clearTimeout(feed.timer); }
function spaeter(fn, ms) { feed.timers.push(setTimeout(fn, ms)); }

function karteHtml(it, neu) {
    const p = Math.max(0, Math.min(100, 50 + it.wert / 2));
    const stufeI = Math.max(0, Math.min(4, Math.round(p / 25)));
    return `<div class="hr-fi${neu ? ' neu' : ''}${feed.gelesen.has(it.id) ? ' gelesen' : ''}" data-fid="${esc(it.id)}" role="listitem">
      <div class="hr-fi-in"><article class="hr-fk" style="--acc:${ton(it.wert)}">
        <span class="hr-tile">${esc(initialen(it.kanal))}<i class="hr-ring"></i></span>
        <div class="hr-fk-b">
            <div class="hr-fk-k"><span>${esc(it.kanal)}</span><span>·</span><span class="mono">${neu ? 'jetzt' : esc(vorTagen(it.datum))}</span>${it.kampagne ? '<span class="hr-kamp">Kampagnen-Kanal</span>' : ''}</div>
            <a class="hr-fk-t" href="https://www.youtube.com/watch?v=${encodeURIComponent(it.id)}" target="_blank" rel="noopener" data-stop>${esc(it.titel)}</a>
            ${it.zitat ? `<div class="hr-msg"><span class="hr-av">${esc(initialen(it.kanal))}</span><div class="hr-bubble"><span class="hr-dots"><i></i><i></i><i></i></span><span class="hr-txt">${esc(it.zitat).split(' ').map(w => `<span>${w}</span>`).join(' ')}</span></div></div>` : ''}
            <div class="hr-skala" data-p="${p}"><div class="hr-sk-l"><i class="hr-sk-f"></i>${SKALA.map((_, i) => `<b style="left:${i * 25}%" class="${i <= stufeI ? 'an' : ''}"></b>`).join('')}<span class="hr-sk-m"></span></div>
                <div class="hr-sk-t">${SKALA.map((s, i) => `<span style="left:${i * 25}%" class="${i === stufeI ? 'an' : ''}">${s}</span>`).join('')}</div></div>
            <div class="hr-fk-f"><span class="hr-roll num" data-wert="${Math.round(it.wert)}">${it.wert >= 0 ? '+' : '−'}${Math.abs(Math.round(it.wert))}</span><span class="dim">Stimmung ${tonText(it.wert)}</span>${it.views != null ? `<span class="dim mono">${z(it.views)} Aufrufe</span>` : ''}</div>
        </div>
        ${feed.gelesen.has(it.id) ? '' : '<span class="hr-punkt"></span>'}
        <button class="hr-x" data-weg="${esc(it.id)}" aria-label="Meldung entfernen">${icon('x')}</button>
      </article></div></div>`;
}

function spielen(el, verz = 260) {
    if (!el || reduziert()) { if (el) { el.classList.add('fertig'); setzeSkala(el, true); } return; }
    el.classList.remove('fertig');
    el.querySelector('.hr-ring')?.animate([{ transform: 'scale(1)', opacity: .6 }, { transform: 'scale(1.75)', opacity: 0 }], { duration: 900, delay: verz, easing: 'cubic-bezier(.2,.7,.3,1)' });
    const msg = el.querySelector('.hr-msg');
    if (msg) {
        msg.classList.add('tippt');
        const dots = [...msg.querySelectorAll('.hr-dots i')].map((d, i) => d.animate([{ transform: 'translateY(0)', opacity: .35 }, { transform: 'translateY(-3px)', opacity: 1 }, { transform: 'translateY(0)', opacity: .35 }], { duration: 760, delay: i * 130, iterations: Infinity }));
        spaeter(() => {
            dots.forEach(a => a.cancel()); msg.classList.remove('tippt');
            [...msg.querySelectorAll('.hr-txt > span')].forEach((w, i) => w.animate([{ opacity: 0, transform: 'translateY(4px)', filter: 'blur(2px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 260, delay: i * 40, easing: 'ease-out', fill: 'backwards' }));
        }, verz + 1000);
    }
    setzeSkala(el, false);
    spaeter(() => setzeSkala(el, true), verz + 120);
    const r = el.querySelector('.hr-roll');
    if (r) {
        const ziel = +r.dataset.wert, t0 = performance.now() + verz + 200;
        const schritt = t => { const k = Math.min(1, Math.max(0, (t - t0) / 900)), e = 1 - Math.pow(1 - k, 3), v = Math.round(ziel * e); r.textContent = (v >= 0 ? '+' : '−') + Math.abs(v); if (k < 1) requestAnimationFrame(schritt); };
        requestAnimationFrame(schritt);
    }
    spaeter(() => el.classList.add('fertig'), verz + 1400);
}
function setzeSkala(el, ziel) {
    const s = el.querySelector('.hr-skala'); if (!s) return;
    const p = ziel ? +s.dataset.p : 50;
    s.querySelector('.hr-sk-f').style.width = p + '%';
    s.querySelector('.hr-sk-m').style.left = p + '%';
}

function glocke() { if (!reduziert()) feed.el?.querySelector('.hr-bell')?.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(16deg)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }], { duration: 720, easing: 'ease-out' }); }
function zaehler() {
    if (!feed.el) return;
    const n = feed.eintraege.filter(id => !feed.gelesen.has(id)).length;
    const c = feed.el.querySelector('.hr-count'); c.textContent = n; c.classList.toggle('null', !n);
    feed.el.querySelector('[data-alle]').disabled = !n;
    feed.el.querySelector('[data-leeren]').disabled = !feed.eintraege.length;
    feed.el.querySelector('.hr-leer').hidden = !!feed.eintraege.length;
}
function ankunft(it) {
    const liste = feed.el.querySelector('.hr-fl');
    liste.insertAdjacentHTML('afterbegin', karteHtml(it, true));
    const el = liste.firstElementChild;
    feed.eintraege.unshift(it.id);
    icons(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('da')));
    spielen(el);
    glocke(); zaehler();
}
function schleife() {
    if (!feed.el || !document.body.contains(feed.el)) return;
    if (feed.pause) { feed.timer = setTimeout(schleife, 300); return; }
    if (feed.cursor < feed.items.length) {
        ankunft(feed.items[feed.cursor++]);
        feed.timer = setTimeout(schleife, feed.cursor < feed.items.length ? INTERVALL : INTERVALL * 2.2);
        return;
    }
    const dauer = alleWeg();
    feed.timer = setTimeout(() => { neuStart(); feed.timer = setTimeout(schleife, 950); }, dauer + 200);
}
function alleWeg() {
    const els = [...feed.el.querySelectorAll('.hr-fi')];
    els.forEach((el, i) => { el.style.transitionDelay = (i * 60) + 'ms'; el.classList.add('weg'); });
    const dauer = reduziert() ? 0 : 340 + Math.max(0, els.length - 1) * 60;
    spaeter(() => { els.forEach(e => e.remove()); feed.eintraege = []; zaehler(); }, dauer);
    return dauer;
}
function neuStart() {
    const liste = feed.el.querySelector('.hr-fl');
    feed.eintraege = []; feed.gelesen = new Set();
    const start = feed.items.slice(0, START).reverse();
    feed.cursor = START;
    liste.innerHTML = start.map(it => karteHtml(it, false)).join('');
    feed.eintraege = start.map(it => it.id).reverse();
    icons(liste);
    [...liste.children].forEach((el, i) => { setTimeout(() => el.classList.add('da'), 30 + i * 90); el.classList.add('fertig'); setzeSkala(el, true); });
    zaehler();
}
const icons = el => { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.7 }, nameAttr: 'data-lucide', root: el }); };

function feedKarte(D) {
    feed.items = (D.feed || []).slice(0, 18).reverse();
    return `<section class="hr-feed" data-feed>
        <div class="hr-fh"><svg class="hr-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15Z M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>
            <h3>Was die Herde sagt</h3><span class="hr-count">0</span>
            <div class="hr-fh-r"><button data-alle>Alle gelesen</button><button data-leeren>Leeren</button></div></div>
        <div class="hr-fl-w"><div class="hr-fl" role="list" aria-label="Was die Herde sagt"></div>
            <div class="hr-leer" hidden><span>${icon('check')}</span><p>Alles gelesen</p><p class="dim">Neue Meldungen landen hier.</p></div></div>
        <p class="hr-fnote">Jede Meldung ist ein Video der letzten 14 Tage. Das Zitat ist der Satz mit der deutlichsten Stimmung aus dem Transkript. Maus drüber pausiert, Klick spielt erneut ab.</p>
    </section>`;
}

function feedStart(root) {
    feedLeeren();
    feed.el = root.querySelector('[data-feed]');
    if (!feed.el || !feed.items.length) return;
    neuStart();
    feed.el.onpointerenter = () => { feed.pause = true; };
    feed.el.onpointerleave = () => { feed.pause = false; };
    feed.el.onclick = e => {
        if (e.target.closest('[data-stop]')) return;
        const weg = e.target.closest('[data-weg]');
        if (weg) { const el = weg.closest('.hr-fi'); el.classList.add('weg'); feed.eintraege = feed.eintraege.filter(x => x !== weg.dataset.weg); spaeter(() => { el.remove(); zaehler(); }, 340); return; }
        if (e.target.closest('[data-alle]')) { feed.eintraege.forEach(id => feed.gelesen.add(id)); feed.el.querySelectorAll('.hr-punkt').forEach(p => p.remove()); zaehler(); return; }
        if (e.target.closest('[data-leeren]')) { alleWeg(); return; }
        const k = e.target.closest('.hr-fi');
        if (k) { feed.gelesen.add(k.dataset.fid); k.querySelector('.hr-punkt')?.remove(); spielen(k, 0); zaehler(); }
    };
    feed.timer = setTimeout(schleife, 450);
}

function narrativKarte(D) {
    const N = D.narrative || [];
    if (!N.length) return '';
    return card({
        eyebrow: 'Narrative', title: 'Wie über welches Thema gesprochen wird',
        body: `<p class="hr-p">Für jedes Narrativ zählen nur die Sätze, in denen es vorkommt. Links bearish, rechts bullish. Klick zeigt das deutlichste Zitat in beide Richtungen.</p>
        <div class="hr-nl">${N.map((n, i) => `<button class="hr-n" data-n="${i}" aria-expanded="false">
            <span class="hr-n-name">${esc(n.name)}<i class="dim">${z(n.saetze)} Sätze, ${n.quellen.length} Kanäle</i></span>
            <span class="hr-div"><i class="hr-mid"></i><i class="hr-bar" style="--a:${n.wert >= 0 ? 50 : 50 + n.wert / 2}%;--b:${Math.abs(n.wert) / 2}%;--c:${ton(n.wert)}"></i></span>
            <b class="mono" style="color:${ton(n.wert)}">${n.wert >= 0 ? '+' : '−'}${z(Math.abs(n.wert))}</b>
        </button><div class="hr-nz" hidden>${[['Bullish', n.zitat_bull, 'var(--up)'], ['Bearish', n.zitat_bear, 'var(--down)']].map(([l, q, c]) => q ? `<div class="hr-q" style="--c:${c}"><span class="eyebrow">${l} · ${esc(q.quelle)} · ${esc(q.datum)}</span><p>„${esc(q.text)}“</p></div>` : `<div class="hr-q" style="--c:var(--ink-3)"><span class="eyebrow">${l}</span><p class="dim">Kein deutliches Zitat.</p></div>`).join('')}</div>`).join('')}</div>`,
    });
}

function verlaufKarte(D) {
    const V = (D.verlauf || []).filter(v => v.influencer != null || v.fng != null);
    if (V.length < 3) return '';
    const W = 640, Hh = 220, L = 34, Rr = 52, T = 14, B = 26, n = V.length;
    const x = i => L + (W - L - Rr) * i / (n - 1), y = v => T + (Hh - T - B) * (1 - v / 100);
    const btc = V.map(v => v.btc).filter(v => v != null), bmin = Math.min(...btc), bmax = Math.max(...btc);
    const yb = v => T + (Hh - T - B) * (1 - (v - bmin) / Math.max(1, bmax - bmin));
    const linie = (key, f) => { let d = '', an = false; V.forEach((v, i) => { if (v[key] == null) { an = false; return; } d += (an ? 'L' : 'M') + x(i).toFixed(1) + ' ' + f(v[key]).toFixed(1) + ' '; an = true; }); return d; };
    const zonen = [[80, 100, 'var(--down)'], [0, 20, 'var(--up)']].map(([a, b, c]) => `<rect x="${L}" y="${y(b)}" width="${W - L - Rr}" height="${y(a) - y(b)}" fill="${c}" opacity=".07"/>`).join('');
    const ticks = [0, 25, 50, 75, 100].map(t => `<text x="${L - 6}" y="${y(t) + 3}" text-anchor="end" class="hr-ax">${t}</text><line x1="${L}" x2="${W - Rr}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/>`).join('');
    const xt = [0, Math.floor(n / 2), n - 1].map(i => `<text x="${x(i)}" y="${Hh - 6}" text-anchor="middle" class="hr-ax">${esc(V[i].datum.slice(8, 10) + '.' + V[i].datum.slice(5, 7) + '.')}</text>`).join('');
    const bt = btc.length ? `<text x="${W - Rr + 6}" y="${yb(bmax) + 3}" class="hr-ax">$${z(bmax / 1000, 1)}k</text><text x="${W - Rr + 6}" y="${yb(bmin) + 3}" class="hr-ax">$${z(bmin / 1000, 1)}k</text>` : '';
    return card({
        eyebrow: 'Verlauf 30 Tage', title: 'Stimmung gegen Kurs',
        right: `<div class="row wrap hr-leg"><span style="--c:var(--pg)">Influencer (7 Tage)</span><span style="--c:var(--warn)">Angst und Gier</span><span style="--c:var(--ink-3)">BTC</span></div>`,
        body: `<div class="hr-chart" data-chart><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Verlauf Influencer-Stimmung, Angst und Gier und Bitcoin-Kurs">
            ${zonen}${ticks}${xt}${bt}
            ${btc.length ? `<path d="${linie('btc', yb)}" fill="none" stroke="var(--ink-3)" stroke-width="1.5" stroke-dasharray="3 4"/>` : ''}
            <path d="${linie('fng', y)}" fill="none" stroke="var(--warn)" stroke-width="2"/>
            <path class="hr-zeichne" d="${linie('influencer', y)}" fill="none" stroke="var(--pg)" stroke-width="2.6" stroke-linecap="round"/>
            <line class="hr-hl" x1="0" x2="0" y1="${T}" y2="${Hh - B}" stroke="var(--ink-3)" stroke-dasharray="2 3" opacity="0"/>
        </svg><div class="hr-tip" hidden></div></div>
        <p class="hr-p">Die rot hinterlegte Zone oben ist Euphorie, die grüne unten Kapitulation. Die eigene Tageshistorie des Gesamt-Index wächst ab ${esc(Object.keys(D.historie || {}).sort()[0] || 'heute')} täglich mit.</p>`,
    });
}
function verlaufBind(root, D) {
    const box = root.querySelector('[data-chart]'); if (!box) return;
    const V = (D.verlauf || []).filter(v => v.influencer != null || v.fng != null), svg = box.querySelector('svg'), tip = box.querySelector('.hr-tip'), hl = box.querySelector('.hr-hl');
    const pfad = box.querySelector('.hr-zeichne');
    if (pfad && !reduziert()) { const l = pfad.getTotalLength(); pfad.style.strokeDasharray = l; pfad.animate([{ strokeDashoffset: l }, { strokeDashoffset: 0 }], { duration: 1400, easing: 'cubic-bezier(.3,.7,.2,1)' }); }
    box.onpointermove = e => {
        const r = svg.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width * 640;
        const i = Math.max(0, Math.min(V.length - 1, Math.round((fx - 34) / (640 - 86) * (V.length - 1)))), v = V[i];
        const px = 34 + (640 - 86) * i / (V.length - 1);
        hl.setAttribute('x1', px); hl.setAttribute('x2', px); hl.setAttribute('opacity', 1);
        tip.hidden = false; tip.style.left = (px / 640 * 100) + '%';
        tip.innerHTML = `<b>${esc(v.datum.slice(8, 10) + '.' + v.datum.slice(5, 7) + '.')}</b><span>Influencer ${z(v.influencer)}</span><span>Angst und Gier ${z(v.fng)}</span><span>BTC ${v.btc ? '$' + z(v.btc) : '–'}</span>`;
    };
    box.onpointerleave = () => { tip.hidden = true; hl.setAttribute('opacity', 0); };
}

function kanalKarte(D) {
    const K = (D.influencer && D.influencer.kanaele) || [];
    const max = Math.max(1, ...K.map(k => k.gewicht || 0));
    return card({
        eyebrow: 'Einzelne Stimmen', title: 'Wie jeder Kanal gerade klingt',
        body: `<div class="hr-kl">${K.map(k => {
            const pts = (k.videos || []).slice().reverse().map(v => v.wert);
            const sp = pts.length > 1 ? `<svg viewBox="0 0 80 24" class="hr-sp"><line x1="0" x2="80" y1="12" y2="12" stroke="var(--line)"/><polyline fill="none" stroke="${ton(k.wert)}" stroke-width="1.6" points="${pts.map((v, i) => `${(i / (pts.length - 1) * 80).toFixed(1)},${(12 - v / 100 * 11).toFixed(1)}`).join(' ')}"/></svg>` : '';
            return `<div class="hr-k">
                <span class="hr-tile sm" style="--acc:${ton(k.wert)}">${esc(initialen(k.name))}</span>
                <span class="hr-k-n"><b>${esc(k.name)}</b><i class="dim">${z(k.abos)} Abos · ${k.n} Videos in ${D.fenster_tage} Tagen${k.kampagne ? ' · Kampagnen-Kanal' : ''}</i></span>
                <span class="hr-k-g" title="Gewicht im Index (Wurzel der Abonnenten)"><i style="width:${(k.gewicht || 0) / max * 100}%"></i></span>
                ${sp}
                <span class="hr-k-w" style="color:${ton(k.wert)}">${k.wert == null ? '–' : (k.wert >= 0 ? '+' : '−') + z(Math.abs(k.wert))}<i class="dim">${tonText(k.wert)}${k.trend != null ? ` · ${k.trend >= 0 ? '▲' : '▼'} ${z(Math.abs(k.trend))}` : ''}</i></span>
            </div>`;
        }).join('')}</div>`,
    });
}

function methodeKarte(D) {
    return card({
        eyebrow: 'So wird gerechnet', title: 'Methode und Grenzen', cls: 'sunk',
        body: `<ul class="hr-ul">
            <li><b>Herden-Index 0 bis 100:</b> Influencer 35 %, Angst und Gier (alternative.me) 25 %, Derivate 25 % (Long/Short-Verhältnis der größten Futures, gewichtet nach offenem Interesse, dazu Funding), CoinGecko Community 15 % (Anteil Daumen hoch).</li>
            <li><b>Influencer-Stimmung:</b> ${esc(D.methode || '')} Ergebnis von −100 (sehr bearish) bis +100 (sehr bullish), im Index auf 0 bis 100 umgerechnet.</li>
            <li><b>Konträre Lesart:</b> Euphorie über 80 heißt Vorsicht, Kapitulation unter 20 heißt hinschauen. Das ist eine oft beobachtete Regel (Hypothese), kein Gesetz. Stimmung kann lange extrem bleiben.</li>
            <li><b>Grenzen:</b> Eine Wortliste versteht keine Ironie und keine Fragen („Is the bull market over?“ zählt bull und bear). Kleine Kanäle mit wenigen Videos schwanken stark. X lässt sich ohne Bezahlung nicht lesen, deshalb nur YouTube. Keine Anlageberatung.</li>
        </ul>`,
    });
}

export default {
    styles: `
        .hr-leer[hidden], .hr-nz[hidden], .hr-tip[hidden] { display: none !important; }
        .hr-held { display: grid; grid-template-columns: minmax(260px, 340px) minmax(0, 1fr); gap: 34px; align-items: center; }
        .hr-tacho { position: relative; } .hr-tacho svg { width: 100%; display: block; overflow: visible; }
        .hr-tl { font-family: var(--mono); font-size: 8.5px; fill: var(--ink-3); letter-spacing: .06em; text-transform: uppercase; }
        .hr-nadel { transition: transform 1.6s cubic-bezier(.2,.9,.25,1.12); }
        .hr-wert { text-align: center; display: flex; flex-direction: column; align-items: center; margin-top: 8px; }
        .hr-wert b { font-size: 2.6rem; font-weight: 300; line-height: 1; }
        .hr-wert span { font-family: var(--mono); font-size: .66rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); margin-top: 6px; }
        .hr-stufe { margin: 6px 0 10px; font-size: 1.9rem; font-weight: 400; }
        .hr-kontra { display: flex; gap: 10px; margin: 0 0 18px; font-size: .9rem; line-height: 1.6; color: var(--ink-2); font-weight: 300; } .hr-kontra b { color: var(--ink); font-weight: 500; }
        .hr-kontra svg { width: 18px; height: 18px; flex: none; color: var(--pg); margin-top: 3px; }
        .hr-teile { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px 20px; }
        .hr-teil { font-size: .78rem; color: var(--ink-2); } .hr-teil i { font-style: normal; font-size: .66rem; }
        .hr-spur { height: 6px; border-radius: 99px; background: var(--sunk); margin-top: 6px; overflow: hidden; }
        .hr-spur i { display: block; height: 100%; width: 0; border-radius: inherit; background: var(--c); transition: width 1.2s var(--ease); }
        .done .hr-spur i, .hr-spur.an i { width: var(--w); }
        .hr-mini { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 16px; font-size: .72rem; color: var(--ink-3); } .hr-mini b { color: var(--ink-2); font-weight: 500; font-family: var(--mono); }
        .hr-zwei { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
        .hr-feed { border-radius: 28px; border: 1px solid var(--line); background: color-mix(in srgb, var(--sunk) 70%, transparent); padding: 8px; backdrop-filter: blur(18px); }
        .hr-fh { display: flex; align-items: center; gap: 8px; padding: 8px 12px 10px; }
        .hr-fh h3 { margin: 0; font-size: .9rem; font-weight: 600; letter-spacing: -.01em; }
        .hr-bell { width: 18px; height: 18px; transform-origin: 50% 12%; }
        .hr-count { min-width: 20px; padding: 0 6px; border-radius: 99px; background: var(--ink); color: var(--surface); font-size: .68rem; font-weight: 600; line-height: 20px; text-align: center; transition: opacity .2s; } .hr-count.null { opacity: 0; }
        .hr-fh-r { margin-left: auto; display: flex; gap: 2px; }
        .hr-fh-r button { all: unset; cursor: pointer; padding: 4px 10px; border-radius: 99px; font-size: .72rem; font-weight: 500; color: var(--ink-3); transition: background .2s, color .2s; }
        .hr-fh-r button:hover { background: var(--surface); color: var(--ink); } .hr-fh-r button:disabled { opacity: .4; pointer-events: none; }
        .hr-fl-w { position: relative; }
        .hr-fl { height: min(560px, calc(100svh - 14rem)); overflow-y: auto; overscroll-behavior: contain; padding: 0 2px 24px; scrollbar-width: thin; mask-image: linear-gradient(to bottom, #000 calc(100% - 28px), transparent); -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 28px), transparent); }
        .hr-fi { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .46s cubic-bezier(.2,.8,.2,1); }
        .hr-fi.da { grid-template-rows: 1fr; } .hr-fi.weg { grid-template-rows: 0fr; transition: grid-template-rows .34s cubic-bezier(.4,0,.2,1); }
        .hr-fi-in { min-height: 0; overflow: hidden; padding: 2px 4px 8px; }
        .hr-fk { position: relative; display: flex; gap: 12px; padding: 12px; border-radius: 18px; border: 1px solid var(--line); background: var(--surface); box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 6%, transparent); cursor: pointer;
            transform: translateY(-16px) scale(.96); opacity: 0; transition: transform .46s cubic-bezier(.2,.9,.25,1.12), opacity .32s ease; }
        .hr-fi.da .hr-fk { transform: none; opacity: 1; } .hr-fi.weg .hr-fk { transform: translateX(18%) scale(.98); opacity: 0; transition: transform .34s cubic-bezier(.4,0,.2,1), opacity .24s ease; }
        .hr-tile { position: relative; flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 12px; font-size: .7rem; font-weight: 600; color: var(--acc); background: color-mix(in srgb, var(--acc) 15%, transparent); }
        .hr-tile.sm { width: 32px; height: 32px; border-radius: 10px; }
        .hr-ring { position: absolute; inset: 0; border-radius: inherit; border: 2px solid currentColor; opacity: 0; pointer-events: none; }
        .hr-fk-b { min-width: 0; flex: 1; }
        .hr-fk-k { display: flex; align-items: center; gap: 6px; padding-right: 24px; font-size: .72rem; color: var(--ink-3); } .hr-fk-k span:first-child { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hr-kamp { margin-left: 4px; padding: 1px 7px; border-radius: 99px; font-size: .6rem; color: var(--warn); background: color-mix(in srgb, var(--warn) 14%, transparent); }
        .hr-fk-t { display: block; margin-top: 2px; font-size: .88rem; font-weight: 600; line-height: 1.35; color: var(--ink); text-decoration: none; } .hr-fk-t:hover { color: var(--pg); }
        .hr-msg { display: flex; align-items: flex-end; gap: 8px; margin-top: 10px; }
        .hr-av { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; font-size: .56rem; font-weight: 600; background: color-mix(in srgb, var(--acc) 15%, transparent); color: var(--acc); }
        .hr-bubble { min-width: 0; padding: 8px 12px; border-radius: 16px 16px 16px 6px; background: var(--sunk); font-size: .8rem; line-height: 1.45; color: var(--ink); font-style: italic; }
        .hr-dots { display: none; height: 18px; align-items: center; gap: 4px; } .hr-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--ink-3); }
        .hr-msg.tippt .hr-dots { display: flex; } .hr-msg.tippt .hr-txt { display: none; } .hr-txt > span { display: inline-block; }
        .hr-skala { margin-top: 12px; padding: 0 8px; color: var(--acc); }
        .hr-sk-l { position: relative; height: 22px; }
        .hr-sk-l::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 3px; transform: translateY(-50%); border-radius: 99px; background: var(--sunk); }
        .hr-sk-f { position: absolute; left: 0; top: 50%; height: 3px; width: 50%; transform: translateY(-50%); border-radius: 99px; background: currentColor; transition: width 1.1s cubic-bezier(.55,0,.25,1); }
        .hr-sk-l b { position: absolute; top: 50%; width: 9px; height: 9px; border-radius: 50%; transform: translate(-50%, -50%); background: color-mix(in srgb, var(--ink-3) 35%, transparent); border: 2px solid var(--surface); } .hr-sk-l b.an { background: currentColor; }
        .hr-sk-m { position: absolute; top: 50%; left: 50%; width: 16px; height: 16px; border-radius: 6px; transform: translate(-50%, -50%); background: currentColor; box-shadow: 0 2px 6px -1px color-mix(in srgb, var(--ink) 40%, transparent); transition: left 1.1s cubic-bezier(.55,0,.25,1); }
        .hr-sk-t { position: relative; height: 14px; margin-top: 2px; }
        .hr-sk-t span { position: absolute; transform: translateX(-50%); white-space: nowrap; font-size: .58rem; color: var(--ink-3); } .hr-sk-t span:first-child { transform: none; } .hr-sk-t span:last-child { transform: translateX(-100%); } .hr-sk-t span.an { color: var(--ink); font-weight: 500; }
        .hr-fk-f { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; margin-top: 8px; font-size: .7rem; }
        .hr-roll { font-size: 1.25rem; font-weight: 500; color: var(--acc); min-width: 44px; }
        .hr-punkt { position: absolute; right: 14px; top: 14px; width: 8px; height: 8px; border-radius: 50%; background: var(--acc); transition: opacity .2s; } .hr-fk:hover .hr-punkt { opacity: 0; }
        .hr-x { all: unset; position: absolute; right: 8px; top: 8px; z-index: 2; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; color: var(--ink-3); opacity: 0; cursor: pointer; transition: opacity .2s, background .2s; }
        .hr-x svg { width: 14px; height: 14px; } .hr-fk:hover .hr-x, .hr-x:focus-visible { opacity: 1; } .hr-x:hover { background: var(--sunk); color: var(--ink); }
        .hr-leer { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; pointer-events: none; font-size: .84rem; }
        .hr-leer span { margin: 0 auto; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--surface); color: var(--ink-3); } .hr-leer p { margin: 6px 0 0; }
        .hr-fnote { margin: 4px 12px 8px; font-size: .7rem; color: var(--ink-3); line-height: 1.5; }
        .hr-p { margin: 0 0 14px; font-size: .82rem; color: var(--ink-3); line-height: 1.6; font-weight: 300; }
        .hr-nl { display: flex; flex-direction: column; }
        .hr-n { all: unset; box-sizing: border-box; width: 100%; display: grid; grid-template-columns: minmax(120px, 1fr) minmax(0, 1.4fr) 48px; gap: 14px; align-items: center; padding: 10px 6px; border-radius: 12px; cursor: pointer; transition: background .2s; }
        .hr-n:hover { background: color-mix(in srgb, var(--ink) 3.5%, transparent); } .hr-n + .hr-nz + .hr-n, .hr-nz + .hr-n { border-top: 1px solid var(--line); }
        .hr-n-name { display: flex; flex-direction: column; font-size: .86rem; font-weight: 500; } .hr-n-name i { font-style: normal; font-size: .66rem; font-weight: 400; margin-top: 2px; }
        .hr-n b { text-align: right; font-size: .9rem; font-weight: 500; }
        .hr-div { position: relative; height: 10px; border-radius: 99px; background: var(--sunk); }
        .hr-mid { position: absolute; left: 50%; top: -4px; bottom: -4px; width: 1px; background: var(--line); }
        .hr-bar { position: absolute; top: 0; bottom: 0; left: 50%; width: 0; border-radius: 99px; background: var(--c); transition: left 1.1s var(--ease), width 1.1s var(--ease); }
        .done .hr-bar, .hr-nl.an .hr-bar { left: var(--a); width: var(--b); }
        .hr-nz { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 4px 6px 14px; }
        .hr-q { padding: 12px 14px; border-radius: 14px; background: var(--sunk); border-left: 3px solid var(--c); } .hr-q p { margin: 6px 0 0; font-size: .8rem; line-height: 1.5; color: var(--ink-2); font-style: italic; }
        .hr-chart { position: relative; } .hr-chart svg { width: 100%; display: block; touch-action: none; }
        .hr-ax { font-family: var(--mono); font-size: 9px; fill: var(--ink-3); }
        .hr-tip { position: absolute; top: 4px; transform: translateX(-50%); display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border-radius: 12px; background: var(--raised); border: 1px solid var(--line); font-size: .7rem; color: var(--ink-2); pointer-events: none; white-space: nowrap; box-shadow: var(--shadow, 0 6px 20px rgba(0,0,0,.12)); }
        .hr-leg span { display: inline-flex; align-items: center; gap: 6px; font-size: .68rem; color: var(--ink-3); } .hr-leg span::before { content: ''; width: 14px; height: 3px; border-radius: 2px; background: var(--c); }
        .hr-kl { display: flex; flex-direction: column; }
        .hr-k { display: grid; grid-template-columns: 32px minmax(0, 1.4fr) 90px 80px 120px; gap: 14px; align-items: center; padding: 11px 4px; } .hr-k + .hr-k { border-top: 1px solid var(--line); }
        .hr-k-n { display: flex; flex-direction: column; min-width: 0; font-size: .86rem; } .hr-k-n b { font-weight: 500; } .hr-k-n i { font-style: normal; font-size: .68rem; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hr-k-g { height: 5px; border-radius: 99px; background: var(--sunk); overflow: hidden; } .hr-k-g i { display: block; height: 100%; border-radius: inherit; background: var(--ink-3); }
        .hr-sp { width: 80px; height: 24px; }
        .hr-k-w { display: flex; flex-direction: column; align-items: flex-end; font-family: var(--mono); font-size: 1rem; font-weight: 500; } .hr-k-w i { font-style: normal; font-family: var(--font); font-size: .64rem; font-weight: 400; margin-top: 2px; }
        .hr-ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 8px; font-size: .82rem; line-height: 1.6; color: var(--ink-2); font-weight: 300; } .hr-ul b { color: var(--ink); font-weight: 500; }
        .hr-disc { display: flex; gap: 12px; align-items: flex-start; padding: 14px 18px; border-radius: 18px; background: color-mix(in srgb, var(--warn) 11%, transparent); color: var(--ink-2); font-size: .84rem; font-weight: 300; line-height: 1.55; } .hr-disc svg { width: 18px; height: 18px; flex: none; color: var(--warn); margin-top: 2px; }
        @media (max-width: 1100px) { .hr-zwei { grid-template-columns: 1fr; } }
        @media (max-width: 860px) {
            .hr-held { grid-template-columns: 1fr; gap: 10px; } .hr-held-l { max-width: 320px; margin: 0 auto; width: 100%; }
            .hr-n { grid-template-columns: minmax(0, 1fr) 90px 40px; gap: 10px; } .hr-nz { grid-template-columns: 1fr; }
            .hr-k { grid-template-columns: 32px minmax(0, 1fr) 90px; } .hr-k-g, .hr-sp { display: none; }
            .hr-fl { height: 520px; }
        }`,
    render(root) {
        const D = H();
        root.classList.add('stack');
        const kopf = pageHead('Markt', 'Herdenradar', 'Wohin läuft die Herde? Hier steht, wie die Krypto-Influencer und der breite Markt gerade klingen, gesamt und je Narrativ. Gelesen wird das konträr: Wenn alle „jetzt kaufen“ rufen, passiert oft das Gegenteil. Wenn alle aufgeben, wird es interessant.', D ? `<span class="eyebrow">Stand ${esc(D.updated)}</span>` : '');
        if (!D) { root.innerHTML = kopf + card({ body: empty('Noch keine Daten. Lauf python3 fetch_herdenradar.py (oder refresh_all.py), dann neu laden.') }); return; }
        root.innerHTML = kopf + heldKarte(D)
            + `<div class="hr-zwei">${feedKarte(D)}<div class="stack">${narrativKarte(D)}</div></div>`
            + verlaufKarte(D) + kanalKarte(D) + methodeKarte(D)
            + `<div class="hr-disc">${icon('triangle-alert')}<div><b>Keine Anlageberatung.</b> Der Herden-Index misst Stimmung, nicht Wert. Extreme Stimmung kann lange extrem bleiben, und die Gegenrichtung kommt nicht auf Termin.</div></div>`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const n = root.querySelector('.hr-nadel'); if (n) n.style.transform = `rotate(${-90 + 180 * (+n.dataset.ziel) / 100}deg)`;
            root.querySelectorAll('.hr-spur').forEach(s => s.classList.add('an'));
            root.querySelectorAll('.hr-nl').forEach(s => s.classList.add('an'));
        }));
        root.querySelector('.hr-nl')?.addEventListener('click', e => {
            const b = e.target.closest('.hr-n'); if (!b) return;
            const zl = b.nextElementSibling, auf = zl.hidden; zl.hidden = !auf; b.setAttribute('aria-expanded', auf);
        });
        verlaufBind(root, D);
        feedStart(root);
    },
    destroy() { feedLeeren(); feed.el = null; },
};
