// 🔄 SENIOR DEV VERSION

import axios from "axios";
import { safeParse } from "./safeParse.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY, GEMINI_FALLBACK_MODELS, GEMINI_MODEL } from "../config/env.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const hasOpenAIKey = () =>
  process.env.OPENAI_API_KEY &&
  process.env.OPENAI_API_KEY !== "your_api_key_here" &&
  !process.env.OPENAI_API_KEY.includes("your_api_key");

const getGeminiModels = () =>
  [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS].filter((model, index, models) => model && models.indexOf(model) === index);

const getErrorText = (error) =>
  [
    error?.message,
    error?.response?.status,
    error?.response?.data?.error?.message,
    error?.response?.data,
  ]
    .filter(Boolean)
    .map((value) => (typeof value === "string" ? value : JSON.stringify(value)))
    .join(" ");

const isTransientAIError = (error) => {
  const text = getErrorText(error).toLowerCase();
  const status = error?.status || error?.response?.status;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    text.includes("429") ||
    text.includes("503") ||
    text.includes("too many requests") ||
    text.includes("quota") ||
    text.includes("high demand") ||
    text.includes("service unavailable") ||
    text.includes("temporarily unavailable")
  );
};

const normalizeQuestions = (questions, fallbackCount) => {
  if (!Array.isArray(questions)) return [];

  return questions
    .map((item) => {
      const options = Array.isArray(item.options)
        ? item.options.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 4)
        : [];
      const correctAnswer = Number(item.correctAnswer);

      return {
        question: String(item.question || "").trim(),
        options,
        correctAnswer: Number.isInteger(correctAnswer) ? correctAnswer : 0
      };
    })
    .filter((item) => (
      item.question &&
      item.options.length === 4 &&
      item.correctAnswer >= 0 &&
      item.correctAnswer < item.options.length
    ))
    .slice(0, fallbackCount);
};

const generateWithGemini = async (prompt) => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const models = getGeminiModels();
  let lastError;

  for (const modelName of models) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Generating with Gemini model ${modelName}, attempt ${attempt}`);
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });

        return result.response.text();
      } catch (error) {
        lastError = error;

        if (!isTransientAIError(error)) {
          throw error;
        }

        const delay = 800 * attempt;
        console.warn(`Gemini transient error on ${modelName}: ${error.message}. Retrying in ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("Gemini generation failed");
};

const generateFeedbackWithGemini = async (prompt) => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const models = getGeminiModels();
  let lastError;

  for (const modelName of models) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        lastError = error;

        if (!isTransientAIError(error)) {
          throw error;
        }

        await sleep(500 * attempt);
      }
    }
  }

  throw lastError || new Error("Gemini feedback failed");
};

