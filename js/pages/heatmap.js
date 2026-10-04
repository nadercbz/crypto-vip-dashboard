import { D } from '../core/data.js';
import { esc, fUsd, fNum, fPct } from '../core/fmt.js';
import { card, pageHead, seg, coinImg, pct, empty } from '../core/ui.js';

const SECTORS = {
    'bitcoin':['Layer 1','Store of Value'],'ethereum':['Layer 1','Smart Contracts'],'solana':['Layer 1','High Performance'],
    'cardano':['Layer 1'],'avalanche':['Layer 1'],'the-open-network':['Layer 1','TON Ecosystem'],
    'near-protocol':['Layer 1','AI Infrastructure'],'algorand':['Layer 1'],
    'hedera-hashgraph':['Layer 1','Enterprise'],'sui':['Layer 1','Move Ecosystem'],
    'aptos':['Layer 1','Move Ecosystem'],'sei':['Layer 1','Trading Infra'],
    'cosmos':['Layer 1','Cross-Chain'],'tezos':['Layer 1'],
    'internet-computer':['Layer 1','Web3 Cloud'],'neo':['Layer 1'],
    'eos':['Layer 1'],'flow':['Layer 1','NFT Infra'],'kava':['Layer 1','DeFi Lending'],
    'elrond':['Layer 1'],'tron':['Layer 1','Payment'],
    'binancecoin':['Layer 1','BNB Ecosystem','Exchange'],
    'ethereum-classic':['Layer 1'],'bitcoin-cash':['Layer 1','Payment'],
    'litecoin':['Layer 1','Payment'],'stellar':['Layer 1','Payment'],
    'xrp':['Layer 1','Payment','Cross-Border'],
    'flare-network':['Layer 1','Oracle','Cross-Chain'],
    'vechain':['Layer 1','Supply Chain'],'bitcoin-sv':['Layer 1'],
    'zilliqa':['Layer 1'],'ontology':['Layer 1','Enterprise'],
    'decred':['Layer 1','Governance'],'dash':['Layer 1','Payment'],
    'iota':['Layer 1','IoT'],'mina-protocol':['Layer 1','Privacy','ZK'],
    'casper-network':['Layer 1','Enterprise'],'celo':['Layer 1','Payment','Mobile'],
    'astar':['Layer 1','Polkadot Ecosystem'],'icon':['Layer 1','Cross-Chain'],
    'iotex':['Layer 1','IoT','DePIN'],'waves':['Layer 1'],
    'sonic':['Layer 1','High Performance'],'berachain':['Layer 1','DeFi'],
    'monad':['Layer 1','High Performance','EVM'],
    'story':['Layer 1','IP Infrastructure'],
    'celestia':['Layer 1','Modular Blockchain','Data Availability'],

    'polygon-ecosystem-token':['Ethereum L2','Scaling'],'arbitrum':['Ethereum L2','Scaling'],
    'optimism':['Ethereum L2','Scaling'],'starknet':['Ethereum L2','ZK Rollup'],
    'zksync':['Ethereum L2','ZK Rollup'],'mantle':['Ethereum L2','Scaling'],
    'immutable-x':['Ethereum L2','Gaming','NFT Infra'],
    'polygon':['Ethereum L2','Scaling'],'linea':['Ethereum L2','ZK Rollup'],
    'movement':['Ethereum L2','Move Ecosystem'],
    'aztec':['Ethereum L2','ZK Rollup','Privacy'],
    'skale':['Ethereum L2','Gaming'],

    'stacks':['Bitcoin L2','Smart Contracts'],'ordinals':['Bitcoin Ecosystem','NFT Infra'],
    'lightning':['Bitcoin L2','Payment'],'rif-token':['Bitcoin L2','Smart Contracts'],

    'fetch-ai':['AI Agent','Autonomous Agent'],'singularitynet':['AI Agent','AGI'],
    'virtual-protocol':['AI Agent','Virtual Agent'],'worldcoin':['AI Agent','Identity'],
    'kite-ai':['AI Agent','Data'],'chainopera-ai':['AI Agent'],
    'ai':['AI Agent'],'skyai':['AI Agent'],
    'ariaai':['AI Agent'],'alchemist-ai':['AI Agent','No-Code'],
    'sahara-ai':['AI Agent','Data'],
    'sentient':['AI Agent','AGI'],

    'render-token':['AI Infrastructure','GPU Network'],'akash-network':['AI Infrastructure','Cloud Computing'],
    'bittensor':['AI Infrastructure','Decentralized AI'],'ocean-protocol':['AI Infrastructure','Data Market'],
    'grass':['AI Infrastructure','Data Scraping'],'aethir':['AI Infrastructure','GPU Cloud'],
    'aioz-network':['AI Infrastructure','CDN','DePIN'],
    'phala-network':['AI Infrastructure','Privacy Computing'],
    'numeraire':['AI Infrastructure','Hedge Fund'],
    'ai-rig-complex':['AI Infrastructure','Mining'],
    'venice-token':['AI Infrastructure','Privacy AI'],

    'aave':['DeFi Lending'],'maker':['DeFi Lending','Stablecoin Issuer'],
    'compoundd':['DeFi Lending'],'morpho':['DeFi Lending','Yield Optimizer'],
    'venus':['DeFi Lending','BNB Ecosystem'],
    'instadapp':['DeFi Lending','Aggregator'],
    'liquity-usd':['DeFi Lending','Stablecoin'],

    'uniswap':['DeFi DEX','Ethereum'],'curve-dao-token':['DeFi DEX','Stablecoin DEX'],
    'jupiter-exchange-token':['DeFi DEX','Solana Ecosystem'],
    'pancakeswap':['DeFi DEX','BNB Ecosystem'],'sushi':['DeFi DEX','Multi-Chain'],
    'raydium':['DeFi DEX','Solana Ecosystem'],
    'aerodrome-finance':['DeFi DEX','Base Ecosystem'],
    'orca':['DeFi DEX','Solana Ecosystem'],
    '1inch':['DeFi DEX','Aggregator'],'dydx-chain':['DeFi DEX','Perpetuals'],
    'vvs-finance':['DeFi DEX','Cronos'],
    'meteora':['DeFi DEX','Solana Ecosystem','Liquidity'],
    'cow-protocol-token':['DeFi DEX','MEV Protection'],

    'lido-dao':['DeFi Liquid Staking','Ethereum'],
    'lido-staked-ether':['DeFi Liquid Staking','Ethereum'],
    'rocket-pool':['DeFi Liquid Staking','Ethereum'],
    'rocket-pool-eth':['DeFi Liquid Staking','Ethereum'],
    'jito-staked-sol':['DeFi Liquid Staking','Solana Ecosystem'],
    'marinade-staked-sol':['DeFi Liquid Staking','Solana Ecosystem'],
    'coinbase-wrapped-staked-eth':['DeFi Liquid Staking','Ethereum'],
    'binance-staked-sol':['DeFi Liquid Staking','Solana Ecosystem'],
    'etherfi':['DeFi Liquid Staking','Restaking'],
    'renzo-restaked-eth':['DeFi Liquid Staking','Restaking'],
    'jito':['DeFi Liquid Staking','Solana Ecosystem','MEV'],

    'pendle':['DeFi Yield','Yield Tokenization'],'convex-finance':['DeFi Yield','Curve Ecosystem'],
    'yearnfinance':['DeFi Yield','Vault'],'olympus-v2':['DeFi Yield','Reserve Currency'],
    'eigenlayer':['DeFi Yield','Restaking'],

    'chainlink':['Oracle','Cross-Chain'],'band-protocol':['Oracle'],
    'pyth-network':['Oracle','Solana Ecosystem'],'api3':['Oracle','First-Party'],
    'redstone':['Oracle','Modular'],
    'tellor':['Oracle','Decentralized'],

    'polkadot':['Cross-Chain','Interop'],'wormhole':['Cross-Chain','Bridge'],
    'layerzero':['Cross-Chain','Messaging'],'axelar':['Cross-Chain','Bridge'],
    'thorchain':['Cross-Chain','DEX'],
    'stargatetoken':['Cross-Chain','Bridge','Liquidity'],
    'synapse-2':['Cross-Chain','Bridge'],

    'tether':['Stablecoin','Payment'],'usd-coin':['Stablecoin','Payment'],
    'dai':['Stablecoin','DeFi'],'paypal-usd':['Stablecoin','Payment','TradFi'],
    'first-digital-usd':['Stablecoin'],'usdd':['Stablecoin'],
    'ripple-usd':['Stablecoin','Payment'],'trueusd':['Stablecoin'],
    'frax':['Stablecoin','Algorithmic'],'gho':['Stablecoin','DeFi Lending'],
    'paxos-standard-token':['Stablecoin'],
    'telcoin':['Payment','Mobile','Remittance'],
    'amp':['Payment','Collateral'],
    'flexa':['Payment','Point of Sale'],
    'usds':['Stablecoin'],'ethena-usde':['Stablecoin','DeFi Yield'],
    'usual-usd':['Stablecoin','RWA'],
    'usd1':['Stablecoin'],

    'ondo':['RWA','Tokenized Treasuries'],'mantra':['RWA','Tokenization Platform'],
    'centrifuge':['RWA','Credit Markets'],'clearpool':['RWA','Credit Markets'],
    'pax-gold':['RWA','Gold Tokenized'],'tether-gold':['RWA','Gold Tokenized'],
    'canton-network':['RWA','Enterprise'],
    'syrup-token':['RWA','Credit Markets'],

    'helium':['DePIN','Wireless Network'],'hivemapper':['DePIN','Mapping'],
    'geodnet-token':['DePIN','GPS Network'],'filecoin':['DePIN','Storage'],
    'arweave':['DePIN','Permanent Storage'],'livepeer':['DePIN','Video Streaming'],
    'storj':['DePIN','Cloud Storage'],'siacoin':['DePIN','Storage'],
    'theta-token':['DePIN','Video CDN'],'theta-fuel':['DePIN','Video CDN'],
    'power-ledger':['DePIN','Energy'],'world-mobile-token':['DePIN','Telecom'],
    'holo':['DePIN','Hosting'],
    'golem':['DePIN','Computing'],
    'nosana':['DePIN','GPU Computing','AI Infrastructure'],

    'axie-infinity':['GameFi','Play-to-Earn'],'the-sandbox':['GameFi','Metaverse'],
    'decentraland':['GameFi','Metaverse'],'gala':['GameFi','Gaming Platform'],
    'beam-eth':['GameFi','Gaming Chain'],'illuvium':['GameFi','AAA Gaming'],
    'ronin-token':['GameFi','Gaming Chain'],'undeads-games':['GameFi'],
    'nexpace':['GameFi'],

    'dogecoin':['Meme','OG Meme'],'shiba-inu':['Meme','Dog Meme'],
    'pepe':['Meme','Frog Meme'],'bonk':['Meme','Solana Ecosystem'],
    'floki-inu':['Meme','Dog Meme'],'dogwifcoin':['Meme','Solana Meme'],
    'popcat':['Meme','Solana Meme'],'brett-base':['Meme','Base Ecosystem'],
    'mog-coin':['Meme','Ethereum'],'baby-doge-coin':['Meme','BNB Ecosystem'],
    'cat-in-a-dogs-world':['Meme','Cat Meme'],'turbo':['Meme','AI Meme'],
    'fartcoin':['Meme','Solana Meme'],'official-trump':['Meme','PolitiFi'],
    'melania-meme':['Meme','PolitiFi'],'peanut-the-squirrel':['Meme'],
    'non-playable-coin':['Meme'],'moo-deng-moodengsolcom':['Meme','Solana Meme'],
    'spx6900':['Meme','Index Meme'],'pudgy-penguins':['Meme','NFT Meme'],
    'comedian':['Meme'],'banana-for-scale':['Meme','Solana Meme'],
    'jelly-my-jelly':['Meme'],'not-in-employment-education-or-training':['Meme'],

    'monero':['Privacy','Fungible'],'zcash':['Privacy','ZK'],
    'decred':['Privacy','Governance'],'verge':['Privacy'],
    'horizen':['Privacy','ZK'],'beldex':['Privacy','Messaging'],
    'pirate':['Privacy'],'tornado-cash':['Privacy','Mixer'],
    'zano':['Privacy'],

    'leo-token':['Exchange Token','Bitfinex'],'okb':['Exchange Token','OKX'],
    'bitget-token':['Exchange Token','Bitget'],'kucoin-token':['Exchange Token','KuCoin'],
    'gatechain-token':['Exchange Token','Gate.io'],'cryptocom-chain':['Exchange Token','Crypto.com'],
    'mx-token':['Exchange Token','MEXC'],'bitmart-token':['Exchange Token','BitMart'],
    'whitebit':['Exchange Token','WhiteBIT'],'nexo':['Exchange Token','CeFi Lending'],
    'swissborg':['Exchange Token'],
    'btse-token':['Exchange Token','BTSE'],

    'blur':['NFT Infra','Marketplace'],'apecoin':['NFT Ecosystem','Metaverse'],
    'enjin-coin':['NFT Infra','Gaming'],'apenft':['NFT Ecosystem'],
    'ethereum-name-service':['NFT Infra','Identity','Domains'],
    'puff-the-dragon':['NFT Ecosystem'],

    'mask-network':['Social','Web3 Social'],'decentralized-social':['Social','Protocol'],
    'kaito':['Social','AI Analytics'],
    'galxe':['Social','Credential'],
    'status':['Social','Messaging'],

    'safe':['Governance','Multisig'],'gnosis':['Governance','Prediction Market'],
    'sky':['Governance','MakerDAO'],
    'constitutiondao':['Governance','DAO'],

    'the-graph':['Modular Blockchain','Indexing'],'succinct':['Modular Blockchain','ZK Proofs'],
    'doublezero':['Modular Blockchain','Network Layer'],
    'espresso':['Modular Blockchain','Shared Sequencer'],

    'celestia':['Data Availability','Modular Blockchain'],

    'pumpfun':['Solana Ecosystem','Meme Launchpad'],

    'eigenlayer':['Restaking','Ethereum'],'etherfi':['Restaking','Liquid Restaking'],
    'renzo-restaked-eth':['Restaking','Liquid Restaking'],
    'renzo-restaked-sol':['Restaking','Solana Ecosystem'],

    'starknet':['ZK','Ethereum L2'],'zksync':['ZK','Ethereum L2'],
    'mina-protocol':['ZK','Layer 1'],'aztec':['ZK','Privacy'],
    'succinct':['ZK','Proof Infrastructure'],

    'pax-gold':['Tokenized Gold','RWA'],'tether-gold':['Tokenized Gold','RWA'],
    'matrixdock-gold':['Tokenized Gold','RWA'],

    'official-trump':['PolitiFi','Meme'],'melania-meme':['PolitiFi','Meme'],
    'official-world-liberty-financial':['PolitiFi','DeFi'],

    'vechain':['Supply Chain','Enterprise'],'origintrail':['Supply Chain','Knowledge Graph'],

    'iota':['IoT','Tangle'],'iotex':['IoT','DePIN'],
    'jasmy':['IoT','Data Privacy'],
    'jasmycoin':['IoT','Data Privacy'],
};

