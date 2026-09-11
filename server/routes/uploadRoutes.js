import path from 'path';
import express from 'express';
import multer from 'multer';
import { uploadBuffer, FOLDERS } from '../config/cloudinary.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Hold the file in memory rather than on disk. Render's filesystem is
// wiped on restart, and the buffer goes straight to Cloudinary anyway.
const storage = multer.memoryStorage();

const allowedTypes = /jpe?g|png|webp/;

function fileFilter(req, file, cb) {
  const extOk = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeOk = allowedTypes.test(file.mimetype);

  if (extOk && mimeOk) return cb(null, true);

  cb(new Error('Only JPG, PNG and WEBP images are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
});

// Turns "Ruby Mala Set.JPG" into "ruby-mala-set", used as the public_id
// so the Cloudinary dashboard stays readable
const slugFromName = (filename) =>
  path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';

// POST /api/upload?folder=products  — admin
router.post(
  '/',
  protect,
  admin,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
      }

      const folder = FOLDERS[req.query.folder] || FOLDERS.products;

      const result = await uploadBuffer(
        req.file.buffer,
        folder,
        slugFromName(req.file.originalname)
      );

      res.status(201).json({
        message: 'Image uploaded',
        image: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/upload/multiple?folder=products  — admin
router.post(
  '/multiple',
  protect,
  admin,
  upload.array('images', 8),
  async (req, res, next) => {
    try {
      if (!req.files?.length) {
        res.status(400);
        throw new Error('No files uploaded');
      }

      const folder = FOLDERS[req.query.folder] || FOLDERS.products;

      // Upload in parallel rather than one at a time
      const results = await Promise.all(
        req.files.map((file) =>
          uploadBuffer(file.buffer, folder, slugFromName(file.originalname))
        )
      );

      res.status(201).json({
        message: `${results.length} image${
          results.length === 1 ? '' : 's'
        } uploaded`,
        images: results.map((r) => ({
          image: r.secure_url,
          publicId: r.public_id,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;