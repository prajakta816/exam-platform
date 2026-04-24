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
  Sun
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
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
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
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const NavLink = ({ to, icon: Icon, children }) => (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold ${
        location.pathname === to 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
          : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
      }`}
    >
      <Icon size={18} />
      <span className="hidden lg:inline">{children}</span>
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-700/60 h-16 flex items-center shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center gap-4">
          
          {/* Left: Logo + Home */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <Sparkles className="text-white" size={22} />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight hidden sm:block">
                EXAMPRO
              </span>
            </Link>
            
            {/* Search Bar */}
            <div className="relative w-48 sm:w-64 lg:w-96" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                />
              </div>
              
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map(result => (
                      <div 
                        key={result._id} 
                        onClick={() => {
                          navigate(`/profile/${result._id}`);
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                        className="p-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-none"
                      >
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">
                          {result.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-800 truncate">{result.name}</p>
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">{result.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Dynamic Menu */}
          <div className="flex items-center gap-2">
            {!user ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/" 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold ${
                    location.pathname === "/" 
                      ? "bg-indigo-50 text-indigo-600" 
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Home size={18} />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <Link 
                  to="/login" 
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <LogIn size={18} />
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  Join
                </Link>
              </div>
            ) : (
              <>
                <div className="hidden md:flex items-center gap-1 mr-4 border-r border-slate-100 pr-4">
                  <NavLink to="/" icon={Home}>Home</NavLink>
                  <NavLink to="/board" icon={LayoutDashboard}>Board</NavLink>
                  <NavLink to="/ai" icon={Sparkles}>AI Quiz</NavLink>
                  
                  {user.role === "student" ? (
                    <>
                      <NavLink to="/notes" icon={FileText}>Notes</NavLink>
                      <NavLink to="/history" icon={BarChart3}>History</NavLink>
                    </>
                  ) : (
                    <>
                      <NavLink to="/create-quiz" icon={PlusCircle}>Create</NavLink>
                      <NavLink to="/notes" icon={FileText}>Notes</NavLink>
                      <NavLink to="/analytics" icon={BarChart3}>Analytics</NavLink>
                    </>
                  )}
                  <NavLink to="/requests" icon={Users}>Requests</NavLink>
                </div>

                <div className="flex items-center gap-3">
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={toggleDark}
                    aria-label="Toggle dark mode"
                    className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30"
                  >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  </button>

                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative"
                    >
                      <Bell size={22} />
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                      )}
                    </button>

                    {showNotifications && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                          <h4 className="font-bold text-slate-800">Notifications</h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest Updates</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic text-sm">No notifications yet</div>
                          ) : (
                            notifications.map(n => (
                              <div 
                                key={n._id} 
                                className={`p-4 border-b border-slate-50 last:border-none transition-colors flex gap-3 ${!n.isRead ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
                              >
                                <div className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center font-bold text-indigo-600 shrink-0 shadow-sm overflow-hidden">
                                  {n.sender?.profilePic ? (
                                    <img src={`http://localhost:5000/${n.sender.profilePic}`} className="w-full h-full object-cover" />
                                  ) : n.sender?.name.charAt(0) || "!"}
                                </div>
                                <div className="flex-grow">
                                  <p className="text-sm text-slate-700 leading-tight mb-1">{n.message}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                {!n.isRead && (
                                  <button 
                                    onClick={() => markAsRead(n._id)}
                                    className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                    title="Mark as read"
                                  >
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

                  <button 
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold hover:scale-110 transition-transform shadow-inner overflow-hidden"
                  >
                    {user.profilePic ? (
                      <img src={`http://localhost:5000/${user.profilePic}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </button>
                  <button 
                    onClick={logout}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <LogOut size={22} />
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}