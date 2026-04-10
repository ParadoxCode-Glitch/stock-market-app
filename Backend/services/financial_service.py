import yfinance as yf
from services.cache_service import get_cache, set_cache

def get_financials(symbol: str):
    cache_key = f"financials_{symbol}"
    cached = get_cache(cache_key)
    if cached:
        return cached

    ticker = yf.Ticker(f"{symbol}.NS")

    try:
        financials = ticker.quarterly_financials
        result = []

        for col in financials.columns[:4]:
            revenue = financials.loc["Total Revenue"].get(col, None)
            profit = financials.loc["Net Income"].get(col, None)

            result.append({
                "date": str(col.date()),
                "revenue": revenue,
                "profit": profit
            })
    except:
        result = []

    set_cache(cache_key, result, 300)
    return result