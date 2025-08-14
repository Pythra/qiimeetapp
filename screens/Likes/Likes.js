import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FONTS } from '../../constants/font';
import { DUMMY_PROFILES } from '../../constants/dummyData';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ConnectionPolicyModal from './ConnectionPolicyModal';
import ConnectionLimitModal from './ConnectionLimitModal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';
import { useAuth } from '../../components/AuthContext';
import SocketManager from '../../utils/socket';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const getResponsiveWidth = (phoneWidth, tabletWidth) => isTablet ? tabletWidth : phoneWidth;
const getResponsiveFontSize = (phoneSize, tabletSize) => isTablet ? tabletSize : phoneSize;
const getResponsiveSpacing = (phoneSpacing, tabletSpacing) => isTablet ? tabletSpacing : phoneSpacing;

// Calculate number of columns based on screen width
const getColumnsCount = () => {
  if (screenWidth < 480) return 2; // Phone portrait
  if (screenWidth < 768) return 2; // Phone landscape
  if (screenWidth < 1024) return 3; // Small tablet
  return 4; // Large tablet
};

// Calculate card width based on columns and spacing
const getCardWidth = () => {
  const columns = getColumnsCount();
  const horizontalPadding = getResponsiveSpacing(20, 40);
  const cardSpacing = getResponsiveSpacing(15, 20);
  const totalSpacing = horizontalPadding * 2 + cardSpacing * (columns - 1);
  return (screenWidth - totalSpacing) / columns;
};

