/*import express from "express";
import {
  getUserHistory,
  getLeaderboard
} from "../controllers/attemptController.js";

const router = express.Router();

router.get("/history", getUserHistory); // user history
router.get("/leaderboard/:quizId", getLeaderboard); // leaderboard

export default router;*/

// 🔄 UPDATED

import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // 🆕
import {
  getUserHistory,
  getLeaderboard
} from "../controllers/attemptController.js";

const router = express.Router();

router.get("/history", protect, getUserHistory);
router.get("/leaderboard/:quizId", protect, getLeaderboard);

export default router;