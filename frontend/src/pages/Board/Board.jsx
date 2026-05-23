import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { getLocalUser } from "../../utils/auth";
import {
  BrainCircuit,
  PlusCircle,
  BookOpen,
  History,
  BarChart3,
  ArrowRight,
  Sparkles,
  Users,
  Trophy,
  ArrowUpRight,
  FileText,
  UserPlus,
  Zap,
  Map,
  Bot,
  Brain,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  CheckCircle2,
  Clock
} from "lucide-react";
import { QuizCardSkeleton, ListRowSkeleton, StatCardSkeleton } from "../../components/Skeleton";
import ActivityFeed from "../../components/ActivityFeed";

const Board = () => {
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [myNotes, setMyNotes] = useState([]);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [weaknessData, setWeaknessData] = useState({ weaknesses: [], strengths: [] });
  const [liveResults, setLiveResults] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getLocalUser();

  useEffect(() => {
    fetchData();
    fetchWeakness();
  }, []);

  const fetchWeakness = async () => {
    try {
      const res = await API.get("/ai/weakness-analysis");
      setWeaknessData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [
        API.get("/quiz"),
        API.get("/notes"),
        API.get("/user/requests")
      ];
      
      if (user?.role === "student") {
        promises.push(API.get(`/results/student/${user?.id}`));
        promises.push(API.get("/attempt/history"));
      }

      const results = await Promise.allSettled(promises);
      const [quizRes, noteRes, reqRes, liveRes, attemptRes] = results;

      const rawQuizzes = quizRes?.status === 'fulfilled' ? (quizRes.value.data.quizzes ?? quizRes.value.data) : [];
      const allNotes = noteRes?.status === 'fulfilled' ? (noteRes.value.data.notes ?? noteRes.value.data) : [];
      const pendingRequests = reqRes?.status === 'fulfilled' ? reqRes.value.data : [];
      
      const fetchedLiveResults = liveRes?.status === 'fulfilled' ? liveRes.value.data.results : [];
      const fetchedAttempts = attemptRes?.status === 'fulfilled' ? (attemptRes.value.data.history ?? attemptRes.value.data) : [];

      const filteredQuizzes = rawQuizzes.reduce((acc, current) => {
        const isBattle = current.origin === "battle";
        const existing = acc.find(q => q.title === current.title && String(q.createdBy?._id || q.createdBy) === String(current.createdBy?._id || current.createdBy));
        
        if (!existing) {
          acc.push(current);
        } else if (isBattle && existing.origin !== "battle") {
          const index = acc.indexOf(existing);
          acc[index] = current;
        }
        return acc;
      }, []);

      const getID = (obj) => String(obj?._id || obj || "");
      const currentUserId = String(user?.id || "");

      setMyQuizzes(filteredQuizzes.filter(q => getID(q.createdBy) === currentUserId));
      setMyNotes(allNotes.filter(n => getID(n.uploadedBy) === currentUserId));
      setAvailableQuizzes(filteredQuizzes.filter(q => getID(q.createdBy) !== currentUserId));
      setRequests(pendingRequests);
      
      if (user?.role === "student") {
        setLiveResults(fetchedLiveResults);
        setAttempts(fetchedAttempts);
      }
      
    } catch (err) {
      console.error("Board fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const Card = ({ title, subtitle, icon: Icon, onClick, color }) => (
    <div 
      onClick={onClick}
      className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} rounded-full -mr-12 -mt-12 opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="relative z-10">
        <div className={`w-12 h-12 ${color.replace('bg-', 'text-').replace('opacity-10', '')} mb-4`}>
          <Icon size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-500 text-sm mb-4">{subtitle}</p>
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
          View All <ArrowRight size={16} />
        </div>
      </div>
    </div>
  );

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto p-6 animate-pulse">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-slate-100 rounded-xl" />
          <div className="h-3 w-32 bg-slate-100 rounded-full" />
        </div>
        <div className="flex gap-3">
          <div className="h-12 w-40 bg-slate-100 rounded-2xl" />
          <div className="h-12 w-36 bg-slate-100 rounded-2xl" />
        </div>
      </div>
      <div className="mb-12 h-16 bg-slate-100 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <div className="mb-16">
        <div className="h-7 w-48 bg-slate-100 rounded-xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <QuizCardSkeleton key={i} />)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {[0,1].map(col => (
          <div key={col}>
            <div className="h-7 w-44 bg-slate-100 rounded-xl mb-8" />
            <div className="space-y-4">
              {[1,2,3,4].map(i => <ListRowSkeleton key={i} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900">
            Welcome back, <span className="text-indigo-600">{user.name}</span>!
          </h1>
          <p className="text-slate-500 mt-1 uppercase tracking-widest font-bold text-xs">
            {user.role} Dashboard
          </p>
        </div>
        <div className="flex gap-3">
          {user.role === "teacher" ? (
            <div className="flex gap-3">
              <button 
                onClick={() => navigate("/create-quiz")}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                <PlusCircle size={20} /> Create New Quiz
              </button>
              <button 
                onClick={() => navigate("/notes/upload")}
                className="flex items-center gap-2 bg-white text-indigo-600 border-2 border-indigo-100 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                <PlusCircle size={20} /> Upload Notes
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={() => navigate("/ai")}
                className="flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-violet-100 hover:bg-violet-700 transition-all"
              >
                <Sparkles size={20} /> AI Generator
              </button>
              <button 
                onClick={() => navigate("/notes/upload")}
                className="flex items-center gap-2 bg-white text-indigo-600 border-2 border-indigo-100 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                <PlusCircle size={20} /> Upload Notes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-12 relative group">
        <input 
          type="text" 
          placeholder="Search for creators to follow..."
          onFocus={() => navigate("/search")}
          className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-lg"
        />
        <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={24} />
      </div>

      {requests.length > 0 && (
        <div className="mb-10 bg-indigo-600 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl shadow-indigo-100 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <UserPlus size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black">Follow Requests</h3>
              <p className="text-white/70 font-medium">You have {requests.length} pending requests waiting for your approval.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/requests")}
            className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-lg active:scale-95"
          >
            Review Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        <Card 
          title="My Quizzes"
          subtitle={`${myQuizzes.length} created by you`}
          icon={BrainCircuit}
          onClick={() => scrollToSection("my-quizzes")}
          color="bg-blue-500"
        />
        <Card 
          title="My Notes"
          subtitle={`${myNotes.length} uploaded by you`}
          icon={BookOpen}
          onClick={() => scrollToSection("my-notes")}
          color="bg-emerald-500"
        />
        <Card 
          title="Community Quizzes"
          subtitle={`${availableQuizzes.length} from following`}
          icon={Trophy}
          onClick={() => scrollToSection("available-quizzes")}
          color="bg-amber-50"
        />
        <Card 
          title="Find Creators"
          subtitle="Follow & Explore"
          icon={Users}
          onClick={() => navigate("/search")}
          color="bg-purple-500"
        />
        <Card 
          title="Study Planner"
          subtitle="AI Goal Roadmap"
          icon={Map}
          onClick={() => navigate("/study-planner")}
          color="bg-emerald-600"
        />
      </div>

      <div className="mb-16" id="available-quizzes">
        <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <Sparkles className="text-amber-500" size={28} /> Available Quizzes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableQuizzes.length > 0 ? (
            availableQuizzes.map(quiz => (
              <div key={quiz._id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer">
                <div 
                  className="flex items-center gap-3 mb-4 hover:opacity-70 transition-opacity"
                  onClick={() => navigate(`/profile/${quiz.createdBy?._id || quiz.createdBy}`)}
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs overflow-hidden">
                    {quiz.createdBy?.profilePic ? (
                      <img src={`http://localhost:5000/${quiz.createdBy.profilePic}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (quiz.createdBy?.name || "U").charAt(0)
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-600">{quiz.createdBy?.name || "User"}</span>
                </div>
                <div onClick={() => {
                  const isLiveQuiz = quiz.origin === "battle";
                  if (isLiveQuiz) {
                    navigate(`/rank/${quiz._id}`);
                  } else {
                    navigate(`/quiz/${quiz._id}`);
                  }
                }}>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{quiz.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-1">{quiz.description}</p>
                  <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em]">
                    {quiz.origin === "battle" ? (
                      <span className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
                        <Trophy size={14} /> Review Performance
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-indigo-600">
                        Attempt Quiz <ArrowRight size={14} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-medium">
              No quizzes from people you follow yet.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div id="my-notes">
          <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <BookOpen className="text-emerald-500" size={28} /> My Uploaded Notes
          </h2>
          <div className="space-y-4">
            {myNotes.length > 0 ? (
              myNotes.slice(0, 4).map(note => (
                <div key={note._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{note.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">{new Date(note.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate(`/flashcards/${note._id}`)}
                      className="p-2 text-violet-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                      title="AI Flashcards"
                    >
                      <Brain size={20} />
                    </button>
                    <button 
                      onClick={() => navigate(`/chat-tutor/${note._id}`)}
                      className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="AI Chat Tutor"
                    >
                      <Bot size={20} />
                    </button>
                    <button 
                      onClick={() => window.open(`http://localhost:5000/${note.fileUrl.replace(/\\/g, "/")}`)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="View PDF"
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                You haven't uploaded any notes yet.
              </div>
            )}
          </div>
        </div>

        <div id="my-quizzes">
          <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <BrainCircuit className="text-blue-500" size={28} /> My Created AI Quizzes
          </h2>
          <div className="space-y-4">
            {myQuizzes.length > 0 ? (
              myQuizzes.map(quiz => (
                <div key={quiz._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${quiz.roomCode ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      {quiz.roomCode ? <Zap size={20} /> : <BrainCircuit size={20} />}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-800 text-lg">{quiz.title}</h4>
                        {quiz.origin === "battle" && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black rounded-full uppercase tracking-widest border border-red-200">Live Room</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                        <span>Created on {new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span>{quiz.questions?.length} Questions</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (user.role === "teacher") {
                        if (quiz.origin === "battle") {
                          navigate(`/live-dashboard?roomCode=${quiz.roomCode}`);
                        } else {
                          navigate(`/rank/${quiz._id}`);
                        }
                      } else {
                        navigate(`/quiz/${quiz._id}`);
                      }
                    }}
                    title="View Test Details"
                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                  >
                    <ArrowUpRight size={22} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                Create a quiz to see it here!
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-xl border border-white/20">
                <BarChart3 size={48} />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h4 className="font-black text-3xl mb-2">Learning Pulse</h4>
                <p className="text-white/80 text-lg font-medium mb-6">"Your performance in Science quizzes has improved by 15%. Consider exploring advanced Physics notes."</p>
                <button 
                  onClick={() => navigate("/analytics")}
                  className="px-10 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-lg active:scale-95"
                >
                  View Detailed Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      {/* 🆕 STUDENT ANALYTICS: SOLVED LIVE ROOM QUIZZES & OVERALL GROWTH */}
      {user?.role === "student" && (
        <>
          {/* OVERALL GROWTH SECTION */}
          <div className="mb-16">
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <TrendingUp className="text-indigo-600" size={28} /> Overall Growth Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Live Quiz Growth Card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-md">
                      <Trophy size={28} />
                    </div>
                    <span className="px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full font-black text-[10px] uppercase tracking-widest">Live Battles</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Live Quiz Growth</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Based on your live room battle performances against peers.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Battles</p>
                      <p className="text-3xl font-black text-slate-800">{liveResults.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Growth Trend</p>
                      <div className="flex items-center gap-2">
                        {liveResults.filter(r => r.growth === 'increase').length >= liveResults.filter(r => r.growth === 'decrease').length ? (
                          <>
                            <TrendingUp className="text-emerald-500" size={24} />
                            <span className="text-2xl font-black text-emerald-500">Positive</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="text-red-500" size={24} />
                            <span className="text-2xl font-black text-red-500">Needs Focus</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Normal Quiz Growth Card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                      <BrainCircuit size={28} />
                    </div>
                    <span className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-black text-[10px] uppercase tracking-widest">Practice Quizzes</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Practice Quiz Growth</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Based on your standalone quiz attempts and practice tests.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Quizzes Solved</p>
                      <p className="text-3xl font-black text-slate-800">{attempts.filter(a => a.quiz?.origin !== 'battle').length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg Accuracy</p>
                      <p className="text-3xl font-black text-indigo-600">
                        {attempts.filter(a => a.quiz?.origin !== 'battle').length > 0 ? (
                          `${(attempts.filter(a => a.quiz?.origin !== 'battle').reduce((acc, curr) => acc + (curr.percentage || 0), 0) / attempts.filter(a => a.quiz?.origin !== 'battle').length).toFixed(1)}%`
                        ) : '0%'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SOLVED LIVE ROOM QUIZZES SECTION */}
          <div className="mb-16">
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <Trophy className="text-amber-500" size={28} /> Solved Live Room Quizzes
            </h2>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              {liveResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-5 px-8">Test Name</th>
                        <th className="py-5 px-6">Created By</th>
                        <th className="py-5 px-6">Date</th>
                        <th className="py-5 px-6 text-center">Score</th>
                        <th className="py-5 px-6 text-center">Rank / Badge</th>
                        <th className="py-5 px-8 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {liveResults.map((r) => (
                        <tr key={r._id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="py-6 px-8">
                            <div className="font-black text-slate-800 text-base group-hover:text-indigo-600 transition-colors">{r.testName}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Room: {r.roomCode}</div>
                          </td>
                          <td className="py-6 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-xs shadow-inner overflow-hidden">
                                {r.teacherObj?.profilePic ? (
                                  <img src={`http://localhost:5000/${r.teacherObj.profilePic}`} alt="" className="w-full h-full object-cover" />
                                ) : (r.teacherObj?.name || r.studentName || "T").charAt(0)}
                              </div>
                              <span className="font-bold text-sm text-slate-600">{r.teacherObj?.name || r.studentName}</span>
                            </div>
                          </td>
                          <td className="py-6 px-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <Calendar size={14} className="text-slate-400" />
                              {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="py-6 px-6 text-center">
                            <span className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm">{r.score}</span>
                          </td>
                          <td className="py-6 px-6 text-center">
                            {r.badge ? (
                              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl font-black text-xs uppercase tracking-widest border ${
                                r.badge === 'Gold' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                r.badge === 'Silver' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                'bg-orange-50 text-orange-600 border-orange-200'
                              }`}>
                                <Award size={14} /> {r.badge}
                              </span>
                            ) : (
                              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-indigo-100">
                                Completed
                              </span>
                            )}
                          </td>
                          <td className="py-6 px-8 text-right">
                            <button 
                              onClick={() => navigate(`/rank/${r.quizId?._id || r.quizId}`)}
                              className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                            >
                              Review Analysis
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 font-medium text-sm italic">
                  You haven't participated in any live room quizzes yet. Join a live battle to see your scores and rank!
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 🆕 AI Weakness Analysis Section */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center shadow-inner">
                <Bot size={36} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">AI Skill Analysis</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Based on your performance history</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-100">
                {weaknessData.strengths?.length || 0} Strengths
              </div>
              <div className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-100">
                {weaknessData.weaknesses?.length || 0} Gaps Found
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-10 bg-slate-50/50">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Focus Areas (Weaknesses)</h4>
              <div className="space-y-6">
                {weaknessData.weaknesses?.length > 0 ? weaknessData.weaknesses.map((w, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-xs shrink-0">{i+1}</div>
                    <div>
                      <p className="font-black text-slate-800 text-lg mb-1">{w.topic || w}</p>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed italic">"Try reviewing foundational concepts or attempted related quizzes."</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-slate-400 font-medium text-sm italic py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                    No weak areas identified yet. Take more quizzes to see analysis!
                  </div>
                )}
              </div>
            </div>
            <div className="p-10 border-l border-slate-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Mastered Topics (Strengths)</h4>
              <div className="space-y-6">
                {weaknessData.strengths?.length > 0 ? weaknessData.strengths.map((s, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">✓</div>
                    <div>
                      <p className="font-black text-slate-800 text-lg mb-1">{s.topic || s}</p>
                      <p className="text-sm text-slate-500 font-medium">You're excelling here. Consider helping others or taking expert-level tests.</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-slate-400 font-medium text-sm italic py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                    Master topics to see them here!
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-10 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Sparkles size={24} className="text-amber-400" />
              </div>
              <p className="font-medium text-slate-300 max-w-md">Our AI recommends prioritizing <span className="text-white font-black">{weaknessData.weaknesses?.[0]?.topic || weaknessData.weaknesses?.[0]}</span> this week for maximum growth.</p>
            </div>
            <button 
              onClick={() => navigate("/ai")}
              className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
            >
              Generate Practice Test
            </button>
          </div>
        </div>
    </div>
  );
};

export default Board;
