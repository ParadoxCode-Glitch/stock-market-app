import os
import json
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from services.news_service import get_stock_news
from groq import Groq

# Load environment variables
load_dotenv()

# Initialize Groq Client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Schemas for reference
class InsightSchema(BaseModel):
    icon: str = Field(description='One of exactly: "PieChart", "TrendingUp", "TrendingDown", "AlertTriangle", "Activity", "Shield", "Zap", "Search"')
    title: str = Field(description="A short, catchy title for the insight")
    body: str = Field(description="A 2-3 sentence analysis of this specific aspect of the portfolio")

class IntelliSchema(BaseModel):
    verdict: str = Field(description='A short 2-3 word executive verdict (e.g., "Bullish Momentum", "Value Trap", "Stagnant Quality")')
    technicals: str = Field(description="1-2 sentences on recent price action and technical stance")
    fundamentals: str = Field(description="1-2 sentences on quality metrics like ROE, PE, and Debt")
    catalysts: str = Field(description="1-2 sentences on news impact and external factors")
    risk_score: int = Field(description="A numerical risk rating from 1 (Safe) to 10 (Extremely Risky)")

def get_compare_explanation(stock_a: dict, stock_b: dict) -> str:
    """Uses Groq to explain the Quick Verdict between two stocks using full news context."""
    try:
        # Fetch deep news context for both stocks
        news_a = get_stock_news(stock_a.get('symbol'))
        news_b = get_stock_news(stock_b.get('symbol'))
        news_context_a = "\n".join([f"- {n['title']}: {n.get('full_text', n.get('summary'))}" for n in news_a[:3]])
        news_context_b = "\n".join([f"- {n['title']}: {n.get('full_text', n.get('summary'))}" for n in news_b[:3]])
        
        prompt = f"""
        You are an expert financial analyst. I am comparing two stocks in the exact same sector.
        
        Stock A: {stock_a.get('symbol')}
        PE: {stock_a.get('pe_ratio')}, ROE: {stock_a.get('roe')}%, Margin: {stock_a.get('profit_margin')}%
        Recent News Context for Stock A:
        {news_context_a}
        
        Stock B: {stock_b.get('symbol')}
        PE: {stock_b.get('pe_ratio')}, ROE: {stock_b.get('roe')}%, Margin: {stock_b.get('profit_margin')}%
        Recent News Context for Stock B:
        {news_context_b}
        
        Based on the provided news articles and side-by-side technicals, justify conclusively why one stock should be preferred over the other. Be objective, sound like a professional equity researcher. Do not give financial advice. Keep it to 3 highly insightful sentences, under 60 words total.
        """
        
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return completion.choices[0].message.content.replace('\n', ' ').strip()
    except Exception as e:
        print(f"Groq API error: {e}")
        return "Our AI analyst is currently unavailable to process this verdict. Please check the raw metrics above."

def get_portfolio_insights(holdings: list, total_current: float, total_invested: float) -> list:
    """Uses Groq to deeply analyze a portfolio and return structured custom cards using full context."""
    try:
        portfolio_summary = f"Total Invested: ₹{total_invested}, Total Current: ₹{total_current}.\n\nDetailed Holdings Breakdown:\n"
        for h in holdings:
            sym = h.get('symbol')
            news_data = get_stock_news(sym)
            news_context = "\n".join([f"- {n['title']}: {n.get('full_text', n.get('summary'))}" for n in news_data[:2]])
            portfolio_summary += f"\n--- {sym} ---\nCurrent Value: ₹{h.get('currentValue')}\nLatest News & Catalysts:\n{news_context}\n"
            
        prompt = f"""
        You are a highly intelligent robotic wealth manager analyzing a user's stock portfolio.
        
        Portfolio Details & Context:
        {portfolio_summary}
        
        Analyze their portfolio and return structured insights natively derived from the news. For your generated insights:
        1. Evaluate concentration risk (is one stock dominating?) and portfolio-wide diversification.
        2. Provide exact SELL or HOLD recommendations for specific stocks tailored directly to the recent controversies or catalysts found in their provided news text.
        3. Discuss broader market context affecting these holdings.
        
        You MUST output your final response strictly as a JSON object containing a single key "insights". This key must map to an array of objects.
        Each object in the array MUST have the following keys and data types:
        - "icon": string (MUST be one of exactly: "PieChart", "TrendingUp", "TrendingDown", "AlertTriangle", "Activity", "Shield", "Zap", "Search")
        - "title": string (A short, catchy title)
        - "body": string (A 2-3 sentence analysis)
        """
        
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        raw_text = completion.choices[0].message.content.strip()
        data = json.loads(raw_text)
        if "insights" in data and isinstance(data["insights"], list):
            return data["insights"]
        return []
    except Exception as e:
        print(f"Groq API error (portfolio): {e}")
        return [{
            "icon": "AlertTriangle",
            "title": "AI Offline",
            "body": "We couldn't generate your personalized AI portfolio insights right now.",
        }]

def get_market_intelligence(symbol: str, price_context: list, news_summary: str, metrics: dict) -> dict:
    """Synthesizes all current data into a structured professional analyst report using full context RAG via Groq."""
    import traceback
    try:
        # Robust sanitization
        clean_prices = [p for p in price_context if p is not None and isinstance(p, (int, float))]
        avg_30d = sum(clean_prices) / len(clean_prices) if clean_prices else 0
        trend_30d = "Neutral"
        if len(clean_prices) > 1:
            trend_30d = "Rising" if clean_prices[-1] > clean_prices[0] else "Falling"
        
        # Inject full raw text from news_service to replace the naive summary
        full_news_data = get_stock_news(symbol)
        mega_news_context = "\n\n".join([f"Headline: {n['title']}\nContent: {n.get('full_text', n.get('summary'))}" for n in full_news_data])
        
        prompt = f"""
        You are a senior equity researcher. Analyze {symbol}.
        
        Market Context & Fundamentals:
        - Price Trend: {trend_30d} (30-day Avg: ₹{avg_30d:.2f})
        - Fundamentals: PE={metrics.get('pe_ratio')}, PB={metrics.get('pb_ratio')}, ROE={metrics.get('roe')}%, Debt/Equity={metrics.get('debt_equity')}, Yield={metrics.get('dividend_yield')}%
        
        Here is the complete raw text of all recent news articles regarding {symbol}:
        {mega_news_context if mega_news_context else "No recent news coverage available."}
        
        Note: If fundamentals are missing (None), interpret the stock as likely speculative, high-risk or a turnaround play.
        Task: Synthesize a master net summary and verdict. 
        
        You MUST output your entire response precisely as a JSON object matching this schema exactly:
        {{
            "verdict": "A short 2-3 word executive verdict (e.g., Bullish Momentum, Value Trap)",
            "technicals": "1-2 sentences on recent price action and technical stance",
            "fundamentals": "1-2 sentences on quality metrics",
            "catalysts": "1-2 sentences on news impact from the context provided",
            "risk_score": integer (1 to 10 rating from Safe to Extremely Risky)
        }}
        """
        
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        raw_text = completion.choices[0].message.content.strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"Groq API error (market intelligence): {str(e)}")
        return {
            "verdict": "Data Inconclusive",
            "technicals": f"Neural reasoning failed for {symbol}. Technical signals are conflicting.",
            "fundamentals": "Unable to derive accurate fundamental verdict at this time.",
            "catalysts": "External catalyst evaluation pending deeper indexing.",
            "risk_score": 5
        }
        
