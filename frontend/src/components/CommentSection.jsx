import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Send, MessageSquare, User } from "lucide-react";

const CommentSection = ({ targetId, targetType }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [targetId]);

  const fetchComments = async () => {
    try {
      const res = await API.get(`/comments/${targetId}`);
      setComments(res.data);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await API.post("/comments", {
        content: newComment,
        targetType,
        targetId,
      });
      setNewComment("");
      fetchComments(); // Refresh list
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
      <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <MessageSquare className="text-indigo-600" />
        Discussion ({comments.length})
      </h3>

      {/* Input */}
      <form onSubmit={handlePostComment} className="mb-10 relative">
        <textarea
          className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none text-slate-700 font-medium"
          placeholder="Add a comment or ask a question..."
          rows="3"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all ${
            loading || !newComment.trim() 
              ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
              : "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95"
          }`}
        >
          <Send size={20} />
        </button>
      </form>

      {/* List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 italic">No comments yet. Be the first to start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 overflow-hidden shadow-sm transition-transform group-hover:scale-105">
                {comment.user?.profilePic ? (
                  <img src={`http://localhost:5000/${comment.user.profilePic}`} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-black text-slate-800">{comment.user?.name || "Deleted User"}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-2xl rounded-tl-none border border-slate-100 text-slate-600 leading-relaxed font-medium">
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
