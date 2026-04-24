import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { UserCheck, UserX, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FollowRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await API.get("/user/requests");
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterId) => {
    try {
      await API.post("/user/accept-follow", { requesterId });
      setRequests(requests.filter(req => req._id !== requesterId));
    } catch (error) {
      console.error("Error accepting request", error);
    }
  };

  const handleReject = async (requesterId) => {
    try {
      await API.post("/user/reject-follow", { requesterId });
      setRequests(requests.filter(req => req._id !== requesterId));
    } catch (error) {
      console.error("Error rejecting request", error);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading requests...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-[calc(100vh-4rem)]">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
          <Users className="text-indigo-600" size={40} /> Follow Requests
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Manage who can see your shared quizzes and notes.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {requests.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {requests.map((req) => (
              <div key={req._id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div 
                  className="flex items-center gap-4 cursor-pointer group"
                  onClick={() => navigate(`/profile/${req._id}`)}
                >
                  <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xl border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                    {req.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{req.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{req.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(req._id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    <UserCheck size={18} /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(req._id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                  >
                    <UserX size={18} /> Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center px-6">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">No pending requests</h3>
            <p className="text-slate-400 mt-2 max-w-sm mx-auto">When people ask to follow you, their requests will appear here.</p>
            <button 
              onClick={() => navigate("/board")}
              className="mt-8 text-indigo-600 font-bold flex items-center gap-2 mx-auto hover:gap-3 transition-all"
            >
              Back to Dashboard <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowRequests;
