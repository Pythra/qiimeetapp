import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';

const VerifiedInfoModal = ({ visible, onClose }) => {
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
            <Text style={styles.title}>What does "Verified" mean?</Text>
            <Text style={styles.description}>
             Verified profiles have completed identity checks including face and ID verification to confirm they are who they say they are.
            </Text>
            <Text style={styles.description}>
              Turning this on means you’ll only see profiles of people who have been verified by Qiimeet for extra safety and authenticity.
            </Text>
            <Text style={[styles.title, styles.subTitle]}>Why it matters</Text>
            <Text style={styles.description}>
             It helps build trust and keeps your experience safer. 
            </Text>
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
  subTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 3
  },
  description: {
    color: 'rgba(255, 255, 255, 0.5) ',
    fontSize: 16,
    lineHeight: 24, 
    marginBottom: 12,
    fontFamily: FONTS?.regular || 'System',
  },
});

export default VerifiedInfoModal;
