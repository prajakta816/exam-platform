import mongoose from "mongoose";
import Rating from "../models/Rating.js";
import TryCatch from "../utils/TryCatch.js";

// 🚀 Post Rating
export const postRating = TryCatch(async (req, res) => {
  const { targetId, targetType, rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Update or Create
  const existingRating = await Rating.findOneAndUpdate(
    { user: req.user.id, targetId },
    { rating },
    { new: true, upsert: true }
  );

  res.status(201).json({ message: "Rating saved", rating: existingRating });
});

// 🚀 Get Average Rating
export const getAverageRating = TryCatch(async (req, res) => {
  const { targetId } = req.params;

  const result = await Rating.aggregate([
    { $match: { targetId: new mongoose.Types.ObjectId(targetId) } },
    {
      $group: {
        _id: "$targetId",
        averageRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return res.json({ averageRating: 0, count: 0 });
  }

  res.json({
    averageRating: result[0].averageRating.toFixed(1),
    count: result[0].count,
  });
});
