const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const Rider = require('../models/Rider');
const Settings = require('../models/Settings');

const placeOrder = async (req, res) => {
  const { vendorId, items, deliveryAddress, deliveryLga, state } = req.body;

  const vendor = await Vendor.findById(vendorId);
  if (!vendor || !vendor.isOpen) return res.status(400).json({ message: 'Vendor is not available' });

  const settings = await Settings.findOne();
  let deliveryFee = vendor.deliveryFee;
  if (settings) {
    const stateFees = settings.deliveryFees.find((s) => s.state === state);
    if (stateFees) {
      const lgaFee = stateFees.lgas.find((l) => l.lga === deliveryLga);
      if (lgaFee) deliveryFee = lgaFee.fee;
    }
  }

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
  const totalAmount = subtotal + deliveryFee;

  const order = await Order.create({
    consumerId: req.user._id,
    vendorId,
    items,
    subtotal,
    deliveryFee,
    totalAmount,
    deliveryAddress,
    deliveryLga,
    state,
  });

  req.app.get('io').to(`vendor_${vendorId}`).emit('new_order', order);

  res.status(201).json(order);
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('consumerId', 'name phone')
    .populate('vendorId', 'businessName address logo')
    .populate('riderId', 'name phone');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
};

const getConsumerOrders = async (req, res) => {
  const orders = await Order.find({ consumerId: req.user._id })
    .populate('vendorId', 'businessName logo')
    .sort({ createdAt: -1 });
  res.json(orders);
};

const getVendorOrders = async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  const orders = await Order.find({ vendorId: vendor._id })
    .populate('consumerId', 'name phone')
    .sort({ createdAt: -1 });
  res.json(orders);
};

const getAvailableDeliveries = async (req, res) => {
  try {
    const rider = await Rider.findOne({ userId: req.user._id });
    
    // Check if rider is approved
    if (!rider || !rider.isApproved) {
      return res.status(403).json({ 
        message: 'Your rider profile is not approved yet. Please wait for admin approval.',
        code: 'RIDER_NOT_APPROVED'
      });
    }

    // Check if rider is suspended
    if (rider.isSuspended) {
      return res.status(403).json({ 
        message: 'Your account has been suspended. Please contact support.',
        code: 'RIDER_SUSPENDED'
      });
    }

    const orders = await Order.find({ orderStatus: 'ready', riderId: null, paymentStatus: 'paid' })
      .populate('vendorId', 'businessName address lga state')
      .sort({ createdAt: 1 });
    
    // Also get stats for debugging
    const allOrders = await Order.countDocuments();
    const readyOrders = await Order.countDocuments({ orderStatus: 'ready', riderId: null, paymentStatus: 'paid' });
    const confirmedOrders = await Order.countDocuments({ orderStatus: 'confirmed', paymentStatus: 'paid' });
    
    console.log(`📊 Order Stats: Total=${allOrders}, Ready for delivery=${readyOrders}, Confirmed (waiting to be prepared)=${confirmedOrders}`);
    
    res.json(orders);
  } catch (error) {
    console.error('Get available deliveries error:', error);
    res.status(500).json({ message: 'Failed to fetch available deliveries' });
  }
};

const getRiderDeliveries = async (req, res) => {
  try {
    const rider = await Rider.findOne({ userId: req.user._id });
    
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Get current deliveries (picked_up status)
    const currentDeliveries = await Order.find({ 
      riderId: req.user._id, 
      orderStatus: 'picked_up' 
    })
    .populate('consumerId', 'name phone')
    .populate('vendorId', 'businessName address lga state')
    .sort({ createdAt: -1 });

    res.json(currentDeliveries);
  } catch (error) {
    console.error('Get rider deliveries error:', error);
    res.status(500).json({ message: 'Failed to load deliveries' });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status, riderId } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.orderStatus = status;
  if (riderId) order.riderId = riderId;
  await order.save();

  const io = req.app.get('io');
  io.to(`order_${order._id}`).emit('order_status_update', { orderId: order._id, status });
  if (riderId) io.to(`order_${order._id}`).emit('rider_assigned', { riderId });

  res.json(order);
};

module.exports = { placeOrder, getOrderById, getConsumerOrders, getVendorOrders, getAvailableDeliveries, getRiderDeliveries, updateOrderStatus };
