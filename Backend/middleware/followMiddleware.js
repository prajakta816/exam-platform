import User from "../models/User.js";
import TryCatch from "../utils/TryCatch.js";

/**
 * Middleware to check if the current user has permission to view another user's content.
 * Permission is granted if:
 * 1. The target user is public
 * 2. The current user is following the target user
 * 3. The current user is the target user itself
 */
export const checkFollowPermission = TryCatch(async (req, res, next) => {
  const targetUserId = req.params.userId || req.params.id;
  const currentUserId = req.user.id;

  if (targetUserId === currentUserId) return next();

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) return res.status(404).json({ message: "User not found" });

  const isFollowing = targetUser.followers.includes(currentUserId);
  
  if (targetUser.isPublic || isFollowing) {
    return next();
  }

  res.status(403).json({ 
    message: "This account is private. Follow to view content.",
    isPrivate: true 
  });
});
