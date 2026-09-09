import asyncHandler from '../utils/asyncHandler.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';

const SHIPPING_PRICE = 200;
const FREE_SHIPPING_OVER = 5000;

// POST /api/orders  — protected
export const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

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
      throw new Error(`Product not found: ${item.name}`);
    }

    if (item.qty < 1) {
      res.status(400);
      throw new Error('Invalid quantity');
    }

    if (dbProduct.countInStock < item.qty) {
      res.status(400);
      throw new Error(`Not enough stock for ${dbProduct.name}`);
    }

    finalItems.push({
      name: dbProduct.name,
      qty: item.qty,
      image: dbProduct.image,
      price: dbProduct.price,
      product: dbProduct._id,
    });
  }

  const itemsPrice = finalItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const shippingPrice = itemsPrice > FREE_SHIPPING_OVER ? 0 : SHIPPING_PRICE;
  const totalPrice = itemsPrice + shippingPrice;

  const order = await Order.create({
    user: req.user._id,
    orderItems: finalItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'Cash on Delivery',
    itemsPrice,
    shippingPrice,
    totalPrice,
  });

  res.status(201).json(order);
});

// GET /api/orders/mine  — protected
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.json(orders);
});

// GET /api/orders  — admin
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.json(orders);
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
    await Product.updateOne(
      { _id: item.product },
      { $inc: { countInStock: -item.qty } }
    );
  }

  const updated = await order.save();
  res.json(updated);
});