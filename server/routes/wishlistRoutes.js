import express from 'express';
import {
  getWishlist,
  getWishlistIds,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Everything here needs a signed-in user
router.use(protect);

router.get('/', getWishlist);
router.delete('/', clearWishlist);

router.get('/ids', getWishlistIds);

router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;