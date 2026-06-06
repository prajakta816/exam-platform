import Attempt from "../models/Attempt.js";
import Quiz from "../models/Quiz.js";
import Note from "../models/Note.js";
import TryCatch from "../utils/TryCatch.js";
import { analyzeWeaknesses } from "../utils/aiService.js";

// 🚀 Get Learning Pulse
export const getLearningPulse = TryCatch(async (req, res) => {
  const userId = req.user.id;

  // 1. Fetch User's Attempts
  const attempts = await Attempt.find({ user: userId }).populate("quiz", "title description");
  
  // 2. Calculate Average Score
  let averageScore = 0;
  if (attempts.length > 0) {
    const totalPercentage = attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    averageScore = Math.round(totalPercentage / attempts.length);
  }

  // 3. AI Weakness Analysis
  const analysis = await analyzeWeaknesses(attempts);
  const strengths = analysis?.strengths || [];
  const weaknesses = analysis?.weaknesses || [];

  // Extract just the labels/names for searching
  const getLabel = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.topic || item.area || item.subject || item.name || item.title || "";
  };

  const weakLabels = weaknesses.map(getLabel).filter(Boolean);
  
  // 4. Find Recommended Quizzes & Notes
  let recommendedQuizzes = [];
  let recommendedNotes = [];

  if (weakLabels.length > 0) {
    // Create regex patterns from weak topics
    const searchRegex = new RegExp(weakLabels.join("|"), "i");
    
    recommendedQuizzes = await Quiz.find({ 
      title: { $regex: searchRegex },
      isPublic: true,
      isHidden: false
    })
    .select("title description origin")
    .limit(3);

    recommendedNotes = await Note.find({ 
      title: { $regex: searchRegex },
      isPublic: true
    })
    .select("title description fileUrl")
    .limit(3);
  }

  // Fallbacks if no recommendations found via regex
  if (recommendedQuizzes.length === 0) {
    recommendedQuizzes = await Quiz.find({ isPublic: true, isHidden: false })
      .select("title description origin")
      .limit(3);
  }
  
  if (recommendedNotes.length === 0) {
    recommendedNotes = await Note.find({ isPublic: true })
      .select("title description fileUrl")
      .limit(3);
  }

  // Generate dynamic recommendation text
  let recommendationText = `Your overall average score is ${averageScore}%. Keep practicing!`;
  if (weakLabels.length > 0) {
    recommendationText = `Your performance shows gaps in ${weakLabels.slice(0, 2).join(" and ")}. Consider exploring our recommended notes and quizzes to improve.`;
  } else if (averageScore > 80) {
    recommendationText = `You are performing exceptionally well with an average score of ${averageScore}%. Try advanced quizzes to challenge yourself!`;
  }

  res.json({
    averageScore,
    strengths,
    weaknesses,
    recommendedQuizzes,
    recommendedNotes,
    recommendationText
  });
});
