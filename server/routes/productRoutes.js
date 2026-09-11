import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  bulkAction,
} from '../controllers/productController.js';
import {
  exportProducts,
  downloadTemplate,
  importProducts,
} from '../controllers/productImportExport.js';
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

// Static paths must come before /:id or they would be read as an id
router.get('/export', protect, admin, exportProducts);
router.get('/template', protect, admin, downloadTemplate);
router.post('/import', protect, admin, importProducts);
router.post('/bulk', protect, admin, bulkAction);

// Reviews live under the product they belong to
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', protect, createReview);
router.get('/:id/reviews/mine', protect, getMyReviewForProduct);

router.get('/:id', getProductById);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;