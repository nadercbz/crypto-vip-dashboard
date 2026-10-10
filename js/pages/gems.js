import { D } from '../core/data.js?v=202610102147';
import { esc, fBig } from '../core/fmt.js?v=202610102147';
import { card, pageHead, sparkFor, bar, coinImg, chip, seg, empty, icon, hydrate } from '../core/ui.js?v=202610102147';

let gemTier = 'micro';   // aktiver Tab

const z = (v, d = 2) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: d });
const fmtNum = v => v == null ? '—' : v >= 1e6 ? z(v / 1e6, 1) + ' Mio' : v >= 1e3 ? z(v / 1e3, 0) + ' Tsd' : String(v);
const fmtCap = v => v == null ? '—' : fBig(v);
const sgn = v => (v >= 0 ? '+' : '') + z(v) + '%';
const code = t => `<code class="mono gm-code">${t}</code>`;
const mchip = (html, farbe, title) => `<span class="chip" style="${farbe ? '--c:' + farbe : ''}"${title ? ` title="${esc(title)}"` : ''}>${html}</span>`;

function staleHtml(G) {
    const ts = G.generated_ts ? G.generated_ts * 1000 : null;
    const ageH = ts ? (Date.now() - ts) / 3600000 : null;
    if (ageH != null && ageH >= 48) {
        return `<div class="gm-stale">${icon('triangle-alert')}<div>Diese Daten sind <b>${Math.floor(ageH / 24)} Tage alt</b>. Das Ranking bewertet einen Markt, den es so nicht mehr gibt. Frisch ziehen mit ${code('python3 refresh_all.py')}.</div></div>`;
    }
    if (ageH != null && ageH >= 26) {
        return `<div class="gm-stale warn">${icon('hourglass')}<div>Letzter Lauf vor <b>${Math.round(ageH)} Stunden</b>. Der automatische Lauf ist täglich für 07:30 Uhr geplant.</div></div>`;
    }
    return '';
}

const bdHtml = c => !(c.breakdown || []).length ? '' :
    `<div class="gm-bd">${c.breakdown.map(b => `<div class="gm-bd-row"><span>${esc(b.label)}</span>${bar(Math.max(2, b.v))}<b class="mono">${esc(b.v)}</b></div>`).join('')}</div>`;

const flagHtml = c => !(c.flags || []).length ? '' :
    `<div class="gm-flags">${c.flags.map(f => `<span class="gm-flag${f.level === 'bad' ? ' bad' : ''}">${icon(f.level === 'bad' ? 'octagon-alert' : 'triangle-alert')}${esc(f.text)}</span>`).join('')}</div>`;

const qualHtml = c => {
    const q = c.quality;
    if (!q || !q.total) return '';
    const r = q.have / q.total;
    const farbe = r >= 0.8 ? 'var(--up)' : r >= 0.55 ? 'var(--warn)' : 'var(--down)';
    return `<span class="gm-qual" style="--c:${farbe}" title="So viele Signale konnten mit echten Daten bewertet werden. Der Rest wurde neutral gewertet."><i></i>${q.have}/${q.total} Signale</span>`;
};

const moveHtml = c => {
    if (c.prevRank == null) return '<span class="gm-move neu">NEU</span>';
    if (!c.rankDelta) return '';
    return c.rankDelta > 0 ? `<span class="gm-move up">▲${c.rankDelta}</span>` : `<span class="gm-move down">▼${Math.abs(c.rankDelta)}</span>`;
};

