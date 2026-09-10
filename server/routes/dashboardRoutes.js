import express from 'express';
import {
  getSummary,
  getRevenueSeries,
  getTopProducts,
  getRevenueByCategory,
  getLowStock,
  getRecentOrders,
} from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Everything here is admin only
router.use(protect, admin);

router.get('/summary', getSummary);
router.get('/revenue', getRevenueSeries);
router.get('/top-products', getTopProducts);
router.get('/by-category', getRevenueByCategory);
router.get('/low-stock', getLowStock);
router.get('/recent-orders', getRecentOrders);

export default router;