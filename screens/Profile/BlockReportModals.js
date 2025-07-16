import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../constants/font';
import CustomButton from '../../constants/button';
import HollowButton from '../../constants/HollowButton';

const BlockReportModals = ({
  blockModalVisible,
  setBlockModalVisible,
  reportModalVisible,
  setReportModalVisible,
}) => {
  const navigation = useNavigation();
  
  return (
    <>
      {/* Block Modal */}
      <Modal
        visible={blockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBlockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setBlockModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Are you sure?</Text>
              <Text style={styles.modalDesc}>
                Blocking a user will prevent them from contacting you and they won't be able to see your profile. You can unblock them anytime.
              </Text>
              <CustomButton
                title="Block"
                onPress={() => {/* handle block logic */}}
                style={{width: '100%'}}
              />
              <HollowButton
                title="Block and Report"
                onPress={() => {
                  setBlockModalVisible(false);
                  navigation.navigate('ReportUser');
                }} 
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setReportModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Report</Text>
              <Text style={styles.modalDesc}>
                If you've encountered inappropriate behavior, reporting the user will help us investigate and take necessary action
              </Text>
              <CustomButton
                title="Report"
                onPress={() => {/* handle report logic */}}
                style={styles.modalReportBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 24,
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
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    fontFamily: FONTS.regular,
  },
  modalDesc: {
    color: 'rgba(225, 225, 225, 0.5)',
    fontSize: 16,
    marginBottom: 32,
    alignSelf: 'flex-start',
    fontFamily: FONTS.regular,
  }, 
  modalReportBtn:{
    width: '100%',
    
  }
});

export default BlockReportModals;
