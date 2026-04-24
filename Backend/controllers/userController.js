import User from "../models/User.js";
import Quiz from "../models/Quiz.js";
import Note from "../models/Note.js";
import Notification from "../models/Notification.js";
import TryCatch from "../utils/TryCatch.js";

// 🚀 Search Users
export const searchUsers = TryCatch(async (req, res) => {
  const { name, q } = req.query;
  const searchTerm = name || q;
  if (!searchTerm) return res.json([]);

  const users = await User.find({
    _id: { $ne: req.user.id },
    $or: [
      { name: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } }
    ]
  }).select("name role profilePic email");

  res.json(users);
});

// 🚀 Get User Profile
export const getUserProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("followers", "name profilePic")
    .populate("following", "name profilePic");

  if (!user) return res.status(404).json({ message: "User not found" });

  const isFollowing = user.followers.some(f => f._id.toString() === req.user.id);
  const isOwner = user._id.toString() === req.user.id;
  const hasRequested = user.followRequests.some(id => id.toString() === req.user.id);

  const canSeeContent = user.isPublic || isFollowing || isOwner;

  const quizzes = canSeeContent ? await Quiz.find({ createdBy: user._id }).sort("-createdAt") : [];
  const notes = canSeeContent ? await Note.find({ uploadedBy: user._id }).sort("-createdAt") : [];

  res.json({
    user,
    quizzes,
    notes,
    isFollowing,
    hasRequested,
    isPrivate: !canSeeContent && !user.isPublic
  });
});

// 🚀 Follow User / Send Request
export const followUser = TryCatch(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user.id);

  if (!targetUser) return res.status(404).json({ message: "User not found" });
  if (targetUser._id.toString() === currentUser._id.toString()) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  if (targetUser.followers.includes(currentUser._id)) {
    return res.status(400).json({ message: "Already following" });
  }

  if (targetUser.isPublic) {
    // Follow immediately
    targetUser.followers.push(currentUser._id);
    currentUser.following.push(targetUser._id);
    await targetUser.save();
    await currentUser.save();

    // 🆕 Create Notification
    await Notification.create({
      user: targetUser._id,
      sender: currentUser._id,
      type: "follow",
      message: `${currentUser.name} started following you!`
    });

    return res.json({ message: "Followed successfully" });
  } else {
    // Send request
    if (targetUser.followRequests.includes(currentUser._id)) {
      return res.status(400).json({ message: "Request already sent" });
    }
    targetUser.followRequests.push(currentUser._id);
    await targetUser.save();
    return res.json({ message: "Follow request sent" });
  }
});

// 🚀 Accept Follow Request
export const acceptFollowRequest = TryCatch(async (req, res) => {
  const { requesterId } = req.body;
  const currentUser = await User.findById(req.user.id);
  const requester = await User.findById(requesterId);

  if (!requester) return res.status(404).json({ message: "Requester not found" });

  if (!currentUser.followRequests.includes(requesterId)) {
    return res.status(400).json({ message: "No such follow request" });
  }

  // Move from requests to followers
  currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
  currentUser.followers.push(requesterId);
  
  // Add to requester's following
  requester.following.push(currentUser._id);

  await currentUser.save();
  await requester.save();

  // 🆕 Create Notification for requester
  await Notification.create({
    user: requester._id,
    sender: currentUser._id,
    type: "follow",
    message: `${currentUser.name} accepted your follow request!`
  });

  res.json({ message: "Follow request accepted" });
});

// 🚀 Reject Follow Request
export const rejectFollowRequest = TryCatch(async (req, res) => {
  const { requesterId } = req.body;
  const currentUser = await User.findById(req.user.id);

  currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
  await currentUser.save();

  res.json({ message: "Follow request rejected" });
});

// 🚀 Get My Follow Requests
export const getMyFollowRequests = TryCatch(async (req, res) => {
  const user = await User.findById(req.user.id).populate("followRequests", "name profilePic role");
  if (!user) return res.json([]);
  res.json(user.followRequests || []);
});

// 🚀 Unfollow User
export const unfollowUser = TryCatch(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user.id);

  if (!targetUser) return res.status(404).json({ message: "User not found" });

  currentUser.following = currentUser.following.filter(
    (id) => id.toString() !== targetUser._id.toString()
  );
  targetUser.followers = targetUser.followers.filter(
    (id) => id.toString() !== currentUser._id.toString()
  );

  await currentUser.save();
  await targetUser.save();

  res.json({ message: "Unfollowed successfully" });
});

// 🚀 Get Following Users Content
export const getFollowingContent = TryCatch(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  const quizzes = await Quiz.find({ 
    createdBy: { $in: user.following } 
  }).populate("createdBy", "name profilePic");

  const notes = await Note.find({ 
    uploadedBy: { $in: user.following } 
  }).populate("uploadedBy", "name profilePic");

  res.json({ quizzes, notes });
});

// 🚀 Update Profile
export const updateProfile = TryCatch(async (req, res) => {
  const { name, bio, isPublic } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  user.name = name || user.name;
  user.bio = bio !== undefined ? bio : user.bio;
  user.isPublic = isPublic !== undefined ? (isPublic === "true" || isPublic === true) : user.isPublic;

  if (req.file) {
    user.profilePic = req.file.path.replace(/\\/g, "/"); // normalize path
  }

  await user.save();

  res.json({
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      bio: user.bio,
      profilePic: user.profilePic,
      isPublic: user.isPublic
    }
  });
});

import bcrypt from "bcryptjs";

// 🚀 Change Password
export const changePassword = TryCatch(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select("+password");

  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect old password" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password changed successfully" });
});
