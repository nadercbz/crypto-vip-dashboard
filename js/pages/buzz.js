import { D } from '../core/data.js?v=202610082050';
import { esc } from '../core/fmt.js?v=202610082050';
import { card, pageHead, sparkFor, bar, coinImg, chip, empty, icon } from '../core/ui.js?v=202610082050';

const z = (v, d = 2) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: d });
const fmtViews = v => v == null ? '' : v >= 1e6 ? z(v / 1e6, 1) + ' Mio' : v >= 1e3 ? z(v / 1e3, 0) + ' Tsd' : String(v);
const sign = v => (v >= 0 ? '+' : '') + z(v);

const tag = (html, k = '') => `<span class="bz-sig ${k}">${html}</span>`;

function metaHtml(S) {
    const tage = S.days_accumulated || 1;
    return `<div class="row wrap" style="gap:8px">
        ${chip('Fenster 7 Tage')}
        ${chip(`Historie ${tage} ${tage === 1 ? 'Tag' : 'Tage'}`)}
        ${chip('Watchlist-Users aktiv', 'var(--up)')}
        ${chip('YouTube ' + (S.youtube_active ? 'aktiv' : 'aus (Key fehlt)'), S.youtube_active ? 'var(--up)' : 'var(--warn)')}
        ${chip('Reddit ' + (S.reddit_active ? 'aktiv' : 'aus (App fehlt)'), S.reddit_active ? 'var(--up)' : 'var(--warn)')}
        ${chip('X/Twitter n/a (2026 bezahlt)', 'var(--warn)')}
        ${chip('Stand ' + (S.updated || '').replace(' UTC', '') + ' UTC')}
    </div>`;
}

function podium(S) {
    const farbe = ['var(--warn)', 'var(--ink-2)', 'var(--a4)'];
    return `<div class="grid g3">${S.ranking.slice(0, 3).map((r, i) => `
        <div class="card click bz-pod ${i === 0 ? 'tint' : ''}" data-coin="${esc((r.symbol || '').toUpperCase())}" style="--c:${farbe[i]}">
            <div class="row between"><span class="bz-medal">${icon(i === 0 ? 'trophy' : 'medal')}Platz ${i + 1}</span>${r.cat ? chip(r.cat) : ''}</div>
            <div class="row" style="gap:14px;margin-top:16px">
                ${r.image ? `<img class="bz-pod-img" src="${esc(r.image)}" alt="" onerror="this.style.display='none'">` : ''}
                <div style="min-width:0"><div class="bz-pod-sym">${esc(r.symbol)}</div><div class="sub" style="margin:0;font-size:.8rem">${esc(r.name || '')}</div></div>
            </div>
            <div class="big num" style="margin-top:18px;color:var(--c)">${esc(z(r.score, 1))}</div>
            <div class="eyebrow" style="margin-top:6px">Buzz-Score</div>
            ${r.watchlistUsers ? `<div class="bz-pod-wl">${icon('eye')}${fmtViews(r.watchlistUsers)} Watchlist</div>` : ''}
        </div>`).join('')}</div>`;
}

function liste(S) {
    const rest = S.ranking.slice(3);
    if (!rest.length) return '';
    return card({ eyebrow: 'Rangliste', title: 'Ab Platz 4', body: `<div class="bz-list">${rest.map(r => {
        const delta = r.delta;
        const dCls = delta == null ? 'neu' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'dim';
        const dTxt = delta == null ? 'NEU' : delta > 0 ? '▲' + delta : delta < 0 ? '▼' + Math.abs(delta) : '±0';
        const sig = [];
        if (r.trendNow) sig.push(tag(icon('flame') + 'Trending', 'hot'));
        if (r.trendHits7d > 1) sig.push(tag(`${r.trendHits7d}× Trending/7T`, 'hot'));
        if (r.watchlistUsers) sig.push(tag(icon('eye') + fmtViews(r.watchlistUsers) + ' Watchlist'));
        if (r.ytVideos != null) sig.push(tag(icon('play') + `${r.ytVideos} Videos · ${fmtViews(r.ytViews)} Views`));
        if (r.redditMentions != null) sig.push(tag(icon('messages-square') + `${r.redditMentions} Posts · ${r.redditComments} Kommentare`));
        sig.push(tag(`Vol ${z(r.volRatio)}%`));
        sig.push(tag(`7d ${sign(r.mom7d)}%`));
        if (r.sentiment != null && r.sentiment !== 50) sig.push(tag(icon('smile') + z(r.sentiment, 1) + '%'));
        if (r.telegram) sig.push(tag(icon('send') + fmtViews(r.telegram) + ' Telegram'));
        return `<div class="bz-row" data-coin="${esc((r.symbol || '').toUpperCase())}">
            <div class="bz-rank">${esc(r.rank)}</div>
            ${r.image ? coinImg(r.image) : '<span class="coin-img"></span>'}
            <div class="bz-main">
                <div class="bz-name">${esc(r.name || r.symbol)}<span class="bz-tick">${esc(r.symbol)}</span>${r.cat ? chip(r.cat) : ''}</div>
                <div class="bz-sigs">${sig.join('')}</div>
            </div>
            <div class="bz-right">
                <span class="bz-spark">${sparkFor(r.symbol, 62, 24)}</span>
                <div class="bz-bar">${bar(Math.max(3, r.score))}</div>
                <div class="bz-score num">${esc(z(r.score, 1))}</div>
                <div class="bz-delta ${dCls}">${dTxt}</div>
            </div>
        </div>`;
    }).join('')}</div>` });
}

