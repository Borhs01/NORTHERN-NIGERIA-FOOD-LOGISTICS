const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/stats', ...isAdmin, admin.getStats);

router.get('/vendors', ...isAdmin, admin.getVendors);
router.patch('/vendors/:id/approve', ...isAdmin, admin.approveVendor);
router.patch('/vendors/:id/suspend', ...isAdmin, admin.suspendVendor);
router.patch('/vendors/:id/unsuspend', ...isAdmin, admin.unsuspendVendor);

router.get('/riders', ...isAdmin, admin.getRiders);
router.patch('/riders/:id/approve', ...isAdmin, admin.approveRider);
router.patch('/riders/:id/suspend', ...isAdmin, admin.suspendRider);
router.patch('/riders/:id/unsuspend', ...isAdmin, admin.unsuspendRider);

router.get('/consumers', ...isAdmin, admin.getConsumers);
router.patch('/consumers/:id/suspend', ...isAdmin, admin.suspendConsumer);
router.patch('/consumers/:id/unsuspend', ...isAdmin, admin.unsuspendConsumer);

router.get('/orders', ...isAdmin, admin.getAllOrders);
router.patch('/orders/:id/status', ...isAdmin, admin.overrideOrderStatus);

router.get('/payments', ...isAdmin, admin.getPayments);
router.get('/payments/export', ...isAdmin, admin.exportPaymentsCSV);

router.get('/reviews', ...isAdmin, admin.getReviews);
router.delete('/reviews/:id', ...isAdmin, admin.deleteReview);

router.get('/promotions', ...isAdmin, admin.getPromotions);
router.post('/promotions', ...isAdmin, upload.single('image'), admin.createPromotion);
router.patch('/promotions/:id', ...isAdmin, upload.single('image'), admin.updatePromotion);
router.delete('/promotions/:id', ...isAdmin, admin.deletePromotion);

router.get('/settings', ...isAdmin, admin.getSettings);
router.patch('/settings', ...isAdmin, admin.updateSettings);

module.exports = router;
