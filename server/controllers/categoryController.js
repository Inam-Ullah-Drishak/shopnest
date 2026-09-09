import asyncHandler from '../utils/asyncHandler.js';
import Category from '../models/categoryModel.js';
import Product from '../models/productModel.js';

// GET /api/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).sort({ name: 1 });

  // Attach live product counts so the admin can see what's in use
  const counts = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  res.json(
    categories.map((c) => ({
      ...c.toObject(),
      productCount: countMap.get(c.name) || 0,
    }))
  );
});

// GET /api/categories/:id
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.json(category);
});

// POST /api/categories  — admin
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error('Name is required');
  }

  const exists = await Category.findOne({
    name: { $regex: `^${name.trim()}$`, $options: 'i' },
  });

  if (exists) {
    res.status(400);
    throw new Error('That category already exists');
  }

  const category = await Category.create({
    name: name.trim(),
    description: description?.trim() || '',
    image: image || '',
  });

  res.status(201).json(category);
});

// PUT /api/categories/:id  — admin
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const oldName = category.name;

  if (name?.trim() && name.trim() !== oldName) {
    const exists = await Category.findOne({
      _id: { $ne: category._id },
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });

    if (exists) {
      res.status(400);
      throw new Error('That category already exists');
    }

    category.name = name.trim();
  }

  if (description !== undefined) category.description = description.trim();
  if (image !== undefined) category.image = image;

  const updated = await category.save();

  // Keep products in sync when the name changes
  if (updated.name !== oldName) {
    await Product.updateMany(
      { category: oldName },
      { $set: { category: updated.name } }
    );
  }

  res.json(updated);
});

// DELETE /api/categories/:id  — admin
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const inUse = await Product.countDocuments({ category: category.name });

  if (inUse > 0) {
    res.status(400);
    throw new Error(
      `${inUse} product${inUse === 1 ? ' uses' : 's use'} this category. Move them first.`
    );
  }

  await category.deleteOne();
  res.json({ message: 'Category removed' });
});

// POST /api/categories/sync  — admin
// One-off: create Category docs from the category strings already on products
export const syncCategories = asyncHandler(async (req, res) => {
  const names = await Product.distinct('category');
  const created = [];

  for (const name of names) {
    if (!name?.trim()) continue;

    const exists = await Category.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });

    if (!exists) {
      const category = await Category.create({ name: name.trim() });
      created.push(category.name);
    }
  }

  res.json({ message: `Imported ${created.length} categories`, created });
});