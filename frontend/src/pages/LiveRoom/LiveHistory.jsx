import React, { useState, useEffect } from "react";
import axios from "axios";

const LiveHistory = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/results/student/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        setResults(data.results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.id]);

  if (loading) return <div className="p-10 text-center">Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <h1 className="text-3xl font-black mb-8">Performance History</h1>
      
      <div className="grid gap-6">
        {results.length === 0 ? (
          <div className="p-10 bg-white dark:bg-slate-800 rounded-2xl text-center">
            No live tests participated in yet.
          </div>
        ) : (
          results.map((res, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex justify-between items-center border-l-4 border-indigo-500">
              <div>
                <h3 className="text-xl font-bold mb-1">{res.testName}</h3>
                <p className="text-slate-500 text-sm">
                  {new Date(res.date).toLocaleDateString()} • Code: {res.roomCode}
                </p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-xs text-slate-400 uppercase font-bold mb-1">Score</div>
                  <div className="text-3xl font-black">{res.score}</div>
                </div>
                <div className="text-center">
                   <div className="text-xs text-slate-400 uppercase font-bold mb-1">Growth</div>
                   <div className="text-3xl">
                     {res.growth === "increase" ? "📈" : res.growth === "decrease" ? "📉" : "➖"}
                   </div>
                </div>
                {res.badge && (
                  <div className="text-center">
                    <div className="text-xs text-slate-400 uppercase font-bold mb-1">Badge</div>
                    <div className="text-3xl">{res.badge === "Gold" ? "🥇" : res.badge === "Silver" ? "🥈" : "🥉"}</div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveHistory;
