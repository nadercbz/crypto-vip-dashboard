"""
Daten-Update fuer die oeffentliche Seite, ausgefuehrt von GitHub Actions.

    python3 tools/update_data.py

Warum es dieses zweite Skript gibt: Der Lauf zu Hause baut die Seite komplett
neu, inklusive Markup aus dem Agent Dashboard. Hier geht es nur um die Zahlen.
Das Skript holt sie direkt bei den Quellen und schreibt ausschliesslich nach
data/. Damit bleibt die Seite aktuell, auch wenn der Rechner aus ist, und der
naechste lokale Lauf ueberschreibt sie wieder mit dem vollen Stand.

Ohne Fremdbibliotheken, damit der Lauf schnell startet und nichts kaputtgeht,
wenn ein Paket sich aendert.
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
TOP_N = 600

UA = "Mozilla/5.0 (compatible; CryptoBizDashboard/2.0; +https://nadercbz.github.io/crypto-vip-dashboard/)"


def get_json(url, timeout=45, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json",
                                               **(headers or {})})
    for versuch in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode())
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as e:
            if versuch == 2:
                print(f"    fehlgeschlagen: {url[:70]} ({e})")
                return None
            time.sleep(4 * (versuch + 1))
    return None


def read_const(fname, const):
    p = os.path.join(DATA, fname)
    if not os.path.exists(p):
        return None
    m = re.search(r"const %s = (.*?);\n" % const, open(p).read(), re.S)
    return json.loads(m.group(1)) if m else None


def write_const(fname, const, payload, extra_head=""):
    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, fname), "w") as f:
        f.write("// Auto-generiert von tools/update_data.py (GitHub Actions).\n")
        if extra_head:
            f.write(extra_head)
        f.write(f"const {const} = " + json.dumps(payload, separators=(",", ":")) + ";\n")
        f.write(f"if (typeof window !== 'undefined') window.{const} = {const};\n")


# ── Kurse ─────────────────────────────────────────────────────────────────────
def update_kurse():
    """CoinPaprika als Basis, Binance-Zuordnung aus dem bestehenden Stand
    uebernehmen. So bleiben Live-Charts und Perpetual-Kennzahlen erhalten,
    ohne dass wir die grosse exchangeInfo erneut laden muessen."""
    alt = read_const("crypto_data.js", "CRYPTO_DB") or []
    alt_by_sym = {c.get("symbol"): c for c in alt}

    tickers = get_json("https://api.coinpaprika.com/v1/tickers?limit=1000")
    if not isinstance(tickers, list) or len(tickers) < 300:
        print("  CoinPaprika lieferte nichts Brauchbares, Kurse bleiben stehen.")
        return False

    stables = {"usdt", "usdc", "dai", "busd", "tusd", "usdd", "usdp", "gusd", "frax",
               "lusd", "usde", "fdusd", "pyusd", "usdy", "usds", "usd0", "rlusd",
               "crvusd", "susd", "usdx", "susds", "susde", "syrupusdc", "buidl",
               "usdtb", "usdg", "usdo", "eurc", "eurs"}
    rows = []
    for t in tickers:
        sym = (t.get("symbol") or "").lower()
        usd = (t.get("quotes") or {}).get("USD") or {}
        if sym in stables or not usd.get("price"):
            continue
        vor = alt_by_sym.get(sym, {})
        rows.append({
            "id": vor.get("id") or (t.get("id") or "").split("-", 1)[-1],
            "name": t.get("name"), "symbol": sym,
            "image": vor.get("image") or f"https://static.coinpaprika.com/coin/{t.get('id')}/logo.png",
            "binance": vor.get("binance"), "binance_fut": vor.get("binance_fut"),
            "current_price": usd.get("price"),
            "market_cap": usd.get("market_cap"),
            "market_cap_rank": t.get("rank"),
            "total_volume": usd.get("volume_24h"),
            "price_change_percentage_24h": usd.get("percent_change_24h"),
            "price_change_percentage_7d_in_currency": usd.get("percent_change_7d"),
            # Paprika liefert diese beiden seit 2026 als Null. Der letzte
            # bekannte Wert ist besser als gar keiner.
            "price_change_percentage_30d": usd.get("percent_change_30d") or vor.get("price_change_percentage_30d"),
            "price_change_percentage_1y": usd.get("percent_change_1y") or vor.get("price_change_percentage_1y"),
            "total_supply": t.get("total_supply"), "max_supply": t.get("max_supply"),
            "ath": usd.get("ath_price"), "ath_change_percentage": usd.get("percent_from_price_ath"),
            "cat": vor.get("cat", "Other"), "cats": vor.get("cats", []),
            "subs": vor.get("subs", []),
        })
    rows.sort(key=lambda c: c.get("market_cap_rank") or 10**9)
    rows = rows[:TOP_N]
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    write_const("crypto_data.js", "CRYPTO_DB", rows,
                extra_head=f"const CRYPTO_DB_UPDATED = '{stamp}';\n"
                           f"const CRYPTO_DB_SOURCE = 'CoinPaprika (Cloud)';\n")
    print(f"  Kurse: {len(rows)} Coins")
    return True


# ── Extras ────────────────────────────────────────────────────────────────────
def update_extras():
    alt = read_const("extras_data.js", "EXTRAS_DATA") or {}
    neu = dict(alt)

    fng = get_json("https://api.alternative.me/fng/?limit=90")
    try:
        rows = [{"date": datetime.fromtimestamp(int(d["timestamp"]), tz=timezone.utc).strftime("%Y-%m-%d"),
                 "value": int(d["value"]), "label": d.get("value_classification", "")}
                for d in fng["data"]]
        rows.reverse()
        neu["fng_history"] = rows
        print(f"  Fear & Greed: {len(rows)} Tage, aktuell {rows[-1]['value']}")
    except Exception:
        print("  Fear & Greed nicht erreichbar")

    chains = get_json("https://api.llama.fi/v2/chains")
    if isinstance(chains, list):
        neu["chains_tvl"] = sorted(
            [{"name": c.get("name"), "tvl": c.get("tvl"),
              "symbol": (c.get("tokenSymbol") or "").lower() or None}
             for c in chains if c.get("tvl")], key=lambda x: -(x["tvl"] or 0))[:40]
        print(f"  Chain-TVL: {len(neu['chains_tvl'])} Chains")

    st = get_json("https://stablecoins.llama.fi/stablecoins?includePrices=false")
    try:
        assets = st["peggedAssets"]
        def circ(a, k):
            return (a.get(k) or {}).get("peggedUSD") or 0
        total = sum(circ(a, "circulating") for a in assets)
        neu["stables"] = {
            "total": total,
            "chg_7d": total - sum(circ(a, "circulatingPrevWeek") for a in assets),
            "chg_30d": total - sum(circ(a, "circulatingPrevMonth") for a in assets),
            "top": sorted([{"symbol": a.get("symbol"), "name": a.get("name"),
                            "mcap": circ(a, "circulating"),
                            "chg_7d": circ(a, "circulating") - circ(a, "circulatingPrevWeek")}
                           for a in assets], key=lambda x: -x["mcap"])[:8]}
        print(f"  Stablecoins: {total/1e9:.0f} Mrd $")
    except Exception:
        print("  Stablecoin-Daten nicht erreichbar")

    prem = get_json("https://fapi.binance.com/fapi/v1/premiumIndex")
    if isinstance(prem, list):
        f = {}
        for d in prem:
            s = d.get("symbol", "")
            if not s.endswith("USDT"):
                continue
            base = s[:-4].lower()
            if base.startswith("1000"):
                base = base[4:]
            try:
                f[base] = {"rate": float(d.get("lastFundingRate") or 0)}
            except (TypeError, ValueError):
                pass
        neu["funding"] = f
        print(f"  Funding: {len(f)} Perpetuals")

    g = get_json("https://api.coinpaprika.com/v1/global")
    if isinstance(g, dict) and g.get("market_cap_usd"):
        neu["global"] = {"total_mcap": g.get("market_cap_usd"),
                         "volume_24h": g.get("volume_24h_usd"),
                         "btc_dominance": g.get("bitcoin_dominance_percentage"),
                         "mcap_chg_24h": g.get("market_cap_change_24h")}
        print(f"  Global: {g['market_cap_usd']/1e12:.2f} Bio $")

    neu["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    write_const("extras_data.js", "EXTRAS_DATA", neu)


# ── Onchain und News ──────────────────────────────────────────────────────────
def update_onchain():
    alt = read_const("onchain_data.js", "ONCHAIN_DATA") or {}
    neu = dict(alt)
    net = {}
    fees = get_json("https://mempool.space/api/v1/fees/recommended")
    if fees:
        net["fees"] = {"fast": fees.get("fastestFee"), "halfhour": fees.get("halfHourFee"),
                       "hour": fees.get("hourFee"), "economy": fees.get("economyFee")}
    hr = get_json("https://mempool.space/api/v1/mining/hashrate/1m")
    if hr and hr.get("hashrates"):
        rates = [h["avgHashrate"] for h in hr["hashrates"] if h.get("avgHashrate")]
        if rates:
            net["hashrate"] = rates[-1]
            net["hashrate_chg_30d"] = (rates[-1] / rates[0] - 1) * 100 if rates[0] else None
    diff = get_json("https://mempool.space/api/v1/difficulty-adjustment")
    if diff:
        net["difficulty_adjustment"] = {"progress": diff.get("progressPercent"),
                                        "change": diff.get("difficultyChange"),
                                        "remaining_blocks": diff.get("remainingBlocks")}
    try:
        req = urllib.request.Request("https://mempool.space/api/blocks/tip/height",
                                     headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=25) as r:
            h = int(r.read().decode().strip())
        net["block_height"] = h
        nxt = ((h // 210000) + 1) * 210000
        net["halving"] = {"block": nxt, "blocks_left": nxt - h,
                          "days_left": round((nxt - h) * 10 / 60 / 24, 1)}
    except Exception:
        pass
    if net:
        neu["btc_network"] = net
        print(f"  BTC-Netzwerk: Block {net.get('block_height', '?')}")

    # News ueber die RSS-Feeds
    from xml.etree import ElementTree
    feeds = [("Cointelegraph", "https://cointelegraph.com/rss"),
             ("Decrypt", "https://decrypt.co/feed"),
             ("The Block", "https://www.theblock.co/rss.xml"),
             ("Bitcoin Magazine", "https://bitcoinmagazine.com/feed")]
    items = []
    for name, url in feeds:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=25) as r:
                root = ElementTree.fromstring(r.read())
        except Exception:
            continue
        for it in list(root.iter("item"))[:12]:
            def txt(tag):
                el = it.find(tag)
                raw = el.text if el is not None and el.text else ""
                raw = re.sub(r"<[^>]+>", "", raw)
                for a, b in (("&amp;", "&"), ("&quot;", '"'), ("&#39;", "'"),
                             ("&#8217;", "'"), ("&nbsp;", " ")):
                    raw = raw.replace(a, b)
                return re.sub(r"\s+", " ", raw).strip()
            pub, ts = txt("pubDate"), None
            for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S %Z"):
                try:
                    ts = int(datetime.strptime(pub, fmt).timestamp())
                    break
                except (ValueError, TypeError):
                    pass
            if txt("title"):
                items.append({"title": txt("title")[:200], "link": txt("link"),
                              "source": name, "ts": ts, "summary": txt("description")[:220]})
    if items:
        items.sort(key=lambda x: x["ts"] or 0, reverse=True)
        seen, uniq = set(), []
        for i in items:
            k = i["title"].lower()[:60]
            if k not in seen:
                seen.add(k)
                uniq.append(i)
        neu["news"] = uniq[:40]
        print(f"  News: {len(uniq)} Meldungen")

    neu["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    write_const("onchain_data.js", "ONCHAIN_DATA", neu)


def main():
    print(f"Cloud-Update {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    ok = update_kurse()
    update_extras()
    update_onchain()
    if not ok:
        print("Kurse konnten nicht aktualisiert werden.")
        sys.exit(1)
    print("Fertig.")


if __name__ == "__main__":
    main()
