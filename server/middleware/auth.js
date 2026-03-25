const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select('-passwordHash');
  if (!req.user || req.user.isSuspended) {
    return res.status(401).json({ message: 'Account suspended or not found' });
  }
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

const isAdmin = [protect, authorize('admin')];
const isVendor = [protect, authorize('vendor', 'admin')];
const isRider = [protect, authorize('rider', 'admin')];
const isConsumer = [protect, authorize('consumer', 'admin')];

module.exports = { protect, authorize, isAdmin, isVendor, isRider, isConsumer };
