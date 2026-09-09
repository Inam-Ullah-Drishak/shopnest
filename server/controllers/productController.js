import asyncHandler from '../utils/asyncHandler.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';

const DEFAULT_PAGE_SIZE = 8;

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

    const key = options.map((o) => `${o.name}:${o.value}`).join('|');
    if (seen.has(key)) continue;
    seen.add(key);

    const price = Number(v.price);
    const countInStock = Number(v.countInStock);
    const compareAt = Number(v.compareAtPrice);

    if (!Number.isFinite(price) || price < 0) continue;

    cleanVariants.push({
      options,
      sku: String(v.sku || '').trim(),
      price,
      compareAtPrice:
        Number.isFinite(compareAt) && compareAt > price ? compareAt : null,
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

// Resolve a category name to its _id, so both fields stay in step
const resolveCategory = async (name) => {
  if (!name?.trim()) return { category: null, categoryName: '' };

  const found = await Category.findOne({
    name: { $regex: `^${name.trim()}$`, $options: 'i' },
  });

  return {
    category: found?._id || null,
    categoryName: found?.name || name.trim(),
  };
};

// Every descendant id of a category, so a parent shows its children's products
const withDescendants = async (categoryId) => {
  const ids = [categoryId];
  let frontier = [categoryId];

  while (frontier.length) {
    const children = await Category.find({ parent: { $in: frontier } }).select(
      '_id'
    );

    frontier = children.map((c) => c._id);
    ids.push(...frontier);
  }

  return ids;
};

// GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || DEFAULT_PAGE_SIZE;
  const page = Number(req.query.pageNumber) || 1;

  const filter = {};

  // Storefront never sees drafts; the admin passes includeDrafts
  if (req.query.includeDrafts !== 'true') {
    filter.status = 'active';
  }

  if (req.query.keyword) {
    filter.$or = [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { tags: { $regex: req.query.keyword, $options: 'i' } },
    ];
  }

  if (req.query.category && req.query.category !== 'All') {
    const found = await Category.findOne({
      name: { $regex: `^${req.query.category}$`, $options: 'i' },
    });

    if (found) {
      // Include child categories, so "Necklaces" covers "Pendants"
      filter.category = { $in: await withDescendants(found._id) };
    } else {
      filter.categoryName = req.query.category;
    }
  }

  if (req.query.stock === 'out') {
    filter.countInStock = 0;
  } else if (req.query.stock === 'low') {
    filter.countInStock = { $gt: 0, $lt: 5 };
  } else if (req.query.stock === 'in') {
    filter.countInStock = { $gte: 5 };
  } else if (req.query.stock === 'available') {
    filter.countInStock = { $gt: 0 };
  }

  if (req.query.onSale === 'true') {
    filter.compareAtPrice = { $ne: null };
  }

  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);

  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.price = {};
    if (Number.isFinite(minPrice)) filter.price.$gte = minPrice;
    if (Number.isFinite(maxPrice)) filter.price.$lte = maxPrice;
  }

  // Whitelist: never pass user input straight into .sort()
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'name-asc': { name: 1 },
    'name-desc': { name: -1 },
    'stock-asc': { countInStock: 1 },
    'stock-desc': { countInStock: -1 },
    'rating-desc': { rating: -1, numReviews: -1 },
  };

  const sort = sortMap[req.query.sort] || sortMap.newest;

  const count = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .sort(sort)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});

// GET /api/products/categories
export const getProductCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('categoryName', {
    status: 'active',
  });

  res.json(categories.filter(Boolean).sort());
});

// GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    'category',
    'name slug parent'
  );

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

// POST /api/products  — admin
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    compareAtPrice,
    images,
    category,
    countInStock,
    tags,
    status,
    isFeatured,
  } = req.body;

  if (!name?.trim() || !description?.trim() || !category?.trim()) {
    res.status(400);
    throw new Error('Name, description and category are required');
  }

  const { optionTypes, variants } = sanitizeVariants(
    req.body.variants,
    req.body.optionTypes
  );

  const resolved = await resolveCategory(category);
  const basePrice = variants.length
    ? Math.min(...variants.map((v) => v.price))
    : Number(price) || 0;

  const compare = Number(compareAtPrice);

  const product = await Product.create({
    name: name.trim(),
    description: description.trim(),
    price: basePrice,
    compareAtPrice:
      Number.isFinite(compare) && compare > basePrice ? compare : null,
    images: Array.isArray(images) ? images.filter(Boolean) : [],
    ...resolved,
    countInStock: variants.length
      ? variants.reduce((sum, v) => sum + v.countInStock, 0)
      : Number(countInStock) || 0,
    tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
    status: status === 'draft' ? 'draft' : 'active',
    isFeatured: Boolean(isFeatured),
    optionTypes,
    variants,
  });

  res.status(201).json(product);
});

// PUT /api/products/:id  — admin
export const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    compareAtPrice,
    images,
    category,
    countInStock,
    tags,
    status,
    isFeatured,
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  product.name = name ?? product.name;
  product.description = description ?? product.description;

  if (category?.trim()) {
    const resolved = await resolveCategory(category);
    product.category = resolved.category;
    product.categoryName = resolved.categoryName;
  }

  if (Array.isArray(images)) {
    product.images = images.filter(Boolean);
  }

  if (Array.isArray(tags)) {
    product.tags = tags.map((t) => String(t).trim()).filter(Boolean);
  }

  if (status !== undefined) {
    product.status = status === 'draft' ? 'draft' : 'active';
  }

  if (isFeatured !== undefined) {
    product.isFeatured = Boolean(isFeatured);
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

  if (compareAtPrice !== undefined) {
    const compare = Number(compareAtPrice);
    product.compareAtPrice =
      Number.isFinite(compare) && compare > product.price ? compare : null;
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