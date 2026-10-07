import { D, store } from '../core/data.js?v=202610071831';
import { esc, fUsd, fBig, fPct, cls } from '../core/fmt.js?v=202610071831';
import { card, pageHead, seg, empty, icon, icons } from '../core/ui.js?v=202610071831';

const ARENA_KEY = 'c2_arena_elo_v1';
const DEFAULT_ELO = 1200;
const K = 32;

let all = [];
let elo = {};
let pool = 'all';
let pair = [null, null];
let sessionStreak = 0;
let onKey = null, timer = null;

function loadElo() { const v = store.get(ARENA_KEY, {}); elo = v && typeof v === 'object' ? v : {}; }
function saveElo() { store.set(ARENA_KEY, elo); }
function getElo(id) {
    if (!elo[id]) elo[id] = { elo: DEFAULT_ELO, wins: 0, losses: 0, battles: 0 };
    return elo[id];
}
function gespeicherteDuelle() {
    let n = 0;
    for (const d of Object.values(elo)) n += (d && +d.battles) || 0;
    return Math.round(n / 2);
}
function calcEloResult(rA, rB, sA) {
    const expA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
    const expB = 1 - expA;
    return { newA: Math.round(rA + K * (sA - expA)), newB: Math.round(rB + K * ((1 - sA) - expB)) };
}
function arenaPool() {
    if (pool === 'all') return all;
    const n = parseInt(pool);
    return all.slice(0, Math.min(n, all.length));
}
function pickPair() {
    const p = arenaPool();
    if (p.length < 2) return [null, null];
    const a = Math.floor(Math.random() * p.length);
    let b = a;
    while (b === a) b = Math.floor(Math.random() * p.length);
    return [p[a], p[b]];
}

function fighter(c, side) {
    const e = getElo(c.id), ch = c.price_change_percentage_24h;
    return `<img src="${esc(c.image || '')}" alt="" onerror="this.style.visibility='hidden'">
        <div class="du-name">${esc(c.name || '—')}</div>
        <div class="du-sym">${esc((c.symbol || '').toUpperCase())}</div>
        <div class="du-price num">${fUsd(c.current_price)}</div>
        <div class="num ${cls(ch)}" style="font-size:.9rem">${fPct(ch || 0, 2)}</div>
        <div class="du-meta"><span>${fBig(c.market_cap)}</span><span>#${c.market_cap_rank || '—'}</span></div>
        <div class="du-elo">ELO ${e.elo} · ${e.wins}W ${e.losses}L</div>
        <div class="du-taste">${icon(side === 'A' ? 'arrow-left' : 'arrow-right')}</div>`;
}

