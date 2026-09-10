import express from 'express';
import {
  validateCoupon,
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Any signed-in customer can check a code
router.post('/validate', protect, validateCoupon);

router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);

router.get('/:id', protect, admin, getCouponById);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

export default router;