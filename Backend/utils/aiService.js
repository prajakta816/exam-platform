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

export const generateMCQ = async (text, numQuestions = 5, isTopic = false) => {
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
