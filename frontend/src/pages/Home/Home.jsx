import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  ExternalLink,
  Newspaper,
  Cpu,
  Code
} from "lucide-react";

const Home = () => {
  const [news, setNews] = useState([]);
  const [headline, setHeadline] = useState("AI & Engineering News");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await API.get("/content/daily");
        setHeadline(res.data.headline || "AI & Engineering News");
        setNews(Array.isArray(res.data.news) ? res.data.news : []);
      } catch (err) {
        console.error("Failed to fetch daily news", err);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-600">
      
      {/* 🚀 HERO SECTION */}
      <section className="relative w-full min-h-[85vh] flex items-center pt-20 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600 rounded-full blur-[100px] delay-700"></div>
        </div>

        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-black uppercase tracking-[0.2em]">
              <Zap size={14} className="fill-current" />
              <span>Technology Pulse</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter">
              Master the <br/>
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent bg-300% animate-gradient">Future of AI.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-xl leading-relaxed font-medium">
              Join the world's most advanced engineering community. Stay ahead with daily technical insights and AI-driven breakdowns of the industry's biggest breakthroughs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/register" className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95 group">
                Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                Sign In
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:block relative group">
            <img 
              src="https://images.unsplash.com/photo-1620712943543-bcc4628c9757?auto=format&fit=crop&q=80&w=1000" 
              alt="AI Intelligence" 
              className="w-full aspect-square object-cover rounded-[3rem] shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* 📰 AI INSIGHTS FEED */}
      <main className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 text-indigo-600 font-black uppercase tracking-widest text-xs">
              <Sparkles size={16} /> 
              <span>Curated Insights</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {headline}
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-2xl">
              Fresh technical deep-dives and engineering breakthroughs, updated daily by our AI discovery engine.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Synced • {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-slate-50 rounded-[2.5rem] p-6 h-[450px] animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {news.map((item, idx) => (
              <div 
                key={idx} 
                className="group flex flex-col bg-white border border-slate-100 rounded-[2.5rem] p-5 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="relative w-full aspect-video overflow-hidden rounded-[2rem] mb-6 shadow-sm">
                  <img 
                    src={item.urlToImage || "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800"} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
                      {idx % 2 === 0 ? <Cpu size={14} className="inline mr-1 mb-1" /> : <Code size={14} className="inline mr-1 mb-1" />}
                      Tech Insight
                    </span>
                  </div>
                </div>
                
                <div className="flex-grow px-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Article</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 leading-tight mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                    {item.description || "Deep dive into the latest technological advancements shaping our world."}
                  </p>
                </div>

                <div className="pt-2">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all group/btn"
                  >
                    Read Story <ExternalLink size={14} className="group-hover/btn:scale-110 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 🏁 DENSE FOOTER */}
      <footer className="w-full bg-slate-50 pt-20 pb-10 border-t border-slate-100">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2 space-y-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-xl">
                  <Sparkles className="text-white" size={24} />
                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  EXAMPRO
                </span>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm font-medium">
                The world's leading adaptive learning platform for engineers. Empowering the next generation of technical talent through AI-driven insights.
              </p>
            </div>

            {[
              { title: "Platform", links: ["Features", "Live Arena", "AI Quiz Lab", "Leaderboards"] },
              { title: "Resources", links: ["Daily News", "Engineering Notes", "Help Center", "Community"] },
              { title: "Company", links: ["About Us", "Privacy Policy", "Terms of Service", "Contact"] }
            ].map((col, idx) => (
              <div key={idx}>
                <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6">{col.title}</h5>
                <ul className="space-y-4">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">© 2026 EXAMPRO AI. All Rights Reserved.</p>
            <div className="flex items-center gap-8">
              <span className="flex items-center gap-2 text-xs font-black text-emerald-500">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
