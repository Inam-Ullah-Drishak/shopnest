import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

// Which statuses an order can legally move to from where it is now.
// Delivered and cancelled are terminal.
export const NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },

        // Snapshot of the chosen variant, if any
        variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
        variantLabel: { type: String, default: '' },
        sku: { type: String, default: '' },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Cash on Delivery',
    },

    itemsPrice: { type: Number, required: true, default: 0 },

    // Stored as text, not a ref, so the order reads correctly even if the
    // coupon is later deleted or renamed
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, required: true, default: 0 },

    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },

    // Every change, so the customer can see a timeline
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES, required: true },
        note: { type: String, default: '' },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    trackingNumber: { type: String, default: '', trim: true },
    courier: { type: String, default: '', trim: true },

    // Visible to admins only
    internalNotes: { type: String, default: '' },

    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },

    // Stock is only taken once; this stops a double decrement
    stockAdjusted: { type: Boolean, default: false },

    isRefunded: { type: Boolean, default: false },
    refundedAt: { type: Date },
    refundNote: { type: String, default: '' },

    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.virtual('isOpen').get(function () {
  return !['delivered', 'cancelled'].includes(this.status);
});

orderSchema.virtual('canCancel').get(function () {
  return ['pending', 'confirmed'].includes(this.status);
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;