import TestResult from "../models/TestResult.js";
import Room from "../models/Room.js";
import TryCatch from "../utils/TryCatch.js";

// @desc    Get all test results for a specific student
// @route   GET /api/results/student/:id
// @access  Protected
export const getStudentResults = TryCatch(async (req, res) => {
  const studentId = req.params.id;

  const rawResults = await TestResult.find({ studentId })
    .populate({
      path: "quizId",
      populate: {
        path: "createdBy",
        select: "name profilePic"
      }
    })
    .sort({ date: -1 })
    .lean();

  const results = [];
  for (const r of rawResults) {
    let teacherObj = null;
    if (r.quizId && r.quizId.createdBy) {
      teacherObj = r.quizId.createdBy;
    } else {
      const room = await Room.findOne({ roomCode: r.roomCode }).select("teacherName teacher").populate("teacher", "name profilePic").lean();
      if (room) {
        teacherObj = room.teacher || { name: room.teacherName };
      }
    }
    results.push({
      ...r,
      teacherObj
    });
  }

  res.status(200).json({
    success: true,
    count: results.length,
    results
  });
});

// @desc    Get all test results for a specific room
// @route   GET /api/results/room/:roomCode
// @access  Protected (Teacher)
export const getRoomResults = TryCatch(async (req, res) => {
  const { roomCode } = req.params;

  const results = await TestResult.find({ roomCode })
    .sort({ score: -1 });

  res.status(200).json({
    success: true,
    count: results.length,
    results
  });
});

// @desc    Get all tests created by logged in teacher
// @route   GET /api/results/my-tests
// @access  Protected (Teacher)
export const getMyTests = TryCatch(async (req, res) => {
  if (req.user.role !== "teacher") return res.status(403).json({ message: "Not authorized" });
  
  const rooms = await Room.find({ 
    $or: [
      { teacher: req.user._id },
      { teacherId: req.user._id }
    ]
  }).sort({ createdAt: -1 });
  
  const tests = rooms.map(room => ({
    testName: room.testName,
    roomCode: room.roomCode,
    date: room.createdAt,
    totalParticipants: room.students.length
  }));
  
  res.status(200).json({ success: true, tests });
});

// @desc    Get deep analytics for a specific room
// @route   GET /api/results/analytics/:roomCode
// @access  Protected (Teacher)
export const getDeepAnalytics = TryCatch(async (req, res) => {
  const { roomCode } = req.params;
  
  const room = await Room.findOne({ roomCode });
  if (!room) return res.status(404).json({ message: "Room not found" });
  
  const leaderboard = await TestResult.find({ roomCode }).sort({ score: -1 });
  
  res.status(200).json({
    success: true,
    roomCode: room.roomCode,
    testName: room.testName,
    leaderboard,
    questionBank: room.questions
  });
});
