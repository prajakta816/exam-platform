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

  isVerified: {
    type: Boolean,
    default: false,
  },

  verificationOtp: String,
  verificationOtpExpires: Date,

  resetPasswordToken: String,
  resetPasswordExpires: Date,

  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows null for non-google users
  },

  achievements: [{
    title: String,
    date: { type: Date, default: Date.now },
    icon: String,
  }],

  // 🎮 Gamification
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: String,
    enum: ["Beginner", "Learner", "Advanced", "Expert"],
    default: "Beginner",
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastActiveDate: {
    type: Date,
    default: null,
  },
  badges: [{
    name: String,
    earnedAt: { type: Date, default: Date.now },
    icon: String,
  }],

}, { timestamps: true });

export default mongoose.model("User", userSchema);