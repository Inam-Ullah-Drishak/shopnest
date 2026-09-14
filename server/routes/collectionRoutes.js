import express from 'express';
import {
  getCollections,
  getCollectionBySlug,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../controllers/collectionController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getCollections);
router.post('/', protect, admin, createCollection);

router.get('/id/:id', protect, admin, getCollectionById);

// optionalAuth so the handler's admin check is actually reachable: without it
// req.user was always undefined and an unpublished collection 404'd for
// everyone, admins included
router.get('/:slug', optionalAuth, getCollectionBySlug);
router.put('/:id', protect, admin, updateCollection);
router.delete('/:id', protect, admin, deleteCollection);

export default router;