function metaHtml(G) {
    const out = [];
    const tage = G.days_history || 1;
    out.push(mchip(`Pool <b>${esc(G.pool || 0)} Coins</b>`));
    out.push(mchip(`Historie <b>${esc(tage)} ${tage === 1 ? 'Tag' : 'Tage'}</b>`));
    out.push(mchip('Watchlist-Wachstum ' + (G.growth_active ? 'aktiv' : 'aus (braucht 3 Tage)'), G.growth_active ? 'var(--up)' : 'var(--warn)'));
    const cov = G.coverage || {};
    const have = (cov.cached || 0) + (cov.fetched || 0);
    const total = cov.requested || (have + (cov.missing || 0));
    out.push(mchip(`Watchlist <b>${have}/${total}</b>${cov.throttled ? ' · gedrosselt' : ''}`, cov.missing === 0 ? 'var(--up)' : '',
        'Watchlist-Daten sind eins von 13 Signalen (Gewicht 8%). Fehlt es, wird der Coin bei diesem Signal neutral gewertet, nicht abgestraft.'));
    const un = (cov.unlockCached || 0) + (cov.unlockFetched || 0);
    if (un) out.push(mchip(`Unlock-Daten <b>${un} Coins</b>`, 'var(--up)'));
    const gh = (cov.githubCached || 0) + (cov.githubFetched || 0);
    if (gh) out.push(mchip(`Dev-Aktivität <b>${gh} Coins</b>`, 'var(--up)'));
    if (G.keys && !G.keys.coingecko) out.push(mchip('Kein CoinGecko-Key', 'var(--warn)'));
    const bt = G.backtest || [];
    if (bt.length) {
        const b = bt[bt.length - 1];
        if (b.top5 != null && b.field != null) {
            out.push(mchip(`Backtest ${esc(b.days)}T · Top 5 <b>${sgn(b.top5)}</b> vs Feld ${sgn(b.field)}`, b.top5 > b.field ? 'var(--up)' : 'var(--warn)',
                `Durchschnittliche Kursentwicklung der damaligen Top 5 gegenüber dem gesamten bewerteten Feld seit ${b.date}`));
        }
    }
    const dr = G.dropped || {};
    const drTxt = Object.keys(dr).map(k => `${dr[k]} ${k}`).join(', ');
    if (drTxt) out.push(mchip(`Gefiltert <b>${esc(drTxt)}</b>`));
    out.push(mchip(`Stand <b>${esc((G.updated || '').replace(' UTC', ''))} UTC</b>`));
    return `<div class="row wrap gm-meta" style="gap:8px">${out.join('')}</div>`;
}

function topHtml(coins) {
    return `<div class="grid g3">${coins.slice(0, 3).map((c, i) => `
        <div class="card click gm-card ${i === 0 ? 'tint' : ''}" data-coin="${esc((c.symbol || '').toUpperCase())}">
            <div class="gm-card-top">
                ${c.image ? `<img class="gm-card-img" src="${esc(c.image)}" alt="" onerror="this.style.display='none'">` : '<span></span>'}
                <div style="min-width:0">
                    <div class="gm-card-sym">${esc(c.symbol)} ${moveHtml(c)}</div>
                    <div class="gm-card-name">${esc(c.name || '')}${c.cat ? ' · ' + esc(c.cat) : ''}</div>
                </div>
                <div class="big num gm-score">${esc(z(c.score, 1))}</div>
            </div>
            <div class="gm-spark">${sparkFor(c.symbol, 240, 34)}</div>
            <div class="gm-why">
                ${(c.why || []).map(w => `<div>${icon('check')}${esc(w)}</div>`).join('')}
                <div class="dim">${fmtCap(c.mcap)} Cap${c.floatPct != null ? ` · ${z(c.floatPct, 1)}% Float` : ''}${c.watchlist != null ? ` · ${fmtNum(c.watchlist)} Beobachter` : ''}</div>
            </div>
            ${bdHtml(c)}
            ${flagHtml(c)}
            <div>${qualHtml(c)}</div>
        </div>`).join('')}</div>`;
}

