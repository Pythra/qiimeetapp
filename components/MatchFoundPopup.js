import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/font';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getImageSource } from '../utils/imageUtils';
import axios from 'axios';
import ConnectionModal from '../screens/Likes/ConnectionModal';
import ConnectionLimitModal from '../screens/Likes/ConnectionLimitModal';
import CustomButton from '../constants/button';
import HollowButton from '../constants/HollowButton';

const MatchFoundPopup = ({ visible, onClose, matchData, onNavigateToConnectionSent, onNavigateToPremium }) => {
  const { token, user: currentUser } = useAuth();
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  // Debug logging - only log when props change meaningfully
  useEffect(() => {
    // Removed debug logging to prevent console spam
  }, [visible, matchData]);

  // Fetch the other user's data when popup becomes visible
  useEffect(() => {
    if (visible && matchData) {
      console.log('[MatchFoundPopup] Popup became visible, fetching user data for:', matchData);
      fetchOtherUser();
    } else if (!visible) {
      console.log('[MatchFoundPopup] Popup hidden, clearing user data');
      setOtherUser(null);
      setLoading(true);
    }
  }, [visible, matchData]);

  const fetchOtherUser = async () => {
    try {
      setLoading(true);
      console.log('[MatchFoundPopup] Starting to fetch user data...');
      
      if (!token || !matchData) {
        console.warn('[MatchFoundPopup] Missing token or matchData:', { token: !!token, matchData });
        setLoading(false);
        return;
      }
      
      const userIdToFetch = matchData.matchedUserId;
      if (!userIdToFetch) {
        console.warn('[MatchFoundPopup] No matchedUserId found in matchData:', matchData);
        setLoading(false);
        return;
      }
      
      console.log('[MatchFoundPopup] Fetching matched user details for ID:', userIdToFetch);
      
      const response = await axios.get(`${API_BASE_URL}/auth/user/${userIdToFetch}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('[MatchFoundPopup] Matched user data fetched successfully:', response.data);
      setOtherUser(response.data);
    } catch (err) {
      // Silently handle errors - popup will work with basic info
      console.warn('[MatchFoundPopup] Could not fetch user details, continuing with basic info:', err.message);
      
      // Set a basic user object so the popup can still function
      setOtherUser({
        username: 'User',
        profilePictures: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user can connect globally
  const canConnectGlobally = () => {
    if (!currentUser) return false;
    const hasActiveConnection = currentUser.connections && currentUser.connections.length > 0;
    const hasPendingRequest = currentUser.requests && currentUser.requests.length > 0;
    return !hasActiveConnection && !hasPendingRequest;
  };

  // Check if user has existing connections or requests
  const hasExistingConnectionOrRequest = () => {
    if (!currentUser) return false;
    const hasActiveConnection = currentUser.connections && currentUser.connections.length > 0;
    const hasPendingRequest = currentUser.requests && currentUser.requests.length > 0;
    return hasActiveConnection || hasPendingRequest;
  };

  // Open connection modal (same logic as Likes.js)
  const openConnectionModal = (userId) => {
    console.log('[MatchFoundPopup] openConnectionModal called with userId:', userId);
    
    if (!userId) {
      console.error('[MatchFoundPopup] No userId provided to openConnectionModal');
      return;
    }
    
    // FIRST: Check if user already has a connection or pending request
    if (hasExistingConnectionOrRequest()) {
      console.log('[MatchFoundPopup] User has existing connection/request, showing limit modal');
      setLimitModalVisible(true);
      return;
    }
    
    // SECOND: If no existing connections/requests, check if user has allowed connections
    if (currentUser && (!currentUser.allowedConnections || currentUser.allowedConnections <= 0)) {
      console.log('[MatchFoundPopup] User has no allowed connections, showing limit modal');
      setLimitModalVisible(true);
      return;
    }
    
    // If we get here, user can connect
    console.log('[MatchFoundPopup] User can connect, opening connection modal');
    setSelectedUserId(userId);
    setModalVisible(true);
  };

  // Handle connect button press
  const handleConnect = () => {
    console.log('[MatchFoundPopup] handleConnect called with otherUser:', otherUser);
    
    if (!otherUser) {
      console.error('[MatchFoundPopup] No otherUser available for connection');
      return;
    }
    
    // Check if user can connect
    if (!canConnectGlobally()) {
      console.log('[MatchFoundPopup] User cannot connect globally, showing limit modal');
      setLimitModalVisible(true);
      return;
    }
    
    const userId = otherUser._id || otherUser.id;
    console.log('[MatchFoundPopup] Opening connection modal for userId:', userId);
    
    // Open connection modal
    openConnectionModal(userId);
  };

  // Send connection request
  const sendConnectionRequest = async () => {
    console.log('[MatchFoundPopup] sendConnectionRequest called with:', { selectedUserId, hasToken: !!token });
    
    if (!selectedUserId || !token) {
      console.error('[MatchFoundPopup] Missing required data:', { selectedUserId, hasToken: !!token });
      return;
    }
    
    try {
      console.log('[MatchFoundPopup] Sending connection request to backend for userId:', selectedUserId);
      
      // Use the correct backend endpoint that exists
      const response = await axios.post(`${API_BASE_URL}/auth/add-requester`, {
        targetUserId: selectedUserId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[MatchFoundPopup] Backend response:', response.status, response.data);
      
      if (response.status === 200) {
        // Store the userId before clearing it
        const userIdToNavigate = selectedUserId;
        console.log('[MatchFoundPopup] Connection request successful, navigating with userId:', userIdToNavigate);
        
        // Store timestamp for connection request
        const REQUEST_KEY = `connection_request_${selectedUserId}`;
        await AsyncStorage.setItem(REQUEST_KEY, Date.now().toString());
        console.log('[MatchFoundPopup] Request timestamp stored');
        
        // Close modal and clear state
        setModalVisible(false);
        setSelectedUserId(null);
        console.log('[MatchFoundPopup] Modal closed and state cleared');
        
        // Close the match popup
        onClose();
        console.log('[MatchFoundPopup] Match popup closed');
        
        // Navigate to ConnectionSent screen with the stored userId
        console.log('[MatchFoundPopup] Navigating to ConnectionSent with userId:', userIdToNavigate);
        onNavigateToConnectionSent(userIdToNavigate);
      }
    } catch (error) {
      console.error('[MatchFoundPopup] Error sending connection request:', error);
      console.error('[MatchFoundPopup] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle specific error cases like the Likes screen
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          if (data.code === 'NO_CONNECTIONS') {
            Alert.alert(
              'No Connections Available', 
              'You have no connection tickets available. Please upgrade to send connection requests.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Upgrade', onPress: () => onNavigateToPremium() }
              ]
            );
          } else if (data.error && data.error.includes('one active connection')) {
            Alert.alert(
              'Connection Limit Reached', 
              'You can only have one active connection or one pending request at a time.',
              [
                { text: 'OK', style: 'default' }
              ]
            );
          } else {
            Alert.alert('Error', data.error || 'Failed to send connection request. Please try again.');
          }
        } else if (status === 403) {
          Alert.alert(
            'No Connections Available', 
            'You have no connection tickets available. Please upgrade to send connection requests.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Upgrade', onPress: () => onNavigateToPremium() }
            ]
          );
        } else {
          Alert.alert('Error', 'Failed to send connection request. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      }
    }
  };

  // Handle keep swiping button press
  const handleKeepSwiping = () => {
    onClose();
  };

  // Remove debug logging to prevent infinite re-renders

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.fullscreenContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EC066A" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              {/* Removed X icon close button */}
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              {/* Title */}
              <Text style={styles.title}>It's a match!</Text>
              
              {/* Card Stack */}
              <View style={styles.cardStack}>
                {/* Back Card - Show current user's profile picture */}
                <View style={styles.backCard}>
                  <Image 
                    source={getImageSource(currentUser?.profilePictures?.[1] || currentUser?.profilePictures?.[0])} 
                    style={styles.cardImage}
                    resizeMode="cover"
                    onLoad={() => console.log('[MatchFoundPopup] Back card image loaded for current user:', currentUser?.profilePictures)}
                    onError={(error) => console.log('[MatchFoundPopup] Back card image failed to load:', error)}
                  />
                </View>
                
                {/* Front Card - Show other user's profile picture */}
                <View style={styles.frontCard}>
                  <Image 
                    source={getImageSource(otherUser?.profilePictures?.[0])} 
                    style={styles.cardImage}
                    resizeMode="cover"
                    onLoad={() => console.log('[MatchFoundPopup] Front card image loaded for other user:', otherUser?.profilePictures)}
                    onError={(error) => console.log('[MatchFoundPopup] Front card image failed to load:', error)}
                  />
                </View>

                {/* Heart Icon - Make it white and visible */}
                <View style={styles.heartContainer}>
                  <MaterialIcons name="favorite" size={48} color="#fff" />
                </View>
              </View>

              {/* Description Text */}
              <Text style={styles.description}>
                You've found someone special! Start a conversation and see where this connection takes you.
                </Text>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <CustomButton 
                  title="Connect"
                  onPress={handleConnect}
                  style={styles.connectButton}
                />
                
                <HollowButton 
                  title="Keep swiping"
                  onPress={handleKeepSwiping}
                  style={styles.keepSwipingButton}
                />
              </View>
            </View>
          </>
        )}
        
        {/* Connection Modal */}
        <ConnectionModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedUserId(null);
          }}
          onConnect={sendConnectionRequest}
        />
        
        {/* Connection Limit Modal */}
        <ConnectionLimitModal
          visible={limitModalVisible}
          onClose={() => setLimitModalVisible(false)}
          onUpgrade={() => {
            setLimitModalVisible(false);
            onNavigateToPremium();
            onClose();
          }}
          currentConnections={currentUser?.allowedConnections || 0}
          maxConnections={currentUser?.allowedConnections || 0}
          hasPendingRequest={hasExistingConnectionOrRequest()}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'flex-end',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardStack: {
    position: 'relative',
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backCard: {
    position: 'absolute',
    width: 152,
    height: 191,
    borderRadius: 8,
    backgroundColor: '#333',
    transform: [
      { translateX: -60 },
      { translateY: -60 },
      { rotate: '-25deg' }
    ], 
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 1,
  },
  frontCard: {
    position: 'absolute',
    width: 152,
    height: 191,
    borderRadius: 8,
    backgroundColor: '#333',
    transform: [
      { translateX: 60 },
      { translateY: 40 },
      { rotate: '25deg' }
    ],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  heartContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EC066A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
    zIndex: 999,
  },
  description: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: FONTS?.regular || 'System',
    marginBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 36,
    fontFamily: FONTS?.bold || 'System',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 8,
  },
  connectButton: {
    width: '100%',
  },
  keepSwipingButton: {
    width: '100%',
  },
});

export default MatchFoundPopup;
