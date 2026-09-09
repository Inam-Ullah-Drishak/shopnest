import asyncHandler from '../utils/asyncHandler.js';
import Product from '../models/productModel.js';

// GET /api/products?keyword=&category=&pageNumber=
export const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 8;
  const page = Number(req.query.pageNumber) || 1;

  const filter = {};

  if (req.query.keyword) {
    filter.name = { $regex: req.query.keyword, $options: 'i' };
  }

  if (req.query.category && req.query.category !== 'All') {
    filter.category = req.query.category;
  }

  const count = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
  });
});

// GET /api/products/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json(categories);
});

// GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

// POST /api/products  — admin
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    name: 'Sample Product',
    description: 'Sample description',
    price: 0,
    image: '/images/sample.jpg',
    category: 'Sample',
    countInStock: 0,
  });

  res.status(201).json(product);
});

// PUT /api/products/:id  — admin
export const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, image, category, countInStock } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  product.name = name ?? product.name;
  product.description = description ?? product.description;
  product.price = price ?? product.price;
  product.image = image ?? product.image;
  product.category = category ?? product.category;
  product.countInStock = countInStock ?? product.countInStock;

  const updated = await product.save();
  res.json(updated);
});

// DELETE /api/products/:id  — admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await product.deleteOne();
  res.json({ message: 'Product removed' });
});