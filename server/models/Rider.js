const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleType: { type: String, enum: ['bike', 'car', 'tricycle'], default: 'bike' },
    state: { type: String, enum: ['plateau', 'bauchi', 'kaduna'], required: true },
    lga: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    currentLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    averageRating: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountName: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rider', riderSchema);
