import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';

const SHIPPING_PRICE = 200;
const FREE_SHIPPING_OVER = 5000;

// POST /api/orders  — protected
export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const ids = orderItems.map((item) => item._id);
    const dbProducts = await Product.find({ _id: { $in: ids } });

    const finalItems = [];

    for (const item of orderItems) {
      const dbProduct = dbProducts.find(
        (p) => p._id.toString() === item._id
      );

      if (!dbProduct) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.name}` });
      }

      if (item.qty < 1) {
        return res.status(400).json({ message: 'Invalid quantity' });
      }

      if (dbProduct.countInStock < item.qty) {
        return res
          .status(400)
          .json({ message: `Not enough stock for ${dbProduct.name}` });
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/mine  — protected
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/:id  — protected
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};