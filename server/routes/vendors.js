const express = require('express');
const router = express.Router();
const { getVendors, getNearbyVendors, getVendorById, createVendor, updateVendor, toggleOpen } = require('../controllers/vendorController');
const { isVendor, protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/', getVendors);
router.get('/nearby', getNearbyVendors);
router.get('/:id', getVendorById);
router.post('/', ...isVendor, createVendor);
router.patch('/:id', ...isVendor, upload.single('image'), updateVendor);
router.patch('/:id/toggle-open', ...isVendor, toggleOpen);

module.exports = router;
