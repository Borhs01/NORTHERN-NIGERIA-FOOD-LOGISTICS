const mongoose = require('mongoose');

const lgaFeeSchema = new mongoose.Schema({
  lga: String,
  fee: Number,
});

const stateFeesSchema = new mongoose.Schema({
  state: String,
  lgas: [lgaFeeSchema],
});

const settingsSchema = new mongoose.Schema(
  {
    commissionRate: { type: Number, default: 10 },
    maintenanceMode: { type: Boolean, default: false },
    supportPhone: { type: String, default: '+234 000 000 0000' },
    supportEmail: { type: String, default: 'support@northeats.com' },
    deliveryFees: [stateFeesSchema],
    coverageStates: [
      {
        name: String,
        lgas: [String],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
