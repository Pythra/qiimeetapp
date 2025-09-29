import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { FONTS } from '../../../constants/font';
import googleIcon from '../../../assets/google.png';

const OAuthErrorModal = ({ visible, onRetry, onClose, title = "Authentication Issue", subtitle = "Were you authenticated properly? If not, try again. If you were, just close this dialog.", buttonText = "Try Again" }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Start animation when modal becomes visible
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 100 }),
        withSpring(1, { damping: 12, stiffness: 100 })
      );
    } else {
      // Reset animation when modal is hidden
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Animated.View style={[styles.errorIcon, animatedIconStyle]}>
            <View style={styles.iconContainer}>
              <Image
                source={googleIcon}
                style={styles.googleIcon}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
          
          <Text style={styles.title}>{title}</Text>
          
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={onRetry}
            >
              <Text style={styles.retryText}>{buttonText}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  errorIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    backgroundColor: '#ec066a',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  googleIcon: {
    width: 32,
    height: 32,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    marginHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#ec066a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '100%',
  },
  closeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
});

export default OAuthErrorModal;
