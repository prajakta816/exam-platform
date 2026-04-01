import express from "express";
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

export default router;