# Indian Stock Market Analysis

A full-stack web application for exploring Indian equities, reviewing market information, comparing companies, and tracking a personal portfolio. The project combines a React and TypeScript interface with a FastAPI backend.

## Features

- **Equity catalogue:** Search a committed catalogue containing 2,278 NSE equity symbols and company names.
- **Market and stock information:** Retrieve current quote fields, company information, financial data, and historical price series through Yahoo Finance data access.
- **Charts and comparisons:** View price history and compare multiple symbols using financial and market metrics.
- **Portfolio tracking:** Record holdings and review portfolio value, allocation, history, and related insights.
- **News and sentiment:** Retrieve stock-related news and calculate sentiment signals.
- **AI-assisted analysis:** Backend endpoints provide market intelligence, portfolio insights, and explanations for stock comparisons.
- **Transformer forecast prototype:** A PyTorch time-series Transformer is trained on recent historical closing prices at request time to produce a five-session forecast.

Forecasts and generated insights are experimental software outputs, not investment advice or guarantees of future performance.

## Technology

**Frontend**
- React 18, TypeScript, and Vite
- Tailwind CSS
- Chart.js and react-chartjs-2
- Framer Motion
- React Router

**Backend**
- Python and FastAPI
- yfinance, pandas, and NumPy
- PyTorch and scikit-learn
- News and sentiment processing utilities
- Groq integration for language-model-assisted analysis

## Repository structure

    Backend/
      main.py
      fetch_stocks.py
      services/
        yahoo_service.py
        market_service.py
        financial_service.py
        news_service.py
        sentiment_service.py
        transformer_service.py
        ai_service.py
    Frontend/
      src/
        components/
        data/stocks.ts
        pages/
        services/api.ts

## Requirements

- Python and pip
- Node.js and npm
- API credentials for the external AI service used by the backend

## Setup

Clone the repository:

    git clone https://github.com/ParadoxCode-Glitch/stock-market-app.git
    cd stock-market-app

### Backend

    cd Backend
    python -m venv .venv

Activate the environment:

    # macOS / Linux
    source .venv/bin/activate

    # Windows PowerShell
    .venv\Scripts\Activate.ps1

Install the backend dependencies:

    pip install -r requirements.txt

Create a `.env` file in the `Backend` directory and add the credentials required by the AI service configuration in `Backend/services/ai_service.py`. Do not commit API keys.

Start the API:

    uvicorn main:app --reload

The FastAPI service runs locally on port 8000 by default. Its root endpoint is `/`.

### Frontend

In a second terminal:

    cd Frontend
    npm install
    npm run dev

Vite prints the local development URL when the frontend starts.

## Stock catalogue

The frontend catalogue is stored in `Frontend/src/data/stocks.ts`. The repository also includes `Backend/fetch_stocks.py`, which retrieves the NSE equity list and can regenerate the catalogue.

## Forecasting implementation

The Transformer service:
- Retrieves up to one year of historical closing prices.
- Uses a 30-session input window.
- Trains a small Transformer model for 50 epochs during the request.
- Produces a five-session forecast.

The repository does not provide a documented held-out evaluation or verified prediction-accuracy score. Forecast output should therefore be understood as a prototype feature, not a validated trading signal.

## Disclaimer

This project is for educational and informational use. Market data may be delayed, incomplete, or unavailable, and model-generated analysis can be wrong. It is not financial, investment, or trading advice.

## License

No license file is currently included. Contact the repository owner before reusing or redistributing this project.
