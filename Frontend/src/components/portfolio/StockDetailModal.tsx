import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchStockHistory } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Filler);

interface StockDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: {
    symbol: string;
    name: string;
    currentValue: number;
    buyPrice: number;
    currentPrice: number;
    quantity: number;
    returns: number;
    returnsPercent: number;
  };
}

export default function StockDetailModal({ isOpen, onClose, holding }: StockDetailModalProps) {
  const [history, setHistory] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const isUp = holding.returns >= 0;

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchStockHistory(holding.symbol)
        .then(data => {
          setHistory(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch history:", err);
          setLoading(false);
        });
    }
  }, [isOpen, holding.symbol]);

  if (!isOpen) return null;

  const labels = history?.labels || [];
  const values = history?.values || [];

  const mainColor = isUp ? "#10b981" : "#ef4444";
  
  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: mainColor,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "transparent";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, isUp ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)");
          gradient.addColorStop(1, "rgba(255,255,255,0)");
          return gradient;
        },
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => ` ₹${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: { display: false },
      y: { 
        position: 'right' as const,
        grid: { color: "rgba(0,0,0,0.03)" },
        ticks: { font: { size: 10 } }
      },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{holding.symbol}</h2>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isUp ? 'Profit' : 'Loss'}
              </span>
            </div>
            <p className="text-sm text-slate-400 font-medium truncate max-w-md">{holding.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Value</p>
              <p className="text-xl font-bold text-slate-800">₹{holding.currentValue.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Buy Price</p>
              <p className="text-xl font-bold text-slate-800">₹{holding.buyPrice.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Returns</p>
              <p className={`text-xl font-bold ${isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
                {isUp ? '+' : ''}₹{holding.returns.toLocaleString("en-IN")}
                <span className="text-xs ml-1.5 font-semibold">({holding.returnsPercent.toFixed(2)}%)</span>
              </p>
            </div>
          </div>

          <div className="h-64 relative bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
             <Line data={chartData} options={options as any} />
          </div>

          <div className="mt-8 flex justify-between items-center bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-5">
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Quantity</p>
                <p className="font-bold text-indigo-900">{holding.quantity}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Weightage</p>
                <p className="font-bold text-indigo-900">{(holding.currentValue / 100).toFixed(1)}%</p>
              </div>
            </div>
            <p className="text-xs text-indigo-400 italic font-medium max-w-[240px] text-right">
              Real-time 30-day historical performance from market data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
