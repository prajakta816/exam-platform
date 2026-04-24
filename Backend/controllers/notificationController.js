import Notification from "../models/Notification.js";
import TryCatch from "../utils/TryCatch.js";

// 🚀 Get all notifications for logged-in user
export const getNotifications = TryCatch(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .populate("sender", "name profilePic")
    .sort({ createdAt: -1 });

  res.json(notifications);
});

// 🚀 Mark notification as read
export const markAsRead = TryCatch(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  if (notification.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  notification.isRead = true;
  await notification.save();

  res.json({ message: "Notification marked as read" });
});
