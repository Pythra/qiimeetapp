import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import { FontAwesome6 } from '@expo/vector-icons';

const ConnectionLimitModal = ({ visible, onClose, onUpgrade, currentConnections, maxConnections, remainingConnections }) => {
  const getModalContent = () => {
    if (currentConnections === 0) {
      return {
        title: "No Connections Available",
        description: "You need to purchase connections to start connecting with people. Get started with our connection packages!",
        buttonText: "Get Connections",
        icon: "lock"
      };
    } else {
      return {
        title: "Connection Limit Reached",
        description: `You've used all ${currentConnections} of your available connections. Upgrade to get more connections and continue meeting new people!`,
        buttonText: "Get More Connections",
        icon: "upgrade"
      };
    }
  };

  const modalContent = getModalContent();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <FontAwesome6 name="xmark" size={56} color="#fff" style={{}} />
            </View>
            <Text style={styles.title}>{modalContent.title}</Text>
            <Text style={styles.description}>{modalContent.description}</Text>
            
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionText}>
                Used: {currentConnections}/{maxConnections} connections
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={onUpgrade}
            >
              <Text style={styles.upgradeButtonText}>
                {modalContent.buttonText}
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
    padding: 24,
    width: '100%',
    alignItems: 'center',
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
  iconContainer: {
    width: 75,
    height: 75,
    borderRadius: 52,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold', 
    marginBottom: 16,
    fontFamily: FONTS?.bold || 'System',
    textAlign: 'center',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    lineHeight: 24, 
    marginBottom: 24,
    fontFamily: FONTS?.regular || 'System',
    textAlign: 'center',
  },
  connectionInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  connectionText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS?.medium || 'System',
  },
  upgradeButton: {
    backgroundColor: '#ec066a',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 90,
    alignItems: 'center',
    width: '100%',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS?.medium || 'System',
  },
});

export default ConnectionLimitModal; 