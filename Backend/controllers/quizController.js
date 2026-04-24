import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import Attempt from "../models/Attempt.js"; // ✅ FIX
import Notification from "../models/Notification.js";
import TryCatch from "../utils/TryCatch.js";
import { generateFeedback } from "../utils/aiService.js"; // ✅ ADD THIS
//import { verifyToken } from "../utils/verifyToken.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ ADD THIS



// 🧑‍🏫 CREATE QUIZ (UPDATED)
export const createQuiz = TryCatch(async (req, res) => {
  const user = req.user;

  if (user.role !== "teacher") {
    return res.status(403).json({ message: "Only teachers allowed" });
  }

  const { title, description, questions, timer, difficulty } = req.body;

  // ✅ Basic validation
  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ message: "Title and at least one question required" });
  }

  // ✅ Validate difficulty
  const allowedDifficulties = ["Easy", "Medium", "Hard"];
  if (difficulty && !allowedDifficulties.includes(difficulty)) {
    return res.status(400).json({ message: "Invalid difficulty value" });
  }

  // ✅ Validate timer (optional but must be positive)
  if (timer && (isNaN(timer) || timer < 0)) {
    return res.status(400).json({ message: "Timer must be a positive number" });
  }

  // ✅ Validate questions deeply
  questions.forEach((q, i) => {
    if (!q.question || typeof q.question !== "string") {
      throw new Error(`Question ${i + 1} text is required`);
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Question ${i + 1} must have at least 2 options`);
    }

    q.options.forEach((opt, j) => {
      if (!opt || typeof opt !== "string") {
        throw new Error(`Option ${j + 1} in Question ${i + 1} is invalid`);
      }
    });

    if (
      q.correctAnswer === undefined ||
      q.correctAnswer < 0 ||
      q.correctAnswer >= q.options.length
    ) {
      throw new Error(`Invalid correct answer in Question ${i + 1}`);
    }

    // ✅ Image validation (optional)
    if (q.image && typeof q.image !== "string") {
      throw new Error(`Invalid image format in Question ${i + 1}`);
    }
  });

  // ✅ Create quiz
  const quiz = await Quiz.create({
    title,
    description,
    timer: timer || 0,
    difficulty: difficulty || "Easy",
    questions,
    createdBy: user.id,
  });

  res.status(201).json({
    message: "Quiz created successfully",
    quiz,
  });
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

  // 🤖 GENERATE AI FEEDBACK
  const feedback = await generateFeedback({
    quizTitle: quiz.title,
    score,
    totalQuestions,
    percentage
  });

  const attempt = await Attempt.create({
    user: user.id,
    quiz: quizId,
    score,
    totalQuestions,
    percentage,
    feedback,
  });

  // 🆕 Create Notification for Creator (if not self)
  if (quiz.createdBy.toString() !== user.id) {
    await Notification.create({
      user: quiz.createdBy,
      sender: user.id,
      type: "quiz_attempt",
      message: `${user.name} attempted your quiz: "${quiz.title}"`
    });
  }

  res.json({
    message: "Quiz attempted",
    score,
    totalQuestions,
    percentage,
    feedback, // ✅ ADD THIS
    attemptId: attempt._id,
  });
});

// 🆕 DELETE QUIZ
export const deleteQuiz = TryCatch(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  // Ensure only creator can delete
  if (quiz.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized to delete this quiz" });
  }

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

// 🆕 GET ALL QUIZZES (Filtered by privacy/following) with pagination
export const getAllQuizzes = TryCatch(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.json({ quizzes: [], total: 0, page: 1, totalPages: 0 });

  // Pagination params
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip  = (page - 1) * limit;

  // Find all public users to include their content
  const publicUsers = await User.find({ isPublic: true }).select("_id");
  const publicUserIds = publicUsers.map(u => u._id);

  const filter = {
    $or: [
      { createdBy: req.user.id },
      { createdBy: { $in: user.following } },
      { createdBy: { $in: publicUserIds } }
    ]
  };

  const [quizzes, total] = await Promise.all([
    Quiz.find(filter)
      .populate("createdBy", "name email profilePic isPublic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Quiz.countDocuments(filter)
  ]);

  res.json({
    quizzes,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// 🆕 GET QUIZ BY ID (With privacy check)
export const getQuizById = TryCatch(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate("createdBy", "name email isPublic followers");
  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  const requesterId = req.user.id;
  const creator = quiz.createdBy;
  const isOwner = creator._id.toString() === requesterId;
  const isFollowing = creator.followers.includes(requesterId);

  if (!creator.isPublic && !isFollowing && !isOwner) {
    return res.status(403).json({ 
      message: "This quiz is private. Follow the creator to view it.",
      isPrivate: true
    });
  }

  res.json(quiz);
});
