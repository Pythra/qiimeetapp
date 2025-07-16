import { Audio } from 'expo-av';
import { useState, useRef } from 'react';
import { Alert } from 'react-native';

const useAudioRecorder = () => {
  const recordingRef = useRef(null);
  const [audioUri, setAudioUri] = useState(null);

  const startRecording = async () => {
    console.debug('Entered startRecording');
    try {
      console.debug('Requesting audio recording permissions...');
      const perm = await Audio.requestPermissionsAsync();
      console.debug('Permissions result:', perm);
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required to record audio.');
        console.error('Microphone permission not granted.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.debug('Audio mode set. Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      recordingRef.current = recording;
      console.debug('Recording started:', recording);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = async () => {
    console.debug('Entered stopRecording');
    try {
      const recording = recordingRef.current;
      if (!recording) {
        console.debug('No recording in progress to stop.');
        return;
      }
      console.debug('Stopping and unloading recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      console.debug('Recording stopped. File URI:', uri);
      return uri; // upload this to server (e.g. S3)
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording: ' + err.message);
    }
  };

  return { 
    startRecording: async () => {
      try {
        await startRecording();
      } catch (err) {
        console.error('Unexpected error in startRecording:', err);
      }
    },
    stopRecording: async () => {
      try {
        return await stopRecording();
      } catch (err) {
        console.error('Unexpected error in stopRecording:', err);
      }
    },
    audioUri 
  };
};

export default useAudioRecorder; 