import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Single download of the VADER lexicon
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

class FinancialSentimentEngine:
    def __init__(self):
        self.sia = SentimentIntensityAnalyzer()
        
        # Financial Lexicon Extensions
        # These override generic VADER sensitivities with market-specific weightings
        market_lexicon = {
            'slip': -2.5,
            'fall': -2.5,
            'drop': -2.5,
            'miss': -3.0,
            'misses': -3.0,
            'probe': -4.0,
            'investigat': -3.5,
            'asset attach': -5.0,
            'court': -2.0,
            'regulatory': -2.0,
            'ed attach': -5.0,
            'loss': -3.0,
            'crash': -4.0,
            'default': -5.0,
            'bankrupt': -5.0,
            'bankruptcy': -5.0,
            'negative': -2.5,
            'jump': 3.0,
            'surge': 3.5,
            'gain': 2.5,
            'beat': 3.5,
            'beats': 3.5,
            'growth': 2.5,
            'acquisition': 3.0,
            'merger': 2.0,
            'debt reduced': 4.0,
            'dividend': 2.0,
            'order win': 3.5,
            'contract win': 3.5,
            'positive': 2.5,
            'bullish': 3.0,
            'buy': 2.0,
            'strong buy': 4.0,
        }
        self.sia.lexicon.update(market_lexicon)

    def analyze(self, text: str) -> str:
        if not text or len(text.strip()) < 3:
            return "Neutral"
            
        text_lower = text.lower()
        score = self.sia.polarity_scores(text_lower)['compound']
        
        # Thresholds tailored for high-conviction market signals
        if score >= 0.1:
            return "Positive"
        elif score <= -0.1:
            return "Negative"
        else:
            return "Neutral"

# Global instance for thread-safe access
engine = FinancialSentimentEngine()

def analyze_sentiment(text: str) -> str:
    """Uses Local High-Performance NLP for news sentiment (Deterministic & Fast)."""
    try:
        return engine.analyze(text)
    except Exception as e:
        print(f"Local NLP error: {str(e)}")
        # Simple string matching fallback if NLTK fails
        lower = text.lower()
        neg = ["slip", "fall", "drop", "probe", "attach", "loss", "miss", "negative"]
        pos = ["jump", "gain", "surge", "beat", "positive", "growth", "win"]
        if any(t in lower for t in neg): return "Negative"
        if any(t in lower for t in pos): return "Positive"
        return "Neutral"
