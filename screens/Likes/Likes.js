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
  const [activeTab, setActiveTab] = useState('yourLikes');
  const [modalVisible, setModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [usersWhoLikeYou, setUsersWhoLikeYou] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [remainingConnections, setRemainingConnections] = useState(0);

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

  const fetchUsers = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token');
      
      // Fetch current user profile to get likes and likers
      const profileRes = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const currentUserData = profileRes.data;
      const likes = currentUserData.likes || [];
      const likers = currentUserData.likers || [];
      const connections = currentUserData.connections || [];
      const requests = currentUserData.requests || []; // Users I've sent requests to
      const requesters = currentUserData.requesters || []; // Users who've sent me requests
      const currentUserId = currentUserData._id;
      
      // Set current user data and log allowed connections
      setCurrentUser(currentUserData);
      // Calculate usedConnections: accepted + pending
      const accepted = Array.isArray(currentUserData.connections) ? currentUserData.connections.length : 0;
      const pending = Array.isArray(currentUserData.requests) ? currentUserData.requests.length : 0;
      const usedConnections = accepted + pending;
      const allowed = currentUserData.allowedConnections || 0;
      setRemainingConnections(allowed - usedConnections);
      
      // Fetch all users with complete data
      const allUsersRes = await axios.get(`${API_BASE_URL}/admin/users/home`);
      const allUsers = allUsersRes.data.users || [];
      
      // Filter to only include users that the current user has liked AND are not already connected or have pending requests
      const likedUsersData = allUsers.filter(user => 
        likes.includes(user._id) && 
        user._id !== currentUserId && 
        !connections.includes(user._id)
      ).map(user => ({
        ...user,
        isPending: requests.includes(user._id) || requesters.includes(user._id)
      }));
      
      // Filter to only include users who like the current user AND are not already connected or have pending requests
      const usersWhoLikeYouData = allUsers.filter(user => 
        likers.includes(user._id) && 
        user._id !== currentUserId && 
        !connections.includes(user._id)
      ).map(user => ({
        ...user,
        isPending: requests.includes(user._id) || requesters.includes(user._id)
      }));
      
      setLikedUsers(likedUsersData);
      setUsersWhoLikeYou(usersWhoLikeYouData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = React.useCallback(() => {
    fetchUsers(true);
  }, []);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
    }, [])
  );

  const handleConnect = () => {
    setModalVisible(false);
    navigation.navigate('ConnectionSent');
  };

  const openConnectionModal = (userId) => {
    
    if (!userId) {
      console.error('No userId provided to openConnectionModal');
      return;
    }
    
    // Check if user has remaining connections
    if (remainingConnections <= 0) {
      console.log('No remaining connections, showing limit modal');
      setLimitModalVisible(true);
      return;
    }
    
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

  const getImageSource = (imagePath) => {
    const cloudFrontUrl = 'https://dk665xezaubcy.cloudfront.net';
    if (!imagePath) return require('../../assets/model.jpg');
    if (imagePath.startsWith('http')) {
      return { uri: imagePath, cache: 'force-cache' };
    }
    if (imagePath.startsWith('/uploads/')) {
      return { uri: `${cloudFrontUrl}${imagePath}`, cache: 'force-cache' };
    }
    if (!imagePath.startsWith('/')) {
      return { uri: `${cloudFrontUrl}/uploads/images/${imagePath}`, cache: 'force-cache' };
    }
    return require('../../assets/model.jpg');
  };

  const renderUserCard = (user, index) => {
    const cardWidth = getCardWidth();
    const cardHeight = cardWidth * 1.2;
    const disableConnect = user.isPending || remainingConnections <= 0;
    return (
      <View key={user._id} style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}> 
        {/* Overlay for pending requests/requesters or no remaining connections */}
        {(user.isPending || remainingConnections <= 0) && (
          <TouchableOpacity
            style={styles.pendingOverlay}
            activeOpacity={0.7}
            onPress={() => {
              if (user.isPending) {
                handleOverlayPress(user);
              } else if (remainingConnections <= 0) {
                setLimitModalVisible(true);
              }
            }}
          />
        )}
        <TouchableOpacity style={styles.removeButton} disabled={disableConnect}>
          <Image 
            source={require('../../assets/close.png')}
            style={styles.closeIcon}
          />
        </TouchableOpacity>
        <Image source={getImageSource(user.profilePictures?.[0])} style={styles.cardImage} />
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
            if (!disableConnect) {
              openConnectionModal(user._id || user.id);
            } else if (user.isPending) {
              navigation.navigate('ConnectionSent', { targetUserId: user._id });
            } else if (remainingConnections <= 0) {
              setLimitModalVisible(true);
            }
          }}
          disabled={disableConnect}
        >
          <Image 
            source={require('../../assets/connicon.png')}
            style={[styles.connIcon, disableConnect && { opacity: 0.4 }]}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Likes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ConnectionRequests')}>
          <Image 
            source={require('../../assets/flicon.png')}
            style={styles.flicon}
          />
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
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{error}</Text></View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.cardsContainer}
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: getResponsiveSpacing(40, 60),
    
    marginBottom:90
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
    bottom: getResponsiveSpacing(12, 15),
    right: getResponsiveSpacing(12, 15),
    width: getResponsiveWidth(28, 35),
    height: getResponsiveWidth(28, 35),
    zIndex: 5,
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
  closeIcon: {
    width: getResponsiveWidth(16, 20),
    height: getResponsiveWidth(16, 20),
    resizeMode: 'contain',
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(83, 83, 83, 0.3)',
    zIndex: 10,
    borderRadius: getResponsiveSpacing(10, 12),
  },
});

export default LikesScreen;
