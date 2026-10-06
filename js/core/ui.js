import { esc, fPct, cls } from './fmt.js?v=202610060140';
import { D, signal } from './data.js?v=202610060140';

export const icon = (name, extra = '') => `<i data-lucide="${name}" ${extra}></i>`;
export function icons(root = document) { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.7 }, nameAttr: 'data-lucide', root }); }

export function scoreVar(v) {
    if (v == null) return 'var(--ink-3)';
    if (v >= 70) return 'var(--up)';
    if (v >= 55) return 'color-mix(in srgb, var(--up) 70%, var(--warn))';
    if (v >= 45) return 'var(--warn)';
    return 'var(--down)';
}
export const scoreBadge = v => v == null
    ? '<span class="score" style="--c:var(--ink-3)">—</span>'
    : `<span class="score" style="--c:${scoreVar(v)}">${v.toFixed(0)}</span>`;

export function sparkline(arr, w = 70, h = 22, color) {
    const a = (arr || []).filter(v => v != null);
    if (a.length < 3) return '';
    const min = Math.min(...a), max = Math.max(...a), span = max - min || 1;
    const pts = a.map((v, i) => (i / (a.length - 1) * w).toFixed(1) + ',' + (h - 2 - (v - min) / span * (h - 4)).toFixed(1));
    const c = color || (a[a.length - 1] >= a[0] ? 'var(--up)' : 'var(--down)');
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="M${pts.join(' L')}" stroke="${c}"/></svg>`;
}

export function sparkFor(sym, w, h) {
    const r = signal(sym);
    let a = r && r.spark && r.spark.length >= 3 ? r.spark : null;
    if (!a) {
        const sd = D.series, reihe = sd && sd.coins && sd.coins[String(sym || '').toLowerCase()];
        if (reihe) {
            const g = reihe.filter(v => v != null);
            if (g.length >= 3) { const basis = g[0] || 1; a = g.map(v => (v / basis - 1) * 100); }
        }
    }
    return a ? sparkline(a, w, h) : '';
}

export function dotChart(arr, { rows = 9, cols = 40, hot = 14 } = {}) {
    let a = (arr || []).filter(v => v != null);
    if (a.length < 2) return '';
    if (a.length > cols) { const st = a.length / cols; a = Array.from({ length: cols }, (_, i) => a[Math.min(a.length - 1, Math.round((i + 1) * st) - 1)]); }
    const min = Math.min(...a), max = Math.max(...a), span = max - min || 1;
    const s = 10, out = [];
    a.forEach((v, x) => {
        const n = 1 + Math.round((v - min) / span * (rows - 1));
        const k = x === a.length - 1 ? 'acc' : x >= a.length - hot ? 'hot' : '';
        for (let y = 0; y < n; y++) out.push(`<circle class="${k}" cx="${x * s + 5}" cy="${(rows - 1 - y) * s + 5}" r="2.6"/>`);
    });
    return `<svg class="dotchart" viewBox="0 0 ${a.length * s} ${rows * s}" preserveAspectRatio="xMidYMid meet">${out.join('')}</svg>`;
}

export const ring = (val, label, size = 220) =>
    `<div class="ring" style="--size:${size}px" data-ring="${Math.max(0, Math.min(100, val || 0))}">
        <div class="ring-track"></div><div class="ring-arc"></div>
        <div class="ring-core"><div><b data-count="${val == null ? '' : Math.round(val)}">${val == null ? '—' : 0}</b><span>${esc(label || '')}</span></div></div>
    </div>`;

export const bar = (pct, color) => `<div class="bar"><i data-w="${Math.max(2, Math.min(100, pct || 0))}" style="${color ? '--c:' + color : ''}"></i></div>`;

export const coinImg = (src) => `<img class="coin-img" src="${esc(src || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`;

export const coinRow = (sym, name, img, sub, right) =>
    `<div class="li" data-coin="${esc(sym)}">${coinImg(img)}<div style="min-width:0"><div class="nm">${esc(name)}</div><div class="sb">${esc(sub || '')}</div></div><div class="val">${right || ''}</div></div>`;

export const pct = (v, d) => `<span class="${cls(v)}">${fPct(v, d)}</span>`;
export const chip = (text, color) => `<span class="chip" style="${color ? '--c:' + color : ''}">${esc(text)}</span>`;
export const empty = text => `<div class="empty">${esc(text)}</div>`;
export const laden = (text = 'Lädt …') => `<div class="empty lade">${esc(text)}</div>`;

export function card({ eyebrow, title, right = '', body = '', cls: c = '', attr = '' }) {
    const head = (eyebrow || title || right)
        ? `<div class="card-head"><div>${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}${title ? `<h3 class="h2" style="margin-top:${eyebrow ? 6 : 0}px">${esc(title)}</h3>` : ''}</div>${right}</div>` : '';
    return `<section class="card ${c}" ${attr}>${head}${body}</section>`;
}
export const pageHead = (eyebrow, title, sub, right = '') =>
    `<header class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1 class="h1" style="margin-top:8px">${esc(title)}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${right ? `<div class="row wrap">${right}</div>` : ''}</header>`;

export const seg = (name, items, active) =>
    `<div class="seg" data-seg="${esc(name)}">${items.map(([k, l]) => `<button data-v="${esc(k)}" class="${k === active ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;

export function toast(text) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = text;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, 2600);
}

export function hydrate(root) {
    icons(root);
    [...root.children].forEach((el, i) => el.style.setProperty('--i', i));
    setTimeout(() => root.classList.add('done'), 1400);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        root.querySelectorAll('.bar i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; });
        root.querySelectorAll('[data-ring]').forEach(r => r.style.setProperty('--p', r.dataset.ring));
    }));
    root.querySelectorAll('[data-count]').forEach(el => {
        const end = parseFloat(el.dataset.count);
        if (isNaN(end)) return;
        const t0 = performance.now(), dur = 1300;
        (function step(t) {
            const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
            el.textContent = Math.round(end * e);
            if (k < 1) requestAnimationFrame(step);
        })(t0);
    });
}
