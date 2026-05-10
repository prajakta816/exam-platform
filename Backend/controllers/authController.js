import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import TryCatch from "../utils/TryCatch.js";
import sendEmail from "../utils/sendEmail.js";
//import { verifyToken } from "../utils/verifyToken.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ ADD THIS

import { JWT_SECRET, FRONTEND_URL } from "../config/env.js";


// REGISTER
export const registerUser = TryCatch(async (req, res) => {
  const { name, email, password, role } = req.body;

  // 🛡️ BASIC VALIDATION
  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please provide a valid email address");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role === "teacher" ? "teacher" : "student",
    verificationToken,
  });

  const verificationUrl = `${FRONTEND_URL}/verify-email/${verificationToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Email Verification - Exam Platform",
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      `,
    });
  } catch (error) {
    console.error("Error sending verification email", error);
  }

  res.status(201).json({
    message: "User registered. Please check your email to verify your account.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});


// LOGIN
export const loginUser = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please provide a valid email address");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email first");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic,
    },
  });
});


// ADMIN ROUTE
export const getAdminData = TryCatch(async (req, res) => {
  //const user = verifyToken(req);
  const user = req.user;

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json({
    message: "Welcome Admin",
    user,
  });
});

// VERIFY EMAIL
export const verifyEmail = TryCatch(async (req, res) => {
  const { token } = req.params;

  // 1. Try to find user with this token
  const user = await User.findOne({ verificationToken: token });

  // 2. If not found, it might be already verified
  if (!user) {
    // We can't easily find which user it WAS, so we tell them to check login
    return res.status(400).json({ 
      message: "This link is invalid or has already been used. Please try logging in." 
    });
  }

  // 3. Mark as verified
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  res.json({ message: "Email verified successfully! You can now login." });
});

// RESEND VERIFICATION EMAIL
export const resendVerification = TryCatch(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("This account is already verified");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  user.verificationToken = verificationToken;
  await user.save();

  const verificationUrl = `${FRONTEND_URL}/verify-email/${verificationToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Resend: Email Verification - Exam Platform",
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      `,
    });
    res.json({ message: "Verification link sent to your email" });
  } catch (error) {
    throw new Error("Email could not be sent");
  }
});

// FORGOT PASSWORD
export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User with this email does not exist");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins

  await user.save();

  const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 15 minutes.</p>
      `,
    });

    res.json({ message: "Reset link sent to your email" });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw new Error("Email could not be sent");
  }
});

// RESET PASSWORD
export const resetPassword = TryCatch(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  user.password = await bcrypt.hash(password, 10);
  user.isVerified = true; // Mark as verified if they reset password
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});

// GOOGLE AUTH CALLBACK
export const googleAuthCallback = TryCatch(async (req, res) => {
  const user = req.user;

  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Redirect to frontend with token
  res.redirect(`${FRONTEND_URL}/login?token=${token}`);
});