import path from 'path';
import fs from 'fs';
import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const uploadDir = 'uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, `${uploadDir}/`);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();

    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const allowedTypes = /jpe?g|png|webp/;

function fileFilter(req, file, cb) {
  const extOk = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeOk = allowedTypes.test(file.mimetype);

  if (extOk && mimeOk) {
    return cb(null, true);
  }

  cb(new Error('Only JPG, PNG and WEBP images are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.post('/', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  res.status(201).json({
    message: 'Image uploaded',
    image: `/${req.file.path.replace(/\\/g, '/')}`,
  });
});

export default router;