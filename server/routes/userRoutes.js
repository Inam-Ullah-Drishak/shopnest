import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
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

export default router;