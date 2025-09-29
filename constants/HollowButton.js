import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FONTS } from './font';

const HollowButton = ({ title, onPress, style, textStyle, disabled, ...props }) => (
  <TouchableOpacity
    style={[
      styles.button, 
      disabled && styles.buttonDisabled,
      style
    ]}
    onPress={onPress}
    activeOpacity={disabled ? 1 : 0.7}
    disabled={disabled}
    {...props}
  >
    <Text style={[
      styles.buttonText, 
      disabled && styles.buttonTextDisabled,
      textStyle
    ]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderColor: '#EC066A',
    borderWidth: 2,
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 0,
  },
  buttonText: {
    color: '#EC066A',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
  buttonDisabled: {
    borderColor: '#666',
    opacity: 0.6,
  },
  buttonTextDisabled: {
    color: '#666',
  },
});

export default HollowButton;
