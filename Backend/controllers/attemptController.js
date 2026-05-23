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

import mongoose from "mongoose";
import TestResult from "../models/TestResult.js";
import Attempt from "../models/Attempt.js";
import TryCatch from "../utils/TryCatch.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ ADD THIS


// 🆕 PAGINATION & ANALYTICS SUPPORT
export const getUserHistory = TryCatch(async (req, res) => {
  const isPaginated = req.query.page !== undefined;
  const page = parseInt(req.query.page) || 1;
  const limit = isPaginated ? 5 : 1000; // Return more for analytics if not paginated

  const history = await Attempt.find({ user: req.user.id })
    .populate({
      path: "quiz",
      select: "title origin difficulty createdBy",
      populate: {
        path: "createdBy",
        select: "name profilePic"
      }
    })
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

  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    return res.status(400).json({ message: "Invalid quiz ID format" });
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  const userObjId = new mongoose.Types.ObjectId(userId);
  
  // 🛡️ Robust checking for any kind of attempt
  const hasStandaloneAttempt = await Attempt.findOne({ quiz: quizId, user: userObjId });
  const hasLiveAttempt = await TestResult.findOne({ 
    studentId: userObjId, 
    $or: [
      { quizId: new mongoose.Types.ObjectId(quizId) },
      { testName: { $regex: new RegExp("^" + (quiz.title || "") + "$", "i") } }
    ]
  });
  
  const isCreator = quiz.createdBy.toString() === userId;

  if (!isCreator && !hasStandaloneAttempt && !hasLiveAttempt) {
    return res.status(403).json({ 
      message: "You must attempt the quiz to view the leaderboard" 
    });
  }

  // 🔄 Fetch from both sources
  const [standaloneResults, liveResults] = await Promise.all([
    Attempt.find({ quiz: quizId }).populate("user", "name profilePic"),
    TestResult.find({ 
      $or: [
        { quizId: new mongoose.Types.ObjectId(quizId) },
        { testName: { $regex: new RegExp("^" + (quiz.title || "") + "$", "i") } }
      ]
    }).populate("studentId", "name profilePic")
  ]);

  // 🔀 Merge and Format
  const unifiedLeaderboard = [
    ...standaloneResults.map(a => ({
      _id: a._id,
      user: a.user,
      score: a.score,
      totalQuestions: a.totalQuestions,
      percentage: a.percentage,
      createdAt: a.createdAt,
      type: "standalone"
    })),
    ...liveResults.map(r => ({
      _id: r._id,
      user: r.studentId, // Map studentId to user for consistency
      score: r.score,
      totalQuestions: quiz.questions.length,
      percentage: (r.score / quiz.questions.length) * 100,
      createdAt: r.date,
      type: "live"
    }))
  ];

  // 🏆 Sort by score descending
  unifiedLeaderboard.sort((a, b) => b.score - a.score);

  res.json(unifiedLeaderboard.slice(0, 50));
});