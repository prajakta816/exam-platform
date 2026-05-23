import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      unique: true,
      required: true,
    },
    testName: {
      type: String,
      default: "Live Test",
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    teacherName: {
      type: String,
      trim: true,
      default: "Teacher",
    },
    isLive: {
      type: Boolean,
      default: true,
      index: true,
    },
    allowTeacherAttempt: {
      type: Boolean,
      default: false,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        score: {
          type: Number,
          default: 0,
        },
        answers: {
          type: [Number],
          default: [],
        },
      },
    ],
    status: {
      type: String,
      enum: ["waiting", "started", "ended"],
      default: "waiting",
    },
    questions: {
      type: Array,
      default: [],
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
