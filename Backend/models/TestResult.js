import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
    },
    roomCode: {
      type: String,
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },
    studentName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    badge: {
      type: String,
      enum: ["Gold", "Silver", "Bronze", ""],
      default: "",
    },
    growth: {
      type: String,
      enum: ["increase", "decrease", "same", "first"],
      default: "first",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    answers: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("TestResult", testResultSchema);
