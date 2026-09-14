// One-off: fills in Product.unitsSold from orders placed before the counter
// existed. Safe to re-run -- it sets an absolute figure rather than adding to
// one, so running it twice gives the same answer as running it once.
//
//   npm run data:backfill
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';

await connectDB();

try {
  // Cancelled orders return their stock, so they must not count as sales
  const rows = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        sold: { $sum: '$orderItems.qty' },
      },
    },
  ]);

  const sold = new Map(rows.map((row) => [String(row._id), row.sold]));

  const products = await Product.find({}).select('_id unitsSold');

  const writes = products
    .map((product) => ({
      id: product._id,
      was: product.unitsSold || 0,
      now: sold.get(String(product._id)) || 0,
    }))
    .filter((entry) => entry.was !== entry.now)
    .map((entry) => ({
      updateOne: {
        filter: { _id: entry.id },
        update: { $set: { unitsSold: entry.now } },
      },
    }));

  if (writes.length === 0) {
    console.log('Nothing to change - every product is already correct.');
  } else {
    const result = await Product.bulkWrite(writes);

    console.log(
      `Updated ${result.modifiedCount} product${
        result.modifiedCount === 1 ? '' : 's'
      } from ${rows.length} with recorded sales.`
    );
  }

  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error(`Backfill failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
}