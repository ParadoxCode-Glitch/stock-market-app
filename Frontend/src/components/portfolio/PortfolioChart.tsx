import { useState, useEffect, useRef } from "react";
import { fetchPortfolioHistory } from "../../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export interface HoldingForChart {
  symbol: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
}

interface Props {
  holdings: HoldingForChart[];
  totalInvested: number;
  totalCurrent: number;
  activeRange: "1M" | "3M" | "6M" | "1Y";
  onRangeChange: (r: "1M" | "3M" | "6M" | "1Y") => void;
}

const PERIOD_MAP: Record<string, string> = { "1M": "1mo", "3M": "3mo", "6M": "6mo", "1Y": "1y" };
const RANGES: Array<"1M" | "3M" | "6M" | "1Y"> = ["1M", "3M", "6M", "1Y"];

export default function PortfolioChart({
  holdings,
  totalCurrent,
  totalInvested,
  activeRange,
  onRangeChange,
}: Props) {
  const isUp = totalCurrent >= totalInvested;
  const chartRef = useRef<any>(null);
  
  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (holdings.length === 0) {
        setLabels([]);
        setValues([]);
        return;
    }

    setChartLoading(true);
    fetchPortfolioHistory(holdings, PERIOD_MAP[activeRange])
      .then((res) => {
        if (!active) return;
        if (res.labels && res.values) {
            setLabels(res.labels);
            setValues(res.values);
        }
        setChartLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Chart history error:", err);
        setChartLoading(false);
      });

    return () => { active = false; };
  }, [holdings, activeRange]);

  const mainColor = isUp ? "#10b981" : "#ef4444";
  const gradTop = isUp ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)";
  const gradBot = isUp ? "rgba(16,185,129,0)" : "rgba(239,68,68,0)";

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: mainColor,
        borderWidth: 2.5,
        tension: 0.45,
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "transparent";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, gradTop);
          gradient.addColorStop(1, gradBot);
          return gradient;
        },
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: mainColor,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#94a3b8",
        bodyColor: "#f1f5f9",
        padding: 12,
        cornerRadius: 10,
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) =>
            `  ₹${ctx.parsed.y.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 11, family: "'Inter', sans-serif" },
          maxTicksLimit: 7,
          maxRotation: 0,
        },
      },
      y: {
        position: "right" as const,
        grid: { color: "rgba(148,163,184,0.08)" },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 11, family: "'Inter', sans-serif" },
          callback: (v: any) => `₹${(v / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Portfolio Value
        </p>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
                activeRange === r
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: "210px", position: "relative" }}>
        {chartLoading && (
           <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center transition-all">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
           </div>
        )}
        <Line ref={chartRef} data={chartData} options={options as any} />
      </div>
    </div>
  );
}
