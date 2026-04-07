// 🔄 UPDATED

import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { generateQuizFromPDF } from "../controllers/aiController.js";

const router = express.Router();

// 🆕 PDF validation
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF allowed"));
    }
    cb(null, true);
  },
});

router.post("/generate-pdf", protect, upload.single("file"), generateQuizFromPDF);

export default router;