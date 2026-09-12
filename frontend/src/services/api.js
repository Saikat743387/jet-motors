import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL;

function resolveBaseUrl() {
  if (typeof VITE_API_URL === 'string' && VITE_API_URL.trim()) {
    return VITE_API_URL.trim().replace(/\/+$/, '');
  }
  return '/api';
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/signup')) {
        localStorage.removeItem('jm_token');
      }
    }
    return Promise.reject(err);
  }
);

export default api;
