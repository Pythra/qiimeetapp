import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketManager from './socket';

/**
 * Clears all cached data from the app
 * This should be called during logout to ensure no user data persists
 */
export const clearAllCachedData = async () => {
  try {
    // Disconnect socket first
    SocketManager.disconnect();
    
    // Clear all AsyncStorage data
    await AsyncStorage.clear();
    
    console.log('All cached data cleared successfully');
  } catch (error) {
    console.error('Error clearing cached data:', error);
  }
};

/**
 * Clears only user-specific cached data
 * This can be used when switching accounts
 */
export const clearUserSpecificData = async () => {
  try {
    // Clear user-specific cache keys
    await AsyncStorage.multiRemove([
      'chatCache',
      'messageCache',
      'userInterests',
      'userLifestyleChoices',
      'pinId',
      'newPhoneNumber',
      'otpPinId',
      'codeVerifier',
      'accessToken',
      'idToken',
      'refreshToken'
    ]);
    
    // Clear any dynamic keys that might contain user data
    const keys = await AsyncStorage.getAllKeys();
    const userSpecificKeys = keys.filter(key => 
      key.startsWith('connection_request_') ||
      key.startsWith('user_') ||
      key.includes('cache') ||
      key.includes('token')
    );
    
    if (userSpecificKeys.length > 0) {
      await AsyncStorage.multiRemove(userSpecificKeys);
    }
    
    console.log('User-specific cached data cleared successfully');
  } catch (error) {
    console.error('Error clearing user-specific data:', error);
  }
}; 