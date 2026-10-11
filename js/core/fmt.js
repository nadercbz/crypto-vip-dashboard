export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const nf = (n, d) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });

export function fUsd(v) {
    if (v == null || isNaN(v)) return '—';
    const a = Math.abs(v);
    if (a >= 1000) return '$' + nf(v, 0);
    if (a >= 1) return '$' + nf(v, 2);
    if (a >= 0.01) return '$' + nf(v, 4);
    if (a === 0) return '$0';
    return '$' + v.toPrecision(3).replace('.', ',');
}
export function fBig(v, pre = '$') {
    if (v == null || isNaN(v)) return '—';
    const a = Math.abs(v);
    if (a >= 1e12) return pre + nf(v / 1e12, 2) + ' Bio';
    if (a >= 1e9) return pre + nf(v / 1e9, 1) + ' Mrd';
    if (a >= 1e6) return pre + nf(v / 1e6, 1) + ' Mio';
    if (a >= 1e3) return pre + nf(v / 1e3, 1) + ' Tsd';
    return pre + nf(v, 0);
}
export function fPct(v, d = 1) {
    if (v == null || isNaN(v)) return '—';
    return (v > 0 ? '+' : '') + nf(v, d) + '%';
}
export const fNum = (v, d = 0) => (v == null || isNaN(v)) ? '—' : nf(v, d);
export const cls = v => v == null ? 'dim' : v > 0 ? 'up' : v < 0 ? 'down' : 'dim';

export function ago(ts) {
    if (!ts) return '';
    const min = Math.round((Date.now() / 1000 - ts) / 60);
    if (min < 1) return 'gerade eben';
    if (min < 60) return 'vor ' + min + ' Min';
    if (min < 1440) return 'vor ' + Math.round(min / 60) + ' Std';
    return 'vor ' + Math.round(min / 1440) + ' Tagen';
}
export function utcTs(s) {
    if (!s) return null;
    const t = Date.parse(String(s).replace(' UTC', 'Z').replace(' ', 'T'));
    return isNaN(t) ? null : t / 1000;
}
