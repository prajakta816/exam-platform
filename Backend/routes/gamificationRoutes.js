import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMyGamificationStats } from "../controllers/gamificationController.js";

const router = express.Router();

router.get("/me", protect, getMyGamificationStats);

export default router;
