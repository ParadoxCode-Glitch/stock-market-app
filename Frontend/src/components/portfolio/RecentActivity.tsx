const ACTIVITY_COLORS = {
  BUY: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Buy" },
  SELL: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400", label: "Sell" },
};

type ActivityType = "BUY" | "SELL";

interface Activity {
  type: ActivityType;
  asset: string;
  date: string;
  amount: number;
}

// Pre-seeded realistic mock activity (read-only — no trading actions)
const DEFAULT_ACTIVITY: Activity[] = [
  { type: "BUY",      asset: "RELIANCE",   date: "2025-01-06", amount: 245000 },
  { type: "BUY",      asset: "TCS",        date: "2025-01-22", amount: 16050   },
  { type: "BUY",      asset: "INFY",       date: "2025-02-04", amount: 89300  },
  { type: "SELL",     asset: "HDFC",       date: "2025-02-18", amount: 134500 },
  { type: "BUY",      asset: "TATAMOTORS", date: "2025-03-03", amount: 32000    },
  { type: "BUY",      asset: "WIPRO",      date: "2025-03-14", amount: 52400  },
  { type: "SELL",     asset: "BAJFINANCE", date: "2025-03-28", amount: 78200  },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

import { useState, useEffect } from "react";

export default function RecentActivity({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("portfolio_activity");
    if (raw) {
      try {
        setActivity(JSON.parse(raw));
      } catch (e) {
        setActivity(DEFAULT_ACTIVITY);
      }
    } else {
      setActivity(DEFAULT_ACTIVITY);
    }
  }, [refreshTrigger]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Recent Activity
        </p>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 320 }}>
        {activity.map((item, i) => {
          const style = ACTIVITY_COLORS[item.type];
          return (
            <div
              key={i}
              className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              {/* Dot */}
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text} uppercase tracking-wide`}
                  >
                    {style.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 truncate">{item.asset}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{formatDate(item.date)}</p>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${style.text}`}>
                  {item.type === "SELL" ? "−" : "+"}
                  ₹{item.amount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
