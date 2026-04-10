import { Link, useLocation } from "react-router-dom";
import { BarChart2, GitCompare, Briefcase, TrendingUp } from "lucide-react";

const NAV_LINKS = [
  { to: "/home", label: "Dashboard", icon: TrendingUp },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100/80 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <BarChart2 size={16} className="text-white" />
          </div>
          <span className="font-black text-slate-900 tracking-tight text-lg">StockApp</span>
        </Link>

        {/* Links & Refresh */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                    active
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </div>
          
          <div className="h-6 w-px bg-slate-200"></div>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
            title="Refresh Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </nav>
  );
}