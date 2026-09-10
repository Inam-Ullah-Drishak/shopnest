import asyncHandler from '../utils/asyncHandler.js';
import Coupon from '../models/couponModel.js';

const DEFAULT_PAGE_SIZE = 8;

// POST /api/coupons/validate  — protected
// Checks a code against a subtotal without consuming it
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;

  if (!code?.trim()) {
    res.status(400);
    throw new Error('Enter a code');
  }

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
  });

  if (!coupon) {
    res.status(404);
    throw new Error('That code does not exist');
  }

  const amount = Number(subtotal) || 0;
  const check = coupon.checkValidity(req.user._id, amount);

  if (!check.ok) {
    res.status(400);
    throw new Error(check.reason);
  }

  res.json({
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    discount: coupon.discountFor(amount),
  });
});

// GET /api/coupons  — admin
export const getCoupons = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;
  const page = Number(req.query.pageNumber) || 1;

  const filter = {};

  if (req.query.status === 'active') {
    filter.isActive = true;
  } else if (req.query.status === 'inactive') {
    filter.isActive = false;
  }

  const count = await Coupon.countDocuments(filter);

  const coupons = await Coupon.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .select('-usedBy');

  res.json({
    coupons,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});

// GET /api/coupons/:id  — admin
export const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id).populate(
    'usedBy.user',
    'name email'
  );

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  res.json(coupon);
});

// POST /api/coupons  — admin
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    type,
    value,
    maxDiscount,
    minOrderValue,
    startsAt,
    expiresAt,
    usageLimit,
    perUserLimit,
    isActive,
  } = req.body;

  if (!code?.trim()) {
    res.status(400);
    throw new Error('A code is required');
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    res.status(400);
    throw new Error('Enter a discount above zero');
  }

  if (type === 'percent' && numericValue > 100) {
    res.status(400);
    throw new Error('A percentage cannot be above 100');
  }

  const exists = await Coupon.findOne({ code: code.trim().toUpperCase() });

  if (exists) {
    res.status(400);
    throw new Error('That code already exists');
  }

  const coupon = await Coupon.create({
    code: code.trim().toUpperCase(),
    description: description?.trim() || '',
    type: type === 'fixed' ? 'fixed' : 'percent',
    value: numericValue,
    maxDiscount: Number(maxDiscount) > 0 ? Number(maxDiscount) : null,
    minOrderValue: Number(minOrderValue) || 0,
    startsAt: startsAt ? new Date(startsAt) : Date.now(),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    usageLimit: Number(usageLimit) > 0 ? Number(usageLimit) : null,
    perUserLimit: Number(perUserLimit) > 0 ? Number(perUserLimit) : null,
    isActive: isActive !== false,
  });

  res.status(201).json(coupon);
});

// PUT /api/coupons/:id  — admin
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  const {
    code,
    description,
    type,
    value,
    maxDiscount,
    minOrderValue,
    startsAt,
    expiresAt,
    usageLimit,
    perUserLimit,
    isActive,
  } = req.body;

  if (code?.trim() && code.trim().toUpperCase() !== coupon.code) {
    const exists = await Coupon.findOne({
      _id: { $ne: coupon._id },
      code: code.trim().toUpperCase(),
    });

    if (exists) {
      res.status(400);
      throw new Error('That code already exists');
    }

    coupon.code = code.trim().toUpperCase();
  }

  if (description !== undefined) coupon.description = description.trim();
  if (type !== undefined) coupon.type = type === 'fixed' ? 'fixed' : 'percent';

  if (value !== undefined) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      res.status(400);
      throw new Error('Enter a discount above zero');
    }

    if (coupon.type === 'percent' && numericValue > 100) {
      res.status(400);
      throw new Error('A percentage cannot be above 100');
    }

    coupon.value = numericValue;
  }

  if (maxDiscount !== undefined)
    coupon.maxDiscount = Number(maxDiscount) > 0 ? Number(maxDiscount) : null;

  if (minOrderValue !== undefined)
    coupon.minOrderValue = Number(minOrderValue) || 0;

  if (startsAt !== undefined)
    coupon.startsAt = startsAt ? new Date(startsAt) : Date.now();

  if (expiresAt !== undefined)
    coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;

  if (usageLimit !== undefined)
    coupon.usageLimit = Number(usageLimit) > 0 ? Number(usageLimit) : null;

  if (perUserLimit !== undefined)
    coupon.perUserLimit = Number(perUserLimit) > 0 ? Number(perUserLimit) : null;

  if (isActive !== undefined) coupon.isActive = Boolean(isActive);

  const updated = await coupon.save();
  res.json(updated);
});

// DELETE /api/coupons/:id  — admin
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  await coupon.deleteOne();
  res.json({ message: 'Coupon removed' });
});