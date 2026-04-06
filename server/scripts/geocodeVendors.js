const mongoose = require('mongoose');
require('dotenv').config();
const Vendor = require('../models/Vendor');
const { geocodeAddress } = require('../utils/location');

const geocodeExistingVendors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/northeats', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all vendors with invalid coordinates (0,0) or missing coordinates
    const vendors = await Vendor.find({
      $or: [
        { 'coordinates.lat': 0, 'coordinates.lng': 0 },
        { coordinates: { $exists: false } },
      ],
    });

    console.log(`Found ${vendors.length} vendors to geocode`);

    let geocodedCount = 0;
    let failedCount = 0;

    for (const vendor of vendors) {
      try {
        console.log(`\nGeocoding vendor: ${vendor.businessName} at ${vendor.address}, ${vendor.state}`);
        
        const coordinates = await geocodeAddress(vendor.address, vendor.state);
        
        if (coordinates) {
          vendor.coordinates = coordinates;
          await vendor.save();
          geocodedCount++;
          console.log(`✓ Geocoded: ${vendor.businessName} -> Lat: ${coordinates.lat}, Lng: ${coordinates.lng}`);
        } else {
          failedCount++;
          console.log(`✗ Failed: Could not geocode ${vendor.businessName}`);
        }
      } catch (error) {
        failedCount++;
        console.error(`✗ Error geocoding ${vendor.businessName}:`, error.message);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n\n=== Results ===`);
    console.log(`Successfully geocoded: ${geocodedCount}`);
    console.log(`Failed: ${failedCount}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

geocodeExistingVendors();
