interface Props {
  symbol: string;
  price: number;
  percent: number;
}

export default function StockMoverCard({
  symbol,
  price,
  percent,
}: Props) {
  const isPositive = percent >= 0;

  return (
    <div className="p-3 border rounded-xl shadow-sm bg-white">
      <p className="font-medium">{symbol}</p>
      <p>{"₹"}{price}</p>
      <p className={isPositive ? "text-green-600" : "text-red-600"}>
        {percent}%
      </p>
    </div>
  );
}