import axios from 'axios';

// Configuration for different environments
const API_CONFIG = {
  // Your Vercel backend URL
  VERCEL_URL: 'https://raybar.vercel.app/api',
  LOCAL_URL: 'http://localhost:5000/api',
  // Automatically use Vercel in production, local in development
  USE_VERCEL: process.env.NODE_ENV === 'production'
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
    // Check for admin token first, then regular user token
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');
    
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      console.log('🔐 Using admin token for request:', config.url);
    } else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
      console.log('🔐 Using user token for request:', config.url);
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
      // Clear both admin and user tokens on 401
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      
      // Redirect based on current path
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
