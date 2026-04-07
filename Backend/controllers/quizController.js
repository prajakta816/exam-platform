import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import Attempt from "../models/Attempt.js"; // ✅ FIX
import TryCatch from "../utils/TryCatch.js";
//import { verifyToken } from "../utils/verifyToken.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ ADD THIS



// 🧑‍🏫 CREATE QUIZ
export const createQuiz = TryCatch(async (req, res) => {
  //const user = verifyToken(req);
  const user = req.user;

  if (user.role !== "teacher") {
    return res.status(403).json({ message: "Only teachers allowed" });
  }

  const { title, description, questions } = req.body;

  if (!title || !questions || questions.length === 0) {
    throw new Error("Title and questions required");
  }

  questions.forEach((q) => {
    if (!q.question || !q.options || q.options.length < 2) {
      throw new Error("Invalid question format");
    }
  });

  const quiz = await Quiz.create({
    title,
    description,
    questions,
    createdBy: user.id,
  });

  res.status(201).json({ message: "Quiz created", quiz });
});


// 🤖 GENERATE QUIZ
export const generateQuizFromText = TryCatch(async (req, res) => {
 // const user = verifyToken(req);
 const user = req.user;

  const { text } = req.body;
  if (!text) throw new Error("Text required");

  const sentences = text
    .split(".")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length === 0) throw new Error("No valid content");

  const questions = sentences.slice(0, 5).map((s) => ({
    question: `What is meant by "${s}"?`,
    options: [s, "Wrong 1", "Wrong 2", "Wrong 3"],
    correctAnswer: 0,
  }));

  const quiz = await Quiz.create({
    title: "Generated Quiz",
    questions,
    createdBy: user.id,
  });

  res.status(201).json({ quiz });
});


// 🎯 ATTEMPT QUIZ + SAVE HISTORY
export const attemptQuiz = TryCatch(async (req, res) => {
  //const user = verifyToken(req); // ✅ FIX
  const user = req.user;

  const { quizId } = req.params;
  const { answers } = req.body;

  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new Error("Invalid quiz ID");
  }

  if (!answers || answers.length === 0) {
    throw new Error("Answers required");
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new Error("Quiz not found");

  let score = 0;

  quiz.questions.forEach((q, i) => {
    if (answers[i] !== undefined && answers[i] === q.correctAnswer) {
      score++;
    }
  });

  const totalQuestions = quiz.questions.length;
  const percentage = (score / totalQuestions) * 100;

  const attempt = await Attempt.create({
    user: user.id,
    quiz: quizId,
    score,
    totalQuestions, // ✅ FIX
    percentage,
  });

  res.json({
    message: "Quiz attempted",
    score,
    totalQuestions,
    percentage,
    attemptId: attempt._id,
  });
});

// 🆕 DELETE QUIZ
export const deleteQuiz = TryCatch(async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);

  res.json({ message: "Quiz deleted" });
});

// 🆕 UPDATE QUIZ
export const updateQuiz = TryCatch(async (req, res) => {
  const quiz = await Quiz.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({ message: "Quiz updated", quiz });
});
