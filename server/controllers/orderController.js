import asyncHandler from '../utils/asyncHandler.js';
import Order, { NEXT_STATUSES } from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Coupon from '../models/couponModel.js';

const SHIPPING_PRICE = 200;
const FREE_SHIPPING_OVER = 5000;
const DEFAULT_PAGE_SIZE = 8;

// Stock leaves when the order ships and comes back if it's cancelled.
// direction is -1 to take, +1 to return.
const adjustStock = async (order, direction) => {
  for (const item of order.orderItems) {
    const change = direction * item.qty;

    if (item.variantId) {
      // Positional operator: touch the matched variant only
      await Product.updateOne(
        { _id: item.product, 'variants._id': item.variantId },
        { $inc: { 'variants.$.countInStock': change } }
      );

      await Product.updateOne(
        { _id: item.product },
        { $inc: { countInStock: change } }
      );
    } else {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { countInStock: change } }
      );
    }
  }
};

const pushHistory = (order, status, note, userId) => {
  order.statusHistory.push({
    status,
    note: note || '',
    changedBy: userId || null,
    at: new Date(),
  });
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

  const order = await Order.create({
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
    statusHistory: [
      { status: 'pending', note: 'Order placed', at: new Date() },
    ],
  });

  // Record the redemption only after the order exists, so a failed order
  // doesn't burn someone's one allowed use
  if (coupon) {
    const existing = coupon.usedBy.find(
      (u) => u.user.toString() === req.user._id.toString()
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
  const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;
  const page = Number(req.query.pageNumber) || 1;

  const filter = { user: req.user._id };

  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }

  const count = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});

// GET /api/orders  — admin
export const getAllOrders = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;
  const page = Number(req.query.pageNumber) || 1;

  const filter = {};

  if (req.query.status && req.query.status !== 'all') {
    if (req.query.status === 'open') {
      filter.status = { $nin: ['delivered', 'cancelled'] };
    } else if (req.query.status === 'unpaid') {
      filter.isPaid = false;
    } else {
      filter.status = req.query.status;
    }
  }

  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const end = new Date(req.query.to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const count = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
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

  const isOwner = order.user._id.toString() === req.user._id.toString();

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

  // Stock leaves the warehouse when the order ships
  if (status === 'shipped' && !order.stockAdjusted) {
    await adjustStock(order, -1);
    order.stockAdjusted = true;
  }

  // Put it back if the order is cancelled after stock was already taken
  if (status === 'cancelled' && order.stockAdjusted) {
    await adjustStock(order, 1);
    order.stockAdjusted = false;
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
    await adjustStock(order, 1);
    order.stockAdjusted = false;
  }

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