const LikesScreen = ({ navigation }) => {
  const { user: currentUser, allUsers, updateUser, getImageSource, getProfileImageSource, dataReady, loading, initialized } = useAuth();
  const [activeTab, setActiveTab] = useState('yourLikes');
  const [modalVisible, setModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [usersWhoLikeYou, setUsersWhoLikeYou] = useState([]);
  const [activeConnections, setActiveConnections] = useState([]);

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [remainingConnections, setRemainingConnections] = useState(0);
  const [removingLike, setRemovingLike] = useState(null);

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

  const shallowEqualArray = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (typeof arr1[i] === 'object' && typeof arr2[i] === 'object') {
        if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) return false;
      } else {
        if (arr1[i] !== arr2[i]) return false;
      }
    }
    return true;
  };

  const shallowEqualObject = (obj1, obj2) => {
    if (!obj1 || !obj2) return false;
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (let key of keys1) {
      if (obj1[key] !== obj2[key]) return false;
    }
    return true;
  };

  const fetchUsers = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      setError(null);
      
      if (!currentUser) return;
      
      const likes = currentUser.likes || [];
      const likers = currentUser.likers || [];
      const connections = currentUser.connections || [];
      const requests = currentUser.requests || [];
      const requesters = currentUser.requesters || [];
      const currentUserId = currentUser._id;
      
      setRemainingConnections((currentUser.allowedConnections || 0) - ((currentUser.connections?.length || 0) + (currentUser.requests?.length || 0)));
      
      // Use AuthContext allUsers data if available, otherwise fetch
      let usersData = [];
      if (allUsers && allUsers.length > 0) {
        usersData = allUsers;
      } else {
        // Fetch all users with complete data only if not available in context
        const allUsersRes = await axios.get(`${API_BASE_URL}/admin/users/home`);
        usersData = allUsersRes.data.users || [];
      }
      
      const likedUsersData = usersData.filter(user => 
        likes.includes(user._id) && 
        user._id !== currentUserId && 
        !connections.includes(user._id)
      ).map(user => ({
        ...user,
        isPending: requests.includes(user._id) || requesters.includes(user._id)
      }));
      
      const usersWhoLikeYouData = usersData.filter(user => 
        likers.includes(user._id) && 
        user._id !== currentUserId && 
        !connections.includes(user._id)
      ).map(user => ({
        ...user,
        isPending: requests.includes(user._id) || requesters.includes(user._id)
      }));

      // Get active connections data
      const activeConnectionsData = usersData.filter(user => 
        connections.includes(user._id) && 
        user._id !== currentUserId
      );
      

      
      // Only update state if data has changed
      setLikedUsers(prev => shallowEqualArray(prev, likedUsersData) ? prev : likedUsersData);
      setUsersWhoLikeYou(prev => shallowEqualArray(prev, usersWhoLikeYouData) ? prev : usersWhoLikeYouData);
      setActiveConnections(prev => shallowEqualArray(prev, activeConnectionsData) ? prev : activeConnectionsData);
      
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  // Socket listeners are handled in AuthContext, no need to duplicate here

  // Process user data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      // Process the data immediately without any loading state
      const likes = currentUser.likes || [];
      const likers = currentUser.likers || [];
      const connections = currentUser.connections || [];
      const requests = currentUser.requests || [];
      const requesters = currentUser.requesters || [];
      const currentUserId = currentUser._id;
      
      setRemainingConnections((currentUser.allowedConnections || 0) - ((currentUser.connections?.length || 0) + (currentUser.requests?.length || 0)));
      
      // Use AuthContext allUsers data if available
      if (allUsers && allUsers.length > 0) {
        const likedUsersData = allUsers.filter(user => 
          likes.includes(user._id) && 
          user._id !== currentUserId && 
          !connections.includes(user._id)
        ).map(user => ({
          ...user,
          isPending: requests.includes(user._id) || requesters.includes(user._id)
        }));
        
        const usersWhoLikeYouData = allUsers.filter(user => 
          likers.includes(user._id) && 
          user._id !== currentUserId && 
          !connections.includes(user._id)
        ).map(user => ({
          ...user,
          isPending: requests.includes(user._id) || requesters.includes(user._id)
        }));

        // Get active connections data
        const activeConnectionsData = allUsers.filter(user => 
          connections.includes(user._id) && 
          user._id !== currentUserId
        );
        

        
        setLikedUsers(likedUsersData);
        setUsersWhoLikeYou(usersWhoLikeYouData);
        setActiveConnections(activeConnectionsData);
      } else {
        // Fetch users data if not available in AuthContext
        fetchUsers();
      }
      
      // Clean up any inconsistencies in the background
      cleanupInconsistencies();
    }
  }, [currentUser, allUsers]);

  // Function to clean up inconsistencies
  const cleanupInconsistencies = async () => {
    if (!currentUser) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Call the user-specific cleanup endpoint to fix any inconsistencies
      await axios.post(`${API_BASE_URL}/auth/cleanup-user-likers-inconsistencies`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      
    } catch (error) {
      console.error('Error cleaning up inconsistencies:', error);
      // Don't show error to user as this is a background operation
    }
  };

  const onRefresh = React.useCallback(() => {
    fetchUsers(true);
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        // Process existing data without any loading state
        const likes = currentUser.likes || [];
        const likers = currentUser.likers || [];
        const connections = currentUser.connections || [];
        const requests = currentUser.requests || [];
        const requesters = currentUser.requesters || [];
        const currentUserId = currentUser._id;
        
  
        
        
        
        
        
        setRemainingConnections((currentUser.allowedConnections || 0) - ((currentUser.connections?.length || 0) + (currentUser.requests?.length || 0)));
        
        if (allUsers && allUsers.length > 0) {
          const likedUsersData = allUsers.filter(user => 
            likes.includes(user._id) && 
            user._id !== currentUserId && 
            !connections.includes(user._id)
          ).map(user => ({
            ...user,
            isPending: requests.includes(user._id) || requesters.includes(user._id)
          }));
          
          const usersWhoLikeYouData = allUsers.filter(user => 
            likers.includes(user._id) && 
            user._id !== currentUserId && 
            !connections.includes(user._id)
          ).map(user => ({
            ...user,
            isPending: requests.includes(user._id) || requesters.includes(user._id)
          }));

          // Get active connections data
          const activeConnectionsData = allUsers.filter(user => 
            connections.includes(user._id) && 
            user._id !== currentUserId
          );
          

          
          setLikedUsers(likedUsersData);
          setUsersWhoLikeYou(usersWhoLikeYouData);
          setActiveConnections(activeConnectionsData);
        } else {
          // Fetch users data if not available in AuthContext
          fetchUsers();
        }
        
        // Clean up any inconsistencies in the background
        cleanupInconsistencies();
        
        // Force refresh user data to get latest likers
        refreshUserData();
      }
    }, [currentUser, allUsers])
  );

  // Function to manually refresh user data
  const refreshUserData = async () => {
    if (!currentUser) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      
      updateUser(response.data);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const handleConnect = () => {
    setModalVisible(false);
    navigation.navigate('ConnectionSent');
  };

  // Add helper to check if user can connect at all
  const canConnectGlobally = () => {
    if (!currentUser) return false;
    const hasActiveConnection = currentUser.connections && currentUser.connections.length > 0;
    const hasPendingRequest = currentUser.requests && currentUser.requests.length > 0;
    // Removed hasTicket from overlay criteria
    return !hasActiveConnection && !hasPendingRequest;
  };

  // Add helper to check if user has existing connections or requests
  const hasExistingConnectionOrRequest = () => {
    if (!currentUser) return false;
    const hasActiveConnection = currentUser.connections && currentUser.connections.length > 0;
    const hasPendingRequest = currentUser.requests && currentUser.requests.length > 0;
    return hasActiveConnection || hasPendingRequest;
  };

  const openConnectionModal = (userId) => {
    if (!userId) {
      console.error('No userId provided to openConnectionModal');
      return;
    }
    
    // FIRST: Check if user already has a connection or pending request
    if (hasExistingConnectionOrRequest()) {
      setLimitModalVisible(true);
      return;
    }
    
    // SECOND: If no existing connections/requests, check if user has allowed connections
    if (currentUser && (!currentUser.allowedConnections || currentUser.allowedConnections <= 0)) {
      setLimitModalVisible(true);
      return;
    }
    
    // If we get here, user can connect
    setSelectedUserId(userId);
    setModalVisible(true);
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

  const handleOverlayPress = async (user) => {
    const targetUserId = user._id;
    const REQUEST_KEY = `connection_request_${targetUserId}`;
    try {
      const stored = await AsyncStorage.getItem(REQUEST_KEY);
      if (stored) {
        const sentAt = parseInt(stored, 10);
        const now = Date.now();
        const elapsed = Math.floor((now - sentAt) / 1000);
        const remaining = 86400 - elapsed;
        if (remaining <= 0) {
          navigation.navigate('ExpiredRequest', { targetUserId });
        } else {
          navigation.navigate('ConnectionSent', { targetUserId });
        }
      } else {
        // Fallback: just go to ConnectionSent
        navigation.navigate('ConnectionSent', { targetUserId });
      }
    } catch (e) {
      navigation.navigate('ConnectionSent', { targetUserId });
    }
  };

  const handleRemoveLike = async (userId) => {
    if (!currentUser || !userId) return;
    
    try {
      setRemovingLike(userId);
      const token = await AsyncStorage.getItem('token');
      
      // Remove the user from current user's likes
      const updatedLikes = (currentUser.likes || []).filter(id => id !== userId);
      
      // Call the backend to update likes/dislikes
      const response = await axios.put(`${API_BASE_URL}/auth/update-likes-dislikes`, {
        likes: updatedLikes,
        dislikes: currentUser.dislikes || []
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update the user context with the new data
      updateUser(response.data);
      
    } catch (error) {
      console.error('Error removing like:', error);
      // Optionally show an error message to the user
    } finally {
      setRemovingLike(null);
    }
  };

  const renderActiveConnection = (user) => {
    const handleConnectionPress = () => {
      // Navigate to chat with this user using nested navigation
      navigation.navigate('Chat', {
        screen: 'ChatInterface',
        params: {
          otherUserId: user._id,
          senderId: user._id, // For compatibility
          chatId: `${currentUser._id}-${user._id}` // Construct chat ID
        }
      });
    };

    return (
      <TouchableOpacity 
        key={`active-connection-${user._id}`}
        style={styles.activeConnectionCard}
        onPress={handleConnectionPress}
      >
        <View style={styles.activeConnectionContent}>
          <Image 
            source={getProfileImageSource(user)}
            style={styles.activeConnectionImage}
          />
          <View style={styles.activeConnectionInfo}>
            <Text style={styles.activeConnectionName}>
              {user.username || user.name}
              {(user.age || calculateAge(user.dateOfBirth)) ? `, ${user.age || calculateAge(user.dateOfBirth)}` : ''}
            </Text>
            <View style={styles.verifiedContainer}>
              <MaterialIcons name="verified" size={16} color="#ec066a" />
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.messageButton}>
          <Image 
            source={require('../../assets/tab_icons/chat.png')}
            style={styles.messageIcon}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderUserCard = (user, index) => {
    const cardWidth = getCardWidth();
    const cardHeight = cardWidth * 1.2;
    // Check if this user is the one with a pending request
    const isPendingRequestToThisUser = currentUser && currentUser.requests && currentUser.requests.includes(user._id);
    // Disable connect if user cannot connect globally (but allow if this is the pending request user)
    const disableConnect = !canConnectGlobally() && !isPendingRequestToThisUser;
    return (
      <View key={user._id} style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}> 
        {/* Overlay for global connect limit, but allow navigation to ConnectionSent if this is the pending request target */}
        {disableConnect && (
          <TouchableOpacity
            style={styles.pendingOverlay}
            activeOpacity={0.7}
            onPress={() => setLimitModalVisible(true)}
          />
        )}
        <TouchableOpacity 
          style={[styles.removeButton, removingLike === user._id && styles.removingButton]} 
          onPress={() => handleRemoveLike(user._id)}
          disabled={removingLike === user._id}
        >
          {removingLike === user._id ? (
            <View style={styles.loadingSpinner}>
              <Text style={styles.loadingText}>...</Text>
            </View>
          ) : (
            <Image 
              source={require('../../assets/icons/close.png')}
              style={styles.closeIcon}
            />
          )}
        </TouchableOpacity>
                        <Image source={getProfileImageSource(user)} style={styles.cardImage} />
        {/* User Info */}
        <View style={styles.userInfo} pointerEvents={disableConnect ? 'none' : 'auto'}>
          <View style={styles.status}>
            <View style={styles.activeDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {user.username || user.name}
              {(user.age || calculateAge(user.dateOfBirth)) ? `, ${user.age || calculateAge(user.dateOfBirth)}` : ''}
            </Text>
            <View style={styles.verifiedBadge}>
              <MaterialIcons 
                name="verified" 
                size={getResponsiveFontSize(17, 20)} 
                color="#ec066a" 
              />
            </View>
          </View>
          <View style={styles.locationContainer}>
            <Text style={styles.distance}>{user.location || ''}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => {
            if (isPendingRequestToThisUser) {
              handleOverlayPress(user);
            } else {
              openConnectionModal(user._id || user.id);
            }
          }}
          disabled={disableConnect && !isPendingRequestToThisUser}
        >
          <Image 
            source={require('../../assets/icons/connicon.png')}
            style={[styles.connIcon, (disableConnect && !isPendingRequestToThisUser) && { opacity: 0.4 }]}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Show loading state if data is not ready yet
  if (!initialized || loading || !dataReady || !currentUser) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff' }}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Show loading state if allUsers is not loaded yet (common after fresh sign-in)
  if (!allUsers || allUsers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Likes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ConnectionRequests')} style={{ position: 'relative' }}>
            <Image 
              source={require('../../assets/icons/flicon.png')}
              style={styles.flicon}
            />
            {currentUser?.requesters?.length > 0 && (
              <View style={styles.requestBadge}>
                <Text style={styles.requestBadgeText}>{currentUser.requesters.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'yourLikes' && styles.activeTab]}
            onPress={() => setActiveTab('yourLikes')}
          >
            <Text style={[styles.tabText, activeTab === 'yourLikes' && styles.activeTabText]}>
              Your Likes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'whoLikesYou' && styles.activeTab]}
            onPress={() => setActiveTab('whoLikesYou')}
          >
            <Text style={[styles.tabText, activeTab === 'whoLikesYou' && styles.activeTabText]}>
              Who Likes You
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Active Connection Section */}
        {activeConnections.length > 0 && (
          <View style={styles.activeConnectionSection}>
            <Text style={styles.activeConnectionTitle}>Active Connection</Text>
            {activeConnections.map(renderActiveConnection)}
          </View>
        )}
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff' }}>Loading users...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Likes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ConnectionRequests')} style={{ position: 'relative' }}>
          <Image 
            source={require('../../assets/icons/flicon.png')}
            style={styles.flicon}
          />
          {currentUser?.requesters?.length > 0 && (
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>{currentUser.requesters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'yourLikes' && styles.activeTab]}
          onPress={() => setActiveTab('yourLikes')}
        >
          <Text style={[styles.tabText, activeTab === 'yourLikes' && styles.activeTabText]}>
            Your Likes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'whoLikesYou' && styles.activeTab]}
          onPress={() => setActiveTab('whoLikesYou')}
        >
          <Text style={[styles.tabText, activeTab === 'whoLikesYou' && styles.activeTabText]}>
            Who Likes You
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Active Connection Section */}
      {activeConnections.length > 0 && (
        <View style={styles.activeConnectionSection}>
          <Text style={styles.activeConnectionTitle}>Active Connection</Text>
          {activeConnections.map(renderActiveConnection)}
        </View>
      )}
      
      { error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>{error}</Text></View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.cardsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                onRefresh();
                refreshUserData();
              }}
              tintColor="#ec066a"
              colors={["#ec066a"]}
            />
          }
        >
          <View style={styles.cardsGrid}>
            {activeTab === 'yourLikes' ? (
              likedUsers.length > 0 ? 
                likedUsers.map(renderUserCard) : 
                <Text style={{ color: '#fff' }}>No likes yet</Text>
            ) : (
              usersWhoLikeYou.length > 0 ? 
                usersWhoLikeYou.map(renderUserCard) : 
                <Text style={{ color: '#fff' }}>No one has liked you yet</Text>
            )}
          </View>
        </ScrollView>
      )}
      <ConnectionPolicyModal 
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedUserId(null);
        }}
        onAccept={handleConnect}
        modalType="likes"
        targetUserId={selectedUserId}
        onConnectionLimit={() => setLimitModalVisible(true)}
      />
      
      <ConnectionLimitModal 
        visible={limitModalVisible}
        onClose={() => setLimitModalVisible(false)}
        onUpgrade={handleUpgradeConnections}
        currentConnections={currentUser?.allowedConnections || 0}
        maxConnections={currentUser?.allowedConnections || 0}
        hasPendingRequest={hasExistingConnectionOrRequest()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 24,
    
    paddingBottom:90
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(20, 40),
    paddingTop: getResponsiveSpacing(24, 30),
    marginBottom: getResponsiveSpacing(10, 15),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(24, 28),
    color: '#fff',
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
  flicon: {
    width: getResponsiveWidth(24, 28),
    height: getResponsiveWidth(24, 28),
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSpacing(20, 40),
    marginBottom: getResponsiveSpacing(20, 30),
    maxWidth: isTablet ? 400 : '100%',
    alignSelf: isTablet ? 'center' : 'stretch',
  },
  tab: {
    flex: 1,
    paddingVertical: getResponsiveSpacing(10, 15),
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF1493',
  },
  tabText: {
    color: '#666',
    fontSize: getResponsiveFontSize(16, 18),
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ec066a',
  },
  cardsContainer: {
    flexGrow: 1,
    paddingHorizontal: getResponsiveSpacing(20, 40),
    paddingVertical: getResponsiveSpacing(10, 15),
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: getColumnsCount() > 2 ? 'flex-start' : 'space-between',
    gap: getResponsiveSpacing(15, 20),
  },
  cardContainer: {
    marginBottom: getResponsiveSpacing(15, 20),
    borderRadius: getResponsiveSpacing(10, 12),
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  userInfo: {
    position: 'absolute',
    bottom: getResponsiveSpacing(14, 18),
    left: getResponsiveSpacing(10, 12),
    right: getResponsiveSpacing(10, 12),
    zIndex: 4,
  },
  status: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: getResponsiveSpacing(5, 6),
    paddingHorizontal: getResponsiveSpacing(6, 8),
    borderRadius: 90,
    alignSelf: 'flex-start',
    marginBottom: getResponsiveSpacing(6, 8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  activeDot: {
    width: getResponsiveWidth(6, 8),
    height: getResponsiveWidth(6, 8),
    borderRadius: getResponsiveWidth(6, 8),
    backgroundColor: '#4CD964',
  },
  statusText: {
    color: 'white',
    fontSize: getResponsiveFontSize(8, 10),
    fontWeight: '400',
    fontFamily: FONTS.regular,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(6, 8),
  },
  name: {
    fontSize: getResponsiveFontSize(16, 18),
    color: '#fff',
    fontWeight: '500',
    marginRight: 4,
    fontFamily: FONTS.regular,
    flexShrink: 1,
  },
  verifiedBadge: {
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: getResponsiveFontSize(12, 14),
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: FONTS.regular,
  },
  likeButton: {
    position: 'absolute',
    bottom: getResponsiveSpacing(4, 6),
    right: getResponsiveSpacing(4, 6),
    width: getResponsiveWidth(40, 48),
    height: getResponsiveWidth(40, 48),
    zIndex: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connIcon: {
    width: getResponsiveWidth(32, 40),
    height: getResponsiveWidth(32, 40),
    resizeMode: 'contain',
  },
  removeButton: {
    position: 'absolute',
    top: getResponsiveSpacing(8, 10),
    right: getResponsiveSpacing(8, 10), 
    zIndex: 5,
  },
  removingButton: {
    opacity: 0.6,
  },
  closeIcon: {
    width: getResponsiveWidth(16, 20),
    height: getResponsiveWidth(16, 20),
    resizeMode: 'contain',
  },
  loadingSpinner: {
    width: getResponsiveWidth(16, 20),
    height: getResponsiveWidth(16, 20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(12, 14),
    fontWeight: 'bold',
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(83, 83, 83, 0.3)',
    zIndex: 10,
    borderRadius: getResponsiveSpacing(10, 12),
  },
  requestBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 2,
  },
  requestBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  // Active Connection Styles
  activeConnectionSection: {
    paddingHorizontal: getResponsiveSpacing(20, 40),
    paddingVertical: 8,
    marginBottom: getResponsiveSpacing(10, 15), 
  },
  activeConnectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: getResponsiveSpacing(12, 16),
    fontFamily: FONTS.medium,
  },
  activeConnectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: getResponsiveSpacing(16, 20),
  },
  activeConnectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeConnectionImage: {
    width: getResponsiveWidth(50, 60),
    height: getResponsiveWidth(50, 60),
    borderRadius: getResponsiveWidth(25, 30),
    marginRight: getResponsiveSpacing(12, 16),
  },
  activeConnectionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeConnectionName: {
    fontSize: getResponsiveFontSize(16, 18),
    fontWeight: '500',
    color: '#fff',
    marginRight: getResponsiveSpacing(6, 8),
    fontFamily: FONTS.medium,
  },
  verifiedContainer: {
    marginTop: 2,
  },
  messageButton: {
    width: getResponsiveWidth(40, 48),
    height: getResponsiveWidth(40, 48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
});

export default LikesScreen;
