import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/securityMiddleware.js';

const router = express.Router();

// 20 attempts per 15 minutes. These are the endpoints worth brute forcing.
router.post('/', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Saved addresses, all scoped to the signed-in user
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);

router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);
router.put('/addresses/:addressId/default', protect, setDefaultAddress);

export default router;