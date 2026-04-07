import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

export default function Rank() {
  const { id } = useParams();
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchRank();
  }, []);

  const fetchRank = async () => {
    const res = await API.get(`/attempt/leaderboard/${id}`);
    setData(res.data);
  };

  return (
    <div>
      <h2>Ranking</h2>

      {data.map((item, index) => (
        <div key={index}>
          <p>
            {index + 1}. {item.user.name} - {item.score}
          </p>
        </div>
      ))}
    </div>
  );
}