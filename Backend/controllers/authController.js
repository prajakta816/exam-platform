import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import TryCatch from "../utils/TryCatch.js";
//import { verifyToken } from "../utils/verifyToken.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ ADD THIS

import { JWT_SECRET } from "../config/env.js";


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

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role === "teacher" ? "teacher" : "student",
  });

  res.status(201).json({
    message: "User registered",
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