export const generateMCQ = async (text, numQuestions = 5, isTopic = false, difficulty = "Medium") => {
  const questionCount = Math.min(Math.max(parseInt(numQuestions, 10) || 5, 1), 25);
  const hasGemini = !!GEMINI_API_KEY;
  const hasOpenAI = hasOpenAIKey();

  if (!hasGemini && !hasOpenAI) {
    console.warn("⚠️ Using High-Fidelity Mock Mode (API Key Missing)");
    
    return Array.from({ length: questionCount }).map((_, i) => ({
      question: isTopic ? `Mock Question ${i+1} about ${text}?` : `Regarding the text: "${text.slice(0, 50)}...", which statement is accurate?`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: Math.floor(Math.random() * 4)
    }));
  }

  // 🚀 SENIOR PROMPT: Bulletproof instructions
  const prompt = `
  Context: You are a professional educator creating an exam.
  Task: Generate ${questionCount} high-quality multiple-choice questions (MCQs) based on the ${isTopic ? 'following topic/prompt' : 'provided text'}.
  
  Difficulty Level: ${difficulty}
  
  Constraints:
  1. Output must be a VALID JSON OBJECT.
  2. The object must contain a key "questions" which is an array of objects.
  3. Each question object MUST have:
     - "question": A clear string.
     - "options": An array of exactly 4 strings.
     - "correctAnswer": An integer (0, 1, 2, or 3) representing the index of the correct option.
  4. Ensure questions are diverse and cover key concepts.
  
  Format Example:
  {
    "questions": [
      {
        "question": "Example?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0
      }
    ]
  }

  ${isTopic ? 'TOPIC / PROMPT:' : 'TEXT TO ANALYZE:'}
  ${text}
  `;

  try {
    let questions;

    if (hasGemini) {
      // 🚀 Use Google Gemini API
      console.log("🤖 Generating with Google Gemini AI...");
      const content = await generateWithGemini(prompt);
      const parsed = safeParse(content);
      questions = parsed.questions || (Array.isArray(parsed) ? parsed : []);

    } else {
      // 🚀 Use OpenAI API
      console.log("🤖 Generating with OpenAI GPT-4o...");
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a helpful assistant that outputs JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000
        }
      );
      const content = response.data.choices[0].message.content;
      const parsed = safeParse(content);
      questions = parsed.questions || (Array.isArray(parsed) ? parsed : []);
    }

    questions = normalizeQuestions(questions, questionCount);

    if (!questions || questions.length === 0) {
      throw new Error("AI returned empty questions array");
    }

    return questions;

  } catch (error) {
    console.error("AI SERVICE ERROR:", error.response?.data || error.message);

    if (isTransientAIError(error)) {
      throw new Error("AI service is temporarily busy. Please try again in a minute.");
    }

    throw new Error(`AI Generation Failed: ${error.message}`);
  }
};

export const generateFeedback = async ({ quizTitle, score, totalQuestions, percentage }) => {
  const hasGemini = !!GEMINI_API_KEY;
  const hasOpenAI = hasOpenAIKey();

  if (!hasGemini && !hasOpenAI) {
    if (percentage >= 80) {
      return `Excellent work on "${quizTitle}"! You have a strong grasp of the material. Keep up the great work and consider exploring more advanced topics in this area.`;
    } else if (percentage >= 50) {
      return `Good effort on "${quizTitle}". You understand the core concepts but might have missed some details. Review the questions you got wrong to identify specific weak areas.`;
    } else {
      return `It looks like you struggled with "${quizTitle}". Don't worry! Review the foundational concepts and try the quiz again. Focus on understanding the "why" behind each correct answer.`;
    }
  }

  const prompt = `
  Context: You are a supportive AI tutor.
  Task: Provide constructive feedback for a student who just finished a quiz.
  
  Quiz Title: ${quizTitle}
  Score: ${score}/${totalQuestions} (${percentage.toFixed(1)}%)

  Requirements:
  1. Be encouraging and professional.
  2. Identify potential weak areas based on the score (generalised if specific answers aren't provided).
  3. Provide 2-3 actionable suggestions for improvement.
  4. Keep it concise (max 100 words).
  `;

  try {
    if (hasGemini) {
      return await generateFeedbackWithGemini(prompt);
    } else {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful and encouraging educational assistant." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000
        }
      );
      return response.data.choices[0].message.content;
    }
  } catch (error) {
    console.error("AI FEEDBACK ERROR:", error.message);
    return `You scored ${score}/${totalQuestions}. Keep practicing to improve your understanding of ${quizTitle}!`;
  }
};

// 🆕 AI Explanation Generator
export const generateExplanation = async ({ question, options, correctAnswer, studentAnswer }) => {
  const prompt = `
  As an AI Tutor, explain why the student's answer was wrong and why the correct answer is right.
  Question: ${question}
  Options: ${JSON.stringify(options)}
  Correct Index: ${correctAnswer}
  Student's Index: ${studentAnswer}
  
  Keep it friendly, educational, and under 50 words.
  `;
  try {
    return await generateFeedbackWithGemini(prompt);
  } catch (err) {
    return "Keep studying! Review the core concepts for this topic.";
  }
};

