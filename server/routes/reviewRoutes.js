import express from 'express';
import { deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.delete('/:id', protect, deleteReview);

export default router;