import { Platform } from 'react-native';

/**
 * Generate a shareable profile link with deep linking support
 * @param {string} userId - The user ID to share
 * @param {string} username - The username for display
 * @returns {object} Share data with message, URL, and title
 */
export const generateProfileShareData = (userId, username = 'User') => {
  // Deep link URL for the app
  const deepLinkUrl = `qiimeet://profile/${userId}`;
  
  // Universal link (web fallback)
  const universalLink = `https://qiimeet.app/profile/${userId}`;
  
  // App store URLs
  const appStoreUrls = {
    ios: 'https://apps.apple.com/app/qiimeet/id1234567890', // Replace with actual App Store ID
    android: 'https://play.google.com/store/apps/details?id=com.qiimeet.app' // Replace with actual Play Store ID
  };
  
  // Get appropriate app store URL based on platform
  const appStoreUrl = Platform.OS === 'ios' ? appStoreUrls.ios : appStoreUrls.android;
  
  // Create share message
  const shareMessage = `Check out ${username}'s profile on Qiimeet! 🎉\n\n${universalLink}\n\nDownload Qiimeet: ${appStoreUrl}`;
  
  return {
    message: shareMessage,
    url: universalLink, // Use universal link as primary URL
    title: `Share ${username}'s Profile`,
    deepLinkUrl, // Keep deep link for reference
    appStoreUrl
  };
};

/**
 * Generate a shareable match link
 * @param {string} matchId - The match ID
 * @param {string} username - The username for display
 * @returns {object} Share data with message, URL, and title
 */
export const generateMatchShareData = (matchId, username = 'User') => {
  const deepLinkUrl = `qiimeet://match/${matchId}`;
  const universalLink = `https://qiimeet.app/match/${matchId}`;
  
  const appStoreUrls = {
    ios: 'https://apps.apple.com/app/qiimeet/id1234567890',
    android: 'https://play.google.com/store/apps/details?id=com.qiimeet.app'
  };
  
  const appStoreUrl = Platform.OS === 'ios' ? appStoreUrls.ios : appStoreUrls.android;
  
  const shareMessage = `I matched with ${username} on Qiimeet! 💕\n\n${universalLink}\n\nDownload Qiimeet: ${appStoreUrl}`;
  
  return {
    message: shareMessage,
    url: universalLink,
    title: `Share Match with ${username}`,
    deepLinkUrl,
    appStoreUrl
  };
};

/**
 * Generate a general app share link
 * @returns {object} Share data for general app sharing
 */
export const generateAppShareData = () => {
  const universalLink = 'https://qiimeet.app';
  
  const appStoreUrls = {
    ios: 'https://apps.apple.com/app/qiimeet/id1234567890',
    android: 'https://play.google.com/store/apps/details?id=com.qiimeet.app'
  };
  
  const appStoreUrl = Platform.OS === 'ios' ? appStoreUrls.ios : appStoreUrls.android;
  
  const shareMessage = `Join me on Qiimeet - the best dating app! 💕\n\n${universalLink}\n\nDownload: ${appStoreUrl}`;
  
  return {
    message: shareMessage,
    url: universalLink,
    title: 'Share Qiimeet',
    appStoreUrl
  };
};
