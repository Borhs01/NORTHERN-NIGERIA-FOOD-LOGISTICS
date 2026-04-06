const express = require('express');
const router = express.Router();
const { calculateDeliveryFee } = require('../controllers/pricingController');

router.post('/calculate-delivery-fee', calculateDeliveryFee);

module.exports = router;
