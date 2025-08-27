import { getPhotoUrl } from './photoUtils';

// Utility function to generate local avatar URLs
export const generateAvatarUrl = (firstName: string, lastName: string, size: number = 200): string => {
  // Create initials from first and last name
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  
  // Create a simple SVG avatar with initials
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size/8}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size/3}" 
            font-weight="bold" fill="white" text-anchor="middle" dy=".3em">
        ${initials}
      </text>
    </svg>
  `;
  
  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  return dataUrl;
};

// Function to get avatar URL (either photo or generated avatar)
export const getAvatarUrl = (user: any, size: number = 200): string => {
  if (user?.profile?.photos?.[0]) {
    // Use the existing getPhotoUrl function for actual photos
    return getPhotoUrl(user.profile.photos[0]);
  }
  
  // Generate avatar from initials
  const firstName = user?.profile?.firstName || 'U';
  const lastName = user?.profile?.lastName || 'U';
  return generateAvatarUrl(firstName, lastName, size);
};
