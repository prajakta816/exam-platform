import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import { getLocalUser } from "../utils/auth";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  FileText, 
  Upload, 
  Loader2, 
  Paperclip, 
  BookOpen, 
  ChevronRight,
  RefreshCw,
  HelpCircle,
  HelpCircle as QuestionIcon
} from "lucide-react";

export default function AITutorWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  
  // Flashcard states
  const [flippedCards, setFlippedCards] = useState({});

  useEffect(() => {
    const currentUser = getLocalUser();
    setUser(currentUser);
    if (currentUser) {
      fetchNotes();
    } else {
      setIsOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  useEffect(() => {
    if (selectedNoteId) {
      loadChatHistory(selectedNoteId);
    } else {
      setMessages([]);
    }
  }, [selectedNoteId]);

  const fetchNotes = async () => {
    try {
      const res = await API.get("/notes?limit=100");
      const data = res.data;
      setNotes(data.notes ?? data ?? []);
    } catch (error) {
      console.error("Failed to load notes in widget", error);
    }
  };

  const loadChatHistory = async (noteId) => {
    setLoading(true);
    try {
      const res = await API.get(`/ai/chat/history/${noteId}`);
      const history = res.data.map(h => [
        { role: "user", text: h.message, id: `${h._id}-user` },
        { role: "bot", text: h.response, id: `${h._id}-bot` }
      ]).flat();

      if (history.length === 0) {
        setMessages([
          { 
            role: "bot", 
            text: "Hello! I am your AI Tutor. Ask me any questions, request a summary, or ask me to explain concepts from this note in simple terms!",
            id: "welcome"
          }
        ]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error("Failed to load chat history", error);
      setMessages([
        { role: "bot", text: "Welcome back! I had trouble loading your history, but I am ready to answer your questions about this note.", id: "welcome-error" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf" && file.type !== "text/plain") {
        alert("Please select a PDF or TXT file.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const triggerSend = async (messageText, fileToUpload = null) => {
    const file = fileToUpload !== null ? fileToUpload : selectedFile;
    if (!messageText.trim() && !file) return;
    
    // Add user message to state
    const userMsgId = Date.now().toString();
    const userMessage = { 
      role: "user", 
      text: file ? `Uploaded "${file.name}" and asked: ${messageText || "Please analyze this note."}` : messageText,
      id: userMsgId 
    };
    setMessages(prev => [...prev, userMessage]);
    
    setInput("");
    setLoading(true);
    
    try {
      let res;
      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("message", messageText || "Summarize the notes for me.");
        
        res = await API.post("/ai/chat", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        
        // Update notes dropdown selection to the newly created note
        if (res.data.noteId) {
          setSelectedNoteId(res.data.noteId);
          fetchNotes(); // Reload dropdown
        }
        setSelectedFile(null);
        setUploading(false);
      } else {
        res = await API.post("/ai/chat", {
          noteId: selectedNoteId,
          message: messageText
        });
      }

      setMessages(prev => [
        ...prev, 
        { role: "bot", text: res.data.response, id: (Date.now() + 1).toString() }
      ]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [
        ...prev, 
        { role: "bot", text: "Sorry, I ran into an error processing your query. Please make sure the notes are valid and try again.", id: (Date.now() + 1).toString() }
      ]);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleSend = () => {
    triggerSend(input, selectedFile);
  };

  const handleQuickAction = (action) => {
    if (!selectedNoteId && !selectedFile) {
      alert("Please select or upload a note first.");
      return;
    }

    let prompt = "";
    if (action === "summarize") {
      prompt = "Please summarize the main concepts and key takeaways from these study notes.";
    } else if (action === "explain") {
      prompt = "Please explain the core topics in this note in simple, ELI5 (Explain Like I'm 5) terms.";
    } else if (action === "flashcards") {
      prompt = "Generate Flashcards: Please extract 5 important key terms from this study note and output them exactly in Q&A format. Prefix each question with 'Q:' and each answer with 'A:'.";
    }
    
    triggerSend(prompt);
  };

  const toggleFlip = (cardIdx) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardIdx]: !prev[cardIdx]
    }));
  };

  // Helper to parse flashcards in response
  const renderMessageContent = (msg) => {
    const text = msg.text;
    
    // Check if the response contains Q&A flashcards format
    if (msg.role === "bot" && (text.includes("Q:") || text.toLowerCase().includes("question:") || text.includes("**Q:**"))) {
      // Parse Q&A pairs
      const regex = /(?:Q|Question|Question\s\d+):\s*(.*?)\n\s*(?:A|Answer|Answer\s\d+):\s*(.*?)(?=\n\s*(?:Q|Question|Question\s\d+):|$)/gis;
      let match;
      const flashcards = [];
      
      while ((match = regex.exec(text)) !== null) {
        if (match[1] && match[2]) {
          flashcards.push({
            question: match[1].replace(/^\*+/, "").replace(/\*+$/, "").trim(),
            answer: match[2].replace(/^\*+/, "").replace(/\*+$/, "").trim()
          });
        }
      }

      if (flashcards.length > 0) {
        return (
          <div className="space-y-4">
            <p className="font-semibold text-slate-800 dark:text-slate-200">I've generated these interactive study flashcards for you:</p>
            <div className="grid grid-cols-1 gap-4 py-2">
              {flashcards.map((card, idx) => {
                const cardKey = `${msg.id}-${idx}`;
                const isFlipped = !!flippedCards[cardKey];
                return (
                  <div 
                    key={idx} 
                    onClick={() => toggleFlip(cardKey)}
                    className="cursor-pointer h-32 relative perspective-1000 w-full group"
                  >
                    <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                      {/* Front Side */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-slate-800 dark:to-slate-800/80 border border-indigo-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col justify-between backface-hidden shadow-sm hover:border-indigo-400 dark:hover:border-slate-600 transition-colors">
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-indigo-500 dark:text-indigo-400 font-extrabold">
                          <span>Flashcard {idx + 1}</span>
                          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[8px]">Tap to reveal</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex-grow flex items-center pr-2">
                          {card.question}
                        </p>
                      </div>
                      
                      {/* Back Side */}
                      <div className="absolute inset-0 bg-indigo-600 text-white rounded-2xl p-4 flex flex-col justify-between backface-hidden rotate-y-180 shadow-md">
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-indigo-200 font-extrabold">
                          <span>Answer</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[8px]">Tap to flip back</span>
                        </div>
                        <p className="text-xs font-semibold flex-grow flex items-center leading-relaxed overflow-y-auto">
                          {card.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-2">
              Note: Click on any card to flip and view the answer.
            </div>
          </div>
        );
      }
    }

    // Default markdown/text rendering
    return <p className="whitespace-pre-line text-sm leading-relaxed">{text}</p>;
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans antialiased text-slate-800 dark:text-slate-100">
      {/* 🚀 Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-2xl transition-all duration-300 transform hover:scale-110 relative group"
        >
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping group-hover:animate-none pointer-events-none" />
          <Bot size={28} className="transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
        </button>
      )}

      {/* 🚀 Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[580px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-5 flex flex-col gap-3 relative shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
                    AI Study Tutor <Sparkles size={14} className="text-amber-300" />
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-indigo-200 uppercase tracking-widest font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    OpenAI Engine Active
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Note Selector / Upload */}
            <div className="flex items-center gap-2 mt-2 bg-indigo-950/40 p-2 rounded-2xl border border-indigo-500/20">
              <select
                value={selectedNoteId}
                onChange={(e) => {
                  setSelectedNoteId(e.target.value);
                  setSelectedFile(null);
                }}
                className="flex-grow bg-transparent text-white font-bold text-xs outline-none cursor-pointer border-none"
                style={{ colorScheme: "dark" }}
              >
                <option value="" className="text-slate-800">Select study note...</option>
                {notes.map(note => (
                  <option key={note._id} value={note._id} className="text-slate-800">
                    {note.title.length > 30 ? `${note.title.substring(0, 27)}...` : note.title}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-all ${selectedFile ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
                title="Upload PDF or Text Notes"
              >
                <Upload size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            {/* Show Selected Temp File */}
            {selectedFile && (
              <div className="flex items-center justify-between bg-emerald-600/30 text-emerald-200 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl">
                <span className="truncate max-w-[200px]">File: {selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-emerald-300 hover:text-white">
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions Chips */}
          {(selectedNoteId || selectedFile) && (
            <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
              <button
                onClick={() => handleQuickAction("summarize")}
                className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-all whitespace-nowrap shrink-0"
              >
                <FileText size={12} /> Summarize
              </button>
              <button
                onClick={() => handleQuickAction("explain")}
                className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-all whitespace-nowrap shrink-0"
              >
                <Sparkles size={12} /> Explain ELI5
              </button>
              <button
                onClick={() => handleQuickAction("flashcards")}
                className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-all whitespace-nowrap shrink-0"
              >
                <BookOpen size={12} /> Flashcards
              </button>
            </div>
          )}

          {/* Messages List */}
          <div className="flex-grow overflow-y-auto p-5 space-y-5 bg-slate-50/50 dark:bg-slate-900/30">
            {!selectedNoteId && !selectedFile ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-3xl flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/50 shadow-sm animate-pulse">
                  <BookOpen size={30} />
                </div>
                <h4 className="font-extrabold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider mb-2">No Active Context</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold max-w-[240px] leading-relaxed">
                  Select a study note from the dropdown above or upload a new PDF/TXT file to begin chatting.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  <Upload size={14} /> Upload Notes
                </button>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-3.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm font-bold text-xs ${
                      m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}>
                      {m.role === "user" ? "U" : <Bot size={14} />}
                    </div>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                      m.role === "user" 
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100 dark:shadow-none" 
                        : "bg-white dark:bg-slate-850 text-slate-750 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-sm"
                    }`}>
                      {renderMessageContent(m)}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-3.5">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                      <Loader2 className="animate-spin text-indigo-600" size={14} />
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-850 text-slate-400 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest animate-pulse">
                      {uploading ? "AI is analyzing study note..." : "AI is typing..."}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 focus-within:border-indigo-600 focus-within:bg-white dark:focus-within:bg-slate-850 transition-all">
              <input
                type="text"
                placeholder={(!selectedNoteId && !selectedFile) ? "Upload notes first..." : "Ask me anything..."}
                disabled={!selectedNoteId && !selectedFile}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="flex-grow outline-none bg-transparent font-bold text-xs text-slate-700 dark:text-white px-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || (!input.trim() && !selectedFile)}
                className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
