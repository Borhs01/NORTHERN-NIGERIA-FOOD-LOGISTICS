const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Rider = require('../models/Rider');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Promotion = require('../models/Promotion');
const Settings = require('../models/Settings');

const getStats = async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    totalOrders, todayOrders, weekOrders,
    totalRevenue, activeVendors, pendingVendors,
    activeRiders, onlineRiders, totalConsumers,
    recentOrders, recentVendors,
    ordersByStatus, revenueByState, signupsTrend,
    ordersLast30
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: todayStart } }),
    Order.countDocuments({ createdAt: { $gte: weekStart } }),
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Vendor.countDocuments({ isApproved: true, isSuspended: false }),
    Vendor.countDocuments({ isApproved: false, isSuspended: false }),
    Rider.countDocuments({ isApproved: true, isSuspended: false }),
    Rider.countDocuments({ isOnline: true }),
    User.countDocuments({ role: 'consumer' }),
    Order.find().sort({ createdAt: -1 }).limit(10)
      .populate('consumerId', 'name').populate('vendorId', 'businessName'),
    Vendor.find({ isApproved: false }).sort({ createdAt: -1 }).limit(5),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: '$state', revenue: { $sum: '$totalAmount' } } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    kpi: {
      totalOrders, todayOrders, weekOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      activeVendors, pendingVendors,
      activeRiders, onlineRiders, totalConsumers,
    },
    recentOrders, recentVendors,
    charts: { ordersByStatus, revenueByState, signupsTrend, ordersLast30 },
  });
};

const getVendors = async (req, res) => {
  const { status, state, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status === 'pending') { filter.isApproved = false; filter.isSuspended = false; }
  else if (status === 'approved') filter.isApproved = true;
  else if (status === 'suspended') filter.isSuspended = true;
  if (state) filter.state = state;
  if (search) filter.businessName = { $regex: search, $options: 'i' };

  const total = await Vendor.countDocuments(filter);
  const vendors = await Vendor.find(filter)
    .populate('userId', 'name email phone')
    .skip((page - 1) * limit).limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ vendors, total });
};

const approveVendor = async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, { isApproved: true, rejectionReason: '' }, { new: true });
  res.json(vendor);
};

const suspendVendor = async (req, res) => {
  const { reason } = req.body;
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, { isSuspended: true, suspendedReason: reason || '' }, { new: true });
  res.json(vendor);
};

const unsuspendVendor = async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, { isSuspended: false, suspendedReason: '' }, { new: true });
  res.json(vendor);
};

const getRiders = async (req, res) => {
  const { status, state, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status === 'pending') { filter.isApproved = false; filter.isSuspended = false; }
  else if (status === 'approved') filter.isApproved = true;
  else if (status === 'suspended') filter.isSuspended = true;
  if (state) filter.state = state;

  const total = await Rider.countDocuments(filter);
  const riders = await Rider.find(filter)
    .populate('userId', 'name email phone profileImage')
    .skip((page - 1) * limit).limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ riders, total });
};

const approveRider = async (req, res) => {
  const rider = await Rider.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  res.json(rider);
};

const suspendRider = async (req, res) => {
  const { reason } = req.body;
  const rider = await Rider.findByIdAndUpdate(req.params.id, { isSuspended: true }, { new: true });
  await User.findByIdAndUpdate(rider.userId, { isSuspended: true, suspendedReason: reason || '' });
  res.json(rider);
};

const unsuspendRider = async (req, res) => {
  const rider = await Rider.findByIdAndUpdate(req.params.id, { isSuspended: false }, { new: true });
  await User.findByIdAndUpdate(rider.userId, { isSuspended: false, suspendedReason: '' });
  res.json(rider);
};

