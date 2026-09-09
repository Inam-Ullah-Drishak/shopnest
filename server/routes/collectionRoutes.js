import express from 'express';
import {
  getCollections,
  getCollectionBySlug,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../controllers/collectionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getCollections);
router.post('/', protect, admin, createCollection);

router.get('/id/:id', protect, admin, getCollectionById);

router.get('/:slug', getCollectionBySlug);
router.put('/:id', protect, admin, updateCollection);
router.delete('/:id', protect, admin, deleteCollection);

export default router;