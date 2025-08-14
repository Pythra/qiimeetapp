import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { 
  getOptimizedAudioUri, 
  isAudioCached, 
  getCachedAudioUri, 
  cacheAudioUri, 
  preloadAudio,
  getPreloadedAudio,
  checkNetworkConnectivity,
  validateAudioUrl,
  loadAudioWithRetry
} from '../../../utils/audioUtils';

const { width } = Dimensions.get('window');

const AudioWaveformPlayer = ({ uri, isSent = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);
  
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const soundRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [waveformPattern] = useState(() => 
    Array.from({ length: 38 }, () => Math.floor(Math.random() * 16) + 6)
  );

  // Loading animation
  const loadingRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (audioDuration > 0) {
      setProgress(currentPosition / audioDuration);
    }
  }, [currentPosition, audioDuration]);

  // Start loading animation
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(loadingRotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingRotation.setValue(0);
    }
  }, [isLoading]);

  // Check if audio is cached
  useEffect(() => {
    if (uri) {
      checkAudioCache();
    }
  }, [uri]);

  const checkAudioCache = async () => {
    try {
      const cached = await isAudioCached(uri);
      setIsCached(cached);
      
      if (cached) {
        // Pre-load cached audio for faster playback
        const cachedUri = await getCachedAudioUri(uri);
        if (cachedUri) {
          await preloadAudio(uri, cachedUri);
        }
      }
    } catch (error) {
      console.log('Cache check failed:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!uri) {
      setError('No audio URL provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Check network connectivity (non-blocking)
      try {
        const isConnected = await checkNetworkConnectivity();
        if (!isConnected) {
          console.log('⚠️ [AUDIO] Network connectivity check failed, proceeding anyway...');
        }
      } catch (error) {
        console.log('⚠️ [AUDIO] Network check error, proceeding with audio request...');
      }
      
      // Get optimized audio URI
      const audioUri = getOptimizedAudioUri(uri);
      
      // Button press animation
      Animated.sequence([
        Animated.timing(playButtonScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(playButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      } else {
        // Check if we have a cached version
        let soundToUse = getPreloadedAudio(uri);
        
        if (soundToUse) {
          // Use cached audio
          soundRef.current = soundToUse;
          setIsPlaying(true);
          setCurrentPosition(0);
          
          // Set up status updates
          soundToUse.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              setCurrentPosition(status.positionMillis / 1000);
              setAudioDuration(status.durationMillis / 1000);
              
              if (status.didJustFinish) {
                setIsPlaying(false);
                setCurrentPosition(0);
                soundRef.current = null;
              }
            }
          });
          
          await soundToUse.playAsync();
        } else {
          // Load new audio with retry mechanism
          const audioUri = getOptimizedAudioUri(uri);
          
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
          });

          const { sound: newSound } = await loadAudioWithRetry(
            audioUri,
            { shouldPlay: true },
            3 // 3 retries
          );
          
          soundRef.current = newSound;
          setIsPlaying(true);
          
          // Cache the audio for future use
          await cacheAudioUri(uri, audioUri);
          await preloadAudio(uri, audioUri);
          
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              setCurrentPosition(status.positionMillis / 1000);
              setAudioDuration(status.durationMillis / 1000);
              
              if (status.didJustFinish) {
                setIsPlaying(false);
                setCurrentPosition(0);
                soundRef.current = null;
              }
            }
          });
        }
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to play audio. Please try again.';
      
      if (err.message?.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message?.includes('Unable to resolve host')) {
        errorMessage = 'Cannot reach audio server. Please check your internet connection.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Audio loading timed out. Please try again.';
      } else if (err.message?.includes('permission')) {
        errorMessage = 'Audio playback permission denied.';
      }
      
      setError(errorMessage);
      setIsPlaying(false);
      
      // Cleanup sound reference
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (cleanupError) {
          console.log('Error during sound cleanup:', cleanupError);
        }
        soundRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.playerContainer}>
        <TouchableOpacity
          onPress={handlePlayPause}
          style={[styles.playButton, { backgroundColor: 'rgba(255, 45, 122, 0.1)' }]}
          disabled={isLoading}
        >
          <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
            {isLoading ? (
              <Animated.View style={{
                transform: [{
                  rotate: loadingRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }]
              }}>
                <ActivityIndicator size="small" color="#ff2d7a" />
              </Animated.View>
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color={isSent ? '#fff' : '#ff2d7a'}
              />
            )}
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.waveformContainer}>
          <View style={styles.waveform}>
            {waveformPattern.map((height, index) => {
              const shouldBeColored = (index / waveformPattern.length) <= progress;
              return (
                <View
                  key={index}
                  style={{
                    width: 1.5,
                    height,
                    backgroundColor: isSent 
                      ? (shouldBeColored ? '#fff' : 'rgba(255, 255, 255, 0.3)')
                      : (shouldBeColored ? '#333' : 'rgba(51, 51, 51, 0.3)'),
                    marginHorizontal: 0.5,
                  }}
                />
              );
            })}
          </View>

        </View>
        
        {/* Error display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    minWidth: 150,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  waveformContainer: {
    flex: 1,
    marginLeft: 2,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },

  errorContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff2d7a',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },

});

export default AudioWaveformPlayer;