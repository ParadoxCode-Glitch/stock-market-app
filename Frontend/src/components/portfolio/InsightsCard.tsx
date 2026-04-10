import { useState, useEffect, useRef } from "react";
import { fetchAIPortfolioInsights } from "../../services/api";
import { Loader2, Sparkles, PieChart, TrendingUp, TrendingDown, AlertTriangle, Activity, Shield, Zap, Search, RefreshCw } from "lucide-react";

export interface InsightHolding {
  symbol: string;
  currentValue: number;
  returns: number;
  returnsPercent: number;
}

interface Props {
  holdings: InsightHolding[];
  totalCurrent: number;
  totalInvested: number;
}

interface Insight {
  icon: string;
  title: string;
  body: string;
}

const CACHE_KEY = "ai_portfolio_cache";

export default function InsightsCard({ holdings, totalCurrent, totalInvested }: Props) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Ref to prevent double-fetching in strict mode
  const fetchBegan = useRef(false);

  const ICON_MAP: Record<string, React.ElementType> = {
    PieChart, TrendingUp, TrendingDown, AlertTriangle, Activity, Shield, Zap, Search
  };

  const loadInsights = (forceRefresh = false) => {
    if (holdings.length === 0) {
      setInsights([
        {
          icon: "Sparkles",
          title: "Start tracking",
          body: "Add your stock holdings to unlock personalised AI insights about your portfolio.",
        },
      ]);
      setLoading(false);
      return;
    }

    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setInsights(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Cache parsing error", e);
        }
      }
    }

    setLoading(true);
    fetchAIPortfolioInsights(holdings, totalCurrent, totalInvested)
      .then((res) => {
        if (res.insights && Array.isArray(res.insights) && res.insights.length > 0) {
          setInsights(res.insights);
          localStorage.setItem(CACHE_KEY, JSON.stringify(res.insights));
        } else {
          setInsights([
            {
              icon: "AlertTriangle",
              title: "AI Analysis Unreachable",
              body: "We couldn't generate your personalized AI portfolio insights right now.",
            }
          ]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("AI Error:", err);
        setInsights([
            {
              icon: "AlertTriangle",
              title: "AI Offline",
              body: "Our AI server is unavailable due to an error.",
            }
        ]);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!fetchBegan.current) {
      fetchBegan.current = true;
      loadInsights(false);
    }
  }, []); // Only run once on mount

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <Sparkles size={14} className="text-[#FF2DFE]" /> AI Portfolio Insights
        </p>
        <button 
          onClick={() => loadInsights(true)}
          disabled={loading || holdings.length === 0}
          className="px-2.5 py-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-800 hover:bg-white bg-slate-50 transition-all disabled:opacity-50 flex items-center justify-center shadow-sm gap-1.5"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-indigo-500" : ""} />
          <span className="text-[11px] font-bold uppercase tracking-wider">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-100 p-8 flex flex-col items-center justify-center opacity-70">
           <Loader2 className="animate-spin text-[#22D3EE] mb-4" size={32} />
           <p className="text-sm font-semibold text-slate-600">Groq/xAI is analyzing your assets...</p>
           <p className="text-xs text-slate-400 mt-1">Calculating risk patterns and profit drivers</p>
        </div>
      ) : (
        insights.map((insight, i) => {
          const IconComponent = ICON_MAP[insight.icon] || Sparkles;
          
          return (
          <div
            key={i}
            className="rounded-2xl overflow-hidden relative"
            style={{ background: "white", border: "1px solid #f1f5f9" }}
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 shadow-sm">
                  <IconComponent size={24} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-[15px] leading-snug">
                    {insight.title}
                  </p>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed font-medium">
                    {insight.body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )})
      )}
    </div>
  );
}
