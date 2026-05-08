import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../services/api";
import LeaderboardTable from "../../components/Leaderboard/LeaderboardTable";
import { ArrowLeft, BookOpen, CheckCircle, Info, Trophy, Medal } from "lucide-react";

export default function Rank() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAttempt, setUserAttempt] = useState(null);
  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    fetchQuizDetails();
  }, [id]);

  useEffect(() => {
    if (quiz) {
      fetchUserAttempt();
    }
  }, [id, quiz?.title]);

  const fetchQuizDetails = async () => {
    try {
      const res = await API.get(`/quiz/${id}`);
      setQuiz(res.data);
    } catch (err) {
      console.error("Failed to fetch quiz details", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAttempt = async () => {
    const userId = user?.id || user?._id;
    if (!userId) {
      console.warn("User ID not found in session");
      return;
    }

    try {
      // 1. Try fetching from standalone Quizzes
      const res = await API.get("/attempt/my-attempts");
      let myAttempt = Array.isArray(res.data) 
        ? res.data.find(a => a.quizId?._id === id || a.quizId === id)
        : null;
      
      // 2. If not found, fetch from Live Sessions
      if (!myAttempt) {
        const studentRes = await API.get(`/results/student/${userId}`);
        const results = studentRes.data.results || [];
        
        myAttempt = results.find(r => 
          (r.quizId && (r.quizId === id || r.quizId?._id === id)) || 
          (quiz?.roomCode && r.roomCode === quiz.roomCode) ||
          (quiz?.title && r.testName?.toLowerCase() === quiz.title?.toLowerCase())
        );
      }

      if (myAttempt) setUserAttempt(myAttempt);
    } catch (err) {
      console.error("Failed to fetch user attempt:", err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {quiz?.title || "Quiz Rankings"}
          </h2>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-xs">
            {userAttempt ? "Your Review & Analysis" : "Performance Analysis"}
          </p>
        </div>
        <Link to="/board" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-black transition-all group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Board
        </Link>
      </div>

      {userAttempt && (
        <div className="mb-10 p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
              <Trophy size={40} className="text-yellow-300" />
            </div>
            <div>
              <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-1">Your Performance</p>
              <h3 className="text-3xl font-black">{userAttempt.score} / {quiz?.questions?.length} Correct</h3>
            </div>
          </div>
          <div className="text-center md:text-right">
             <div className="text-4xl font-black mb-1">{Math.round((userAttempt.score / (quiz?.questions?.length || 1)) * 100)}%</div>
             <div className="text-indigo-100 font-bold text-xs uppercase tracking-widest">Accuracy Score</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Leaderboard */}
        <div className="lg:col-span-2">
          <LeaderboardTable quizId={id} />
        </div>

        {/* Right Side: Quick Stats / Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Info size={20} className="text-indigo-600" /> Quiz Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Difficulty</span>
                <span className="font-bold text-indigo-600">{quiz?.difficulty}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Total Questions</span>
                <span className="font-bold text-slate-800">{quiz?.questions?.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Timer</span>
                <span className="font-bold text-slate-800">{quiz?.timer} mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Analysis Section */}
      <div className="mt-12">
        <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <CheckCircle className="text-emerald-500" size={28} /> Question Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quiz?.questions?.map((q, index) => {
            const studentAnswer = userAttempt?.answers?.[index];
            const isCorrect = studentAnswer === q.correctAnswer;

            return (
              <div key={index} className={`bg-white p-6 rounded-3xl border transition-all ${isCorrect ? 'border-emerald-100' : studentAnswer !== undefined ? 'border-red-100' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${isCorrect ? 'bg-emerald-100 text-emerald-600' : studentAnswer !== undefined ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-slate-800 leading-tight">{q.question}</h4>
                  </div>
                  {studentAnswer !== undefined && (
                    <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrectOption = optIdx === q.correctAnswer;
                    const isStudentChoice = optIdx === studentAnswer;

                    let bgColor = "bg-slate-50 border-transparent text-slate-500";
                    if (isCorrectOption) bgColor = "bg-emerald-50 border-emerald-100 text-emerald-700 font-bold";
                    if (isStudentChoice && !isCorrectOption) bgColor = "bg-red-50 border-red-200 text-red-700 font-bold";

                    return (
                      <div 
                        key={optIdx} 
                        className={`p-3 rounded-xl text-sm font-medium border flex items-center justify-between ${bgColor}`}
                      >
                        <span>{opt}</span>
                        {isCorrectOption && <CheckCircle size={14} className="text-emerald-500" />}
                        {isStudentChoice && !isCorrectOption && <Info size={14} className="text-red-500" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
