import axios from 'axios';

// Function to get the local IP address dynamically
const getLocalIP = (): string => {
  // For local development, always use localhost to avoid IP issues
  return 'localhost';
};

// Function to get the backend port dynamically
const getBackendPort = (): string => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_API_PORT) {
    return import.meta.env.VITE_API_PORT;
  }
  
  // Default fallback - use 5000 to match server default
  return '5000';
};

// Get the base URL dynamically
const getBaseURL = (): string => {
  // In production, use the same domain as the frontend
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // In development, use localhost or local IP
  const host = getLocalIP();
  const port = getBackendPort();
  return `http://${host}:${port}/api`;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || getBaseURL();

// Debug: Log the API base URL
console.log('API Base URL:', API_BASE_URL);
console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
