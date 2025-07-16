import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS } from '../../../constants/font';
import { FontAwesome6 } from '@expo/vector-icons';

const InsufficientBalanceModal = ({ visible, onClose, onFundWallet, currentBalance, requiredAmount }) => {
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
            <Text style={styles.title}>Insufficient Balance</Text>
            <Text style={styles.description}>
              You don't have enough balance to make this connection. Fund your wallet to continue connecting with people!
            </Text>
            
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceText}>
                Current Balance: ₦{currentBalance?.toLocaleString() || '0'}
              </Text>
              <Text style={styles.requiredText}>
                Required: ₦{requiredAmount?.toLocaleString() || '0'}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.fundButton}
              onPress={onFundWallet}
            >
              <Text style={styles.fundButtonText}>
                Fund Wallet
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
  balanceInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  balanceText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS?.medium || 'System',
    textAlign: 'center',
    marginBottom: 4,
  },
  requiredText: {
    color: '#ec066a',
    fontSize: 14,
    fontFamily: FONTS?.medium || 'System',
    textAlign: 'center',
  },
  fundButton: {
    backgroundColor: '#ec066a',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 90,
    alignItems: 'center',
    width: '100%',
  },
  fundButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS?.medium || 'System',
  },
});

export default InsufficientBalanceModal; 