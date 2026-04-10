import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function FinancialChart({ data }: any) {
  const chartData = {
    labels: data.map((d: any) => d.date),
    datasets: [
      { 
        label: "Revenue", 
        data: data.map((d: any) => d.revenue),
        borderColor: "rgb(53, 162, 235)"
      },
      { 
        label: "Profit", 
        data: data.map((d: any) => d.profit),
        borderColor: "rgb(255, 99, 132)"
      }
    ]
  };

  return <Line data={chartData} />;
}