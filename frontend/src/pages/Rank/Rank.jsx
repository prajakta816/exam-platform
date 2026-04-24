import { useParams, Link } from "react-router-dom";
import LeaderboardTable from "../../components/Leaderboard/LeaderboardTable";
import { ArrowLeft } from "lucide-react";

export default function Rank() {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quiz Rankings</h2>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-xs">Performance Analysis</p>
        </div>
        <Link to="/board" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-black transition-all group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Board
        </Link>
      </div>

      <LeaderboardTable quizId={id} />
      
      <div className="mt-12 p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 text-center">
        <h4 className="text-lg font-black text-indigo-900 mb-2">Want to improve your rank?</h4>
        <p className="text-indigo-600 font-medium mb-6">Review the notes associated with this creator and try again!</p>
        <Link to="/notes" className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          Browse Study Notes
        </Link>
      </div>
    </div>
  );
}
