# Crypto Biz Dashboard

Öffentliche Version des Crypto-Dashboards. Live-Kurse, Sektor-Rotation, Social Buzz,
Hidden Gems, Marktstimmung und Trading-Werkzeuge.

**Live:** https://nadercbz.github.io/crypto-vip-dashboard/

Auf dem Handy lässt sich die Seite über "Zum Home-Bildschirm" als App ablegen.

## Seiten

| Bereich | Inhalt |
|---|---|
| Perfect Portfolio | Mechanisch gefilterte Allokation aus dem Live-Universe |
| Markets | Alle Coins mit Preis, Momentum, Dominanz und Watchlist |
| Movers | Stärkste Gewinner und Verlierer |
| Finder | Screener mit freien Filtern |
| Narratives | Sektor-Rotation, welches Narrativ gerade führt |
| Heat Map | Der Markt als Kachelbild |
| Social Buzz | Aufmerksamkeits-Ranking, bevor der Preis reagiert |
| Hidden Gems | Divergenz zwischen Fundamentaldaten und Bewertung |
| Sentiment | Fear and Greed mit Verlauf |
| Ranking | Bestenliste aus den eigenen Arena-Duellen |
| Killzones | Handelszeiten nach Sessions, Berliner Zeit |
| Calculator | Positionsgröße und Risiko |
| Checklist | Checkliste vor dem Einstieg |
| Breakouts | Ausbruchskandidaten |
| Arena | Zwei Coins im direkten Vergleich |
| Playbook | Strategie-Wissen |
| Links | Sammlung nützlicher Quellen |

Jeder Coin lässt sich anklicken: Detailansicht mit Candlestick-Chart (1H bis 1W),
Marktdaten, Float, FDV, Funding Rate, Open Interest und Long/Short-Verhältnis.

## Wie die Seite entsteht

Sie wird nicht von Hand gepflegt, sondern aus dem lokalen Agent Dashboard gebaut:

```bash
python3 build_public_site.py --deploy
```

Das Skript schneidet Markup, CSS und JavaScript des Crypto-Dashboards heraus und
setzt daraus eine eigenständige Seite zusammen. Dadurch bleiben beide Versionen
automatisch im gleichen Stand. Der volle Tageslauf (`refresh_all.py`, morgens um
7:30) stößt den Build selbst an.

**Direkt bearbeiten bringt nichts:** `index.html` und `data/` werden bei jedem
Build überschrieben. Änderungen gehören ins Agent Dashboard oder in
`build_public_site.py`.

## Datenschutz

Nur Marktdaten gehen raus. Portfolio, Video-Skripte, Milestones, Telemetrie und
persönliche Notizen bleiben lokal, abgesichert durch eine Whitelist im Build und
einen Abbruch-Check, der das Veröffentlichen stoppt, sobald eine private Datei im
Zielordner auftaucht.

## Datenquellen

CoinPaprika, CoinGecko, Binance, DefiLlama, alternative.me

Kurse aktualisieren sich im Browser laufend über die Binance-API. Die übrigen
Daten stammen aus dem letzten Build.

Keine Finanzberatung. Alle Angaben ohne Gewähr.
