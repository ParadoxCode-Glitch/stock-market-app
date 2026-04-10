import yfinance as yf
from services.cache_service import get_cache, set_cache

def get_stock_info(symbol: str):
    cache_key = f"stock_{symbol}"
    cached = get_cache(cache_key)
    if cached:
        return cached

    ticker = yf.Ticker(f"{symbol}.NS")
    info = ticker.info

    current_price = info.get("currentPrice")
    previous_close = info.get("previousClose")

    day_change = None
    day_change_percent = None
    if current_price is not None and previous_close is not None:
        day_change = round(current_price - previous_close, 2)
        day_change_percent = round((day_change / previous_close) * 100, 2)

    result = {
        "symbol": symbol,
        "name": info.get("longName"),
        "price": current_price,
        "previous_close": previous_close,
        "day_change": day_change,
        "day_change_percent": day_change_percent,
        "pe_ratio": round(info.get("trailingPE"), 2) if info.get("trailingPE") else None,
        "forward_pe": round(info.get("forwardPE"), 2) if info.get("forwardPE") else None,
        "market_cap": info.get("marketCap"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
        "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
        "pb_ratio": round(info.get("priceToBook"), 2) if info.get("priceToBook") else None,
        "dividend_yield": round(info.get("dividendYield", 0) * 100, 2) if info.get("dividendYield") else None,
        "beta": round(info.get("beta"), 2) if info.get("beta") else None,
        "eps": round(info.get("trailingEps"), 2) if info.get("trailingEps") else None,
        "roe": round(info.get("returnOnEquity", 0) * 100, 2) if info.get("returnOnEquity") else None,
        "debt_equity": round(info.get("debtToEquity"), 2) if info.get("debtToEquity") else None,
        "profit_margin": round(info.get("profitMargins", 0) * 100, 2) if info.get("profitMargins") else None,
        "enterprise_value": info.get("enterpriseValue"),
        "dividend_rate": info.get("dividendRate"),
    }

    set_cache(cache_key, result, 30)
    return result


def get_stock_history(symbol: str, period: str = "1mo"):
    cache_key = f"history_{symbol}_{period}"
    cached = get_cache(cache_key)
    if cached:
        return cached

    ticker = yf.Ticker(f"{symbol}.NS")
    hist = ticker.history(period=period)
    
    # Format for chart (labels and values) - Filter out NaNs
    clean_hist = hist["Close"].dropna()
    result = {
        "labels": [d.strftime("%b %d, %Y") for d in clean_hist.index],
        "values": [round(float(v), 2) for v in clean_hist.values]
    }

    set_cache(cache_key, result, 300) # Cache for 5 mins
    return result


def compare_stocks(symbols: list):
    results = []

    for symbol in symbols:
        ticker = yf.Ticker(f"{symbol}.NS")
        info = ticker.info

        # Extracted metrics
        pe_ratio = info.get("trailingPE")
        pb_ratio = info.get("priceToBook")
        roe = info.get("returnOnEquity")
        div_yield = info.get("dividendYield", 0)
        nim = info.get("profitMargins") # proxy
        
        analyst_sentiment = info.get("recommendationKey", "N/A")
        beta = info.get("beta")
        target_price = info.get("targetMeanPrice")
        ev_ebitda = info.get("enterpriseToEbitda")

        results.append({
            "symbol": symbol,
            "price": info.get("currentPrice"),
            "pe_ratio": round(pe_ratio, 2) if pe_ratio else None,
            "market_cap": info.get("marketCap"),
            "sector": info.get("sector", "Unknown"),
            "industry": info.get("industry", "Unknown"),
            "pb_ratio": round(pb_ratio, 2) if pb_ratio else None,
            "roe": round(roe * 100, 2) if roe else None,
            "dividend_yield": round(div_yield * 100, 2) if div_yield else None,
            "profit_margin": round(nim * 100, 2) if nim else None,
            "analyst_sentiment": analyst_sentiment.replace("_", " ").title() if analyst_sentiment != "N/A" else None,
            "beta": round(beta, 2) if beta is not None else None,
            "target_price": round(target_price, 2) if target_price is not None else None,
            "ev_ebitda": round(ev_ebitda, 2) if ev_ebitda else None,
        })

    return results

def get_normalized_history(symbols: list, period: str = "6mo"):
    import pandas as pd
    combined_data = {}
    
    for symbol in symbols:
        ticker = yf.Ticker(f"{symbol}.NS")
        hist = ticker.history(period=period)
        if hist.empty:
            continue
        hist['Normalized'] = (hist['Close'] / hist['Close'].iloc[0]) * 100
        combined_data[symbol] = hist['Normalized']
        
    if not combined_data:
        return {"labels": [], "datasets": []}
        
    df = pd.DataFrame(combined_data).dropna()
    
    labels = [d.strftime("%Y-%m-%d") for d in df.index]
    
    datasets = []
    for symbol in symbols:
        if symbol in df.columns:
            datasets.append({
                "symbol": symbol,
                "values": [round(val, 2) for val in df[symbol].values]
            })
            
    return {"labels": labels, "datasets": datasets}

def get_portfolio_history(holdings: list, period: str = "1mo"):
    import pandas as pd
    
    # Sort for stable caching
    holdings = sorted(holdings, key=lambda i: i['symbol'])
    cache_key = f"port_hist_{hash(frozenset([(h['symbol'], h['quantity']) for h in holdings]))}_{period}"
    cached = get_cache(cache_key)
    if cached:
        return cached

    if not holdings:
        return {"labels": [], "values": []}

    tickers_list = [f"{h['symbol']}.NS" for h in holdings]
    data = yf.download(tickers_list, period=period, progress=False)

    if data.empty or "Close" not in data.columns:
        return {"labels": [], "values": []}
        
    total_val = pd.Series(0.0, index=data.index)
    
    if len(holdings) == 1:
        qty = holdings[0]['quantity']
        # Single ticker does not return multi-index column
        if type(data['Close']) == pd.Series:
             total_val = data['Close'].ffill().fillna(0) * qty
        else:
             total_val = data['Close'][tickers_list[0]].ffill().fillna(0) * qty
    else:
        close_prices = data['Close'].ffill().fillna(0)
        for h in holdings:
            ns_sym = f"{h['symbol']}.NS"
            if ns_sym in close_prices.columns:
                total_val += close_prices[ns_sym] * h['quantity']
                
    labels = [d.strftime("%b %d") for d in total_val.index]
    values = [round(float(v), 2) for v in total_val.values]

    result = {"labels": labels, "values": values}
    set_cache(cache_key, result, 120) # Cache for 2 mins
    return result

def validate_historical_price(symbol: str, date: str, price: float):
    cache_key = f"val_price_{symbol}_{date}"
    cached = get_cache(cache_key)
    if cached:
        return cached

    import yfinance as yf
    import datetime
    try:
        target_date = datetime.datetime.strptime(date, "%Y-%m-%d")
        end_date = target_date + datetime.timedelta(days=7)
        ticker = yf.Ticker(f"{symbol}.NS")
        hist = ticker.history(start=target_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"))
        
        if hist.empty:
            result = {"valid": True, "message": "No historical data found"}
        else:
            low = float(hist.iloc[0]["Low"])
            high = float(hist.iloc[0]["High"])
            actual_date = hist.index[0].strftime("%Y-%m-%d")
            
            # Allow 5% margin
            if price < (low * 0.95) or price > (high * 1.05):
                result = {
                    "valid": False, 
                    "message": f"Price ₹{price} is outside the {actual_date} range (₹{low:.2f} - ₹{high:.2f})."
                }
            else:
                result = {"valid": True}
    except Exception as e:
        result = {"valid": True, "message": f"Validation skipped"}
        
    set_cache(cache_key, result, 86400)
    return result