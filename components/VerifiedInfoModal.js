import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FONTS } from '../constants/font';

const VerifiedInfoModal = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeIcon}>×</Text>
      </TouchableOpacity>

      <View style={styles.modal}>
        <Text style={styles.title}>What does "Verified" mean?</Text>
        <Text style={styles.description}>
          Verified profiles have completed identity checks including face and ID verification to confirm they are who they say they are.
        </Text>
        <Text style={styles.subtitle}>Why it matters:</Text>
        <Text style={styles.description}>
          It helps build trust and keeps your experiences safer.
        </Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
  },
  closeIcon: {
    color: '#fff',
    fontSize: 34,
  },
  modal: {
    width: '90%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.medium,
    marginBottom: 16,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  button: {
    backgroundColor: '#ec066a',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});

export default VerifiedInfoModal;
