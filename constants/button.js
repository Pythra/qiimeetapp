import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { FONTS } from './font';

const { width, height } = Dimensions.get('window');

const CustomButton = ({ onPress, title, style, disabled }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        disabled && styles.buttonInactive,
        style
      ]} 
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#EC066A',
    borderRadius: 90,
    width: width * 0.87,
    height: height * 0.074,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonInactive: {
    backgroundColor: '#4A4A4A',
  },
  buttonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.regular,
    letterSpacing: 0,
    lineHeight: 32,
  },
});

export default CustomButton;
