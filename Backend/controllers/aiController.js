// 🔄 UPDATED

import fs from "fs";
import Quiz from "../models/Quiz.js";
import TryCatch from "../utils/TryCatch.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { generateMCQ } from "../utils/aiService.js";

export const generateQuizFromPDF = TryCatch(async (req, res) => {

  // ✅ always delete file
  try {
    const text = await extractTextFromPDF(req.file.path);

    const questions = await generateMCQ(text.slice(0, 2000));

    const quiz = await Quiz.create({
      title: "AI Quiz",
      questions,
      createdBy: req.user.id // 🔄 UPDATED
    });

    res.json(quiz);

  } finally {
    if (req.file?.path) {
      fs.unlinkSync(req.file.path); // 🆕 FILE CLEANUP
    }
  }
});