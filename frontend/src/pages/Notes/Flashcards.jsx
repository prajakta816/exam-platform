import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { Sparkles, Brain, ArrowLeft, ArrowRight, RotateCcw, Layout } from "lucide-react";

const Flashcards = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    fetchFlashcards();
  }, [noteId]);

  const fetchFlashcards = async () => {
    try {
      const res = await API.post("/ai/flashcards", { noteId });
      setCards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
      <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">AI is extracting concepts...</p>
    </div>
  );

  if (cards.length === 0) return <div className="text-center mt-20">No flashcards generated.</div>;

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-black uppercase tracking-widest text-xs"
      >
        <ArrowLeft size={16} /> Back to Notes
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center justify-center gap-3">
          <Brain className="text-violet-600" size={36} /> AI Flashcards
        </h1>
        <p className="text-slate-500 font-medium">Master key concepts with active recall.</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
          <span>Progress</span>
          <span>{currentIndex + 1} / {cards.length}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-violet-600 transition-all duration-500" 
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card Container */}
      <div className="perspective-1000 h-[400px] mb-12">
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full h-full transition-all duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl flex flex-col items-center justify-center p-12 text-center group">
            <div className="absolute top-8 left-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Front</div>
            <h2 className="text-3xl font-black text-slate-800 leading-tight">
              {currentCard.front}
            </h2>
            <div className="mt-12 text-violet-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to flip <RotateCcw size={14} />
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-violet-600 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-12 text-center rotate-y-180">
            <div className="absolute top-8 left-8 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">Back</div>
            <p className="text-xl font-medium text-white leading-relaxed">
              {currentCard.back}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-6">
        <button 
          onClick={() => { setCurrentIndex(prev => Math.max(0, prev - 1)); setIsFlipped(false); }}
          className="p-6 bg-white border border-slate-100 rounded-3xl text-slate-400 hover:text-violet-600 hover:shadow-xl transition-all active:scale-95 disabled:opacity-30"
          disabled={currentIndex === 0}
        >
          <ArrowLeft size={24} />
        </button>
        <button 
          onClick={() => { setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1)); setIsFlipped(false); }}
          className="p-6 bg-violet-600 rounded-3xl text-white shadow-xl shadow-violet-100 hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-30"
          disabled={currentIndex === cards.length - 1}
        >
          <ArrowRight size={24} />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
};

export default Flashcards;
