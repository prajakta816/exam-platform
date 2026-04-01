import express from "express";
import {
  getUserHistory,
  getLeaderboard
} from "../controllers/attemptController.js";

const router = express.Router();

router.get("/history", getUserHistory); // user history
router.get("/leaderboard/:quizId", getLeaderboard); // leaderboard

export default router;