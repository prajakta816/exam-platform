import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Timer, ArrowUpRight, ArrowDownRight, Minus, Users, Play, SkipForward, Power } from "lucide-react";
import { getLocalUser } from "../../utils/auth";

const LiveRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef();
  const [user, setUser] = useState(getLocalUser() || {});
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTime, setInitialTime] = useState(30);
  const [status, setStatus] = useState("waiting"); // waiting, started, ended
  const [results, setResults] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [participants, setParticipants] = useState([]);
  const [allowTeacherAttempt, setAllowTeacherAttempt] = useState(false);
  const [progress, setProgress] = useState({ totalAnswered: 0, correctCount: 0, totalStudents: 0 });

  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  useEffect(() => {
    // 🔗 Connect using environment variable or fallback
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    socketRef.current = io(socketUrl);

    // 🚪 Join Room
    socketRef.current.emit("join-room", {
      roomCode,
      userId: user.id,
      name: user.name,
      role: user.role
    });

    // 📡 Socket Listeners
    socketRef.current.on("participants-update", (updatedParticipants) => {
      setParticipants(updatedParticipants);
    });

    socketRef.current.on("progress-update", (newProgress) => {
      setProgress(newProgress);
    });

    socketRef.current.on("test-started", ({ firstQuestion, allowTeacherAttempt: allowAttempt }) => {
      setStatus("started");
      setCurrentQuestion(firstQuestion);
      setAllowTeacherAttempt(allowAttempt || false);
      setInitialTime(firstQuestion.timer || 30);
      setHasSubmitted(false);
      setSelectedAnswer(null);
    });

    socketRef.current.on("new-question", ({ question }) => {
      setCurrentQuestion(question);
      setInitialTime(question.timer || 30);
      setHasSubmitted(false);
      setSelectedAnswer(null);
    });

    socketRef.current.on("timer", ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socketRef.current.on("question-ended", () => {
      if (user.role === "teacher") {
        setNotification("⏳ Time ended for this question!");
        setTimeout(() => setNotification(""), 3000);
      }
    });

    socketRef.current.on("all-answered", () => {
      if (user.role === "teacher") {
        playAlertSound();
        setNotification("✅ All students answered!");
        setTimeout(() => setNotification(""), 3000);
      }
    });

    socketRef.current.on("test-ended", ({ leaderboard, allResults }) => {
      setStatus("ended");
      setResults({ leaderboard, allResults });
    });

    socketRef.current.on("error", ({ message }) => {
      setError(message);
      setTimeout(() => setError(""), 5000);
    });

    // 🛑 Cleanup
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [roomCode, user?.id, user?.name, user?.role]);

  const handleStartTest = () => socketRef.current.emit("start-test", { roomCode, userId: user.id });
  const handleNextQuestion = () => socketRef.current.emit("next-question", { roomCode, userId: user.id });
  const handleEndTest = () => socketRef.current.emit("end-test", { roomCode, userId: user.id });

  const handleSubmitAnswer = (index) => {
    if (hasSubmitted) return;
    setSelectedAnswer(index);
    setHasSubmitted(true);
    socketRef.current.emit("submit-answer", { roomCode, userId: user.id, answerIndex: index });
  };

  // --- SUB-COMPONENTS ---

  const Badge = ({ rank }) => {
    const badges = {
      Gold: { icon: <Trophy className="text-yellow-500" />, bg: "bg-yellow-100", label: "Gold" },
      Silver: { icon: <Trophy className="text-slate-400" />, bg: "bg-slate-100", label: "Silver" },
      Bronze: { icon: <Trophy className="text-orange-500" />, bg: "bg-orange-100", label: "Bronze" },
    };
    const b = badges[rank];
    if (!b) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${b.bg}`}>
        {b.icon} {b.label}
      </span>
    );
  };

  const GrowthIndicator = ({ type }) => {
    if (type === "increase") return <span className="text-green-500 flex items-center gap-1 text-sm font-bold"><ArrowUpRight size={16}/> Increase</span>;
    if (type === "decrease") return <span className="text-red-500 flex items-center gap-1 text-sm font-bold"><ArrowDownRight size={16}/> Decrease</span>;
    return <span className="text-slate-400 flex items-center gap-1 text-sm font-bold"><Minus size={16}/> Same</span>;
  };

  // --- RENDERING ---

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      
      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <span className="font-bold">Error:</span> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: 50 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: -20, x: 50 }}
            className="fixed top-36 right-4 z-50 bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-bold"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* WAITING STATE */}
      {status === "waiting" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto mt-12 bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-800"
        >
          <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
            <Users size={48} className="text-indigo-600" />
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tighter text-slate-900 dark:text-white">Room {roomCode}</h1>
          <p className="text-slate-500 text-lg mb-8">Challengers are assembling in the arena...</p>
          
          {/* Participants List */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4 px-4">
               <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                 <Users size={16}/> Participants ({participants.length})
               </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {participants.map((p) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={p.userId} 
                  className={`p-3 rounded-xl flex items-center gap-2 border ${p.role === 'teacher' ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.role === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">{p.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {user.role === "teacher" ? (
            <div className="flex flex-col gap-4 items-center">
              <button 
                onClick={handleStartTest} 
                disabled={participants.length < 2}
                className={`group relative px-12 py-5 text-white rounded-2xl font-black text-xl transition-all shadow-xl overflow-hidden active:scale-95 ${participants.length < 2 ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}
              >
                <span className="relative z-10 flex items-center gap-2 justify-center"><Play fill="currentColor" size={24}/> START BATTLE</span>
                {participants.length >= 2 && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>}
              </button>
              <button 
                onClick={handleEndTest}
                className="text-slate-400 hover:text-red-500 font-bold text-sm transition-colors"
              >
                End Session & Close Room
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-3 h-3 bg-indigo-600 rounded-full" />)}
              </div>
              <p className="font-bold text-indigo-600 uppercase tracking-widest text-sm">Waiting for teacher to start...</p>
            </div>
          )}
        </motion.div>
      )}

      {/* STARTED STATE */}
      {status === "started" && currentQuestion && (
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
             <div className="flex items-center gap-6 bg-white dark:bg-slate-900 px-8 py-5 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 flex-1 w-full md:w-auto">
                <div className={`relative w-16 h-16 flex items-center justify-center rounded-2xl transition-colors ${timeLeft < 10 ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                   <Timer size={32} className={timeLeft < 10 ? 'animate-pulse' : ''} />
                   <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-full font-black">{timeLeft}S</span>
                </div>
                <div className="flex-1">
                   <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: "100%" }} animate={{ width: `${(timeLeft / initialTime) * 100}%` }}
                        className={`h-full ${timeLeft < 10 ? 'bg-red-500' : 'bg-indigo-600'}`}
                      />
                   </div>
                   <div className="flex justify-between mt-2">
                     <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Time Remaining</p>
                     <p className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1"><Users size={12}/> {participants.length} Live</p>
                   </div>
                </div>
                 {user.role === "teacher" && (
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex gap-4 px-6 py-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Answered</p>
                    <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">{progress.totalAnswered} / {progress.totalStudents}</p>
                  </div>
                  <div className="w-px bg-indigo-200 dark:bg-indigo-700"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-green-500 tracking-widest">Correct</p>
                    <p className="text-xl font-black text-green-600">{progress.correctCount}</p>
                  </div>
                </div>
                <div className="flex gap-3 bg-white dark:bg-slate-900 p-3 rounded-[2rem] shadow-xl">
                  <button onClick={handleEndTest} className="px-6 py-4 bg-red-100 text-red-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-200">
                    <Power size={20}/> END
                  </button>
                </div>
              </div>
            )}
             </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentQuestion.question}
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="bg-white dark:bg-slate-900 p-10 md:p-16 rounded-[3rem] shadow-2xl border-b-[12px] border-indigo-600 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-600/5 rounded-br-[100%]"></div>
              <h3 className="text-3xl md:text-4xl font-black mb-12 leading-tight text-slate-900 dark:text-white relative z-10">{currentQuestion.question}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    disabled={(user.role === "teacher" && !allowTeacherAttempt) || hasSubmitted}
                    onClick={() => handleSubmitAnswer(index)}
                    className={`group relative p-8 text-left rounded-[2rem] border-2 transition-all font-bold text-xl overflow-hidden ${
                      selectedAnswer === index
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-500/30"
                        : "border-slate-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                    } ${hasSubmitted && selectedAnswer !== index ? "opacity-50 grayscale" : ""}`}
                  >
                    <span className="relative z-10 flex items-center gap-4">
                       <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${selectedAnswer === index ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                         {String.fromCharCode(65 + index)}
                       </span>
                       {option}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
               {/* Student Next Button */}
               {user.role !== "teacher" && hasSubmitted && (
                 <button onClick={handleNextQuestion} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 mt-4">
                   <SkipForward size={20}/> NEXT
                 </button>
               )}
        </div>
      )}

      {/* ENDED STATE */}
      {status === "ended" && results && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto py-10"
        >
          <div className="text-center mb-16">
            <h1 className="text-6xl font-black tracking-tighter text-indigo-600 mb-4 uppercase">Battle Finished!</h1>
            <p className="text-slate-500 text-xl font-bold">The final ranking of the arena.</p>
          </div>
          
          {/* PODIUM */}
          <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-20 px-4">
             {/* SILVER */}
             <motion.div initial={{ height: 0 }} animate={{ height: 280 }} transition={{ delay: 0.5, duration: 0.8 }} className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border-b-[10px] border-slate-300 relative flex flex-col items-center justify-center p-8 order-2 md:order-1">
                <div className="text-5xl mb-4 grayscale drop-shadow-lg">🥈</div>
                <div className="text-lg font-black text-slate-800 dark:text-slate-200 mb-1 truncate w-full text-center">{results.leaderboard[1]?.studentName || "---"}</div>
                <div className="text-4xl font-black text-slate-400">{results.leaderboard[1]?.score || 0}</div>
             </motion.div>

             {/* GOLD */}
             <motion.div initial={{ height: 0 }} animate={{ height: 380 }} transition={{ delay: 0.2, duration: 1 }} className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-b-[10px] border-yellow-500 relative flex flex-col items-center justify-center p-8 z-10 order-1 md:order-2">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="text-7xl mb-4 drop-shadow-xl">🥇</motion.div>
                <div className="text-2xl font-black text-indigo-600 mb-1 truncate w-full text-center">{results.leaderboard[0]?.studentName || "---"}</div>
                <div className="text-6xl font-black text-slate-900 dark:text-white">{results.leaderboard[0]?.score || 0}</div>
                <div className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-black text-xs uppercase tracking-widest">Supreme Champion</div>
             </motion.div>

             {/* BRONZE */}
             <motion.div initial={{ height: 0 }} animate={{ height: 220 }} transition={{ delay: 0.8, duration: 0.8 }} className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border-b-[10px] border-orange-400 relative flex flex-col items-center justify-center p-8 order-3">
                <div className="text-5xl mb-4 drop-shadow-lg opacity-80">🥉</div>
                <div className="text-lg font-black text-slate-800 dark:text-slate-200 mb-1 truncate w-full text-center">{results.leaderboard[2]?.studentName || "---"}</div>
                <div className="text-4xl font-black text-orange-600">{results.leaderboard[2]?.score || 0}</div>
             </motion.div>
          </div>

          {/* TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-8 py-6 text-left text-xs font-black uppercase text-slate-400 tracking-widest">Rank</th>
                  <th className="px-8 py-6 text-left text-xs font-black uppercase text-slate-400 tracking-widest">Warrior</th>
                  <th className="px-8 py-6 text-center text-xs font-black uppercase text-slate-400 tracking-widest">Score</th>
                  <th className="px-8 py-6 text-center text-xs font-black uppercase text-slate-400 tracking-widest">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {results.allResults.map((res, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${res.studentId === user.id ? 'bg-indigo-50/30' : ''}`}
                  >
                    <td className="px-8 py-6">
                       <span className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-lg">{i + 1}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-lg">{res.studentName}</div>
                        <Badge rank={res.badge} />
                        {res.studentId === user.id && <span className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-black rounded uppercase">You</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="text-2xl font-black text-slate-900 dark:text-white">{res.score}</span>
                    </td>
                    <td className="px-8 py-6 flex justify-center">
                       <GrowthIndicator type={res.growth} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-16 text-center">
            <button onClick={() => navigate("/board")} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 shadow-2xl shadow-indigo-500/40 transform hover:-translate-y-1 transition-all">BACK TO HEADQUARTERS</button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LiveRoom;
