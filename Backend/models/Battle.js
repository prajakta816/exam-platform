import mongoose from "mongoose";

const battleSchema = new mongoose.Schema({
  challenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  opponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "active", "completed", "declined"],
    default: "pending",
  },
  scores: {
    challenger: { type: Number, default: 0 },
    opponent: { type: Number, default: 0 },
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // null means tie if completed
  },
}, { timestamps: true });

export default mongoose.model("Battle", battleSchema);
