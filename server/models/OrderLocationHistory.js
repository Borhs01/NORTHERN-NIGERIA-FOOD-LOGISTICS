const mongoose = require('mongoose');

const orderLocationHistorySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    riderLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    timestamp: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'on_the_way', 'arrived', 'completed', 'cancelled'],
      default: 'on_the_way'
    },
  },
  { timestamps: true }
);

// Index for efficient querying by orderId and timestamp
orderLocationHistorySchema.index({ orderId: 1, timestamp: -1 });

module.exports = mongoose.model('OrderLocationHistory', orderLocationHistorySchema);
