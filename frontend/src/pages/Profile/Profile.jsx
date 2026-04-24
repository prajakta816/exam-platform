import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { getLocalUser } from "../../utils/auth";
import { UserCircle, Users, BookOpen, BrainCircuit, CheckCircle, ArrowRight, Lock, Trophy, Trash2 } from "lucide-react";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("quizzes");
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUser = getLocalUser();

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await API.get(`/user/${userId}`);
      setProfile(res.data);
      setIsFollowing(res.data.isFollowing);
      setHasRequested(res.data.hasRequested);
    } catch (error) {
      console.error("Error fetching profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await API.post(`/user/unfollow/${userId}`);
        setIsFollowing(false);
      } else if (hasRequested) {
        // Option to cancel request could be added here
      } else {
        const res = await API.post(`/user/follow/${userId}`);
        if (res.data.message === "Follow request sent") {
          setHasRequested(true);
        } else {
          setIsFollowing(true);
        }
      }
      fetchProfile(); // Refresh to update counts
    } catch (error) {
      console.error("Error following/unfollowing user", error);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await API.delete(`/quiz/${id}`);
      fetchProfile(); // Refresh
    } catch (error) {
      console.error("Error deleting quiz", error);
      alert("Failed to delete quiz");
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await API.delete(`/notes/${id}`);
      fetchProfile(); // Refresh
    } catch (error) {
      console.error("Error deleting note", error);
      alert("Failed to delete note");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!profile) return <div className="text-center mt-20">User not found</div>;

  const { user, quizzes, notes } = profile;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
            {user.profilePic ? (
              <img src={`http://localhost:5000/${user.profilePic}`} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={80} className="text-indigo-400" />
            )}
          </div>
          
          <div className="flex-grow text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
              <h1 className="text-3xl font-black text-slate-900">{user.name}</h1>
              {currentUser?.id !== userId ? (
                <button
                  onClick={handleFollowToggle}
                  disabled={hasRequested && !isFollowing}
                  className={`px-8 py-2 rounded-xl font-bold transition-all ${
                    isFollowing 
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                      : hasRequested
                      ? "bg-amber-50 text-amber-600 cursor-default"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                  }`}
                >
                  {isFollowing ? "Following" : hasRequested ? "Requested" : "Follow"}
                </button>
              ) : (
                <button
                  onClick={() => navigate("/profile/edit")}
                  className="px-6 py-2 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  Edit Profile
                </button>
              )}
            </div>
            <p className="text-slate-500 font-medium mb-4">{user.role.toUpperCase()}</p>
            <p className="text-slate-600 max-w-lg">{user.bio || "No bio yet."}</p>
            
            <div className="flex justify-center md:justify-start gap-8 mt-6">
              <div className="text-center">
                <p className="text-xl font-black text-slate-900">{user.followers.length}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-900">{user.following.length}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Following</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-900">{quizzes.length + notes.length}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resources</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {profile.isPrivate ? (
        <div className="mt-4 flex flex-col items-center">
          <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Lock className="text-indigo-600" size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">This Account is Private</h2>
            <p className="text-slate-500 font-medium text-lg max-w-sm mx-auto leading-relaxed mb-8">
              Follow <span className="text-indigo-600 font-bold">@{user.name}</span> to see their shared quizzes and notes.
            </p>
            {!isFollowing && !hasRequested && (
              <button
                onClick={handleFollowToggle}
                className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                Follow to View Content
              </button>
            )}
            {hasRequested && (
              <div className="inline-flex items-center gap-2 px-8 py-3 bg-amber-50 text-amber-700 rounded-xl font-bold border border-amber-100">
                <Users size={20} /> Request Pending
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab("quizzes")}
              className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === "quizzes" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
              }`}
            >
              <BrainCircuit size={20} />
              Quizzes ({quizzes.length})
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === "notes" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
              }`}
            >
              <BookOpen size={20} />
              Notes ({notes.length})
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === "quizzes" ? (
              quizzes.map(quiz => (
                <div key={quiz._id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{quiz.title}</h3>
                    {currentUser?.id === userId && (
                      <button 
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm mb-4 font-medium">{quiz.questions.length} Questions • {quiz.difficulty || 'Mixed'}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                    <button 
                      onClick={() => navigate(`/quiz/${quiz._id}`)}
                      className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-700"
                    >
                      Attempt <ArrowRight size={14} />
                    </button>
                    <button 
                      onClick={() => navigate(`/rank/${quiz._id}`)}
                      className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-amber-500 transition-colors"
                    >
                      <Trophy size={14} /> Rankings
                    </button>
                  </div>
                </div>
              ))
            ) : (
              notes.map(note => (
                <div key={note._id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{note.title}</h3>
                    <div className="flex items-center gap-2">
                      {currentUser?.id === userId && (
                        <button 
                          onClick={() => handleDeleteNote(note._id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${note.isPaid ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {note.isPaid ? `$${note.price}` : 'Free'}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">{note.description}</p>
                  <a 
                    href={`http://localhost:5000/${note.fileUrl.replace(/\\/g, "/")}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-indigo-600 font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform"
                  >
                    View Note <ArrowRight size={16} />
                  </a>
                </div>
              ))
            )}
          </div>

          {(activeTab === "quizzes" ? quizzes.length : notes.length) === 0 && (
            <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-medium">
              No {activeTab} shared yet.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
