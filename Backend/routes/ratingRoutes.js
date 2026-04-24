import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { postRating, getAverageRating } from "../controllers/ratingController.js";

const router = express.Router();

router.post("/", protect, postRating);
router.get("/:targetId", getAverageRating);

export default router;
