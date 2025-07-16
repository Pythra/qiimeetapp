import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

const HeartBeatAnimation = () => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const createHeartBeat = () => {
      return Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ]);
    };

    const startAnimation = () => {
      createHeartBeat().start(() => {
        startAnimation();
      });
    };

    startAnimation();
  }, [scaleValue]);

  return (
    <Animated.View style={[styles.heartContainer, { transform: [{ scale: scaleValue }] }]}>
      <Image
        source={require('../assets/hearts.png')}
        style={styles.heartImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heartContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  heartImage: {
    width: 170,
    height: 170,
  },
});

export default HeartBeatAnimation;