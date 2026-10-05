import { D, coin, store } from '../core/data.js';
import { esc, fUsd, cls } from '../core/fmt.js';
import { card, pageHead, seg, chip, pct, coinImg, empty, icon, hydrate, scoreBadge } from '../core/ui.js';

const PP_PROFILES = {
    defensiv:   { safe: 45, core: 30, growth: 20, moon: 5 },
    ausgewogen: { safe: 30, core: 33, growth: 25, moon: 12 },
    aggressiv:  { safe: 18, core: 27, growth: 33, moon: 22 },
};
const PP_TIERS = [
    { key: 'safe',   label: 'Anker',   sub: 'Mega Cap · ab 50 Mrd',        slots: 2, min: 50e9,  max: Infinity, color: 'var(--a1)' },
    { key: 'core',   label: 'Level 1', sub: 'Large Cap · 3 bis 50 Mrd',    slots: 4, min: 3e9,   max: 50e9,     color: 'var(--a2)' },
    { key: 'growth', label: 'Level 2', sub: 'Mid Cap · 300 Mio bis 3 Mrd', slots: 4, min: 300e6, max: 3e9,      color: 'var(--a3)' },
    { key: 'moon',   label: 'Level 3', sub: 'Small Cap · 20 bis 300 Mio',  slots: 2, min: 20e6,  max: 300e6,    color: 'var(--a4)' },
];
let ppProfile = 'ausgewogen';
let alleZeigen = false;
let pfWahl = 'alle', checkAlle = false;
const PP_SECTOR_CAP = 3;   // max. Coins pro Narrativ im Depot

const PP_DERIV_RE = /(wrapped|staked|liquid staking|restaked|bridged|binance-peg|pegged)/i;
const PP_DERIV_SYMS = new Set(['weth', 'wsteth', 'steth', 'cbeth', 'reth', 'wbeth', 'meth',
    'ezeth', 'weeth', 'rseth', 'wbtc', 'cbbtc', 'tbtc', 'lbtc', 'solvbtc', 'msol', 'jitosol',
    'bsol', 'jupsol', 'wbnb', 'wsol', 'beth', 'wtrx', 'susde', 'sfrxeth', 'frxeth']);
const ppIsDerivative = c => PP_DERIV_RE.test(c.name || '') || PP_DERIV_SYMS.has((c.symbol || '').toLowerCase());

const PP_CONVICTION = {
    btc: 99, eth: 97, bnb: 82, xrp: 78,
    sol: 96, link: 92, xmr: 82, sui: 84, hype: 86, gram: 78, ton: 78, hbar: 74,
    zec: 74, ada: 70, xlm: 72, trx: 68, ltc: 72, doge: 66, bch: 60, cc: 62,
    aave: 92, uni: 90, ondo: 86, tao: 86, render: 84, inj: 84, arb: 82, avax: 84,
    jup: 82, apt: 74, near: 76, ena: 76, pol: 74, qnt: 72, sky: 72, wld: 70,
    atom: 70, fil: 68, mnt: 66, icp: 62, kas: 78, algo: 62, pepe: 62, etc: 56,
    flr: 58, shib: 58, aster: 60, pump: 58, wlfi: 48,
    pendle: 82, mon: 82, op: 80, tia: 78, akt: 78, rune: 74, stx: 74, ens: 74,
    ray: 74, jto: 72, sei: 72, grt: 70, kaito: 70, gno: 70, grass: 66, comp: 66,
    strk: 66, bonk: 56, wif: 56, axs: 56, chz: 54, iota: 54, floki: 52, cfx: 52,
    neo: 52, xtz: 58, dcr: 58, kite: 55, kaia: 52, jasmy: 48, zbcn: 50, eos: 46,
};

