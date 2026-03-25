// Geolocation utility for getting current location and reverse geocoding

import { STATES } from './constants';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  state?: string;
  lga?: string;
}

export interface DetailedAddressData {
  houseNumber: string;
  streetName: string;
  buildingName?: string;
  landmark?: string;
  area?: string;
  state: string;
  lga: string;
  fullAddress: string;
  lat: number;
  lng: number;
}

interface ReverseGeocodeResult {
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
  lat: number;
  lon: number;
}

/**
 * Get user's current location and return detailed address components
 */
export const getCurrentLocationDetailed = (): Promise<DetailedAddressData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get detailed address
          const addressData = await reverseGeocodeDetailed(latitude, longitude);
          resolve(addressData);
        } catch (error) {
          console.error('Location detection error:', error);
          // Still return a location object with coordinates for manual entry fallback
          const fallback = createFallbackAddress(latitude, longitude);
          resolve(fallback);
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

/**
 * Reverse geocode coordinates to get detailed address using Nominatim
 */
const reverseGeocodeDetailed = async (lat: number, lng: number): Promise<DetailedAddressData> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    console.log('🔍 Fetching address from Nominatim:', { lat, lng });
    
    // Create AbortController with timeout for browsers that support it
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, { 
      headers: { 'Accept-Language': 'en' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ Nominatim API error:', response.status, response.statusText);
      // Fall back to providing location with defaults
      return createFallbackAddress(lat, lng);
    }
    
    const data: ReverseGeocodeResult = await response.json();
    console.log('✅ Nominatim response:', data);
    
    const addressObj = data.address;
    
    // Extract detailed address components
    const houseNumber = addressObj.house_number || '';
    const streetName = addressObj.road || addressObj.road || '';
    const buildingName = addressObj.building || '';
    const areaName = addressObj.hamlet || addressObj.village || addressObj.town || addressObj.city || '';
    const landmark = '';

    console.log('📍 Extracted address parts:', { houseNumber, streetName, buildingName, areaName });

    // Build full address
    const addressParts = [
      houseNumber,
      streetName,
      buildingName,
      areaName,
    ].filter(Boolean);
    
    const fullAddress = addressParts.join(', ') || `Location detected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    // Try to match to Nigerian states
    let state: string = 'plateau'; // default
    let lga: string = STATES['plateau'].lgas[0];

    // Try to find matching state from app constants
    const stateKey = Object.entries(STATES).find(([, stateData]) => 
      stateData.label.toLowerCase() === (addressObj.state?.toLowerCase() || '')
    )?.[0];

    if (stateKey) {
      state = stateKey;
      // Try to match LGA if available
      if (addressObj.county) {
        const countyLower = addressObj.county.toLowerCase();
        const matchingLga = STATES[stateKey as keyof typeof STATES].lgas.find(
          l => l.toLowerCase() === countyLower || l.toLowerCase().replace(' lga', '') === countyLower
        );
        lga = matchingLga || STATES[stateKey as keyof typeof STATES].lgas[0];
      } else {
        lga = STATES[stateKey as keyof typeof STATES].lgas[0];
      }
    }

    console.log('✅ Final address data:', { state, lga, fullAddress });

    return {
      houseNumber,
      streetName,
      buildingName,
      landmark,
      area: areaName,
      state,
      lga,
      fullAddress,
      lat,
      lng,
    };
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    // Return fallback with GPS coordinates
    return createFallbackAddress(lat, lng);
  }
};

/**
 * Create fallback address when reverse geocoding fails
 */
const createFallbackAddress = (lat: number, lng: number): DetailedAddressData => {
  // Show coordinates as a reference for the user
  const coordinateRef = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  
  return {
    houseNumber: '',
    streetName: coordinateRef, // Show coordinates so user knows location was detected
    buildingName: '',
    landmark: '',
    area: '',
    state: 'plateau',
    lga: STATES['plateau'].lgas[0],
    fullAddress: `Location detected (coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    lat,
    lng,
  };
};

/**
 * Format location data for display
 */
export const formatLocation = (location: DetailedAddressData): string => {
  const parts = [location.houseNumber, location.streetName, location.area, location.lga, location.state]
    .filter(Boolean);
  return parts.join(', ') || location.fullAddress;
};

/**
 * Convert coordinate string (e.g., "Lat: 6.4474, Lng: 3.3903") to precise location name
 */
export const convertCoordinatesToAddress = async (coordinateString: string): Promise<string> => {
  try {
    // Parse the coordinate string
    const latMatch = coordinateString.match(/Lat:\s*([-\d.]+)/i);
    const lngMatch = coordinateString.match(/Lng:\s*([-\d.]+)/i);

    if (!latMatch || !lngMatch) {
      throw new Error('Invalid coordinate format. Expected format: "Lat: X.XXXX, Lng: Y.YYYY"');
    }

    const lat = parseFloat(latMatch[1]);
    const lng = parseFloat(lngMatch[1]);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid latitude or longitude values');
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (lng < -180 || lng > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    console.log('🔄 Converting coordinates to address:', { lat, lng });

    // Use existing reverse geocoding function
    const addressData = await reverseGeocodeDetailed(lat, lng);

    // Return the formatted address
    return formatLocation(addressData);

  } catch (error) {
    console.error('❌ Coordinate conversion error:', error);
    return `Unable to convert coordinates: ${coordinateString}. ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};
