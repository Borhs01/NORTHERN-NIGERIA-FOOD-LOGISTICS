const express = require('express');
const router = express.Router();

// Location search endpoint
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 15 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Search using Nominatim (OpenStreetMap)
    const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=ng&format=json&addressdetails=1&limit=${limit}&dedupe=1`;

    console.log('🔍 Searching locations:', searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'NorthEats/1.0'
      },
    });

    if (!response.ok) {
      console.error('❌ Nominatim API error:', {
        status: response.status,
        statusText: response.statusText,
        url: searchUrl
      });

      // Handle specific error cases
      if (response.status === 429) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: response.headers.get('Retry-After')
        });
      }

      if (response.status >= 500) {
        return res.status(502).json({
          success: false,
          message: 'Location service temporarily unavailable. Please try again later.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Location search failed: ${response.statusText}`
      });
    }

    const data = await response.json();

    // Transform results to match our interface
    const results = data.map(result => ({
      placeId: `nominatim_${result.place_id}`,
      displayName: result.display_name,
      fullAddress: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      components: {
        houseNumber: result.address?.house_number,
        streetName: result.address?.road || result.address?.street,
        area: result.address?.hamlet || result.address?.village || result.address?.town,
        city: result.address?.city || result.address?.town,
        state: result.address?.state,
        country: result.address?.country || 'Nigeria',
      },
      provider: 'nominatim',
      confidence: calculateConfidence(result),
    }));

    // Check delivery coverage for each result
    const enhancedResults = await Promise.all(
      results.map(async (location) => {
        const deliveryCoverage = await checkDeliveryCoverage(location);
        return {
          ...location,
          deliveryCoverage,
          formattedAddress: formatAddress(location),
        };
      })
    );

    res.json({
      success: true,
      data: enhancedResults,
      count: enhancedResults.length,
    });

  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search locations',
      error: error.message
    });
  }
});

// Reverse geocoding endpoint
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

    console.log('🔍 Reverse geocoding:', reverseUrl);

    const response = await fetch(reverseUrl, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'NorthEats/1.0'
      },
    });

    if (!response.ok) {
      console.error('❌ Nominatim reverse geocoding error:', {
        status: response.status,
        statusText: response.statusText,
        url: reverseUrl
      });

      // Handle specific error cases
      if (response.status === 429) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: response.headers.get('Retry-After')
        });
      }

      if (response.status >= 500) {
        return res.status(502).json({
          success: false,
          message: 'Location service temporarily unavailable. Please try again later.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Reverse geocoding failed: ${response.statusText}`
      });
    }

    const result = await response.json();

    const location = {
      placeId: `nominatim_${result.place_id}`,
      displayName: result.display_name,
      fullAddress: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      components: {
        houseNumber: result.address?.house_number,
        streetName: result.address?.road || result.address?.street,
        area: result.address?.hamlet || result.address?.village || result.address?.town,
        city: result.address?.city || result.address?.town,
        state: result.address?.state,
        country: result.address?.country || 'Nigeria',
      },
      provider: 'nominatim',
      confidence: calculateConfidence(result),
    };

    const deliveryCoverage = await checkDeliveryCoverage(location);

    res.json({
      success: true,
      data: {
        ...location,
        deliveryCoverage,
        formattedAddress: formatAddress(location),
      }
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse geocode location',
      error: error.message
    });
  }
});

// Helper functions
const calculateConfidence = (result) => {
  let score = 0.5;

  if (result.address?.house_number) score += 0.1;
  if (result.address?.road) score += 0.15;
  if (result.address?.city) score += 0.1;
  if (result.address?.state) score += 0.1;

  if (result.importance) {
    score += result.importance * 0.2;
  }

  return Math.min(score, 1.0);
};

const checkDeliveryCoverage = async (location) => {
  const supportedStates = ['plateau', 'bauchi', 'kaduna'];
  const supportedLGAs = [
    // Plateau
    'Jos North', 'Jos South', 'Bukuru', 'Barkin Ladi', 'Pankshin', 'Shendam', 'Mangu',
    // Bauchi
    'Bauchi Metro', 'Azare', 'Misau', 'Katagum', 'Dass', 'Tafawa Balewa',
    // Kaduna
    'Kaduna North', 'Kaduna South', 'Zaria', 'Kafanchan', 'Soba', 'Birnin Gwari', 'Sabon Gari'
  ];

  const stateSupported = supportedStates.includes(location.components.state?.toLowerCase() || '');
  const lgaSupported = supportedLGAs.some(lga =>
    location.components.area?.toLowerCase().includes(lga.toLowerCase()) ||
    location.fullAddress.toLowerCase().includes(lga.toLowerCase())
  );

  const isSupported = stateSupported || lgaSupported;

  return {
    isSupported,
    supportedStates,
    supportedLGAs,
    estimatedDeliveryTime: isSupported ? '30-45 minutes' : undefined,
    deliveryFee: isSupported ? 500 : undefined,
    message: isSupported
      ? '🚚 Delivery available in this area!'
      : '📍 Location found, but delivery is not yet available here. We\'re expanding soon!',
  };
};

const formatAddress = (location) => {
  const parts = [
    location.components.houseNumber,
    location.components.streetName,
    location.components.area,
    location.components.city,
    location.components.state,
    location.components.country,
  ].filter(Boolean);

  return parts.join(', ');
};

module.exports = router;
