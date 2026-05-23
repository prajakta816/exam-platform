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
  getExplanation
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

// 🚀 Core AI Generation
router.post("/generate-pdf", protect, upload.single("file"), generateQuizFromPDF);
router.post("/generate-text", protect, generateQuizFromText);

// 🚀 Advanced AI Features
router.post("/flashcards", protect, getFlashcards);
router.post("/study-plan", protect, getStudyPlan);
router.get("/weakness-analysis", protect, getWeaknessAnalysis);
router.post("/chat-tutor", protect, chatTutor);
router.post("/explanation", protect, getExplanation);

export default router;