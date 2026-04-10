import React, { useState, useMemo, useRef } from 'react';
import { STOCKS } from '../../data/stocks';
import { fetchStock } from '../../services/api';

interface ManagePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (asset: any) => void;
  onLoadDemo: () => void;
}

type TabType = 'manual' | 'upload' | 'demo';

const ManagePortfolioModal: React.FC<ManagePortfolioModalProps> = ({
  isOpen,
  onClose,
  onAddAsset,
  onLoadDemo,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('manual');

  // Manual Form State
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredStocks = useMemo(() => {
    if (!symbol.trim()) return [];
    const lowerQuery = symbol.toLowerCase();
    return STOCKS.filter(s =>
      s.symbol.toLowerCase().includes(lowerQuery) ||
      s.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  }, [symbol]);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !quantity || !buyPrice) return;
    setLoading(true);
    setError(null);

    try {
      // Validate price against historical range
      const data = await fetchStock(symbol);
      const price = Number(buyPrice);
      const high = data.fiftyTwoWeekHigh || price * 1.5;
      const low = data.fiftyTwoWeekLow || price * 0.5;

      if (price > high * 2 || price < low * 0.25) {
        setError(`Unrealistic buy price for ${symbol}. Historical range: ₹${low} - ₹${high}. Please verify.`);
        setLoading(false);
        return;
      }

      onAddAsset({
        type: 'STOCK',
        symbol: symbol.toUpperCase(),
        quantity: Number(quantity),
        buyPrice: price
      });
      setSymbol('');
      setQuantity('');
      setBuyPrice('');
      onClose();
    } catch (err) {
      setError("Failed to validate stock. Please check the symbol.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            data.forEach(item => onAddAsset({
              type: 'STOCK',
              symbol: item.symbol,
              quantity: Number(item.quantity),
              buyPrice: Number(item.buyPrice)
            }));
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const headers = lines[0].toLowerCase().split(',');
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const row = lines[i].split(',');
            const item: any = {};
            headers.forEach((h, idx) => item[h.trim()] = row[idx]?.trim());
            onAddAsset({
              type: 'STOCK',
              symbol: item.symbol,
              quantity: Number(item.quantity || item.qty),
              buyPrice: Number(item.buyprice || item.price || item.avg_price)
            });
          }
        }
        onClose();
      } catch (err) {
        alert("Failed to parse file. Ensure it's valid CSV or JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Manage Stocks</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5 uppercase tracking-wide">Update your learning portfolio</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-slate-100">
          {(['manual', 'upload', 'demo'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-4 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stock Symbol</label>
                <input
                  required
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  placeholder="e.g. RELIANCE or HDFCBANK"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                />
                {isFocused && filteredStocks.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto left-0 overflow-hidden">
                    {filteredStocks.map(s => (
                      <button
                        key={s.symbol}
                        type="button"
                        onClick={() => setSymbol(s.symbol)}
                        className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                      >
                        <div className="font-bold text-slate-800 text-sm">{s.symbol}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">{s.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantity</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Buy Price</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    value={buyPrice}
                    onChange={e => setBuyPrice(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {error && <p className="text-xs font-semibold text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:bg-slate-200"
              >
                {loading ? 'Validating...' : 'Add to Portfolio'}
              </button>
            </form>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-200 rounded-3xl py-12 px-8 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                   <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-700">Drop your file or Click to Browse</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Supports CSV and JSON exports</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Expected CSV Columns</p>
                <code className="text-[10px] text-indigo-500 font-mono font-bold">symbol, quantity, buyPrice</code>
              </div>
            </div>
          )}

          {activeTab === 'demo' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Seed Stock Data</h3>
              <p className="text-sm text-slate-400 font-medium mt-2 leading-relaxed max-w-[280px] mx-auto">
                Instantly load a balanced portfolio of top Indian Stocks to explore the dashboard.
              </p>
              <button
                onClick={() => { onLoadDemo(); onClose(); }}
                className="mt-8 px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-100"
              >
                Populate Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePortfolioModal;
