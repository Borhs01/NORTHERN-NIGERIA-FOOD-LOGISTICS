import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
        const baseURL = import.meta.env.VITE_API_URL || '/api';
        const res = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
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
