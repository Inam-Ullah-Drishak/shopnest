import asyncHandler from '../utils/asyncHandler.js';
import Product from '../models/productModel.js';

// "navy blue" -> "Navy Blue"
const titleCase = (str) =>
  String(str || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// Clean and validate the variant payload from the admin form
const sanitizeVariants = (variants, optionTypes) => {
  if (!Array.isArray(variants) || variants.length === 0) {
    return { optionTypes: [], variants: [] };
  }

  const cleanTypes = (Array.isArray(optionTypes) ? optionTypes : [])
    .filter((t) => t?.name?.trim() && Array.isArray(t.values) && t.values.length)
    .map((t) => ({
      name: titleCase(t.name),
      values: t.values.map((v) => titleCase(v)).filter(Boolean),
    }));

  if (cleanTypes.length === 0) {
    return { optionTypes: [], variants: [] };
  }

  const seen = new Set();
  const cleanVariants = [];

  for (const v of variants) {
    if (!Array.isArray(v?.options) || v.options.length === 0) continue;

    const options = v.options
      .filter((o) => o?.name?.trim() && o?.value?.trim())
      .map((o) => ({ name: titleCase(o.name), value: titleCase(o.value) }));

    if (options.length !== cleanTypes.length) continue;

    // Reject duplicate combinations
    const key = options.map((o) => `${o.name}:${o.value}`).join('|');
    if (seen.has(key)) continue;
    seen.add(key);

    const price = Number(v.price);
    const countInStock = Number(v.countInStock);

    if (!Number.isFinite(price) || price < 0) continue;

    cleanVariants.push({
      options,
      sku: String(v.sku || '').trim(),
      price,
      countInStock:
        Number.isFinite(countInStock) && countInStock > 0
          ? Math.floor(countInStock)
          : 0,
      image: String(v.image || '').trim(),
    });
  }

  if (cleanVariants.length === 0) {
    return { optionTypes: [], variants: [] };
  }

  return { optionTypes: cleanTypes, variants: cleanVariants };
};

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
  const { name, description, price, images, category, countInStock } = req.body;

  if (!name?.trim() || !description?.trim() || !category?.trim()) {
    res.status(400);
    throw new Error('Name, description and category are required');
  }

  const { optionTypes, variants } = sanitizeVariants(
    req.body.variants,
    req.body.optionTypes
  );

  const product = await Product.create({
    name: name.trim(),
    description: description.trim(),
    price: variants.length
      ? Math.min(...variants.map((v) => v.price))
      : Number(price) || 0,
    images: Array.isArray(images) ? images.filter(Boolean) : [],
    category: category.trim(),
    countInStock: variants.length
      ? variants.reduce((sum, v) => sum + v.countInStock, 0)
      : Number(countInStock) || 0,
    optionTypes,
    variants,
  });

  res.status(201).json(product);
});

// PUT /api/products/:id  — admin
export const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, images, category, countInStock } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  product.name = name ?? product.name;
  product.description = description ?? product.description;
  product.category = category ?? product.category;

  if (Array.isArray(images)) {
    product.images = images.filter(Boolean);
  }

  if (req.body.variants !== undefined) {
    const { optionTypes, variants } = sanitizeVariants(
      req.body.variants,
      req.body.optionTypes
    );

    // Keep existing variant _ids so open carts and orders stay valid
    const byCombo = new Map(
      product.variants.map((v) => [
        v.options.map((o) => `${o.name}:${o.value}`).join('|'),
        v._id,
      ])
    );

    product.optionTypes = optionTypes;
    product.variants = variants.map((v) => {
      const key = v.options.map((o) => `${o.name}:${o.value}`).join('|');
      const existingId = byCombo.get(key);
      return existingId ? { ...v, _id: existingId } : v;
    });
  }

  if (product.variants.length) {
    product.price = Math.min(...product.variants.map((v) => v.price));
    product.countInStock = product.variants.reduce(
      (sum, v) => sum + v.countInStock,
      0
    );
  } else {
    product.price = price ?? product.price;
    product.countInStock = countInStock ?? product.countInStock;
  }

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