const PP_EXCLUDE_SYMS = new Set([
    'leo', 'wbt', 'okb', 'bgb', 'kcs', 'gt', 'mx', 'nexo', 'btse', 'borg', 'htx', 'ftt',
    'paxg', 'xaut', 'kau', 'dgx',
    'susds', 'susde', 'syrupusdc', 'jlp', 'usde', 'usds', 'crvusd', 'gho', 'frxusd', 'usd0', 'usdy',
    'ethx', 'beth', 'bnsol', 'lseth', 'khype', 'ebtc', 'btc.b', 'oeth', 'oseth', 'weeth', 'cmeth',
]);

function ppConvictionOf(c) {
    const v = PP_CONVICTION[(c.symbol || '').toLowerCase()];
    return (v == null) ? null : v;
}

function ppRanker(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const n = sorted.length;
    return v => {
        if (n < 2) return 50;
        let lo = 0, hi = n;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < v) lo = mid + 1; else hi = mid; }
        return (lo / (n - 1)) * 100;
    };
}

function ppSectorHeat(uni) {
    const acc = Object.create(null);
    uni.forEach(c => {
        const cats = (c.cats && c.cats.length) ? c.cats : (c.cat ? [c.cat] : []);
        cats.forEach(cat => {
            if (!cat || cat === 'Other') return;
            (acc[cat] = acc[cat] || []).push(c.price_change_percentage_7d_in_currency || 0);
        });
    });
    const heat = Object.create(null);
    Object.keys(acc).forEach(k => {
        if (acc[k].length < 3) return;   // zu kleine Stichprobe ist kein Signal
        heat[k] = acc[k].reduce((s, v) => s + v, 0) / acc[k].length;
    });
    return heat;
}

