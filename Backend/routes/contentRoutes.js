import express from "express";
import { getDailyContent } from "../controllers/contentController.js";

const router = express.Router();

router.get("/", getDailyContent);
router.get("/daily", getDailyContent);
router.get("/daily-news", getDailyContent);
router.get("/news", getDailyContent);

export default router;
