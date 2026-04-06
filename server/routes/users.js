const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { saveLocation, getLocation } = require('../controllers/userController');

router.post('/location', protect, saveLocation);
router.get('/location', protect, getLocation);

module.exports = router;
