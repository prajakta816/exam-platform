import React, { useState } from "react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, Check, ArrowLeft } from "lucide-react";

const UploadNote = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isPaid: false,
    price: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");

    setLoading(true);
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("isPaid", formData.isPaid);
    data.append("price", formData.isPaid ? formData.price : 0);
    data.append("file", file);

    try {
      await API.post("/notes/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Note uploaded successfully!");
      navigate("/notes");
    } catch (error) {
      alert("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button 
        onClick={() => navigate("/notes")}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Notes
      </button>

      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Upload Study Note</h2>
        <p className="text-slate-500 mb-8">Share your knowledge and help others learn.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Note Title</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g., Data Structures & Algorithms Summary"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
            <textarea
              required
              rows="4"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none"
              placeholder="Briefly describe what's inside the note..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="block text-sm font-bold text-slate-700 mb-2">Pricing</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPaid: false })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    !formData.isPaid ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPaid: true })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    formData.isPaid ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>

            {formData.isPaid && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">File (PDF, Docx, etc.)</label>
            <div className="relative group">
              <input
                type="file"
                required
                className="hidden"
                id="note-file"
                onChange={handleFileChange}
              />
              <label
                htmlFor="note-file"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl py-10 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
              >
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-emerald-100 p-4 rounded-full mb-3">
                      <Check className="text-emerald-600" />
                    </div>
                    <span className="text-slate-700 font-medium">{file.name}</span>
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); setFile(null); }}
                      className="mt-2 text-xs text-red-500 underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="text-slate-400 mb-3 group-hover:text-indigo-500 transition-colors" size={32} />
                    <span className="text-slate-500">Click to select file</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
              loading 
                ? "bg-slate-300 cursor-not-allowed" 
                : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-90 active:scale-[0.98] shadow-indigo-200"
            }`}
          >
            {loading ? "Uploading..." : "Publish Note"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadNote;
