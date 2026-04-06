const express = require('express');
const router = express.Router();
const {
  placeOrder, getOrderById, getConsumerOrders, getVendorOrders,
  getAvailableDeliveries, getRiderDeliveries, updateOrderStatus
} = require('../controllers/orderController');
const { getTomTomRoute } = require('../services/routingProvider');
const { protect, isVendor, isRider } = require('../middleware/auth');

router.post('/', protect, placeOrder);

// Specific routes MUST come before generic /:id routes
router.get('/consumer/me', protect, getConsumerOrders);
router.get('/vendor/me', ...isVendor, getVendorOrders);
router.get('/rider/available', ...isRider, getAvailableDeliveries);
router.get('/rider/me', ...isRider, getRiderDeliveries);

// Routing endpoint - proxy TomTom requests (BEFORE /:id route!)
router.post('/routing/calculate-route', async (req, res) => {
  try {
    const { startPoint, endPoint, routeType } = req.body;

    if (!startPoint || !endPoint) {
      return res.status(400).json({ message: 'Missing startPoint or endPoint' });
    }

    const route = await getTomTomRoute(startPoint, endPoint, routeType);
    res.json(route);
  } catch (error) {
    console.error('Routing error:', error);
    res.status(500).json({ message: error.message || 'Failed to calculate route' });
  }
});

// Generic ID-based routes (these must come LAST)
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);

module.exports = router;
