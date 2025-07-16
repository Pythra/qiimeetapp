import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FONTS } from './font';

const HollowButton = ({ title, onPress, style, textStyle, ...props }) => (
  <TouchableOpacity
    style={[styles.button, style]}
    onPress={onPress}
    activeOpacity={0.7}
    {...props}
  >
    <Text style={[styles.buttonText, textStyle]}>{title}</Text>
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
});

export default HollowButton;
