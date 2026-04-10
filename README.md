# Stock Market Analysis App 📈

A modern full-stack application for tracking the Indian stock market, powered by **Groq/xAI** for deep financial sentiment and portfolio insights, and a **Transformer-based model** for price prediction.

## 🚀 Features

- **Real-time Market Data:** Fetches live data for Indian stocks via Yahoo Finance API.
- **AI-Powered Insights:** Uses Llama 3 (via Groq) to analyze news sentiment and provide portfolio strategy recommendations.
- **Deep Price Prediction:** Incorporates a custom Transformer model (`transformer_service.py`) for predicting price movements.
- **Interactive Charts:** High-performance visualizations using Chart.js.
- **Portfolio Management:** Track holdings, analyze sector allocation, and view performance metrics.
- **Stock Comparison:** Side-by-side comparison of fundamentals and technicals with AI-generated verdicts.

## 🛠️ Tech Stack

### Frontend
- **React 18** (TypeScript, Vite)
- **Tailwind CSS** (Styling)
- **Framer Motion** (Animations)
- **Lucide React** (Icons)
- **Chart.js** (Visualizations)

### Backend
- **FastAPI** (Python 3.10+)
- **Yahoo Finance API** (via `yfinance`)
- **Groq/xAI** (LLM Integration for RAG-based analysis)
- **Manual Transformer** (PyTorch based custom model)

## 📦 Setup & Installation

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd Stock-Market-App
```

### 2. Backend Setup
```bash
cd Backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Environment Variables
Create a `.env` file in the `Backend` directory:
```env
GROQ_API_KEY="your_groq_api_key"
XAI_API_KEY="your_xai_api_key_optional"
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
```

## 🏃 Running the Application

### Start Backend
```bash
cd Backend
uvicorn main:app --reload
```

### Start Frontend
```bash
cd Frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🛡️ License

This project is licensed under the MIT License - see the LICENSE file for details.
