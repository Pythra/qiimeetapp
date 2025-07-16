import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { FONTS } from '../../../constants/font';
import locationIcon from '../../../assets/loc.png';

const LocationLoadingModal = ({ visible, title = "Getting your location...", subtitle = "Please wait while we access your location" }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Start animation when modal becomes visible
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
    } else {
      // Reset animation when modal is hidden
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
      rotation.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
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
          <Animated.View style={[styles.loadingIcon, animatedIconStyle]}>
            <View style={styles.iconContainer}>
              <Image
                source={locationIcon}
                style={styles.locationImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
          
          <Text style={styles.title}>{title}</Text>
          
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
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
  loadingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    backgroundColor: '#ec066a',
    borderRadius: 52,
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  locationImage: {
    width: 60,
    height: 60,
    tintColor: '#fff',
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
});

export default LocationLoadingModal; 