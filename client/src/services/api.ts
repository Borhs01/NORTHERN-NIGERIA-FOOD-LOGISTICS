import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const refreshUrl = `${apiBaseUrl}/auth/refresh`;
        const res = await axios.post(refreshUrl, {}, { withCredentials: true });
        localStorage.setItem('token', res.data.token);
        err.config.headers.Authorization = `Bearer ${res.data.token}`;
        return api(err.config);
      } catch {
        localStorage.removeItem('token');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(err);
  }
);

export const userApi = {
  saveLocation: async (payload: { lat: number; lng: number; address: string; updatedAt: string }) => {
    const response = await api.post('/users/location', payload);
    return response.data;
  },
  getLocation: async () => {
    const response = await api.get('/users/location');
    return response.data;
  },
};

export default api;

// Location search API functions
export const locationApi = {
  // Search for locations
  searchLocations: async (query: string, limit = 15) => {
    const response = await api.get('/locations/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Reverse geocode coordinates to address
  reverseGeocode: async (lat: number, lng: number) => {
    const response = await api.get('/locations/reverse', {
      params: { lat, lng }
    });
    return response.data;
  },
};

export const pricingApi = {
  // Calculate delivery fee
  calculateDeliveryFee: async (vendorId: string, customerLat: number, customerLng: number) => {
    const response = await api.post('/pricing/calculate-delivery-fee', {
      vendorId,
      customerLat,
      customerLng,
    });
    return response.data;
  },
};
