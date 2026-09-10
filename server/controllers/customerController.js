import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/userModel.js';
import Order from '../models/orderModel.js';
import Review from '../models/reviewModel.js';

const DEFAULT_PAGE_SIZE = 8;

// GET /api/customers?keyword=&role=&sort=&pageNumber=  — admin
export const getCustomers = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;
  const page = Number(req.query.pageNumber) || 1;

  const match = {};

  if (req.query.role === 'admin') match.isAdmin = true;
  else if (req.query.role === 'customer') match.isAdmin = false;
  else if (req.query.role === 'blocked') match.isBlocked = true;

  if (req.query.keyword) {
    const rx = { $regex: req.query.keyword, $options: 'i' };
    match.$or = [{ name: rx }, { email: rx }];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'name-asc': { name: 1 },
    'spend-desc': { totalSpent: -1 },
    'orders-desc': { orderCount: -1 },
  };

  const sort = sortMap[req.query.sort] || sortMap.newest;

  const count = await User.countDocuments(match);

  // Join each user to their orders so we can rank by lifetime value.
  // This has to happen in the pipeline: sorting by spend can't be done in
  // JavaScript after fetching, because sorting must precede pagination.
  const customers = await User.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'user',
        as: 'orders',
      },
    },
    {
      $addFields: {
        orderCount: { $size: '$orders' },
        // Only paid orders count toward what someone is worth
        totalSpent: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$orders',
                  as: 'o',
                  cond: { $eq: ['$$o.isPaid', true] },
                },
              },
              as: 'o',
              in: '$$o.totalPrice',
            },
          },
        },
        lastOrderAt: { $max: '$orders.createdAt' },
      },
    },
    { $project: { password: 0, orders: 0 } },
    { $sort: sort },
    { $skip: pageSize * (page - 1) },
    { $limit: pageSize },
  ]);

  res.json({
    customers,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});

// GET /api/customers/:id  — admin
export const getCustomerById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const userId = new mongoose.Types.ObjectId(req.params.id);

  const [totals, byStatus, recentOrders, reviewCount] = await Promise.all([
    Order.aggregate([
      { $match: { user: userId, isPaid: true } },
      {
        $group: {
          _id: null,
          spent: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
          items: { $sum: { $sum: '$orderItems.qty' } },
        },
      },
    ]),
    Order.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    Review.countDocuments({ user: userId }),
  ]);

  const stats = totals[0] || { spent: 0, orders: 0, items: 0 };

  const statusCounts = {};
  byStatus.forEach((s) => {
    statusCounts[s._id] = s.count;
  });

  res.json({
    user,
    stats: {
      totalSpent: stats.spent,
      paidOrders: stats.orders,
      itemsBought: stats.items,
      averageOrder: stats.orders ? Math.round(stats.spent / stats.orders) : 0,
      totalOrders: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      reviews: reviewCount,
    },
    statusCounts,
    recentOrders,
  });
});

// PUT /api/customers/:id/role  — admin
export const toggleAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('Customer not found');
  }

  // Don't let an admin remove their own access and lock themselves out
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change your own role');
  }

  user.isAdmin = Boolean(req.body.isAdmin);

  const updated = await user.save();

  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    isAdmin: updated.isAdmin,
    isBlocked: updated.isBlocked,
  });
});

// PUT /api/customers/:id/block  — admin
export const toggleBlocked = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('Customer not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot block yourself');
  }

  if (user.isAdmin) {
    res.status(400);
    throw new Error('Remove admin access before blocking this account');
  }

  user.isBlocked = Boolean(req.body.isBlocked);

  const updated = await user.save();

  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    isAdmin: updated.isAdmin,
    isBlocked: updated.isBlocked,
  });
});