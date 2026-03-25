const axios = require('axios');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const initiatePayment = async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId).populate('consumerId', 'email name');
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email: order.consumerId.email || `${order.consumerId._id}@northeats.com`,
      amount: order.totalAmount * 100,
      reference: `NE-${orderId}-${Date.now()}`,
      metadata: { orderId: orderId.toString(), userId: req.user._id.toString() },
      callback_url: `${process.env.CLIENT_URL}/orders/${orderId}`,
    },
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
  );

  order.paymentRef = response.data.data.reference;
  await order.save();

  res.json({ authorizationUrl: response.data.data.authorization_url, reference: response.data.data.reference });
};

const verifyPayment = async (req, res) => {
  const { reference } = req.body;
  const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });

  const data = response.data.data;
  if (data.status !== 'success') return res.status(400).json({ message: 'Payment not successful' });

  const order = await Order.findOne({ paymentRef: reference });
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.paymentStatus = 'paid';
  order.paymentChannel = data.channel;
  order.orderStatus = 'confirmed';
  await order.save();

  await Vendor.findByIdAndUpdate(order.vendorId, {
    $inc: { totalOrders: 1, totalRevenue: order.totalAmount },
  });

  req.app.get('io').to(`vendor_${order.vendorId}`).emit('order_confirmed', { orderId: order._id });
  req.app.get('io').to(`order_${order._id}`).emit('order_status_update', { orderId: order._id, status: 'confirmed' });

  res.json({ message: 'Payment verified', order });
};

const refundPayment = async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);
  if (!order || !order.paymentRef) return res.status(404).json({ message: 'Order not found' });

  const response = await axios.post(
    'https://api.paystack.co/refund',
    { transaction: order.paymentRef },
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
  );

  if (response.data.status) {
    order.paymentStatus = 'refunded';
    order.orderStatus = 'cancelled';
    await order.save();
  }

  res.json({ message: 'Refund initiated', data: response.data });
};

module.exports = { initiatePayment, verifyPayment, refundPayment };
