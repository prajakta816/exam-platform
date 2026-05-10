import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const NEWS_API_KEY = process.env.NEWS_API_KEY;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const GEMINI_FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS || "gemini-2.5-flash-lite,gemini-1.5-flash"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
export const EMAIL_SERVICE = process.env.EMAIL_SERVICE;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
