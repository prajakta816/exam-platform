import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import LeaderboardTable from "../../components/Leaderboard/LeaderboardTable";
import CommentSection from "../../components/CommentSection";
import RatingSystem from "../../components/RatingSystem";
import { Sparkles, CheckCircle2 } from "lucide-react";

function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [explaining, setExplaining] = useState({});

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const res = await API.get(`/quiz/${id}`);
      setQuiz(res.data);
      setAnswers(new Array(res.data.questions.length).fill(null));
    } catch(err) {
      console.error(err);
    }
  };

  const handleSelectOption = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const res = await API.post(`/quiz/attempt/${id}`, { answers });
      setResult(res.data);
      
      // 🆕 AUTOMATICALLY fetch AI explanations for all incorrect answers sequentially
      (async () => {
        for (let i = 0; i < quiz.questions.length; i++) {
          if (answers[i] !== quiz.questions[i].correctAnswer) {
            setExplaining(prev => ({ ...prev, [i]: true }));
            try {
              const q = quiz.questions[i];
              const aiRes = await API.post("/ai/explanation", {
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                studentAnswer: answers[i]
              });
              setExplanations(prev => ({ ...prev, [i]: aiRes.data.explanation }));
              await new Promise(r => setTimeout(r, 1500));
            } catch (err) {
              console.error("Auto AI explanation error:", err);
            } finally {
              setExplaining(prev => ({ ...prev, [i]: false }));
            }
          }
        }
      })();

    } catch (err) {
      console.error("Error submitting quiz", err);
      alert("Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAIExplanation = async (qIdx) => {
    if (explanations[qIdx]) return;
    setExplaining(prev => ({ ...prev, [qIdx]: true }));
    try {
      const q = quiz.questions[qIdx];
      const res = await API.post("/ai/explanation", {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        studentAnswer: answers[qIdx]
      });
      setExplanations(prev => ({ ...prev, [qIdx]: res.data.explanation }));
    } catch (err) {
      console.error(err);
    } finally {
      setExplaining(prev => ({ ...prev, [qIdx]: false }));
    }
  };

  if (!quiz) return (
    <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (result) return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-50 p-10 text-center mb-12">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">Quiz Completed!</h2>
        <p className="text-slate-500 font-bold mb-10 text-lg">"{quiz.title}"</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="bg-indigo-50 rounded-[2rem] p-8 border border-indigo-100 shadow-inner">
            <p className="text-sm font-black text-indigo-400 mb-2 uppercase tracking-widest">Final Score</p>
            <p className="text-5xl font-black text-indigo-600">{result.score} <span className="text-2xl text-indigo-300">/ {result.totalQuestions}</span></p>
          </div>
          <div className="bg-violet-50 rounded-[2rem] p-8 border border-violet-100 shadow-inner">
            <p className="text-sm font-black text-violet-400 mb-2 uppercase tracking-widest">Accuracy</p>
            <p className="text-5xl font-black text-violet-600">{result.percentage.toFixed(1)}%</p>
          </div>
        </div>

        {result.feedback && (
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-10 text-left mb-12 shadow-2xl shadow-indigo-200 group">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-20 -mb-20 blur-2xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center">
                <span className="bg-white/20 backdrop-blur-md text-white p-3 rounded-2xl mr-4 shadow-xl border border-white/30">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                AI Personal Analysis
              </h3>
              <div className="space-y-4">
                <p className="text-indigo-50 leading-relaxed text-lg font-medium italic">
                  "{result.feedback}"
                </p>
                <div className="pt-4 flex items-center text-indigo-200 text-sm font-bold uppercase tracking-widest">
                  <span className="w-8 h-[2px] bg-indigo-300/50 mr-3"></span>
                  Personalized for you
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/board')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-10 py-4 rounded-2xl font-black transition-all"
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate(`/profile/${quiz.createdBy}`)}
            className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black shadow-lg transition-all"
          >
            Visit Creator
          </button>
        </div>
      </div>

      {/* 🆕 Detailed Review Section */}
      <div className="space-y-8 mb-12">
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <span className="p-2 bg-indigo-600 text-white rounded-lg"><Sparkles size={20}/></span> Detailed Review
        </h3>
        {quiz.questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
            <div className="p-8">
              <div className="flex justify-between items-start gap-4 mb-6">
                <p className="text-lg font-bold text-slate-800">
                  <span className="text-indigo-600 mr-2">Q{qIdx + 1}.</span> {q.question}
                </p>
                <div className={`shrink-0 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${answers[qIdx] === q.correctAnswer ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {answers[qIdx] === q.correctAnswer ? 'Correct' : 'Incorrect'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className={`p-4 rounded-xl border-2 text-sm font-bold flex items-center justify-between ${
                    oIdx === q.correctAnswer ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                    oIdx === answers[qIdx] ? 'border-red-500 bg-red-50 text-red-700' :
                    'border-slate-50 bg-slate-50 text-slate-500'
                  }`}>
                    {opt}
                    {oIdx === q.correctAnswer && <CheckCircle2 size={16} />}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50">
                {!explanations[qIdx] ? (
                  <button 
                    onClick={() => getAIExplanation(qIdx)}
                    disabled={explaining[qIdx]}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {explaining[qIdx] ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Sparkles size={14}/>}
                    {answers[qIdx] !== q.correctAnswer ? (explaining[qIdx] ? "AI Tutor analyzing wrong answer..." : "Explain Wrong Answer with AI") : "Explain with AI"}
                  </button>
                ) : (
                  <div className={`p-6 rounded-2xl border animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm ${answers[qIdx] !== q.correctAnswer ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-100' : 'bg-indigo-50/50 border-indigo-100'}`}>
                    <p className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${answers[qIdx] !== q.correctAnswer ? 'text-red-600' : 'text-indigo-400'}`}>
                      <Sparkles size={14} /> {answers[qIdx] !== q.correctAnswer ? "AI Tutor: Why Your Answer Was Incorrect" : "AI Explanation"}
                    </p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                      "{explanations[qIdx]}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        <RatingSystem targetId={id} targetType="quiz" />
        <LeaderboardTable quizId={id} />
        <CommentSection targetId={id} targetType="quiz" />
      </div>
    </div>
  );

  const currentQ = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-10 mb-8">
        <h2 className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">
          {currentQuestionIndex + 1}. {currentQ.question}
        </h2>

        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => (
            <div 
              key={idx}
              onClick={() => handleSelectOption(idx)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center
                ${answers[currentQuestionIndex] === idx 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                }`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3
                ${answers[currentQuestionIndex] === idx ? 'border-indigo-500' : 'border-gray-300'}`}>
                {answers[currentQuestionIndex] === idx && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>}
              </div>
              <span className={`text-base ${answers[currentQuestionIndex] === idx ? 'text-indigo-900 font-medium' : 'text-gray-700'}`}>
                {opt}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            currentQuestionIndex === 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <button
            onClick={submitQuiz}
            disabled={submitting}
            className={`px-8 py-2.5 rounded-lg font-medium text-white shadow-sm transition transform
              ${submitting
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-0.5'
              }`}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default Quiz;