from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables globally
load_dotenv()

from services.yahoo_service import get_stock_info, compare_stocks, get_stock_history, get_normalized_history, get_portfolio_history, validate_historical_price
from services.news_service import get_stock_news
from services.market_service import get_market_overview
from services.financial_service import get_financials
from services.transformer_service import predict_transformer
from services.ai_service import get_compare_explanation, get_portfolio_insights, get_market_intelligence  # Groq/xAI-powered AI functions
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Stock API Running"}

@app.get("/api/stock/{symbol}")
def stock(symbol: str):
    return get_stock_info(symbol)

@app.get("/api/stock/{symbol}/news")
def news(symbol: str):
    return get_stock_news(symbol)

@app.get("/api/stock/{symbol}/financials")
def financials(symbol: str):
    return get_financials(symbol)

@app.get("/api/stock/{symbol}/history")
def history(symbol: str, period: str = "1mo"):
    return get_stock_history(symbol, period)

@app.get("/api/stock/{symbol}/validate_price")
def validate_price(symbol: str, date: str, price: float):
    return validate_historical_price(symbol, date, price)

@app.get("/api/stock/{symbol}/predict")
def predict(symbol: str):
    # Uses the new Manual Transformer model
    return predict_transformer(symbol)

class IntelligenceRequest(BaseModel):
    price_context: List[float]
    news_summary: str
    metrics: Dict[str, Any]

@app.post("/api/stock/{symbol}/intelligence")
def intelligence(symbol: str, req: IntelligenceRequest):
    # Combined Transformer context + Groq reasoning
    return {"analysis": get_market_intelligence(symbol, req.price_context, req.news_summary, req.metrics)}

@app.get("/api/market/overview")
def market():
    return get_market_overview()

@app.get("/api/compare")
def compare(symbols: str = Query(...)):
    return compare_stocks(symbols.split(","))

@app.get("/api/compare/history")
def compare_history(symbols: str = Query(...), period: str = "6mo"):
    return get_normalized_history(symbols.split(","), period)

@app.get("/api/stock/{symbol}/sector")
def stock_sector(symbol: str):
    info = get_stock_info(symbol)
    return {"symbol": symbol, "sector": info.get("sector", "Unknown"), "industry": info.get("industry", "Unknown")}

class CompareExplainRequest(BaseModel):
    stock_a: Dict[str, Any]
    stock_b: Dict[str, Any]

@app.post("/api/ai/compare")
def ai_compare_explain(req: CompareExplainRequest):
    explanation = get_compare_explanation(req.stock_a, req.stock_b)
    return {"explanation": explanation}

class PortfolioAIRequest(BaseModel):
    holdings: List[Dict[str, Any]]
    totalCurrent: float
    totalInvested: float

@app.post("/api/ai/portfolio")
def ai_portfolio_insights(req: PortfolioAIRequest):
    insights = get_portfolio_insights(req.holdings, req.totalCurrent, req.totalInvested)
    return {"insights": insights}

class PortfolioHistoryRequest(BaseModel):
    holdings: List[Dict[str, Any]]
    period: str = "1mo"

@app.post("/api/portfolio/history")
def portfolio_history(req: PortfolioHistoryRequest):
    return get_portfolio_history(req.holdings, req.period)