import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderToDelivered,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, admin, getAllOrders);
router.get('/mine', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/deliver', protect, admin, updateOrderToDelivered);

export default router;