import yfinance as yf
from newspaper import Article
from services.sentiment_service import analyze_sentiment
from services.cache_service import get_cache, set_cache

def process_article(url, title):
    try:
        article = Article(url)
        article.download()
        article.parse()
        article.nlp()

        summary = article.summary[:300] if article.summary else f"Summary unavailable. Read full article: {title}"
        full_text = article.text if article.text else summary
        return summary, full_text
    except:
        return f"Summary unavailable. Read full article: {title}", f"Full text unavailable. Read full article: {title}"

def get_stock_news(symbol: str):
    cache_key = f"news_{symbol}"
    cached = get_cache(cache_key)
    if cached:
        return cached

    results = []

    import urllib.request
    import urllib.parse
    import xml.etree.ElementTree as ET

    try:
        query = urllib.parse.quote(f"{symbol} stock share market")
        rss_url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
        req = urllib.request.Request(rss_url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, timeout=10)
        root = ET.fromstring(response.read())

        for item in root.findall('.//item')[:5]:
            title_node = item.find('title')
            link_node = item.find('link')
            pubDate_node = item.find('pubDate')
            title = title_node.text if title_node is not None else ""
            link = link_node.text if link_node is not None else ""
            pubDate = pubDate_node.text if pubDate_node is not None else ""

            summary, full_text = process_article(link, title)
            sentiment = analyze_sentiment(f"{title}. {summary}")

            results.append({
                "title": title,
                "summary": summary,
                "full_text": full_text,
                "sentiment": sentiment,
                "url": link,
                "date": pubDate
            })
    except Exception as e:
        print(f"Error fetching news for {symbol}: {e}")

    set_cache(cache_key, results, 300)
    return results