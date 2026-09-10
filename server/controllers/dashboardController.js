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

const rangeFilter = (from, to) => {
  const filter = {};

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
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
      Order.countDocuments({ isDelivered: false, ...range }),
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

// GET /api/dashboard/revenue?days=30  — admin
// Revenue per day, with empty days filled in
export const getRevenueSeries = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 365);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const rows = await Order.aggregate([
    { $match: { ...PAID, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = new Map(rows.map((r) => [r._id, r]));
  const series = [];

  // Fill gaps, otherwise a chart would join across missing days
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const key = date.toISOString().slice(0, 10);
    const row = map.get(key);

    series.push({
      date: key,
      revenue: row?.revenue || 0,
      orders: row?.orders || 0,
    });
  }

  res.json(series);
});

// GET /api/dashboard/top-products?limit=8  — admin
export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 50);

  const rows = await Order.aggregate([
    { $match: PAID },
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
  const rows = await Order.aggregate([
    { $match: PAID },
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