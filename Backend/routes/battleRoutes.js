import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { challengeUser, acceptChallenge, getPendingChallenges, getBattleDetails } from "../controllers/battleController.js";

const router = express.Router();

router.post("/challenge", protect, challengeUser);
router.post("/accept/:battleId", protect, acceptChallenge);
router.get("/pending", protect, getPendingChallenges);
router.get("/:battleId", protect, getBattleDetails);

export default router;
