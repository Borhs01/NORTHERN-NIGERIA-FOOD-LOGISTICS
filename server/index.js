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
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.PROD_CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
};

const io = new Server(server, { cors: corsOptions });

app.set('io', io);

app.use(cors(corsOptions));
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

io.on('connection', (socket) => {
  socket.on('join_order', (orderId) => socket.join(`order_${orderId}`));
  socket.on('join_vendor', (vendorId) => socket.join(`vendor_${vendorId}`));
  socket.on('leave_order', (orderId) => socket.leave(`order_${orderId}`));

  socket.on('rider_location_update', ({ orderId, lat, lng }) => {
    io.to(`order_${orderId}`).emit('rider_location', { lat, lng });
  });

  socket.on('disconnect', () => {});
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`NorthEats server running on port ${PORT}`));
