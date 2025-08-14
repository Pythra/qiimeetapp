import { Audio } from 'expo-av';
import { useState, useRef, useCallback } from 'react';
import { Alert, Platform } from 'react-native';

const useAudioRecorder = () => {
  const recordingRef = useRef(null);
  const [audioUri, setAudioUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationTimerRef = useRef(null);

  // Check audio recording permission status
  const checkAudioPermission = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ [AUDIO] Error checking permission status:', error);
      return false;
    }
  };

  // Request audio recording permission using modern Expo approach
  const requestAudioPermission = async () => {
    try {
      console.log('🔐 [AUDIO] Checking audio recording permissions...');
      
      // First check if permission is already granted
      const { status: existingStatus } = await Audio.getPermissionsAsync();
      console.log('🔐 [AUDIO] Current permission status:', existingStatus);
      
      if (existingStatus === 'granted') {
        console.log('✅ [AUDIO] Permission already granted');
        return true;
      }
      
      // Request permission if not already granted
      console.log('🔐 [AUDIO] Requesting audio recording permission...');
      const { status } = await Audio.requestPermissionsAsync();
      console.log('🔐 [AUDIO] Permission request result:', status);
      
      if (status !== 'granted') {
        console.log('❌ [AUDIO] Permission denied by user');
        Alert.alert(
          'Permission Required',
          'Audio recording permission is required to record voice messages. Please grant this permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On Android, we can't directly open settings, but we can guide the user
              if (Platform.OS === 'android') {
                Alert.alert(
                  'Open Settings',
                  'Please go to Settings > Apps > Qiimeet > Permissions and enable Microphone permission.',
                  [{ text: 'OK' }]
                );
              }
            }}
          ]
        );
        return false;
      }
      
      console.log('✅ [AUDIO] Permission granted successfully');
      return true;
    } catch (error) {
      console.error('❌ [AUDIO] Permission request failed:', error);
      Alert.alert('Permission Error', 'Failed to request audio recording permission.');
      return false;
    }
  };

  const clearDurationTimer = useCallback(() => {
    console.log('🔧 [AUDIO] Clearing duration timer');
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    console.log('🔧 [AUDIO] Starting duration timer');
    clearDurationTimer();
    setDuration(0);
    durationTimerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  }, [clearDurationTimer]);

  const stopDurationTimer = useCallback(() => {
    console.log('🔧 [AUDIO] Stopping duration timer');
    clearDurationTimer();
    setDuration(0);
  }, [clearDurationTimer]);

  const startRecording = async () => {
    try {
      console.log('🎤 [AUDIO] Starting new recording...');
      
      // Request permission first
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        console.log('❌ [AUDIO] Permission denied by user');
        throw new Error('Audio recording permission denied');
      }
      
      console.log('✅ [AUDIO] Permission granted, proceeding with recording...');
      
      // First, cleanup any existing recording
      if (recordingRef.current) {
        console.log('🧹 [AUDIO] Cleaning up existing recording before starting new one');
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          console.log('🧹 [AUDIO] Error cleaning up:', e);
        }
        recordingRef.current = null;
      }
      
      // Set up audio mode
      console.log('🎤 [AUDIO] Setting up audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create new recording
      console.log('🎤 [AUDIO] Creating new Recording instance...');
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      
      recordingRef.current = newRecording;
      await recordingRef.current.startAsync();
      
      setIsRecording(true);
      setIsPaused(false); // Initialize as not paused
      setDuration(0);
      
      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      console.log('✅ [AUDIO] Recording started successfully');
    } catch (error) {
      console.error('❌ [AUDIO] Failed to start recording:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to start recording. Please try again.';
      
      if (error.message?.includes('permission denied')) {
        errorMessage = 'Microphone permission is required. Please grant permission in your device settings.';
      } else if (error.message?.includes('Missing audio recording permissions')) {
        errorMessage = 'Microphone permission is required. Please grant permission in your device settings.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      Alert.alert('Recording Error', errorMessage);
      await cleanupRecording();
      throw error;
    }
  };

  const stopRecording = useCallback(async () => {
    console.log('⏹️ [AUDIO] stopRecording called');
    console.log('⏹️ [AUDIO] Current state:', { isRecording, isPaused, hasRecordingRef: !!recordingRef.current });
    
    if (!recordingRef.current || !isRecording) {
      console.log('⚠️ [AUDIO] No recording to stop');
      return null;
    }

    try {
      console.log('⏹️ [AUDIO] Stopping duration timer...');
      stopDurationTimer();
      console.log('⏹️ [AUDIO] Setting state to not recording...');
      setIsRecording(false);
      setIsPaused(false);
      
      const recording = recordingRef.current;
      recordingRef.current = null;
      
      console.log('⏹️ [AUDIO] Stopping and unloading recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      
      console.log('✅ [AUDIO] Recording stopped successfully, URI:', uri);
      return uri;
    } catch (error) {
      console.error('❌ [AUDIO] Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      setIsRecording(false);
      setIsPaused(false);
      return null;
    }
  }, [isRecording, stopDurationTimer]);

  const pauseRecording = useCallback(async () => {
    console.log('⏸️ [AUDIO] pauseRecording called');
    console.log('⏸️ [AUDIO] Current state:', { isRecording, isPaused });
    
    if (!recordingRef.current || !isRecording || isPaused) {
      console.log('⚠️ [AUDIO] Cannot pause - invalid state');
      return;
    }

    try {
      console.log('⏸️ [AUDIO] Pausing recording...');
      await recordingRef.current.pauseAsync();
      setIsPaused(true);
      clearDurationTimer();
      console.log('✅ [AUDIO] Recording paused successfully');
    } catch (error) {
      console.error('❌ [AUDIO] Failed to pause recording:', error);
    }
  }, [isRecording, isPaused, clearDurationTimer]);

  const resumeRecording = useCallback(async () => {
    console.log('▶️ [AUDIO] resumeRecording called');
    console.log('▶️ [AUDIO] Current state:', { isRecording, isPaused });
    
    if (!recordingRef.current || !isRecording || !isPaused) {
      console.log('⚠️ [AUDIO] Cannot resume - invalid state');
      return;
    }

    try {
      console.log('▶️ [AUDIO] Resuming recording...');
      await recordingRef.current.startAsync();
      setIsPaused(false);
      startDurationTimer();
      console.log('✅ [AUDIO] Recording resumed successfully');
    } catch (error) {
      console.error('❌ [AUDIO] Failed to resume recording:', error);
    }
  }, [isRecording, isPaused, startDurationTimer]);

  const deleteRecording = useCallback(async () => {
    console.log('🗑️ [AUDIO] deleteRecording called');
    console.log('🗑️ [AUDIO] Current state:', { isRecording, isPaused });
    
    if (recordingRef.current) {
      console.log('🗑️ [AUDIO] Stopping recording for deletion...');
      try {
        await recordingRef.current.stopAndUnloadAsync();
        console.log('🗑️ [AUDIO] Recording stopped for deletion');
      } catch (error) {
        console.log('⚠️ [AUDIO] Error stopping recording during delete:', error);
      }
      recordingRef.current = null;
    }
    
    stopDurationTimer();
    setIsRecording(false);
    setIsPaused(false);
    setAudioUri(null);
    console.log('✅ [AUDIO] Recording deleted successfully');
  }, [stopDurationTimer]);

  const cleanupRecording = async () => {
    console.log('🗑️ [AUDIO] Cleaning up recording...');
    
    // Clear duration timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    
    // Stop and unload recording
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        console.log('🗑️ [AUDIO] Error stopping recording:', e);
      }
      recordingRef.current = null;
    }
    
    // Reset states
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    
    // Reset audio mode
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (e) {
      console.log('🗑️ [AUDIO] Error resetting audio mode:', e);
    }
    
    console.log('✅ [AUDIO] Cleanup complete');
  };

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    deleteRecording,
    cleanupRecording,
    checkAudioPermission,
    requestAudioPermission,
    isRecording,
    isPaused,
    duration,
    audioUri,
  };
};

export default useAudioRecorder;