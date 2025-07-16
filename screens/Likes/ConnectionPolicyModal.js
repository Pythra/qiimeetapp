import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';
import notificationService from '../../utils/notificationService';

const ConnectionPolicyModal = ({ visible, onClose, onAccept, modalType = 'request', targetUserId, onConnectionLimit }) => {
  const [isChecked, setIsChecked] = useState(false);

  console.log('Modal render, targetUserId:', targetUserId, 'visible:', visible);

  const handleAccept = async () => {
    console.log('handleAccept called, isChecked:', isChecked, 'targetUserId:', targetUserId);
    if (isChecked && targetUserId) {
      console.log('handleAccept called');
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('Token:', token);
        console.log('Target User ID:', targetUserId);
        
        // Ensure notification token is up to date
        if (notificationService.token) {
          await notificationService.saveTokenToServer(notificationService.token);
        }
        
        const res = await fetch(`${API_BASE_URL}/auth/add-requester`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ targetUserId }),
        });
        console.log('Response status:', res.status);
        const resData = await res.json().catch(() => ({}));
        console.log('Response data:', resData);
        
        if (res.ok) {
          onAccept();
        } else if (res.status === 403 && resData.code === 'NO_CONNECTIONS') {
          // Handle connection limit reached: just close the modal, do not show the limit modal
          console.log('Connection limit reached:', resData);
          onClose();
          // Optionally show a toast/snackbar here
        } else {
          console.log('Failed to add requester:', resData);
          // Optionally show error
        }
      } catch (err) {
        console.log('Error in handleAccept:', err);
        // Optionally show error
      }
      setIsChecked(false); // Reset checkbox when modal closes
    }
  };

  const getModalContent = () => {
    if (modalType === 'likes') {
      return {
        title: "One Connection at a Time",
        description: [
          "To ensure meaningful connections, you can only connect with one person at a time on our platform. While you're connected, you will not be able to chat with anyone else until your current connection is either ended or moved forward.",
          'By clicking "I accept," you acknowledge and agree to this policy.',
        ]
      };
    }
    return {
      title: "One Connection at a Time",
      description: [
        "At Qiimeet, we value meaningful connections. To ensure genuine and focused interactions, accepting a connection means you won't be able to accept any other requests or connect with anyone else until your current connection is ended.",
        "Before proceeding, please confirm that you understand and agree to this policy.",
      ]
    };
  };

  const modalContent = getModalContent();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onShow={() => console.log('ConnectionPolicyModal is visible')}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.modalContent}>
            <Text style={styles.title}>{modalContent.title}</Text>
            {modalContent.description.map((text, index) => (
              <Text key={index} style={styles.description}>{text}</Text>
            ))}
            <View style={styles.policyContainer}>
              <TouchableOpacity 
                style={[styles.checkbox, isChecked && styles.checkedBox]}
                onPress={() => {
                  setIsChecked(!isChecked);
                  console.log('Checkbox toggled:', !isChecked);
                }}
              >
                {isChecked && <MaterialIcons name="check" size={16} color="#fff" />}
              </TouchableOpacity>
              <Text style={styles.policyText}>I accept the policy</Text>
            </View>

            <TouchableOpacity 
              style={[styles.connectButton, isChecked && styles.activeConnectButton]}
              onPress={() => {
                console.log('Connect button pressed');
                handleAccept();
              }}
              disabled={!isChecked}
            >
              <Text style={[styles.connectButtonText, isChecked && styles.activeConnectButtonText]}>
                Connect
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    position: 'relative', 
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 22,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: -36,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16, 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold', 
    marginBottom: 16,
    fontFamily: FONTS?.bold || 'System',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    lineHeight: 24, 
    marginBottom: 24,
    fontFamily: FONTS?.regular || 'System',
  },
  policyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#666',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkedBox: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  policyText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    fontFamily: FONTS?.regular || 'System',
  },
  connectButton: {
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 90,
    alignItems: 'center',
    marginTop: 8,
  },
  activeConnectButton: {
    backgroundColor: '#E91E63',
  },
  connectButtonText: {
    color: '#666',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS?.medium || 'System',
  },
  activeConnectButtonText: {
    color: '#fff',
  },
});

export default ConnectionPolicyModal;