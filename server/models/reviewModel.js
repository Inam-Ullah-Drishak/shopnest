import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    // Null for seeded reviews; set when a logged-in customer writes one
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    author: { type: String, required: true, trim: true },
    city: { type: String, default: '', trim: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '', trim: true },
    body: { type: String, required: true, trim: true },

    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per product. Seeded reviews have user: null, and a
// sparse index ignores nulls so they don't collide with each other.
reviewSchema.index(
  { product: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);

const Review = mongoose.model('Review', reviewSchema);

export default Review;