import Battle from "../models/Battle.js";
import { addXP } from "../utils/gamification.js";

// Keep track of connected players per battle { battleId: { userId1: socketId, userId2: socketId } }
const battleParticipants = new Map();
// Keep track of answers per question index { battleId: { questionIndex: { userId1: answered, userId2: answered } } }
const battleProgress = new Map();

export const setupBattleSocket = (io) => {
  const battleIo = io.of("/battle");

  battleIo.on("connection", (socket) => {
    console.log("User connected to battle namespace:", socket.id);

    // 1. Join Battle Room
    socket.on("join-battle", async ({ battleId, userId }) => {
      socket.join(battleId);
      
      if (!battleParticipants.has(battleId)) {
        battleParticipants.set(battleId, new Map());
      }
      battleParticipants.get(battleId).set(userId, socket.id);

      console.log(`User ${userId} joined battle ${battleId}`);

      // If both players are connected, emit 'battle-ready'
      const participants = battleParticipants.get(battleId);
      if (participants.size === 2) {
        battleIo.to(battleId).emit("battle-ready");
      }
    });

    // 2. Submit Answer
    socket.on("submit-battle-answer", async ({ battleId, userId, isCorrect, questionIndex }) => {
      try {
        const battle = await Battle.findById(battleId);
        if (!battle || battle.status !== "active") return;

        // Update score in DB if correct
        if (isCorrect) {
          const isChallenger = battle.challenger.toString() === userId;
          if (isChallenger) {
            battle.scores.challenger += 1;
          } else {
            battle.scores.opponent += 1;
          }
          await battle.save();
        }

        // Emit updated score
        battleIo.to(battleId).emit("battle-score-update", {
          challenger: battle.scores.challenger,
          opponent: battle.scores.opponent,
        });

        // Track that this user answered this question
        if (!battleProgress.has(battleId)) {
          battleProgress.set(battleId, new Map());
        }
        const progress = battleProgress.get(battleId);
        if (!progress.has(questionIndex)) {
          progress.set(questionIndex, new Set());
        }
        progress.get(questionIndex).add(userId);

        // If both answered, move to next
        if (progress.get(questionIndex).size === 2) {
          // Add a tiny delay for UX so they see the result before moving
          setTimeout(() => {
            battleIo.to(battleId).emit("next-battle-question");
          }, 1500);
        }

      } catch (error) {
        console.error("Battle submit answer error:", error);
      }
    });

    // 3. Battle Ended
    socket.on("end-battle", async ({ battleId }) => {
      try {
        const battle = await Battle.findById(battleId);
        if (!battle || battle.status === "completed") return;

        // Determine winner
        let winnerId = null;
        if (battle.scores.challenger > battle.scores.opponent) {
          winnerId = battle.challenger;
        } else if (battle.scores.opponent > battle.scores.challenger) {
          winnerId = battle.opponent;
        }

        battle.status = "completed";
        battle.winner = winnerId;
        await battle.save();

        if (winnerId) {
          addXP(winnerId.toString(), 50).catch(() => {}); // Bonus XP for winning
        }

        battleIo.to(battleId).emit("battle-ended", {
          winner: winnerId,
          scores: battle.scores
        });

      } catch (error) {
        console.error("End battle error:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from battle:", socket.id);
      // Optional: Handle disconnect logic (forfeit)
    });
  });
};
