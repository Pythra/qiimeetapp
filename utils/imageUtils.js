/**
 * Centralized image URL utility for the Qiimeet app
 * Handles S3 to CloudFront URL conversion and fallback images
 */

const CLOUDFRONT_URL = 'https://d11n4tndq0o4wh.cloudfront.net';

/**
 * Convert any image path or URL to a proper React Native Image source
 * @param {string} imagePath - The image path or URL
 * @param {string} fallbackImage - Optional fallback image path
 * @returns {object|number} - Image source object with uri or require statement
 */
export const getImageSource = (imagePath, fallbackImage = null) => {
  // Handle null/undefined/empty cases
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return fallbackImage || require('../assets/model.jpg');
  }

  const path = imagePath.trim();
  
  // If it's already a CloudFront URL, use as is
  if (path.includes('cloudfront.net')) {
    return { uri: path };
  }
  
  // If it's an S3 URL, convert to CloudFront
  if (path.includes('s3.amazonaws.com') || path.includes('qiimeetbucket')) {
    try {
      const s3Url = new URL(path);
      const key = s3Url.pathname.slice(1); // Remove leading slash, keep full path
      const cloudFrontUrl = `${CLOUDFRONT_URL}/${key}`;
      return { uri: cloudFrontUrl };
    } catch (error) {
      console.warn('[ImageUtils] Failed to parse S3 URL:', path, error);
      return fallbackImage || require('../assets/model.jpg');
    }
  }
  
  // If it's already a full HTTP URL (not S3), use as is
  if (path.startsWith('http')) {
    return { uri: path };
  }
  
  // Handle relative paths
  if (path.startsWith('/uploads/')) {
    return { uri: `${CLOUDFRONT_URL}${path}` };
  }
  
  if (!path.startsWith('/')) {
    return { uri: `${CLOUDFRONT_URL}/uploads/images/${path}` };
  }
  
  // Fallback for any other cases
  return fallbackImage || require('../assets/model.jpg');
};

/**
 * Get profile image source for a user
 * @param {object} user - User object
 * @param {string} fallbackImage - Optional fallback image path
 * @returns {object|number} - Image source object with uri or require statement
 */
export const getProfileImageSource = (user, fallbackImage = null) => {
  if (!user) {
    return fallbackImage || require('../assets/model.jpg');
  }
  
  // Try to get profile picture from various sources
  const profilePic = user.profilePicture || 
                    (user.profilePictures && user.profilePictures.length > 0 ? user.profilePictures[0] : null);
  
  return getImageSource(profilePic, fallbackImage);
};

/**
 * Get the CloudFront base URL
 * @returns {string} - CloudFront base URL
 */
export const getCloudFrontUrl = () => CLOUDFRONT_URL;


