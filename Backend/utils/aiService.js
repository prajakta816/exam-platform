// 🔄 SENIOR DEV VERSION

import axios from "axios";
import { safeParse } from "./safeParse.js";

export const generateMCQ = async (text) => {
  // ✅ Handle placeholder or missing key
  const isMock = !process.env.OPENAI_API_KEY || 
                 process.env.OPENAI_API_KEY === "your_api_key_here" || 
                 process.env.OPENAI_API_KEY.includes("your_api_key");

  if (isMock) {
    console.warn("⚠️ Using High-Fidelity Mock Mode (API Key Missing)");
    
    // Improved sentence extraction
    const sentences = text
      .split(/[.!?]/)
      .map(s => s.trim())
      .filter(s => s.length > 30);

    // Get some "fake" options from the text itself to make it look real
    const allWords = text.split(/\s+/).filter(w => w.length > 4);
    const getRandomWords = (count) => {
      const shuffled = [...allWords].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count).join(" ");
    };

    if (sentences.length > 0) {
      return sentences.slice(0, 5).map((s, i) => {
        // Try to pick a subject from the sentence
        const words = s.split(' ');
        const subject = words.length > 3 ? `${words[0]} ${words[1]} ${words[2]}` : "This concept";
        
        return {
          question: `Regarding the text: "${s.slice(0, 90)}...", which statement is most accurate?`,
          options: [
            `It describes ${subject} in detail.`,
            `It contradicts the idea of ${getRandomWords(2)}.`,
            `It primarily focuses on ${getRandomWords(3)}.`,
            `The main emphasis is on ${getRandomWords(2)} logic.`
          ],
          correctAnswer: 0
        };
      });
    }

    return [
      {
        question: "Please provide longer text (at least 2-3 sentences) for the AI to analyze properly.",
        options: ["Input is too short", "Missing context", "Format error", "All of the above"],
        correctAnswer: 3
      }
    ];
  }

  // 🚀 SENIOR PROMPT: Bulletproof instructions
  const prompt = `
  Context: You are a professional educator creating an exam.
  Task: Generate 5 high-quality multiple-choice questions (MCQs) based on the provided text.
  
  Constraints:
  1. Output must be a VALID JSON OBJECT.
  2. The object must contain a key "questions" which is an array of objects.
  3. Each question object MUST have:
     - "question": A clear string.
     - "options": An array of exactly 4 strings.
     - "correctAnswer": An integer (0, 1, 2, or 3) representing the index of the correct option.
  4. Ensure questions are diverse and cover key concepts from the text.
  
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

  TEXT TO ANALYZE:
  ${text}
  `;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo-0125", // Using a more stable version
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
        timeout: 30000 // 30s timeout for large text
      }
    );

    const content = response.data.choices[0].message.content;
    const parsed = safeParse(content);

    const questions = parsed.questions || (Array.isArray(parsed) ? parsed : []);

    if (questions.length === 0) {
      throw new Error("AI returned empty questions array");
    }

    return questions;

  } catch (error) {
    console.error("AI SERVICE ERROR:", error.response?.data || error.message);
    
    // Fallback to mock data if API fails but we want the app to stay alive (optional)
    // For now, throw error so the user knows it failed but check logs
    throw new Error(`AI Generation Failed: ${error.message}`);
  }
};

export const generateFeedback = async ({ quizTitle, score, totalQuestions, percentage }) => {
  const isMock = !process.env.OPENAI_API_KEY || 
                 process.env.OPENAI_API_KEY === "your_api_key_here" || 
                 process.env.OPENAI_API_KEY.includes("your_api_key");

  if (isMock) {
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
  } catch (error) {
    console.error("AI FEEDBACK ERROR:", error.message);
    return `You scored ${score}/${totalQuestions}. Keep practicing to improve your understanding of ${quizTitle}!`;
  }
};