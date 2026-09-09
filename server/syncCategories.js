import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Product from './models/productModel.js';
import Category from './models/categoryModel.js';

dotenv.config();
await connectDB();

const run = async () => {
  try {
    const names = await Product.distinct('category');
    const created = [];
    const skipped = [];

    for (const name of names) {
      if (!name?.trim()) continue;

      const exists = await Category.findOne({
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
      });

      if (exists) {
        skipped.push(exists.name);
        continue;
      }

      const category = await Category.create({ name: name.trim() });
      created.push(category.name);
    }

    if (created.length) {
      console.log(`Created ${created.length}: ${created.join(', ')}`);
    }

    if (skipped.length) {
      console.log(`Already existed ${skipped.length}: ${skipped.join(', ')}`);
    }

    if (!created.length && !skipped.length) {
      console.log('No categories found on products');
    }

    process.exit();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

run();