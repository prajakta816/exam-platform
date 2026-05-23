// 🔄 UPDATED with CORS and Static File Fix
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import { PORT, FRONTEND_URL } from "./config/env.js";
import session from "express-session";
import passport from "passport";
import "./config/passport.js";
import { setupSocket } from "./socket/socketHandler.js";

const app = express();
const httpServer = createServer(app);

// MIDDLEWARE
app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// Configure Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true
  },
});

// connectDB(); // Moved to startup sequence

// 🛡️ SECURITY MIDDLEWARE
// Set crossOriginResourcePolicy to false to allow images to be loaded by frontend
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: ["http://localhost:5173", FRONTEND_URL],
  credentials: true
}));

app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { message: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/attempt", attemptRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/daily-news", contentRoutes);
app.use("/api/news", contentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/rating", ratingRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/results", resultRoutes);

// Static files (Images)
app.use("/uploads", express.static("uploads"));

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({ 
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Setup Socket.io
setupSocket(io);

// 🚀 ONE-TIME DATA MIGRATION: Mark old battle quizzes
import Quiz from "./models/Quiz.js";
const migrateData = async () => {
  console.log("🔄 Data Migration: Scanning for legacy battle quizzes...");
  try {
    const result = await Quiz.updateMany(
      { 
        origin: { $ne: "battle" },
        $or: [
          { roomCode: { $ne: null } },
          { title: { $regex: "Live Test|123456", $options: "i" } },
          { description: { $regex: "Live Session|Live Test|room", $options: "i" } }
        ]
      },
      { $set: { origin: "battle", isHidden: true } }
    );
    console.log(`✅ Data Migration: Updated ${result.modifiedCount} legacy battle quizzes.`);
  } catch (error) {
    console.error("❌ Data Migration Error:", error);
  }
};

const startServer = (port) => {
  httpServer.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const newPort = parseInt(port, 10) + 1;
      console.warn(`Port ${port} in use, trying port ${newPort}`);
      startServer(newPort);
    } else {
      console.error('Server error:', err);
    }
  });

  httpServer.listen(port, () => {
    console.log(`Server running on ${port}`);
    migrateData(); // Run migration after server starts
  });
};

// Initialize Database and Start Server
const init = async () => {
  try {
    await connectDB();
    startServer(PORT);
  } catch (error) {
    console.error("❌ Critical: Failed to initialize application:", error);
    process.exit(1);
  }
};

init();
