import asyncHandler from '../utils/asyncHandler.js';
import { getPaging } from '../utils/pagination.js';
import Order, { NEXT_STATUSES } from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Coupon from '../models/couponModel.js';
import { csvCell as cell } from '../utils/csv.js';
import { SHIPPING_PRICE, FREE_SHIPPING_OVER } from '../config/store.js';

const DEFAULT_PAGE_SIZE = 8;

// Puts stock back. Used when an order is cancelled, and to unwind a partial
// reservation. For a variant line the product-level countInStock mirrors the
// sum across variants, so both move together.
const releaseStock = async (items) => {
  for (const item of items) {
    if (item.variantId) {
      // Positional operator: touch the matched variant only
      await Product.updateOne(
        { _id: item.product, 'variants._id': item.variantId },
        { $inc: { 'variants.$.countInStock': item.qty } }
      );
    }

    await Product.updateOne(
      { _id: item.product },
      { $inc: { countInStock: item.qty, unitsSold: -item.qty } }
    );
  }
};

// Hands a coupon redemption back when an order is cancelled. Without this a
// customer who cancels has still burned their one allowed use, and a limited
// code quietly loses inventory to orders that never happened.
//
// Matched on the code string rather than an id, because the order stores the
// code as text on purpose. A coupon deleted since then simply matches nothing.
const releaseCoupon = async (order) => {
  if (!order.couponCode) return;

  await Coupon.updateOne(
    {
      code: order.couponCode,
      usedCount: { $gt: 0 },
      usedBy: { $elemMatch: { user: order.user, count: { $gt: 0 } } },
    },
    { $inc: { usedCount: -1, 'usedBy.$.count': -1 } }
  );

  // Drop the row once it reaches zero, so timesUsedBy stays honest
  await Coupon.updateOne(
    { code: order.couponCode },
    { $pull: { usedBy: { count: { $lte: 0 } } } }
  );
};
// Takes stock at the moment the order is placed. The quantity check is part
// of the update filter, so the read and the write are a single atomic
// operation -- two customers racing for the last unit cannot both win. A
// separate check-then-write would let both through.
//
// There is no transaction here because that needs a replica set, so a failure
// partway through unwinds the lines already taken by hand.
const reserveStock = async (items) => {
  const taken = [];

  for (const item of items) {
    const filter = item.variantId
      ? {
          _id: item.product,
          variants: {
            $elemMatch: {
              _id: item.variantId,
              countInStock: { $gte: item.qty },
            },
          },
        }
      : { _id: item.product, countInStock: { $gte: item.qty } };

    const update = item.variantId
      ? {
          $inc: {
            'variants.$.countInStock': -item.qty,
            countInStock: -item.qty,
            unitsSold: item.qty,
          },
        }
      : { $inc: { countInStock: -item.qty, unitsSold: item.qty } };

    const result = await Product.updateOne(filter, update);

    if (result.modifiedCount === 0) {
      await releaseStock(taken);
      return { ok: false, item };
    }

    taken.push(item);
  }

  return { ok: true };
};

const pushHistory = (order, status, note, userId) => {
  order.statusHistory.push({
    status,
    note: note || '',
    changedBy: userId || null,
    at: new Date(),
  });
};

// A date-only filter like to=2026-03-01 means the whole of that day. Built
// from the parts rather than setHours on a parsed string, which lands on the
// wrong day west of Greenwich.
const endOfDay = (value) => {
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);

  if (!y || !m || !d) return new Date(value);

  return new Date(y, m - 1, d, 23, 59, 59, 999);
};
// Shared by the list and the CSV export
const buildOrderFilter = (query) => {
  const filter = {};

  if (query.status && query.status !== 'all') {
    if (query.status === 'open') {
      filter.status = { $nin: ['delivered', 'cancelled'] };
    } else if (query.status === 'unpaid') {
      filter.isPaid = false;
    } else {
      filter.status = query.status;
    }
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = endOfDay(query.to);
  }

  return filter;
};

