import asyncHandler from '../utils/asyncHandler.js';
import Wishlist from '../models/wishlistModel.js';
import Product from '../models/productModel.js';

const DEFAULT_PAGE_SIZE = 8;

// GET /api/wishlist?pageNumber=&pageSize=  — protected
export const getWishlist = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;
  const page = Number(req.query.pageNumber) || 1;

  const filter = { user: req.user._id };

  const count = await Wishlist.countDocuments(filter);

  const rows = await Wishlist.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate('product');

  // A product may have been deleted since it was saved
  const products = rows
    .filter((row) => row.product)
    .map((row) => ({
      ...row.product.toObject(),
      savedAt: row.createdAt,
    }));

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});

// GET /api/wishlist/ids  — protected
// Just the ids, so the storefront can fill in hearts cheaply
export const getWishlistIds = asyncHandler(async (req, res) => {
  const rows = await Wishlist.find({ user: req.user._id }).select('product');

  res.json(rows.map((row) => row.product.toString()));
});

// POST /api/wishlist/:productId  — protected
export const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  try {
    await Wishlist.create({
      user: req.user._id,
      product: product._id,
    });
  } catch (error) {
    // Duplicate key means it was already saved, which isn't an error here
    if (error.code !== 11000) throw error;
  }

  res.status(201).json({ message: 'Saved', productId: product._id });
});

// DELETE /api/wishlist/:productId  — protected
export const removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.deleteOne({
    user: req.user._id,
    product: req.params.productId,
  });

  res.json({ message: 'Removed', productId: req.params.productId });
});

// DELETE /api/wishlist  — protected
export const clearWishlist = asyncHandler(async (req, res) => {
  await Wishlist.deleteMany({ user: req.user._id });
  res.json({ message: 'Wishlist cleared' });
});