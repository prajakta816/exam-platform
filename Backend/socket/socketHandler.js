import Room from "../models/Room.js";
import User from "../models/User.js";
import TestResult from "../models/TestResult.js";
import Attempt from "../models/Attempt.js";
import { generateFeedback } from "../utils/aiService.js";

// In-memory store for active room timers and participants
const roomTimers = new Map();
const activeParticipants = new Map(); // roomCode -> [ { userId, name, role, socketId } ]
const roomProgress = new Map(); // roomCode -> { totalAnswered: 0, correctCount: 0 }

export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 1. JOIN ROOM
    socket.on("join-room", ({ roomCode, userId, name, role }) => {
      if (!roomCode) return;
      
      socket.join(roomCode);

      if (!userId) {
        return;
      }
      
      // Initialize room participants if not exists
      if (!activeParticipants.has(roomCode)) {
        activeParticipants.set(roomCode, []);
      }

      const participants = activeParticipants.get(roomCode);
      
      // Prevent duplicate users (same userId but different socketId)
      // or update socketId if user reconnected
      const existingUserIndex = participants.findIndex(p => p.userId === userId);
      if (existingUserIndex !== -1) {
        participants[existingUserIndex].socketId = socket.id;
      } else {
        participants.push({ userId, name, role, socketId: socket.id });
      }

      console.log(`User ${name} joined room: ${roomCode}`);
      
      // Broadcast updated list to everyone in the room
      io.to(roomCode).emit("participants-update", participants);
    });

    // 2. START TEST (Teacher Only)
    socket.on("start-test", async ({ roomCode, userId }) => {
      try {
        const user = await User.findById(userId);
        if (!user || user.role !== "teacher") {
          return socket.emit("error", { message: "Only teachers can start the test" });
        }

        const room = await Room.findOneAndUpdate(
          { roomCode, teacher: userId },
          { status: "started", isLive: true, currentQuestionIndex: 0 },
          { new: true }
        );

        if (!room) return socket.emit("error", { message: "Room not found or unauthorized" });

        io.to(roomCode).emit("test-started", { 
          questionsCount: room.questions.length,
          firstQuestion: room.questions[0],
          allowTeacherAttempt: room.allowTeacherAttempt
        });

        roomProgress.set(roomCode, { totalAnswered: 0, correctCount: 0 });
        const participants = activeParticipants.get(roomCode) || [];
        const totalStudents = participants.filter(p => p.role !== 'teacher').length;
        io.to(roomCode).emit("progress-update", { totalAnswered: 0, correctCount: 0, totalStudents });

        startRoomTimer(io, roomCode, room.questions[0].timer || 30);
      } catch (error) {
        console.error("Start test error:", error);
      }
    });

    // 3. NEXT QUESTION
    socket.on("next-question", async ({ roomCode, userId }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room) return;
        // Clear any existing timer before moving to next question
        if (roomTimers.has(roomCode)) {
          clearInterval(roomTimers.get(roomCode).interval);
          roomTimers.delete(roomCode);
          io.to(roomCode).emit("timer", { timeLeft: 0 });
        }
        // Allow any participant (teacher or student) to move to next question
        moveToNextQuestion(io, roomCode);
      } catch (error) {
        console.error("Next question error:", error);
      }
    });

    // 4. SUBMIT ANSWER
    socket.on("submit-answer", async ({ roomCode, userId, answerIndex }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room || room.status !== "started") return;

        const currentQ = room.questions[room.currentQuestionIndex];
        const isCorrect = currentQ.correctAnswer === answerIndex;

        await Room.updateOne(
          { roomCode, "students.userId": userId },
          { 
            $inc: { "students.$.score": isCorrect ? 1 : 0 },
            $push: { "students.$.answers": answerIndex } // ✅ Track answer
          }
        );

        if (isCorrect) {
          const participant = activeParticipants.get(roomCode)?.find(p => p.userId === userId);
          if (participant) {
            room.questions[room.currentQuestionIndex].correctStudents.push(participant.name);
            room.markModified('questions');
            await room.save();
          }
        }

        const progress = roomProgress.get(roomCode) || { totalAnswered: 0, correctCount: 0 };
        progress.totalAnswered += 1;
        if (isCorrect) progress.correctCount += 1;
        roomProgress.set(roomCode, progress);

        const participants = activeParticipants.get(roomCode) || [];
        const totalStudents = participants.filter(p => p.role !== 'teacher').length;

        io.to(roomCode).emit("progress-update", {
          totalAnswered: progress.totalAnswered,
          correctCount: progress.correctCount,
          totalStudents
        });

        socket.emit("answer-submitted", { success: true });

        // Override timer if all students answered
        if (progress.totalAnswered >= totalStudents && totalStudents > 0) {
          if (roomTimers.has(roomCode)) {
            clearInterval(roomTimers.get(roomCode).interval);
            roomTimers.delete(roomCode);
          }
          io.to(roomCode).emit("timer", { timeLeft: 0 }); // forcefully end UI timer
          io.to(roomCode).emit("all-answered");
          // Automatically advance to next question after all have answered
          moveToNextQuestion(io, roomCode);
        }
      } catch (error) {
        console.error("Submit answer error:", error);
      }
    });

    // 5. END TEST & EVALUATE
    socket.on("end-test", async ({ roomCode, userId }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room || room.teacher.toString() !== userId) return;

        endTestFlow(io, roomCode);
      } catch (error) {
        console.error("End test error:", error);
      }
    });

    // 6. DISCONNECT
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      
      // Find which room this user was in and remove them
      activeParticipants.forEach((participants, roomCode) => {
        const index = participants.findIndex(p => p.socketId === socket.id);
        if (index !== -1) {
          const removedUser = participants.splice(index, 1)[0];
          console.log(`User ${removedUser.name} left room: ${roomCode}`);
          
          // Emit updated list
          io.to(roomCode).emit("participants-update", participants);
          
          // Clean up empty rooms from map
          if (participants.length === 0) {
            activeParticipants.delete(roomCode);
          }
        }
      });
    });
  });
};

