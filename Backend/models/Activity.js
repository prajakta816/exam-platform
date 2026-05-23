import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["upload_note", "quiz_score", "start_live", "follow"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: Object, // Stores score, noteId, quizId, etc.
  },
}, { timestamps: true });

export default mongoose.model("Activity", activitySchema);
