import asyncHandler from '../utils/asyncHandler.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Review from '../models/reviewModel.js';

// Only paid orders count as real revenue
const PAID = { isPaid: true };

// A simple product is low on its own count; a variant product is low if any
// single variant is low, even when the total across variants looks healthy
const LOW_STOCK = {
  status: 'active',
  $or: [
    { variants: { $size: 0 }, countInStock: { $lt: 5 } },
    { 'variants.countInStock': { $lt: 5 } },
  ],
};

// Which calendar a day belongs to. Mongo's $dateToString defaults to UTC, so
// on a UTC+5 server an order placed at 1am local lands in the previous day's
// bucket and the chart is a day out. Set REPORT_TIMEZONE to override.
const REPORT_TIMEZONE =
  process.env.REPORT_TIMEZONE ||
  Intl.DateTimeFormat().resolvedOptions().timeZone ||
  'UTC';

// YYYY-MM-DD for an instant, in the reporting timezone
const dayKey = (date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

// A date-only filter like to=2026-03-01 means the whole of that day, not the
// midnight at the start of it. Built from the parts rather than setHours on a
// parsed string, which lands on the wrong day west of Greenwich.
const endOfDay = (value) => {
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);

  if (!y || !m || !d) return new Date(value);

  return new Date(y, m - 1, d, 23, 59, 59, 999);
};

// A YYYY-MM-DD key as the UTC midnight of that calendar date. Used only for
// stepping between days, never for display, so UTC is the right frame here.
const keyToUtc = (key) => {
  const [y, m, d] = String(key).slice(0, 10).split('-').map(Number);

  return Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)
    ? Date.UTC(y, m - 1, d)
    : null;
};
const rangeFilter = (from, to) => {
  const filter = {};

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = endOfDay(to);
  }

  return filter;
};

// GET /api/dashboard/summary?from=&to=  — admin
export const getSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const range = rangeFilter(from, to);

  const [revenue, orderCount, pending, customers, products, lowStock, reviews] =
    await Promise.all([
      Order.aggregate([
        { $match: { ...PAID, ...range } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' },
            items: { $sum: { $sum: '$orderItems.qty' } },
            count: { $sum: 1 },
          },
        },
      ]),
      Order.countDocuments(range),
      // "Awaiting delivery" means still moving. isDelivered: false alone also
      // counted every cancelled order.
      Order.countDocuments({
        status: { $nin: ['delivered', 'cancelled'] },
        ...range,
      }),
      User.countDocuments({ isAdmin: false }),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments(LOW_STOCK),
      Review.countDocuments(),
    ]);

  const stats = revenue[0] || { total: 0, items: 0, count: 0 };

  res.json({
    revenue: stats.total,
    itemsSold: stats.items,
    paidOrders: stats.count,
    averageOrderValue: stats.count ? Math.round(stats.total / stats.count) : 0,
    totalOrders: orderCount,
    pendingOrders: pending,
    customers,
    products,
    lowStock,
    reviews,
  });
});

// GET /api/dashboard/revenue?days=30 | ?from=&to=  — admin
// Revenue per day, with empty days filled in
export const getRevenueSeries = asyncHandler(async (req, res) => {
  const DAY = 24 * 60 * 60 * 1000;

  // The window ends on `to` when one is given, otherwise today. Stepping over
  // UTC midnights of a plain calendar date keeps this immune to DST, which
  // adding 24h at a time is not.
  const endUtc = keyToUtc(req.query.to) ?? keyToUtc(dayKey(new Date()));
  const startUtc = keyToUtc(req.query.from);

  // An explicit range sets the length; otherwise fall back to ?days
  const requested =
    startUtc !== null && startUtc <= endUtc
      ? Math.round((endUtc - startUtc) / DAY) + 1
      : Number(req.query.days) || 30;

  const days = Math.min(Math.max(requested, 1), 365);

  const keys = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(new Date(endUtc - i * DAY).toISOString().slice(0, 10));
  }

  // Reach a day past each edge: the start of a local day can sit up to 14
  // hours either side of its UTC midnight. Anything extra that comes back
  // simply isn't in `keys` and gets dropped.
  const start = new Date(endUtc - (days - 1) * DAY - DAY);
  const end = new Date(endUtc + 2 * DAY);

  const rows = await Order.aggregate([
    { $match: { ...PAID, createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: REPORT_TIMEZONE,
          },
        },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = new Map(rows.map((r) => [r._id, r]));

  // Fill gaps, otherwise a chart would join across missing days
  const series = keys.map((key) => ({
    date: key,
    revenue: map.get(key)?.revenue || 0,
    orders: map.get(key)?.orders || 0,
  }));

  res.json(series);
});

// GET /api/dashboard/top-products?limit=8  — admin
export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 50);
  const range = rangeFilter(req.query.from, req.query.to);

  const rows = await Order.aggregate([
    { $match: { ...PAID, ...range } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        image: { $first: '$orderItems.image' },
        qty: { $sum: '$orderItems.qty' },
        revenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);

  res.json(rows);
});

// GET /api/dashboard/by-category  — admin
export const getRevenueByCategory = asyncHandler(async (req, res) => {
  const range = rangeFilter(req.query.from, req.query.to);

  const rows = await Order.aggregate([
    { $match: { ...PAID, ...range } },
    { $unwind: '$orderItems' },
    {
      $lookup: {
        from: 'products',
        localField: 'orderItems.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.categoryName',
        revenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] },
        },
        qty: { $sum: '$orderItems.qty' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  res.json(rows.map((r) => ({ category: r._id || 'Uncategorised', ...r })));
});

// GET /api/dashboard/low-stock?limit=10  — admin
export const getLowStock = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const products = await Product.find(LOW_STOCK)
    .sort({ countInStock: 1 })
    .limit(limit)
    .select('name images countInStock price categoryName variants');

  res.json(
    products.map((p) => {
      const low = p.variants.filter((v) => v.countInStock < 5);

      return {
        _id: p._id,
        name: p.name,
        images: p.images,
        price: p.price,
        categoryName: p.categoryName,
        countInStock: p.countInStock,
        lowVariants: low.map((v) => ({
          label: v.options.map((o) => o.value).join(' / '),
          countInStock: v.countInStock,
        })),
      };
    })
  );
});

// GET /api/dashboard/recent-orders?limit=5  — admin
export const getRecentOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 20);

  const orders = await Order.find({})
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json(orders);
});