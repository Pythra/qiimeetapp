import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FONTS } from '../../constants/font';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ConnectionModal = ({ visible, onClose, onConnect }) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleConnect = () => {
    if (isChecked) {
      onConnect();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>X</Text>
          </TouchableOpacity>
        <View style={styles.modalContent}>

          <Text style={styles.title}>One Connection at a Time</Text>
          
          <Text style={styles.description}>
            To ensure meaningful connections, you can only connect with one person at a time on our platform. While you're connected, you will not be able to start a new connection with your next match. Connection is either ended or moved forward.
          </Text>

          <View style={styles.policyContainer}>
            <TouchableOpacity 
              style={[styles.checkbox, isChecked && styles.checkedBox]}
              onPress={() => setIsChecked(!isChecked)}
            >
              {isChecked && <MaterialIcons name="check" size={16} color="#fff" />}
            </TouchableOpacity>
            <Text style={styles.policyText}>I accept the policy</Text>
          </View>

          <TouchableOpacity 
            style={[styles.connectButton, isChecked && styles.activeConnectButton]}
            onPress={handleConnect}
            disabled={!isChecked}
          >
            <Text style={[styles.connectButtonText, isChecked && styles.activeConnectButtonText]}>
              Connect
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  closeIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: FONTS.regular,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: FONTS.regular,
  },
  policyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    marginRight: 8,
  },
  checkedBox: {
    backgroundColor: '#ec066a',
    borderColor: '#ec066a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  connectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 90,
    alignItems: 'center',
  },
  activeConnectButton: {
    backgroundColor: '#ec066a',
  },
  connectButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  activeConnectButtonText: {
    color: '#FFFFFF',
  },
});

export default ConnectionModal;