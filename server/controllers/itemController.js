const FoodItem = require('../models/FoodItem');
const Vendor = require('../models/Vendor');

const getVendorItems = async (req, res) => {
  const items = await FoodItem.find({ vendorId: req.params.vendorId });
  res.json(items);
};

const createItem = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(403).json({ 
        message: 'Vendor profile not found. Please complete your vendor profile setup first.',
        code: 'NO_VENDOR_PROFILE'
      });
    }

    if (!req.body.name || !req.body.price || !req.body.category) {
      return res.status(400).json({
        message: 'Missing required fields: name, price, category',
      });
    }

    // Handle image path - works with both Cloudinary and memory storage
    const imagePath = req.file ? (req.file.path || '') : '';

    const item = await FoodItem.create({
      ...req.body,
      vendorId: vendor._id,
      image: imagePath,
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create item'
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(403).json({ message: 'Vendor profile not found' });
    }

    const item = await FoodItem.findOne({ _id: req.params.id, vendorId: vendor._id });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    Object.assign(item, req.body);
    if (req.file) {
      item.image = req.file.path || '';
    }
    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: error.message || 'Failed to update item' });
  }
};

const deleteItem = async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  const item = await FoodItem.findOneAndDelete({ _id: req.params.id, vendorId: vendor._id });
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json({ message: 'Deleted' });
};

module.exports = { getVendorItems, createItem, updateItem, deleteItem };
