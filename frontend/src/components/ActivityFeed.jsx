import React, { useEffect, useState } from "react";
import API from "../services/api";
import { Sparkles, Trophy, BookOpen, Radio, Users } from "lucide-react";
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes";
  return Math.floor(seconds) + " seconds";
};

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await API.get("/user/activity-feed");
      setActivities(res.data);
    } catch (err) {
      console.error("Feed error", err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "upload_note": return <BookOpen className="text-emerald-500" size={18} />;
      case "quiz_score": return <Trophy className="text-amber-500" size={18} />;
      case "start_live": return <Radio className="text-red-500" size={18} />;
      case "follow": return <Users className="text-indigo-500" size={18} />;
      default: return <Sparkles className="text-violet-500" size={18} />;
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">
    {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
  </div>;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
          <Sparkles size={16} className="text-violet-600" /> Community Activity
        </h3>
        <span className="px-3 py-1 bg-violet-100 text-violet-600 text-[10px] font-black rounded-full uppercase tracking-widest">Live</span>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">No activity yet. Be the first!</div>
        ) : (
          activities.map((act, idx) => (
            <div key={act._id} className="p-5 border-b border-slate-50 last:border-none flex gap-4 hover:bg-slate-50 transition-all group">
              <div className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden group-hover:border-violet-200 transition-colors">
                {act.user?.profilePic ? (
                  <img src={`http://localhost:5000/${act.user.profilePic}`} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="font-black text-violet-600">{act.user?.name?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-slate-900 text-sm truncate">{act.user?.name}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded uppercase">{act.user?.role}</span>
                </div>
                <p className="text-sm text-slate-500 leading-tight">
                  {act.message}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                  {getIcon(act.type)}
                  {timeAgo(act.createdAt)} ago
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
