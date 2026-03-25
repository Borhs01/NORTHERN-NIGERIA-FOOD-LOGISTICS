const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Rider = require('../models/Rider');

const generateTokens = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { token, refreshToken };
};

const register = async (req, res) => {
  const { name, email, phone, password, role, state, lga, address, businessName, vehicleType } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) return res.status(400).json({ message: 'User already exists with this email or phone' });

  const allowedRoles = ['consumer', 'vendor', 'rider'];
  if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: password,
    role,
    state,
    lga,
    address,
    isVerified: true,
  });

  if (role === 'vendor') {
    const vendorAddress = address || user.address || '';
    if (!vendorAddress) {
      // Delete user if vendor creation would fail
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({ message: 'Vendor address is required' });
    }

    try {
      await Vendor.create({
        userId: user._id,
        businessName: businessName || name,
        state,
        lga,
        address: vendorAddress,
      });
    } catch (vendorError) {
      // Delete user if vendor profile creation fails
      await User.findByIdAndDelete(user._id);
      console.error('Vendor creation error:', vendorError);
      return res.status(400).json({ 
        message: 'Failed to create vendor profile. Please ensure all fields are correct.',
        error: vendorError.message
      });
    }
  }

  if (role === 'rider') {
    await Rider.create({
      userId: user._id,
      vehicleType: vehicleType || 'bike',
      state,
      lga,
    });
  }

  const { token, refreshToken } = generateTokens(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      state: user.state,
    },
  });
};

const login = async (req, res) => {
  const { email, phone, password } = req.body;
  const user = await User.findOne(email ? { email } : { phone });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.isSuspended) return res.status(403).json({ message: 'Account suspended. Contact support.' });

  const { token, refreshToken } = generateTokens(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  let profile = null;
  if (user.role === 'vendor') profile = await Vendor.findOne({ userId: user._id });
  if (user.role === 'rider') profile = await Rider.findOne({ userId: user._id });

  res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      state: user.state,
      profileImage: user.profileImage,
      profile,
    },
  });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) return res.status(401).json({ message: 'Invalid token' });

  const tokens = generateTokens(user._id);

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ token: tokens.token });
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};

const getMe = async (req, res) => {
  const user = req.user;
  let profile = null;
  if (user.role === 'vendor') profile = await Vendor.findOne({ userId: user._id });
  if (user.role === 'rider') profile = await Rider.findOne({ userId: user._id });
  res.json({ ...user.toObject(), profile });
};

module.exports = { register, login, refresh, logout, getMe };