function listHtml(coins) {
    const rest = coins.slice(3);
    if (!rest.length) return '';
    const s = (html, k = '') => `<span class="gm-sig ${k}">${html}</span>`;
    return card({ eyebrow: 'Rangliste', title: 'Ab Platz 4', body: `<div class="gm-list">${rest.map(c => {
        const sig = [];
        if (c.attnPerCap != null) sig.push(s(icon('eye') + z(c.attnPerCap) + '/Mio Cap', 'good'));
        if (c.wlGrowth != null) sig.push(s(`Watchlist ${sgn(c.wlGrowth)}/7T`, 'good'));
        sig.push(s(fmtCap(c.mcap)));
        if (c.floatPct != null) sig.push(s(`Float ${z(c.floatPct, 1)}%`));
        if (c.unlock90 != null && c.unlock90 > 0.5) sig.push(s(`Unlock 90T ${z(c.unlock90)}%`));
        if (c.athPct != null) sig.push(s(`${z(c.athPct, 1)}% vom ATH`));
        sig.push(s(`7d ${sgn(c.d7)}`));
        sig.push(s(`Vol ${z(c.volRatio)}%`));
        if (c.devActive != null) sig.push(s(icon('wrench') + `${esc(c.devActive)} aktive Repos`));
        if (c.sentiment != null && c.sentiment !== 50) sig.push(s(icon('smile') + z(c.sentiment, 1) + '%'));
        return `<div class="gm-row" data-coin="${esc((c.symbol || '').toUpperCase())}">
            <div class="gm-rank">${esc(c.rank)}</div>
            ${c.image ? coinImg(c.image) : '<span class="coin-img"></span>'}
            <div style="min-width:0">
                <div class="gm-name">${esc(c.name || c.symbol)}<span class="gm-tick">${esc(c.symbol)}</span>${c.cat ? chip(c.cat) : ''}${moveHtml(c)}</div>
                <div class="gm-sigs">${sig.join('')}</div>
                ${flagHtml(c)}
            </div>
            <div class="gm-right">
                <div class="row" style="gap:12px;justify-content:flex-end"><div class="gm-bar">${bar(Math.max(3, c.score))}</div><div class="num gm-score-num">${esc(z(c.score, 1))}</div></div>
                <div style="margin-top:5px">${qualHtml(c)}</div>
            </div>
        </div>`;
    }).join('')}</div>` });
}

function body(G) {
    const tier = G.tiers.find(t => t.key === gemTier) || G.tiers[0];
    const coins = tier.coins || [];
    const kopf = staleHtml(G) + metaHtml(G) +
        `<div class="stack" style="gap:12px"><div class="filterleiste">${seg('gmtier', G.tiers.map(t => [t.key, `${t.label} ${t.count}`]), gemTier)}</div>
            <p class="sub" style="margin:0">${esc(tier.blurb || '')}</p></div>`;
    if (!coins.length) {
        const msg = tier.tooThin
            ? `Noch zu wenig bewertbare Coins in dieser Klasse (${esc(tier.scored || 0)} von ${esc(tier.count)}), gebraucht werden mindestens 5. Jeder weitere Lauf von ${code('fetch_gems.py')} füllt nach.`
            : 'In dieser Größenklasse hat kein Coin die Filter überstanden.';
        return kopf + `<div class="card"><div class="empty">${msg}</div></div><div class="gm-note">${esc(G.note || '')}</div>`;
    }
    const scored = tier.scored != null ? `${tier.scored} von ${tier.count} Coins dieser Klasse bewertet` : '';
    const src = (G.sources || []).length ? `<br>Quellen: ${esc((G.sources || []).join(' · '))}` : '';
    return kopf + topHtml(coins) + listHtml(coins) + `<div class="gm-note"><b>${esc(scored)}</b><br>${esc(G.note || '')}${src}</div>`;
}

