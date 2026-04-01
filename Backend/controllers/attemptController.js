import Attempt from "../models/Attempt.js";
import TryCatch from "../utils/TryCatch.js";
import { verifyToken } from "../utils/verifyToken.js";


// 📚 USER HISTORY
export const getUserHistory = TryCatch(async (req, res) => {
  const user = verifyToken(req);

  const history = await Attempt.find({ user: user.id })
    .populate("quiz", "title")
    .sort({ createdAt: -1 });

  res.json({
    count: history.length,
    history,
  });
});


// 🏆 LEADERBOARD
export const getLeaderboard = TryCatch(async (req, res) => {
  const { quizId } = req.params;

  const leaderboard = await Attempt.find({ quiz: quizId })
    .populate("user", "name email")
    .sort({ score: -1, percentage: -1 }) // ✅ IMPROVED SORT
    .limit(10);

  res.json({
    leaderboard,
  });
});