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
  UserPlus
} from "lucide-react";
import { QuizCardSkeleton, ListRowSkeleton, StatCardSkeleton } from "../../components/Skeleton";

const Board = () => {
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [myNotes, setMyNotes] = useState([]);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getLocalUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use individual try-catch or settled promises to be more resilient
      const [quizRes, noteRes, reqRes] = await Promise.allSettled([
        API.get("/quiz"),
        API.get("/notes"),
        API.get("/user/requests")
      ]);

      const allQuizzes = quizRes.status === 'fulfilled' ? (quizRes.value.data.quizzes ?? quizRes.value.data) : [];
      const allNotes = noteRes.status === 'fulfilled' ? (noteRes.value.data.notes ?? noteRes.value.data) : [];
      const pendingRequests = reqRes.status === 'fulfilled' ? reqRes.value.data : [];

      // Robust ID helper to handle populated/unpopulated fields and type mismatches
      const getID = (obj) => String(obj?._id || obj || "");
      const currentUserId = String(user?.id || "");

      setMyQuizzes(allQuizzes.filter(q => getID(q.createdBy) === currentUserId));
      setMyNotes(allNotes.filter(n => getID(n.uploadedBy) === currentUserId));
      setAvailableQuizzes(allQuizzes.filter(q => getID(q.createdBy) !== currentUserId));
      setRequests(pendingRequests);
      
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
      {/* Header skeleton */}
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

      {/* Search bar skeleton */}
      <div className="mb-12 h-16 bg-slate-100 rounded-3xl" />

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
      </div>

      {/* Quiz grid skeleton */}
      <div className="mb-16">
        <div className="h-7 w-48 bg-slate-100 rounded-xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <QuizCardSkeleton key={i} />)}
        </div>
      </div>

      {/* Mini-list skeletons */}
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

      {/* Inline User Search */}
      <div className="mb-12 relative group">
        <input 
          type="text" 
          placeholder="Search for creators to follow..."
          onFocus={() => navigate("/search")}
          className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-lg"
        />
        <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={24} />
      </div>

      {/* Follow Requests Alert */}
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

      {/* Main Stats/Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
      </div>

      {/* Section 1: Available Quizzes from Followed Creators */}
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
                  onClick={() => navigate(`/profile/${quiz.createdBy?._id}`)}
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs overflow-hidden">
                    {quiz.createdBy?.profilePic ? (
                      <img src={`http://localhost:5000/${quiz.createdBy.profilePic}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      quiz.createdBy?.name?.charAt(0)
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-600">{quiz.createdBy?.name}</span>
                </div>
                <div onClick={() => navigate(`/quiz/${quiz._id}`)}>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{quiz.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-1">{quiz.description}</p>
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                    Attempt Quiz <ArrowRight size={14} />
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

      {/* Section 2: My Personal Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        
        {/* My Notes */}
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
                  <button 
                    onClick={() => window.open(`http://localhost:5000/${note.fileUrl.replace(/\\/g, "/")}`)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                You haven't uploaded any notes yet.
              </div>
            )}
          </div>
        </div>

        {/* My AI Quizzes */}
        <div id="my-quizzes">
          <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <BrainCircuit className="text-blue-500" size={28} /> My Created AI Quizzes
          </h2>
          <div className="space-y-4">
            {myQuizzes.length > 0 ? (
              myQuizzes.slice(0, 4).map(quiz => (
                <div key={quiz._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <BrainCircuit size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{quiz.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">{quiz.questions?.length} Qs • {quiz.difficulty}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/rank/${quiz._id}`)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <ArrowUpRight size={20} />
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

      {/* Section 3: AI Insights */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
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
  );
};

export default Board;
