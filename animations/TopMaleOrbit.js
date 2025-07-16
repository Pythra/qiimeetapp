import React, { useRef, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';

export default function TopMaleOrbit() {
  const { width, height } = Dimensions.get('window');
  const orbitRadius = width * 0.65;
  const revolveSpeed = 12000;

  const inputRange = [
    0, 0.025, 0.05, 0.075, 0.1, 0.125, 0.15, 0.175, 0.2, 0.225, 0.25, 0.275, 0.3, 0.325, 0.35, 0.375, 
    0.4, 0.425, 0.45, 0.475, 0.5, 0.525, 0.55, 0.575, 0.6, 0.625, 0.65, 0.675, 0.7, 0.725, 0.75, 0.775,
    0.8, 0.825, 0.85, 0.875, 0.9, 0.925, 0.95, 0.975, 1, 1.025, 1.05, 1.075, 1.1, 1.125, 1.15, 1.175, 1.2, 1.225, 1.25
  ];

  const outputRangeX = [
    orbitRadius,                              // 0°
    orbitRadius * Math.cos(Math.PI * 0.05),  // 9°
    orbitRadius * Math.cos(Math.PI * 0.1),   // 18°
    orbitRadius * Math.cos(Math.PI * 0.15),  // 27°
    orbitRadius * Math.cos(Math.PI * 0.2),   // 36°
    orbitRadius * Math.cos(Math.PI * 0.25),  // 45°
    orbitRadius * Math.cos(Math.PI * 0.3),   // 54°
    orbitRadius * Math.cos(Math.PI * 0.35),  // 63°
    orbitRadius * Math.cos(Math.PI * 0.4),   // 72°
    orbitRadius * Math.cos(Math.PI * 0.45),  // 81°
    0,                                       // 90°
    -orbitRadius * Math.cos(Math.PI * 0.45), // 99°
    -orbitRadius * Math.cos(Math.PI * 0.4),  // 108°
    -orbitRadius * Math.cos(Math.PI * 0.35), // 117°
    -orbitRadius * Math.cos(Math.PI * 0.3),  // 126°
    -orbitRadius * Math.cos(Math.PI * 0.25), // 135°
    -orbitRadius * Math.cos(Math.PI * 0.2),  // 144°
    -orbitRadius * Math.cos(Math.PI * 0.15), // 153°
    -orbitRadius * Math.cos(Math.PI * 0.1),  // 162°
    -orbitRadius * Math.cos(Math.PI * 0.05), // 171°
    -orbitRadius,                            // 180°
    -orbitRadius * Math.cos(Math.PI * 0.05), // 189°
    -orbitRadius * Math.cos(Math.PI * 0.1),  // 198°
    -orbitRadius * Math.cos(Math.PI * 0.15), // 207°
    -orbitRadius * Math.cos(Math.PI * 0.2),  // 216°
    -orbitRadius * Math.cos(Math.PI * 0.25), // 225°
    -orbitRadius * Math.cos(Math.PI * 0.3),  // 234°
    -orbitRadius * Math.cos(Math.PI * 0.35), // 243°
    -orbitRadius * Math.cos(Math.PI * 0.4),  // 252°
    -orbitRadius * Math.cos(Math.PI * 0.45), // 261°
    0,                                       // 270°
    orbitRadius * Math.cos(Math.PI * 0.45),  // 279°
    orbitRadius * Math.cos(Math.PI * 0.4),   // 288°
    orbitRadius * Math.cos(Math.PI * 0.35),  // 297°
    orbitRadius * Math.cos(Math.PI * 0.3),   // 306°
    orbitRadius * Math.cos(Math.PI * 0.25),  // 315°
    orbitRadius * Math.cos(Math.PI * 0.2),   // 324°
    orbitRadius * Math.cos(Math.PI * 0.15),  // 333°
    orbitRadius * Math.cos(Math.PI * 0.1),   // 342°
    orbitRadius * Math.cos(Math.PI * 0.05),  // 351°
    orbitRadius,                             // 360°
    orbitRadius * Math.cos(Math.PI * 0.05),  // 369° (extends for smooth loop)
    orbitRadius * Math.cos(Math.PI * 0.1),   // 378°
    orbitRadius * Math.cos(Math.PI * 0.15),  // 387°
    orbitRadius * Math.cos(Math.PI * 0.2),   // 396°
    orbitRadius * Math.cos(Math.PI * 0.25),  // 405°
    orbitRadius * Math.cos(Math.PI * 0.3),   // 414°
    orbitRadius * Math.cos(Math.PI * 0.35),  // 423°
    orbitRadius * Math.cos(Math.PI * 0.4),   // 432°
    orbitRadius * Math.cos(Math.PI * 0.45),  // 441°
    0                                        // 450° (90° + 360°)
  ];

  const outputRangeY = [
    0,                                       // 0°
    -orbitRadius * Math.sin(Math.PI * 0.05), // 9°
    -orbitRadius * Math.sin(Math.PI * 0.1),  // 18°
    -orbitRadius * Math.sin(Math.PI * 0.15), // 27°
    -orbitRadius * Math.sin(Math.PI * 0.2),  // 36°
    -orbitRadius * Math.sin(Math.PI * 0.25), // 45°
    -orbitRadius * Math.sin(Math.PI * 0.3),  // 54°
    -orbitRadius * Math.sin(Math.PI * 0.35), // 63°
    -orbitRadius * Math.sin(Math.PI * 0.4),  // 72°
    -orbitRadius * Math.sin(Math.PI * 0.45), // 81°
    -orbitRadius,                            // 90°
    -orbitRadius * Math.sin(Math.PI * 0.45), // 99°
    -orbitRadius * Math.sin(Math.PI * 0.4),  // 108°
    -orbitRadius * Math.sin(Math.PI * 0.35), // 117°
    -orbitRadius * Math.sin(Math.PI * 0.3),  // 126°
    -orbitRadius * Math.sin(Math.PI * 0.25), // 135°
    -orbitRadius * Math.sin(Math.PI * 0.2),  // 144°
    -orbitRadius * Math.sin(Math.PI * 0.15), // 153°
    -orbitRadius * Math.sin(Math.PI * 0.1),  // 162°
    -orbitRadius * Math.sin(Math.PI * 0.05), // 171°
    0,                                       // 180°
    orbitRadius * Math.sin(Math.PI * 0.05),  // 189°
    orbitRadius * Math.sin(Math.PI * 0.1),   // 198°
    orbitRadius * Math.sin(Math.PI * 0.15),  // 207°
    orbitRadius * Math.sin(Math.PI * 0.2),   // 216°
    orbitRadius * Math.sin(Math.PI * 0.25),  // 225°
    orbitRadius * Math.sin(Math.PI * 0.3),   // 234°
    orbitRadius * Math.sin(Math.PI * 0.35),  // 243°
    orbitRadius * Math.sin(Math.PI * 0.4),   // 252°
    orbitRadius * Math.sin(Math.PI * 0.45),  // 261°
    orbitRadius,                             // 270°
    orbitRadius * Math.sin(Math.PI * 0.45),  // 279°
    orbitRadius * Math.sin(Math.PI * 0.4),   // 288°
    orbitRadius * Math.sin(Math.PI * 0.35),  // 297°
    orbitRadius * Math.sin(Math.PI * 0.3),   // 306°
    orbitRadius * Math.sin(Math.PI * 0.25),  // 315°
    orbitRadius * Math.sin(Math.PI * 0.2),   // 324°
    orbitRadius * Math.sin(Math.PI * 0.15),  // 333°
    orbitRadius * Math.sin(Math.PI * 0.1),   // 342°
    orbitRadius * Math.sin(Math.PI * 0.05),  // 351°
    0,                                       // 360°
    -orbitRadius * Math.sin(Math.PI * 0.05), // 369° (extends for smooth loop)
    -orbitRadius * Math.sin(Math.PI * 0.1),  // 378°
    -orbitRadius * Math.sin(Math.PI * 0.15), // 387°
    -orbitRadius * Math.sin(Math.PI * 0.2),  // 396°
    -orbitRadius * Math.sin(Math.PI * 0.25), // 405°
    -orbitRadius * Math.sin(Math.PI * 0.3),  // 414°
    -orbitRadius * Math.sin(Math.PI * 0.35), // 423°
    -orbitRadius * Math.sin(Math.PI * 0.4),  // 432°
    -orbitRadius * Math.sin(Math.PI * 0.45), // 441°
    -orbitRadius                             // 450° (90° + 360°)
  ];

  const spinValue = useRef(new Animated.Value(0.25)).current; // Start at 90° (top of orbit)

  useEffect(() => {
    Animated.loop(
      Animated.timing(
        spinValue,
        {
          toValue: 1.25, // End at 1.25 to complete full circle from 0.25 start
          duration: revolveSpeed,
          useNativeDriver: true,
        }
      )
    ).start();
  }, [spinValue]);

  const animatedTranslateX = spinValue.interpolate({
    inputRange,
    outputRange: outputRangeX
  });

  const animatedTranslateY = spinValue.interpolate({
    inputRange,
    outputRange: outputRangeY
  });

  return (
    <Animated.Image
      source={require('../assets/topmale.jpg')}
      style={{
        width: 97,
        height: 97,
        position: 'absolute',
        top: height * 0.33 - 48.5,
        left: width / 2 - 48.5,
        borderRadius: 50,
        zIndex: 2,
        transform: [
          { translateX: animatedTranslateX },
          { translateY: animatedTranslateY }
        ]
      }}
    />
  );
}