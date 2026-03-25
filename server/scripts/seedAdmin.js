require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Settings = require('../models/Settings');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }

  await User.create({
    name: 'NorthEats Admin',
    email: process.env.ADMIN_EMAIL,
    passwordHash: process.env.ADMIN_PASSWORD,
    role: 'admin',
    isVerified: true,
    isActive: true,
  });

  await Settings.create({
    commissionRate: 10,
    supportPhone: '+234 800 000 0000',
    supportEmail: 'support@northeats.com',
    deliveryFees: [
      {
        state: 'plateau',
        lgas: [
          { lga: 'Jos North', fee: 500 },
          { lga: 'Jos South', fee: 500 },
          { lga: 'Bukuru', fee: 600 },
          { lga: 'Barkin Ladi', fee: 800 },
          { lga: 'Pankshin', fee: 1000 },
        ],
      },
      {
        state: 'bauchi',
        lgas: [
          { lga: 'Bauchi Metro', fee: 500 },
          { lga: 'Azare', fee: 700 },
          { lga: 'Misau', fee: 800 },
        ],
      },
      {
        state: 'kaduna',
        lgas: [
          { lga: 'Kaduna North', fee: 500 },
          { lga: 'Kaduna South', fee: 500 },
          { lga: 'Zaria', fee: 600 },
          { lga: 'Kafanchan', fee: 900 },
        ],
      },
    ],
    coverageStates: [
      {
        name: 'plateau',
        lgas: ['Jos North', 'Jos South', 'Bukuru', 'Barkin Ladi', 'Pankshin'],
      },
      {
        name: 'bauchi',
        lgas: ['Bauchi Metro', 'Azare', 'Misau', 'Katagum', 'Dass'],
      },
      {
        name: 'kaduna',
        lgas: ['Kaduna North', 'Kaduna South', 'Zaria', 'Kafanchan', 'Soba', 'Birnin Gwari'],
      },
    ],
  });

  console.log('Admin seeded successfully:', process.env.ADMIN_EMAIL);
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
