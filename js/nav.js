export const NAV = [
    { group: 'Heute', items: [
        { id: 'cockpit', label: 'Cockpit', icon: 'layout-dashboard', alt: 'Überblick', info: 'Dein Startbildschirm. Die wichtigsten Zahlen und Karten des Tages auf einen Blick, ohne zu suchen.' },
        { id: 'tagebuch', label: 'Analyse-Tagebuch', icon: 'notebook-pen', alt: 'Tagebuch', info: 'Analysen mit Datum. Später wird geprüft, ob sie recht hatten.' },
    ] },
    { group: 'Signale', items: [
        { id: 'kaufsignale', label: 'Kaufsignale', icon: 'target', alt: 'neu in 2.0', info: 'Die 10 besten Coins je Größe (klein, mittel, groß) mit Punkten von 0 bis 100. Zeigt auch, wann man besser nicht kauft.' },
        { id: 'radar', label: 'Signal-Radar', icon: 'radar', alt: 'Radar', info: 'Eine Rangliste aller Coins mit einer Gesamtnote aus Trend, Schwung und Risiko. Zum schnellen Überblick.' },
        { id: 'signale', label: 'Tages-Signale', icon: 'crosshair', alt: 'neu in 2.0', info: 'Tägliche Memecoin-Vorschläge auf Solana und Base. Jeder Vorschlag wird vorher auf Betrug geprüft.' },
        { id: 'gems', label: 'Hidden Gems', icon: 'gem', alt: 'Hidden Gems', info: 'Verborgene Schätze: Projekte, die mehr leisten, als ihr Kurs zeigt. Das Gegenteil von Hype.' },
        { id: 'ausbrueche', label: 'Ausbrüche', icon: 'rocket', alt: 'Breakouts', info: 'Coins, die gerade aus ihrer Ruhe ausbrechen, zum Beispiel mit starkem Volumen oder Kurssprung.' },
        { id: 'memecoins', label: 'Memecoin-Radar', icon: 'zap', alt: 'Memecoin Hype', info: 'Wo Memecoins gerade heiß laufen und wie riskant das ist.' },
    ] },
    { group: 'Stimmung', items: [
        { id: 'herdenradar', label: 'Fade the Herd', icon: 'users', alt: 'neu in 2.0', info: 'Zeigt, was die großen Influencer und der Markt denken. Sind alle gierig, wird gewarnt. Haben alle Angst, wird es interessant.' },
        { id: 'stimmung', label: 'Marktstimmung', icon: 'gauge', alt: 'Sentiment', info: 'Angst und Gier, Positionierung und weitere Stimmungswerte des Marktes.' },
        { id: 'buzz', label: 'Social Buzz', icon: 'flame', alt: 'Social Buzz', info: 'Worüber im Netz gerade am meisten gesprochen wird. Viel Gerede kann Hype bedeuten.' },
        { id: 'influencer', label: 'Influencer', icon: 'megaphone', alt: 'Cryptofluencer', info: 'Über welche Coins große Krypto-YouTuber reden und wer dasselbe sagt.' },
        { id: 'gehasst', label: 'Meistgehasst', icon: 'thumbs-down', alt: 'neu in 2.0', info: 'Projekte, die gerade fast alle schlechtreden. Manchmal liegt dort eine Chance, oft ein echtes Problem.' },
    ] },
    { group: 'Markt', items: [
        { id: 'kurse', label: 'Alle Kurse', icon: 'candlestick-chart', alt: 'Markets', info: 'Alle Coins mit Preis und Veränderung. Sortieren und suchen.' },
        { id: 'bewegung', label: 'Gewinner und Verlierer', icon: 'arrow-up-down', alt: 'Movers', info: 'Wer heute am meisten steigt und wer am meisten fällt.' },
        { id: 'heatmap', label: 'Sektor-Heatmap', icon: 'layout-grid', alt: 'Heat Map', info: 'Eine Farbkarte der Bereiche (zum Beispiel KI oder DeFi). Grün heißt, Geld fließt hinein. Rot heißt, es fließt raus.' },
        { id: 'onchain', label: 'Onchain und News', icon: 'link-2', alt: 'Onchain & News', info: 'Daten direkt aus den Netzwerken und aktuelle Krypto-Nachrichten.' },
    ] },
    { group: 'Entdecken', items: [
        { id: 'narrative', label: 'Narrative', icon: 'layers', alt: 'Narratives', info: 'Welche Themen gerade Geld anziehen und welche abkühlen.' },
        { id: 'chainscan', label: 'Chain-Scan', icon: 'scan-search', alt: 'Narrativ Scan', info: 'Vergleicht Blockchains: Wo startet gerade etwas und welche Projekte sind dort am größten.' },
        { id: 'icoipo', label: 'ICOs und IPOs', icon: 'ticket', alt: 'neu in 2.0', info: 'Neue Börsengänge und Token-Verkäufe, die bevorstehen oder gerade laufen, mit Terminen.' },
        { id: 'media', label: 'Media', icon: 'youtube', alt: 'neu in 2.0', info: 'Neue, noch kleine Krypto-YouTuber (100 bis 5.000 Abonnenten), Deutsch und Englisch, jeden Tag frisch gesucht.' },
        { id: 'symbolik', label: 'Symbolik', icon: 'sparkles', alt: 'neu in 2.0', info: 'Die Top 5000 Coins nach der Bildsprache ihrer Logos: Tiere, Farben, Formen, Elemente. Mit Deutung aus der Mystic-Datenbank.' },
        { id: 'finder', label: 'Coin-Finder', icon: 'sliders-horizontal', alt: 'Finder', info: 'Fünf Regler einstellen, und der Finder zeigt dir passende Coins.' },
    ] },
    { group: 'Portfolio', items: [
        { id: 'portfolio', label: window.CB2_PUBLIC ? 'Regel-Portfolio' : 'My Portfolio', icon: window.CB2_PUBLIC ? 'pie-chart' : 'wallet', alt: 'Perfect Portfolio', info: 'Dein Portfolio mit Wert und Verlauf. In der öffentlichen Ansicht ein Beispiel-Portfolio nach festen Regeln.' },
        { id: 'watchlist', label: 'Watchlist', icon: 'star', alt: 'Watchlist', info: 'Coins, die du mit dem Stern markiert hast, mit Preis und Kaufbereich.' },
    ] },
    { group: 'Trading', items: [
        { id: 'handelszeiten', label: 'Handelszeiten', icon: 'clock', alt: 'Killzones', info: 'Wann die großen Märkte (Asien, Europa, USA) aktiv sind. Dann bewegen sich die Kurse meist am stärksten.' },
        { id: 'rechner', label: 'Positionsrechner', icon: 'calculator', alt: 'Calculator', info: 'Rechnet aus, wie viel du kaufen darfst, wenn du nur einen festen Betrag riskieren willst.' },
        { id: 'tradecheck', label: 'Trade-Check', icon: 'list-checks', alt: 'Checklist', info: 'Eine Checkliste vor jedem Kauf. Sie bremst Bauchentscheidungen.' },
        { id: 'duell', label: 'Coin-Duell', icon: 'swords', alt: 'Arena', info: 'Zwei Coins, ein Gewinner. Training für dein Gefühl, ohne echtes Geld.' },
        { id: 'bestenliste', label: 'Bestenliste', icon: 'trophy', alt: 'Ranking', info: 'Ranglisten der stärksten Coins und der besten Calls, die gemessen wurden.' },
    ] },
    { group: 'Wissen', items: [
        { id: 'labor', label: 'Signal-Labor', icon: 'flask-conical', alt: 'neu in 2.0', info: 'Misst, welche Bausteine der Signale wirklich etwas vorhersagen und welche nur Deko sind.' },
        { id: 'playbook', label: 'Playbook', icon: 'book-open', alt: 'Playbook', info: 'Das Regelbuch mit Strategien, Setups und Wissen zum Nachschlagen.' },
        { id: 'werkzeuge', label: 'Werkzeuge', icon: 'external-link', alt: 'Links', info: 'Nützliche externe Tools und Webseiten als Link-Sammlung.' },
    ] },
];
export const READY = new Set(['ausbrueche', 'bestenliste', 'bewegung', 'buzz', 'chainscan', 'cockpit', 'duell', 'finder', 'gehasst', 'gems', 'handelszeiten', 'heatmap', 'herdenradar', 'icoipo', 'influencer', 'kaufsignale', 'kurse', 'labor', 'media', 'memecoins', 'narrative', 'onchain', 'playbook', 'portfolio', 'radar', 'rechner', 'signale', 'stimmung', 'symbolik', 'tagebuch', 'tradecheck', 'watchlist', 'werkzeuge']);
export const ALL = NAV.flatMap(g => g.items.map(i => ({ ...i, group: g.group })));
