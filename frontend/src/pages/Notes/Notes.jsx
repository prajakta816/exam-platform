import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { Download, ShoppingCart, Trash2, Edit, Plus, FileText, Lock, Unlock, MessageSquare, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CommentSection from "../../components/CommentSection";
import RatingSystem from "../../components/RatingSystem";
import { NoteCardSkeleton } from "../../components/Skeleton";

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedNoteForComments, setSelectedNoteForComments] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 9;
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchNotes(page);
  }, [page]);

  const fetchNotes = async (currentPage = 1) => {
    setLoading(true);
    try {
      const res = await API.get(`/notes?page=${currentPage}&limit=${LIMIT}`);
      const data = res.data;
      setNotes(data.notes ?? data);
      setTotal(data.total ?? (data.notes ?? data).length);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      console.error("Failed to fetch notes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await API.delete(`/notes/${id}`);
      setNotes(notes.filter((note) => note._id !== id));
      setTotal(t => t - 1);
      alert("Note deleted successfully!");
    } catch (error) {
      alert("Failed to delete note");
    }
  };

  const handleDownload = async (note) => {
    try {
      // Track download on backend
      await API.post(`/notes/download/${note._id}`);
      
      // Update local state
      setNotes(prev => prev.map(n => n._id === note._id ? { ...n, downloads: (n.downloads || 0) + 1 } : n));
      
      // Force Download Logic
      const fullUrl = `http://localhost:5000/${note.fileUrl.replace(/\\/g, "/")}`;
      const link = document.createElement("a");
      link.href = fullUrl;
      link.setAttribute("download", note.title || "note");
      link.setAttribute("target", "_blank"); // Fallback for cross-origin
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to track download", error);
      const fullUrl = `http://localhost:5000/${note.fileUrl.replace(/\\/g, "/")}`;
      window.open(fullUrl, "_blank");
    }
  };

  const handleBuy = async (note) => {
    alert(`Simulating purchase for "${note.title}" at $${note.price}... Purchase successful!`);
    handleDownload(note);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">Study Notes</h1>
          <p className="text-slate-500 mt-2">
            Access high-quality study materials shared by teachers and peers.
            {total > 0 && <span className="ml-2 text-indigo-600 font-bold">{total} notes</span>}
          </p>
        </div>
        <button
          onClick={() => navigate("/notes/upload")}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} />
          Upload Note
        </button>
      </div>

      {loading ? (
        /* Note cards skeleton grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <FileText size={64} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700">No notes available yet</h2>
          <p className="text-slate-400 mt-1">Be the first to upload a study note!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {notes.map((note) => (
            <div key={note._id} className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    note.isPaid ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {note.isPaid ? (
                      <span className="flex items-center gap-1"><Lock size={12}/> Paid</span>
                    ) : (
                      <span className="flex items-center gap-1"><Unlock size={12}/> Free</span>
                    )}
                  </div>
                  {note.isPaid && <span className="text-lg font-bold text-slate-900">${note.price}</span>}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{note.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <Download size={14} />
                  <span>{note.downloads || 0} downloads</span>
                </div>
                <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed">{note.description}</p>
                
                <div className="flex items-center gap-2 mt-auto text-xs text-slate-400">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold uppercase">
                    {note.uploadedBy?.name?.charAt(0)}
                  </div>
                  <span>Shared by {note.uploadedBy?.name}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                {note.isPaid ? (
                  <button 
                    onClick={() => handleBuy(note)}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                  >
                    <Unlock size={18} />
                    Unlock Note
                  </button>
                ) : (
                  <button 
                    onClick={() => handleDownload(note)}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-2 rounded-lg font-bold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100"
                  >
                    <Download size={18} />
                    Download
                  </button>
                )}

                {user?.id === note.uploadedBy?._id && (
                  <>
                    <button 
                      onClick={() => navigate(`/notes/edit/${note._id}`)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(note._id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => setSelectedNoteForComments(note)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all ml-auto"
                  title="View Discussion"
                >
                  <MessageSquare size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                p === page
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {/* Comment Modal */}
      {selectedNoteForComments && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedNoteForComments(null)}
          ></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-800">Discussion</h2>
                <p className="text-sm text-slate-400 font-bold">"{selectedNoteForComments.title}"</p>
              </div>
              <button 
                onClick={() => setSelectedNoteForComments(null)}
                className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              <RatingSystem targetId={selectedNoteForComments._id} targetType="note" />
              <CommentSection targetId={selectedNoteForComments._id} targetType="note" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
