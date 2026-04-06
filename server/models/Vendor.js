const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    state: { type: String, enum: ['plateau', 'bauchi', 'kaduna'], required: true },
    lga: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    categories: [{ type: String }],
    isOpen: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspendedReason: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    averageRating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 500 },
    minOrder: { type: Number, default: 500 },
    estimatedDeliveryTime: { type: String, default: '30-45 mins' },
    openingHours: { type: String, default: '8:00 AM - 10:00 PM' },
    phone: { type: String, default: '' },
  },
  { timestamps: true }
);

vendorSchema.index({ coordinates: "2dsphere" });

module.exports = mongoose.model('Vendor', vendorSchema);
