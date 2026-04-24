import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, "Please enter a valid email"],
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },

  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student",
  },

  bio: {
    type: String,
    default: "",
    maxlength: 150,
  },

  profilePic: {
    type: String,
    default: "",
  },

  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],

  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],

  followRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],

  isPublic: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true });

export default mongoose.model("User", userSchema);