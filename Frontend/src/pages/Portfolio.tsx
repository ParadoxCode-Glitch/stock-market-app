import { useEffect, useState, useCallback, useMemo } from "react";
import { fetchStock, fetchNews } from "../services/api";
import { Newspaper, ChevronRight } from "lucide-react";
import PortfolioChart from "../components/portfolio/PortfolioChart";
import type { HoldingForChart } from "../components/portfolio/PortfolioChart";
import AllocationDonut from "../components/portfolio/AllocationDonut";
import HoldingsTable from "../components/portfolio/HoldingsTable";
import type { HoldingRow } from "../components/portfolio/HoldingsTable";
import InsightsCard from "../components/portfolio/InsightsCard";
import type { InsightHolding } from "../components/portfolio/InsightsCard";
import ManagePortfolioModal from "../components/portfolio/ManagePortfolioModal";
import StockDetailModal from "../components/portfolio/StockDetailModal";

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                     */
/* ─────────────────────────────────────────────────────────── */
interface StoredHolding {
  symbol: string;
  quantity: number;
  buyPrice: number;
}

interface EnrichedHolding {
  symbol: string;
  name: string;
  category: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  previousClose: number | null;
  dayChange: number | null;
  dayChangePercent: number | null;
  currentValue: number;
  investedValue: number;
  returns: number;
  returnsPercent: number;
}

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */
const fmt = (n: number, decimals = 2) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: decimals });