function computePerfectPortfolio(db, profil) {
    if (!db || !db.length) return null;

    const uni = db.filter(c => {
        const sym = (c.symbol || '').toLowerCase();
        if ((c.market_cap_rank || 9e9) > 400) return false;
        if ((c.total_volume || 0) < 2e6) return false;
        if ((c.market_cap || 0) < 20e6) return false;
        if (c.price_change_percentage_24h == null) return false;
        if (c.price_change_percentage_7d_in_currency == null) return false;
        if (ppIsDerivative(c)) return false;
        if (PP_EXCLUDE_SYMS.has(sym)) return false;
        const known = PP_CONVICTION[sym] != null;
        const hasNarrative = (c.cat && c.cat !== 'Other') || (c.cats || []).some(k => k && k !== 'Other');
        return known || hasNarrative;
    });
    if (uni.length < 12) return null;

    const r7    = ppRanker(uni.map(c => c.price_change_percentage_7d_in_currency));
    const r24   = ppRanker(uni.map(c => c.price_change_percentage_24h));
    const rTov  = ppRanker(uni.map(c => (c.total_volume || 0) / (c.market_cap || 1)));
    const rVol  = ppRanker(uni.map(c => Math.log10((c.total_volume || 1) + 1)));
    const rRoom = ppRanker(uni.map(c => -(c.ath_change_percentage || 0)));

    const heat = ppSectorHeat(uni);
    const heatVals = Object.keys(heat).map(k => heat[k]);
    const rHeat = ppRanker(heatVals.length ? heatVals : [0]);

    const scored = uni.map(c => {
        const cats = (c.cats && c.cats.length) ? c.cats : (c.cat ? [c.cat] : []);
        const own = cats.filter(k => heat[k] != null);
        const heatVal = own.length ? Math.max(...own.map(k => heat[k])) : null;
        const sectorScore = heatVal == null ? 50 : rHeat(heatVal);
        const topCat = (c.cat && c.cat !== 'Other') ? c.cat : (cats.filter(k => k && k !== 'Other')[0] || null);

        const momentum  = 0.6 * r7(c.price_change_percentage_7d_in_currency) + 0.4 * r24(c.price_change_percentage_24h);
        const hype      = 0.5 * rTov((c.total_volume || 0) / (c.market_cap || 1)) + 0.5 * sectorScore;
        const liquidity = rVol(Math.log10((c.total_volume || 1) + 1));
        const room      = rRoom(-(c.ath_change_percentage || 0));

        const convRaw    = ppConvictionOf(c);
        const convKnown  = convRaw != null;
        const conviction = convKnown ? convRaw : 46;

        const score = 0.38 * conviction + 0.27 * momentum + 0.18 * hype + 0.10 * liquidity + 0.07 * room;
        return { c, score, momentum, hype, liquidity, room, conviction, convKnown, topCat, heatVal };
    });

    const alloc = PP_PROFILES[profil || ppProfile];
    const sectorCount = Object.create(null);
    const tiers = PP_TIERS.map(t => {
        const cands = scored
            .filter(s => (s.c.market_cap || 0) >= t.min && (s.c.market_cap || 0) < t.max)
            .sort((a, b) => b.score - a.score);
        const picks = [];
        cands.forEach(s => {
            if (picks.length >= t.slots) return;
            const key = s.topCat;
            if (key && (sectorCount[key] || 0) >= PP_SECTOR_CAP) return;
            picks.push(s);
            if (key) sectorCount[key] = (sectorCount[key] || 0) + 1;
        });
        if (picks.length < t.slots) {
            cands.forEach(s => {
                if (picks.length >= t.slots) return;
                if (picks.indexOf(s) === -1) picks.push(s);
            });
        }
        return { key: t.key, label: t.label, sub: t.sub, color: t.color, slots: t.slots, pct: alloc[t.key], picks };
    });

    const leer = tiers.filter(t => !t.picks.length);
    if (leer.length) {
        const lost = leer.reduce((s, t) => s + t.pct, 0);
        const filled = tiers.filter(t => t.picks.length);
        const base = filled.reduce((s, t) => s + t.pct, 0);
        if (base) filled.forEach(t => { t.pct += lost * (t.pct / base); });
        leer.forEach(t => { t.pct = 0; });
    }

    tiers.forEach(t => {
        if (!t.picks.length) return;
        const sum = t.picks.reduce((s, p) => s + p.score, 0);
        t.picks.forEach(p => {
            const equal = 1 / t.picks.length;
            const byScore = sum ? p.score / sum : equal;
            p.weight = (0.5 * equal + 0.5 * byScore) * t.pct;
        });
    });

    const all = tiers.reduce((a, t) => a.concat(t.picks), []);
    all.forEach(p => { p.weight = Math.round(p.weight * 10) / 10; });
    const drift = Math.round((100 - all.reduce((s, p) => s + p.weight, 0)) * 10) / 10;
    if (drift && all.length) {
        const biggest = all.reduce((a, b) => (a.weight >= b.weight ? a : b));
        biggest.weight = Math.round((biggest.weight + drift) * 10) / 10;
    }

    const topSectors = Object.keys(heat).sort((a, b) => heat[b] - heat[a]).slice(0, 3).map(k => ({ name: k, avg: heat[k] }));
    return { tiers, universe: uni.length, pool: db.length, topSectors, count: all.length };
}

const de = (v, d = 1) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });

function ppBar(label, val, color) {
    const v = Math.max(0, Math.min(100, val || 0));
    return `<div class="pp-barrow"><span>${label}</span><div class="bar"><i data-w="${Math.max(2, v)}" style="--c:${color}"></i></div><b class="num">${Math.round(v)}</b></div>`;
}

