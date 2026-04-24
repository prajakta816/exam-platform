// 🔄 UPDATED

import express from "express";
import cors from "cors";
import helmet from "helmet"; // 🆕 added
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import contentRoutes from "./routes/contentRoutes.js"; // 🆕 added
import userRoutes from "./routes/userRoutes.js"; // 🆕 added
import notificationRoutes from "./routes/notificationRoutes.js"; // 🆕 added
import commentRoutes from "./routes/commentRoutes.js"; // 🆕 added
import ratingRoutes from "./routes/ratingRoutes.js"; // 🆕 added
import { PORT } from "./config/env.js";

const app = express();

connectDB();

app.use(helmet()); // ✅ Security headers
app.use(cors());
app.use(express.json());

// 🆕 RATE LIMIT (Enhanced)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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
app.use("/api/user", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/rating", ratingRoutes);
app.use("/uploads", express.static("uploads"));

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});