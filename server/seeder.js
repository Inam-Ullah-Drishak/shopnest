import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Product from './models/productModel.js';
import Category from './models/categoryModel.js';
import Collection from './models/collectionModel.js';
import Review from './models/reviewModel.js';
import Order from './models/orderModel.js';

dotenv.config();
await connectDB();

const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', name), 'utf8'));

// The source data puts color and size on the variant; our schema uses a
// generic options array so any number of option types works.
const variantOptions = (variant) => {
  const options = [];
  if (variant.color) options.push({ name: 'Color', value: variant.color });
  if (variant.size) options.push({ name: 'Size', value: variant.size });
  return options;
};

const importData = async () => {
  try {
    const rawCategories = readJson('categories.json');
    const rawCollections = readJson('collections.json');
    const rawProducts = readJson('products.json');
    const rawReviews = readJson('reviews.json');

    await Promise.all([
      Order.deleteMany(),
      Review.deleteMany(),
      Product.deleteMany(),
      Collection.deleteMany(),
      Category.deleteMany(),
    ]);

    // Slugs must be unique for URLs, but a child can share a parent's name
    // (this data has "Bangles" under "Bangles"). Suffix any collision.
    const usedSlugs = new Set();
    const byId = new Map(rawCategories.map((c) => [c._id, c]));

    const uniqueSlug = (category) => {
      const slug = category.slug;

      if (!usedSlugs.has(slug)) {
        usedSlugs.add(slug);
        return slug;
      }

      // Try prefixing with the parent, e.g. bangles -> bangles-bangles
      const parent = byId.get(category.parent);

      if (parent) {
        const combined = `${parent.slug}-${slug}`;
        if (!usedSlugs.has(combined)) {
          usedSlugs.add(combined);
          return combined;
        }
      }

      let n = 2;
      while (usedSlugs.has(`${slug}-${n}`)) n += 1;

      const numbered = `${slug}-${n}`;
      usedSlugs.add(numbered);
      return numbered;
    };

    // Parents first, so a child's fallback slug can build on the parent's
    const ordered = [
      ...rawCategories.filter((c) => !c.parent),
      ...rawCategories.filter((c) => c.parent),
    ];

    // Categories keep their original _ids so parent links stay intact
    const categories = ordered.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: uniqueSlug(c),
      description: c.description || '',
      image: c.image || '',
      parent: c.parent || null,
      position: c.position || 0,
      isActive: c.isActive !== false,
    }));

    await Category.insertMany(categories);

    // Recalculate ratings from the actual reviews rather than trusting
    // the numbers stored on each product
    const stats = new Map();

    for (const review of rawReviews) {
      const entry = stats.get(review.product) || { sum: 0, count: 0 };
      entry.sum += review.rating;
      entry.count += 1;
      stats.set(review.product, entry);
    }

    const products = rawProducts.map((p) => {
      const stat = stats.get(p._id);

      return {
        _id: p._id,
        name: p.title,
        handle: p.handle,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        images: [...p.images]
          .sort((a, b) => a.position - b.position)
          .map((i) => i.url),
        category: p.category,
        categoryName: p.categoryName,
        countInStock: p.totalStock,
        tags: p.tags || [],
        rating: stat ? Number((stat.sum / stat.count).toFixed(2)) : 0,
        numReviews: stat ? stat.count : 0,
        isFeatured: Boolean(p.isFeatured),
        status: p.status === 'draft' ? 'draft' : 'active',
        optionTypes: (p.options || []).map((o) => ({
          name: o.name,
          values: o.values,
        })),
        variants: (p.variants || []).map((v) => ({
          _id: v._id,
          options: variantOptions(v),
          sku: v.sku || '',
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          countInStock: v.stock ?? 0,
          image: '',
        })),
      };
    });

    await Product.insertMany(products);

    // The source hangs collections off the product; our model hangs
    // products off the collection, so invert it
    const membership = new Map(rawCollections.map((c) => [c._id, []]));

    for (const p of rawProducts) {
      for (const id of p.collections || []) {
        membership.get(id)?.push(p._id);
      }
    }

    const collections = rawCollections.map((c) => ({
      _id: c._id,
      title: c.title,
      slug: c.slug,
      description: c.description || '',
      image: c.image || '',
      products: membership.get(c._id) || [],
      isPublished: c.isActive !== false,
      sortOrder: c.position || 0,
    }));

    await Collection.insertMany(collections);

    const reviews = rawReviews.map((r) => ({
      _id: r._id,
      product: r.product,
      user: null,
      author: r.author,
      city: r.city || '',
      rating: r.rating,
      title: r.title || '',
      body: r.body,
      verifiedPurchase: Boolean(r.verifiedPurchase),
      createdAt: r.createdAt,
    }));

    await Review.insertMany(reviews);

    console.log(`Categories:  ${categories.length}`);
    console.log(`Collections: ${collections.length}`);
    console.log(`Products:    ${products.length}`);
    console.log(
      `Variants:    ${products.reduce((s, p) => s + p.variants.length, 0)}`
    );
    console.log(`Reviews:     ${reviews.length}`);
    console.log('Import complete');

    process.exit();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Promise.all([
      Order.deleteMany(),
      Review.deleteMany(),
      Product.deleteMany(),
      Collection.deleteMany(),
      Category.deleteMany(),
    ]);

    console.log('All data destroyed');
    process.exit();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}