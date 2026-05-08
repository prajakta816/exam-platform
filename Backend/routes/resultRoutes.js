import express from "express";
import { getStudentResults, getRoomResults, getMyTests, getDeepAnalytics } from "../controllers/resultController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-tests", protect, getMyTests);
router.get("/analytics/:roomCode", protect, getDeepAnalytics);

router.get("/student/:id", protect, getStudentResults);
router.get("/room/:roomCode", protect, getRoomResults);

export default router;

