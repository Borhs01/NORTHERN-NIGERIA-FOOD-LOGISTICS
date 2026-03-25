const express = require('express');
const router = express.Router();
const { getVendorItems, createItem, updateItem, deleteItem } = require('../controllers/itemController');
const { isVendor } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/vendor/:vendorId', getVendorItems);
router.post('/', ...isVendor, upload.single('image'), createItem);
router.patch('/:id', ...isVendor, upload.single('image'), updateItem);
router.delete('/:id', ...isVendor, deleteItem);

module.exports = router;
