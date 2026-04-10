const BASE_URL = "http://127.0.0.1:8000/api";

const apiCache: Record<string, { data: any }> = {};

async function fetchWithCache(endpoint: string, options?: RequestInit) {
  const isPost = options?.method && options.method.toUpperCase() !== "GET";
  const cacheKey = isPost ? `${endpoint}-${options.body}` : endpoint;
  
  // Return cached result indefinitely until manual refresh
  if (apiCache[cacheKey]) {
    return apiCache[cacheKey].data;
  }
  
  const res = await fetch(endpoint, options);
  const data = await res.json();
  
  // Only cache valid, non-empty responses
  const isEmpty = !data || data.error ||
    (Array.isArray(data) && data.length === 0) ||
    (data.values && data.values.length === 0) ||
    (data.labels && data.labels.length === 0);
  
  if (!isEmpty) {
    apiCache[cacheKey] = { data };
  }
  return data;
}

// Always hits the backend — used for chart data that changes with period
async function fetchDirect(endpoint: string) {
  const res = await fetch(endpoint);
  return res.json();
}

export const fetchStock = async (symbol: string) =>
  fetchWithCache(`${BASE_URL}/stock/${symbol}`);

// Chart history bypasses cache since period changes every click
export const fetchStockHistory = async (symbol: string, period: string = "1mo") =>
  fetchDirect(`${BASE_URL}/stock/${symbol}/history?period=${period}`);

export const fetchPrediction = async (symbol: string) =>
  fetchDirect(`${BASE_URL}/stock/${symbol}/predict`);

export const fetchPriceValidation = async (symbol: string, date: string, price: number) =>
  fetchWithCache(`${BASE_URL}/stock/${symbol}/validate_price?date=${date}&price=${price}`);

export const fetchNews = async (symbol: string) =>
  fetchWithCache(`${BASE_URL}/stock/${symbol}/news`);

export const fetchMarket = async () =>
  fetchWithCache(`${BASE_URL}/market/overview`);

export const fetchFinancials = async (symbol: string) =>
  fetchWithCache(`${BASE_URL}/stock/${symbol}/financials`);

export const fetchMarketIntelligence = async (symbol: string, priceContext: number[], newsSummary: string, metrics: any) =>
  fetchWithCache(`${BASE_URL}/stock/${symbol}/intelligence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price_context: priceContext, news_summary: newsSummary, metrics })
  });

export const fetchCompare = async (symbols: string) =>
  fetchWithCache(`${BASE_URL}/compare?symbols=${symbols}`);

export const fetchCompareHistory = async (symbols: string, period: string = "6mo") =>
  fetchWithCache(`${BASE_URL}/compare/history?symbols=${symbols}&period=${period}`);

export const fetchStockSector = async (symbol: string) =>
  fetchWithCache(`${BASE_URL}/stock/${symbol}/sector`);

export const fetchAICompareExplanation = async (stockA: any, stockB: any) =>
  fetchWithCache(`${BASE_URL}/ai/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock_a: stockA, stock_b: stockB })
  });

export const fetchAIPortfolioInsights = async (holdings: any[], totalCurrent: number, totalInvested: number) =>
  fetchWithCache(`${BASE_URL}/ai/portfolio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ holdings, totalCurrent, totalInvested })
  });

export const fetchPortfolioHistory = async (holdings: any[], period: string) =>
  fetchWithCache(`${BASE_URL}/portfolio/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ holdings, period })
  });