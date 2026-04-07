/*import express from "express";
import {
  createQuiz,
  generateQuizFromText,
  attemptQuiz
} from "../controllers/quizController.js";

const router = express.Router();

// Teacher creates quiz
router.post("/create", createQuiz);

// Student generates quiz from text
router.post("/generate", generateQuizFromText);

// Attempt quiz
router.post("/attempt/:quizId", attemptQuiz);

export default router;*/

// 🔄 UPDATED

import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // 🆕
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  attemptQuiz
} from "../controllers/quizController.js";

const router = express.Router();

router.post("/create", protect, createQuiz);
router.put("/:id", protect, updateQuiz);     // 🆕
router.delete("/:id", protect, deleteQuiz);  // 🆕

router.post("/attempt/:quizId", protect, attemptQuiz);

export default router;