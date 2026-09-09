import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Review from '../models/reviewModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';

const DEFAULT_PAGE_SIZE = 8;

// Recalculate the denormalised rating fields after any review change
const syncProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$product',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = result[0];

  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        rating: stats ? Number(stats.avg.toFixed(2)) : 0,
        numReviews: stats ? stats.count : 0,
      },
    }
  );
};

// GET /api/products/:id/reviews?pageNumber=&pageSize=&sort=&rating=
export const getProductReviews = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;
  const page = Number(req.query.pageNumber) || 1;

  const productId = new mongoose.Types.ObjectId(req.params.id);
  const filter = { product: productId };

  const ratingFilter = Number(req.query.rating);
  if (
    Number.isInteger(ratingFilter) &&
    ratingFilter >= 1 &&
    ratingFilter <= 5
  ) {
    filter.rating = ratingFilter;
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'rating-desc': { rating: -1, createdAt: -1 },
    'rating-asc': { rating: 1, createdAt: -1 },
  };

  const sort = sortMap[req.query.sort] || sortMap.newest;

  const count = await Review.countDocuments(filter);

  const reviews = await Review.find(filter)
    .sort(sort)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  // Star breakdown across all reviews, not just this page.
  // Aggregate doesn't auto-cast strings to ObjectIds like find does.
  const breakdown = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  breakdown.forEach((b) => {
    distribution[b._id] = b.count;
  });

  const total = Object.values(distribution).reduce((s, n) => s + n, 0);

  res.json({
    reviews,
    page,
    pages: Math.ceil(count / pageSize),
    count,
    total,
    distribution,
  });
});

// POST /api/products/:id/reviews  — protected
export const createReview = asyncHandler(async (req, res) => {
  const { rating, title, body } = req.body;

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    res.status(400);
    throw new Error('Give a rating between 1 and 5');
  }

  if (!body?.trim()) {
    res.status(400);
    throw new Error('Write a few words about the product');
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = await Review.findOne({
    product: product._id,
    user: req.user._id,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  // Verified means they actually received it, not just ordered it
  const purchased = await Order.findOne({
    user: req.user._id,
    isDelivered: true,
    'orderItems.product': product._id,
  });

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    author: req.user.name,
    rating: numericRating,
    title: String(title || '').trim(),
    body: body.trim(),
    verifiedPurchase: Boolean(purchased),
  });

  await syncProductRating(product._id);

  res.status(201).json(review);
});

// GET /api/products/:id/reviews/mine  — protected
// Lets the product page know whether to show the write-a-review form
export const getMyReviewForProduct = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    product: req.params.id,
    user: req.user._id,
  });

  res.json(review || null);
});

// DELETE /api/reviews/:id  — owner or admin
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const isOwner =
    review.user && review.user.toString() === req.user._id.toString();

  if (!isOwner && !req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const productId = review.product;

  await review.deleteOne();
  await syncProductRating(productId);

  res.json({ message: 'Review removed' });
});