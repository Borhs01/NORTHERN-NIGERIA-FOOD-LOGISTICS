// Enhanced Location Service for Nationwide Nigeria Coverage
// Supports multiple geocoding providers with fallback

import { locationApi } from '../services/api';

export interface LocationSearchResult {
  placeId: string;
  displayName: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  components: {
    houseNumber?: string;
    streetName?: string;
    area?: string;
    city?: string;
    state?: string;
    country: string;
  };
  provider: 'nominatim' | 'google' | 'mapbox';
  confidence: number; // 0-1 score
}

export interface DeliveryCoverage {
  isSupported: boolean;
  supportedStates: string[];
  supportedLGAs: string[];
  estimatedDeliveryTime?: string;
  deliveryFee?: number;
  message: string;
}

export interface EnhancedAddressData {
  placeId: string;
  displayName: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  components: {
    houseNumber?: string;
    streetName?: string;
    area?: string;
    city?: string;
    state?: string;
    lga?: string;
    landmark?: string;
    country: string;
  };
  deliveryCoverage: DeliveryCoverage;
  formattedAddress: string;
  searchQuery: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    building?: string;
    hamlet?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  importance?: number;
}

interface BackendLocationResult {
  placeId: string;
  displayName: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  components: {
    houseNumber?: string;
    streetName?: string;
    area?: string;
    city?: string;
    state?: string;
    lga?: string;
    landmark?: string;
    country: string;
  };
  deliveryCoverage: DeliveryCoverage;
  formattedAddress: string;
  searchQuery?: string;
}

/**
 * Primary location search using multiple providers with fallback
 */
export const searchLocations = async (query: string): Promise<LocationSearchResult[]> => {
  const results: LocationSearchResult[] = [];

  try {
    // Try Nominatim first (free, good for Nigeria)
    const nominatimResults = await searchNominatim(query);
    results.push(...nominatimResults);

    // If we have good results, return them
    if (results.length >= 5) {
      return results.slice(0, 15);
    }

    // Fallback: Try broader search without Nigeria filter
    const fallbackResults = await searchNominatimFallback(query);
    results.push(...fallbackResults);

  } catch (error) {
    console.error('Location search error:', error);
  }

  return results.slice(0, 15);
};

/**
 * Search using Nominatim (OpenStreetMap) - Primary provider
 */
const searchNominatim = async (query: string): Promise<LocationSearchResult[]> => {
  const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=ng&format=json&addressdetails=1&limit=20&dedupe=1`;

  const response = await fetch(searchUrl, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'NorthEats/1.0'
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Too many location requests. Please wait a moment and try again.');
    }
    if (response.status >= 500) {
      throw new Error('Location service is temporarily unavailable. Please try again later.');
    }
    throw new Error(`Location search failed: ${response.statusText}`);
  }

  const data = await response.json();

  return data.map((result: NominatimResult) => ({
    placeId: `nominatim_${result.place_id}`,
    displayName: result.display_name,
    fullAddress: result.display_name,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    components: {
      houseNumber: result.address?.house_number,
      streetName: result.address?.road,
      area: result.address?.hamlet || result.address?.village || result.address?.town,
      city: result.address?.city || result.address?.town,
      state: result.address?.state,
      country: result.address?.country || 'Nigeria',
    },
    provider: 'nominatim' as const,
    confidence: calculateConfidence(result),
  }));
};

/**
 * Fallback search without strict Nigeria filtering
 */
const searchNominatimFallback = async (query: string): Promise<LocationSearchResult[]> => {
  const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, Nigeria&format=json&addressdetails=1&limit=15&dedupe=1`;

  const response = await fetch(searchUrl, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'NorthEats/1.0'
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return data.map((result: NominatimResult) => ({
    placeId: `nominatim_fb_${result.place_id}`,
    displayName: result.display_name,
    fullAddress: result.display_name,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    components: {
      houseNumber: result.address?.house_number,
      streetName: result.address?.road,
      area: result.address?.hamlet || result.address?.village || result.address?.town,
      city: result.address?.city || result.address?.town,
      state: result.address?.state,
      country: result.address?.country || 'Nigeria',
    },
    provider: 'nominatim' as const,
    confidence: calculateConfidence(result) * 0.8, // Lower confidence for fallback
  }));
};

/**
 * Calculate confidence score for search result
 */
const calculateConfidence = (result: NominatimResult): number => {
  let score = 0.5; // Base score

  // Higher score for more detailed addresses
  if (result.address?.house_number) score += 0.1;
  if (result.address?.road) score += 0.15;
  if (result.address?.city) score += 0.1;
  if (result.address?.state) score += 0.1;

  // Importance score from Nominatim
  if (result.importance) {
    score += result.importance * 0.2;
  }

  return Math.min(score, 1.0);
};

/**
 * Check delivery coverage for a location
 */
export const checkDeliveryCoverage = async (location: LocationSearchResult): Promise<DeliveryCoverage> => {
  // Current supported states and LGAs
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
    deliveryFee: isSupported ? 500 : undefined, // ₦500 base fee
    message: isSupported
      ? '🚚 Delivery available in this area!'
      : '📍 Location found, but delivery is not yet available here. We\'re expanding soon!',
  };
};

