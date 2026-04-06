const express = require('express');
const router = express.Router();
const Rider = require('../models/Rider');
const Order = require('../models/Order');
const { isRider } = require('../middleware/auth');

router.get('/active-orders', ...isRider, async (req, res) => {
  try {
    const rider = await Rider.findOne({ userId: req.user._id });
    
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Get active deliveries (assigned to rider and not completed)
    const orders = await Order.find({ 
      riderId: req.user._id, 
      orderStatus: { $in: ['ready_for_pickup', 'on_the_way', 'arrived'] }
    })
    .populate('consumerId', 'name phone')
    .populate('vendorId', 'businessName address coordinates')
    .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({ message: 'Failed to fetch active orders' });
  }
});

router.patch('/toggle-online', ...isRider, async (req, res) => {
  const rider = await Rider.findOne({ userId: req.user._id });
  if (!rider) return res.status(404).json({ message: 'Rider profile not found' });
  rider.isOnline = !rider.isOnline;
  await rider.save();
  res.json({ isOnline: rider.isOnline });
});

router.patch('/location', ...isRider, async (req, res) => {
  const { lat, lng } = req.body;
  await Rider.findOneAndUpdate({ userId: req.user._id }, { currentLocation: { lat, lng } });
  res.json({ message: 'Location updated' });
});

module.exports = router;
