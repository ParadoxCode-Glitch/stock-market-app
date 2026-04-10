import React, { useState } from 'react';
import { Lightbulb, Activity, TrendingUp, TrendingDown, Minus, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAICompareExplanation } from '../services/api';

export const QuickVerdictCard = ({ stockA, stockB }: { stockA: any, stockB: any }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!stockA || !stockB) return null;
  
  const returnA = stockA.roe || 0;
  const returnB = stockB.roe || 0;
  
  let verdict = "Both stocks show similar fundamentals.";
  let glowColor = "glow-border-cyan";
  if (returnA > returnB) {
    verdict = `${stockA.symbol} has a stronger Return on Equity compared to ${stockB.symbol}.`;
    glowColor = "glow-border-cyan";
  } else if (returnB > returnA) {
    verdict = `${stockB.symbol} has a stronger Return on Equity compared to ${stockA.symbol}.`;
    glowColor = "glow-border-magenta";
  }

  const handleLearnWhy = async () => {
    if (explanation) return; // already loaded
    setLoading(true);
    try {
      const res = await fetchAICompareExplanation(stockA, stockB);
      if (res.explanation) {
        setExplanation(res.explanation);
      }
    } catch (e) {
      setExplanation("Our AI analyst is currently unavailable. Please try again later.");
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-slate-100 shadow-sm p-6 rounded-2xl flex flex-col relative overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${returnA > returnB ? 'bg-[#22D3EE]' : returnB > returnA ? 'bg-[#FF2DFE]' : 'bg-slate-200'}`} />
      
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
          <Lightbulb size={24} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Quick Verdict</h3>
      </div>
      <p className="text-slate-600 text-lg mb-6 leading-relaxed font-medium">{verdict}</p>
      
      {!explanation && (
        <button 
          onClick={handleLearnWhy}
          disabled={loading}
          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-2 mt-auto w-max px-4 py-2 bg-indigo-50 rounded-xl"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "AI Learn why →"}
        </button>
      )}

      <AnimatePresence>
        {explanation && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-slate-100"
          >
            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Sparkles size={18} className="text-[#FF2DFE] mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                {explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const MarketCapBar = ({ stockA, stockB }: { stockA: any, stockB: any }) => {
  if (!stockA || !stockB) return null;
  
  const capA = stockA.market_cap || 0;
  const capB = stockB.market_cap || 0;
  const total = capA + capB;
  const pctA = total > 0 ? (capA / total) * 100 : 50;
  const pctB = total > 0 ? (capB / total) * 100 : 50;

  const formatTrillions = (val: number) => `₹${(val / 1e12).toFixed(2)}T`;

  return (
    <div className="bg-white border border-slate-100 shadow-sm p-6 rounded-2xl mt-6">
      <h3 className="text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest">Market Cap Comparison</h3>
      
      <div className="flex justify-between text-[13px] font-bold text-slate-900 mb-3">
        <span className="text-[#22D3EE]">{stockA.symbol}</span>
        <span className="text-[#FF2DFE]">{stockB.symbol}</span>
      </div>
      
      <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pctA}%` }}
          className="h-full bg-[#22D3EE]"
        />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pctB}%` }}
          className="h-full bg-[#FF2DFE]"
        />
      </div>
      
      <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2.5">
        <span>{formatTrillions(capA)}</span>
        <span>{formatTrillions(capB)}</span>
      </div>
    </div>
  );
};

export const ComparativeInsightWidget = ({ title, stockA, stockB, icon: Icon, getValue, getInsight }: any) => {
  if (!stockA || !stockB) return null;
  
  const valA = getValue(stockA);
  const valB = getValue(stockB);
  const insightA = getInsight(valA, valB, stockA);
  const insightB = getInsight(valB, valA, stockB);

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-4"
    >
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={16} strokeWidth={2} />
        <span className="text-[11px] font-bold uppercase tracking-widest">{title}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Stock A */}
        <div className="flex flex-col gap-1.5 border-r border-slate-100 pr-2">
          <span className="text-[10px] font-extrabold text-[#22D3EE] uppercase tracking-wider">{stockA.symbol}</span>
          <span className="text-[17px] text-slate-900 font-extrabold tracking-tight">{valA !== null && valA !== undefined && valA !== "" ? valA : "—"}</span>
          {insightA && (
             <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full w-max border ${insightA.color.replace(' text-', ' border-').replace('/10', '/30')}`}>
               {insightA.label}
             </span>
          )}
        </div>
        
        {/* Stock B */}
        <div className="flex flex-col gap-1.5 pl-2">
          <span className="text-[10px] font-extrabold text-[#FF2DFE] uppercase tracking-wider">{stockB.symbol}</span>
          <span className="text-[17px] text-slate-900 font-extrabold tracking-tight">{valB !== null && valB !== undefined && valB !== "" ? valB : "—"}</span>
          {insightB && (
             <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full w-max border ${insightB.color.replace(' text-', ' border-').replace('/10', '/30')}`}>
               {insightB.label}
             </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const VolatilityBadge = ({ value, level }: { value: string, level: "Stable" | "High Volatility" }) => {
  const isStable = level === "Stable";
  return (
    <div className={`px-4 py-2 rounded-full border flex items-center justify-center gap-2 text-xs font-bold shadow-sm transition-all ${
      isStable 
        ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
        : "bg-rose-50 border-rose-100 text-rose-600"
    }`}>
      {isStable ? <Activity size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
      <span>{value}</span> <span className="opacity-40">•</span> <span>{level}</span>
    </div>
  );
};
