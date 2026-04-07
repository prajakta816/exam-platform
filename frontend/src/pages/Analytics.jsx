import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import API from "../services/api";

export default function Analytics() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await API.get("/attempt/history");
    setData(res.data);
  };

  const chartData = {
    labels: data.map((d) => d.quiz.title),
    datasets: [
      {
        label: "Score",
        data: data.map((d) => d.score),
      },
    ],
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📊 Performance</h2>
      <Bar data={chartData} />
    </div>
  );
}