export default {
    styles: `
        .gm-code { padding: 1px 7px; border-radius: 7px; background: color-mix(in srgb, var(--warn) 14%, transparent); color: var(--warn); font-size: .82em; }
        .gm-meta .chip b { font-weight: 600; color: var(--ink); }
        .gm-stale { display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px; border-radius: var(--r-md); font-size: .88rem; line-height: 1.5; color: var(--ink);
            background: color-mix(in srgb, var(--down) 12%, var(--surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--down) 35%, transparent); }
        .gm-stale svg { width: 18px; height: 18px; flex: none; margin-top: 2px; color: var(--down); }
        .gm-stale.warn { background: color-mix(in srgb, var(--warn) 12%, var(--surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--warn) 35%, transparent); }
        .gm-stale.warn svg { color: var(--warn); }
        .gm-card { display: flex; flex-direction: column; gap: 14px; }
        .gm-card-top { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; gap: 12px; align-items: center; }
        .gm-card-img { width: 44px; height: 44px; border-radius: 50%; background: var(--sunk); object-fit: cover; }
        .gm-card-sym { font-size: 1.15rem; font-weight: 500; display: flex; align-items: center; gap: 8px; }
        .gm-card-name { font-size: .76rem; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gm-score { color: var(--pg); }
        .gm-spark svg { width: 100%; }
        .gm-spark:empty { display: none; }
        .gm-why { display: flex; flex-direction: column; gap: 5px; font-size: .84rem; color: var(--ink-2); font-weight: 300; }
        .gm-why > div { display: flex; align-items: flex-start; gap: 8px; }
        .gm-why svg { width: 14px; height: 14px; flex: none; margin-top: 3px; color: var(--up); }
        .gm-why .dim { font-family: var(--mono); font-size: .7rem; margin-top: 3px; }
        .gm-bd { display: flex; flex-direction: column; gap: 7px; }
        .gm-bd-row { display: grid; grid-template-columns: 110px minmax(0, 1fr) 28px; gap: 10px; align-items: center; font-size: .72rem; color: var(--ink-3); }
        .gm-bd-row b { text-align: right; font-weight: 500; color: var(--ink-2); }
        .gm-flags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .gm-card .gm-flags { margin-top: 0; }
        .gm-flag { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: var(--r-pill); font-size: .7rem; color: var(--warn); background: color-mix(in srgb, var(--warn) 13%, transparent); }
        .gm-flag.bad { color: var(--down); background: color-mix(in srgb, var(--down) 13%, transparent); }
        .gm-flag svg { width: 12px; height: 12px; flex: none; }
        .gm-qual { display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: .64rem; color: var(--ink-3); white-space: nowrap; }
        .gm-qual i { width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
        .gm-move { font-family: var(--mono); font-size: .64rem; font-weight: 500; }
        .gm-move.neu { color: var(--pg); letter-spacing: .1em; } .gm-move.up { color: var(--up); } .gm-move.down { color: var(--down); }
        .gm-list { display: flex; flex-direction: column; }
        .gm-row { display: grid; grid-template-columns: 30px 30px minmax(0, 1fr) auto; align-items: center; gap: 14px; padding: 13px 8px; border-radius: 14px; cursor: pointer; transition: background .2s, transform .25s var(--ease); }
        .gm-row + .gm-row { border-top: 1px solid var(--line); }
        .gm-row:hover { background: color-mix(in srgb, var(--ink) 3.5%, transparent); transform: translateX(3px); }
        .gm-rank { font-family: var(--mono); font-size: .8rem; color: var(--ink-3); text-align: center; }
        .gm-name { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-weight: 500; font-size: .92rem; }
        .gm-tick { font-family: var(--mono); font-size: .7rem; color: var(--ink-3); font-weight: 400; }
        .gm-sigs { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 5px; }
        .gm-sig { display: inline-flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: .66rem; color: var(--ink-3); }
        .gm-sig svg { width: 12px; height: 12px; }
        .gm-sig.good { color: var(--up); }
        .gm-right { text-align: right; }
        .gm-bar { width: 110px; }
        .gm-score-num { min-width: 44px; font-size: 1.05rem; }
        .gm-note { font-size: .8rem; color: var(--ink-3); line-height: 1.6; font-weight: 300; }
        .gm-note b { color: var(--ink-2); font-weight: 500; }
        @media (max-width: 860px) { .gm-bar { display: none; } .gm-row { gap: 10px; } }`,
    render(root) {
        const G = D.gems;
        const kopf = pageHead('Entdecken', 'Hidden Gems', 'Das Gegenteil von Social Buzz. Hier zählt nicht, wo gerade der Hype ist, sondern wo ein Projekt fundamental mehr leistet, als der Kurs eingepreist hat. Gemessen an Kapital im Protokoll, Gebühreneinnahmen je Dollar Bewertung, anstehenden Token-Freischaltungen, Float, Entwickler-Aktivität, Ruhe im Chart und Abstand zum ATH. Drei Größenklassen, jede für sich gewertet. Die Warnungen an einem Coin gehören zum Ergebnis dazu.');
        root.classList.add('stack');
        if (!G || !G.tiers || !G.tiers.length) {
            root.innerHTML = kopf + card({ body: empty('Noch keine Gem-Daten. Lauf python3 fetch_gems.py (oder refresh_all.py), dann neu laden.') });
            return;
        }
        root.innerHTML = kopf + `<div id="gmBody" class="stack">${body(G)}</div>`;
        const el = root.querySelector('#gmBody');
        el.onclick = e => {
            const b = e.target.closest('[data-seg="gmtier"] button');
            if (!b) return;
            gemTier = b.dataset.v;
            el.innerHTML = body(G);
            hydrate(el);
        };
    },
};
