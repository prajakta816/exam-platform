import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

/**
 * Logs a global activity and notifies followers if necessary
 */
export const logActivity = async ({ user, type, message, metadata = {} }) => {
  try {
    // 1. Create the activity
    await Activity.create({ user, type, message, metadata });

    // 2. If it's a significant activity, notify followers
    // Significant types: start_live, upload_note, follow
    if (["start_live", "upload_note", "follow"].includes(type)) {
      const actor = await User.findById(user);
      if (actor && actor.followers.length > 0) {
        const notifications = actor.followers.map(followerId => ({
          user: followerId,
          sender: user,
          type,
          message: `${actor.name} ${message}`,
          metadata
        }));
        await Notification.insertMany(notifications);
      }
    }
  } catch (err) {
    console.error("Activity Log Error:", err);
  }
};
