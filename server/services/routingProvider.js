/**
 * TomTom Routing Service Proxy
 * Handles TomTom API calls from backend to avoid CORS issues
 */

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY || '6Gyc0wduwBtbb8RMPh5fen6CkzqQUjXb';
const TOMTOM_BASE_URL = 'https://api.tomtom.com/routing/1/calculateRoute';

/**
 * Fetch route from TomTom API
 * @param {Object} startPoint - {lat, lng}
 * @param {Object} endPoint - {lat, lng}
 * @param {String} routeType - 'fastest' or 'shortest'
 */
const getTomTomRoute = async (startPoint, endPoint, routeType = 'fastest') => {
  try {
    if (!TOMTOM_API_KEY) {
      throw new Error('TomTom API key not configured');
    }

    const { lat: startLat, lng: startLng } = startPoint;
    const { lat: endLat, lng: endLng } = endPoint;

    // TomTom expects format: startLng,startLat:endLng,endLat
    const routePoints = `${startLng},${startLat}:${endLng},${endLat}`;

    const params = new URLSearchParams({
      key: TOMTOM_API_KEY,
      routeType,
      computeTravelTimeFor: 'all',
      traffic: 'true',
      language: 'en-US',
      // Get detailed geometry with all waypoints
      instructionsType: 'text',
    });

    const url = `${TOMTOM_BASE_URL}/${routePoints}.json?${params.toString()}`;

    console.log('🗺️ [Backend] Requesting TomTom route:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('TomTom API error:', errorData);
      throw new Error(
        `TomTom API error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    const route = data.routes[0];
    const summary = route.summary;

    // Extract all coordinates from the route - this gives us the detailed path
    const coordinates = [];
    
    // TomTom returns legs with points array
    if (route.legs && Array.isArray(route.legs)) {
      console.log('📍 [Backend] Processing', route.legs.length, 'legs');
      
      route.legs.forEach((leg, legIndex) => {
        if (leg.points && Array.isArray(leg.points)) {
          console.log(`📍 [Backend] Leg ${legIndex}: ${leg.points.length} points`);
          
          leg.points.forEach((point) => {
            // TomTom returns points as {latitude, longitude}
            if (point.latitude !== undefined && point.longitude !== undefined) {
              coordinates.push([point.latitude, point.longitude]);
            }
          });
        }
      });
    }

    console.log(`✅ [Backend] Extracted ${coordinates.length} total coordinate points from route`);

    if (coordinates.length === 0) {
      console.warn('⚠️ [Backend] No coordinates extracted, using fallback');
      coordinates.push([startLat, startLng]);
      coordinates.push([endLat, endLng]);
    }

    const result = {
      distance: summary.lengthInMeters / 1000, // Convert to km
      duration: summary.travelTimeInSeconds,
      durationMinutes: Math.ceil(summary.travelTimeInSeconds / 60),
      coordinates, // Full array of [lat, lng] pairs
      summary: {
        lengthInMeters: summary.lengthInMeters,
        travelTimeInSeconds: summary.travelTimeInSeconds,
      },
    };

    console.log('✅ [Backend] TomTom route fetched:', {
      distance: result.distance.toFixed(2) + ' km',
      duration: result.durationMinutes + ' minutes',
      pointsCount: coordinates.length,
    });

    return result;
  } catch (error) {
    console.error('❌ [Backend] Error fetching TomTom route:', error.message);
    throw error;
  }
};

module.exports = {
  getTomTomRoute,
};