export default {
    styles: `
        .du-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 22px 0; }
        .du-stat { padding: 16px 18px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); }
        .du-stat .num { font-size: 1.6rem; font-weight: 300; letter-spacing: -.02em; margin-top: 8px; }
        .du-wrap { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 22px; align-items: center; }
        .du-fighter { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; padding: 34px 20px 26px; border-radius: var(--r-lg); cursor: pointer; width: 100%;
            background: var(--raised); box-shadow: var(--sh-sm); border: 1px solid transparent; transition: transform .35s var(--ease), border-color .3s var(--ease), background .3s var(--ease), opacity .3s var(--ease); }
        .du-fighter:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--pg) 45%, transparent); }
        .du-fighter:active { transform: scale(.98); }
        .du-fighter img { width: 84px; height: 84px; border-radius: 50%; background: var(--sunk); object-fit: cover; margin-bottom: 8px; }
        .du-name { font-size: 1.3rem; font-weight: 500; letter-spacing: -.01em; }
        .du-sym { font-family: var(--mono); font-size: .72rem; letter-spacing: .16em; color: var(--ink-3); }
        .du-price { font-size: 1.5rem; font-weight: 300; margin-top: 6px; }
        .du-meta { display: flex; gap: 14px; font-family: var(--mono); font-size: .74rem; color: var(--ink-3); }
        .du-elo { margin-top: 10px; padding: 5px 14px; border-radius: var(--r-pill); font-family: var(--mono); font-size: .7rem; letter-spacing: .06em; background: var(--bg); box-shadow: var(--sh-in); color: var(--ink-2); }
        .du-taste { color: var(--ink-3); margin-top: 6px; } .du-taste svg { width: 16px; height: 16px; }
        .du-fighter.win { border-color: var(--up); background: color-mix(in srgb, var(--up) 12%, var(--raised)); transform: scale(1.02); }
        .du-fighter.lose { opacity: .45; transform: scale(.98); }
        .du-vs { font-family: var(--mono); font-size: .8rem; letter-spacing: .2em; color: var(--ink-3); width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; background: var(--bg); box-shadow: var(--sh-in); }
        @media (max-width: 860px) {
            .du-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .du-wrap { grid-template-columns: minmax(0, 1fr); } .du-vs { margin: 0 auto; }
        }`,
    render(root) {
        loadElo();
        all = D.coins.slice();
        root.classList.add('stack');
        const head = pageHead('Trading', 'Coin-Duell', 'Welcher Coin gewinnt? Klick auf den Gewinner. Jede Entscheidung aktualisiert das ELO Rating. Gespielt wird lokal, dein Ranking bleibt gespeichert.',
            `<a class="btn soft" data-go="bestenliste" style="cursor:pointer">${icon('trophy')}Bestenliste</a>`);
        if (all.length < 2) { root.innerHTML = head + card({ body: empty('Keine Coin-Daten geladen. Ohne Kurse gibt es kein Duell.') }); return; }

        const stat = (label, id) => `<div class="du-stat"><div class="eyebrow">${label}</div><div class="num" id="${id}">0</div></div>`;
        root.innerHTML = head + card({ eyebrow: 'Coin vs Coin', right: seg('dupool', [['all', 'Alle'], ['100', 'Top 100'], ['250', 'Top 250'], ['500', 'Top 500']], pool), body: `
            <div class="du-stats">${stat('Duelle gesamt', 'duTotal')}${stat('Coins geladen', 'duLoaded')}${stat('Serie der Sitzung', 'duStreak')}${stat('Platz 1', 'duTop')}</div>
            <div class="du-wrap">
                <button type="button" class="du-fighter" id="duA"></button>
                <div class="du-vs">VS</div>
                <button type="button" class="du-fighter" id="duB"></button>
            </div>
            <div class="row wrap" style="justify-content:center;gap:10px;margin-top:24px">
                <button class="btn soft" id="duSkip">${icon('skip-forward')}Überspringen</button>
                <button class="btn soft" id="duReset">${icon('rotate-ccw')}Ratings zurücksetzen</button>
            </div>
            <p class="sub" style="text-align:center;margin:16px 0 0;font-size:.78rem">Pfeiltaste links oder rechts wählt den Gewinner.</p>` });

        const $ = id => root.querySelector('#' + id);
        const fA = $('duA'), fB = $('duB');

        function updateStats() {
            $('duTotal').textContent = gespeicherteDuelle().toLocaleString('de-DE');
            $('duLoaded').textContent = all.length;
            $('duStreak').textContent = sessionStreak;
            let topName = '---', topElo = 0;
            for (const [id, d] of Object.entries(elo)) {
                if (d.elo > topElo && d.battles > 0) {
                    topElo = d.elo;
                    const c = all.find(x => x.id === id);
                    topName = c ? (c.symbol || '').toUpperCase() : id;
                }
            }
            $('duTop').textContent = topName;
        }
        function nextBattle() {
            pair = pickPair();
            if (!pair[0] || !pair[1]) return;
            fA.classList.remove('win', 'lose'); fB.classList.remove('win', 'lose');
            fA.innerHTML = fighter(pair[0], 'A'); fB.innerHTML = fighter(pair[1], 'B');
            icons(fA.parentNode);
        }
        function vote(winnerIdx) {
            const winner = pair[winnerIdx], loser = pair[winnerIdx === 0 ? 1 : 0];
            if (!winner || !loser) return;
            const eW = getElo(winner.id), eL = getElo(loser.id);
            const r = calcEloResult(eW.elo, eL.elo, 1);
            eW.elo = r.newA; eW.wins++; eW.battles++;
            eL.elo = r.newB; eL.losses++; eL.battles++;
            saveElo();
            sessionStreak++;
            (winnerIdx === 0 ? fA : fB).classList.add('win');
            (winnerIdx === 0 ? fB : fA).classList.add('lose');
            updateStats();
            clearTimeout(timer);
            timer = setTimeout(nextBattle, 150);
        }

        fA.onclick = () => vote(0);
        fB.onclick = () => vote(1);
        $('duSkip').onclick = nextBattle;
        $('duReset').onclick = () => {
            if (!confirm('Alle ELO Ratings zurücksetzen?')) return;
            elo = {};
            saveElo();
            sessionStreak = 0;
            updateStats();
            nextBattle();
        };
        root.querySelector('[data-seg="dupool"]').onclick = e => {
            const b = e.target.closest('button');
            if (!b) return;
            root.querySelectorAll('[data-seg="dupool"] button').forEach(x => x.classList.toggle('on', x === b));
            pool = b.dataset.v;
            nextBattle();
        };
        if (onKey) document.removeEventListener('keydown', onKey);
        onKey = e => {
            if (!fA.isConnected || !pair[0] || !pair[1]) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            if (e.key === 'ArrowLeft') { e.preventDefault(); vote(0); }
            if (e.key === 'ArrowRight') { e.preventDefault(); vote(1); }
        };
        document.addEventListener('keydown', onKey);

        updateStats();
        nextBattle();
    },
    destroy() {
        if (onKey) document.removeEventListener('keydown', onKey);
        onKey = null;
        clearTimeout(timer);
    },
};
