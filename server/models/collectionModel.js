import mongoose from 'mongoose';
import { slugify } from './categoryModel.js';

const collectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },

    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],

    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

collectionSchema.pre('validate', function () {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title);
  }
});

collectionSchema.virtual('productCount').get(function () {
  return this.products?.length || 0;
});

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;