import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { Sparkles, MessageSquare, Send, Bot, User, ArrowLeft, Loader2 } from "lucide-react";

const ChatTutor = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! I'm your AI Study Tutor. I've read these notes. Ask me anything about them!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await API.post("/ai/chat-tutor", {
        noteId,
        message: input,
        history: messages.map(m => ({ role: m.role, text: m.text }))
      });

      setMessages(prev => [...prev, { role: "bot", text: res.data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "bot", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 hover:shadow-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Bot className="text-indigo-600" /> AI Chat Tutor
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active Analysis
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
          <Sparkles size={14} /> Contextual Learning
        </div>
      </div>

      {/* Chat Box */}
      <div className="flex-grow bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        
        <div className="flex-grow overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {m.role === "user" ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[70%] p-6 rounded-3xl text-sm font-medium leading-relaxed ${
                m.role === "user" 
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-100" 
                  : "bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 animate-in fade-in duration-300">
              <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
                <Loader2 className="animate-spin" size={18} />
              </div>
              <div className="p-6 bg-slate-50 text-slate-400 rounded-3xl rounded-tl-none border border-slate-100 italic text-xs font-bold uppercase tracking-widest">
                AI is thinking...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <div className="flex gap-4 bg-white p-2 pl-6 rounded-[2rem] border-2 border-transparent focus-within:border-indigo-600 shadow-xl shadow-slate-200/50 transition-all">
            <input 
              type="text" 
              placeholder="Ask me to explain a concept or summarize a section..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-grow outline-none bg-transparent font-bold text-slate-700"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:bg-slate-200"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTutor;
