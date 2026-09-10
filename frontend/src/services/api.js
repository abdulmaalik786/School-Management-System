import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('school_erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized & offline demo fallback
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('school_erp_token');
      localStorage.removeItem('school_erp_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const isNetworkErr = error.message?.includes('Network Error') || error.message?.includes('Failed to fetch') || !error.response;
    if (isNetworkErr && localStorage.getItem('school_erp_token') === 'offline_demo_token') {
      // Mock basic arrays for offline testing
      return Promise.resolve({ data: [] });
    }
    return Promise.reject(error);
  }
);

export default API;
