import express from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  updateOrderDetails,
  refundOrder,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, admin, getAllOrders);

router.get('/mine', protect, getMyOrders);

router.get('/:id', protect, getOrderById);

router.put('/:id/cancel', protect, cancelOrder);

router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/details', protect, admin, updateOrderDetails);
router.put('/:id/refund', protect, admin, refundOrder);

export default router;