// POST /api/orders  — protected
export const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const ids = orderItems.map((item) => item._id);
  const dbProducts = await Product.find({ _id: { $in: ids } });

  const finalItems = [];

  for (const item of orderItems) {
    const dbProduct = dbProducts.find((p) => p._id.toString() === item._id);

    if (!dbProduct) {
      res.status(404);
      throw new Error('One of the products is no longer available');
    }

    if (dbProduct.status === 'draft') {
      res.status(400);
      throw new Error(`${dbProduct.name} is no longer available`);
    }

    const qty = Number(item.qty);

    if (!Number.isInteger(qty) || qty < 1) {
      res.status(400);
      throw new Error(`Invalid quantity for ${dbProduct.name}`);
    }

    const hasVariants = dbProduct.variants.length > 0;

    if (hasVariants) {
      if (!item.variantId) {
        res.status(400);
        throw new Error(`Choose an option for ${dbProduct.name}`);
      }

      const variant = dbProduct.variants.id(item.variantId);

      if (!variant) {
        res.status(400);
        throw new Error(
          `That option is no longer available for ${dbProduct.name}`
        );
      }

      if (variant.countInStock < qty) {
        res.status(400);
        throw new Error(
          `Only ${variant.countInStock} left of ${
            dbProduct.name
          } (${variant.options.map((o) => o.value).join(' / ')})`
        );
      }

      finalItems.push({
        name: dbProduct.name,
        qty,
        image: variant.image || dbProduct.image,
        price: variant.price,
        product: dbProduct._id,
        variantId: variant._id,
        variantLabel: variant.options.map((o) => o.value).join(' / '),
        sku: variant.sku,
      });
    } else {
      if (dbProduct.countInStock < qty) {
        res.status(400);
        throw new Error(
          `Only ${dbProduct.countInStock} left of ${dbProduct.name}`
        );
      }

      finalItems.push({
        name: dbProduct.name,
        qty,
        image: dbProduct.image,
        price: dbProduct.price,
        product: dbProduct._id,
        variantId: null,
        variantLabel: '',
        sku: '',
      });
    }
  }

  const itemsPrice = finalItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  // The client sends only a code. The discount itself is recalculated here
  // from the database, never trusted from the request.
  let discountAmount = 0;
  let appliedCode = '';
  let coupon = null;

  if (couponCode?.trim()) {
    coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });

    if (!coupon) {
      res.status(400);
      throw new Error('That code does not exist');
    }

    const check = coupon.checkValidity(req.user._id, itemsPrice);

    if (!check.ok) {
      res.status(400);
      throw new Error(check.reason);
    }

    discountAmount = coupon.discountFor(itemsPrice);
    appliedCode = coupon.code;
  }

  const discountedSubtotal = itemsPrice - discountAmount;

  const shippingPrice =
    discountedSubtotal > FREE_SHIPPING_OVER ? 0 : SHIPPING_PRICE;

  const totalPrice = discountedSubtotal + shippingPrice;

  // Take the stock before the order exists. The checks further up ran against
  // a snapshot that another customer may already have invalidated; this is the
  // one that actually decides who gets the last unit.
  const reservation = await reserveStock(finalItems);

  if (!reservation.ok) {
    const { item } = reservation;

    res.status(409);
    throw new Error(
      `${item.name}${
        item.variantLabel ? ` (${item.variantLabel})` : ''
      } just sold out. Please adjust your cart and try again.`
    );
  }

  let order;

  try {
    order = await Order.create({
      user: req.user._id,
      orderItems: finalItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      itemsPrice,
      couponCode: appliedCode,
      discountAmount,
      shippingPrice,
      totalPrice,
      status: 'pending',
      stockAdjusted: true,
      statusHistory: [
        { status: 'pending', note: 'Order placed', at: new Date() },
      ],
    });
  } catch (error) {
    // Don't strand the stock if the order itself fails to save
    await releaseStock(finalItems);
    throw error;
  }

  // Record the redemption only after the order exists, so a failed order
  // doesn't burn someone's one allowed use
  if (coupon) {
    const existing = coupon.usedBy.find(
      (u) => u.user && u.user.toString() === req.user._id.toString()
    );

    if (existing) {
      await Coupon.updateOne(
        { _id: coupon._id, 'usedBy.user': req.user._id },
        { $inc: { usedCount: 1, 'usedBy.$.count': 1 } }
      );
    } else {
      await Coupon.updateOne(
        { _id: coupon._id },
        {
          $inc: { usedCount: 1 },
          $push: { usedBy: { user: req.user._id, count: 1 } },
        }
      );
    }
  }

  res.status(201).json(order);
});

// GET /api/orders/mine  — protected
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page, pageSize, skip } = getPaging(req.query, DEFAULT_PAGE_SIZE);

  const filter = { user: req.user._id };

  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }

  const count = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(skip);

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});

// GET /api/orders  — admin
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page, pageSize, skip } = getPaging(req.query, DEFAULT_PAGE_SIZE);

  const filter = buildOrderFilter(req.query);

  const count = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(skip);

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});

