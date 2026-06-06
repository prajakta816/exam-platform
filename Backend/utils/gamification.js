import User from "../models/User.js";

// ─── Level thresholds ────────────────────────────────────────────────────────
const LEVELS = [
  { name: "Beginner",  minXP: 0   },
  { name: "Learner",   minXP: 100 },
  { name: "Advanced",  minXP: 300 },
  { name: "Expert",    minXP: 600 },
];

const getLevel = (xp) => {
  let level = "Beginner";
  for (const l of LEVELS) {
    if (xp >= l.minXP) level = l.name;
  }
  return level;
};

// ─── Streak helpers ──────────────────────────────────────────────────────────
const isSameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth()    === db.getMonth()    &&
    da.getDate()     === db.getDate()
  );
};

const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

// ─── Badge rules ─────────────────────────────────────────────────────────────
const BADGE_RULES = [
  {
    name: "Quiz Master",
    icon: "🏆",
    check: async (user) => {
      const Attempt = (await import("../models/Attempt.js")).default;
      const count = await Attempt.countDocuments({ user: user._id });
      return count >= 10;
    },
  },
  {
    name: "7 Day Streak",
    icon: "🔥",
    check: (user) => user.streak >= 7,
  },
  {
    name: "Top Contributor",
    icon: "📚",
    check: async (user) => {
      const Note = (await import("../models/Note.js")).default;
      const count = await Note.countDocuments({ uploadedBy: user._id });
      return count >= 5;
    },
  },
];

const awardNewBadges = async (user) => {
  const earnedNames = new Set(user.badges.map((b) => b.name));
  const newBadges = [];

  for (const rule of BADGE_RULES) {
    if (earnedNames.has(rule.name)) continue;
    const qualifies = await rule.check(user);
    if (qualifies) {
      newBadges.push({ name: rule.name, icon: rule.icon, earnedAt: new Date() });
    }
  }

  if (newBadges.length > 0) {
    user.badges.push(...newBadges);
  }
};

// ─── Main exported function ───────────────────────────────────────────────────
/**
 * addXP — awards XP to a user, updates streak, recalculates level, awards badges.
 *
 * @param {string} userId   — MongoDB ObjectId string
 * @param {number} points   — XP to award (e.g. 20)
 * @returns {object}        — { xp, level, streak, badges, newBadges }
 */
export const addXP = async (userId, points) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const today = new Date();

    // ── Streak logic ──────────────────────────────────────────────────────────
    if (!user.lastActiveDate) {
      // First activity ever
      user.streak = 1;
    } else if (isSameDay(user.lastActiveDate, today)) {
      // Already active today — don't change streak, don't double-award daily XP
      // (streak stays the same; XP is still awarded for the action)
    } else if (isYesterday(user.lastActiveDate)) {
      // Active yesterday → extend streak
      user.streak += 1;
    } else {
      // Missed a day → reset
      user.streak = 1;
    }

    user.lastActiveDate = today;

    // ── XP & Level ───────────────────────────────────────────────────────────
    user.xp = (user.xp || 0) + points;
    user.level = getLevel(user.xp);

    // ── Badge check ──────────────────────────────────────────────────────────
    const prevBadgeNames = new Set(user.badges.map((b) => b.name));
    await awardNewBadges(user);
    const newBadges = user.badges.filter((b) => !prevBadgeNames.has(b.name));

    await user.save();

    return {
      xp:        user.xp,
      level:     user.level,
      streak:    user.streak,
      badges:    user.badges,
      newBadges,
    };
  } catch (err) {
    // Non-fatal — never break the main request
    console.error("[Gamification] addXP error:", err.message);
    return null;
  }
};

// ─── Daily login XP ──────────────────────────────────────────────────────────
/**
 * awardDailyLogin — awards +5 XP only once per calendar day.
 */
export const awardDailyLogin = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const today = new Date();
    if (user.lastActiveDate && isSameDay(user.lastActiveDate, today)) {
      return null; // Already awarded today
    }

    return await addXP(userId, 5);
  } catch (err) {
    console.error("[Gamification] awardDailyLogin error:", err.message);
    return null;
  }
};

export { getLevel, LEVELS };
