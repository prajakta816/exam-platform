import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { Trophy, Medal, UserCircle, Loader2 } from "lucide-react";

const LeaderboardTable = ({ quizId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (quizId) {
      fetchLeaderboard();
    }
  }, [quizId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/attempt/leaderboard/${quizId}`);
      setLeaderboard(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-center">
        <p className="text-amber-700 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-6 text-white flex items-center justify-between">
        <h3 className="text-xl font-black flex items-center gap-2">
          <Trophy size={24} /> Hall of Fame
        </h3>
        <span className="text-sm font-bold bg-white/20 px-4 py-1 rounded-full backdrop-blur-md">
          {leaderboard.length} Attempts
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Rank</th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Student</th>
              <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Score</th>
              <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {leaderboard.map((item, index) => (
              <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full font-black text-sm">
                    {index === 0 ? <Medal className="text-amber-400" size={24} /> :
                     index === 1 ? <Medal className="text-slate-400" size={24} /> :
                     index === 2 ? <Medal className="text-amber-700" size={24} /> :
                     <span className="text-slate-400">{index + 1}</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                      {item.user?.profilePic ? (
                        <img src={`http://localhost:5000/${item.user.profilePic}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="text-indigo-200" size={24} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.user?.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-black text-indigo-600 text-lg">{item.score}</span>
                  <span className="text-slate-300 mx-1">/</span>
                  <span className="text-slate-400 font-bold">{item.totalQuestions}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black">
                    {Math.round(item.percentage)}%
                  </div>
                </td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">
                  No attempts recorded yet. Be the first!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;
