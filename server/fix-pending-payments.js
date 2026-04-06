require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('./models/Order');
const Vendor = require('./models/Vendor');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

async function fixPendingPayments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    const pendingOrders = await Order.find({ paymentStatus: 'pending' });
    console.log(`Found ${pendingOrders.length} pending payments to fix`);

    for (const order of pendingOrders) {
      try {
        console.log(`Processing order ${order._id} with ref: ${order.paymentRef}`);

        if (!order.paymentRef) {
          console.log(`Order ${order._id} has no payment reference - skipping`);
          continue;
        }

        // Verify payment with Paystack
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${order.paymentRef}`, {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        });

        const data = response.data.data;

        if (data.status === 'success') {
          // Update order status
          order.paymentStatus = 'paid';
          order.paymentChannel = data.channel;
          order.orderStatus = 'confirmed';
          await order.save();

          // Update vendor stats
          await Vendor.findByIdAndUpdate(order.vendorId, {
            $inc: { totalOrders: 1, totalRevenue: order.totalAmount },
          });

          console.log(`✅ Order ${order._id} payment verified and updated to paid`);
        } else {
          console.log(`❌ Order ${order._id} payment not successful (status: ${data.status})`);
        }
      } catch (error) {
        console.error(`Error processing order ${order._id}:`, error.message);
      }
    }

    console.log('Finished processing all pending payments');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPendingPayments();