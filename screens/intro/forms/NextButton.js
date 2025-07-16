import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const NextButton = ({ onPress, disabled }) => (
  <TouchableOpacity 
    style={[styles.nextButton, disabled && styles.disabledButton]} 
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.nextButtonText}>Next</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  nextButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NextButton;
