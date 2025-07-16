import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const CircularProgress = ({ step, total }) => {
  const size = 40;
  const strokeWidth = 4;
  const center = size / 2;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = total > 0 ? (step / total) * 100 : 0;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <View style={styles.container}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '180deg' }] }}
      >
        <Circle
          stroke="#fff"
          strokeWidth={strokeWidth}
          cx={center}
          cy={center}
          r={radius}
        />
        <Circle
          stroke="#fff"
          fill="transparent"
          strokeWidth={strokeWidth}
          cx={center}
          cy={center}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={styles.text}>{total > 0 ? `${step}/${total}` : '0/0'}</Text>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    position: 'absolute',
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default CircularProgress;
