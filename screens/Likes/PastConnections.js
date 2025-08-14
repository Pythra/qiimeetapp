import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import { MaterialIcons } from '@expo/vector-icons';
import ConnectionPolicyModal from './ConnectionPolicyModal';
import { useAuth } from '../../components/AuthContext';
import { API_BASE_URL } from '../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PastConnections = ({ navigation }) => {
  const { user: currentUser, allUsers, updateUser, getProfileImageSource } = useAuth();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [pastConnections, setPastConnections] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const fetchPastConnections = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      
      if (!currentUser) return;
      
      // Get past connections from user data
      const pastConnectionsIds = currentUser.pastConnections || [];
      
      if (pastConnectionsIds.length > 0) {
        let allUsersData = [];
        
        // Use AuthContext allUsers data if available
        if (allUsers && allUsers.length > 0) {
          allUsersData = allUsers;
        } else {
          // Fetch all users with complete data only if not available in context
          const token = await AsyncStorage.getItem('token');
          if (!token) throw new Error('No token');
          
          const allUsersRes = await fetch(`${API_BASE_URL}/admin/users/home`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const allUsersResponse = await allUsersRes.json();
          allUsersData = allUsersResponse.users || [];
        }
        
        // Map past connection IDs to complete user data
        const completePastConnections = pastConnectionsIds.map(connectionId => {
          const completeUser = allUsersData.find(user => user._id === connectionId);
          return completeUser || { _id: connectionId }; // Fallback to basic object if not found
        }).filter(Boolean);
        
        setPastConnections(completePastConnections);
      } else {
        setPastConnections([]);
      }
    } catch (err) {
      console.error('Error fetching past connections:', err);
      setPastConnections([]);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  const onRefresh = React.useCallback(() => {
    console.log('Pull to refresh triggered for past connections');
    fetchPastConnections(true);
  }, []);

  // Initial load
  useEffect(() => {
    if (currentUser) {
      fetchPastConnections();
    }
  }, [currentUser]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('PastConnections screen focused - refreshing data');
      if (currentUser) {
        fetchPastConnections();
      }
    }, [currentUser])
  );

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

      <ScrollView style={styles.connectionsList} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#ec066a"
            colors={["#ec066a"]}
          />
        }
      >
        {pastConnections.length > 0 ? (
          pastConnections.map((connection) => (
            <View key={connection._id} style={styles.connectionCard}>
              <Image source={getProfileImageSource(connection)} style={styles.userImage} />
              <View style={styles.userInfo}>
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>
                    {connection.username || connection.name || connection.phone || 'User'}
                    {connection.age || calculateAge(connection.dateOfBirth) ? `, ${connection.age || calculateAge(connection.dateOfBirth)}` : ''}
                  </Text>
                  {connection.verificationStatus === 'true' && (
                    <MaterialIcons name="verified" size={16} color="#EC066A" style={styles.verifiedIcon} />
                  )}
                </View>
                <Text style={styles.userLocation}>{connection.location || ''}</Text>
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
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No past connections found</Text>
            <Text style={styles.emptyStateSubtext}>
              Past connections will appear here when you have previous connections that were ended.
            </Text>
          </View>
        )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONTS?.medium || 'System',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#888',
    fontSize: 16,
    fontFamily: FONTS?.regular || 'System',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default PastConnections; 