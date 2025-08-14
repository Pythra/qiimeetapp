import React from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/font';

const IncomingConnectionModal = ({ isVisible, user, onAccept, onClose }) => {
  const getImageSource = (imagePath) => {
    const cloudFrontUrl = 'https://d11n4tndq0o4wh.cloudfront.net';
    if (!imagePath) return require('../assets/model.jpg');
    if (imagePath.startsWith('http')) return { uri: imagePath };
    return { uri: `${cloudFrontUrl}/uploads/images/${imagePath}` };
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Image 
            source={getImageSource(user?.profilePictures?.[0])}
            style={styles.userImage}
          />
          <Text style={styles.userName}>{user?.username}</Text>
          <Text style={styles.text}>Connection Accepted!</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Ionicons name="close-circle" size={50} color="#ff2d7a" />
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onAccept}>
              <Ionicons name="chatbubble-ellipses" size={50} color="#4CAF50" />
              <Text style={styles.buttonText}>Chat Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '90%',
  },
  userImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: 10,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.regular,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    alignItems: 'center',
    padding: 15,
  },
  buttonText: {
    color: '#fff',
    marginTop: 5,
    fontFamily: FONTS.medium,
  }
});

export default IncomingConnectionModal;
