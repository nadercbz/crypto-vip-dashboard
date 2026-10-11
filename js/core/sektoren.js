
export const SECTORS = {
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

export function computeTopNarratives(db, feld) {
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