function engine(pf) {
    if (!D.coins.length) return card({ eyebrow: 'Allokations-Engine', body: empty('Keine Kursdaten geladen.') });
    if (!pf) return card({ eyebrow: 'Allokations-Engine', body: empty('Zu wenig belastbare Daten für eine Allokation.') });

    const balken = `<div class="pp-allocbar">${pf.tiers.filter(t => t.pct > 0).map(t =>
        `<div style="width:${t.pct}%;--c:${t.color}"><span class="num">${t.pct.toFixed(0)}%</span></div>`).join('')}</div>
        <div class="pp-legend">${pf.tiers.map(t => `<span><i style="background:${t.color}"></i>${esc(t.label)} · ${esc(t.sub)}</span>`).join('')}</div>`;

    const tiers = pf.tiers.filter(t => t.picks.length).map(t => {
        const cards = t.picks.map(p => {
            const c = p.c, q = Math.round(p.conviction);
            const qFarbe = q >= 75 ? 'var(--up)' : (q >= 55 ? 'var(--warn)' : 'var(--down)');
            const tags = [chip(p.convKnown ? 'Q ' + q : 'NEU', p.convKnown ? qFarbe : 'var(--pg)')];
            if (p.topCat) tags.push(chip(p.topCat));
            if (c.market_cap_rank) tags.push(chip('#' + c.market_cap_rank));
            const sub = (c.subs && c.subs.length) ? c.subs[0] : null;
            if (sub && sub !== p.topCat) tags.push(chip(sub));
            return `<div class="card sunk click pp-card" style="--c:${t.color}" data-coin="${esc((c.symbol || '').toUpperCase())}">
                <div class="pp-cardtop">${coinImg(c.image)}
                    <div style="min-width:0;flex:1"><div class="pp-name">${esc(c.name)}</div><div class="pp-sym">${esc((c.symbol || '').toUpperCase())}</div></div>
                    <div class="pp-weight num">${de(p.weight)}%</div></div>
                <div class="pp-pricerow"><span class="num">${fUsd(c.current_price)}</span>
                    <span>${pct(c.price_change_percentage_7d_in_currency)}<small>7D</small></span>
                    <span>${pct(c.price_change_percentage_24h)}<small>24H</small></span></div>
                <div class="pp-tags">${tags.join('')}</div>
                <div class="pp-bars">${ppBar('Momentum', p.momentum, t.color)}${ppBar('Hype', p.hype, t.color)}${ppBar('Qualität', p.conviction, t.color)}</div>
            </div>`;
        }).join('');
        return `<div class="pp-tier"><div class="pp-tierhead">${chip(t.label, t.color)}<span class="eyebrow">${esc(t.sub)}</span><i></i><b class="num">${t.pct.toFixed(0)}%</b></div>
            <div class="pp-grid">${cards}</div></div>`;
    }).join('');

    const hot = pf.topSectors.map(s => `${esc(s.name)} <strong>${s.avg >= 0 ? '+' : ''}${de(s.avg)}%</strong>`).join(' · ');
    const meta = `<div class="pp-meta">
        <span>Universe <strong>${pf.universe}</strong> von ${pf.pool} Coins</span>
        <span>Auswahl <strong>${pf.count} Coins</strong></span>
        <span>Heißeste Sektoren 7d: ${hot || 'keine'}</span>
        <span>Daten <strong>${esc(D.coinsStand || 'unbekannt')}</strong></span></div>`;

    const regeln = `<strong>Filter:</strong> Rang bis 400, Volumen ab 2 Mio, Market Cap ab 20 Mio. Stablecoins sind schon in den Daten raus. ` +
        `Zusätzlich fliegen raus: Wrapped-/Staked-Derivate (STETH, WBTC und Co., duplizieren nur BTC-/ETH-Exposure), ` +
        `Exchange-Token (LEO, OKB, BGB, KCS, GT und Co.), Gold-RWA (PAXG, XAUT) und Renditen-auf-Stablecoin. ` +
        `Unbekannte Coins müssen ein echtes Narrativ tragen, sonst gilt: kuratiert oder gar nicht.<br><br>` +
        `<strong>Qualität (Wissens-Schicht):</strong> Jedes ernsthafte Projekt hat ein kuratiertes Konviktions-Rating 0..100 ` +
        `(Track Record, Narrativ-Führung, Adoption). Das ist der größte Score-Block und hält Blue Chips vorne. ` +
        `Coins ohne Eintrag laufen als <strong>NEU</strong> mit neutralem Basiswert 46 mit, können also bei starkem Momentum trotzdem aufsteigen.<br><br>` +
        `<strong>Score:</strong> Qualität 38% · Momentum 27% (7d zählt 60%, 24h 40%) · Hype 18% (Volumen/Market-Cap-Umschlag + Sektor-Hitze) · ` +
        `Liquidität 10% · ATH-Spielraum 7%. Momentum, Hype und Liquidität als Perzentil-Rang im Universe, damit ein Ausreißer die Skala nicht zerlegt.<br><br>` +
        `<strong>Sektor-Deckel:</strong> höchstens ${PP_SECTOR_CAP} Coins pro Narrativ im ganzen Depot. ` +
        `Ohne den Deckel würde die Engine in einer Sektor-Manie alle 12 Plätze mit demselben Narrativ füllen.<br><br>` +
        `<strong>Gewichtung:</strong> Jedes Tier bekommt seinen Profil-Anteil. Innerhalb des Tiers zur Hälfte gleichgewichtet, ` +
        `zur Hälfte nach Score. Sonst kippt ein Tier komplett in einen Coin.`;
    const warnung = `<strong>Was das nicht ist:</strong> keine Anlageberatung, sondern die mechanische Ausgabe der Regeln oben. ` +
        `Die Engine kauft Stärke, sie sucht keine Böden. In Trends funktioniert das, an Wendepunkten kauft sie genau das Top. ` +
        `Sie kennt weder dein Kapital noch deinen Zeithorizont, prüft keine Fundamentals, kein Team, keine Unlocks. ` +
        `30d- und 1y-Werte fehlen im Score, weil die API dort nur Nullen liefert. Nutz das als Ideengeber, nicht als Kaufliste.`;

    return card({ eyebrow: 'Allokations-Engine', title: '12 Coins nach Regeln', right: seg('ppprofil', [['defensiv', 'Defensiv'], ['ausgewogen', 'Ausgewogen'], ['aggressiv', 'Aggressiv']], ppProfile),
        cls: 'pp-engine', body: balken + tiers + meta }) +
        card({ eyebrow: 'So wird gerechnet', body: `<div class="pp-note">${regeln}</div><div class="pp-warn">${warnung}</div>` });
}


