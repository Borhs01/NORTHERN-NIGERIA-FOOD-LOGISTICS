require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const FoodItem = require('../models/FoodItem');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const vendorUser = await User.findOne({ email: 'gwari@gmail.com' });
  if (!vendorUser) {
    console.error('Vendor user not found for email gwari@gmail.com');
    process.exit(1);
  }

  const vendor = await Vendor.findOne({ userId: vendorUser._id });
  if (!vendor) {
    console.error('Vendor profile not found for user gwari@gmail.com');
    process.exit(1);
  }

  const items = [
    {
      vendorId: vendor._id,
      name: 'Gwari Special Jollof Rice',
      description: 'Rich tomato-based jollof with smoked chicken and mixed veggies.',
      price: 2500,
      image: 'https://example.com/images/gwari-jollof.jpg',
      category: 'Rice',
      tags: ['spicy', 'best-seller'],
      isAvailable: true,
      isPopular: true,
    },
    {
      vendorId: vendor._id,
      name: 'Suya Beef Platter',
      description: 'Tender grilled beef skewers with house suya spice.',
      price: 2800,
      image: 'https://example.com/images/gwari-suya.jpg',
      category: 'Grill',
      tags: ['protein', 'spicy'],
      isAvailable: true,
      isPopular: true,
    },
    {
      vendorId: vendor._id,
      name: 'Peppered Fish',
      description: 'Crispy peppered tilapia served with fried plantain.',
      price: 3200,
      image: 'https://example.com/images/gwari-peppered-fish.jpg',
      category: 'Seafood',
      tags: ['hot', 'light'],
      isAvailable: true,
      isPopular: false,
    },
    {
      vendorId: vendor._id,
      name: 'Fried Rice with Shrimps',
      description: 'Colorful fried rice with juicy shrimps and veggies.',
      price: 2700,
      image: 'https://example.com/images/gwari-fried-rice.jpg',
      category: 'Rice',
      tags: ['seafood', 'favorite'],
      isAvailable: true,
      isPopular: true,
    },
    {
      vendorId: vendor._id,
      name: 'Chicken Afang Soup',
      description: 'Traditional Afang soup with tender chicken and fufu.',
      price: 3100,
      image: 'https://example.com/images/gwari-afang.jpg',
      category: 'Soup',
      tags: ['authentic', 'garnished'],
      isAvailable: true,
      isPopular: false,
    },
    {
      vendorId: vendor._id,
      name: 'Beef Stew with Eba',
      description: 'Hearty stew with soft eba and tender beef chunks.',
      price: 2600,
      image: 'https://example.com/images/gwari-beef-stew.jpg',
      category: 'Swallow',
      tags: ['filling', 'comfort'],
      isAvailable: true,
      isPopular: false,
    },
  ];

  const existingCount = await FoodItem.countDocuments({ vendorId: vendor._id });
  if (existingCount > 0) {
    console.log(`Vendor already has ${existingCount} menu items; skipping insertion.`);
    process.exit(0);
  }

  await FoodItem.create(items);

  console.log(`Seeded ${items.length} menu items for vendor gwari@gmail.com (vendorId: ${vendor._id}).`);
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
