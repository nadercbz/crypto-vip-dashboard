import { esc } from '../core/fmt.js?v=202610071933';
import { pageHead, card, icon } from '../core/ui.js?v=202610071933';

const LINKS = [
    { name: 'TradingView',   url: 'https://www.tradingview.com/', desc: 'Charts',     icon: 'candlestick-chart' },
    { name: 'CoinGecko',     url: 'https://www.coingecko.com/',   desc: 'Markets',    icon: 'coins' },
    { name: 'CoinMarketCap', url: 'https://coinmarketcap.com/',   desc: 'Markets',    icon: 'bar-chart-3' },
    { name: 'DefiLlama',     url: 'https://defillama.com/',       desc: 'TVL / DeFi', icon: 'landmark' },
    { name: 'Dune',          url: 'https://dune.com/',            desc: 'On-chain',   icon: 'database' },
    { name: 'Glassnode',     url: 'https://glassnode.com/',       desc: 'On-chain',   icon: 'link-2' },
    { name: 'Santiment',     url: 'https://app.santiment.net/',   desc: 'Sentiment',  icon: 'gauge' },
    { name: 'Messari',       url: 'https://messari.io/',          desc: 'Research',   icon: 'file-search' },
    { name: 'Binance',       url: 'https://www.binance.com/',     desc: 'Exchange',   icon: 'repeat' },
    { name: 'Bybit',         url: 'https://www.bybit.com/',       desc: 'Exchange',   icon: 'repeat' },
];
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };

export default {
    styles: `
        .wz-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
        .wz-card { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; align-items: center; gap: 14px; padding: 16px 18px; border-radius: var(--r-md); background: var(--bg); box-shadow: var(--sh-in); color: var(--ink); text-decoration: none; transition: transform .3s var(--ease), box-shadow .3s var(--ease), background .3s var(--ease); }
        .wz-card:hover { transform: translateY(-3px); background: var(--raised); box-shadow: var(--sh-sm); }
        .wz-card:active { transform: scale(.98); }
        .wz-ico { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: var(--surface); box-shadow: var(--sh-sm); color: var(--pg); }
        .wz-ico svg { width: 18px; height: 18px; }
        .wz-name { font-size: .96rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wz-desc { font-family: var(--mono); font-size: .64rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); margin-top: 4px; }
        .wz-host { font-size: .74rem; color: var(--ink-3); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wz-go { color: var(--ink-3); transition: color .25s var(--ease), transform .3s var(--ease-spring); display: grid; }
        .wz-go svg { width: 15px; height: 15px; }
        .wz-card:hover .wz-go { color: var(--ink); transform: translate(2px, -2px); }`,
    render(root) {
        root.classList.add('stack');
        root.innerHTML = pageHead('Wissen', 'Werkzeuge', 'Die wichtigsten externen Tools auf einen Klick. TradingView, CoinGecko, On-Chain Analysen und mehr.',
            `<span class="eyebrow">${LINKS.length} Links</span>`) +
            card({ eyebrow: 'Quick Links', body: `<div class="wz-grid">${LINKS.map(l =>
                `<a class="wz-card" href="${esc(l.url)}" target="_blank" rel="noopener">
                    <span class="wz-ico">${icon(l.icon)}</span>
                    <div style="min-width:0"><div class="wz-name">${esc(l.name)}</div><div class="wz-desc">${esc(l.desc)}</div><div class="wz-host">${esc(host(l.url))}</div></div>
                    <span class="wz-go">${icon('arrow-up-right')}</span></a>`).join('')}</div>` });
    },
};
