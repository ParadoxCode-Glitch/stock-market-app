import { useState } from "react";

export interface HoldingRow {
  symbol: string;
  name: string;
  category: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  currentValue: number;
  returns: number;
  returnsPercent: number;
}

interface Props {
  holdings: HoldingRow[];
  onDelete: (symbol: string) => void;
  onViewChart: (symbol: string) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function HoldingsTable({ holdings, onDelete, onViewChart }: Props) {
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);

  if (holdings.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm font-medium">No holdings yet</p>
        <p className="text-slate-300 text-xs mt-1">Add stocks to your portfolio to track them here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {[
              "Stock Name",
              "Qty",
              "Avg Price",
              "Current Price",
              "Current Value",
              "Impact %",
              "Returns",
              "Actions"
            ].map((label) => (
              <th
                key={label}
                className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {holdings.map((h, i) => {
            const isProfit = h.returns >= 0;
            const impact = totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0;
            return (
              <tr
                key={i}
                className="group hover:bg-slate-50 transition-colors duration-100 rounded-xl"
              >
                {/* Stock Name */}
                <td className="py-4 px-4">
                  <p className="font-semibold text-slate-800">{h.symbol}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{h.name || h.symbol}</p>
                </td>

                {/* Qty */}
                <td className="py-4 px-4 text-slate-600 font-medium">{h.quantity}</td>

                {/* Avg Price */}
                <td className="py-4 px-4 text-slate-600">₹{fmt(h.buyPrice)}</td>

                {/* Current Price */}
                <td className="py-4 px-4 font-medium text-slate-800">₹{fmt(h.currentPrice)}</td>

                {/* Current Value */}
                <td className="py-4 px-4 font-semibold text-slate-800">
                  ₹{fmt(h.currentValue)}
                </td>

                {/* Impact % */}
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-1.5 min-w-[100px]">
                    <span className="text-xs font-bold text-slate-700">{impact.toFixed(1)}%</span>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${impact}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Returns */}
                <td className="py-4 px-4">
                  <p
                    className={`font-semibold ${
                      isProfit ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {isProfit ? "+" : ""}₹{fmt(h.returns)}
                  </p>
                  <p
                    className={`text-xs mt-0.5 font-medium ${
                      isProfit ? "text-emerald-500" : "text-red-400"
                    }`}
                  >
                    {isProfit ? "▲" : "▼"} {Math.abs(h.returnsPercent).toFixed(2)}%
                  </p>
                </td>

                {/* Actions */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onViewChart(h.symbol)}
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="View Analysis"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onDelete(h.symbol)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Remove from Portfolio"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
