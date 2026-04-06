const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
  name: String,
  qty: Number,
  unitPrice: Number,
  image: String,
});

const orderSchema = new mongoose.Schema(
  {
    consumerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentRef: { type: String, default: '' },
    paymentChannel: { type: String, default: '' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'on_the_way', 'arrived', 'completed', 'cancelled'],
      default: 'pending',
    },
    deliveryAddress: { type: String, required: true },
    deliveryAddressDetails: {
      lat: { type: Number },
      lng: { type: Number },
    },
    deliveryLga: { type: String, default: '' },
    state: { type: String, enum: ['plateau', 'bauchi', 'kaduna'], required: true },
    cancelReason: { type: String, default: '' },
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
