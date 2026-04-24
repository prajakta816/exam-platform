import './History.css';
import { useEffect, useState } from "react";
import API from "../../services/api";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await API.get("/attempt/history");
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">Attempt History</h2>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">You haven't attempted any quizzes yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-xl border border-gray-100">
          <ul className="divide-y divide-gray-200">
            {history.map((h) => (
              <li key={h._id}>
                <div className="px-4 py-5 sm:px-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-indigo-600 truncate">{h.quiz?.title || 'Unknown Quiz'}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full 
                        ${h.percentage >= 80 ? 'bg-green-100 text-green-800' : 
                          h.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {h.percentage?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between items-center">
                    <div className="sm:flex flex-col">
                      <p className="text-sm font-bold text-gray-700">
                        Score: {h.score} / {h.totalQuestions}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Attempted on {new Date(h.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {h.feedback && (
                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-sm font-medium text-indigo-700 italic relative">
                      <span className="absolute -top-2 left-4 bg-white px-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Feedback</span>
                      "{h.feedback}"
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