function computeTopNarratives(db, feld) {
    feld = feld || 'price_change_percentage_24h';
    const sectorPerf = Object.create(null);
    for (const c of db) {
        const tags = SECTORS[c.id];
        if (!tags) continue;
        const chg = c[feld];
        if (chg == null) continue;
        for (const tag of tags) {
            if (!sectorPerf[tag]) sectorPerf[tag] = { sum: 0, count: 0, coins: [], mcap: 0 };
            sectorPerf[tag].sum += chg;
            sectorPerf[tag].count++;
            sectorPerf[tag].coins.push(c.symbol);
            sectorPerf[tag].mcap += (c.market_cap || 0);
        }
    }
    return Object.entries(sectorPerf)
        .filter(([, s]) => s.count >= 2)
        .map(([name, s]) => ({ name, avg: s.sum / s.count, count: s.count, mcap: s.mcap }))
        .sort((a, b) => b.avg - a.avg);
}

const FELD = { '24h': 'price_change_percentage_24h', '7d': 'price_change_percentage_7d_in_currency', '30d': 'price_change_percentage_30d' };
const st = { tf: '24h', sektor: null };

function staerke(avg) {
    const spanne = st.tf === '30d' ? 30 : st.tf === '7d' ? 15 : 6;
    if (Math.abs(avg) < 0.15) return 0;
    return Math.round((0.2 + 0.6 * Math.min(1, Math.abs(avg) / spanne)) * 100);
}
const mix = (farbe, p) => `color-mix(in srgb, var(${farbe}) ${p}%, var(--sunk))`;
const NULL_FARBE = 'color-mix(in srgb, var(--ink) 9%, var(--sunk))';
function heatColor(avg) {
    const p = staerke(avg);
    return p === 0 ? NULL_FARBE : mix(avg > 0 ? '--up' : '--down', p);
}

