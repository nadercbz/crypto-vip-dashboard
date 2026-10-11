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

## Automatischer Betrieb

Zwei Wege halten die Seite frisch, unabhängig voneinander:

| Wer | Wann | Was |
|---|---|---|
| Rechner zu Hause | 7:30 voll, 12:30 / 17:30 / 21:30 schnell | Kompletter Neubau aus dem Agent Dashboard |
| GitHub Actions | 6:15 / 11:15 / 16:15 / 20:15 UTC | Nur die Zahlen, direkt aus der Cloud |

Der Cloud-Lauf (`.github/workflows/daten-update.yml`) ruft `tools/update_data.py`
auf und schreibt ausschließlich nach `data/`. Läuft der Rechner also nicht,
bleiben die Kurse trotzdem aktuell. Der nächste lokale Lauf überschreibt alles
wieder mit dem vollen Stand inklusive Signal-Engine und Briefing.

Kurse aktualisieren sich zusätzlich im Browser selbst, per WebSocket-Stream
direkt von Binance. Dafür ist kein Lauf nötig.

## Zum Homescreen hinzufügen

Die Seite ist eine installierbare Web-App mit Offline-Speicher. Auf dem iPhone
über Teilen und "Zum Home-Bildschirm", auf Android über das Menü und "App
installieren". Ohne Verbindung zeigt sie den zuletzt geladenen Stand statt
einer Fehlerseite.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Die Seite, wird komplett generiert |
| `data/*.js` | Marktdaten, ebenfalls generiert |
| `sw.js` | Service Worker für den Offline-Betrieb |
| `manifest.webmanifest`, `icon.png` | App-Installation |
| `social-card.png` | Vorschaubild beim Teilen |
| `qr-code.png` | QR-Code auf diese Seite, für Videos |
| `tools/update_data.py` | Datenaktualisierung in der Cloud |
