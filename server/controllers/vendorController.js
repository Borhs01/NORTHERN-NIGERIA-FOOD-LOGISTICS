const Vendor = require('../models/Vendor');
const FoodItem = require('../models/FoodItem');

const getVendors = async (req, res) => {
  const { state, lga, category, search, page = 1, limit = 20 } = req.query;
  const filter = { isApproved: true, isSuspended: false };
  if (state) filter.state = state;
  if (lga) filter.lga = lga;
  if (category) filter.categories = { $in: [category] };
  if (search) filter.businessName = { $regex: search, $options: 'i' };

  const total = await Vendor.countDocuments(filter);
  const vendors = await Vendor.find(filter)
    .populate('userId', 'name phone email')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ averageRating: -1 });

  res.json({ vendors, total, page: Number(page), pages: Math.ceil(total / limit) });
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

  const vendor = await Vendor.create({
    userId: req.user._id,
    businessName,
    state,
    lga,
    address: vendorAddress,
    ...req.body,
  });

  res.status(201).json(vendor);
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

module.exports = { getVendors, getVendorById, createVendor, updateVendor, toggleOpen };