export default {
    styles: `
        .bz-pod { text-align: left; }
        .bz-medal { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: .64rem; letter-spacing: .16em; text-transform: uppercase; color: var(--c); }
        .bz-medal svg { width: 16px; height: 16px; }
        .bz-pod-img { width: 46px; height: 46px; border-radius: 50%; background: var(--sunk); object-fit: cover; flex: none; }
        .bz-pod-sym { font-size: 1.3rem; font-weight: 500; letter-spacing: -.01em; }
        .bz-pod-wl { display: flex; align-items: center; gap: 7px; margin-top: 14px; font-family: var(--mono); font-size: .72rem; color: var(--ink-3); }
        .bz-pod-wl svg { width: 14px; height: 14px; }
        .bz-list { display: flex; flex-direction: column; }
        .bz-row { display: grid; grid-template-columns: 30px 30px minmax(0, 1fr) auto; align-items: center; gap: 14px; padding: 12px 8px; border-radius: 14px; cursor: pointer; transition: background .2s, transform .25s var(--ease); }
        .bz-row + .bz-row { border-top: 1px solid var(--line); }
        .bz-row:hover { background: color-mix(in srgb, var(--ink) 3.5%, transparent); transform: translateX(3px); }
        .bz-rank { font-family: var(--mono); font-size: .8rem; color: var(--ink-3); text-align: center; }
        .bz-name { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-weight: 500; font-size: .92rem; }
        .bz-tick { font-family: var(--mono); font-size: .7rem; color: var(--ink-3); font-weight: 400; }
        .bz-sigs { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 5px; }
        .bz-sig { display: inline-flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: .66rem; color: var(--ink-3); }
        .bz-sig svg { width: 12px; height: 12px; }
        .bz-sig.hot { color: var(--a4); }
        .bz-right { display: flex; align-items: center; gap: 14px; }
        .bz-bar { width: 110px; }
        .bz-score { min-width: 44px; text-align: right; font-size: 1.05rem; }
        .bz-delta { min-width: 40px; text-align: right; font-family: var(--mono); font-size: .7rem; }
        .bz-delta.neu { color: var(--pg); }
        .bz-note { font-size: .8rem; color: var(--ink-3); line-height: 1.6; font-weight: 300; }
        .bz-note b { color: var(--ink-2); font-weight: 500; }
        @media (max-width: 860px) { .bz-spark, .bz-bar { display: none; } .bz-row { gap: 10px; } .bz-right { gap: 8px; } }`,
    render(root) {
        const S = D.social;
        const kopf = pageHead('Entdecken', 'Social Buzz', 'Worüber wird gerade am meisten gesprochen und gesucht? Ein Buzz-Score aus Such-Trending, Community-Stimmung, Telegram-Reach, Handelsvolumen und Momentum. Fenster: letzte 7 Tage, baut sich täglich weiter auf.');
        root.classList.add('stack');
        if (!S || !S.ranking || !S.ranking.length) {
            root.innerHTML = kopf + card({ body: empty('Noch keine Social-Daten. Lauf python3 fetch_social.py (oder refresh_all.py), dann neu laden.') });
            return;
        }
        root.innerHTML = kopf + metaHtml(S) + podium(S) + liste(S) +
            `<div class="bz-note"><b>Quellen:</b> ${esc((S.sources || []).join(' · '))}.<br>${esc(S.note || '')}</div>`;
    },
};
