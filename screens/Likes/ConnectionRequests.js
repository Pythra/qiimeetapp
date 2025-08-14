import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FONTS } from '../../constants/font';
import ConnectionPolicyModal from './ConnectionPolicyModal';
import ConnectionLimitModal from './ConnectionLimitModal';
import TopHeader from '../../components/TopHeader';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';
import { useAuth } from '../../components/AuthContext';

const ConnectionRequests = ({ navigation }) => {
  const { user: currentUser, allUsers, updateUser, getProfileImageSource } = useAuth();
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequester, setSelectedRequester] = useState(null);
  const [pastConnections, setPastConnections] = useState([]);

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

  const fetchData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      
      if (!currentUser) return;
      
      // Fetch requesters
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token');
      
      const res = await fetch(`${API_BASE_URL}/auth/my-requesters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.requesters && data.requesters.length > 0) {
        // Use AuthContext allUsers data if available, otherwise fetch
        let allUsersData = [];
        if (allUsers && allUsers.length > 0) {
          allUsersData = allUsers;
        } else {
          // Fetch all users with complete data only if not available in context
          const allUsersRes = await fetch(`${API_BASE_URL}/admin/users/home`);
          const allUsersResponse = await allUsersRes.json();
          allUsersData = allUsersResponse.users || [];
        }
        
        // Map requesters to complete user data
        const completeRequesters = data.requesters.map(requester => {
          const completeUser = allUsersData.find(user => user._id === requester._id);
          return completeUser || requester; // Fallback to original requester data if not found
        });
        
        setRequests(completeRequesters);
      } else {
        setRequests([]);
      }

      // Fetch past connections for the "View Past Connections" button
      if (currentUser.pastConnections && currentUser.pastConnections.length > 0) {
        let allUsersData = [];
        if (allUsers && allUsers.length > 0) {
          allUsersData = allUsers;
        } else {
          // Fetch all users with complete data only if not available in context
          const allUsersRes = await fetch(`${API_BASE_URL}/admin/users/home`);
          const allUsersResponse = await allUsersRes.json();
          allUsersData = allUsersResponse.users || [];
        }
        
        // Map past connection IDs to complete user data
        const completePastConnections = currentUser.pastConnections.map(connectionId => {
          const completeUser = allUsersData.find(user => user._id === connectionId);
          return completeUser || { _id: connectionId }; // Fallback to basic object if not found
        }).filter(Boolean);
        
        setPastConnections(completePastConnections);
      } else {
        setPastConnections([]);
      }
    } catch (err) {
      console.error('Error fetching connection requests:', err);
      setRequests([]);
      setPastConnections([]);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  const onRefresh = React.useCallback(() => {
    console.log('Pull to refresh triggered for connection requests');
    fetchData(true);
  }, []);

  // Initial load
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('ConnectionRequests screen focused - refreshing data');
      if (currentUser) {
        fetchData();
      }
    }, [currentUser])
  );

  const handleAccept = (requester) => {
    // Check if user already has a connection or pending request
    const hasActiveConnection = currentUser?.connections && currentUser.connections.length > 0;
    const hasPendingRequest = currentUser?.requests && currentUser.requests.length > 0;
    
    if (hasActiveConnection || hasPendingRequest) {
      setLimitModalVisible(true);
      return;
    }
    setSelectedRequester(requester);
    setPolicyModalVisible(true);
  };

  const handleReject = (requester) => {
    setSelectedRequester(requester);
    setRejectModalVisible(true);
  };

  const handlePolicyAccept = async () => {
    setPolicyModalVisible(false);
    if (!currentUser || !selectedRequester) return;
    
    // Navigate to chat without specifying chatId - let ChatInterface create it
    navigation.navigate('MainTabs', {
      screen: 'Chat',
      params: {
        connectionEstablished: true,
        newConnectionUserId: selectedRequester._id,
        screen: 'ChatInterface',
        params: {
          otherUserId: selectedRequester._id, // the person you are chatting with
          otherUser: selectedRequester, // pass the full user object
        }
      }
    });
    
    // Call backend to update connections
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/accept-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: selectedRequester._id }),
      });
      
      if (response.ok) {
        const responseData = await response.json();
        // Update user data in AuthContext
        updateUser(responseData);
        // Remove accepted requester from requests state
        setRequests(prev => prev.filter(r => r._id !== selectedRequester._id));
      }
    } catch (err) {
      // Handle error (show toast, etc.)
      console.error('Failed to accept connection', err);
    }
  };

  const handleUpgradeConnections = () => {
    setLimitModalVisible(false);
    try {
      navigation.navigate('Premium', { screen: 'PayForConnection' });
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      navigation.navigate('Premium');
    }
  };

  return (
    <View style={styles.container} edges={['top']}>
      <TopHeader 
        title="Connection requests"
        onBack={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.requestsList} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ec066a"
            colors={["#ec066a"]}
          />
        }
      >
        {/* Info Boxes */}
        <TouchableOpacity style={styles.infoBox}>
          <View style={styles.infoBoxContent}>
          <Ionicons name="information-circle" size={18} color="#666" style={{marginRight: 16}}/>
            <View>
              <Text style={styles.infoBoxSubtitle}>
              You have some pending connection requests. 
              Review them before they expire.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Only show "View Past Connections" if there are actual past connections */}
        {pastConnections.length > 0 && (
          <TouchableOpacity 
            style={styles.infoBox}
            onPress={() => navigation.navigate('PastConnections')}
          >
            <View style={styles.infoBoxContent}>
              <Text style={styles.infoBoxTitle}>View past connections</Text>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </View>
          </TouchableOpacity>
        )}

        {/* Request Cards */}
        {requests.length > 0 ? requests.map((request) => (
          <View key={request._id} style={styles.requestCard}>
            <Image 
              source={getProfileImageSource(request)}
              style={styles.userImage} 
            />
            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>
                  {request.username || request.name || request.phone || 'User'}
                  {(request.age || calculateAge(request.dateOfBirth)) ? `, ${request.age || calculateAge(request.dateOfBirth)}` : ''}
                </Text>
                {request.verificationStatus === 'true' && (
                  <MaterialIcons name="verified" size={16} color="#EC066A" style={styles.verifiedIcon} />
                )}
              </View>
              <Text style={styles.userLocation}>{request.location || ''}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(request)}>
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(request)}>
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )) : <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>No connection requests yet</Text>}
      </ScrollView>

      <ConnectionPolicyModal 
        visible={policyModalVisible}
        onClose={() => setPolicyModalVisible(false)}
        onAccept={handlePolicyAccept}
        targetUserId={selectedRequester?._id}
        onConnectionLimit={() => setLimitModalVisible(true)}
        modalType="accept"
      />

      <ConnectionLimitModal 
        visible={limitModalVisible}
        onClose={() => setLimitModalVisible(false)}
        onUpgrade={handleUpgradeConnections}
        currentConnections={currentUser?.connections?.length || 0}
        maxConnections={1}
        hasPendingRequest={(currentUser?.connections && currentUser.connections.length > 0) || (currentUser?.requests && currentUser.requests.length > 0)}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={rejectModalVisible}
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRejectModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
           
          <View style={styles.xIconContainer}>
            <FontAwesome6 name="xmark" size={67} color="#fff" />
          </View>
            <Text style={styles.modalTitle}>Are you sure you want to reject this connection request?</Text>
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={async () => {
                  setRejectModalVisible(false);
                  if (!selectedRequester) return;
                  
                  try {
                    const token = await AsyncStorage.getItem('token');
                    await fetch(`${API_BASE_URL}/auth/reject-connection`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({ targetUserId: selectedRequester._id }),
                    });
                    // Remove rejected requester from requests state
                    setRequests(prev => prev.filter(r => r._id !== selectedRequester._id));
                  } catch (err) {
                    console.error('Failed to reject connection', err);
                  }
                }}
              >
                <Text style={styles.modalButtonTextConfirm}>Yes</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>No</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 32,
  },
  requestsList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30, // Add bottom padding to prevent cutoff
  },
  requestCard: {
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
  verifiedIcon: {
    marginLeft: 4,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS?.medium || 'System',
  },
  userLocation: {
    color: '#888',
    fontSize: 14,
    marginVertical: 12,
    fontFamily: FONTS?.regular || 'System',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4, // Add some space above buttons
  },
  acceptButton: {
    backgroundColor: '#Ec066a',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  acceptText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  rejectButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ec066a',
    minWidth: 100,
    alignItems: 'center',
  },
  rejectText: {
    color: '#ec066a',
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
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  xIconContainer: {
    width: 104,
    height: 104,
    backgroundColor: '#dc3545',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    width: 104,
    height: 104,
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 24,
    fontFamily: FONTS.regular,
    paddingHorizontal: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
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
    borderColor: '#ec066a',
  },
  confirmModalButton: {
    backgroundColor: '#ec066a',
  },
  modalButtonTextCancel: {
    color: '#ec066a',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 24,
    fontFamily: FONTS.regular,
  },
  infoBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 24,
    padding: 16,
  },
  infoBoxContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoBoxTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS?.medium || 'System',
    marginBottom: 4,
  },
  infoBoxSubtitle: {
    color: '#666',
    fontSize: 14,
    fontFamily: FONTS?.regular || 'System',
    width: '57%',
  },
  xIcon: {
    width: 104,
    height: 104,
  },
});

export default ConnectionRequests;