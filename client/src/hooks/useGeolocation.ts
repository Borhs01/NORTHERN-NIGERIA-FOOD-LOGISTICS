import { useCallback, useEffect, useState } from 'react';
import { locationApi, userApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  updatedAt: string;
  state?: 'plateau' | 'bauchi' | 'kaduna';
  lga?: string;
  components?: Record<string, string>;
  isManual?: boolean;
}

const STORAGE_KEY = 'northeats-current-location';

const getCachedLocation = (): LocationData | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocationData;
  } catch {
    return null;
  }
};

const cacheLocation = (location: LocationData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
};

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setCurrentLocation = useAuthStore((state) => state.setCurrentLocation);

  const saveLocation = useCallback(async (nextLocation: LocationData, isManual = false) => {
    const locationWithFlag = { ...nextLocation, isManual };
    setLocation(locationWithFlag);
    setCurrentLocation(locationWithFlag);
    cacheLocation(locationWithFlag);

    try {
      await userApi.saveLocation(locationWithFlag);
    } catch {
      // offline or server error is still okay; keep local cache
    }
  }, [setCurrentLocation]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const reverseResult = await locationApi.reverseGeocode(lat, lng);
      const resultData = reverseResult.data || {};
      const address = resultData.formattedAddress || resultData.displayName || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
      const components = resultData.components || {};
      const rawState = (components.state || '').toLowerCase();
      const normalizedState = rawState.includes('plateau')
        ? 'plateau'
        : rawState.includes('bauchi')
          ? 'bauchi'
          : rawState.includes('kaduna')
            ? 'kaduna'
            : undefined;
      const nextLocation: LocationData = {
        lat,
        lng,
        address,
        updatedAt: new Date().toISOString(),
        state: normalizedState,
        lga: components.county || components.lga || components.town || components.city || '',
        components,
      };
      await saveLocation(nextLocation, false);
    } catch (geoError) {
      const errorObject = geoError as { code?: number; message?: string };
      if (errorObject?.code === 1) {
        setError('Location permission denied. Please allow location access to use this feature.');
      } else if (!navigator.onLine) {
        setError('Offline. Using cached location if available.');
      } else {
        setError(errorObject?.message || 'Failed to detect location.');
      }
    } finally {
      setLoading(false);
    }
  }, [saveLocation]);

  const setManualLocation = useCallback(async (manualLocation: LocationData) => {
    await saveLocation(manualLocation, true);
  }, [saveLocation]);

  useEffect(() => {
    const cached = getCachedLocation();
    if (cached) {
      setLocation(cached);
      setCurrentLocation(cached);
      if (!cached.isManual) {
        refresh();
      }
    } else {
      refresh();
    }
  }, [refresh, setCurrentLocation]);

  return { location, loading, error, refresh, setManualLocation };
}
