import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Trophy, Clock, XCircle, UserCircle, Swords, CheckCircle2 } from "lucide-react";
import API from "../../services/api";
import { getLocalUser } from "../../utils/auth";

const SERVER_URL = "http://localhost:5000";

const BattleArena = () => {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const currentUser = getLocalUser();

  const [battleData, setBattleData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [scores, setScores] = useState({ challenger: 0, opponent: 0 });
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [battleState, setBattleState] = useState("waiting"); // waiting, active, ended
  const [winner, setWinner] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchBattleDetails();
    
    // Connect to specific battle namespace
    const socketUrl = `${SERVER_URL}/battle`;
    socketRef.current = io(socketUrl);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-battle", { battleId, userId: currentUser.id });
    });

    socketRef.current.on("battle-ready", () => {
      setIsReady(true);
      setBattleState("active");
      startTimer();
    });

    socketRef.current.on("battle-score-update", (newScores) => {
      setScores(newScores);
    });

    socketRef.current.on("next-battle-question", () => {
      moveToNextQuestion();
    });

    socketRef.current.on("battle-ended", ({ winner, scores }) => {
      setScores(scores);
      setWinner(winner);
      setBattleState("ended");
      clearInterval(timerRef.current);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(timerRef.current);
    };
  }, [battleId]);

  const fetchBattleDetails = async () => {
    try {
      const res = await API.get(`/battle/${battleId}`);
      setBattleData(res.data);
      setQuestions(res.data.quiz.questions);
      setScores(res.data.scores);
      if (res.data.status === "completed") {
        setBattleState("ended");
        setWinner(res.data.winner);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching battle details");
      navigate("/board");
    }
  };

  const startTimer = () => {
    setTimeLeft(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (!hasAnswered) {
      submitAnswer(null); // Time up -> wrong answer
    }
  };

  const moveToNextQuestion = () => {
    setHasAnswered(false);
    setCurrentQIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= questions.length) {
        socketRef.current.emit("end-battle", { battleId });
        return prev;
      }
      startTimer();
      return nextIndex;
    });
  };

  const submitAnswer = (optionIndex) => {
    if (hasAnswered) return;
    setHasAnswered(true);

    const isCorrect = optionIndex !== null && optionIndex === questions[currentQIndex]?.correctAnswer;
    
    socketRef.current.emit("submit-battle-answer", {
      battleId,
      userId: currentUser.id,
      isCorrect,
      questionIndex: currentQIndex
    });
  };

  if (!battleData || questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-indigo-600">Summoning Arena...</div>;
  }

  const challenger = battleData.challenger;
  const opponent = battleData.opponent;

  // Render winner screen
  if (battleState === "ended") {
    let resultMessage = "It's a tie!";
    if (winner === currentUser.id) resultMessage = "You Won!";
    else if (winner) resultMessage = "You Lost!";

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white animate-in zoom-in duration-500">
        <Trophy size={100} className={`mb-6 ${winner === currentUser.id ? 'text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]' : 'text-slate-600'}`} />
        <h1 className="text-6xl font-black mb-4 tracking-tight">{resultMessage}</h1>
        
        <div className="flex items-center gap-16 my-12">
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-400 mb-2">{challenger.name}</h3>
            <p className="text-5xl font-black text-rose-500">{scores.challenger}</p>
          </div>
          <span className="text-4xl font-black text-slate-700">VS</span>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-400 mb-2">{opponent.name}</h3>
            <p className="text-5xl font-black text-blue-500">{scores.opponent}</p>
          </div>
        </div>

        <button 
          onClick={() => navigate("/board")}
          className="px-10 py-4 bg-indigo-600 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Render Waiting Screen
  if (battleState === "waiting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Swords size={64} className="text-orange-500 mb-8 animate-pulse" />
        <h1 className="text-4xl font-black mb-4">Waiting for Opponent...</h1>
        <p className="text-slate-400 font-medium text-lg">The battle will begin as soon as they connect.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQIndex];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-6 pb-20">
      
      {/* 🔴 Top Bar: Players & Score */}
      <div className="max-w-6xl mx-auto w-full px-6 mb-8 flex items-center justify-between">
        {/* Challenger Card */}
        <div className="flex items-center gap-4 bg-white p-4 pr-8 rounded-[2rem] shadow-sm border-2 border-rose-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-rose-50 to-transparent"></div>
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center border-4 border-white shadow-md relative z-10">
            {challenger.profilePic ? <img src={`${SERVER_URL}/${challenger.profilePic}`} alt="" className="w-full h-full rounded-full object-cover"/> : <UserCircle size={32} className="text-rose-400"/>}
          </div>
          <div className="relative z-10">
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{challenger.name}</p>
            <p className="text-3xl font-black text-rose-500 leading-none">{scores.challenger}</p>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center">
          <Swords size={40} className="text-slate-300 mb-2" />
          <div className={`px-6 py-2 rounded-full font-black text-xl flex items-center gap-2 ${timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-200 text-slate-700'}`}>
            <Clock size={20} /> 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </div>
        </div>

        {/* Opponent Card */}
        <div className="flex items-center gap-4 bg-white p-4 pl-8 rounded-[2rem] shadow-sm border-2 border-blue-100 relative overflow-hidden flex-row-reverse text-right">
          <div className="absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-blue-50 to-transparent"></div>
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-md relative z-10">
            {opponent.profilePic ? <img src={`${SERVER_URL}/${opponent.profilePic}`} alt="" className="w-full h-full rounded-full object-cover"/> : <UserCircle size={32} className="text-blue-400"/>}
          </div>
          <div className="relative z-10">
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{opponent.name}</p>
            <p className="text-3xl font-black text-blue-500 leading-none">{scores.opponent}</p>
          </div>
        </div>
      </div>

      {/* 🔴 Question Area */}
      <div className="max-w-4xl mx-auto w-full px-6 flex-grow flex flex-col">
        <div className="bg-white rounded-[3rem] shadow-xl p-10 md:p-14 border border-slate-100 text-center relative overflow-hidden mb-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-indigo-500 rounded-b-xl"></div>
          <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full font-black text-[10px] uppercase tracking-widest mb-8 border border-indigo-100">
            Question {currentQIndex + 1} of {questions.length}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-4">
            {currentQuestion?.question}
          </h2>
        </div>

        {/* 🔴 Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion?.options.map((opt, i) => {
            return (
              <button
                key={i}
                onClick={() => submitAnswer(i)}
                disabled={hasAnswered}
                className={`p-6 rounded-[2rem] text-left transition-all border-2 flex items-center gap-4 group ${
                  hasAnswered
                    ? i === currentQuestion.correctAnswer
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                    : "bg-white border-slate-100 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 active:scale-95 cursor-pointer"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition-colors ${
                  hasAnswered && i === currentQuestion.correctAnswer ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white"
                }`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="font-bold text-lg md:text-xl">{opt}</span>
              </button>
            );
          })}
        </div>

        {hasAnswered && (
          <div className="mt-8 p-6 bg-slate-900 text-white rounded-[2rem] text-center animate-in slide-in-from-bottom-4 flex flex-col items-center">
            <Clock size={32} className="text-orange-400 mb-3 animate-spin-slow" />
            <h4 className="font-black text-xl mb-1">Waiting for opponent...</h4>
            <p className="text-slate-400 text-sm font-medium">The next question will start automatically.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default BattleArena;
