const g = fn => { try { return fn(); } catch (e) { return undefined; } };

export const D = {
    get coins()      { return g(() => CRYPTO_DB) || []; },
    get coinsStand() { return g(() => CRYPTO_DB_UPDATED) || ''; },
    get signals()    { return g(() => SIGNALS_DATA) || null; },
    get onchain()    { return g(() => ONCHAIN_DATA) || null; },
    get briefing()   { return g(() => BRIEFING_DATA) || null; },
    get extras()     { return g(() => EXTRAS_DATA) || null; },
    get series()     { return g(() => SERIES_DATA) || null; },
    get status()     { return g(() => REFRESH_STATUS) || null; },
    get script()     { return null; },
    get portfolio()  { return null; },
    get history()    { return marktHistorie(); },
    get social()     { return g(() => SOCIAL_DATA) || null; },
    get gems()       { return g(() => GEMS_DATA) || null; },
    get memecoins()  { return window.MEMECOIN_DATA || null; },
    get paper()      { return window.PAPER_DATA || null; },
    get tagebuch()   { return window.TAGEBUCH_DATA || null; },
    get fluencer()   { return window.FLUENCER_DATA || null; },
    get kaufzonen()  { return window.KB_ZONEN || null; },
    get icoipo()     { return window.ICOIPO_DATA || null; },
    get narrativ()   { return window.NARRATIV_DATA || null; },
    get milestoneProjects() { return []; },
    get milestones() { return []; },
};

function marktHistorie() {
    const m = g(() => SERIES_DATA.market) || [];
    return m.map(r => ({ date: r.date, total_mcap: r.total_mcap, btc_dominance: r.btc_dominance, fng: r.fng }));
}

let bySym = null;
export function coin(sym) {
    if (!bySym) {
        bySym = new Map();
        for (const c of D.coins) {
            const k = (c.symbol || '').toUpperCase();
            const alt = bySym.get(k);
            if (!alt || (c.market_cap_rank || 1e9) < (alt.market_cap_rank || 1e9)) bySym.set(k, c);
        }
    }
    return bySym.get(String(sym || '').toUpperCase()) || null;
}
export function signal(sym) {
    const s = D.signals, k = String(sym || '').toLowerCase();
    if (!s || !s.coins) return null;
    const treffer = s.coins.filter(c => c.symbol === k);
    if (treffer.length <= 1) return treffer[0] || null;
    const c = coin(sym);
    return (c && (treffer.find(x => x.id && x.id === c.id) || treffer.find(x => x.name === c.name))) || treffer[0];
}
let byId = null;
export function coinById(id) {
    if (!byId) { byId = new Map(); D.coins.forEach(c => { if (c.id && !byId.has(c.id)) byId.set(c.id, c); }); }
    return byId.get(String(id || '')) || null;
}

export const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    raw(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : v; } catch (e) { return fb; } },
};
const WATCH = 'c2_watchlist';
export const watch = {
    list() { return (store.get(WATCH, []) || []).map(s => String(s || '').toUpperCase()); },
    has(sym) { return this.list().includes(String(sym).toUpperCase()); },
    toggle(sym) {
        const s = new Set(this.list()), k = String(sym).toUpperCase();
        s.has(k) ? s.delete(k) : s.add(k);
        store.set(WATCH, [...s]);
        document.dispatchEvent(new CustomEvent('cb2:watch'));
        return s.has(k);
    },
};

export async function proxy(url) {
    if (/api\.coingecko\.com\/api\/v3\/coins\/bitcoin\/market_chart/.test(url)) {
        const k = await (await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=365')).json();
        if (!Array.isArray(k)) throw new Error('Binance');
        return { prices: k.map(x => [x[0], +x[4]]) };
    }
    if (/^https:\/\/api\.alternative\.me\//.test(url)) {
        const r = await fetch(url);
        if (!r.ok) throw new Error('alternative.me ' + r.status);
        return r.json();
    }
    throw new Error('Kein Proxy in der öffentlichen Fassung');
}