// 🆕 AI Flashcards Generator
export const generateFlashcards = async (text) => {
  const prompt = `
  Extract 10 key concepts from this text and turn them into flashcards.
  Format: JSON array of objects with "front" and "back" keys.
  Text: ${text.slice(0, 5000)}
  `;
  try {
    const res = await generateWithGemini(prompt);
    return safeParse(res);
  } catch (err) {
    return [];
  }
};

// 🆕 AI Study Planner
export const generateStudyPlan = async ({ topic, examDate, currentLevel = "Beginner" }) => {
  const prompt = `
  Create a detailed study roadmap for the topic "${topic}".
  The exam is on ${examDate}.
  Current level: ${currentLevel}.
  Format: JSON array of objects with "day", "task", "details".
  Provide a logical progression from fundamentals to advanced concepts.
  `;
  try {
    const res = await generateWithGemini(prompt);
    return safeParse(res);
  } catch (err) {
    return [{ day: "Day 1", task: "Introduction", details: "Start with basic concepts." }];
  }
};

// 🆕 AI Weakness Analysis
export const analyzeWeaknesses = async (history) => {
  const historyText = history.map(h => `Quiz: ${h.quiz?.title}, Score: ${h.percentage}%`).join("\n");
  const prompt = `
  Based on this student's quiz history, identify their top 3 weak areas and top 3 strong areas.
  History:
  ${historyText}
  
  Format: JSON object with "weaknesses" (array) and "strengths" (array).
  Include a brief "tip" for each weakness.
  `;
  try {
    const res = await generateWithGemini(prompt);
    return safeParse(res);
  } catch (err) {
    return { weaknesses: [], strengths: [] };
  }
};

// 🆕 AI Chat Tutor
export const chatWithTutor = async ({ context, message, history = [] }) => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const chat = model.startChat({
    history: history.slice(-6).map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    })),
    generationConfig: { maxOutputTokens: 500 },
  });

  const fullPrompt = `
  Context from study notes:
  ${context.slice(0, 8000)}
  
  Student says: ${message}
  
  Instructions:
  - Use the provided context to answer.
  - If the answer isn't in the context, use your general knowledge but mention it's supplementary.
  - Be a helpful, encouraging teacher.
  `;

  const result = await chat.sendMessage(fullPrompt);
  return result.response.text();
};

// 🆕 AI Chat Tutor (OpenAI Model)
export const chatWithOpenAI = async ({ context, message, history = [] }) => {
  const hasOpenAI = hasOpenAIKey();

  const systemPrompt = `You are a helpful, encouraging AI Study Tutor.
You are assisting a student. Answer their questions based ONLY on the provided study notes.
If the answer is not in the notes, use your general knowledge to answer, but explicitly mention that the information is supplementary and not found in the notes.

Here are the study notes:
---
${context.slice(0, 15000)}
---`;

  const messages = [
    { role: "system", content: systemPrompt }
  ];

  // Add history
  history.slice(-10).forEach(h => {
    messages.push({
      role: h.role === "user" ? "user" : "assistant",
      content: h.text || h.message || h.content || ""
    });
  });

  // Add current message
  messages.push({ role: "user", content: message });

  if (hasOpenAI) {
    try {
      console.log("🤖 Chatting with OpenAI GPT-4o...");
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: messages,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI Chat Error:", error.response?.data || error.message);
    }
  }

  // Fallback to Gemini if OpenAI is not available or failed
  console.log("🤖 OpenAI chat fallback/not available. Falling back to Gemini...");
  if (GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL || "gemini-2.5-flash" });
      
      const fullPrompt = `${systemPrompt}\n\nStudent says: ${message}`;
      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (geminiError) {
      console.error("Gemini fallback chat error:", geminiError);
    }
  }

  return `[Mock AI Tutor] I read your note content (length: ${context.length} characters) and your question: "${message}". Please set up a valid OpenAI or Gemini API key to get real responses.`;
};