const startRoomTimer = (io, roomCode, duration) => {
  if (roomTimers.has(roomCode)) {
    clearInterval(roomTimers.get(roomCode).interval);
  }

  let timeLeft = duration;
  const interval = setInterval(() => {
    timeLeft--;
    io.to(roomCode).emit("timer", { timeLeft });

    if (timeLeft <= 0) {
      clearInterval(interval);
      roomTimers.delete(roomCode);
      io.to(roomCode).emit("time-up");
      io.to(roomCode).emit("question-ended");
      moveToNextQuestion(io, roomCode); // Auto move to next question!
    }
  }, 1000);

  roomTimers.set(roomCode, { interval, timeLeft });
};

const moveToNextQuestion = async (io, roomCode) => {
  try {
    const room = await Room.findOne({ roomCode });
    if (!room || room.status !== "started") return;

    const nextIndex = room.currentQuestionIndex + 1;
    if (nextIndex >= room.questions.length) {
      return endTestFlow(io, roomCode);
    }

    room.currentQuestionIndex = nextIndex;
    await room.save();

    const nextQuestion = room.questions[nextIndex];
    io.to(roomCode).emit("new-question", { 
      question: nextQuestion,
      index: nextIndex 
    });

    roomProgress.set(roomCode, { totalAnswered: 0, correctCount: 0 });
    const participants = activeParticipants.get(roomCode) || [];
    const totalStudents = participants.filter(p => p.role !== 'teacher').length;
    io.to(roomCode).emit("progress-update", { totalAnswered: 0, correctCount: 0, totalStudents });

    startRoomTimer(io, roomCode, nextQuestion.timer || 30);
  } catch (error) {
    console.error("Move to next question error:", error);
  }
};

const endTestFlow = async (io, roomCode) => {
  try {
    const room = await Room.findOne({ roomCode });
    if (!room || room.status === "ended") return;

    room.status = "ended";
    room.isLive = false;
    await room.save();

    if (roomTimers.has(roomCode)) {
      clearInterval(roomTimers.get(roomCode).interval);
      roomTimers.delete(roomCode);
    }
    roomProgress.delete(roomCode);

    const sortedStudents = [...room.students].sort((a, b) => b.score - a.score);

    const resultsToSave = await Promise.all(sortedStudents.map(async (student, index) => {
      let badge = "";
      if (index === 0) badge = "Gold";
      else if (index === 1) badge = "Silver";
      else if (index === 2) badge = "Bronze";

      const prevResult = await TestResult.findOne({ studentId: student.userId })
        .sort({ date: -1 });

      let growth = "first";
      if (prevResult) {
        if (student.score > prevResult.score) growth = "increase";
        else if (student.score < prevResult.score) growth = "decrease";
        else growth = "same";
      }

      return {
        testName: room.testName,
        roomCode: room.roomCode,
        quizId: room.quizId, // ✅ Link to the permanent Quiz ID
        studentId: student.userId,
        studentName: student.name,
        score: student.score,
        answers: student.answers, // ✅ Save student choices
        badge: badge,
        growth: growth
      };
    }));

    await TestResult.insertMany(resultsToSave);

    const leaderboard = resultsToSave.slice(0, 3);
    const allResults = resultsToSave;

    // Emit instantly so UI doesn't hang!
    io.to(roomCode).emit("test-ended", { 
      message: "Test has ended. Results are calculated.",
      leaderboard,
      allResults
    });

    // 🆕 Create Attempt records for each student asynchronously to prevent rate limits (429)
    (async () => {
      for (const res of resultsToSave) {
        if (!res.quizId) {
          console.warn(`[WARNING] Missing quizId for room ${room.roomCode}. Skipping Attempt creation.`);
          continue;
        }
        
        try {
          const totalQuestions = room.questions.length;
          const percentage = (res.score / totalQuestions) * 100;
          
          // Generate individual feedback
          const feedback = await generateFeedback({
            quizTitle: room.testName,
            score: res.score,
            totalQuestions,
            percentage
          });

          await Attempt.create({
            user: res.studentId,
            quiz: res.quizId,
            score: res.score,
            totalQuestions,
            percentage,
            feedback,
            answers: res.answers
          });
          
          // Wait 2 seconds between API calls to prevent 429 Too Many Requests
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          console.error("Error creating attempt in background:", err.message);
        }
      }
    })();

  } catch (error) {
    console.error("End test error:", error);
    io.to(roomCode).emit("error", { message: "Failed to evaluate results" });
  }
};
