/**
 * TomTom Routing Service
 * Provides routing and directions using TomTom API
 */

export interface RouteCoordinates {
  lat: number;
  lng: number;
}

export interface RouteRequest {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  routeType?: 'fastest' | 'shortest'; // Default: fastest
}

export interface RouteResponse {
  distance: number; // in km
  duration: number; // in seconds
  durationMinutes: number; // in minutes
  coordinates: [number, number][]; // lat, lng pairs for polyline
  summary: {
    lengthInMeters: number;
    travelTimeInSeconds: number;
  };
}

export interface RouteError {
  code: number;
  message: string;
}

/**
 * Fetch route from TomTom API via backend
 */
export const getTomTomRoute = async (
  request: RouteRequest
): Promise<RouteResponse> => {
  try {
    const { startLat, startLng, endLat, endLng, routeType = 'fastest' } =
      request;

    console.log('🗺️ Requesting route from backend:', {
      start: `${startLat}, ${startLng}`,
      end: `${endLat}, ${endLng}`,
    });

    // Call backend endpoint which proxies to TomTom (avoids CORS)
    const response = await fetch('/api/orders/routing/calculate-route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startPoint: { lat: startLat, lng: startLng },
        endPoint: { lat: endLat, lng: endLng },
        routeType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Route calculation error:', errorData);
      throw new Error(
        `Route calculation error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    const data: RouteResponse = await response.json();

    console.log('✅ Route fetched:', {
      distance: data.distance.toFixed(2) + ' km',
      duration: data.durationMinutes + ' minutes',
      pointsCount: data.coordinates.length,
    });

    return data;
  } catch (error) {
    console.error('❌ Error fetching route:', error);
    throw error;
  }
};

/**
 * Get formatted distance string
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Get formatted duration string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 1) {
    return '< 1 min';
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}min`;
};

/**
 * Calculate distance between two points using Haversine formula
 * Fallback when API is unavailable
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Estimate time to reach destination
 * Fallback when API is unavailable
 * Assumes average speed of 40 km/h in Nigeria
 */
export const estimateArrivalTime = (distanceKm: number): number => {
  const averageSpeedKmh = 40; // Average delivery speed accounting for traffic
  const hours = distanceKm / averageSpeedKmh;
  return Math.round(hours * 60); // Return minutes
};
