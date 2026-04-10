import { useEffect, useState, memo } from "react";
import { fetchStockHistory, fetchPrediction } from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { TrendingUp } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function StockChart({ symbol }: { symbol: string }) {
  const [history, setHistory] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [period, setPeriod] = useState("1mo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [histData, predData] = await Promise.all([
          fetchStockHistory(symbol, period),
          fetchPrediction(symbol),
        ]);
        setHistory(histData);
        setPrediction(predData);
      } catch (err) {
        console.error("Chart load failed:", err);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) loadData();
  }, [symbol, period]);

  const periods = [
    { label: "1M", value: "1mo" },
    { label: "3M", value: "3mo" },
    { label: "6M", value: "6mo" },
    { label: "1Y", value: "1y" },
  ];

  const histLabels: string[] = history?.labels || [];
  const histValues: number[] = history?.values || [];
  const forecastValues: number[] = prediction?.forecast || [];

  // Generate real date labels for forecast days
  const forecastLabels = forecastValues.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  });

  const allLabels = [...histLabels, ...forecastLabels];

  // Forecast dataset: null for all hist except last point, then actual forecasts
  const forecastDataset = [
    ...Array(Math.max(0, histValues.length - 1)).fill(null),
    histValues.length > 0 ? histValues[histValues.length - 1] : null,
    ...forecastValues,
  ];

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: "Historical Price",
        data: [...histValues, ...Array(forecastValues.length).fill(null)],
        borderColor: "#4f46e5",
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(79, 70, 229, 0.12)");
          gradient.addColorStop(1, "rgba(79, 70, 229, 0)");
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
      {
        label: "AI Transformer Forecast",
        data: forecastDataset,
        borderColor: "#10b981",
        borderDash: [5, 5],
        pointRadius: (ctx: any) => (ctx.dataIndex >= histValues.length ? 4 : 0),
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.3,
        borderWidth: 2,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(255, 255, 255, 0.97)",
        titleColor: "#0f172a",
        bodyColor: "#475569",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => {
            if (context.parsed.y === null) return "";
            return ` ₹${context.parsed.y.toLocaleString("en-IN")}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 0,
          maxTicksLimit: 12,
        },
      },
      y: {
        grid: { color: "#f8fafc" },
        ticks: {
          color: "#94a3b8",
          font: { size: 10 },
          callback: (val: any) => `₹${Number(val).toLocaleString("en-IN")}`,
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-50">
        <div className="flex items-center gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                period === p.value
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            Historical
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            AI Forecast
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full px-2">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : histValues.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
            No historical price data available for this symbol.
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}

export default memo(StockChart);