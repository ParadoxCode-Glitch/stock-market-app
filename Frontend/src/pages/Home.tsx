import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMarket } from "../services/api";
import SearchBar from "../components/SearchBar";
import { TrendingUp, TrendingDown, Activity, Sparkles, Zap, Shield, Search, Globe, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [market, setMarket] = useState<any>(null);

  useEffect(() => {
    fetchMarket().then(setMarket);
  }, []);

  const getInitials = (symbol: string) => symbol.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-12 pt-10">
        
        {/* Hero Section */}
        <div className="relative rounded-[2.5rem] p-10 md:p-16 bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-50/30 rounded-full blur-3xl -ml-20 -mb-20" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Indian Markets Live
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
               Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Intelligence</span>
            </h1>
            
            <p className="text-lg text-slate-400 font-medium mb-10 max-w-2xl leading-relaxed">
              Unlock the power of real-time insights, AI-driven stock predictions, and advanced analytics for the Indian ecosystem.
            </p>
            
            <div className="w-full max-w-xl z-50 mb-12">
               <SearchBar />
            </div>

            <div className="flex flex-wrap justify-center gap-6 opacity-60">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Sparkles size={14} className="text-indigo-500" /> AI Insights</div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Zap size={14} className="text-indigo-500" /> Live Data</div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Shield size={14} className="text-indigo-500" /> Robust Tracking</div>
            </div>
          </div>
        </div>

        {/* Indices Section */}
        {market && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Globe size={14} className="text-slate-300" /> Indian Indices
               </p>
               <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                 <Clock size={12} /> Refreshed Real-time
               </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {market.indices?.map((i: any) => (
                <div key={i.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md hover:border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${i.percent >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                       <p className="text-[10px] font-black uppercase tracking-tighter opacity-40">{i.name.substring(0, 2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{i.name}</p>
                      <p className="text-3xl font-extrabold text-slate-900 tracking-tight">₹{i.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-extrabold text-sm flex items-center gap-1.5 ${
                    i.percent >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}>
                    {i.percent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {i.percent >= 0 ? "+" : ""}{i.percent}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Movers Section */}
        {market && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Top Gainers */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                   <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                   Day's Top Gainers
                </h2>
                <TrendingUp size={20} className="text-emerald-500 opacity-20" />
              </div>
              
              <div className="space-y-4">
                {market.top_gainers?.map((stock: any, index: number) => (
                  <Link to={`/stock/${stock.symbol}`} key={stock.symbol} className="group flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-slate-100 rounded-2xl transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100/50 flex items-center justify-center text-emerald-700 font-bold text-xs">
                        {getInitials(stock.symbol)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 leading-tight">{stock.symbol}</p>
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">NSE: {stock.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900">₹{stock.price.toLocaleString()}</p>
                      <p className="text-emerald-600 font-bold text-[13px] flex items-center justify-end gap-1">
                         <TrendingUp size={12} /> +{stock.percent}%
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                   <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                   Day's Top Losers
                </h2>
                <TrendingDown size={20} className="text-rose-500 opacity-20" />
              </div>

              <div className="space-y-4">
                {market.top_losers?.map((stock: any) => (
                  <Link to={`/stock/${stock.symbol}`} key={stock.symbol} className="group flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-slate-100 rounded-2xl transition-all duration-300">
                     <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-rose-100/50 flex items-center justify-center text-rose-700 font-bold text-xs">
                        {getInitials(stock.symbol)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 leading-tight">{stock.symbol}</p>
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">NSE: {stock.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900">₹{stock.price.toLocaleString()}</p>
                      <p className="text-rose-600 font-bold text-[13px] flex items-center justify-end gap-1">
                        <TrendingDown size={12} /> {stock.percent}%
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}