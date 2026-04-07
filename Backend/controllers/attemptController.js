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
//import { protect } from "../middleware/authMiddleware.js"; // ✅ ADD THIS


// 🆕 PAGINATION
export const getUserHistory = TryCatch(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;

  const history = await Attempt.find({ user: req.user.id })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({ page, history });
});

// 🆕 LIMIT CONTROL
export const getLeaderboard = TryCatch(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const leaderboard = await Attempt.find({ quiz: req.params.quizId })
    .sort({ score: -1 })
    .limit(limit);

  res.json(leaderboard);
});