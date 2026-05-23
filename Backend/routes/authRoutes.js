import express from "express";
import passport from "passport";
import {
  registerUser,
  loginUser,
  getAdminData,
  verifyOtp,
  forgotPassword,
  resetPassword,
  googleAuthCallback,
  resendOtp,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/admin", getAdminData);

router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
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