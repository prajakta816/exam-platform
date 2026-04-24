import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { 
  getNotes, 
  uploadNote, 
  updateNote, 
  deleteNote,
  getNoteById,
  trackDownload
} from "../controllers/noteController.js";

const router = express.Router();

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/notes/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get("/", protect, getNotes);
router.get("/:id", protect, getNoteById);
router.post("/upload", protect, upload.single("file"), uploadNote);
router.put("/:id", protect, updateNote);
router.delete("/:id", protect, deleteNote);
router.post("/download/:id", protect, trackDownload);

export default router;
