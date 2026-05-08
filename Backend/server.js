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
import { PORT } from "./config/env.js";
import { setupSocket } from "./socket/socketHandler.js";

const app = express();
const httpServer = createServer(app);

// Configure Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
});

connectDB();

// 🛡️ SECURITY MIDDLEWARE
// Set crossOriginResourcePolicy to false to allow images to be loaded by frontend
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: "http://localhost:5173",
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

// Setup Socket.io
setupSocket(io);

const startServer = (port) => {
  const server = httpServer.listen(port, () => {
    console.log(`Server running on ${port}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const newPort = port + 1;
      console.warn(`Port ${port} in use, trying port ${newPort}`);
      startServer(newPort);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(PORT);
