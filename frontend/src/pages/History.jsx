import { useEffect, useState } from "react";
import API from "../services/api";

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const res = await API.get("/attempt/history");
    setHistory(res.data);
  };

  return (
    <div>
      <h2>History</h2>

      {history.map((h) => (
        <div key={h._id}>
          <p>
            {h.quiz.title} - Score: {h.score} ({h.percentage}%)
          </p>
        </div>
      ))}
    </div>
  );
}