const Review = require('../models/Review');
const Vendor = require('../models/Vendor');
const Rider = require('../models/Rider');
const Order = require('../models/Order');

const createReview = async (req, res) => {
  const { orderId, targetId, targetType, rating, comment } = req.body;

  const order = await Order.findById(orderId);
  if (!order || order.consumerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  if (order.isReviewed) return res.status(400).json({ message: 'Already reviewed' });

  const isFlagged = rating < 2;
  const review = await Review.create({
    orderId, consumerId: req.user._id, targetId, targetType, rating, comment, isFlagged,
  });

  order.isReviewed = true;
  await order.save();

  const reviews = await Review.find({ targetId, targetType });
  const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  if (targetType === 'vendor') await Vendor.findByIdAndUpdate(targetId, { averageRating: avg.toFixed(1) });
  if (targetType === 'rider') await Rider.findByIdAndUpdate(targetId, { averageRating: avg.toFixed(1) });

  res.status(201).json(review);
};

const getVendorReviews = async (req, res) => {
  const reviews = await Review.find({ targetId: req.params.id, targetType: 'vendor' })
    .populate('consumerId', 'name profileImage')
    .sort({ createdAt: -1 });
  res.json(reviews);
};

module.exports = { createReview, getVendorReviews };
