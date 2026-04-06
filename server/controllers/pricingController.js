const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const { calculateDistance, estimateDeliveryTime } = require('../utils/location');
const deliveryPricingEngine = require('../utils/deliveryPricing');

const calculateDeliveryFee = async (req, res) => {
  try {
    const { vendorId, customerLat, customerLng } = req.body;

    if (!vendorId || customerLat == null || customerLng == null) {
      return res.status(400).json({
        message: 'vendorId, customerLat, and customerLng are required',
      });
    }

    // Get vendor location
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Calculate distance and estimated delivery time
    const distanceKm = calculateDistance(
      customerLat,
      customerLng,
      vendor.coordinates.lat,
      vendor.coordinates.lng
    );
    const estimatedMinutes = estimateDeliveryTime(distanceKm);

    // Get active orders count for this vendor (for demand multiplier)
    const activeOrdersCount = await Order.countDocuments({
      vendorId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready_for_pickup'] },
    });

    // Check if it's peak hour
    const isPeakHour = deliveryPricingEngine.isPeakHour();

    // Get demand multiplier
    const demandMultiplier = deliveryPricingEngine.getDemandMultiplier(
      vendorId,
      activeOrdersCount
    );

    // Calculate the fee
    const { fee, breakdown } = deliveryPricingEngine.calculateFee(
      distanceKm,
      estimatedMinutes,
      isPeakHour,
      demandMultiplier
    );

    res.json({
      fee,
      estimatedMinutes,
      distanceKm: Math.round(distanceKm * 10) / 10,
      breakdown,
      isPeakHour,
      activeOrdersCount,
    });
  } catch (error) {
    console.error('Calculate delivery fee error:', error);
    res.status(500).json({
      message: 'Failed to calculate delivery fee',
      error: error.message,
    });
  }
};

module.exports = { calculateDeliveryFee };
