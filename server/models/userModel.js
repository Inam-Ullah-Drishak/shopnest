import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Mirrors the shape an order stores, so a saved address can be copied to
// checkout without translation. `label` and `isDefault` are ours; the rest
// are exactly what orderModel's shippingAddress expects.
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: '', trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'Pakistan' },
    phone: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },

    // Kept on the user rather than in their own collection: a person has a
    // handful of these, they're only ever read with the user, and they must
    // not change on past orders, which snapshot the address anyway.
    addresses: { type: [addressSchema], default: [] },

    // Blocked accounts can't sign in, but their orders and reviews stay put
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;