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
import greenWhiteCheck from '../../../assets/greenwhitecheck.png';

const PaymentSuccessModal = ({ visible, onContinue, title = "Payment successful!", subtitle, buttonText = "Continue" }) => {
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
          <Animated.View style={[styles.successIcon, animatedIconStyle]}>
            <View style={{
              backgroundColor: '#6EC531',
              borderRadius: 52,
              width: 104,
              height: 104,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <Image
                source={greenWhiteCheck}
                style={{ width: 104, height: 104 }}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
          
          <Text style={styles.title}>{title}</Text>
          
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={onContinue}
          >
            <Text style={styles.continueText}>{buttonText}</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
    minHeight: '100%',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    paddingVertical: 40, 
    alignItems: 'center',
    width: '100%', 
    justifyContent: 'center',
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    marginHorizontal: 16,
  },
  continueButton: {
    backgroundColor: '#ec066a',
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 90,
    width: '87%',
  },
  continueText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default PaymentSuccessModal; 