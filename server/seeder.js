import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Product from './models/productModel.js';
import Order from './models/orderModel.js';
import products from './data/products.js';

dotenv.config();
await connectDB();

const importData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();

    const created = await Product.insertMany(products);

    console.log(`Imported ${created.length} products`);
    process.exit();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();

    console.log('Products and orders destroyed');
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