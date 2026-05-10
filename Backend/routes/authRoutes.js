import express from "express";
import passport from "passport";
import {
  registerUser,
  loginUser,
  getAdminData,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleAuthCallback,
  resendVerification,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/admin", getAdminData);

router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// GOOGLE OAUTH
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleAuthCallback
);

export default router;