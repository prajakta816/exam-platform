import express from "express";
import { getDailyContent } from "../controllers/contentController.js";

const router = express.Router();

router.get("/daily", getDailyContent);

export default router;