export default {
    styles: `
        .pp-donut { display: grid; grid-template-columns: minmax(220px, 320px) minmax(0, 1fr); gap: 30px; align-items: center; }
        .pp-donut-ring { position: relative; }
        .pp-donut-ring::before { content: ''; position: absolute; inset: 14%; border-radius: 50%; background: var(--grad-conic); filter: blur(34px); opacity: calc(var(--glow-o) * .7); }
        .pp-donut-ring svg { position: relative; display: block; width: 100%; height: auto; }
        .pp-seg { cursor: pointer; transition: stroke-width .25s var(--ease), opacity .25s; }
        .pp-donut.akt .pp-seg { opacity: .45; } .pp-donut.akt .pp-seg.hi { opacity: 1; stroke-width: 38; }
        .pp-donut-mitte { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; pointer-events: none; padding: 0 24%; overflow-wrap: anywhere; }
        .pp-donut-leg { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 6px 14px; }
        .pp-donut-leg div { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 10px; font-size: .76rem; cursor: pointer; transition: background .2s; }
        .pp-donut-leg div:hover, .pp-donut-leg div.hi { background: color-mix(in srgb, var(--ink) 5%, transparent); }
        .pp-donut-leg em { font-style: normal; min-width: 92px; text-align: right; color: var(--ink-2); }
        .pp-donut-leg i { width: 9px; height: 9px; border-radius: 50%; flex: none; } .pp-donut-leg span { margin-left: auto; }
        @media (max-width: 860px) { .pp-donut { grid-template-columns: minmax(0, 1fr); } .pp-donut-ring { max-width: 280px; margin: 0 auto; } }
        .pp-pfgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-top: 18px; }
        .pp-pf { text-align: left; padding: 16px 18px; cursor: pointer; transition: transform .25s var(--ease); }
        .pp-pf:hover { transform: translateY(-2px); }
        .pp-pfwert { font-size: 1.4rem; font-weight: 300; margin: 8px 0 6px; }
        .pp-pfzeile { display: flex; flex-wrap: wrap; gap: 4px 12px; font-family: var(--mono); font-size: .7rem; color: var(--ink-3); margin-top: 3px; }
        @media (max-width: 860px) { .pp-pfgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .pp-pfwert { font-size: 1.15rem; } }
        .pp-sec { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin: 6px 4px -8px; }
        .pp-sec .eyebrow:first-child { color: var(--pg); }
        .pp-kb-form { gap: 10px; flex-wrap: nowrap; } .pp-kb-form .input { width: 180px; }
        .pp-equity { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 22px; }
        .pp-eqsvg { display: block; width: 100%; height: 200px; }
        .pp-eqleg { display: flex; gap: 14px; font-family: var(--mono); font-size: .66rem; color: var(--ink-2); }
        .pp-eqleg span { display: inline-flex; align-items: center; gap: 6px; } .pp-eqleg i { width: 14px; height: 3px; border-radius: 2px; }
        .pp-secbar { display: flex; height: 26px; border-radius: 10px; overflow: hidden; background: var(--bg); box-shadow: var(--sh-in); }
        .pp-secbar div { min-width: 2px; transition: width .8s var(--ease); }
        .pp-legend { display: flex; gap: 8px 16px; flex-wrap: wrap; margin-top: 14px; font-size: .74rem; color: var(--ink-2); }
        .pp-legend span { display: inline-flex; align-items: center; gap: 7px; } .pp-legend i { width: 9px; height: 9px; border-radius: 3px; flex: none; }
        .pp-delta { display: grid; grid-template-columns: 70px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 9px 6px; font-size: .84rem; cursor: pointer; border-radius: 10px; transition: background .2s; }
        .pp-delta:hover { background: color-mix(in srgb, var(--ink) 4%, transparent); }
        .pp-delta .dim { font-size: .72rem; }
        .pp-engine .card-head { flex-wrap: wrap; }
        .pp-allocbar { display: flex; height: 38px; border-radius: 14px; overflow: hidden; background: var(--bg); box-shadow: var(--sh-in); padding: 4px; gap: 4px; }
        .pp-allocbar div { border-radius: 10px; display: grid; place-items: center; background: color-mix(in srgb, var(--c) 34%, var(--surface)); color: var(--ink); font-size: .74rem; font-weight: 600; min-width: 34px; transition: width .8s var(--ease); }
        .pp-tier { margin-top: 30px; }
        .pp-tierhead { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .pp-tierhead i { flex: 1; height: 1px; background: var(--line); } .pp-tierhead b { font-weight: 400; font-size: 1.05rem; }
        .pp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .pp-card { padding: 18px 20px; border-top: 2px solid color-mix(in srgb, var(--c) 70%, transparent); }
        .pp-cardtop { display: flex; align-items: center; gap: 12px; }
        .pp-cardtop .coin-img { width: 36px; height: 36px; }
        .pp-name { font-weight: 500; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-sym { font-family: var(--mono); font-size: .68rem; color: var(--ink-3); letter-spacing: .08em; }
        .pp-weight { font-size: 1.7rem; font-weight: 300; letter-spacing: -.03em; color: var(--c); }
        .pp-pricerow { display: flex; align-items: baseline; gap: 14px; margin: 14px 0 12px; font-family: var(--mono); font-size: .82rem; flex-wrap: wrap; }
        .pp-pricerow > .num { font-size: 1rem; margin-right: auto; }
        .pp-pricerow small { margin-left: 5px; font-size: .58rem; letter-spacing: .12em; color: var(--ink-3); }
        .pp-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .pp-bars { display: flex; flex-direction: column; gap: 9px; }
        .pp-barrow { display: grid; grid-template-columns: 78px minmax(0, 1fr) 28px; gap: 10px; align-items: center; font-size: .72rem; color: var(--ink-3); }
        .pp-barrow b { text-align: right; font-weight: 500; color: var(--ink-2); }
        .pp-meta { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: 26px; padding-top: 18px; border-top: 1px solid var(--line); font-size: .78rem; color: var(--ink-3); }
        .pp-meta strong { color: var(--ink); font-weight: 500; }
        .pp-note { font-size: .86rem; line-height: 1.6; color: var(--ink-2); font-weight: 300; max-width: 110ch; } .pp-note strong { color: var(--ink); font-weight: 500; }
        .pp-warn { margin-top: 18px; padding: 16px 18px; border-radius: var(--r-md); font-size: .84rem; line-height: 1.6; color: var(--ink-2); font-weight: 300; background: color-mix(in srgb, var(--warn) 10%, transparent); border-left: 3px solid var(--warn); }
        .pp-warn strong { color: var(--warn); font-weight: 500; }
        .pp-page code { font-family: var(--mono); font-size: .9em; padding: 1px 6px; border-radius: 6px; background: var(--sunk); }
        @media (max-width: 1180px) { .pp-equity { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 860px) { .pp-grid { grid-template-columns: minmax(0, 1fr); } .pp-kb-form { flex-wrap: wrap; } .pp-kb-form .input { width: 100%; }
            .pp-delta { grid-template-columns: 56px minmax(0, 1fr); } .pp-delta > :last-child { grid-column: 2; } }`,
    render(root) {
        root.classList.add('stack', 'pp-page');
        const zeichne = () => {
            const pf = computePerfectPortfolio(D.coins);
            let html = pageHead('Portfolio', 'Regel-Portfolio', '12 Coins, mechanisch aus dem Live-Universe gefiltert. Gewichtet nach Momentum, Hype, Liquidität und Risiko-Tier. Keine Meinung, nur Regeln.' + (window.CB2_PUBLIC ? '' : ' Darüber: deine echten Bestände und wie weit sie von den Regeln abweichen.'));
            root.innerHTML = html + `<div class="pp-sec"><div class="eyebrow">Regel-Portfolio</div></div>` + engine(pf);
        };
        zeichne();
        const neu = () => { const y = root.closest('.main') ? root.closest('.main').scrollTop : 0; zeichne(); hydrate(root); const m = root.closest('.main'); if (m) m.scrollTop = y; };
        root.onclick = e => {
            const p = e.target.closest('[data-seg="ppprofil"] button');
            if (p) { ppProfile = p.dataset.v; neu(); return; }
            if (e.target.closest('#ppAlle')) { alleZeigen = !alleZeigen; neu(); }
        };
        const hebe = idx => {
            const d = root.querySelector('.pp-donut'); if (!d) return;
            const m = d.querySelector('.pp-donut-mitte');
            if (m && m.dataset.std == null) m.dataset.std = m.innerHTML;
            d.classList.toggle('akt', idx != null);
            d.querySelectorAll('[data-pi]').forEach(el => el.classList.toggle('hi', idx != null && el.dataset.pi === idx));
            if (!m) return;
            const leg = idx != null ? d.querySelector(`.pp-donut-leg [data-pi="${idx}"]`) : null;
            m.innerHTML = leg ? mitte(esc(leg.dataset.sym), esc(leg.dataset.pv), esc(leg.dataset.ps) + '% · ' + esc(leg.dataset.pn)) : m.dataset.std;
        };
        root.onmouseover = e => { const el = e.target.closest ? e.target.closest('.pp-donut [data-pi]') : null; if (el) hebe(el.dataset.pi); };
        root.onmouseout = e => {
            const el = e.target.closest ? e.target.closest('.pp-donut [data-pi]') : null;
            if (el && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.pp-donut [data-pi]'))) hebe(null);
        };
    },
};