const getConsumers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = { role: 'consumer' };
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const total = await User.countDocuments(filter);
  const consumers = await User.find(filter)
    .select('-passwordHash')
    .skip((page - 1) * limit).limit(Number(limit))
    .sort({ createdAt: -1 });

  const consumerIds = consumers.map((c) => c._id);
  const orderStats = await Order.aggregate([
    { $match: { consumerId: { $in: consumerIds } } },
    { $group: { _id: '$consumerId', totalOrders: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
  ]);

  const statsMap = {};
  orderStats.forEach((s) => { statsMap[s._id.toString()] = s; });

  const result = consumers.map((c) => ({
    ...c.toObject(),
    totalOrders: statsMap[c._id.toString()]?.totalOrders || 0,
    totalSpent: statsMap[c._id.toString()]?.totalSpent || 0,
  }));

  res.json({ consumers: result, total });
};

const suspendConsumer = async (req, res) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: true, suspendedReason: reason || '' }, { new: true }).select('-passwordHash');
  res.json(user);
};

const unsuspendConsumer = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false, suspendedReason: '' }, { new: true }).select('-passwordHash');
  res.json(user);
};

const getAllOrders = async (req, res) => {
  const { state, status, paymentStatus, vendor, page = 1, limit = 20, from, to } = req.query;
  const filter = {};
  if (state) filter.state = state;
  if (status) filter.orderStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (vendor) filter.vendorId = vendor;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('consumerId', 'name phone')
    .populate('vendorId', 'businessName state')
    .populate('riderId', 'name phone')
    .skip((page - 1) * limit).limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ orders, total });
};

const overrideOrderStatus = async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: status }, { new: true });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
};

const getPayments = async (req, res) => {
  const { state, status, from, to, page = 1, limit = 20 } = req.query;
  const filter = { paymentStatus: { $ne: 'pending' } };
  if (state) filter.state = state;
  if (status) filter.paymentStatus = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('consumerId', 'name email')
    .populate('vendorId', 'businessName')
    .skip((page - 1) * limit).limit(Number(limit))
    .sort({ createdAt: -1 });

  const revenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, gross: { $sum: '$totalAmount' } } },
  ]);

  res.json({ orders, total, grossRevenue: revenue[0]?.gross || 0 });
};

const exportPaymentsCSV = async (req, res) => {
  const orders = await Order.find({ paymentStatus: { $ne: 'pending' } })
    .populate('consumerId', 'name email')
    .populate('vendorId', 'businessName')
    .sort({ createdAt: -1 });

  const rows = [
    ['Reference', 'Consumer', 'Vendor', 'Amount', 'Delivery Fee', 'Payment Status', 'Channel', 'State', 'Date'],
    ...orders.map((o) => [
      o.paymentRef, o.consumerId?.name, o.vendorId?.businessName,
      o.totalAmount, o.deliveryFee, o.paymentStatus, o.paymentChannel, o.state,
      new Date(o.createdAt).toISOString(),
    ]),
  ];

  const csv = rows.map((r) => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
  res.send(csv);
};

const getReviews = async (req, res) => {
  const { flagged, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (flagged === 'true') filter.isFlagged = true;

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('consumerId', 'name profileImage')
    .skip((page - 1) * limit).limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ reviews, total });
};

const deleteReview = async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ message: 'Review deleted' });
};

const getPromotions = async (req, res) => {
  const promos = await Promotion.find().sort({ createdAt: -1 });
  res.json(promos);
};

const createPromotion = async (req, res) => {
  const promo = await Promotion.create({
    ...req.body,
    createdBy: req.user._id,
    image: req.file ? req.file.path : '',
  });
  res.status(201).json(promo);
};

const updatePromotion = async (req, res) => {
  const promo = await Promotion.findByIdAndUpdate(req.params.id, { ...req.body, ...(req.file && { image: req.file.path }) }, { new: true });
  res.json(promo);
};

const deletePromotion = async (req, res) => {
  await Promotion.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

const getSettings = async (req, res) => {
  const settings = await Settings.findOne();
  res.json(settings);
};

const updateSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = new Settings();
  Object.assign(settings, req.body);
  await settings.save();
  res.json(settings);
};

module.exports = {
  getStats, getVendors, approveVendor, suspendVendor, unsuspendVendor,
  getRiders, approveRider, suspendRider, unsuspendRider,
  getConsumers, suspendConsumer, unsuspendConsumer,
  getAllOrders, overrideOrderStatus,
  getPayments, exportPaymentsCSV,
  getReviews, deleteReview,
  getPromotions, createPromotion, updatePromotion, deletePromotion,
  getSettings, updateSettings,
};
