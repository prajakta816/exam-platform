import React, { useEffect, useState } from "react";
import API from "../../services/api";
import {
  Flame, Star, Zap, Trophy, Shield, BookOpen,
  TrendingUp, Award, Lock, CheckCircle, ChevronRight,
  Sparkles, Target, Brain
} from "lucide-react";

// ─── constants matching backend ─────────────────────────────────────────────
const LEVEL_META = {
  Beginner: { color: "from-slate-400 to-slate-500",   bg: "bg-slate-50",   text: "text-slate-600",  border: "border-slate-200",  icon: "🌱" },
  Learner:  { color: "from-blue-400 to-indigo-500",   bg: "bg-blue-50",    text: "text-blue-600",   border: "border-blue-200",   icon: "📖" },
  Advanced: { color: "from-violet-500 to-purple-600", bg: "bg-violet-50",  text: "text-violet-600", border: "border-violet-200", icon: "⚡" },
  Expert:   { color: "from-amber-400 to-orange-500",  bg: "bg-amber-50",   text: "text-amber-600",  border: "border-amber-200",  icon: "🏆" },
};

const XP_RULES = [
  { action: "Complete a quiz",         xp: 20,  icon: <Brain size={18} />,   color: "text-indigo-500" },
  { action: "Upload notes",            xp: 30,  icon: <BookOpen size={18} />, color: "text-emerald-500" },
  { action: "Daily login",             xp: 5,   icon: <Flame size={18} />,   color: "text-orange-500" },
  { action: "Live quiz participation", xp: 15,  icon: <Zap size={18} />,     color: "text-amber-500" },
  { action: "Publish AI quiz",         xp: 25,  icon: <Sparkles size={18} />, color: "text-violet-500" },
];

const BADGE_META = {
  "Quiz Master":      { icon: "🏆", desc: "Complete 10+ quizzes",    color: "from-amber-400 to-orange-400" },
  "7 Day Streak":     { icon: "🔥", desc: "Log in 7 days in a row",  color: "from-red-400 to-orange-500" },
  "Top Contributor":  { icon: "📚", desc: "Upload 5+ notes",         color: "from-emerald-400 to-teal-500" },
};

// ─── sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub, gradient, delay = 0 }) => (
  <div
    className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl animate-fade-in`}
    style={{
      background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
      animationDelay: `${delay}ms`,
    }}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
    <div className="relative z-10">
      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
        {icon}
      </div>
      <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="text-4xl font-black">{value}</p>
      {sub && <p className="text-white/60 text-xs font-bold mt-1">{sub}</p>}
    </div>
  </div>
);

const ProgressBar = ({ progress, level, nextLevel, xpInLevel, xpNeeded }) => {
  const meta = LEVEL_META[level] || LEVEL_META.Beginner;
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{meta.icon}</span>
          <div>
            <h3 className="text-xl font-black text-slate-800">{level}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Current Level</p>
          </div>
        </div>
        {nextLevel && (
          <div className="flex items-center gap-2 text-slate-400">
            <ChevronRight size={16} />
            <div className="text-right">
              <p className="text-sm font-black text-slate-600">{nextLevel}</p>
              <p className="text-xs text-slate-400">{xpNeeded - xpInLevel} XP to go</p>
            </div>
            <span className="text-2xl">{LEVEL_META[nextLevel]?.icon}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${meta.color} transition-all duration-1000 ease-out relative`}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs font-bold text-slate-400">{xpInLevel} XP</span>
        <span className="text-xs font-bold text-slate-400">
          {level === "Expert" ? "MAX LEVEL" : `${xpNeeded} XP`}
        </span>
      </div>
    </div>
  );
};

