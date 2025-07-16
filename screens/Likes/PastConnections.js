import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import { MaterialIcons } from '@expo/vector-icons';
import ConnectionPolicyModal from './ConnectionPolicyModal';
import { DUMMY_PROFILES } from '../../constants/dummyData';

const PastConnections = ({ navigation }) => {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);

  const handleDelete = (connection) => {
    setSelectedConnection(connection);
    setDeleteModalVisible(true);
  };

  const handleConnect = (connection) => {
    setSelectedConnection(connection);
    setPolicyModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <TopHeader 
        title="Past Connections"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.connectionsList} showsVerticalScrollIndicator={false}>
        {DUMMY_PROFILES.slice(-4).map((connection) => (
          <View key={connection.id} style={styles.connectionCard}>
            <Image source={connection.image} style={styles.userImage} />
            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>{connection.name}, {connection.age}</Text>
                <MaterialIcons name="verified" size={16} color="#EC066A" style={styles.verifiedIcon} />
              </View>
              <Text style={styles.userLocation}>{connection.distance}</Text>
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.connectButton}
                  onPress={() => handleConnect(connection)}
                >
                  <Text style={styles.connectText}>Connect</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDelete(connection)}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDeleteModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Image 
              source={require('../../assets/redexcircle.png')}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Are you sure you want to delete this connection?</Text>
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  // Add delete logic here
                }}
              >
                <Text style={styles.modalButtonTextConfirm}>Yes</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>No</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Connection Policy Modal */}
      <ConnectionPolicyModal 
        visible={policyModalVisible}
        onClose={() => setPolicyModalVisible(false)}
        onAccept={() => {
          setPolicyModalVisible(false);
          navigation.navigate('AcceptedConnection');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 32,
  },
  connectionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  userImage: {
    width: 72,
    height: 72,
    borderRadius: 90,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center', 
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS?.medium || 'System',
    marginRight: 4,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  userLocation: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
    marginTop: 8,
    fontFamily: FONTS?.regular || 'System',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  connectButton: {
    backgroundColor: '#EC066A',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  connectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EC066A',
    minWidth: 100,
    alignItems: 'center',
  },
  deleteText: {
    color: '#EC066A',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS?.regular || 'System',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 24,
    width: '90%',
  },
  modalIcon: {
    width: 104,
    height: 104,
    marginBottom: 20,
    alignSelf: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 24,
    fontFamily: FONTS.regular,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 90,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelModalButton: { 
    borderWidth: 1,
    borderColor: '#EC066A',
  },
  confirmModalButton: {
    backgroundColor: '#EC066A',
  },
  modalButtonTextCancel: {
    color: '#EC066A',
    fontSize: 24, 
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
});

export default PastConnections; 