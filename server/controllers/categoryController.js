import asyncHandler from '../utils/asyncHandler.js';
import Category from '../models/categoryModel.js';
import Product from '../models/productModel.js';

// GET /api/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).sort({ position: 1, name: 1 });

  // Live product counts, keyed by the denormalised name
  const counts = await Product.aggregate([
    { $group: { _id: '$categoryName', count: { $sum: 1 } } },
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
  const { name, description, image, parent } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error('Name is required');
  }

  // Only one level of nesting: a child cannot itself be a parent
  if (parent) {
    const parentCategory = await Category.findById(parent);

    if (!parentCategory) {
      res.status(400);
      throw new Error('That parent category does not exist');
    }

    if (parentCategory.parent) {
      res.status(400);
      throw new Error('Categories can only be nested one level deep');
    }
  }

  const siblingExists = await Category.findOne({
    parent: parent || null,
    name: { $regex: `^${name.trim()}$`, $options: 'i' },
  });

  if (siblingExists) {
    res.status(400);
    throw new Error('That category already exists here');
  }

  const category = await Category.create({
    name: name.trim(),
    description: description?.trim() || '',
    image: image || '',
    parent: parent || null,
  });

  res.status(201).json(category);
});

// PUT /api/categories/:id  — admin
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, image, parent, position, isActive } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const oldName = category.name;

  if (name?.trim() && name.trim() !== oldName) {
    const siblingExists = await Category.findOne({
      _id: { $ne: category._id },
      parent: category.parent,
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });

    if (siblingExists) {
      res.status(400);
      throw new Error('That category already exists here');
    }

    category.name = name.trim();
  }

  if (parent !== undefined) {
    if (parent && parent.toString() === category._id.toString()) {
      res.status(400);
      throw new Error('A category cannot be its own parent');
    }

    if (parent) {
      const parentCategory = await Category.findById(parent);

      if (!parentCategory) {
        res.status(400);
        throw new Error('That parent category does not exist');
      }

      if (parentCategory.parent) {
        res.status(400);
        throw new Error('Categories can only be nested one level deep');
      }

      // Moving a parent under someone else would orphan its children
      const hasChildren = await Category.countDocuments({
        parent: category._id,
      });

      if (hasChildren > 0) {
        res.status(400);
        throw new Error('Move its subcategories out first');
      }
    }

    category.parent = parent || null;
  }

  if (description !== undefined) category.description = description.trim();
  if (image !== undefined) category.image = image;
  if (position !== undefined) category.position = Number(position) || 0;
  if (isActive !== undefined) category.isActive = Boolean(isActive);

  const updated = await category.save();

  // Keep the denormalised name on products in step
  if (updated.name !== oldName) {
    await Product.updateMany(
      { category: updated._id },
      { $set: { categoryName: updated.name } }
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

  const children = await Category.countDocuments({ parent: category._id });

  if (children > 0) {
    res.status(400);
    throw new Error(
      `${children} subcategor${children === 1 ? 'y' : 'ies'} sit under this. Delete them first.`
    );
  }

  const inUse = await Product.countDocuments({ category: category._id });

  if (inUse > 0) {
    res.status(400);
    throw new Error(
      `${inUse} product${inUse === 1 ? ' uses' : 's use'} this category. Move them first.`
    );
  }

  await category.deleteOne();
  res.json({ message: 'Category removed' });
});