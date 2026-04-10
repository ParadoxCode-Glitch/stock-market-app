import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useState } from "react";

ChartJS.register(ArcElement, Tooltip, Legend);

interface StockHolding {
  symbol: string;
  name: string;
  currentValue: number;
}

interface Props {
  holdings: StockHolding[];
}

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#3b82f6"
];

export default function AllocationDonut({ holdings }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  
  // Sort by value to keep it clean, maybe take top 5 and "Others"
  const sorted = [...holdings].sort((a, b) => b.currentValue - a.currentValue);
  const displayStocks = sorted.slice(0, 7);
  if (sorted.length > 7) {
    const othersVal = sorted.slice(7).reduce((s, h) => s + h.currentValue, 0);
    displayStocks.push({ symbol: "OTHERS", name: "Other Stocks", currentValue: othersVal });
  }

  const data = {
    labels: displayStocks.map((s) => s.symbol),
    datasets: [
      {
        data: displayStocks.map((s) => s.currentValue),
        backgroundColor: COLORS.slice(0, displayStocks.length),
        borderWidth: 2,
        borderColor: "#ffffff",
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    onHover: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        setHoveredIndex(elements[0].index);
      } else {
        setHoveredIndex(null);
      }
    }
  };

  const activeItem = hoveredIndex !== null ? displayStocks[hoveredIndex] : displayStocks[0];
  const activePct = activeItem ? ((activeItem.currentValue / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="h-full flex flex-col">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
        Stock Allocation
      </p>

      <div className="flex items-center gap-6 flex-1">
        <div className="relative flex-shrink-0" style={{ width: 150, height: 150 }}>
          <Doughnut data={data} options={options as any} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {activeItem && (
              <>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-0.5">
                  {activeItem.symbol}
                </span>
                <span className="text-xl font-extrabold text-slate-800 leading-none">
                  {activePct}%
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
          {displayStocks.map((item, i) => (
            <div 
              key={item.symbol} 
              className={`flex items-center gap-3 transition-opacity ${hoveredIndex !== null && hoveredIndex !== i ? 'opacity-40' : 'opacity-100'}`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate leading-none">{item.symbol}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {((item.currentValue / total) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