const BadgeCard = ({ name, earned, earnedAt }) => {
  const meta = BADGE_META[name] || { icon: "🎖️", desc: "Achievement", color: "from-slate-400 to-slate-500" };
  return (
    <div className={`relative rounded-3xl p-6 border-2 transition-all duration-300 ${
      earned
        ? "border-transparent bg-white shadow-lg hover:shadow-xl hover:-translate-y-1"
        : "border-dashed border-slate-200 bg-slate-50/50 opacity-60"
    }`}>
      {earned && (
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${meta.color} opacity-5`} />
      )}
      <div className="relative z-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner ${
          earned ? `bg-gradient-to-br ${meta.color}` : "bg-slate-100"
        }`}>
          {earned ? meta.icon : <Lock size={24} className="text-slate-300" />}
        </div>
        <h4 className={`font-black text-base mb-1 ${earned ? "text-slate-800" : "text-slate-400"}`}>
          {name}
        </h4>
        <p className="text-xs text-slate-400 font-medium mb-3">{meta.desc}</p>
        {earned ? (
          <div className="flex items-center gap-1 text-emerald-500">
            <CheckCircle size={14} />
            <span className="text-xs font-black">
              {earnedAt ? new Date(earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Earned"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-slate-300">
            <Lock size={12} />
            <span className="text-xs font-bold">Locked</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── streak dots ─────────────────────────────────────────────────────────────
const StreakCalendar = ({ streak }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().getDay(); // 0=Sun
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <div className="flex gap-2">
      {days.map((d, i) => {
        const daysAgo = ((todayIdx - i + 7) % 7);
        const active = daysAgo < streak;
        return (
          <div key={d} className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              active
                ? "bg-orange-500 shadow-lg shadow-orange-200"
                : i === todayIdx
                  ? "bg-orange-100 border-2 border-orange-300"
                  : "bg-slate-100"
            }`}>
              {active ? <Flame size={14} className="text-white" /> : null}
            </div>
            <span className="text-[10px] font-bold text-slate-400">{d}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── main page ────────────────────────────────────────────────────────────────
const GamificationDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/gamification/me")
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-5xl mx-auto p-6 animate-pulse">
      <div className="h-10 w-64 bg-slate-100 rounded-2xl mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <div key={i} className="h-36 bg-slate-100 rounded-3xl" />)}
      </div>
      <div className="h-28 bg-slate-100 rounded-3xl mb-8" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-3xl" />)}
      </div>
    </div>
  );

  if (!stats) return (
    <div className="max-w-5xl mx-auto p-6 text-center py-24 text-slate-400">
      Could not load gamification data.
    </div>
  );

  const allBadgeNames = Object.keys(BADGE_META);
  const earnedBadgesMap = Object.fromEntries(stats.badges.map(b => [b.name, b]));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
          <Trophy className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">My Progress</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-0.5">Gamification Dashboard</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Zap size={24} />}
          label="Total XP"
          value={stats.xp.toLocaleString()}
          sub="Experience Points"
          gradient="from-violet-500 to-indigo-600"
          delay={0}
        />
        <StatCard
          icon={<Flame size={24} />}
          label="Streak"
          value={stats.streak}
          sub={stats.streak === 1 ? "day" : "days in a row"}
          gradient="from-orange-400 to-red-500"
          delay={100}
        />
        <StatCard
          icon={<Star size={24} />}
          label="Level"
          value={stats.level}
          sub={`${LEVEL_META[stats.level]?.icon} Keep going!`}
          gradient={LEVEL_META[stats.level]?.color || "from-slate-400 to-slate-500"}
          delay={200}
        />
        <StatCard
          icon={<Shield size={24} />}
          label="Badges"
          value={stats.badges.length}
          sub={`of ${allBadgeNames.length} earned`}
          gradient="from-emerald-400 to-teal-500"
          delay={300}
        />
      </div>

      {/* Level Progress */}
      <ProgressBar
        progress={stats.progress}
        level={stats.level}
        nextLevel={stats.nextLevel}
        xpInLevel={stats.xpInLevel}
        xpNeeded={stats.xpNeeded}
      />

      {/* Streak Calendar + XP Rules side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streak */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Flame className="text-orange-500" size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800">Study Streak</h3>
              <p className="text-xs text-slate-400 font-bold">{stats.streak} day{stats.streak !== 1 ? "s" : ""} active</p>
            </div>
          </div>
          <StreakCalendar streak={stats.streak} />
          <p className="mt-4 text-xs text-slate-400 font-medium leading-relaxed">
            Log in daily to maintain your streak. Missing a day resets it to 0.
          </p>
        </div>

        {/* XP Rules */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <Target className="text-violet-500" size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800">Earn XP</h3>
              <p className="text-xs text-slate-400 font-bold">How to gain experience</p>
            </div>
          </div>
          <div className="space-y-3">
            {XP_RULES.map(rule => (
              <div key={rule.action} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={rule.color}>{rule.icon}</span>
                  <span className="text-sm font-bold text-slate-700">{rule.action}</span>
                </div>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  +{rule.xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Award className="text-amber-500" size={24} />
          <h2 className="text-xl font-black text-slate-800">Achievements</h2>
          <span className="ml-auto text-xs font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {stats.badges.length}/{allBadgeNames.length} Unlocked
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {allBadgeNames.map(name => (
            <BadgeCard
              key={name}
              name={name}
              earned={!!earnedBadgesMap[name]}
              earnedAt={earnedBadgesMap[name]?.earnedAt}
            />
          ))}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-3xl font-black text-white">{stats.stats.quizzesCompleted}</p>
            <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-1">Quizzes Done</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-3xl font-black text-white">{stats.stats.notesUploaded}</p>
            <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-1">Notes Shared</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-3xl font-black text-amber-400">{stats.badges.length}</p>
            <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-1">Badges Earned</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl">
          <TrendingUp size={20} className="text-violet-400" />
          <span className="text-sm font-black text-white/80">Keep grinding!</span>
        </div>
      </div>
    </div>
  );
};

export default GamificationDashboard;
