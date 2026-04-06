const toRadians = (degrees) => degrees * (Math.PI / 180);

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const estimateDeliveryTime = (distanceKm) => {
  const averageSpeedKmh = 25;
  const estimatedMinutes = Math.round((distanceKm / averageSpeedKmh) * 60);
  return Math.max(15, estimatedMinutes);
};

const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'NorthEats/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocode request failed with status ${response.status}`);
  }

  const result = await response.json();
  return {
    address: result.display_name || '',
    components: result.address || {},
  };
};

const geocodeAddress = async (address, state) => {
  // Geocode address to get coordinates
  const query = `${address}, ${state}, Nigeria`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ng`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'NorthEats/1.0',
      },
    });

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    if (data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

module.exports = {
  calculateDistance,
  estimateDeliveryTime,
  reverseGeocode,
  geocodeAddress,
};
