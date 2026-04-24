import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import Quiz from "../models/Quiz.js";
import Note from "../models/Note.js";
import TryCatch from "../utils/TryCatch.js";

// 🚀 Add Comment
export const addComment = TryCatch(async (req, res) => {
  const { content, targetType, targetId } = req.body;

  if (!content || content.trim().length === 0) {
    throw new Error("Comment content cannot be empty");
  }

  if (content.length > 500) {
    throw new Error("Comment too long (max 500 characters)");
  }

  if (!["quiz", "note"].includes(targetType)) {
    throw new Error("Invalid target type");
  }

  if (!targetId) {
    throw new Error("Target ID required");
  }

  const comment = await Comment.create({
    user: req.user.id,
    content,
    targetType,
    targetId,
  });

  // 🆕 Notify Creator
  try {
    let target;
    if (targetType === "quiz") {
      target = await Quiz.findById(targetId);
    } else {
      target = await Note.findById(targetId);
    }

    const creatorId = targetType === "quiz" ? target.createdBy : target.uploadedBy;

    if (creatorId && creatorId.toString() !== req.user.id) {
      await Notification.create({
        user: creatorId,
        sender: req.user.id,
        type: "follow", // We can use 'follow' or add 'comment' type to enum later
        message: `${req.user.name} commented on your ${targetType}: "${content.slice(0, 30)}..."`
      });
    }
  } catch (err) {
    console.error("Comment Notification Error:", err.message);
  }

  res.status(201).json(comment);
});

// 🚀 Get Comments for Target
export const getComments = TryCatch(async (req, res) => {
  const { targetId } = req.params;

  const comments = await Comment.find({ targetId })
    .populate("user", "name profilePic role")
    .sort({ createdAt: -1 });

  res.json(comments);
});
