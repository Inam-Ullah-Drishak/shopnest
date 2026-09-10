import asyncHandler from '../utils/asyncHandler.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Coupon from '../models/couponModel.js';

const SHIPPING_PRICE = 200;
const FREE_SHIPPING_OVER = 5000;
const DEFAULT_PAGE_SIZE = 8;

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

    // Drafts aren't for sale, even if someone still has one in their cart
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

  // Shipping is judged on what they actually pay, not the pre-discount total
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

// GET /api/orders/mine?pageNumber=&pageSize=  — protected
export const getMyOrders = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;
  const page = Number(req.query.pageNumber) || 1;

  const filter = { user: req.user._id };

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

// GET /api/orders?pageNumber=&pageSize=&status=  — admin
export const getAllOrders = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;
  const page = Number(req.query.pageNumber) || 1;

  const filter = {};

  if (req.query.status === 'pending') {
    filter.isDelivered = false;
  } else if (req.query.status === 'delivered') {
    filter.isDelivered = true;
  } else if (req.query.status === 'unpaid') {
    filter.isPaid = false;
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
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (
    order.user._id.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(401);
    throw new Error('Not authorized');
  }

  res.json(order);
});

// PUT /api/orders/:id/deliver  — admin
export const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.isDelivered) {
    res.status(400);
    throw new Error('Order already delivered');
  }

  order.isDelivered = true;
  order.deliveredAt = Date.now();

  if (order.paymentMethod === 'Cash on Delivery') {
    order.isPaid = true;
    order.paidAt = Date.now();
  }

  for (const item of order.orderItems) {
    if (item.variantId) {
      // Positional operator: decrement the matched variant only
      await Product.updateOne(
        { _id: item.product, 'variants._id': item.variantId },
        { $inc: { 'variants.$.countInStock': -item.qty } }
      );
    } else {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { countInStock: -item.qty } }
      );
    }
  }

  const updated = await order.save();
  res.json(updated);
});