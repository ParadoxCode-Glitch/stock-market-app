import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, BarChart2, ShieldAlert, ExternalLink, 
  AlertTriangle, ChevronRight, Activity, Cpu
} from "lucide-react";

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  delay: Math.random() * 4,
  duration: Math.random() * 6 + 8,
}));

const TICKER_SYMBOLS = ["RELIANCE", "HDFCBANK", "TCS", "INFY", "ICICIBANK", "WIPRO", "SBIN", "BAJFINANCE", "HINDUNILVR", "AXISBANK"];

export default function LandingPage() {
  const navigate = useNavigate();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIdx(prev => (prev + 1) % TICKER_SYMBOLS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => setShowDisclaimer(true);

  const handleAgree = () => {
    setAgreed(true);
    sessionStorage.setItem("disclaimer_accepted", "true");
    setTimeout(() => navigate("/home"), 600);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] relative overflow-hidden flex items-center justify-center">
      
      {/* Animated Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />
      
      {/* Animated Particles */}
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-400/40"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ delay: p.delay, duration: p.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Scrolling Ticker Strip */}
      <div className="absolute top-0 left-0 right-0 h-9 bg-indigo-950/60 border-b border-indigo-500/10 backdrop-blur-sm overflow-hidden flex items-center">
        <motion.div
          className="flex gap-10 whitespace-nowrap"
          animate={{ x: [0, -800] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {[...TICKER_SYMBOLS, ...TICKER_SYMBOLS, ...TICKER_SYMBOLS].map((sym, i) => (
            <span key={i} className="text-[10px] font-black tracking-widest text-indigo-400/60 uppercase pr-8 border-r border-indigo-500/10">
              {sym} <span className="text-indigo-500/40">NSE</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Main Content */}
      <AnimatePresence>
        {!showDisclaimer && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30, scale: 0.96 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-center max-w-3xl px-8"
          >
            {/* Logo Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-10"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[11px] font-black tracking-[0.25em] uppercase text-indigo-300">
                NSE · BSE · Indian Markets
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="text-6xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4"
            >
              Market
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                Intelligence
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-base text-slate-400 leading-relaxed mb-12 max-w-lg mx-auto font-medium"
            >
              A quantitative research dashboard for Indian equities. 
              Powered by real-time data, AI sentiment, and Transformer-based forecasting.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mb-12"
            >
              {[
                { icon: TrendingUp, label: "Live Price Feeds" },
                { icon: Cpu, label: "Transformer AI" },
                { icon: Activity, label: "NLP Sentiment" },
                { icon: BarChart2, label: "Portfolio Tracker" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/8 rounded-2xl text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <Icon size={13} className="text-indigo-400" />
                  {label}
                </div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGetStarted}
              id="get-started-btn"
              className="group relative inline-flex items-center gap-3 px-10 py-4.5 text-sm font-black uppercase tracking-widest text-white rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/20"
              style={{ paddingTop: "14px", paddingBottom: "14px" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">Get Started</span>
              <ChevronRight size={16} className="relative transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>

            {/* Bottom Note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest"
            >
              For educational purposes only · Not financial advice
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && !agreed && (
          <motion.div
            key="disclaimer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[#0a0f1e]/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-xl w-full"
            >
              {/* Card */}
              <div className="relative bg-[#111827] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/60">
                {/* Top Accent Bar */}
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
                
                {/* Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                
                <div className="relative p-8 space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                      <ShieldAlert size={22} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black tracking-[0.25em] uppercase text-amber-400/70 mb-1">
                        Important Notice
                      </div>
                      <h2 className="text-xl font-black text-white tracking-tight leading-tight">
                        Risk & Disclaimer
                      </h2>
                    </div>
                  </div>

                  {/* Disclaimer Body */}
                  <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
                    <div className="flex gap-3">
                      <AlertTriangle size={15} className="text-amber-400/70 mt-0.5 shrink-0" />
                      <p>
                        <span className="font-bold text-slate-200">Student Project:</span> This platform was built as an academic learning exercise. It is <span className="text-amber-300 font-semibold">not a registered investment advisory</span> service and should not be treated as one.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <AlertTriangle size={15} className="text-amber-400/70 mt-0.5 shrink-0" />
                      <p>
                        <span className="font-bold text-slate-200">Do Your Own Research:</span> All data, charts, and AI-generated insights are for <span className="text-amber-300 font-semibold">informational purposes only</span>. Always conduct independent due diligence before making any investment decisions.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <AlertTriangle size={15} className="text-amber-400/70 mt-0.5 shrink-0" />
                      <p>
                        <span className="font-bold text-slate-200">Free-Tier Resources:</span> This app uses free-tier APIs and data sources. Some information may be <span className="text-amber-300 font-semibold">delayed, incomplete, or occasionally inaccurate</span>. Real-time trading data requires professional platforms.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <AlertTriangle size={15} className="text-amber-400/70 mt-0.5 shrink-0" />
                      <p>
                        <span className="font-bold text-slate-200">No Liability:</span> The creator accepts no responsibility for any financial losses resulting from decisions made based on this platform's content.
                      </p>
                    </div>
                  </div>

                  {/* Resources Note */}
                  <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex gap-3 items-start">
                    <ExternalLink size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      For professional-grade market analysis, consider SEBI-registered advisors or platforms like NSE/BSE official portals, Zerodha Varsity, or Bloomberg Terminal.
                    </p>
                  </div>

                  {/* Agreement Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAgree}
                    id="accept-disclaimer-btn"
                    className="w-full relative py-4 text-sm font-black uppercase tracking-widest text-white rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/15"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600" />
                    <span className="relative flex items-center justify-center gap-2">
                      I Understand & Agree
                      <ChevronRight size={15} />
                    </span>
                  </motion.button>

                  <p className="text-center text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                    Clicking agree confirms you have read and understood all terms above
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agreed Transition */}
      <AnimatePresence>
        {agreed && (
          <motion.div
            key="transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] bg-[#0a0f1e] flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                Loading Dashboard
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
