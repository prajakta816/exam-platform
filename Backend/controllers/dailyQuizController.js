import { DAILY_QUIZ_COUNT } from "../config/env.js";

// Mock pool of quiz questions
const QUIZ_POOL = [
  {
    question: "What does CPU stand for?",
    options: ["Central Process Unit", "Computer Processing Unit", "Central Processing Unit", "Control Processing Unit"],
    correctAnswer: 2
  },
  {
    question: "Which language is primarily used for front‑end development?",
    options: ["Python", "Java", "JavaScript", "C#"],
    correctAnswer: 2
  },
  {
    question: "What year was the first iPhone released?",
    options: ["2005", "2007", "2008", "2006"],
    correctAnswer: 1
  },
  {
    question: "What does HTML stand for?",
    options: ["Hyper Text Markup Language", "Hyperlink Markup Language", "Hyper Text Multiple Language", "Hyperlink Text Language"],
    correctAnswer: 0
  },
  {
    question: "Which protocol is used to securely fetch a webpage?",
    options: ["HTTP", "FTP", "HTTPS", "SSH"],
    correctAnswer: 2
  }
];

export const getDailyQuiz = async (req, res) => {
  try {
    const count = DAILY_QUIZ_COUNT ? parseInt(DAILY_QUIZ_COUNT) : 3;
    const day = new Date().getDate();
    const startIdx = day % QUIZ_POOL.length;
    const selected = [];
    for (let i = 0; i < count; i++) {
      const item = QUIZ_POOL[(startIdx + i) % QUIZ_POOL.length];
      selected.push(item);
    }
    res.json({
      quizDate: new Date().toISOString().split('T')[0],
      questions: selected,
      isMock: true
    });
  } catch (err) {
    console.error('Daily quiz error', err);
    res.status(500).json({ message: 'Failed to fetch daily quiz' });
  }
};
