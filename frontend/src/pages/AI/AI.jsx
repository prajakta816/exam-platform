import React, { useState } from "react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Sparkles, Save, Trash2, CheckCircle2 } from "lucide-react";

const AI = () => {
  const [mode, setMode] = useState("text"); // 'text' or 'pdf'
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setLoading(true);
    setQuiz(null); // 🆕 Clear previous result immediately
    try {
      let res;
      if (mode === "text") {
        res = await API.post("/ai/generate-text", { text });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        res = await API.post("/ai/generate-pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setQuiz(res.data);
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // In our current backend, the quiz is ALREADY saved in DB when generated.
    // So we just need to redirect to the board.
    navigate("/board");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 flex items-center justify-center gap-3">
          <Sparkles className="text-violet-600 w-10 h-10" />
          AI Quiz Generator
        </h1>
        <p className="text-slate-500">Transform your notes or PDFs into interactive quizzes instantly.</p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-200 p-1 rounded-xl flex gap-1">
          <button
            onClick={() => setMode("text")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
              mode === "text" ? "bg-white shadow-md text-violet-600 font-bold" : "text-slate-600 hover:bg-slate-300"
            }`}
          >
            <FileText size={18} />
            Text Input
          </button>
          <button
            onClick={() => setMode("pdf")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
              mode === "pdf" ? "bg-white shadow-md text-violet-600 font-bold" : "text-slate-600 hover:bg-slate-300"
            }`}
          >
            <Upload size={18} />
            PDF Upload
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-slate-100 transition-all hover:shadow-2xl">
        {mode === "text" ? (
          <textarea
            className="w-full h-64 p-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-violet-100 focus:border-violet-500 outline-none transition-all resize-none text-slate-700"
            placeholder="Paste your content here (minimum 50 words recommended for better results)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl py-12 px-4 transition-all hover:border-violet-400 bg-slate-50">
            <input
              type="file"
              id="pdf-upload"
              className="hidden"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-4 group">
              <div className="bg-violet-100 p-6 rounded-full group-hover:scale-110 transition-transform">
                <Upload className="text-violet-600 w-10 h-10" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-700">{file ? file.name : "Click to upload PDF"}</p>
                <p className="text-sm text-slate-400">Max size 5MB</p>
              </div>
            </label>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || (mode === "text" ? !text : !file)}
          className={`w-full mt-8 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all ${
            loading || (mode === "text" ? !text : !file)
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-violet-200"
          }`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </div>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Quiz
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {quiz && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Generated Questions ({quiz.questions.length})</h2>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <CheckCircle2 size={18} />
              Publish to Profile
            </button>
          </div>

          <div className="grid gap-6">
            {quiz.questions.map((q, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
                <p className="text-lg font-semibold text-slate-800 mb-4">
                  <span className="text-violet-600 mr-2">Q{idx + 1}.</span>
                  {q.question}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-4 rounded-xl border transition-all ${
                        oIdx === q.correctAnswer
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-slate-50 border-slate-100 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold border border-inherit">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        {opt}
                        {oIdx === q.correctAnswer && <CheckCircle2 size={18} className="ml-auto" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AI;
