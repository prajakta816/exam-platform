import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { getLocalUser } from "../../utils/auth";
import { 
  UserCircle, 
  Users, 
  BookOpen, 
  BrainCircuit, 
  CheckCircle, 
  ArrowRight, 
  Lock, 
  Trophy, 
  Trash2,
  UserPlus
} from "lucide-react";

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

  // Helper component for user lists
  const UserList = ({ users, type }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
      {users.length === 0 ? (
        <div className="col-span-2 text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-medium">
          No {type} yet.
        </div>
      ) : (
        users.map(u => (
          <div 
            key={u._id} 
            onClick={() => navigate(`/profile/${u._id}`)}
            className="group p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
              {u.profilePic ? (
                <img src={`http://localhost:5000/${u.profilePic}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="text-indigo-200" size={32} />
              )}
            </div>
            <div className="flex-grow">
              <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{u.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.role || 'Member'}</span>
                {u._id === currentUser?.id && <span className="bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">You</span>}
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {/* Profile Header */}
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 mb-8 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="w-40 h-40 bg-indigo-100 rounded-[3rem] flex items-center justify-center border-8 border-white shadow-2xl overflow-hidden rotate-3 hover:rotate-0 transition-transform duration-500">
            {user.profilePic ? (
              <img src={`http://localhost:5000/${user.profilePic}`} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={100} className="text-indigo-400" />
            )}
          </div>
          
          <div className="flex-grow text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{user.name}</h1>
              <div className="flex gap-2 justify-center md:justify-start">
                {currentUser?.id !== userId ? (
                  <button
                    onClick={handleFollowToggle}
                    disabled={hasRequested && !isFollowing}
                    className={`px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
                      isFollowing 
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                        : hasRequested
                        ? "bg-amber-50 text-amber-600 border border-amber-100 cursor-default"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                    }`}
                  >
                    {!isFollowing && !hasRequested && <UserPlus size={16} />}
                    {isFollowing ? "Unfollow" : hasRequested ? "Pending" : "Follow"}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/profile/edit")}
                    className="px-8 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                  >
                    Edit Account
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
              <span className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">{user.role}</span>
              {user.isPublic ? (
                <span className="px-4 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Public Account</span>
              ) : (
                <span className="px-4 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Lock size={10}/> Private</span>
              )}
            </div>

            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">{user.bio || "Crafting the future of engineering education."}</p>
            
            <div className="flex justify-center md:justify-start gap-12 pt-4 border-t border-slate-50">
              <button onClick={() => setActiveTab("followers")} className={`group text-center transition-all ${activeTab === 'followers' ? 'scale-110' : ''}`}>
                <p className="text-2xl font-black text-slate-900 leading-none mb-1">{user.followers.length}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'followers' ? 'text-indigo-600' : 'text-slate-400'}`}>Followers</p>
              </button>
              <button onClick={() => setActiveTab("following")} className={`group text-center transition-all ${activeTab === 'following' ? 'scale-110' : ''}`}>
                <p className="text-2xl font-black text-slate-900 leading-none mb-1">{user.following.length}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'following' ? 'text-indigo-600' : 'text-slate-400'}`}>Following</p>
              </button>
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900 leading-none mb-1">{quizzes.length + notes.length}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {profile.isPrivate ? (
        <div className="mt-4 flex flex-col items-center">
          <div className="w-full bg-white rounded-[3rem] border border-slate-100 shadow-xl p-16 text-center animate-in fade-in zoom-in duration-700">
            <div className="w-28 h-28 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-12">
              <Lock className="text-indigo-600" size={56} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">This Network is Locked</h2>
            <p className="text-slate-500 font-medium text-xl max-w-sm mx-auto leading-relaxed mb-10">
              Follow <span className="text-indigo-600 font-bold">@{user.name.split(' ')[0]}</span> to view their connections and contributions.
            </p>
            {!isFollowing && !hasRequested && (
              <button
                onClick={handleFollowToggle}
                className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95"
              >
                Join the Circle
              </button>
            )}
            {hasRequested && (
              <div className="inline-flex items-center gap-3 px-10 py-4 bg-amber-50 text-amber-700 rounded-2xl font-black text-xs uppercase tracking-widest border border-amber-100">
                <Users size={18} /> Request Pending Approval
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Enhanced Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 border border-slate-100 rounded-3xl">
            {[
              { id: "quizzes", icon: BrainCircuit, label: `Quizzes (${quizzes.length})` },
              { id: "notes", icon: BookOpen, label: `Notes (${notes.length})` },
              { id: "followers", icon: Users, label: `Followers (${user.followers.length})` },
              { id: "following", icon: UserPlus, label: `Following (${user.following.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  activeTab === tab.id ? "bg-white text-indigo-600 shadow-xl shadow-slate-200/50" : "text-slate-500 hover:bg-white/50"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Content Grid */}
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            {activeTab === "quizzes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.map(quiz => (
                  <div key={quiz._id} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <BrainCircuit size={80} className="text-indigo-600" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{quiz.title}</h3>
                      {currentUser?.id === userId && (
                        <button onClick={() => handleDeleteQuiz(quiz._id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                      )}
                    </div>
                    <p className="text-slate-500 font-medium text-sm mb-8">{quiz.questions.length} Questions • {quiz.difficulty || 'Pro'}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                      <button onClick={() => navigate(`/quiz/${quiz._id}`)} className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-xl shadow-indigo-100">Attempt</button>
                      <button onClick={() => navigate(`/rank/${quiz._id}`)} className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"><Trophy size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notes.map(note => (
                  <div key={note._id} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-emerald-100 transition-all flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">{note.title}</h3>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${note.isPaid ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {note.isPaid ? `$${note.price}` : 'Free'}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium text-sm mb-8 line-clamp-3 leading-relaxed">{note.description}</p>
                    <a href={`http://localhost:5000/${note.fileUrl.replace(/\\/g, "/")}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white transition-all">View Material</a>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "followers" && <UserList users={user.followers} type="followers" />}
            {activeTab === "following" && <UserList users={user.following} type="following" />}

            {(activeTab === "quizzes" && quizzes.length === 0 || activeTab === "notes" && notes.length === 0) && (
              <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400 font-black uppercase tracking-widest text-sm">Empty Hub</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
