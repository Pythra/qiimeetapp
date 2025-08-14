import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

// Audio cache for better performance
const audioCache = new Map();
const CLOUDFRONT_URL = 'https://d11n4tndq0o4wh.cloudfront.net';

/**
 * Fetch with timeout wrapper
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} - Fetch response
 */
const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * Simple offline detection without network requests
 * @returns {boolean} - Whether device appears to be offline
 */
export const isOffline = () => {
  // Check if we're in a browser environment
  if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
    return !navigator.onLine;
  }
  
  // For React Native, we can't determine offline status without network requests
  // So we'll return false (assume online) and let the network check determine actual status
  return false;
};

/**
 * Get network status without blocking operations
 * @returns {Promise<Object>} - Network status object
 */
export const getNetworkStatus = async () => {
  try {
    const isConnected = await checkNetworkConnectivity();
    return {
      isConnected,
      timestamp: Date.now(),
      status: isConnected ? 'online' : 'offline'
    };
  } catch (error) {
    return {
      isConnected: true, // Assume online if check fails
      timestamp: Date.now(),
      status: 'unknown',
      error: error.message
    };
  }
};

/**
 * Check network connectivity using a simple fetch test
 * @returns {Promise<boolean>} - Whether network is available
 */
export const checkNetworkConnectivity = async () => {
  try {
    // Use a simple, reliable endpoint for connectivity detection
    const endpoint = 'https://httpbin.org/status/200';
    
    console.log('🔍 [AUDIO] Checking network connectivity...');
    const response = await fetchWithTimeout(endpoint, { method: 'HEAD' }, 3000);
    
    if (response.ok) {
      console.log('✅ [AUDIO] Network connectivity confirmed');
      return true;
    } else {
      console.log('❌ [AUDIO] Network response not ok:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ [AUDIO] Network connectivity check failed:', error.message);
    
    // If network check fails, assume we're online and let the actual audio request determine
    // This prevents blocking audio playback due to connectivity check failures
    console.log('⚠️ [AUDIO] Assuming online and proceeding with audio request');
    return true;
  }
};

/**
 * Validate audio URL accessibility
 * @param {string} url - Audio URL to validate
 * @returns {Promise<boolean>} - Whether URL is accessible
 */
export const validateAudioUrl = async (url) => {
  if (!url) return false;
  
  try {
    // Check network connectivity first
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      console.log('❌ [AUDIO] No network connectivity');
      return false;
    }
    
    // Try to fetch the audio file header to check if it's accessible
    const response = await fetchWithTimeout(url, { method: 'HEAD' }, 10000);
    return response.ok;
  } catch (error) {
    console.log('❌ [AUDIO] URL validation failed:', error);
    return false;
  }
};

/**
 * Get optimized audio URI with proper CloudFront handling
 * @param {string} inputUri - The input audio URI
 * @returns {string} - Optimized CloudFront URL
 */
export const getOptimizedAudioUri = (inputUri) => {
  if (!inputUri) {
    console.log('❌ [AUDIO] getOptimizedAudioUri: No input URI provided');
    return null;
  }
  
  try {
    console.log('🔍 [AUDIO] Optimizing audio URI:', inputUri);
    
    // If it's already a full URL, return as is
    if (inputUri.startsWith('http')) {
      console.log('✅ [AUDIO] URI is already a full URL:', inputUri);
      return inputUri;
    }
    
    // If it's a CloudFront URL, return as is
    if (inputUri.includes('cloudfront.net')) {
      console.log('✅ [AUDIO] URI is already a CloudFront URL:', inputUri);
      return inputUri;
    }
    
    // If it's a relative path, construct CloudFront URL
    if (inputUri.startsWith('/')) {
      const cloudFrontUrl = `${CLOUDFRONT_URL}${inputUri}`;
      console.log('✅ [AUDIO] Constructed CloudFront URL from relative path:', cloudFrontUrl);
      return cloudFrontUrl;
    }
    
    // If it's just a filename, construct full CloudFront path
    const cloudFrontUrl = `${CLOUDFRONT_URL}/uploads/audio/${inputUri}`;
    console.log('✅ [AUDIO] Constructed CloudFront URL from filename:', cloudFrontUrl);
    return cloudFrontUrl;
  } catch (error) {
    console.error('❌ [AUDIO] Error optimizing audio URI:', error);
    return inputUri; // Return original URI as fallback
  }
};

/**
 * Check if audio is cached
 * @param {string} uri - Audio URI
 * @returns {Promise<boolean>} - Whether audio is cached
 */
