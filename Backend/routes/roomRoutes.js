import express from "express";
import { createRoom, getFollowedLiveRooms, joinRoom, endRoom } from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/live-followed", protect, getFollowedLiveRooms);
router.post("/create", protect, createRoom);
router.post("/join", protect, joinRoom);
router.post("/end", protect, endRoom);

export default router;
