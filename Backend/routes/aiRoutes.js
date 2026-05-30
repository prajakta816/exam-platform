// 🔄 UPDATED SENIOR VERSION

import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { 
  generateQuizFromPDF, 
  generateQuizFromText,
  getFlashcards,
  getStudyPlan,
  getWeaknessAnalysis,
  chatTutor,
  getExplanation,
  aiChat,
  getChatHistory
} from "../controllers/aiController.js";

const router = express.Router();

// 🆕 Multer config for PDF
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF allowed"));
    }
    cb(null, true);
  },
});

// Multer config for Chat (PDF + Text notes)
const chatUpload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "text/plain"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF and TXT files are allowed"));
    }
    cb(null, true);
  },
});

// 🚀 Core AI Generation
router.post("/generate-pdf", protect, upload.single("file"), generateQuizFromPDF);
router.post("/generate-text", protect, generateQuizFromText);

// 🚀 Advanced AI Features
router.post("/flashcards", protect, getFlashcards);
router.post("/study-plan", protect, getStudyPlan);
router.get("/weakness-analysis", protect, getWeaknessAnalysis);
router.post("/chat-tutor", protect, chatTutor);
router.post("/explanation", protect, getExplanation);

// 🚀 AI Tutor Chat with Notes (OpenAI)
router.post("/chat", protect, chatUpload.single("file"), aiChat);
router.get("/chat/history/:noteId", protect, getChatHistory);

export default router;