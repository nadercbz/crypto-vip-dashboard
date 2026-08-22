# Crypto Biz Dashboard

Öffentliche Marktübersicht: Live-Kurse, Sektor-Rotation, Social Buzz, Hidden Gems und Marktstimmung.

**Live:** https://nadercbz.github.io/crypto-vip-dashboard/

## Was drin ist

- **Markt** — Top 500 nach Marktkapitalisierung, Kurse laufend live über die Binance-API
- **Movers** — stärkste Gewinner und Verlierer der letzten 24 Stunden
- **Sektoren** — Wochenperformance je Narrativ plus Chain-TVL von DefiLlama
- **Social Buzz** — Aufmerksamkeits-Ranking, bevor der Preis reagiert
- **Hidden Gems** — Coins mit Divergenz zwischen Fundamentaldaten und Bewertung
- **Stimmung** — Fear and Greed Index mit 90-Tage-Verlauf und Marktbreite

Jeder Coin lässt sich antippen: Detailansicht mit Candlestick-Chart (1H bis 1W),
Marktdaten, Float, FDV, Funding Rate und Open Interest.

Die Seite läuft ohne Server und lässt sich auf dem Handy zum Homescreen hinzufügen.

## Daten aktualisieren

Die Datendateien unter `data/` werden aus dem lokalen Agent Dashboard gebaut:

```bash
python3 build_public_site.py --deploy
```

Das Skript nimmt ausschließlich Marktdaten mit. Portfolio, Skripte, Telemetrie
und andere private Dateien bleiben lokal und sind durch eine Whitelist plus
einen Abbruch-Check im Build abgesichert.

## Quellen

CoinPaprika, CoinGecko, Binance, DefiLlama, alternative.me

Keine Finanzberatung. Alle Angaben ohne Gewähr.
