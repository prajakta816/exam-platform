import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Star } from "lucide-react";

const RatingSystem = ({ targetId, targetType }) => {
  const [rating, setRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [count, setCount] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAverageRating();
  }, [targetId]);

  const fetchAverageRating = async () => {
    try {
      const res = await API.get(`/rating/${targetId}`);
      setAvgRating(res.data.averageRating);
      setCount(res.data.count);
    } catch (err) {
      console.error("Failed to fetch rating", err);
    }
  };

  const handleRate = async (value) => {
    setLoading(true);
    try {
      await API.post("/rating", {
        targetId,
        targetType,
        rating: value,
      });
      setRating(value);
      fetchAverageRating(); // Refresh average
    } catch (err) {
      console.error("Failed to rate", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 mt-6">
      <div className="flex flex-col items-center gap-1">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Rate this content</h4>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={loading}
              className="transition-all transform hover:scale-125 active:scale-95"
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              <Star
                size={32}
                className={`${
                  (hover || rating) >= star 
                    ? "fill-amber-400 text-amber-400" 
                    : "text-slate-300"
                } transition-colors`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 px-6 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <Star size={16} className="fill-amber-400 text-amber-400" />
          <span className="font-black text-slate-800 text-lg">{avgRating}</span>
        </div>
        <div className="w-px h-4 bg-slate-100"></div>
        <span className="text-xs font-bold text-slate-400">{count} {count === 1 ? 'rating' : 'ratings'}</span>
      </div>
    </div>
  );
};

export default RatingSystem;
