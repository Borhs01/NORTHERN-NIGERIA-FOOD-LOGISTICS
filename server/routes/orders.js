const express = require('express');
const router = express.Router();
const {
  placeOrder, getOrderById, getConsumerOrders, getVendorOrders,
  getAvailableDeliveries, getRiderDeliveries, updateOrderStatus
} = require('../controllers/orderController');
const { protect, isVendor, isRider } = require('../middleware/auth');

router.post('/', protect, placeOrder);
router.get('/consumer/me', protect, getConsumerOrders);
router.get('/vendor/me', ...isVendor, getVendorOrders);
router.get('/rider/available', ...isRider, getAvailableDeliveries);
router.get('/rider/me', ...isRider, getRiderDeliveries);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);

module.exports = router;
