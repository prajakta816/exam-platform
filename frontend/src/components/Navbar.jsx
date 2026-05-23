import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Search,
  LogOut,
  Home,
  LayoutDashboard,
  FileText,
  Sparkles,
  PlusCircle,
  BarChart3,
  UserCircle,
  LogIn,
  Users,
  X,
  Bell,
  Check,
  Moon,
  Sun,
  Radio,
  Trophy,
  Menu,
  ChevronDown,
  Map,
  Star
} from "lucide-react";
import { getLocalUser } from "../utils/auth";
import API from "../services/api";
import { useDarkMode } from "../context/DarkModeContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const [isDark, toggleDark] = useDarkMode();

  useEffect(() => {
    const currentUser = getLocalUser();
    setUser(currentUser);
    if (currentUser) fetchNotifications();
  }, [location.pathname]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowResults(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Notif error", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await API.get(`/user/search?name=${searchQuery}`);
      setSearchResults(res.data);
      setShowResults(true);
    } catch (error) {
      console.error("Search error", error);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const NavLink = ({ to, icon: Icon, children }) => (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-sm font-black uppercase tracking-widest ${
        location.pathname === to 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
          : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
      }`}
    >
      <span>{children}</span>
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 h-20 flex items-center shadow-sm">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="flex justify-between items-center h-full">
          
          {/* 🧩 LEFT: LOGO */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-indigo-600 p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-xl shadow-indigo-100">
                <Sparkles className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                EXAMPRO
              </span>
            </Link>
          </div>

          {/* 🧩 CENTER: NAVIGATION (Hidden on Mobile) */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-full border border-slate-100">
            <NavLink to="/" icon={Home}>Home</NavLink>
            {user && (
              <>
                <NavLink to="/board" icon={LayoutDashboard}>Board</NavLink>
                <NavLink to="/ai" icon={Sparkles}>AI Quiz</NavLink>
                {user.role === "student" ? (
                  <NavLink to="/live-join" icon={Radio}>Live</NavLink>
                ) : (
                  <NavLink to="/live-dashboard" icon={Radio}>Battle</NavLink>
                )}
                <NavLink to="/notes" icon={FileText}>Notes</NavLink>
                <NavLink to="/study-planner" icon={Map}>Planner</NavLink>
                <NavLink to="/requests" icon={Users}>Requests</NavLink>
              </>
            )}
          </div>

          {/* 🧩 RIGHT: ACTIONS (Search + Profile) */}
          <div className="flex items-center gap-4">
            
            {/* Expanded Search Bar (Desktop) */}
            <div className="hidden xl:relative xl:block" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search network..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  className="w-64 pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-xs font-bold transition-all"
                />
              </div>
              
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-4 w-80 right-0 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Search Results</div>
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map(result => (
                      <div 
                        key={result._id} 
                        onClick={() => {
                          navigate(`/profile/${result._id}`);
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                        className="p-4 flex items-center gap-4 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-slate-50 last:border-none group"
                      >
                        <div className="w-10 h-10 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center text-indigo-600 font-black shadow-sm group-hover:border-indigo-600">
                          {result.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-black text-slate-800 truncate">{result.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{result.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggleDark} className="p-3 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {!user ? (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="px-6 py-3 text-slate-600 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors">Login</Link>
                  <Link to="/register" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Join Free</Link>
                </div>
              ) : (
                <>
                  <div className="relative" ref={notifRef}>
                    <button onClick={() => setShowNotifications(!showNotifications)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all relative">
                      <Bell size={22} />
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute top-full right-0 mt-4 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                          <h4 className="font-black text-slate-800 text-lg">Activity</h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">Recent</span>
                        </div>
                        <div className="max-h-[450px] overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 italic text-sm font-medium">Clear for take-off! No news yet.</div>
                          ) : (
                            notifications.map(n => (
                              <div key={n._id} className={`p-6 border-b border-slate-50 last:border-none transition-colors flex gap-4 ${!n.isRead ? 'bg-indigo-50/20' : 'hover:bg-slate-50'}`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border-2 ${
                                  n.type === 'start_live' ? 'bg-red-50 text-red-600 border-red-100' :
                                  n.type === 'note_download' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  n.type === 'quiz_rating' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-indigo-50 text-indigo-600 border-indigo-100'
                                }`}>
                                  {n.type === 'start_live' ? <Radio size={20}/> :
                                   n.type === 'note_download' ? <BookOpen size={20}/> :
                                   n.type === 'quiz_rating' ? <Star size={20}/> :
                                   <Users size={20}/>}
                                </div>
                                <div className="flex-grow">
                                  <p className="text-sm text-slate-800 leading-snug font-bold mb-1">{n.message}</p>
                                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                    {new Date(n.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                {!n.isRead && (
                                  <button onClick={() => markAsRead(n._id)} className="w-8 h-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-all">
                                    <Check size={16} />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-10 w-[1px] bg-slate-100 mx-2"></div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/profile/${user.id}`)} className="flex items-center gap-3 p-1.5 pr-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-xl shadow-indigo-100 overflow-hidden">
                        {user.profilePic ? (
                          <img src={`http://localhost:5000/${user.profilePic}`} alt="" className="w-full h-full object-cover" />
                        ) : user.name.charAt(0)}
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-xs font-black text-slate-900 leading-none mb-1 uppercase tracking-tight">{user.name.split(' ')[0]}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user.role}</p>
                      </div>
                      <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors ml-2" />
                    </button>
                    <button onClick={logout} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                      <LogOut size={22} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-3 text-slate-600 bg-slate-100 rounded-2xl">
              <Menu size={24} />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white p-8 flex flex-col animate-in slide-in-from-right-full duration-500">
            <div className="flex items-center justify-between mb-12">
              <span className="text-2xl font-black text-slate-900 tracking-tighter">MENU</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-xl"><X size={24}/></button>
            </div>
            <nav className="flex flex-col gap-6">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black text-slate-900 hover:text-indigo-600 transition-colors">Home</Link>
              {user && (
                <>
                  <Link to="/board" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black text-slate-900 hover:text-indigo-600 transition-colors">Board</Link>
                  <Link to="/ai" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black text-slate-900 hover:text-indigo-600 transition-colors">AI Quiz</Link>
                  <Link to="/notes" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black text-slate-900 hover:text-indigo-600 transition-colors">Notes Hub</Link>
                  <Link to="/requests" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black text-slate-900 hover:text-indigo-600 transition-colors">Community</Link>
                </>
              )}
            </nav>
            <div className="mt-auto">
              {user ? (
                <button onClick={logout} className="w-full py-5 bg-red-50 text-red-600 rounded-[2rem] font-black uppercase tracking-widest">Logout</button>
              ) : (
                <Link to="/login" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest block text-center">Login Now</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}