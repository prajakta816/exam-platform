import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getLearningPulse } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/learning-pulse", protect, getLearningPulse);

export default router;
