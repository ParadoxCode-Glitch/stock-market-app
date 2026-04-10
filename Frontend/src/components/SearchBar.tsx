import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { STOCKS } from "../data/stocks";

export default function SearchBar() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<typeof STOCKS>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!input) return setResults([]);

    const filtered = STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(input.toLowerCase()) ||
        s.name.toLowerCase().includes(input.toLowerCase())
    );

    setResults(filtered.slice(0, 5));
  }, [input]);

  return (
    <div className="relative flex flex-col items-center mt-6">
      <input
        className="w-1/2 p-3 border rounded-xl"
        placeholder="Search stocks..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {results.length > 0 && (
        <div className="absolute top-14 w-1/2 bg-white border rounded-xl shadow">
          {results.map((s) => (
            <div
              key={s.symbol}
              className="p-3 hover:bg-gray-100 cursor-pointer"
              onClick={() => navigate(`/stock/${s.symbol}`)}
            >
              <p>{s.symbol}</p>
              <p className="text-sm text-gray-500">{s.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}