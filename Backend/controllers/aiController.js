// 🔄 SENIOR DEV VERSION

import fs from "fs";
import Quiz from "../models/Quiz.js";
import TryCatch from "../utils/TryCatch.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { generateMCQ } from "../utils/aiService.js";

// 🆕 Generate from PDF
export const generateQuizFromPDF = TryCatch(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No PDF file uploaded" });
  }

  try {
    const text = await extractTextFromPDF(req.file.path);
    
    // Increased limit to ~10,000 chars (approx 2000 words)
    const questions = await generateMCQ(text.slice(0, 10000)); 

    const quiz = await Quiz.create({
      title: `AI Quiz: ${req.file.originalname.replace('.pdf', '')}`,
      questions,
      createdBy: req.user.id,
    });

    res.status(201).json(quiz);

  } catch (error) {
    console.error("PDF Generation Error:", error.message);
    res.status(500).json({ message: error.message || "Failed to generate quiz from PDF" });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// 🆕 Generate from Text
export const generateQuizFromText = TryCatch(async (req, res) => {
  const { text, title } = req.body;

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ 
      message: "Please provide at least 50 characters of text for meaningful results." 
    });
  }

  try {
    // Increased limit to ~10,000 chars
    const questions = await generateMCQ(text.slice(0, 10000));

    const quiz = await Quiz.create({
      title: title || "AI Generated Knowledge Quiz",
      questions,
      createdBy: req.user.id,
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error("Text Generation Error:", error.message);
    res.status(500).json({ message: error.message || "AI Generation failed. Check server logs." });
  }
});