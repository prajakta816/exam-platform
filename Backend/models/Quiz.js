import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },

  options: [
    {
      type: String,
      required: true,
    }
  ],

  correctAnswer: {
    type: Number, // index of correct option
    required: true,
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  questions: [questionSchema],

}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);