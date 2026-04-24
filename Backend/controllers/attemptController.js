/*import Attempt from "../models/Attempt.js";
import TryCatch from "../utils/TryCatch.js";
import { verifyToken } from "../utils/verifyToken.js";


// 📚 USER HISTORY
export const getUserHistory = TryCatch(async (req, res) => {
  //const user = verifyToken(req);


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
*/

// 🔄 UPDATED

import Attempt from "../models/Attempt.js";
import TryCatch from "../utils/TryCatch.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ ADD THIS


// 🆕 PAGINATION & ANALYTICS SUPPORT
export const getUserHistory = TryCatch(async (req, res) => {
  const isPaginated = req.query.page !== undefined;
  const page = parseInt(req.query.page) || 1;
  const limit = isPaginated ? 5 : 1000; // Return more for analytics if not paginated

  const history = await Attempt.find({ user: req.user.id })
    .populate("quiz", "title")
    .sort({ createdAt: -1 })
    .skip(isPaginated ? (page - 1) * limit : 0)
    .limit(limit);

  if (isPaginated) {
    res.json({ page, history });
  } else {
    res.json(history);
  }
});

import Quiz from "../models/Quiz.js";

// 🏆 GET LEADERBOARD (Filtered by visibility rules)
export const getLeaderboard = TryCatch(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  const hasAttempted = await Attempt.findOne({ quiz: quizId, user: userId });
  const isCreator = quiz.createdBy.toString() === userId;

  if (!isCreator && !hasAttempted) {
    return res.status(403).json({ 
      message: "You must attempt the quiz to view the leaderboard" 
    });
  }

  const leaderboard = await Attempt.find({ quiz: quizId })
    .populate("user", "name profilePic")
    .sort({ score: -1, createdAt: 1 }) // High score first, then earliest attempt
    .limit(50);

  res.json(leaderboard);
});