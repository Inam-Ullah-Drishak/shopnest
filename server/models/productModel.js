import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, default: 0, min: 0 },
    images: { type: [String], default: [] },
    category: { type: String, required: true, trim: true },
    countInStock: { type: Number, required: true, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// First image is the primary one. Keeps cart, orders and cards working
// without every component needing to know about the array.
productSchema.virtual('image').get(function () {
  return this.images?.[0] || '';
});

const Product = mongoose.model('Product', productSchema);

export default Product;