function squarify(eintraege, x, y, breite, hoehe) {
    const summe = eintraege.reduce((a, b) => a + b.wert, 0);
    if (!summe || breite <= 0 || hoehe <= 0) return [];
    const faktor = (breite * hoehe) / summe;
    const rest = eintraege.map(e => ({ ...e, flaeche: e.wert * faktor })).sort((a, b) => b.flaeche - a.flaeche);
    const out = [];
    let px = x, py = y, pb = breite, ph = hoehe;

    function schlechtestes(reihe, kurz) {
        if (!reihe.length || !kurz) return Infinity;
        const s = reihe.reduce((a, b) => a + b.flaeche, 0);
        if (!s) return Infinity;
        const max = Math.max(...reihe.map(r => r.flaeche));
        const min = Math.min(...reihe.map(r => r.flaeche));
        const k2 = kurz * kurz, s2 = s * s;
        return Math.max((k2 * max) / s2, s2 / (k2 * min));
    }

    let i = 0;
    while (i < rest.length) {
        const kurz = Math.min(pb, ph);
        const reihe = [rest[i]];
        let j = i + 1;
        while (j < rest.length && schlechtestes(reihe.concat(rest[j]), kurz) <= schlechtestes(reihe, kurz)) { reihe.push(rest[j]); j++; }
        const reihenFlaeche = reihe.reduce((a, b) => a + b.flaeche, 0);
        const dicke = reihenFlaeche / kurz;
        let versatz = 0;
        reihe.forEach(r => {
            const laenge = r.flaeche / dicke;
            if (pb >= ph) out.push({ ...r, x: px, y: py + versatz, b: dicke, h: laenge });
            else out.push({ ...r, x: px + versatz, y: py, b: laenge, h: dicke });
            versatz += laenge;
        });
        if (pb >= ph) { px += dicke; pb -= dicke; } else { py += dicke; ph -= dicke; }
        i = j;
        if (pb <= 0.5 || ph <= 0.5) break;
    }
    return out;
}

