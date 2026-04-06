const mongoose = require('mongoose');
require('dotenv').config();
const Vendor = require('../models/Vendor');

const updateVendorCoordinates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/northeats', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Jos coordinates (approximate center of Jos, Nigeria)
    const josCoordinates = {
      lat: 9.9265,
      lng: 11.8902,
    };

    // Update all vendors with invalid coordinates
    const result = await Vendor.updateMany(
      {
        $or: [
          { 'coordinates.lat': 0, 'coordinates.lng': 0 },
          { coordinates: { $exists: false } },
        ],
      },
      {
        $set: { coordinates: josCoordinates },
      }
    );

    console.log('\n=== Update Results ===');
    console.log(`Matched vendors: ${result.matchedCount}`);
    console.log(`Modified vendors: ${result.modifiedCount}`);
    console.log(`New coordinates set: Lat ${josCoordinates.lat}, Lng ${josCoordinates.lng}`);

    // Show all vendors after update
    const vendors = await Vendor.find({}, { businessName: 1, address: 1, coordinates: 1 }).lean();
    console.log('\n=== All Vendors After Update ===');
    vendors.forEach((v) => {
      console.log(`\n${v.businessName}`);
      console.log(`  Address: ${v.address}`);
      console.log(`  Coordinates: Lat ${v.coordinates.lat}, Lng ${v.coordinates.lng}`);
    });

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateVendorCoordinates();
