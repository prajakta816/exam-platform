 import Note from "../models/Note.js";
import TryCatch from "../utils/TryCatch.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import fs from "fs";

// 🚀 Get all notes (Filtered by privacy/following) with pagination
export const getNotes = TryCatch(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.json({ notes: [], total: 0, page: 1, totalPages: 0 });

  // Pagination params
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip  = (page - 1) * limit;

  // Find all public users to include their content
  const publicUsers = await User.find({ isPublic: true }).select("_id");
  const publicUserIds = publicUsers.map(u => u._id);

  const filter = {
    $or: [
      { uploadedBy: req.user.id },
      { uploadedBy: { $in: user.following } },
      { uploadedBy: { $in: publicUserIds } }
    ]
  };

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .populate("uploadedBy", "name email profilePic isPublic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Note.countDocuments(filter)
  ]);

  res.json({
    notes,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});


// 🚀 Upload Note
export const uploadNote = TryCatch(async (req, res) => {
  const { title, description, isPaid, price } = req.body;
  if (!req.file) throw new Error("File required");

  const note = await Note.create({
    title,
    description,
    fileUrl: req.file.path,
    uploadedBy: req.user.id,
    isPaid: isPaid === "true",
    price: isPaid === "true" ? price : 0,
  });

  res.status(201).json({ message: "Note uploaded", note });
});

// 🚀 Update Note
export const updateNote = TryCatch(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new Error("Note not found");

  if (note.uploadedBy.toString() !== req.user.id) {
    throw new Error("Unauthorized");
  }

  const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: "Note updated", note: updatedNote });
});

// 🚀 Delete Note
export const deleteNote = TryCatch(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new Error("Note not found");

  if (note.uploadedBy.toString() !== req.user.id) {
    throw new Error("Unauthorized");
  }

  // Delete file from storage
  if (fs.existsSync(note.fileUrl)) {
    fs.unlinkSync(note.fileUrl);
  }

  await Note.findByIdAndDelete(req.params.id);
  res.json({ message: "Note deleted" });
});

// 🚀 Get Note By ID (With privacy check)
export const getNoteById = TryCatch(async (req, res) => {
  const note = await Note.findById(req.params.id).populate("uploadedBy", "name email isPublic followers");
  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }

  const requesterId = req.user.id;
  const uploader = note.uploadedBy;
  const isOwner = uploader._id.toString() === requesterId;
  const isFollowing = uploader.followers.includes(requesterId);

  if (!uploader.isPublic && !isFollowing && !isOwner) {
    return res.status(403).json({ 
      message: "This note is private. Follow the creator to view it.",
      isPrivate: true
    });
  }

  res.json(note);
});

// 🚀 Track Download
export const trackDownload = TryCatch(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new Error("Note not found");

  // Increment downloads
  note.downloads += 1;
  
  // Track user if not already tracked
  if (!note.accessedBy.includes(req.user.id)) {
    note.accessedBy.push(req.user.id);
  }

  await note.save();

  // Notify uploader
  if (note.uploadedBy.toString() !== req.user.id) {
    await Notification.create({
      user: note.uploadedBy,
      sender: req.user.id,
      type: "note_download",
      message: `${req.user.name} downloaded your note: "${note.title}"`
    });
  }

  res.json({ message: "Download tracked", downloads: note.downloads });
});
