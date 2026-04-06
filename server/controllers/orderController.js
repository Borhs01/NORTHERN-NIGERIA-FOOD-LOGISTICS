const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const Rider = require('../models/Rider');
const Settings = require('../models/Settings');

const placeOrder = async (req, res) => {
  const { vendorId, items, deliveryAddress, deliveryAddressDetails, deliveryLga, state, deliveryFee: clientDeliveryFee } = req.body;

  const vendor = await Vendor.findById(vendorId);
  if (!vendor || !vendor.isOpen) return res.status(400).json({ message: 'Vendor is not available' });

  // Use the delivery fee from the client if provided (calculated with surge/peak pricing)
  // Otherwise, fall back to default settings
  let deliveryFee = clientDeliveryFee;
  
  if (!deliveryFee) {
    const settings = await Settings.findOne();
    deliveryFee = vendor.deliveryFee;
    if (settings) {
      const stateFees = settings.deliveryFees.find((s) => s.state === state);
      if (stateFees) {
        const lgaFee = stateFees.lgas.find((l) => l.lga === deliveryLga);
        if (lgaFee) deliveryFee = lgaFee.fee;
      }
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
    deliveryAddressDetails,
    deliveryLga,
    state,
  });

  req.app.get('io').to(`vendor_${vendorId}`).emit('new_order', order);

  res.status(201).json(order);
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('consumerId', 'name phone')
      .populate('vendorId', 'businessName address logo coordinates')
      .populate('riderId', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
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

    const orders = await Order.find({ orderStatus: 'ready_for_pickup', riderId: null, paymentStatus: 'paid' })
      .populate('vendorId', 'businessName address lga state')
      .sort({ createdAt: 1 });
    
    // Also get stats for debugging
    const allOrders = await Order.countDocuments();
    const readyOrders = await Order.countDocuments({ orderStatus: 'ready_for_pickup', riderId: null, paymentStatus: 'paid' });
    const confirmedOrders = await Order.countDocuments({ orderStatus: 'confirmed', paymentStatus: 'paid' });
    
    console.log(`📊 Order Stats: Total=${allOrders}, Ready for pickup=${readyOrders}, Confirmed (waiting to be prepared)=${confirmedOrders}`);
    
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

    // Get current deliveries (assigned to rider and not completed)
    const currentDeliveries = await Order.find({ 
      riderId: req.user._id, 
      orderStatus: { $in: ['ready_for_pickup', 'on_the_way', 'arrived'] }
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
  io.to(`tracking:${order._id}`).emit('rider:status-changed', { status, timestamp: new Date() });
  if (riderId) io.to(`tracking:${order._id}`).emit('rider_assigned', { riderId });

  res.json(order);
};

module.exports = { placeOrder, getOrderById, getConsumerOrders, getVendorOrders, getAvailableDeliveries, getRiderDeliveries, updateOrderStatus };
