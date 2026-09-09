import mongoose from 'mongoose';

const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function () {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name);
  }
});

const Category = mongoose.model('Category', categorySchema);

export { slugify };
export default Category;