// Function to get the local IP address dynamically
const getLocalIP = (): string => {
  // If we're in development and accessing from another device, use the current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If it's not localhost, use the current hostname (which should be the local IP)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return hostname;
    }
  }
  
  // Fallback to localhost for local development
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

// Utility function to construct proper photo URLs
export const getPhotoUrl = (photoPath: string): string => {
  if (photoPath.startsWith('http')) {
    return photoPath;
  }
  
  // Get the base URL dynamically using the same logic as the API service
  const host = getLocalIP();
  const port = getBackendPort();
  const baseUrl = `http://${host}:${port}`;
  
  return `${baseUrl}${photoPath}`;
};