/**
 * Enhanced address search with delivery coverage
 * Tries backend API first, falls back to client-side search
 */
export const searchLocationsWithCoverage = async (query: string): Promise<EnhancedAddressData[]> => {
  try {
    // Try backend API first for better performance and caching
    const backendResponse = await locationApi.searchLocations(query);
    if (backendResponse.success && backendResponse.data.length > 0) {
      return backendResponse.data.map(transformBackendResult);
    }

    // If backend fails with rate limiting, show user-friendly message
    if (backendResponse.success === false && backendResponse.message?.includes('Too many requests')) {
      throw new Error('Location search is temporarily limited. Please try again in a moment.');
    }

  } catch (error) {
    console.warn('Backend location search failed, falling back to client-side:', error);

    // If it's a rate limiting error from backend, re-throw with user-friendly message
    if (error instanceof Error && error.message.includes('Too many')) {
      throw error;
    }
  }

  // Fallback to client-side search
  const locations = await searchLocations(query);
  return await Promise.all(
    locations.map(async (location) => {
      const deliveryCoverage = await checkDeliveryCoverage(location);
      return {
        placeId: location.placeId,
        displayName: location.displayName,
        fullAddress: location.fullAddress,
        latitude: location.latitude,
        longitude: location.longitude,
        components: {
          ...location.components,
          lga: extractLGA(location),
        },
        deliveryCoverage,
        formattedAddress: formatAddress(location),
        searchQuery: query,
      };
    })
  );
};

/**
 * Transform backend API result to match our interface
 */
const transformBackendResult = (backendResult: BackendLocationResult): EnhancedAddressData => ({
  placeId: backendResult.placeId,
  displayName: backendResult.displayName,
  fullAddress: backendResult.fullAddress,
  latitude: backendResult.latitude,
  longitude: backendResult.longitude,
  components: backendResult.components,
  deliveryCoverage: backendResult.deliveryCoverage,
  formattedAddress: backendResult.formattedAddress,
  searchQuery: backendResult.searchQuery || '',
});

/**
 * Extract LGA from location data
 */
const extractLGA = (location: LocationSearchResult): string | undefined => {
  // Try to match against known LGAs
  const knownLGAs = [
    'Jos North', 'Jos South', 'Bukuru', 'Barkin Ladi', 'Pankshin', 'Shendam', 'Mangu',
    'Bauchi Metro', 'Azare', 'Misau', 'Katagum', 'Dass', 'Tafawa Balewa',
    'Kaduna North', 'Kaduna South', 'Zaria', 'Kafanchan', 'Soba', 'Birnin Gwari', 'Sabon Gari'
  ];

  const addressText = location.fullAddress.toLowerCase();

  for (const lga of knownLGAs) {
    if (addressText.includes(lga.toLowerCase())) {
      return lga;
    }
  }

  return location.components.area;
};

/**
 * Format address for display
 */
const formatAddress = (location: LocationSearchResult): string => {
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

/**
 * Get current location with enhanced data
 */
export const getCurrentLocationEnhanced = (): Promise<EnhancedAddressData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get address
          const locations = await searchLocations(`${latitude},${longitude}`);
          const bestMatch = locations[0];

          if (bestMatch) {
            const deliveryCoverage = await checkDeliveryCoverage(bestMatch);
            resolve({
              placeId: bestMatch.placeId,
              displayName: bestMatch.displayName,
              fullAddress: bestMatch.fullAddress,
              latitude: bestMatch.latitude,
              longitude: bestMatch.longitude,
              components: {
                ...bestMatch.components,
                lga: extractLGA(bestMatch),
              },
              deliveryCoverage,
              formattedAddress: formatAddress(bestMatch),
              searchQuery: 'Current Location',
            });
          } else {
            // Fallback for current location
            resolve({
              placeId: 'current_location',
              displayName: 'Current Location',
              fullAddress: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
              latitude,
              longitude,
              components: {
                country: 'Nigeria',
              },
              deliveryCoverage: {
                isSupported: false,
                supportedStates: ['plateau', 'bauchi', 'kaduna'],
                supportedLGAs: [],
                message: '📍 Current location detected. Checking delivery coverage...',
              },
              formattedAddress: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
              searchQuery: 'Current Location',
            });
          }
        } catch (error) {
          console.error('Error getting location details:', error);
          reject(new Error('Failed to get location details'));
        }
      },
      (error) => {
        const errorMessage =
          error.code === 1 ? 'Permission denied. Please enable location access in browser settings.' :
          error.code === 2 ? 'Location unavailable. Please check your GPS/location services.' :
          error.code === 3 ? 'Location request timeout. Please try again.' :
          error.message;
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
