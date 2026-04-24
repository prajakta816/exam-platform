import mongoose from "mongoose";

// 🔹 Question Schema
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },

  // ✅ NEW: Image support (base64 or URL)
  image: {
    type: String,
    default: "",
  },

  options: [
    {
      type: String,
      required: true,
      trim: true,
    }
  ],

  correctAnswer: {
    type: Number, // index
    required: true,
    min: 0,
  }
});

// 🔹 Quiz Schema
const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    default: "",
  },

  // ✅ NEW: Timer (in minutes)
  timer: {
    type: Number,
    default: 0,
    min: 0,
  },

  // ✅ NEW: Difficulty tagging
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Easy",
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },

  questions: {
    type: [questionSchema],
    validate: [
      {
        validator: function (val) {
          return val.length > 0;
        },
        message: "At least one question is required",
      }
    ]
  }

}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);