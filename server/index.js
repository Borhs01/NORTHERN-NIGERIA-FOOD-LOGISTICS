require('dotenv').config();
require('express-async-errors');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/items', require('./routes/items'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/riders', require('./routes/riders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/pricing', require('./routes/pricing'));

app.get('/', (req, res) => res.json({ 
  status: 'ok', 
  app: 'NorthEats API',
  version: '1.0.0',
  endpoints: {
    health: '/api/health',
    auth: '/api/auth',
    vendors: '/api/vendors',
    items: '/api/items',
    orders: '/api/orders',
    payments: '/api/payments',
    reviews: '/api/reviews',
    riders: '/api/riders',
    admin: '/api/admin',
    locations: '/api/locations'
  }
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'NorthEats API' }));

const Order = require('./models/Order');
const OrderLocationHistory = require('./models/OrderLocationHistory');

io.on('connection', (socket) => {
  socket.on('join_order', (orderId) => socket.join(`order_${orderId}`));
  socket.on('join_vendor', (vendorId) => socket.join(`vendor_${vendorId}`));
  socket.on('leave_order', (orderId) => socket.leave(`order_${orderId}`));

  // Customer joins tracking room
  socket.on('customer:join-tracking', (orderId) => {
    socket.join(`tracking:${orderId}`);
    console.log(`Customer joined tracking for order ${orderId}`);
  });

  // Rider joins delivery room and sends customer location
  socket.on('rider:join-delivery', async (orderId) => {
    socket.join(`tracking:${orderId}`);
    try {
      const order = await Order.findById(orderId).populate('vendorId', 'address coordinates');
      if (order) {
        socket.emit('rider:customer-location', {
          customerLat: order.deliveryAddressDetails?.lat,
          customerLng: order.deliveryAddressDetails?.lng,
          customerAddress: order.deliveryAddress,
          vendorLat: order.vendorId?.coordinates?.lat,
          vendorLng: order.vendorId?.coordinates?.lng,
          vendorAddress: order.vendorId?.address,
        });
      }
    } catch (error) {
      console.error('Error joining delivery:', error);
    }
  });

  // Rider sends location update
  socket.on('rider:update-location', async ({ orderId, lat, lng, status }) => {
    try {
      // Save location history
      await OrderLocationHistory.create({
        orderId,
        riderLocation: { lat, lng },
        status: status || 'on_the_way',
      });

      // Broadcast to order room
      io.to(`tracking:${orderId}`).emit('rider:location-update', {
        lat,
        lng,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error updating rider location:', error);
    }
  });

  // Rider updates delivery status
  socket.on('rider:update-status', async ({ orderId, status }) => {
    try {
      // Update order status
      await Order.findByIdAndUpdate(orderId, { status });

      // Save location history with new status
      const rider = await Order.findById(orderId).populate('riderId', 'phone name profileImage vehiclePlate');
      if (rider && rider.riderId?.coordinates) {
        await OrderLocationHistory.create({
          orderId,
          riderLocation: rider.riderId.coordinates,
          status,
        });
      }

      // Broadcast status change
      io.to(`tracking:${orderId}`).emit('rider:status-changed', {
        status,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  });

  socket.on('disconnect', () => {});
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`NorthEats server running on port ${PORT}`));
