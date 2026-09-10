import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: { type: String, default: '' },

    type: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true,
      default: 'percent',
    },

    // Percent: 1–100. Fixed: an amount in rupees.
    value: { type: Number, required: true, min: 0 },

    // Caps the discount on a percent coupon, e.g. "20% off, up to Rs 2000"
    maxDiscount: { type: Number, default: null },

    minOrderValue: { type: Number, default: 0, min: 0 },

    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },

    // null means unlimited
    usageLimit: { type: Number, default: null },
    perUserLimit: { type: Number, default: 1 },

    usedCount: { type: Number, default: 0 },

    // Who has used it, and how often
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 1 },
        _id: false,
      },
    ],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.timesUsedBy = function (userId) {
  const entry = this.usedBy.find(
    (u) => u.user.toString() === userId.toString()
  );

  return entry?.count || 0;
};

// Returns { ok, reason } rather than throwing, so callers can decide
couponSchema.methods.checkValidity = function (userId, subtotal) {
  const now = new Date();

  if (!this.isActive)
    return { ok: false, reason: 'This code is no longer active' };

  if (this.startsAt && now < this.startsAt)
    return { ok: false, reason: 'This code is not active yet' };

  if (this.expiresAt && now > this.expiresAt)
    return { ok: false, reason: 'This code has expired' };

  if (this.usageLimit !== null && this.usedCount >= this.usageLimit)
    return { ok: false, reason: 'This code has been fully redeemed' };

  if (
    this.perUserLimit !== null &&
    this.timesUsedBy(userId) >= this.perUserLimit
  )
    return { ok: false, reason: 'You have already used this code' };

  if (subtotal < this.minOrderValue)
    return {
      ok: false,
      reason: `Spend at least Rs ${this.minOrderValue.toLocaleString()} to use this code`,
    };

  return { ok: true };
};

couponSchema.methods.discountFor = function (subtotal) {
  let discount =
    this.type === 'percent' ? (subtotal * this.value) / 100 : this.value;

  if (this.maxDiscount !== null && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }

  // Never discount below zero
  return Math.min(Math.round(discount), subtotal);
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;