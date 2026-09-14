import asyncHandler from '../utils/asyncHandler.js';
import { getPaging } from '../utils/pagination.js';
import Coupon from '../models/couponModel.js';

const DEFAULT_PAGE_SIZE = 8;

// Limit fields are three-state: a positive number, or null for "unlimited".
// Blank from the admin form is an intentional null. A missing or malformed
// value must not quietly become unlimited, so it either falls back to a safe
// default or is rejected.
const parseOptionalLimit = (raw, { fallback, integer = true }) => {
  if (raw === undefined) return { ok: true, value: fallback };
  if (raw === null || String(raw).trim() === '') return { ok: true, value: null };

  const n = Number(raw);
  const valid = integer ? Number.isInteger(n) : Number.isFinite(n);

  if (!valid || n < 1) return { ok: false };

  return { ok: true, value: n };
};

const USES_ERROR =
  'Total uses must be a whole number of 1 or more, or blank for unlimited';

const PER_USER_ERROR =
  'Uses per customer must be a whole number of 1 or more, or blank for unlimited';

const MAX_DISCOUNT_ERROR =
  'Maximum discount must be above zero, or blank for no cap';

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
  const { page, pageSize, skip } = getPaging(req.query, DEFAULT_PAGE_SIZE);

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
    .skip(skip)
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

  // A missing or malformed limit falls back to a safe default rather than
  // becoming unlimited. Only an explicit blank means unlimited.
  const totalUses = parseOptionalLimit(usageLimit, { fallback: null });

  if (!totalUses.ok) {
    res.status(400);
    throw new Error(USES_ERROR);
  }

  const perCustomer = parseOptionalLimit(perUserLimit, { fallback: 1 });

  if (!perCustomer.ok) {
    res.status(400);
    throw new Error(PER_USER_ERROR);
  }

  const cap = parseOptionalLimit(maxDiscount, {
    fallback: null,
    integer: false,
  });

  if (!cap.ok) {
    res.status(400);
    throw new Error(MAX_DISCOUNT_ERROR);
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
    maxDiscount: cap.value,
    minOrderValue: Number(minOrderValue) || 0,
    startsAt: startsAt ? new Date(startsAt) : Date.now(),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    usageLimit: totalUses.value,
    perUserLimit: perCustomer.value,
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

  // Each limit keeps its current value unless a valid replacement arrives.
  // Garbage is rejected instead of silently lifting the limit.
  if (maxDiscount !== undefined) {
    const cap = parseOptionalLimit(maxDiscount, {
      fallback: coupon.maxDiscount,
      integer: false,
    });

    if (!cap.ok) {
      res.status(400);
      throw new Error(MAX_DISCOUNT_ERROR);
    }

    coupon.maxDiscount = cap.value;
  }

  if (minOrderValue !== undefined)
    coupon.minOrderValue = Number(minOrderValue) || 0;

  if (startsAt !== undefined)
    coupon.startsAt = startsAt ? new Date(startsAt) : Date.now();

  if (expiresAt !== undefined)
    coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;

  if (usageLimit !== undefined) {
    const totalUses = parseOptionalLimit(usageLimit, {
      fallback: coupon.usageLimit,
    });

    if (!totalUses.ok) {
      res.status(400);
      throw new Error(USES_ERROR);
    }

    coupon.usageLimit = totalUses.value;
  }

  if (perUserLimit !== undefined) {
    const perCustomer = parseOptionalLimit(perUserLimit, {
      fallback: coupon.perUserLimit,
    });

    if (!perCustomer.ok) {
      res.status(400);
      throw new Error(PER_USER_ERROR);
    }

    coupon.perUserLimit = perCustomer.value;
  }

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