const express = require('express');
const router = express.Router();
const Rider = require('../models/Rider');
const { isRider } = require('../middleware/auth');

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