export const isAudioCached = async (uri) => {
  try {
    const cacheKey = `audio_${uri}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    return !!cachedData;
  } catch (error) {
    console.log('Cache check failed:', error);
    return false;
  }
};

/**
 * Get cached audio URI
 * @param {string} uri - Audio URI
 * @returns {Promise<string|null>} - Cached audio URI or null
 */
export const getCachedAudioUri = async (uri) => {
  try {
    const cacheKey = `audio_${uri}`;
    return await AsyncStorage.getItem(cacheKey);
  } catch (error) {
    console.log('Failed to get cached audio:', error);
    return null;
  }
};

/**
 * Cache audio URI
 * @param {string} uri - Original audio URI
 * @param {string} audioUri - Full audio URI to cache
 * @returns {Promise<void>}
 */
export const cacheAudioUri = async (uri, audioUri) => {
  try {
    const cacheKey = `audio_${uri}`;
    await AsyncStorage.setItem(cacheKey, audioUri);
    
    // Also store in memory cache for instant access
    audioCache.set(uri, audioUri);
  } catch (error) {
    console.log('Failed to cache audio:', error);
  }
};

/**
 * Preload audio for faster playback
 * @param {string} uri - Audio URI
 * @param {string} audioUri - Full audio URI
 * @returns {Promise<Object|null>} - Preloaded sound object or null
 */
export const preloadAudio = async (uri, audioUri) => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: false }
    );
    
    // Store in memory cache
    audioCache.set(uri, sound);
    
    // Unload to free memory but keep reference
    await sound.unloadAsync();
    
    return sound;
  } catch (error) {
    console.log('Audio preload failed:', error);
    return null;
  }
};

/**
 * Get preloaded audio from cache
 * @param {string} uri - Audio URI
 * @returns {Object|null} - Cached sound object or null
 */
export const getPreloadedAudio = (uri) => {
  return audioCache.get(uri) || null;
};

/**
 * Clear audio cache
 * @param {string} uri - Audio URI to clear (optional, clears all if not provided)
 * @returns {Promise<void>}
 */
export const clearAudioCache = async (uri = null) => {
  try {
    if (uri) {
      // Clear specific audio
      const cacheKey = `audio_${uri}`;
      await AsyncStorage.removeItem(cacheKey);
      audioCache.delete(uri);
    } else {
      // Clear all audio cache
      const keys = await AsyncStorage.getAllKeys();
      const audioKeys = keys.filter(key => key.startsWith('audio_'));
      await AsyncStorage.multiRemove(audioKeys);
      audioCache.clear();
    }
  } catch (error) {
    console.log('Failed to clear audio cache:', error);
  }
};

/**
 * Get audio cache size
 * @returns {Promise<number>} - Number of cached audio files
 */
export const getAudioCacheSize = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys.filter(key => key.startsWith('audio_')).length;
  } catch (error) {
    console.log('Failed to get cache size:', error);
    return 0;
  }
};

/**
 * Optimize audio loading with caching strategy
 * @param {string} uri - Audio URI
 * @param {Function} onLoad - Callback when audio is loaded
 * @param {Function} onError - Callback when loading fails
 * @returns {Promise<Object>} - Audio loading result
 */
export const optimizeAudioLoading = async (uri, onLoad, onError) => {
  try {
    // Check if we have a cached version
    const cachedUri = await getCachedAudioUri(uri);
    const preloadedSound = getPreloadedAudio(uri);
    
    if (cachedUri && preloadedSound) {
      // Use cached audio for instant playback
      onLoad({ uri: cachedUri, sound: preloadedSound, cached: true });
      return { cached: true, uri: cachedUri, sound: preloadedSound };
    }
    
    // Load new audio and cache it
    const optimizedUri = getOptimizedAudioUri(uri);
    
    // Cache the optimized URI
    await cacheAudioUri(uri, optimizedUri);
    
    // Preload for future use
    const sound = await preloadAudio(uri, optimizedUri);
    
    onLoad({ uri: optimizedUri, sound, cached: false });
    return { cached: false, uri: optimizedUri, sound };
    
  } catch (error) {
    console.error('Audio optimization failed:', error);
    onError(error);
    throw error;
  }
};

/**
 * Load audio with retry mechanism
 * @param {string} uri - Audio URI
 * @param {Object} options - Audio loading options
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<Object>} - Audio loading result
 */
export const loadAudioWithRetry = async (uri, options = {}, maxRetries = 3) => {
  let lastError;
  
  console.log('🎵 [AUDIO] Starting audio loading with retry for URI:', uri);
  console.log('🎵 [AUDIO] Loading options:', options);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [AUDIO] Loading audio attempt ${attempt}/${maxRetries}:`, uri);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, ...options }
      );
      
      console.log(`✅ [AUDIO] Audio loaded successfully on attempt ${attempt}`);
      return { sound, attempt };
      
    } catch (error) {
      lastError = error;
      console.log(`❌ [AUDIO] Audio loading attempt ${attempt} failed:`, error.message);
      console.log(`❌ [AUDIO] Error details:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ [AUDIO] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.log(`❌ [AUDIO] All ${maxRetries} audio loading attempts failed`);
  console.log(`❌ [AUDIO] Final error:`, lastError);
  throw lastError;
};

export default {
  checkNetworkConnectivity,
  validateAudioUrl,
  isOffline,
  getNetworkStatus,
  getOptimizedAudioUri,
  isAudioCached,
  getCachedAudioUri,
  cacheAudioUri,
  preloadAudio,
  getPreloadedAudio,
  clearAudioCache,
  getAudioCacheSize,
  optimizeAudioLoading,
  loadAudioWithRetry,
};
