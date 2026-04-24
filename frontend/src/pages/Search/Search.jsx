import React, { useState, useEffect } from "react";
import { Search as SearchIcon, UserPlus, UserCheck, ArrowRight, Sparkles, Users } from "lucide-react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300); // ✅ UPDATED TO 300ms

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/user/search?name=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-[calc(100vh-4rem)]">
      <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4">
          <Users size={14} /> Community Search
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
          Find your next <span className="text-indigo-600">Mentor</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Search for creators, teachers, and fellow students to follow their journey and access their shared quizzes and notes.
        </p>
      </div>

      {/* Search Input Area */}
      <div className="relative max-w-2xl mx-auto mb-16 group z-50">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="pl-6 text-slate-400">
            <SearchIcon size={24} />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-6 px-4 text-xl font-medium outline-none text-slate-800 placeholder:text-slate-300"
          />
          {loading && (
            <div className="pr-6">
              <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* 🆕 Floating Dropdown Suggestions */}
        {query && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2">
              {results.slice(0, 5).map((user) => (
                <div
                  key={user._id}
                  onClick={() => navigate(`/profile/${user._id}`)}
                  className="flex items-center gap-4 p-3 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors group/item"
                >
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 group-hover/item:text-indigo-600">{user.name}</h4>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">{user.role}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover/item:text-indigo-600" />
                </div>
              ))}
            </div>
            <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing top {Math.min(results.length, 5)} matches
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((user) => (
          <div 
            key={user._id}
            onClick={() => navigate(`/profile/${user._id}`)}
            className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-2xl mb-4 border-4 border-white shadow-lg group-hover:scale-110 transition-transform">
                {user.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{user.name}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 mb-6">{user.role}</p>
              
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                View Profile <ArrowRight size={16} />
              </div>
            </div>
          </div>
        ))}

        {!loading && query && results.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 text-slate-300 rounded-full mb-6">
              <Users size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">No creators found</h3>
            <p className="text-slate-400 mt-2">Try searching for a different name or role.</p>
          </div>
        )}

        {!query && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 text-indigo-400 rounded-full mb-6 animate-pulse">
              <Sparkles size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Start typing to explore</h3>
            <p className="text-slate-400 mt-2">Discover brilliant minds in the community.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
