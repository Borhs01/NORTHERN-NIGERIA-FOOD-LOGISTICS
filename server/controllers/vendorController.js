const Vendor = require('../models/Vendor');
const FoodItem = require('../models/FoodItem');
const { calculateDistance, estimateDeliveryTime, geocodeAddress } = require('../utils/location');

const getVendors = async (req, res) => {
  const { state, lga, category, search, lat, lng, page = 1, limit = 20 } = req.query;
  const filter = { isApproved: true, isSuspended: false };
  if (state) filter.state = state;
  if (lga) filter.lga = lga;
  if (category) filter.categories = { $in: [category] };
  if (search) filter.businessName = { $regex: search, $options: 'i' };

  const total = await Vendor.countDocuments(filter);
  const query = Vendor.find(filter)
    .populate('userId', 'name phone email')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  let vendors = await query.exec();

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const hasCoordinates = !Number.isNaN(userLat) && !Number.isNaN(userLng);

  if (hasCoordinates) {
    vendors = vendors.map((vendor) => {
      const vendorObject = vendor.toObject ? vendor.toObject() : vendor;
      const vendorLat = vendorObject.coordinates?.lat;
      const vendorLng = vendorObject.coordinates?.lng;
      const distanceKm = typeof vendorLat === 'number' && typeof vendorLng === 'number'
        ? calculateDistance(userLat, userLng, vendorLat, vendorLng)
        : null;
      return { ...vendorObject, distanceKm };
    });

    vendors.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  } else {
    vendors = vendors
      .map((vendor) => (vendor.toObject ? vendor.toObject() : vendor))
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  }

  res.json({ vendors, total, page: Number(page), pages: Math.ceil(total / limit) });
};

const getNearbyVendors = async (req, res) => {
  const { customerLat, customerLng } = req.query;

  if (!customerLat || !customerLng) {
    return res.status(400).json({ message: 'customerLat and customerLng are required' });
  }

  const lat = parseFloat(customerLat);
  const lng = parseFloat(customerLng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ message: 'Invalid coordinates' });
  }

  const vendors = await Vendor.find({
    isApproved: true,
    isSuspended: false,
    coordinates: { $exists: true }
  }).populate('userId', 'name phone email');

  const vendorsWithDistance = vendors.map((vendor) => {
    const vendorObject = vendor.toObject();
    const distanceKm = calculateDistance(lat, lng, vendorObject.coordinates.lat, vendorObject.coordinates.lng);
    const deliveryEstimateMinutes = estimateDeliveryTime(distanceKm);
    return {
      ...vendorObject,
      distanceKm: Math.round(distanceKm * 10) / 10, // Round to 1 decimal
      deliveryEstimateMinutes,
    };
  });

  // Sort by distance (nearest first)
  vendorsWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({ vendors: vendorsWithDistance });
};

const getVendorById = async (req, res) => {
  const vendor = await Vendor.findById(req.params.id).populate('userId', 'name phone email');
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  const items = await FoodItem.find({ vendorId: vendor._id, isAvailable: true });
  res.json({ vendor, items });
};

const createVendor = async (req, res) => {
  const existing = await Vendor.findOne({ userId: req.user._id });
  if (existing) return res.status(400).json({ message: 'Vendor profile already exists' });

  const { businessName, state, lga, address } = req.body;
  const vendorAddress = address || req.user?.address || '';

  if (!businessName || !state || !lga || !vendorAddress) {
    return res.status(400).json({
      message: 'Missing required vendor fields: businessName, state, lga, address',
    });
  }

  try {
    // Geocode the vendor address to get coordinates
    let coordinates = { lat: 0, lng: 0 };
    try {
      const coords = await geocodeAddress(vendorAddress, state);
      if (coords) {
        coordinates = coords;
      }
    } catch (geocodeErr) {
      console.warn('Geocoding failed, using default coordinates:', geocodeErr.message);
    }

    const vendor = await Vendor.create({
      userId: req.user._id,
      businessName,
      state,
      lga,
      address: vendorAddress,
      coordinates,
      ...req.body,
    });

    res.status(201).json(vendor);
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ message: error.message || 'Failed to create vendor' });
  }
};

const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) return res.status(404).json({ message: 'Not found' });

    Object.assign(vendor, req.body);
    if (req.file) {
      vendor[req.body.imageField || 'logo'] = req.file.path || '';
    }
    await vendor.save();
    res.json(vendor);
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: error.message || 'Failed to update vendor' });
  }
};

const toggleOpen = async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) return res.status(404).json({ message: 'Not found' });
  vendor.isOpen = !vendor.isOpen;
  await vendor.save();
  res.json({ isOpen: vendor.isOpen });
};

module.exports = { getVendors, getNearbyVendors, getVendorById, createVendor, updateVendor, toggleOpen };
