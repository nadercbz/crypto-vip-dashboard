export const NAV = [
    { group: 'Heute', items: [
        { id: 'cockpit',    label: 'Cockpit',           icon: 'layout-dashboard', alt: 'Überblick' },
        { id: 'signale',    label: 'Tages-Signale',     icon: 'crosshair',        alt: 'neu in 2.0' },
        { id: 'radar',      label: 'Signal-Radar',      icon: 'radar',            alt: 'Radar' },
        { id: 'tagebuch',   label: 'Analyse-Tagebuch',  icon: 'notebook-pen',     alt: 'Tagebuch' },
    ] },
    { group: 'Portfolio', items: [
        { id: 'portfolio',  label: 'Regel-Portfolio',   icon: 'pie-chart',        alt: 'Perfect Portfolio' },
        { id: 'watchlist',  label: 'Watchlist',         icon: 'star',             alt: 'Watchlist' },
    ] },
    { group: 'Markt', items: [
        { id: 'kurse',      label: 'Alle Kurse',        icon: 'candlestick-chart', alt: 'Markets' },
        { id: 'bewegung',   label: 'Gewinner und Verlierer', icon: 'arrow-up-down', alt: 'Movers' },
        { id: 'ausbrueche', label: 'Ausbrüche',         icon: 'rocket',           alt: 'Breakouts' },
        { id: 'heatmap',    label: 'Sektor-Heatmap',    icon: 'layout-grid',      alt: 'Heat Map' },
        { id: 'stimmung',   label: 'Marktstimmung',     icon: 'gauge',            alt: 'Sentiment' },
        { id: 'onchain',    label: 'Onchain und News',  icon: 'link-2',           alt: 'Onchain & News' },
    ] },
    { group: 'Entdecken', items: [
        { id: 'narrative',  label: 'Narrative',         icon: 'layers',           alt: 'Narratives' },
        { id: 'chainscan',  label: 'Chain-Scan',        icon: 'scan-search',      alt: 'Narrativ Scan' },
        { id: 'gems',       label: 'Hidden Gems',       icon: 'gem',              alt: 'Hidden Gems' },
        { id: 'buzz',       label: 'Social Buzz',       icon: 'flame',            alt: 'Social Buzz' },
        { id: 'memecoins',  label: 'Memecoin-Radar',    icon: 'zap',              alt: 'Memecoin Hype' },
        { id: 'influencer', label: 'Influencer',        icon: 'megaphone',        alt: 'Cryptofluencer' },
        { id: 'finder',     label: 'Coin-Finder',       icon: 'sliders-horizontal', alt: 'Finder' },
    ] },
    { group: 'Trading', items: [
        { id: 'handelszeiten', label: 'Handelszeiten',  icon: 'clock',            alt: 'Killzones' },
        { id: 'rechner',    label: 'Positionsrechner',  icon: 'calculator',       alt: 'Calculator' },
        { id: 'tradecheck', label: 'Trade-Check',       icon: 'list-checks',      alt: 'Checklist' },
        { id: 'duell',      label: 'Coin-Duell',        icon: 'swords',           alt: 'Arena' },
        { id: 'bestenliste', label: 'Bestenliste',      icon: 'trophy',           alt: 'Ranking' },
    ] },
    { group: 'Wissen', items: [
        { id: 'playbook',   label: 'Playbook',          icon: 'book-open',        alt: 'Playbook' },
        { id: 'werkzeuge',  label: 'Werkzeuge',         icon: 'external-link',    alt: 'Links' },
    ] },
];
export const READY = new Set(['ausbrueche', 'bestenliste', 'bewegung', 'buzz', 'chainscan', 'cockpit', 'duell', 'finder', 'gems', 'handelszeiten', 'heatmap', 'influencer', 'kurse', 'memecoins', 'narrative', 'onchain', 'playbook', 'portfolio', 'radar', 'rechner', 'signale', 'stimmung', 'tagebuch', 'tradecheck', 'watchlist', 'werkzeuge']);
export const ALL = NAV.flatMap(g => g.items.map(i => ({ ...i, group: g.group })));
