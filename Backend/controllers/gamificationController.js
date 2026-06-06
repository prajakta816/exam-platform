import User from "../models/User.js";
import Attempt from "../models/Attempt.js";
import Note from "../models/Note.js";
import TryCatch from "../utils/TryCatch.js";
import { LEVELS } from "../utils/gamification.js";

// XP needed for each level boundary (for progress bar calculation)
const XP_FOR_NEXT_LEVEL = { Beginner: 100, Learner: 300, Advanced: 600, Expert: 999 };
const XP_LEVEL_START    = { Beginner: 0,   Learner: 100, Advanced: 300, Expert: 600 };

export const getMyGamificationStats = TryCatch(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "name xp level streak lastActiveDate badges achievements"
  );
  if (!user) return res.status(404).json({ message: "User not found" });

  // Progress within current level
  const levelStart = XP_LEVEL_START[user.level] ?? 0;
  const levelEnd   = XP_FOR_NEXT_LEVEL[user.level] ?? 999;
  const xpInLevel  = Math.max(0, (user.xp || 0) - levelStart);
  const xpNeeded   = levelEnd - levelStart;
  const progress    = user.level === "Expert"
    ? 100
    : Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  // Counts for badge eligibility display
  const [quizCount, noteCount] = await Promise.all([
    Attempt.countDocuments({ user: req.user.id }),
    Note.countDocuments({ uploadedBy: req.user.id }),
  ]);

  res.json({
    xp:           user.xp || 0,
    level:        user.level || "Beginner",
    streak:       user.streak || 0,
    badges:       user.badges || [],
    achievements: user.achievements || [],
    progress,
    xpInLevel,
    xpNeeded:     user.level === "Expert" ? null : xpNeeded,
    nextLevel:    LEVELS.find(l => l.minXP > (user.xp || 0))?.name ?? null,
    stats: {
      quizzesCompleted: quizCount,
      notesUploaded:    noteCount,
    },
    levels: LEVELS,
  });
});
