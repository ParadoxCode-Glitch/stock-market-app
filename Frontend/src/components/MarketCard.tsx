interface Props {
  name: string;
  price: number;
  percent: number;
}

export default function MarketCard({ name, price, percent }: Props) {
  const isPositive = percent >= 0;

  return (
    <div className="p-4 border rounded-xl shadow-sm bg-white">
      <h3 className="font-semibold text-gray-700">{name}</h3>
      <p className="text-lg">₹{price}</p>
      <p className={isPositive ? "text-green-600" : "text-red-600"}>
        {percent}%
      </p>
    </div>
  );
}