import axios from 'axios';

// Configuration for different environments
const API_CONFIG = {
  // Replace this with your actual Vercel URL
  VERCEL_URL: 'https://raybar.vercel.app/api',
  LOCAL_URL: 'http://localhost:5000/api',
  // Set this to true to use Vercel backend, false for local
  USE_VERCEL: true
};

// Get the base URL dynamically
const getBaseURL = (): string => {
  // Check if we want to use Vercel backend
  if (API_CONFIG.USE_VERCEL) {
    console.log('🌐 Using Vercel backend:', API_CONFIG.VERCEL_URL);
    return API_CONFIG.VERCEL_URL;
  }
  
  // Use local backend
  console.log('🏠 Using local backend:', API_CONFIG.LOCAL_URL);
  return API_CONFIG.LOCAL_URL;
};

const API_BASE_URL = getBaseURL();

// Debug: Log the API base URL
console.log('🚀 API Base URL:', API_BASE_URL);

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
