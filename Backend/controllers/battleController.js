import Battle from "../models/Battle.js";
import User from "../models/User.js";
import Quiz from "../models/Quiz.js";
import Notification from "../models/Notification.js";
import TryCatch from "../utils/TryCatch.js";

// 🚀 Issue a challenge
export const challengeUser = TryCatch(async (req, res) => {
  const challengerId = req.user.id;
  const { opponentId } = req.body;

  if (challengerId === opponentId) {
    return res.status(400).json({ message: "You cannot challenge yourself." });
  }

  const opponent = await User.findById(opponentId);
  if (!opponent) {
    return res.status(404).json({ message: "Opponent not found." });
  }

  // Find a random public quiz for the battle
  const quizzes = await Quiz.aggregate([
    { $match: { isPublic: true, isHidden: false } },
    { $sample: { size: 1 } }
  ]);

  if (quizzes.length === 0) {
    return res.status(404).json({ message: "No public quizzes available for battle." });
  }
  
  const quizId = quizzes[0]._id;

  const battle = await Battle.create({
    challenger: challengerId,
    opponent: opponentId,
    quiz: quizId,
    status: "pending"
  });

  // Notify opponent
  const challenger = await User.findById(challengerId);
  await Notification.create({
    user: opponentId,
    sender: challengerId,
    type: "battle_challenge",
    message: `${challenger.name} challenged you to a Quiz Battle!`,
  });

  res.status(201).json({ message: "Challenge sent successfully!", battle });
});

// 🚀 Accept a challenge
export const acceptChallenge = TryCatch(async (req, res) => {
  const opponentId = req.user.id;
  const { battleId } = req.params;

  const battle = await Battle.findById(battleId);
  if (!battle) return res.status(404).json({ message: "Battle not found." });

  if (battle.opponent.toString() !== opponentId) {
    return res.status(403).json({ message: "Not authorized to accept this challenge." });
  }

  if (battle.status !== "pending") {
    return res.status(400).json({ message: "Challenge is no longer pending." });
  }

  battle.status = "active";
  await battle.save();

  res.json({ message: "Challenge accepted!", battle });
});

// 🚀 Get pending challenges for a user
export const getPendingChallenges = TryCatch(async (req, res) => {
  const userId = req.user.id;
  const battles = await Battle.find({ opponent: userId, status: "pending" }).populate("challenger", "name profilePic");
  res.json(battles);
});

// 🚀 Get battle details
export const getBattleDetails = TryCatch(async (req, res) => {
  const { battleId } = req.params;
  const battle = await Battle.findById(battleId)
    .populate("challenger", "name profilePic")
    .populate("opponent", "name profilePic")
    .populate("quiz");
  
  if (!battle) return res.status(404).json({ message: "Battle not found." });
  res.json(battle);
});
