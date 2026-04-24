import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  searchUsers, 
  getUserProfile, 
  followUser, 
  unfollowUser,
  getFollowingContent,
  acceptFollowRequest,
  rejectFollowRequest,
  getMyFollowRequests,
  updateProfile,
  changePassword
} from "../controllers/userController.js";
import multer from "multer";

const router = express.Router();

// Multer config for profiles
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profiles/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.get("/search", protect, searchUsers);
router.get("/requests", protect, getMyFollowRequests);
router.get("/following-content", protect, getFollowingContent);
router.get("/:id", protect, getUserProfile);

router.put("/update-profile", protect, upload.single("profilePic"), updateProfile);
router.put("/change-password", protect, changePassword);

router.post("/follow/:id", protect, followUser);
router.post("/unfollow/:id", protect, unfollowUser);
router.post("/accept-follow", protect, acceptFollowRequest);
router.post("/reject-follow", protect, rejectFollowRequest);

export default router;
