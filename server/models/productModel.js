import mongoose from 'mongoose';

// One selectable combination, e.g. Size=Small + Colour=Blue
const variantSchema = new mongoose.Schema({
  options: [
    {
      name: { type: String, required: true, trim: true },
      value: { type: String, required: true, trim: true },
      _id: false,
    },
  ],
  sku: { type: String, trim: true, default: '' },
  price: { type: Number, required: true, min: 0 },
  countInStock: { type: Number, required: true, default: 0, min: 0 },
  image: { type: String, default: '' },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, default: 0, min: 0 },
    images: { type: [String], default: [] },
    category: { type: String, required: true, trim: true },
    countInStock: { type: Number, required: true, default: 0, min: 0 },

    // e.g. [{ name: 'Size', values: ['Small', 'Medium'] }]
    optionTypes: [
      {
        name: { type: String, required: true, trim: true },
        values: { type: [String], default: [] },
        _id: false,
      },
    ],

    variants: { type: [variantSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('image').get(function () {
  return this.images?.[0] || '';
});

productSchema.virtual('hasVariants').get(function () {
  return this.variants?.length > 0;
});

// Lowest price shown on cards. Falls back to the product price.
productSchema.virtual('minPrice').get(function () {
  if (!this.variants?.length) return this.price;
  return Math.min(...this.variants.map((v) => v.price));
});

productSchema.virtual('maxPrice').get(function () {
  if (!this.variants?.length) return this.price;
  return Math.max(...this.variants.map((v) => v.price));
});

// Stock across all variants, so "out of stock" still works on cards.
productSchema.virtual('totalStock').get(function () {
  if (!this.variants?.length) return this.countInStock;
  return this.variants.reduce((sum, v) => sum + v.countInStock, 0);
});

const Product = mongoose.model('Product', productSchema);

export default Product;