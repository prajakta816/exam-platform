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

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = Date.now() + 15 * 60 * 1000; // 15 mins

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role === "teacher" ? "teacher" : "student",
    verificationOtp: otp,
    verificationOtpExpires: otpExpires,
  });

  try {
    await sendEmail({
      email: user.email,
      subject: "Email Verification OTP - Exam Platform",
      html: `
        <h1>Email Verification</h1>
        <p>Your One-Time Password (OTP) for verifying your email is:</p>
        <h2 style="font-size: 24px; font-weight: bold; color: #4F46E5; letter-spacing: 2px;">${otp}</h2>
        <p>This OTP is valid for 15 minutes. Please do not share it with anyone.</p>
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
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isVerified) {
    return res.status(401).json({ message: "Please verify your email first" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
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

// VERIFY OTP
export const verifyOtp = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "Account is already verified" });
  }

  if (user.verificationOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (user.verificationOtpExpires < Date.now()) {
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  // Mark as verified
  user.isVerified = true;
  user.verificationOtp = undefined;
  user.verificationOtpExpires = undefined;
  await user.save();

  // Generate token to automatically log them in
  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Email verified successfully!",
    token,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic,
    },
  });
});

// RESEND OTP
export const resendOtp = TryCatch(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("This account is already verified");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  user.verificationOtp = otp;
  user.verificationOtpExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: "Resend: Email Verification OTP - Exam Platform",
      html: `
        <h1>Email Verification</h1>
        <p>Your new One-Time Password (OTP) for verifying your email is:</p>
        <h2 style="font-size: 24px; font-weight: bold; color: #4F46E5; letter-spacing: 2px;">${otp}</h2>
        <p>This OTP is valid for 15 minutes. Please do not share it with anyone.</p>
      `,
    });
    res.json({ message: "A new OTP has been sent to your email" });
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