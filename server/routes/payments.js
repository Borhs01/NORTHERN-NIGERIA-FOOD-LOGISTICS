const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment, refundPayment } = require('../controllers/paymentController');
const { protect, isAdmin } = require('../middleware/auth');

router.post('/initiate', protect, initiatePayment);
router.post('/verify', protect, verifyPayment); // Restore authentication
router.post('/refund/:orderId', ...isAdmin, refundPayment);

module.exports = router;
