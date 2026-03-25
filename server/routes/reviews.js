const express = require('express');
const router = express.Router();
const { createReview, getVendorReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/vendor/:id', getVendorReviews);

module.exports = router;
