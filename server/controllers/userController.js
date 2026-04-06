const User = require('../models/User');
const { reverseGeocode } = require('../utils/location');

const saveLocation = async (req, res) => {
  const { lat, lng, address } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ success: false, message: 'Latitude and longitude must be numbers' });
  }

  const location = {
    lat,
    lng,
    address: address || '',
    updatedAt: new Date(),
  };

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { currentLocation: location },
    { new: true, runValidators: true }
  ).select('-passwordHash');

  return res.json({ success: true, currentLocation: user.currentLocation });
};

const getLocation = async (req, res) => {
  if (!req.user.currentLocation) {
    return res.status(404).json({ success: false, message: 'No saved location found' });
  }
  return res.json({ success: true, currentLocation: req.user.currentLocation });
};

module.exports = { saveLocation, getLocation };
