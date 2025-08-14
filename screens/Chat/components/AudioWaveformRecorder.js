import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AudioWaveformRecorder = ({
  isRecording,
  isPaused,
  recordingDuration,
  onPauseResume,
  onDelete,
  onSend,
  audioUri,
  formatTime
}) => {
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  
  // Create animated bars for waveform
  const waveformBars = useMemo(() => {
    const bars = [];
    for (let i = 0; i < 20; i++) {
      bars.push(new Animated.Value(0.3));
    }
    return bars;
  }, []);
  
  // Animate bars when recording
  const animateBars = useCallback(() => {
    if (!isRecording || isPaused) return;
    
    const animations = waveformBars.map((bar, index) => {
      const randomHeight = Math.random() * 0.7 + 0.3; // 0.3 to 1.0
      return Animated.timing(bar, {
        toValue: randomHeight,
        duration: 200 + Math.random() * 300, // 200-500ms
        useNativeDriver: false,
      });
    });
    
    Animated.parallel(animations).start(() => {
      if (isRecording && !isPaused) {
        animateBars();
      }
    });
  }, [isRecording, isPaused, waveformBars]);
  
  // Start/stop animation based on recording state
  React.useEffect(() => {
    if (isRecording && !isPaused) {
      animateBars();
    } else {
      // Reset bars to base height
      waveformBars.forEach(bar => bar.setValue(0.3));
    }
  }, [isRecording, isPaused, animateBars]);
  
  // Add a subtle pulse animation to the recording indicator
  const pulseAnimation = useMemo(() => new Animated.Value(1), []);
  
  React.useEffect(() => {
    if (isRecording && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRecording, isPaused, pulseAnimation]);

  const handlePauseResume = useCallback(() => {
    if (isButtonPressed) return;
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 200);
    if (onPauseResume) {
      onPauseResume();
    }
  }, [onPauseResume, isButtonPressed]);

  const handleDelete = useCallback(() => {
    if (isButtonPressed) return;
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 200);
    if (onDelete) {
      onDelete();
    }
  }, [onDelete, isButtonPressed]);

  const handleSend = useCallback(() => {
    if (isButtonPressed) return;
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 200);
    if (onSend) {
      onSend();
    }
  }, [onSend, isButtonPressed]);

  return (
    <View style={styles.container}>
      {/* Main Display */}
      <View style={styles.waveformDisplay}>
        <TouchableOpacity 
          onPress={handlePauseResume} 
          style={styles.playButton}
          activeOpacity={0.6}
          disabled={isButtonPressed}
        >
          <Ionicons 
            name={isPaused ? 'play' : 'pause'} 
            size={20} 
            color="#ff2d7a" 
          />
        </TouchableOpacity>
        
        <View style={styles.waveformArea}>
          {isRecording || audioUri ? (
            <View style={styles.recordingWaveform}>
              {isRecording ? (
                <Animated.View 
                  style={[
                    styles.waveformContainer,
                    {
                      transform: [{ scale: pulseAnimation }],
                    },
                  ]}
                >
                  {waveformBars.map((bar, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.waveformBar,
                        {
                          height: bar.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['6px', '20px'],
                          }),
                        },
                      ]}
                    />
                  ))}
                </Animated.View>
              ) : (
                <Text style={styles.recordingText}>Audio ready</Text>
              )}
            </View>
          ) : (
            <View style={styles.placeholderWaveform}>
              <Text style={styles.recordingText}>Tap to record</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.timeDisplay}>{formatTime(recordingDuration)}</Text>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          onPress={handleDelete} 
          style={styles.trashButton}
          activeOpacity={0.6}
          disabled={isButtonPressed}
        >
          <Image 
            source={require('../../../assets/trash.png')} 
            style={styles.trashIcon}
          />
        </TouchableOpacity>
        
          <TouchableOpacity 
          onPress={handlePauseResume} 
            style={styles.micButton}
          activeOpacity={0.6}
          disabled={isButtonPressed}
          >
            <Ionicons 
              name="mic" 
              size={28} 
            color="#ff2d7a"
            />
          </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleSend} 
          style={styles.sendButton}
          activeOpacity={0.7}
          disabled={isButtonPressed}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181818',
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
  },
  waveformDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 25,
    padding: 12,
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  playButton: {
    padding: 8,
    marginRight: 12,
  },
  waveformArea: {
    flex: 1,
    marginHorizontal: 8,
    height: 40,
    justifyContent: 'center',
  },
  recordingWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingVertical: 5,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#ff2d7a',
    borderRadius: 2,
    minHeight: 6,
  },
  placeholderWaveform: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingText: {
    color: 'rgba(255, 45, 122, 0.7)',
    fontSize: 14,
    fontWeight: '400',
  },
  timeDisplay: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'right',
    marginLeft: 12,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  trashButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  trashIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  micButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  sendButton: {
    backgroundColor: '#ff2d7a',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff2d7a',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default AudioWaveformRecorder;