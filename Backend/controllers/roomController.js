import Room from "../models/Room.js";
import Quiz from "../models/Quiz.js";
import { generateRoomCode } from "../utils/generateRoomCode.js";
import TryCatch from "../utils/TryCatch.js";
import { logActivity } from "../utils/ActivityLog.js";

// @desc    Create a new live room
// @route   POST /api/room/create
// @access  Teacher Only
export const createRoom = TryCatch(async (req, res) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "Only teachers can create rooms" });
  }

  let roomCode;
  let isUnique = false;

  // Ensure roomCode is unique
  while (!isUnique) {
    roomCode = generateRoomCode();
    const existingRoom = await Room.findOne({ roomCode });
    if (!existingRoom) isUnique = true;
  }

  // Create a background quiz for results tracking
  const quiz = await Quiz.create({
    title: req.body.testName || "Live Test",
    description: `Live Session Quiz: ${req.body.testName || "Live Test"}`,
    questions: (req.body.questions || []).map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      timer: q.timer || 30
    })),
    createdBy: req.user._id,
    difficulty: "Medium",
    roomCode: roomCode,
    origin: "battle",
    isHidden: true, // Hides it from teacher's main profile list
  });

  const room = await Room.create({
    roomCode,
    testName: req.body.testName || "Live Test",
    teacherId: req.user._id,
    teacherName: req.user.name,
    isLive: true,
    allowTeacherAttempt: req.body.allowTeacherAttempt || false,
    teacher: req.user._id,
    quizId: quiz._id,
    questions: (req.body.questions || []).map(q => ({ 
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      timer: q.timer || 30,
      correctStudents: [] 
    })),
  });

  // 🆕 Log Activity
  await logActivity({
    user: req.user._id,
    type: "start_live",
    message: `started a new live quiz: "${room.testName}"`,
    metadata: { roomCode: room.roomCode, testName: room.testName }
  });

  res.status(201).json({
    success: true,
    message: "Room created successfully",
    roomCode: room.roomCode,
    room,
  });
});

// @desc    Get live rooms created by teachers the student follows
// @route   GET /api/room/live-followed
// @access  Student
export const getFollowedLiveRooms = TryCatch(async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only students can view followed live tests" });
  }

  const followedTeachers = req.user.following || [];

  if (!followedTeachers.length) {
    return res.status(200).json([]);
  }

  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const rooms = await Room.find({
    isLive: true,
    status: { $ne: "ended" },
    createdAt: { $gte: twelveHoursAgo }, // ✅ Senior Dev Fix: Only show recently created rooms
    $or: [
      { teacherId: { $in: followedTeachers } },
      { teacher: { $in: followedTeachers } },
    ],
  })
    .populate("teacherId", "name profilePic")
    .populate("teacher", "name profilePic")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(
    rooms.map((room) => {
      const teacher = room.teacherId || room.teacher;

      return {
        roomCode: room.roomCode,
        testName: room.testName || "Live Test",
        teacherName: room.teacherName || teacher?.name || "Teacher",
        teacherProfileImage: teacher?.profilePic || "",
        isLive: room.isLive && room.status !== "ended",
      };
    })
  );
});

// @desc    Join a room
// @route   POST /api/room/join
// @access  Protected
export const joinRoom = TryCatch(async (req, res) => {
  const { roomCode } = req.body;

  if (!roomCode) {
    return res.status(400).json({ message: "Room code is required" });
  }

  const room = await Room.findOne({ roomCode });

  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  if (room.status === "ended") {
    return res.status(400).json({ message: "This room has already ended" });
  }

  // Check if student already in room
  const isAlreadyJoined = room.students.find(
    (s) => s.userId.toString() === req.user._id.toString()
  );

  if (isAlreadyJoined) {
    return res.status(200).json({
      success: true,
      message: "Already joined the room",
      room,
    });
  }

  // Add student to room
  room.students.push({
    userId: req.user._id,
    name: req.user.name,
    score: 0,
  });

  await room.save();

  res.status(200).json({
    success: true,
    message: "Joined room successfully",
    room,
  });
});

// @desc    End a room
// @route   POST /api/room/end
// @access  Teacher Only
export const endRoom = TryCatch(async (req, res) => {
  const { roomCode } = req.body;
  const room = await Room.findOne({ roomCode });

  if (!room) return res.status(404).json({ message: "Room not found" });

  // Only the creator can end the room
  if (room.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the teacher can end this session" });
  }

  room.status = "ended";
  room.isLive = false;
  await room.save();

  res.status(200).json({ success: true, message: "Room ended successfully" });
});
