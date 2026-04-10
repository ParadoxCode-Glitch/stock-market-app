import yfinance as yf
from services.cache_service import get_cache, set_cache

INDICES = {
    "NIFTY 50": "^NSEI",
    "SENSEX": "^BSESN"
}

STOCKS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS",
    "HDFCBANK.NS", "ICICIBANK.NS",
    "SBIN.NS", "ITC.NS", "LT.NS"
]

def get_market_overview():
    cache_key = "market"
    cached = get_cache(cache_key)
    if cached:
        return cached

    result = {"indices": [], "top_gainers": [], "top_losers": []}

    for name, symbol in INDICES.items():
        data = yf.Ticker(symbol).history(period="1d")

        if not data.empty:
            close = data["Close"].iloc[-1]
            open_price = data["Open"].iloc[-1]
            percent = ((close - open_price) / open_price) * 100

            result["indices"].append({
                "name": name,
                "price": round(close, 2),
                "percent": round(percent, 2)
            })

    movers = []
    for stock in STOCKS:
        data = yf.Ticker(stock).history(period="1d")

        if not data.empty:
            close = data["Close"].iloc[-1]
            open_price = data["Open"].iloc[-1]
            percent = ((close - open_price) / open_price) * 100

            movers.append({
                "symbol": stock.replace(".NS", ""),
                "price": round(close, 2),
                "percent": round(percent, 2)
            })

    movers.sort(key=lambda x: x["percent"], reverse=True)

    result["top_gainers"] = movers[:3]
    result["top_losers"] = movers[-3:]

    set_cache(cache_key, result, 60)
    return result