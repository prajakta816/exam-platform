import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { Sparkles, ArrowRight, Newspaper, Cpu, Code, Zap } from "lucide-react";

const Home = () => {
  const [news, setNews] = useState([]);
  const [headline, setHeadline] = useState("AI & Engineering News");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await API.get("/content/daily");
        setNews(res.data.news);
        setHeadline(res.data.headline);
      } catch (err) {
        console.error("Failed to fetch news", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50/50 -skew-x-12 translate-x-1/4"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <Zap size={16} fill="currentColor" />
              <span>Real-time Technology Updates</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
              Master Your Exams with <span className="text-indigo-600">AI Intelligence</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl">
              Stay ahead of the curve with daily engineering insights and AI-powered quiz generation. Join the community of future-ready engineers.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="/register" className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                Get Started Free
              </a>
              <a href="#news" className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center gap-2">
                Explore News <ArrowRight size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section id="news" className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 flex items-center gap-4">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                <Newspaper size={32} />
              </div>
              {headline}
            </h2>
            <p className="text-slate-500 text-lg font-medium">Curated daily updates from the world of technology and engineering.</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Auto-updated daily</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-[2.5rem] p-4 border border-slate-100 animate-pulse">
                <div className="w-full h-60 bg-slate-100 rounded-[2rem] mb-6"></div>
                <div className="h-6 bg-slate-100 rounded-full w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-100 rounded-full w-full mb-2"></div>
                <div className="h-4 bg-slate-100 rounded-full w-5/6"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item, idx) => (
              <div 
                key={idx} 
                className="group bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
              >
                <div className="relative h-60 overflow-hidden rounded-[2rem] mb-6">
                  <img 
                    src={item.urlToImage} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
                      {idx % 2 === 0 ? <Cpu size={14} className="inline mr-1 mb-1" /> : <Code size={14} className="inline mr-1 mb-1" />}
                      Tech Insight
                    </span>
                  </div>
                </div>
                
                <div className="px-2 flex-grow">
                  <h3 className="text-xl font-black text-slate-800 mb-3 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                    {item.description || "No description available for this update. Click 'Read More' to view the full details of this technology breakthrough."}
                  </p>
                </div>

                <div className="mt-auto px-2 pb-2">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-3 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm group/btn"
                  >
                    Read Article 
                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trust Section */}
      <section className="bg-slate-900 py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
            Ready to Accelerate Your <br/><span className="text-indigo-400">Engineering Journey?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto font-medium">
            Join thousands of students and teachers building the future of technical education. Create your first AI quiz in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
              <Sparkles className="text-indigo-400" />
              <div className="text-left">
                <p className="text-white font-bold leading-none">10k+</p>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">AI Quizzes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
              <Zap className="text-amber-400" />
              <div className="text-left">
                <p className="text-white font-bold leading-none">Daily</p>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Tech Updates</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
