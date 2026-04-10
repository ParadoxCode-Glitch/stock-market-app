import React, { useState, useMemo, useEffect } from "react";
import { fetchCompare, fetchCompareHistory, fetchStockSector } from "../services/api";
import { STOCKS } from "../data/stocks";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { motion } from "framer-motion";
import { QuickVerdictCard, MarketCapBar, ComparativeInsightWidget, VolatilityBadge } from "../components/ComparisonComponents";
import { Search, Activity, AlertTriangle, ArrowRightLeft, Smile, TrendingUp, DollarSign } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SECTOR_PEERS: Record<string, string[]> = {
  "Financial Services": ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"],
  "Technology": ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"],
  "Energy": ["RELIANCE", "ONGC", "NTPC", "POWERGRID"],
  "Consumer Defensive": ["ITC", "HINDUNILVR", "NESTLEIND", "BRITANNIA"],
};

export default function ComparePage() {
  const [stockA, setStockA] = useState<string>("");
  const [stockB, setStockB] = useState<string>("");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [focusA, setFocusA] = useState(false);
  const [focusB, setFocusB] = useState(false);
  
  const [sectorA, setSectorA] = useState<string>("");
  
  const [data, setData] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredA = useMemo(() => {
    if (!searchA.trim()) return [];
    const lower = searchA.toLowerCase();
    return STOCKS.filter(s => s.symbol.toLowerCase().includes(lower) || s.name.toLowerCase().includes(lower)).slice(0, 10);
  }, [searchA]);

  const filteredB = useMemo(() => {
    if (!searchB.trim()) return [];
    const lower = searchB.toLowerCase();
    return STOCKS.filter(s => s.symbol.toLowerCase().includes(lower) || s.name.toLowerCase().includes(lower)).slice(0, 10);
  }, [searchB]);

  const selectStockA = async (symbol: string) => {
    setStockA(symbol);
    setSearchA("");
    setFocusA(false);
    setStockB("");
    setSectorA("");
    setData([]);
    setHistoryData(null);
    setError("");

    try {
      const res = await fetchStockSector(symbol);
      setSectorA(res.sector || "Unknown");
    } catch (e) {
      console.error(e);
    }
  };

  const selectStockB = async (symbol: string) => {
    if (!stockA || !sectorA) {
      setError("Please select Stock A and let its sector load first.");
      return;
    }
    
    setError("Validating sector...");
    try {
      const res = await fetchStockSector(symbol);
      if (res.sector !== sectorA && sectorA !== "Unknown") {
        setError(`Sector Mismatch: ${symbol} is in ${res.sector}, but ${stockA} is in ${sectorA}. You can only compare stocks in the same sector.`);
        return;
      }
      setStockB(symbol);
      setSearchB("");
      setFocusB(false);
      setError("");
      
      handleCompare(stockA, symbol);
    } catch (e) {
      setError("Failed to validate sector.");
    }
  };

  const handleCompare = async (a: string, b: string) => {
    setLoading(true);
    setError("");
    try {
      const [compareRes, historyRes] = await Promise.all([
        fetchCompare(`${a},${b}`),
        fetchCompareHistory(`${a},${b}`, "6mo")
      ]);
      
      if (Array.isArray(compareRes)) {
        setData(compareRes);
      }
      if (historyRes && historyRes.labels) {
        setHistoryData(historyRes);
      }
    } catch (err) {
      setError("Failed to fetch comparison data.");
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!historyData) return null;
    return {
      labels: historyData.labels,
      datasets: [
        {
          label: historyData.datasets[0]?.symbol,
          data: historyData.datasets[0]?.values,
          borderColor: '#22D3EE',
          backgroundColor: 'rgba(34, 211, 238, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
        },
        {
          label: historyData.datasets[1]?.symbol,
          data: historyData.datasets[1]?.values,
          borderColor: '#FF2DFE',
          backgroundColor: 'rgba(255, 45, 254, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top' as const,
        align: 'end' as const,
        labels: { 
          color: '#64748B',
          font: { size: 12, weight: 'bold' as any, family: "'Inter', sans-serif" },
          usePointStyle: true,
          padding: 20
        } 
      },
      tooltip: { 
        mode: 'index' as const, 
        intersect: false, 
        backgroundColor: '#FFFFFF', 
        titleColor: '#1E293B', 
        bodyColor: '#475569', 
        borderColor: '#F1F5F9', 
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: { size: 14, weight: 'bold' as any },
        bodyFont: { size: 13 }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        border: { display: false },
        ticks: { color: '#94A3B8', font: { size: 11, family: "'Inter', sans-serif" } } 
      },
      y: { 
        grid: { color: '#F1F5F9', drawTicks: false }, 
        border: { display: false },
        ticks: { color: '#94A3B8', font: { size: 11, family: "'Inter', sans-serif" }, padding: 10 } 
      }
    },
    interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false }
  };

  const calculateCorrelation = () => {
    if (!historyData || !historyData.datasets || historyData.datasets.length < 2) return null;
    const v1 = historyData.datasets[0].values;
    const v2 = historyData.datasets[1].values;
    if (!v1 || !v2 || v1.length !== v2.length || v1.length === 0) return null;
    
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
    const n = v1.length;
    for (let i = 0; i < n; i++) {
      sum1 += v1[i];
      sum2 += v2[i];
      sum1Sq += v1[i] * v1[i];
      sum2Sq += v2[i] * v2[i];
      pSum += v1[i] * v2[i];
    }
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    if (den === 0) return 0;
    return (num / den) * 100;
  };

  const correlation = calculateCorrelation();

  const stockAData = data.find(d => d.symbol === stockA);
  const stockBData = data.find(d => d.symbol === stockB);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8 pt-10">
        
        {/* HEADER & SELECTION */}
        <div className="text-center space-y-4 mb-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            {stockA && stockB ? (
              <>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                  <span className="text-indigo-600">{stockA}</span> <span className="text-slate-300 mx-2">vs</span> <span className="text-[#FF2DFE]">{stockB}</span>
                </h1>
                <p className="text-slate-400 mt-2 text-lg font-medium">Full fundamental analysis within {sectorA}</p>
              </>
            ) : (
               <>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Compare Stocks</h1>
                <p className="text-slate-400 mt-2 text-lg font-medium">Select two stocks from the same sector for advanced AI analysis.</p>
               </>
            )}
          </motion.div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* STOCK A */}
            <div className="relative">
              <div className={`p-1 rounded-2xl transition-all duration-300 ${stockA ? 'bg-white shadow-[0_0_20px_rgba(79,70,229,0.1)] border-indigo-100 border' : 'border border-slate-200 bg-white'}`}>
                {stockA ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white">
                    <div>
                      <div className="text-indigo-600 font-bold text-lg leading-tight">{stockA}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sectorA}</div>
                    </div>
                    <button onClick={() => {setStockA(""); setSectorA(""); setData([]); setStockB("");}} className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-rose-500 transition-colors">
                      <Search size={18} />
                    </button>
                  </div>
                ) : (
                  <input
                    value={searchA}
                    onChange={(e) => setSearchA(e.target.value)}
                    onFocus={() => setFocusA(true)}
                    onBlur={() => setTimeout(() => setFocusA(false), 200)}
                    placeholder="Select Stock A..."
                    className="w-full bg-transparent text-slate-900 p-4 rounded-xl outline-none font-semibold placeholder:text-slate-300"
                  />
                )}
              </div>
              {focusA && filteredA.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
                  {filteredA.map(s => (
                    <button key={s.symbol} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors mb-1" onClick={() => selectStockA(s.symbol)}>
                      <div className="font-bold text-slate-900">{s.symbol}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center p-2 text-slate-300 hidden md:flex"><ArrowRightLeft size={24} /></div>

            {/* STOCK B */}
            <div className="relative">
               <div className={`p-1 rounded-2xl transition-all duration-300 ${stockB ? 'bg-white shadow-[0_0_20px_rgba(255,45,254,0.1)] border-pink-100 border' : 'border border-slate-200 bg-gray-50/50'}`}>
                {stockB ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white">
                    <div>
                      <div className="text-[#FF2DFE] font-bold text-lg leading-tight">{stockB}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sectorA}</div>
                    </div>
                    <button onClick={() => {setStockB(""); setData([]);}} className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-rose-500 transition-colors">
                      <Search size={18} />
                    </button>
                  </div>
                ) : (
                  <input
                    value={searchB}
                    onChange={(e) => setSearchB(e.target.value)}
                    onFocus={() => setFocusB(true)}
                    onBlur={() => setTimeout(() => setFocusB(false), 200)}
                    placeholder={stockA ? `Compare within ${sectorA}...` : "Select Stock B..."}
                    className="w-full bg-transparent text-slate-900 p-4 rounded-xl outline-none font-semibold placeholder:text-slate-300"
                    disabled={!stockA}
                  />
                )}
              </div>
              {focusB && filteredB.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
                  {filteredB.map(s => (
                    <button key={s.symbol} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors mb-1" onClick={() => selectStockB(s.symbol)}>
                      <div className="font-bold text-slate-900">{s.symbol}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className="text-[#FF4D4D] bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 p-3 rounded-xl max-w-2xl mx-auto flex items-center justify-center gap-2">
            <AlertTriangle size={18} /> {error}
          </div>}

          {/* Quick peer chips */}
          {stockA && !stockB && SECTOR_PEERS[sectorA] && (
            <div className="flex justify-center gap-2 mt-6 overflow-x-auto hide-scroll px-4 pb-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider py-1.5 mr-2 self-center">Top peers:</span>
              {SECTOR_PEERS[sectorA].filter(p => p !== stockA).map(peer => (
                <button
                  key={peer}
                  onClick={() => selectStockB(peer)}
                  className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 text-xs font-bold rounded-full border border-slate-200 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Activity size={12} className="opacity-40" />
                  {peer}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && <div className="text-center text-[#22D3EE] font-bold animate-pulse">Analyzing Performance Data...</div>}

        {/* DASHBOARD CONTENT */}
        {data.length > 1 && stockAData && stockBData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            
            {/* TOP GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              
              {/* LEFT: CHART (70%) */}
              <div className="lg:col-span-2 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Relative Performance</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Normalized to Base 100</p>
                  </div>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    {["3M", "6M", "1Y"].map(p => (
                      <button key={p} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${p === "6M" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[400px]">
                  {getChartData() ? <Line data={getChartData()!} options={chartOptions as any} /> : null}
                </div>
              </div>

              {/* RIGHT: INSIGHTS (30%) */}
              <div className="space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between gap-4 mb-4">
                    <VolatilityBadge value="0.84% σ" level="Stable" />
                    <VolatilityBadge value="1.25% σ" level="High Volatility" />
                  </div>
                  <QuickVerdictCard stockA={stockAData} stockB={stockBData} />
                </div>
                <MarketCapBar stockA={stockAData} stockB={stockBData} />
              </div>
            </div>

            {/* BOTTOM GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
              
              {/* RATIO TABLE */}
              <div className="lg:col-span-3 bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="p-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Metric</th>
                      <th className="p-5 text-[11px] font-bold text-indigo-600 uppercase tracking-widest">{stockA}</th>
                      <th className="p-5 text-[11px] font-bold text-pink-500 uppercase tracking-widest">{stockB}</th>
                      <th className="p-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Insight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-bold text-slate-600">P/E Ratio</td>
                      <td className="p-5 text-sm font-extrabold text-slate-900">{stockAData.pe_ratio || '—'}</td>
                      <td className="p-5 text-sm font-extrabold text-slate-900">{stockBData.pe_ratio || '—'}</td>
                      <td className="p-5">
                        {stockAData.pe_ratio < stockBData.pe_ratio ? 
                          <span className="text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm uppercase tracking-wide">Value pick</span> : 
                          <span className="text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 shadow-sm uppercase tracking-wide">Premium</span>
                        }
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-bold text-slate-600">Return on Equity</td>
                      <td className="p-5 text-sm font-extrabold text-slate-900">{stockAData.roe ? `${stockAData.roe}%` : '—'}</td>
                      <td className="p-5 text-sm font-extrabold text-slate-900">{stockBData.roe ? `${stockBData.roe}%` : '—'}</td>
                      <td className="p-5">
                         {stockAData.roe > stockBData.roe ? 
                          <span className="text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm uppercase tracking-wide">More efficient</span> : 
                          <span className="text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 uppercase tracking-wide">Neutral</span>
                        }
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-bold text-slate-600">Profit Margin</td>
                      <td className="p-5 text-sm font-extrabold text-slate-900">{stockAData.profit_margin ? `${stockAData.profit_margin}%` : '—'}</td>
                      <td className="p-5 text-sm font-extrabold text-slate-900">{stockBData.profit_margin ? `${stockBData.profit_margin}%` : '—'}</td>
                      <td className="p-5">
                        {stockAData.profit_margin > stockBData.profit_margin ? 
                          <span className="text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm uppercase tracking-wide">Higher margin</span> : 
                          <span className="text-rose-600 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 shadow-sm uppercase tracking-wide">Lower margin</span>
                        }
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-bold text-slate-600">Dividend Yield</td>
                      <td className="p-5 text-sm font-extrabold text-slate-900">{stockAData.dividend_yield ? `${stockAData.dividend_yield}%` : '0%'}</td>
                      <td className="p-5 text-sm font-extrabold text-slate-900">{stockBData.dividend_yield ? `${stockBData.dividend_yield}%` : '0%'}</td>
                      <td className="p-5">
                         <span className="text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 uppercase tracking-wide">Income Gen</span>
                      </td>
                    </tr>
                    {(stockAData.ev_ebitda || stockBData.ev_ebitda) && (
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-bold text-slate-600">EV / EBITDA</td>
                      <td className="p-5 text-sm font-extrabold text-slate-900">{stockAData.ev_ebitda || '—'}</td>
                      <td className="p-5 text-sm font-extrabold text-slate-900">{stockBData.ev_ebitda || '—'}</td>
                      <td className="p-5">
                        {stockAData.ev_ebitda && stockBData.ev_ebitda ? (
                          stockAData.ev_ebitda < stockBData.ev_ebitda ? 
                            <span className="text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm uppercase tracking-wide">Better Value</span> : 
                            <span className="text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 shadow-sm uppercase tracking-wide">Expensive</span>
                        ) : <span className="text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 uppercase tracking-wide">Base</span>}
                      </td>
                    </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* INSIGHT WIDGETS */}
              <div className="flex flex-col gap-4">
                {(stockAData.analyst_sentiment || stockBData.analyst_sentiment) && (
                <ComparativeInsightWidget 
                  title="Analyst Sentiment" 
                  icon={Smile} 
                  stockA={stockAData} 
                  stockB={stockBData} 
                  getValue={(s: any) => s.analyst_sentiment}
                  getInsight={(val: string) => {
                     if (!val) return null;
                     const lower = String(val).toLowerCase();
                     if (lower.includes("buy")) return { label: "Positive", color: "bg-[#00FFA3]/10 text-[#00FFA3]" };
                     if (lower.includes("sell") || lower.includes("under")) return { label: "Negative", color: "bg-[#FF4D4D]/10 text-[#FF4D4D]" };
                     return { label: "Neutral", color: "bg-gray-700 text-gray-300" };
                  }}
                />
                )}
                
                {(stockAData.beta || stockBData.beta) && (
                <ComparativeInsightWidget 
                  title="Market Volatility (Beta)" 
                  icon={Activity} 
                  stockA={stockAData} 
                  stockB={stockBData} 
                  getValue={(s: any) => s.beta}
                  getInsight={(val: number) => {
                     if (!val) return null;
                     if (val > 1.2) return { label: "High Risk", color: "bg-[#FF4D4D]/10 text-[#FF4D4D]" };
                     if (val < 0.8) return { label: "Stable", color: "bg-[#00FFA3]/10 text-[#00FFA3]" };
                     return { label: "Market Avg", color: "bg-gray-700 text-gray-300" };
                  }}
                />
                )}
                
                {(stockAData.target_price || stockBData.target_price) && (
                <ComparativeInsightWidget 
                  title="Upside Potential" 
                  icon={TrendingUp} 
                  stockA={stockAData} 
                  stockB={stockBData} 
                  getValue={(s: any) => {
                    if (!s.price || !s.target_price) return null;
                    const pct = ((s.target_price - s.price) / s.price) * 100;
                    return `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
                  }}
                  getInsight={(val: string) => {
                     if (!val) return null;
                     const pct = parseFloat(val);
                     if (pct > 15) return { label: "High Growth", color: "bg-[#00FFA3]/10 text-[#00FFA3]" };
                     if (pct < 0) return { label: "Overvalued", color: "bg-[#FF4D4D]/10 text-[#FF4D4D]" };
                     return { label: "Moderate", color: "bg-gray-700 text-gray-300" };
                  }}
                />
                )}

                {correlation !== null && (
                  <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ArrowRightLeft size={16} strokeWidth={2} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Historical Correlation</span>
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 tracking-tight">{correlation.toFixed(1)}%</div>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}