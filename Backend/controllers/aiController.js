// 🔄 SENIOR DEV VERSION

import fs from "fs";
import Quiz from "../models/Quiz.js";
import TryCatch from "../utils/TryCatch.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { 
  generateMCQ, 
  generateFlashcards, 
  generateStudyPlan, 
  analyzeWeaknesses, 
  chatWithTutor,
  generateExplanation
} from "../utils/aiService.js";
import Attempt from "../models/Attempt.js";
import Note from "../models/Note.js";

// 🆕 Generate from PDF
export const generateQuizFromPDF = TryCatch(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No PDF file uploaded" });
  }
  
  const numQuestions = parseInt(req.body.numQuestions) || 5;
  const difficulty = req.body.difficulty || "Medium";

  try {
    const text = await extractTextFromPDF(req.file.path);
    
    // Increased limit to ~10,000 chars (approx 2000 words)
    const questions = await generateMCQ(text.slice(0, 10000), numQuestions, false, difficulty); 

    const quiz = await Quiz.create({
      title: req.body.title || `AI Quiz: ${req.file.originalname.replace('.pdf', '')}`,
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
  const { text, topic, title, numQuestions = 5, difficulty = "Medium" } = req.body;

  const inputData = topic || text;

  if (!inputData || inputData.trim().length < 5) {
    return res.status(400).json({ 
      message: "Please provide a valid topic or text content." 
    });
  }

  try {
    // Increased limit to ~10,000 chars
    const questions = await generateMCQ(inputData.slice(0, 10000), numQuestions, !!topic, difficulty);

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

// 🆕 AI Flashcards
export const getFlashcards = TryCatch(async (req, res) => {
  const { noteId } = req.body;
  const note = await Note.findById(noteId);
  if (!note) return res.status(404).json({ message: "Note not found" });

  const text = await extractTextFromPDF(note.fileUrl);
  const flashcards = await generateFlashcards(text);
  res.json(flashcards);
});

// 🆕 AI Study Plan
export const getStudyPlan = TryCatch(async (req, res) => {
  const { topic, examDate } = req.body;
  const plan = await generateStudyPlan({ topic, examDate });
  res.json(plan);
});

// 🆕 AI Weakness Analysis
export const getWeaknessAnalysis = TryCatch(async (req, res) => {
  const history = await Attempt.find({ user: req.user.id }).populate("quiz", "title");
  const analysis = await analyzeWeaknesses(history);
  res.json(analysis);
});

// 🆕 AI Chat Tutor
export const chatTutor = TryCatch(async (req, res) => {
  const { noteId, message, history } = req.body;
  const note = await Note.findById(noteId);
  if (!note) return res.status(404).json({ message: "Note not found" });

  const text = await extractTextFromPDF(note.fileUrl);
  const response = await chatWithTutor({ context: text, message, history });
  res.json({ response });
});

// 🆕 AI Explanation
export const getExplanation = TryCatch(async (req, res) => {
  const { question, options, correctAnswer, studentAnswer } = req.body;
  const explanation = await generateExplanation({ question, options, correctAnswer, studentAnswer });
  res.json({ explanation });
});