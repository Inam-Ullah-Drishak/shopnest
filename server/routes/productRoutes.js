import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
} from '../controllers/productController.js';
import {
  getProductReviews,
  createReview,
  getMyReviewForProduct,
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/', protect, admin, createProduct);

router.get('/categories', getProductCategories);

// Reviews live under the product they belong to
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', protect, createReview);
router.get('/:id/reviews/mine', protect, getMyReviewForProduct);

router.get('/:id', getProductById);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;