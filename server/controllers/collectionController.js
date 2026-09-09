import asyncHandler from '../utils/asyncHandler.js';
import Collection from '../models/collectionModel.js';
import Product from '../models/productModel.js';

// GET /api/collections?published=true
export const getCollections = asyncHandler(async (req, res) => {
  const filter = {};

  // Storefront asks for published only; admin gets everything
  if (req.query.published === 'true') {
    filter.isPublished = true;
  }

  const collections = await Collection.find(filter).sort({
    sortOrder: 1,
    title: 1,
  });

  res.json(collections);
});

// GET /api/collections/:slug
// Returns the collection plus its products, paginated
export const getCollectionBySlug = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ slug: req.params.slug });

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  if (!collection.isPublished && !req.user?.isAdmin) {
    res.status(404);
    throw new Error('Collection not found');
  }

  const pageSize = Number(req.query.pageSize) || 8;
  const page = Number(req.query.pageNumber) || 1;

  const filter = { _id: { $in: collection.products } };

  const sortMap = {
    newest: { createdAt: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'name-asc': { name: 1 },
  };

  const sort = sortMap[req.query.sort] || sortMap.newest;

  const count = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .sort(sort)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    collection,
    products,
    page,
    pages: Math.ceil(count / pageSize),
    count,
  });
});

// GET /api/collections/id/:id  — admin
export const getCollectionById = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id).populate(
    'products',
    'name price images category countInStock'
  );

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  res.json(collection);
});

// POST /api/collections  — admin
export const createCollection = asyncHandler(async (req, res) => {
  const { title, description, image, products, isPublished, sortOrder } =
    req.body;

  if (!title?.trim()) {
    res.status(400);
    throw new Error('Title is required');
  }

  const exists = await Collection.findOne({
    title: { $regex: `^${title.trim()}$`, $options: 'i' },
  });

  if (exists) {
    res.status(400);
    throw new Error('A collection with that name already exists');
  }

  const collection = await Collection.create({
    title: title.trim(),
    description: description?.trim() || '',
    image: image || '',
    products: Array.isArray(products) ? [...new Set(products)] : [],
    isPublished: isPublished !== false,
    sortOrder: Number(sortOrder) || 0,
  });

  res.status(201).json(collection);
});

// PUT /api/collections/:id  — admin
export const updateCollection = asyncHandler(async (req, res) => {
  const { title, description, image, products, isPublished, sortOrder } =
    req.body;

  const collection = await Collection.findById(req.params.id);

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  if (title?.trim() && title.trim() !== collection.title) {
    const exists = await Collection.findOne({
      _id: { $ne: collection._id },
      title: { $regex: `^${title.trim()}$`, $options: 'i' },
    });

    if (exists) {
      res.status(400);
      throw new Error('A collection with that name already exists');
    }

    collection.title = title.trim();
  }

  if (description !== undefined) collection.description = description.trim();
  if (image !== undefined) collection.image = image;
  if (isPublished !== undefined) collection.isPublished = Boolean(isPublished);
  if (sortOrder !== undefined) collection.sortOrder = Number(sortOrder) || 0;

  if (Array.isArray(products)) {
    collection.products = [...new Set(products)];
  }

  const updated = await collection.save();
  res.json(updated);
});

// DELETE /api/collections/:id  — admin
export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  await collection.deleteOne();
  res.json({ message: 'Collection removed' });
});