function MetricCard({
  label,
  value,
  sub,
  isPositive,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  isPositive?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      {loading ? (
        <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
      ) : (
        <>
          <p
            className={`text-2xl font-bold tracking-tight leading-none ${
              isPositive === undefined
                ? "text-slate-900"
                : isPositive
                ? "text-emerald-600"
                : "text-rose-500"
            }`}
          >
            {value}
          </p>
          {sub && (
            <p
              className={`text-xs font-semibold mt-0.5 ${
                isPositive === undefined
                  ? "text-slate-400"
                  : isPositive
                  ? "text-emerald-500"
                  : "text-rose-400"
              }`}
            >
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SectionCard({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="w-1 h-5 rounded-full bg-indigo-500 inline-block" />
      <h2 className="text-base font-bold text-slate-800">{children}</h2>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Skeleton Loader                                            */
/* ─────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-slate-100" />
        <div className="h-72 bg-white rounded-2xl border border-slate-100" />
      </div>
      <div className="h-64 bg-white rounded-2xl border border-slate-100" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-white rounded-2xl border border-slate-100" />
        <div className="h-64 bg-white rounded-2xl border border-slate-100" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Empty State                                               */
/* ─────────────────────────────────────────────────────────── */
function EmptyState({ onOpenManage }: { onOpenManage: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Your portfolio is empty</h2>
      <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">
        You have no stocks tracked yet. Use the management tool to add stocks or seed demo data.
      </p>
      <button
        onClick={onOpenManage}
        className="px-6 py-3 bg-indigo-600 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100"
      >
        Manage Portfolio
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Main Page                                                  */
/* ─────────────────────────────────────────────────────────── */
export default function Portfolio() {
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<"1M" | "3M" | "6M" | "1Y">("1M");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<EnrichedHolding | null>(null);

  const [portfolioNews, setPortfolioNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsFilter, setNewsFilter] = useState<"ALL" | "LATEST" | string>("ALL");

  const symbolsKey = useMemo(() => holdings.map(h => h.symbol).sort().join(","), [holdings]);

  const filteredNews = useMemo(() => {
    if (!portfolioNews || portfolioNews.length === 0) return [];
    
    const sorted = [...portfolioNews].sort((a, b) => {
        const d1 = new Date(a.date || 0).getTime();
        const d2 = new Date(b.date || 0).getTime();
        return d2 - d1;
    });

    if (newsFilter === "ALL") {
        const seen = new Set();
        return sorted.filter(n => {
            if (seen.has(n.stockSymbol)) return false;
            seen.add(n.stockSymbol);
            return true;
        });
    }

    if (newsFilter === "LATEST") {
        return sorted;
    }

    return sorted.filter(n => n.stockSymbol === newsFilter);
  }, [portfolioNews, newsFilter]);

  useEffect(() => {
    if (!symbolsKey) {
        setPortfolioNews([]);
        return;
    }
    const loadNews = async () => {
        setNewsLoading(true);
        const symbols = symbolsKey.split(",");
        const newsPromises = symbols.map(async (sym) => {
            try {
                const n = await fetchNews(sym);
                return (n || []).map((item: any) => ({ ...item, stockSymbol: sym }));
            } catch {
                return [];
            }
        });
        const results = await Promise.all(newsPromises);
        setPortfolioNews(results.flat());
        setNewsLoading(false);
    };
    loadNews();
  }, [symbolsKey]);

  const loadHoldings = useCallback(async () => {
    setLoading(true);
    const stored: StoredHolding[] = JSON.parse(localStorage.getItem("portfolio") || "[]");

    const enriched = await Promise.all(
      stored.map(async (h) => {
        let apiData: any = null;
        try {
          apiData = await fetchStock(h.symbol);
        } catch { /* skip */ }

        const currentPrice: number = apiData?.price ?? h.buyPrice;
        const previousClose: number | null = apiData?.previous_close ?? null;
        const dayChange: number | null = apiData?.day_change != null ? apiData.day_change * h.quantity : null;
        const dayChangePercent: number | null = apiData?.day_change_percent ?? null;
        const currentValue = currentPrice * h.quantity;
        const investedValue = h.buyPrice * h.quantity;

        return {
          symbol: h.symbol,
          name: apiData?.name ?? h.symbol,
          category: "STOCK",
          quantity: h.quantity,
          buyPrice: h.buyPrice,
          currentPrice,
          previousClose,
          dayChange,
          dayChangePercent,
          currentValue,
          investedValue,
          returns: currentValue - investedValue,
          returnsPercent: investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0,
        } satisfies EnrichedHolding;
      })
    );

    setHoldings(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHoldings();
  }, [loadHoldings]);

  /* ── Handlers ── */
  const handleAddAsset = (asset: StoredHolding) => {
    const stored: StoredHolding[] = JSON.parse(localStorage.getItem("portfolio") || "[]");
    const existingIndex = stored.findIndex(h => h.symbol === asset.symbol);
    if (existingIndex >= 0) {
      const existing = stored[existingIndex];
      const newQuantity = existing.quantity + asset.quantity;
      const newAvgCost = ((existing.buyPrice * existing.quantity) + (asset.buyPrice * asset.quantity)) / newQuantity;
      stored[existingIndex] = { ...existing, quantity: newQuantity, buyPrice: newAvgCost };
    } else {
      stored.push(asset);
    }
    localStorage.setItem("portfolio", JSON.stringify(stored));

    loadHoldings();
  };

  const handleDeleteAsset = (symbol: string) => {
    const stored: StoredHolding[] = JSON.parse(localStorage.getItem("portfolio") || "[]");
    const updated = stored.filter(h => h.symbol !== symbol);
    localStorage.setItem("portfolio", JSON.stringify(updated));
    loadHoldings();
  };

  const handleLoadDemo = () => {
    const demo: StoredHolding[] = [
      { symbol: "RELIANCE", quantity: 15, buyPrice: 2450.5 },
      { symbol: "TCS", quantity: 5, buyPrice: 3210.0 },
      { symbol: "INFY", quantity: 20, buyPrice: 1420.75 },
      { symbol: "TATAMOTORS", quantity: 50, buyPrice: 610.5 },
      { symbol: "HDFCBANK", quantity: 15, buyPrice: 1650.2 },
    ];
    localStorage.setItem("portfolio", JSON.stringify(demo));
    loadHoldings();
  };

  /* ── Aggregate metrics ── */
  const totalCurrentValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalInvested = holdings.reduce((s, h) => s + h.investedValue, 0);
  const totalReturns = totalCurrentValue - totalInvested;
  const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  const oneDayReturns = holdings.reduce((s, h) => s + (h.dayChange ?? 0), 0);
  const holdingsWithPrev = holdings.filter((h) => h.dayChange != null);
  const currentValueOfHoldingsWithPrev = holdingsWithPrev.reduce((s, h) => s + h.currentValue, 0);
  const returnsOfHoldingsWithPrev = holdingsWithPrev.reduce((s, h) => s + h.dayChange!, 0);
  const prevValueOfHoldingsWithPrev = currentValueOfHoldingsWithPrev - returnsOfHoldingsWithPrev;
  
  const oneDayPct = holdingsWithPrev.length > 0 && prevValueOfHoldingsWithPrev > 0
      ? (returnsOfHoldingsWithPrev / prevValueOfHoldingsWithPrev) * 100
      : null;

  /* ── Derived shapes for child components ── */
  const chartHoldings: HoldingForChart[] = holdings.map((h) => ({
    symbol: h.symbol,
    quantity: h.quantity,
    buyPrice: h.buyPrice,
    currentPrice: h.currentPrice,
  }));

  const holdingRows: HoldingRow[] = holdings.map((h) => ({
    symbol: h.symbol,
    name: h.name,
    category: h.category,
    quantity: h.quantity,
    buyPrice: h.buyPrice,
    currentPrice: h.currentPrice,
    currentValue: h.currentValue,
    returns: h.returns,
    returnsPercent: h.returnsPercent,
  }));

  const insightHoldings: InsightHolding[] = holdings.map((h) => ({
    symbol: h.symbol,
    currentValue: h.currentValue,
    returns: h.returns,
    returnsPercent: h.returnsPercent,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Page Header ── */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Portfolio</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              Track and learn from your stocks across all sectors.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Manage Portfolio
          </button>
        </div>

        {loading ? (
          <Skeleton />
        ) : holdings.length === 0 ? (
          <EmptyState onOpenManage={() => setIsModalOpen(true)} />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Metrics + Line Chart */}
              <SectionCard className="lg:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-4 pb-5 border-b border-slate-100">
                  <MetricCard label="Net Worth" value={`₹${fmt(totalCurrentValue, 0)}`} />
                  <MetricCard
                    label="P&L Returns"
                    value={`${totalReturns >= 0 ? "+" : ""}₹${fmt(Math.abs(totalReturns), 0)}`}
                    sub={`${totalReturns >= 0 ? "▲" : "▼"} ${Math.abs(totalReturnsPercent).toFixed(2)}%`}
                    isPositive={totalReturns >= 0}
                  />
                  <MetricCard
                    label="1-Day Returns"
                    value={oneDayPct != null ? `${oneDayReturns >= 0 ? "+" : ""}₹${fmt(Math.abs(oneDayReturns), 0)}` : "—"}
                    sub={oneDayPct != null ? `${oneDayReturns >= 0 ? "▲" : "▼"} ${Math.abs(oneDayPct).toFixed(2)}%` : "Loading live data..."}
                    isPositive={oneDayPct != null ? oneDayReturns >= 0 : undefined}
                  />
                </div>
                <PortfolioChart
                  holdings={chartHoldings}
                  totalInvested={totalInvested}
                  totalCurrent={totalCurrentValue}
                  activeRange={activeRange}
                  onRangeChange={setActiveRange}
                />
              </SectionCard>

              {/* Right: Stock Allocation Donut */}
              <SectionCard>
                <AllocationDonut holdings={holdingRows} />
              </SectionCard>
            </div>

            <SectionCard id="holdings-section">
              <SectionTitle>Current Holdings</SectionTitle>
              <HoldingsTable 
                holdings={holdingRows} 
                onDelete={handleDeleteAsset}
                onViewChart={(symbol) => {
                  const h = holdings.find(x => x.symbol === symbol);
                  if (h) setSelectedStock(h);
                }}
              />
            </SectionCard>

            <div className="mb-6 grid grid-cols-1 gap-6">
              <InsightsCard holdings={insightHoldings} totalCurrent={totalCurrentValue} totalInvested={totalInvested} />
            </div>

            <SectionCard id="portfolio-news">
                <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-xl text-slate-500"><Newspaper size={20} /></div>
                            Portfolio Intelligence
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1">Live Wire</p>
                    </div>

                    {!newsLoading && portfolioNews.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
                            <button 
                                onClick={() => setNewsFilter("ALL")}
                                className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${newsFilter === "ALL" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                                1/Stock
                            </button>
                            <button 
                                onClick={() => setNewsFilter("LATEST")}
                                className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${newsFilter === "LATEST" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                                Latest
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-1"></div>
                            {Array.from(new Set(portfolioNews.map(n => n.stockSymbol))).map(sym => (
                                <button
                                    key={sym as string}
                                    onClick={() => setNewsFilter(sym as string)}
                                    className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${newsFilter === sym ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                >
                                    {sym as string}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {newsLoading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analyzing News Streams...</p>
                    </div>
                ) : portfolioNews.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No news available for your portfolio.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNews.slice(0, 15).map((n, i) => (
                            <a key={i} href={n.url} target="_blank" rel="noreferrer" className="group flex flex-col bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100">
                               <div className="flex justify-between items-start mb-4">
                                   <div className="flex flex-wrap gap-2">
                                       <span className="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 outline outline-1 outline-indigo-200/50">
                                            {n.stockSymbol}
                                       </span>
                                       <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest outline outline-1 ${
                                            n.sentiment === "Positive" ? "bg-emerald-50 text-emerald-600 outline-emerald-200" :
                                            n.sentiment === "Negative" ? "bg-rose-50 text-rose-600 outline-rose-200" :
                                            "bg-white text-slate-500 outline-slate-200"
                                       }`}>
                                            {n.sentiment}
                                       </span>
                                   </div>
                               </div>
                               <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-3 leading-snug line-clamp-2">
                                 {n.title}
                               </h3>
                               <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-5 flex-grow">
                                 {n.summary}
                               </p>
                               <div className="flex justify-between items-center mt-auto border-t border-slate-100 pt-3">
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                       {n.date ? new Date(n.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }) : 'Recent'}
                                   </span>
                                   <div className="flex items-center gap-1">
                                       <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Read</span>
                                       <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                   </div>
                               </div>
                            </a>
                        ))}
                        {filteredNews.length === 0 && (
                             <p className="text-sm text-slate-400 text-left col-span-full py-2">No news items match the selected filter.</p>
                        )}
                    </div>
                )}
            </SectionCard>
          </div>
        )}
      </div>

      <ManagePortfolioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddAsset={handleAddAsset}
        onLoadDemo={handleLoadDemo}
      />

      {/* Stock Detail Modal */}
      {selectedStock && (
        <StockDetailModal
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
          holding={selectedStock}
        />
      )}
    </div>
  );
}