import React, { useState } from "react";
import API from "../../services/api";
import { Calendar, Sparkles, Map, Flag, CheckCircle2, ArrowRight } from "lucide-react";

const StudyPlanner = () => {
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic || !date) return;
    setLoading(true);
    try {
      const res = await API.post("/ai/study-plan", { topic, examDate: date });
      setPlan(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          <Sparkles size={14} /> AI Engine Active
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">AI Study Planner</h1>
        <p className="text-slate-500 text-lg font-medium">Enter your goal and deadline. AI will handle the roadmap.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Sidebar Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl sticky top-24">
            <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight">Goal Details</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Topic / Subject</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Exam / Target Date</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={loading || !topic || !date}
                className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-xl ${
                  loading ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 active:scale-95'
                }`}
              >
                {loading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Map size={16} />}
                Generate Roadmap
              </button>
            </div>
          </div>
        </div>

        {/* Plan Result */}
        <div className="lg:col-span-2">
          {!plan && !loading ? (
            <div className="h-full min-h-[400px] bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-6 shadow-sm">
                <Flag size={32} />
              </div>
              <h4 className="text-xl font-black text-slate-400 uppercase tracking-tight">Your Roadmap Awaits</h4>
              <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">Submit the form to see your AI-generated study progression.</p>
            </div>
          ) : loading ? (
            <div className="space-y-6">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-[2rem] animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
              {plan.map((step, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex gap-8">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                      {idx + 1}
                    </div>
                    {idx !== plan.length - 1 && <div className="w-1 flex-grow bg-slate-100 my-4 rounded-full" />}
                  </div>
                  <div className="pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 block">{step.day}</span>
                    <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{step.task}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">{step.details}</p>
                    <div className="mt-6 flex items-center gap-4">
                      <button className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                        <CheckCircle2 size={14} /> Mark Done
                      </button>
                      <button className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-all">
                        Resources <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlanner;