// GET /api/orders/export  — admin
export const exportOrders = asyncHandler(async (req, res) => {
  const filter = buildOrderFilter(req.query);

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5000);


  const headers = [
    'Order ID',
    'Date',
    'Customer',
    'Email',
    'Phone',
    'Address',
    'City',
    'Postal code',
    'Items',
    'Products',
    'Items price',
    'Coupon',
    'Discount',
    'Shipping',
    'Total',
    'Status',
    'Paid',
    'Courier',
    'Tracking',
  ];

  const rows = orders.map((o) =>
    [
      o._id,
      new Date(o.createdAt).toISOString().slice(0, 10),
      o.user?.name || 'Deleted user',
      o.user?.email || '',
      o.shippingAddress?.phone,
      o.shippingAddress?.address,
      o.shippingAddress?.city,
      o.shippingAddress?.postalCode,
      o.orderItems.reduce((s, i) => s + i.qty, 0),
      o.orderItems
        .map(
          (i) =>
            `${i.qty}x ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ''}`
        )
        .join('; '),
      o.itemsPrice,
      o.couponCode,
      o.discountAmount,
      o.shippingPrice,
      o.totalPrice,
      o.status,
      o.isPaid ? 'Yes' : 'No',
      o.courier,
      o.trackingNumber,
    ]
      .map(cell)
      .join(',')
  );

  // BOM so Excel reads UTF-8 correctly
  const csv = `\uFEFF${headers.map(cell).join(',')}\n${rows.join('\n')}`;

  const stamp = new Date().toISOString().slice(0, 10);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="shopnest-orders-${stamp}.csv"`
  );

  res.send(csv);
});

// GET /api/orders/:id  — protected
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('statusHistory.changedBy', 'name');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // populate() yields null if the account has since been removed, and reading
  // ._id off that threw a 500 on an order an admin can legitimately view
  const isOwner =
    order.user?._id?.toString() === req.user._id.toString();

  if (!isOwner && !req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const json = order.toObject();

  // Internal notes are for staff only
  if (!req.user.isAdmin) delete json.internalNotes;

  res.json(json);
});

// PUT /api/orders/:id/status  — admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const allowed = NEXT_STATUSES[order.status] || [];

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(
      allowed.length === 0
        ? `This order is ${order.status} and cannot change further`
        : `An order that is ${order.status} can only move to ${allowed.join(
            ' or '
          )}`
    );
  }

  // Stock was taken when the order was placed, so shipping doesn't move it.
  // Cancelling gives it back.
  if (status === 'cancelled') {
    if (order.stockAdjusted) {
      await releaseStock(order.orderItems);
      order.stockAdjusted = false;
    }

    await releaseCoupon(order);
  }

  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();

    if (order.paymentMethod === 'Cash on Delivery') {
      order.isPaid = true;
      order.paidAt = new Date();
    }
  }

  if (status === 'cancelled') {
    order.cancelledAt = new Date();
    order.cancelReason = note || 'Cancelled by store';
  }

  order.status = status;
  pushHistory(order, status, note, req.user._id);

  const updated = await order.save();

  res.json(updated);
});

// PUT /api/orders/:id/cancel  — protected, customer's own order
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    res.status(400);
    throw new Error(
      `This order is already ${order.status} and can no longer be cancelled. Contact us and we'll help.`
    );
  }

  if (order.stockAdjusted) {
    await releaseStock(order.orderItems);
    order.stockAdjusted = false;
  }

  await releaseCoupon(order);

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason?.trim() || 'Cancelled by customer';

  pushHistory(order, 'cancelled', order.cancelReason, req.user._id);

  const updated = await order.save();
  res.json(updated);
});

// PUT /api/orders/:id/details  — admin
export const updateOrderDetails = asyncHandler(async (req, res) => {
  const { trackingNumber, courier, internalNotes } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (trackingNumber !== undefined)
    order.trackingNumber = String(trackingNumber).trim();

  if (courier !== undefined) order.courier = String(courier).trim();

  if (internalNotes !== undefined)
    order.internalNotes = String(internalNotes).trim();

  const updated = await order.save();
  res.json(updated);
});

// PUT /api/orders/:id/refund  — admin
export const refundOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.isPaid) {
    res.status(400);
    throw new Error('This order has not been paid for');
  }

  if (order.isRefunded) {
    res.status(400);
    throw new Error('This order has already been refunded');
  }

  order.isRefunded = true;
  order.refundedAt = new Date();
  order.refundNote = req.body.note?.trim() || '';

  const updated = await order.save();
  res.json(updated);
});