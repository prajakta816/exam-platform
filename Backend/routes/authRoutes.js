import express from "express";
import {
  registerUser,
  loginUser,
  getAdminData
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/admin", getAdminData);

export default router;