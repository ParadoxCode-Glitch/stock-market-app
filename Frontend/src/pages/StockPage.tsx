import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  fetchStock,
  fetchNews,
  fetchFinancials,
  fetchPrediction,
  fetchStockHistory,
  fetchMarketIntelligence
} from "../services/api";
import StockChart from "../components/Chart";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Newspaper, 
  BarChart3, 
  Info, 
  AlertCircle,
  Zap,
  Target,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StockPage() {
  const { symbol } = useParams();

  const [stock, setStock] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;

    const loadData = async () => {
      try {
        const stockData = await fetchStock(symbol);
        setStock(stockData);

        // Concurrent loads
        const [newsData, finData, predData, histData] = await Promise.all([
          fetchNews(symbol).catch(() => []),
          fetchFinancials(symbol).catch(() => []),
          fetchPrediction(symbol).catch(() => null),
          fetchStockHistory(symbol, "1mo").catch(() => null)
        ]);

        setNews(newsData);
        setFinancials(finData);
        setPrediction(predData);

        // Fetch Groq AI summary after primary data is loaded
        if (stockData) {
          setAiSummaryLoading(true);
          const priceContext = histData?.values || [];
          const metrics = {
            pe_ratio: stockData.pe_ratio,
            pb_ratio: stockData.pb_ratio,
            roe: stockData.roe,
            debt_equity: stockData.debt_equity,
            dividend_yield: stockData.dividend_yield,
          };
          fetchMarketIntelligence(symbol, priceContext, "", metrics)
            .then((res) => setAiSummary(res?.analysis || res))
            .catch(() => setAiSummary(null))
            .finally(() => setAiSummaryLoading(false));
        }
      } catch (err) {
        console.error("Stock fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Assembling Market Intelligence</p>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
           <AlertCircle size={48} className="text-rose-500 mb-4" />
           <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Ticker Not Found</h1>
           <p className="text-slate-500 max-w-xs">We couldn't retrieve valid market data for {symbol}. It might be delisted or invalid.</p>
        </div>
      </div>
    );
  }

  // Vital Signs data filtering
  const vitalSigns = [
    { label: "Market Cap", value: stock.market_cap ? `₹${(stock.market_cap / 1000000000000).toFixed(2)}T` : null, icon: Activity },
    { label: "P/E Ratio", value: stock.pe_ratio, icon: BarChart3 },
    { label: "Forward P/E", value: stock.forward_pe, icon: TrendingUp },
    { label: "P/B Ratio", value: stock.pb_ratio, icon: ShieldCheck },
    { label: "ROE", value: stock.roe ? `${stock.roe}%` : null, icon: Zap },
    { label: "Debt/Equity", value: stock.debt_equity, icon: Target },
    { label: "Div. Yield", value: stock.dividend_yield ? `${stock.dividend_yield}%` : null, icon: BarChart3 },
    { label: "Beta", value: stock.beta, icon: Activity },
    { label: "EPS (TTM)", value: stock.eps ? `₹${stock.eps}` : null, icon: BarChart3 },
    { label: "52W High", value: stock.fiftyTwoWeekHigh ? `₹${stock.fiftyTwoWeekHigh}` : null, icon: TrendingUp },
    { label: "52W Low", value: stock.fiftyTwoWeekLow ? `₹${stock.fiftyTwoWeekLow}` : null, icon: TrendingDown },
    { label: "Profit Margin", value: stock.profit_margin ? `${stock.profit_margin}%` : null, icon: ShieldCheck },
  ].filter(sign => sign.value !== null && sign.value !== undefined && sign.value !== "N/A" && sign.value !== 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 pt-10">
        
        {/* Header Overview Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
               {symbol?.substring(0, 2).toUpperCase()}
             </div>
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full outline outline-1 outline-indigo-200/50">
                    {stock.sector || "General"}
                 </span>
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{stock.industry}</span>
               </div>
               <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter flex items-center gap-3">
                 {stock.name} 
                 <span className="text-slate-200 font-medium text-2xl">/ {symbol}</span>
               </h1>
             </div>
          </div>
          
          <div className="text-left md:text-right">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-1">Current Trading Price</p>
             <div className="flex items-baseline md:justify-end gap-2">
                <span className="text-2xl text-slate-400 font-medium">₹</span>
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  {stock.price?.toLocaleString()}
                </span>
             </div>
             <div className={`flex items-center md:justify-end mt-1 font-bold text-sm ${stock.day_change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {stock.day_change >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                {stock.day_change >= 0 ? "+" : ""}{stock.day_change} ({stock.day_change_percent}%)
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Visualization & News Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Chart Module */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[500px]">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500"><BarChart3 size={20} /></div>
                    Market Trajectory
                  </h2>
                </div>
               <StockChart symbol={symbol!} />
            </div>

            {/* AI Groq Summary Card */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Stock Summary</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Powered by Groq · Context-Aware</p>
                </div>
              </div>

              {aiSummaryLoading ? (
                <div className="flex items-center gap-3 py-6">
                  <div className="w-5 h-5 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synthesizing full company context...</p>
                </div>
              ) : aiSummary ? (
                <div className="space-y-4">
                  {/* Verdict Badge */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                      aiSummary.risk_score <= 3 ? "bg-emerald-50 text-emerald-600 outline outline-1 outline-emerald-200" :
                      aiSummary.risk_score <= 6 ? "bg-amber-50 text-amber-600 outline outline-1 outline-amber-200" :
                      "bg-rose-50 text-rose-600 outline outline-1 outline-rose-200"
                    }`}>{aiSummary.verdict}</span>
                    <span className="text-xs font-bold text-slate-400">Risk: {aiSummary.risk_score}/10</span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1.5">Price Action</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{aiSummary.technicals}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1.5">Fundamentals</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{aiSummary.fundamentals}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1.5">News Catalysts</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{aiSummary.catalysts}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4">AI summary unavailable for this stock.</p>
              )}
            </div>

            {/* News Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-500"><Newspaper size={20} /></div>
                        Context Formations
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Live Wire</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {news.map((n, i) => (
                        <a key={i} href={n.url} target="_blank" rel="noreferrer" className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-indigo-100">
                           <div className="flex justify-between items-start mb-4">
                               <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest outline outline-1 ${
                                    n.sentiment === "Positive" ? "bg-emerald-50 text-emerald-600 outline-emerald-200" :
                                    n.sentiment === "Negative" ? "bg-rose-50 text-rose-600 outline-rose-200" :
                                    "bg-slate-50 text-slate-500 outline-slate-200"
                               }`}>
                                    {n.sentiment}
                               </span>
                               <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-300 transition-colors" />
                           </div>
                           <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 leading-tight">
                             {n.title}
                           </h3>
                           <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                             {n.summary}
                           </p>
                        </a>
                    ))}
                </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            
            {/* Forecast Projection Card */}
            {prediction && (
                <div className="relative overflow-hidden bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20" />
                    
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-6">Momentum Outlook</p>
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
                                prediction.trend === "Uptrend" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                            }`}>
                                {prediction.trend === "Uptrend" ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                            </div>
                            <div>
                                <h3 className={`text-3xl font-black tracking-tighter ${
                                    prediction.trend === "Uptrend" ? "text-emerald-500" : "text-rose-500"
                                }`}>
                                    {prediction.trend}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                                    Transformer Model
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-2xl">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest underline decoration-dotted decoration-slate-200 cursor-help">Conviction</span>
                                <span className="font-black text-slate-900">{prediction.conviction_score}%</span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-2xl">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Projection Target</span>
                                <span className="font-black text-indigo-600">₹{prediction.forecast?.[4]?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vital Signs (Quick Stats) */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">Vital Signs</h2>
                  <Info size={16} className="text-slate-200" />
               </div>
               
               <div className="space-y-2">
                  {vitalSigns.map((sign, i) => (
                      <div key={i} className="flex justify-between items-center py-3 px-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                         <div className="flex items-center gap-3">
                            <sign.icon size={14} className="text-indigo-400 transition-colors" />
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{sign.label}</span>
                         </div>
                         <span className="font-extrabold text-slate-900 text-sm tracking-tight">{sign.value}</span>
                      </div>
                  ))}
               </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}