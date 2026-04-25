// src/routes/uploadRoutes.js
import { Router } from "express";
import multer from "multer";
// import { authenticate } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { uploadDocuments, getDocuments, deleteDocument, getFileurl } from "../controllers/ingestController.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

const MAX_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 20) * 1024 * 1024;

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_DIR || "./uploads",
  filename: (req, file, cb) => {
    const safeBase = file.originalname.replace(/[^a-z0-9._-]/gi, "_");
    cb(null, `${Date.now()}-${safeBase}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are accepted."), false);
    }
    cb(null, true);
  },
});

router.post("/upload", uploadLimiter, authorize,upload.array("files", 10), uploadDocuments);
router.get("/documents", authorize,getDocuments);
router.delete("/documents/:documentId", authorize,deleteDocument);
router.get("/documents/fileurl",authorize,getFileurl)
// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: `File too large. Maximum: ${process.env.MAX_FILE_SIZE_MB || 20} MB.` });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

export default router;