function karte() {
    const ranked = computeTopNarratives(D.coins, FELD[st.tf]);
    if (!ranked.length) return empty('Keine Sektordaten.');
    const schmal = typeof matchMedia === 'function' && matchMedia('(max-width: 860px)').matches;
    const B = 1000, H = schmal ? 820 : 560, zoom = schmal ? 1.35 : 1;
    const gross = ranked.slice().sort((a, b) => (b.mcap || 0) - (a.mcap || 0)).slice(0, 18)
        .map(s => ({ ...s, wert: Math.sqrt(Math.max(s.mcap || 1, 1)) }));
    const kacheln = squarify(gross, 0, 0, B, H);

    const teile = kacheln.map(t => {
        const sign = t.avg >= 0 ? '+' : '';
        const kurz = Math.min(t.b, t.h);
        const istGross = kurz > 150, mittel = kurz > 78;
        const nameGr = (istGross ? 21 : mittel ? 16 : 12) * zoom;
        const pctGr = (istGross ? 18 : mittel ? 14 : 11) * zoom;
        const platzName = t.b > 62 * zoom && t.h > 34 * zoom;
        const platzZahl = t.b > 44 * zoom && t.h > 20 * zoom;
        const platzAnzahl = !schmal && t.b > 112 && t.h > 84;
        const px = (t.x + (mittel ? 12 : 6)).toFixed(1);
        const maxZeichen = Math.floor((t.b - 14) / (nameGr * 0.56));
        const name = t.name.length > maxZeichen ? t.name.slice(0, Math.max(3, maxZeichen - 1)) + '…' : t.name;
        const stark = staerke(t.avg) >= 60;
        const w = Math.max(0, t.b - 3).toFixed(1), h = Math.max(0, t.h - 3).toFixed(1);
        return `<g class="hm-tile${stark ? ' stark' : ''}${st.sektor === t.name ? ' on' : ''}" data-sector="${esc(t.name)}">
            <title>${esc(t.name)} · ${sign}${t.avg.toFixed(2).replace('.', ',')}% · ${t.count} Coins</title>
            <rect x="${t.x.toFixed(1)}" y="${t.y.toFixed(1)}" width="${w}" height="${h}" rx="12" style="fill:${heatColor(t.avg)}"/>
            ${platzName ? `<text x="${px}" y="${(t.y + nameGr + 8).toFixed(1)}" class="hm-name" style="font-size:${nameGr}px">${esc(name)}</text>` : ''}
            ${platzZahl ? `<text x="${px}" y="${(t.y + (platzName ? nameGr + pctGr + 14 : pctGr + 6)).toFixed(1)}" class="hm-pct" style="font-size:${pctGr}px">${sign}${t.avg.toFixed(1).replace('.', ',')}%</text>` : ''}
            ${platzAnzahl ? `<text x="${px}" y="${(t.y + t.h - 16).toFixed(1)}" class="hm-count">${t.count} Coins</text>` : ''}
        </g>`;
    }).join('');
    return `<svg viewBox="0 0 ${B} ${H}" class="hm-svg" style="aspect-ratio:${B} / ${H}">${teile}</svg>`;
}

