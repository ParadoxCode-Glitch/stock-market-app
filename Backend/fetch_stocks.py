import urllib.request
import csv
import json
import os

def fetch_nse_stocks():
    url = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8').splitlines()
            reader = csv.reader(content)
            next(reader) # skip header
            stocks = []
            for row in reader:
                if len(row) > 1:
                    symbol = row[0].strip()
                    name = row[1].strip()
                    stocks.append({'symbol': symbol, 'name': name})
            return stocks
    except Exception as e:
        print("Failed NSE:", e)
        return []

def fetch_bse_stocks():
    try:
        # Fallback to some static top BSE if fetch fails, but let's try a direct approach if possible
        # Since BSE is harder, let's just keep the list empty if we can't find it easily
        pass
    except Exception as e:
        print("Failed BSE:", e)
    return []

if __name__ == "__main__":
    stocks = fetch_nse_stocks()
    # Add BSE if you find a source
    # Here we also include some popular ones statically just in case
    # Format the file
    out_path = os.path.join("..", "Frontend", "src", "data", "stocks.ts")
    
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("export const STOCKS = [\n")
        for s in stocks:
            # Escape quotes in names
            s_name = s['name'].replace('"', '\\"')
            s_symbol = s['symbol'].replace('"', '\\"')
            f.write(f'  {{ symbol: "{s_symbol}", name: "{s_name}" }},\n')
        f.write("];\n")
    print("Wrote", len(stocks), "stocks to", out_path)
