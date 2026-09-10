import express from 'express';
import {
  getCustomers,
  getCustomerById,
  toggleAdmin,
  toggleBlocked,
} from '../controllers/customerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Everything here is admin only
router.use(protect, admin);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id/role', toggleAdmin);
router.put('/:id/block', toggleBlocked);

export default router;