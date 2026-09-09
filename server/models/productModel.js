import mongoose from 'mongoose';

// One selectable combination, e.g. Color=Ivory + Size=Medium
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
  compareAtPrice: { type: Number, default: null },
  countInStock: { type: Number, required: true, default: 0, min: 0 },
  image: { type: String, default: '' },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    handle: { type: String, trim: true, lowercase: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, default: 0, min: 0 },

    // Original price for strikethrough display. null when not on sale.
    compareAtPrice: { type: Number, default: null },

    images: { type: [String], default: [] },

    // Both kept on purpose: the ref enables nesting, the name keeps
    // existing string filters working without a populate.
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    categoryName: { type: String, required: true, trim: true },

    countInStock: { type: Number, required: true, default: 0, min: 0 },
    tags: { type: [String], default: [] },

    // Denormalised from reviews, recalculated when one is added or removed
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['active', 'draft'],
      default: 'active',
    },

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

productSchema.virtual('minPrice').get(function () {
  if (!this.variants?.length) return this.price;
  return Math.min(...this.variants.map((v) => v.price));
});

productSchema.virtual('maxPrice').get(function () {
  if (!this.variants?.length) return this.price;
  return Math.max(...this.variants.map((v) => v.price));
});

productSchema.virtual('totalStock').get(function () {
  if (!this.variants?.length) return this.countInStock;
  return this.variants.reduce((sum, v) => sum + v.countInStock, 0);
});

productSchema.virtual('onSale').get(function () {
  return Boolean(this.compareAtPrice && this.compareAtPrice > this.price);
});

productSchema.virtual('discountPercent').get(function () {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(
    ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100
  );
});

const Product = mongoose.model('Product', productSchema);

export default Product;