const athFarbe = p => p == null ? 'var(--ink-3)' : p >= -20 ? 'var(--up)' : p >= -50 ? 'var(--warn)' : 'var(--down)';

function drill(sectorName) {
    const coins = D.coins.filter(c => { const tags = SECTORS[c.id]; return tags && tags.includes(sectorName); })
        .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    const avg = coins.length ? coins.reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) / coins.length : 0;
    const zeilen = coins.map((c, i) => {
        const S = (c.symbol || '').toUpperCase(), athP = c.ath_change_percentage;
        const vm = (c.total_volume && c.market_cap) ? fNum(c.total_volume / c.market_cap * 100, 1) + '%' : '—';
        return `<tr data-coin="${esc(S)}">
            <td class="dim mono">${i + 1}</td>
            <td><div class="row" style="gap:10px">${coinImg(c.image)}<b style="font-weight:500">${esc(c.name)}</b><span class="dim mono" style="font-size:.72rem">${esc(S)}</span></div></td>
            <td class="r">${fUsd(c.current_price)}</td>
            <td class="r">${pct(c.price_change_percentage_24h || 0, 2)}</td>
            <td class="r">${pct(c.price_change_percentage_7d_in_currency || 0, 2)}</td>
            <td class="r" style="color:${athFarbe(athP)}">${athP != null ? fNum(athP, 1) + '%' : '—'}</td>
            <td class="r dim">${vm}</td></tr>`;
    }).join('');
    return card({ eyebrow: 'Sektor Drill-Down', title: sectorName,
        right: `<div class="row" style="gap:14px"><span class="big num hm-avg ${avg >= 0 ? 'up' : 'down'}">${fPct(avg, 2)}</span><span class="eyebrow">${coins.length} Coins</span></div>`,
        body: coins.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Coin</th><th class="r">Preis</th><th class="r">24h</th><th class="r">7d</th><th class="r">ATH</th><th class="r">V/MC</th></tr></thead><tbody>${zeilen}</tbody></table></div>`
            : empty('Keine Coins in diesem Sektor.') });
}

export default {
    styles: `
        .hm-leg { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 16px 0 14px; font-family: var(--mono); font-size: .62rem; letter-spacing: .08em; color: var(--ink-3); }
        .hm-leg span { display: inline-flex; align-items: center; gap: 7px; }
        .hm-leg i { width: 14px; height: 14px; border-radius: 5px; background: var(--c); }
        .hm-svg { width: 100%; height: auto; display: block; }
        .hm-tile { cursor: pointer; }
        .hm-tile rect { stroke: var(--line); stroke-width: 1.5; transition: filter .25s var(--ease), stroke .25s var(--ease), stroke-width .25s var(--ease); }
        .hm-tile:hover rect { filter: brightness(1.08) saturate(1.15); }
        .hm-tile.on rect { stroke: var(--ink); stroke-width: 3; }
        .hm-tile text { fill: var(--ink); pointer-events: none; }
        .hm-tile.stark text { fill: var(--bg); }
        .hm-name { font-weight: 500; }
        .hm-pct { font-family: var(--mono); font-weight: 500; }
        .hm-count { font-family: var(--mono); font-size: 12px; opacity: .65; }
        .hm-avg { font-size: 1.5rem; }
        #hmDrill:empty { display: none; }`,
    render(root) {
        root.classList.add('stack');
        const sw = (c, l) => `<span><i style="--c:${c}"></i>${l}</span>`;
        root.innerHTML = pageHead('Markt', 'Sektor-Heatmap',
            'Wo fließt das Geld? Jede Kachel ist ein Sektor. Die Fläche entspricht der Marktkapitalisierung, die Farbe der Performance. Klick auf eine Kachel für die Top-Coins.',
            `<span class="eyebrow">Stand ${esc(D.coinsStand)}</span>`) +
            card({ body: `${seg('hmtf', [['24h', '24 Stunden'], ['7d', '7 Tage'], ['30d', '30 Tage']], st.tf)}
                <div class="hm-leg">${sw(mix('--down', 80), 'stark im Minus')}${sw(mix('--down', 35), 'im Minus')}${sw(NULL_FARBE, 'um null')}${sw(mix('--up', 38), 'im Plus')}${sw(mix('--up', 80), 'stark im Plus')}</div>
                <div id="hmGrid">${karte()}</div>` }) +
            `<div id="hmDrill">${st.sektor ? drill(st.sektor) : ''}</div>`;
        const grid = root.querySelector('#hmGrid'), panel = root.querySelector('#hmDrill'), tf = root.querySelector('[data-seg="hmtf"]');
        tf.onclick = e => {
            const b = e.target.closest('button'); if (!b) return;
            st.tf = b.dataset.v;
            tf.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
            grid.innerHTML = karte();
        };
        grid.onclick = e => {
            const tile = e.target.closest('.hm-tile'); if (!tile) return;
            grid.querySelectorAll('.hm-tile').forEach(t => t.classList.toggle('on', t === tile));
            st.sektor = tile.dataset.sector;
            panel.innerHTML = drill(st.sektor);
        };
    },
};
