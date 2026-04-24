// 🔄 UPDATED

import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { generateQuizFromPDF, generateQuizFromText } from "../controllers/aiController.js";

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

// 🚀 Endpoints
router.post("/generate-pdf", protect, upload.single("file"), generateQuizFromPDF);
router.post("/generate-text", protect, generateQuizFromText);

export default router;