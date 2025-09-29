import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FONTS } from '../../constants/font';
import { DUMMY_PROFILES } from '../../constants/dummyData';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ConnectionPolicyModal from './ConnectionPolicyModal';
import ConnectionLimitModal from './ConnectionLimitModal';
import ProfilePopupModal from '../../components/ProfilePopupModal';
import SubscriptionRequiredModal from '../../components/SubscriptionRequiredModal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';
import { useAuth } from '../../components/AuthContext';
import OnlineStatusService from '../../utils/onlineStatusService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const getResponsiveWidth = (phoneWidth, tabletWidth) => isTablet ? tabletWidth : phoneWidth;
const getResponsiveFontSize = (phoneSize, tabletSize) => isTablet ? tabletSize : phoneSize;
const getResponsiveSpacing = (phoneSpacing, tabletSpacing) => isTablet ? tabletSpacing : phoneSpacing;

// Calculate number of columns based on screen width
const getColumnsCount = () => {
  if (screenWidth < 480) return 2; // Phone portrait
  if (screenWidth < 768) return 2; // Phone 
  // e
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
  const { user: currentUser, allUsers, updateUser, getImageSource, getProfileImageSource, dataReady, loading, initialized, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('yourLikes');
  const [modalVisible, setModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [usersWhoLikeYou, setUsersWhoLikeYou] = useState([]);

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [remainingConnections, setRemainingConnections] = useState(0);
  const [removingLike, setRemovingLike] = useState(null);
  
  // Profile popup modal state
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  
  // Subscription required modal state
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  
  // Force re-render when online status changes
  const [onlineStatusRefresh, setOnlineStatusRefresh] = useState(0);
  
  // Force re-render when user data changes
  const [userDataRefresh, setUserDataRefresh] = useState(0);
  
  // Prevent duplicate processing
  const [isProcessingData, setIsProcessingData] = useState(false);
  
  // Add data stability tracking
  const [lastProcessedData, setLastProcessedData] = useState({
    likes: [],
    likers: [],
    connections: [],
    requests: [],
    requesters: []
  });
  
  // Add processing lock to prevent race conditions
  const processingLockRef = useRef(false);
  
  // Add fallback refresh lock to prevent multiple simultaneous refreshes
  const fallbackRefreshRef = useRef(false);
  
  // Add stable state management to prevent flickering
  const [stableLikedUsers, setStableLikedUsers] = useState([]);
  const [stableUsersWhoLikeYou, setStableUsersWhoLikeYou] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Add debounce timer for state updates
  const updateTimeoutRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  
  // Add rapid swipe detection
  const rapidSwipeCountRef = useRef(0);
  const rapidSwipeStartTimeRef = useRef(0);
  const isRapidSwipingRef = useRef(false);
  
  // Add data consistency tracking
  const lastStableDataRef = useRef({
    likedUsers: [],
    usersWhoLikeYou: [],
    timestamp: 0
  });
  
  // Add update suppression during rapid changes
  const suppressUpdatesRef = useRef(false);
  
  // Add fade animation for smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Stable update function that prevents flickering - ULTRA AGGRESSIVE VERSION
  const updateStableData = useCallback((newLikedUsers, newUsersWhoLikeYou) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    // DEBUG: Log incoming data
    console.log('🔍 [DEBUG LIKES] updateStableData called:', {
      timestamp: new Date().toISOString(),
      timeSinceLastUpdate: timeSinceLastUpdate + 'ms',
      newLikedUsersCount: newLikedUsers.length,
      newUsersWhoLikeYouCount: newUsersWhoLikeYou.length,
      currentStableLikedUsersCount: stableLikedUsers.length,
      currentStableUsersWhoLikeYouCount: stableUsersWhoLikeYou.length,
      isRapidSwiping: isRapidSwipingRef.current,
      suppressUpdates: suppressUpdatesRef.current,
      rapidSwipeCount: rapidSwipeCountRef.current
    });
    
    // DEBUG: Log user IDs for comparison
    const newLikedUserIds = newLikedUsers.map(u => u._id || u.id).sort();
    const currentLikedUserIds = stableLikedUsers.map(u => u._id || u.id).sort();
    const newLikersUserIds = newUsersWhoLikeYou.map(u => u._id || u.id).sort();
    const currentLikersUserIds = stableUsersWhoLikeYou.map(u => u._id || u.id).sort();
    
    console.log('🔍 [DEBUG LIKES] User ID comparison:', {
      newLikedUserIds,
      currentLikedUserIds,
      newLikersUserIds,
      currentLikersUserIds,
      likedUsersChanged: JSON.stringify(newLikedUserIds) !== JSON.stringify(currentLikedUserIds),
      likersChanged: JSON.stringify(newLikersUserIds) !== JSON.stringify(currentLikersUserIds)
    });
    
    // Always clear existing timeout to prevent multiple pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Detect rapid swiping pattern - more aggressive detection
    if (timeSinceLastUpdate < 500) { // Increased from 300ms
      rapidSwipeCountRef.current++;
      if (rapidSwipeCountRef.current === 1) {
        rapidSwipeStartTimeRef.current = now;
      }
      
      // If we've had 2+ rapid updates in 2 seconds, we're in rapid swipe mode
      if (rapidSwipeCountRef.current >= 2 && (now - rapidSwipeStartTimeRef.current) < 2000) {
        isRapidSwipingRef.current = true;
        suppressUpdatesRef.current = true;
      }
    } else {
      // Reset rapid swipe detection after a longer pause
      if (timeSinceLastUpdate > 1000) { // Increased from 300ms
        rapidSwipeCountRef.current = 0;
        isRapidSwipingRef.current = false;
        suppressUpdatesRef.current = false;
      }
    }
    
    // During rapid swiping or suppression, use much longer debounce and skip animations
    if (isRapidSwipingRef.current || suppressUpdatesRef.current) {
      console.log('🚫 [DEBUG LIKES] RAPID SWIPE MODE - Delaying update by 1000ms');
      updateTimeoutRef.current = setTimeout(() => {
        console.log('✅ [DEBUG LIKES] RAPID SWIPE UPDATE APPLIED:', {
          timestamp: new Date().toISOString(),
          newLikedUsersCount: newLikedUsers.length,
          newUsersWhoLikeYouCount: newUsersWhoLikeYou.length,
          appliedAfterDelay: '1000ms'
        });
        
        // No animation during rapid swiping to prevent glitches
        setStableLikedUsers(newLikedUsers);
        setStableUsersWhoLikeYou(newUsersWhoLikeYou);
        setLikedUsers(newLikedUsers);
        setUsersWhoLikeYou(newUsersWhoLikeYou);
        
        // Update last stable data reference
        lastStableDataRef.current = {
          likedUsers: [...newLikedUsers],
          usersWhoLikeYou: [...newUsersWhoLikeYou],
          timestamp: Date.now()
        };
        
        lastUpdateTimeRef.current = Date.now();
        setIsUpdating(false);
        
        // Reset rapid swipe detection after update
        rapidSwipeCountRef.current = 0;
        isRapidSwipingRef.current = false;
        suppressUpdatesRef.current = false;
      }, 1000); // Much longer delay during rapid swiping
    } else if (timeSinceLastUpdate < 300) {
      // Very rapid updates - use longer debounce
      console.log('⚡ [DEBUG LIKES] VERY RAPID UPDATE - Delaying by 600ms');
      updateTimeoutRef.current = setTimeout(() => {
        console.log('✅ [DEBUG LIKES] VERY RAPID UPDATE APPLIED:', {
          timestamp: new Date().toISOString(),
          newLikedUsersCount: newLikedUsers.length,
          newUsersWhoLikeYouCount: newUsersWhoLikeYou.length,
          appliedAfterDelay: '600ms'
        });
        
        // Only animate if we're not in the middle of rapid updates
        const currentTime = Date.now();
        const timeSinceLastRapidUpdate = currentTime - lastUpdateTimeRef.current;
        
        if (timeSinceLastRapidUpdate > 200) { // Increased from 150ms
          console.log('🎬 [DEBUG LIKES] Applying fade animation');
          // Smooth fade transition for settled updates
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0.8,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          console.log('🚫 [DEBUG LIKES] Skipping animation - too rapid');
        }
        
        setStableLikedUsers(newLikedUsers);
        setStableUsersWhoLikeYou(newUsersWhoLikeYou);
        setLikedUsers(newLikedUsers);
        setUsersWhoLikeYou(newUsersWhoLikeYou);
        
        // Update last stable data reference
        lastStableDataRef.current = {
          likedUsers: [...newLikedUsers],
          usersWhoLikeYou: [...newUsersWhoLikeYou],
          timestamp: Date.now()
        };
        
        lastUpdateTimeRef.current = Date.now();
        setIsUpdating(false);
      }, 600); // Increased from 400ms
    } else if (timeSinceLastUpdate < 800) {
      // Medium speed updates - shorter debounce
      console.log('🔄 [DEBUG LIKES] MEDIUM SPEED UPDATE - Delaying by 300ms');
      updateTimeoutRef.current = setTimeout(() => {
        console.log('✅ [DEBUG LIKES] MEDIUM SPEED UPDATE APPLIED:', {
          timestamp: new Date().toISOString(),
          newLikedUsersCount: newLikedUsers.length,
          newUsersWhoLikeYouCount: newUsersWhoLikeYou.length,
          appliedAfterDelay: '300ms'
        });
        
        // Light fade transition
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.9,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
        ]).start();
        
        setStableLikedUsers(newLikedUsers);
        setStableUsersWhoLikeYou(newUsersWhoLikeYou);
        setLikedUsers(newLikedUsers);
        setUsersWhoLikeYou(newUsersWhoLikeYou);
        
        // Update last stable data reference
        lastStableDataRef.current = {
          likedUsers: [...newLikedUsers],
          usersWhoLikeYou: [...newUsersWhoLikeYou],
          timestamp: Date.now()
        };
        
        lastUpdateTimeRef.current = Date.now();
        setIsUpdating(false);
      }, 300); // Increased from 200ms
    } else {
      // Slow updates - update immediately with minimal animation
      console.log('🐌 [DEBUG LIKES] SLOW UPDATE - Applying immediately');
      setStableLikedUsers(newLikedUsers);
      setStableUsersWhoLikeYou(newUsersWhoLikeYou);
      setLikedUsers(newLikedUsers);
      setUsersWhoLikeYou(newUsersWhoLikeYou);
      
      // Update last stable data reference
      lastStableDataRef.current = {
        likedUsers: [...newLikedUsers],
        usersWhoLikeYou: [...newUsersWhoLikeYou],
        timestamp: Date.now()
      };
      
      lastUpdateTimeRef.current = now;
      setIsUpdating(false);
      
      console.log('✅ [DEBUG LIKES] SLOW UPDATE APPLIED:', {
        timestamp: new Date().toISOString(),
        newLikedUsersCount: newLikedUsers.length,
        newUsersWhoLikeYouCount: newUsersWhoLikeYou.length,
        appliedImmediately: true
      });
    }
  }, [fadeAnim]);
  
  // Add immediate state updates for better responsiveness
  const immediateSetLikedUsers = useCallback((newData) => {
    setLikedUsers(prev => {
      const hasChanged = !shallowEqualArray(prev, newData);
      if (hasChanged) {
        return newData;
      }
      return prev;
    });
  }, []);
  
  const immediateSetUsersWhoLikeYou = useCallback((newData) => {
    setUsersWhoLikeYou(prev => {
      const hasChanged = !shallowEqualArray(prev, newData);
      if (hasChanged) {
        return newData;
      }
      return prev;
    });
  }, []);

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

  // Check if user data has actually changed to prevent unnecessary processing - ULTRA CONSERVATIVE VERSION
  const hasUserDataChanged = (currentUser) => {
    if (!currentUser) {
      console.log('🚫 [DEBUG LIKES] hasUserDataChanged: No currentUser');
      return false;
    }
    
    const currentData = {
      likes: currentUser.likes || [],
      likers: currentUser.likers || [],
      connections: currentUser.connections || [],
      requests: currentUser.requests || [],
      requesters: currentUser.requesters || []
    };
    
    // Compare with last processed data
    const hasChanged = !shallowEqualArray(currentData.likes, lastProcessedData.likes) ||
                      !shallowEqualArray(currentData.likers, lastProcessedData.likers) ||
                      !shallowEqualArray(currentData.connections, lastProcessedData.connections) ||
                      !shallowEqualArray(currentData.requests, lastProcessedData.requests) ||
                      !shallowEqualArray(currentData.requesters, lastProcessedData.requesters);
    
    // Also check if the current displayed data is different from what should be displayed
    const currentLikedUsers = stableLikedUsers || [];
    const currentUsersWhoLikeYou = stableUsersWhoLikeYou || [];
    
    // Force update if there's a significant mismatch between current user data and displayed data
    const likesCountDiff = Math.abs(currentData.likes.length - currentLikedUsers.length);
    const likersCountDiff = Math.abs(currentData.likers.length - currentUsersWhoLikeYou.length);
    
    // Be much more conservative about updates
    const shouldForceUpdate = likesCountDiff > 2 || likersCountDiff > 2;
    
    // For rapid swipes or suppression mode, be extremely conservative
    const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
    const timeSinceLastStableUpdate = Date.now() - lastStableDataRef.current.timestamp;
    
    console.log('🔍 [DEBUG LIKES] hasUserDataChanged analysis:', {
      timestamp: new Date().toISOString(),
      currentLikesCount: currentData.likes.length,
      currentLikersCount: currentData.likers.length,
      displayedLikedUsersCount: currentLikedUsers.length,
      displayedUsersWhoLikeYouCount: currentUsersWhoLikeYou.length,
      likesCountDiff,
      likersCountDiff,
      hasChanged,
      shouldForceUpdate,
      timeSinceLastUpdate: timeSinceLastUpdate + 'ms',
      timeSinceLastStableUpdate: timeSinceLastStableUpdate + 'ms',
      isRapidSwiping: isRapidSwipingRef.current,
      suppressUpdates: suppressUpdatesRef.current
    });
    
    if (isRapidSwipingRef.current || suppressUpdatesRef.current) {
      // During rapid swiping, only update if there's a massive change
      const result = hasChanged && (likesCountDiff > 3 || likersCountDiff > 3);
      console.log('🚫 [DEBUG LIKES] RAPID SWIPE MODE - Update needed:', result);
      return result;
    }
    
    if (timeSinceLastUpdate < 200) {
      // During rapid updates, only update if there's a major change
      const result = hasChanged && (likesCountDiff > 2 || likersCountDiff > 2);
      console.log('⚡ [DEBUG LIKES] RAPID UPDATE MODE - Update needed:', result);
      return result;
    }
    
    if (timeSinceLastStableUpdate < 500) {
      // If we just updated recently, be more conservative
      const result = hasChanged && (likesCountDiff > 1 || likersCountDiff > 1);
      console.log('🔄 [DEBUG LIKES] RECENT UPDATE MODE - Update needed:', result);
      return result;
    }
    
    const result = hasChanged || shouldForceUpdate;
    console.log('🐌 [DEBUG LIKES] NORMAL MODE - Update needed:', result);
    return result;
  };

  const fetchUsers = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      
      // Prevent duplicate processing
      if (isProcessingData) {
        return;
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
        try {
          const token = await AsyncStorage.getItem('token');
          const allUsersRes = await axios.get(`${API_BASE_URL}/admin/users/home`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          usersData = allUsersRes.data.users || [];
        } catch (error) {
          usersData = [];
        }
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
      

      
      // Update state with the fetched data using stable update
      updateStableData(likedUsersData, usersWhoLikeYouData);
      
    } catch (err) {
      setError('Failed to load users');
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  // Socket listeners are handled in AuthContext, no need to duplicate here

  // Initial data fetch when component mounts
  useEffect(() => {
    if (currentUser && !isProcessingData) {
      fetchUsers();
    }
  }, [currentUser]);

  // Process user data when currentUser changes - STABLE VERSION
  useEffect(() => {
    console.log('🔄 [DEBUG LIKES] useEffect triggered:', {
      timestamp: new Date().toISOString(),
      hasCurrentUser: !!currentUser,
      hasAllUsers: !!allUsers,
      allUsersCount: allUsers?.length || 0,
      isProcessingLocked: processingLockRef.current,
      currentUserId: currentUser?._id,
      connectionsCount: currentUser?.connections?.length || 0,
      requestsCount: currentUser?.requests?.length || 0
    });
    
    if (currentUser && !processingLockRef.current) {
      // Skip processing if allUsers is empty - we need to fetch data first
      if (!allUsers || allUsers.length === 0) {
        console.log('🚫 [DEBUG LIKES] Skipping processing - allUsers is empty, need to fetch first');
        return;
      }
      
      // Check if data has actually changed
      const dataChanged = hasUserDataChanged(currentUser);
      console.log('🔍 [DEBUG LIKES] Data change check result:', dataChanged);
      
      if (!dataChanged) {
        console.log('🚫 [DEBUG LIKES] Skipping processing - no data changes detected');
        return; // Skip processing if data hasn't changed
      }
      
      console.log('✅ [DEBUG LIKES] Starting data processing');
      
      // Set processing lock to prevent race conditions
      processingLockRef.current = true;
      setIsUpdating(true);

      // Process the data immediately
      const likes = currentUser.likes || [];
      const likers = currentUser.likers || [];
      const connections = currentUser.connections || [];
      const requests = currentUser.requests || [];
      const requesters = currentUser.requesters || [];
      const currentUserId = currentUser._id;
      
      console.log('📊 [DEBUG LIKES] Processing user data:', {
        likesCount: likes.length,
        likersCount: likers.length,
        connectionsCount: connections.length,
        requestsCount: requests.length,
        requestersCount: requesters.length,
        currentUserId
      });
      
      setRemainingConnections((currentUser.allowedConnections || 0) - ((currentUser.connections?.length || 0) + (currentUser.requests?.length || 0)));
      
      // Use AuthContext allUsers data if available, otherwise fetch once
      if (allUsers && allUsers.length > 0) {
        console.log('✅ [DEBUG LIKES] Using allUsers from AuthContext');
        
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

        console.log('📋 [DEBUG LIKES] Filtered data:', {
          likedUsersDataCount: likedUsersData.length,
          usersWhoLikeYouDataCount: usersWhoLikeYouData.length,
          likedUserIds: likedUsersData.map(u => u._id),
          likersUserIds: usersWhoLikeYouData.map(u => u._id),
          currentLikes: likes,
          currentLikers: likers,
          currentConnections: connections
        });

        // DEBUG: Check for data consistency issues
        const missingLikedUsers = likes.filter(likeId => 
          !likedUsersData.some(user => user._id === likeId) && 
          !connections.includes(likeId) &&
          likeId !== currentUserId
        );
        
        if (missingLikedUsers.length > 0) {
          console.log('⚠️ [DEBUG LIKES] Missing liked users in filtered data:', {
            missingUserIds: missingLikedUsers,
            reason: 'Users not found in allUsers or already connected'
          });
          
          // If we have missing users, don't update the stable data yet
          // This prevents the flickering issue where profiles appear/disappear
          console.log('🚫 [DEBUG LIKES] Skipping update due to missing users - will fetch fresh data');
          fetchUsers();
          processingLockRef.current = false;
          setIsUpdating(false);
          return;
        }

        // Use stable update function to prevent flickering
        updateStableData(likedUsersData, usersWhoLikeYouData);
        
        // Update last processed data to prevent duplicate processing
        setLastProcessedData({
          likes: [...likes],
          likers: [...likers],
          connections: [...connections],
          requests: [...requests],
          requesters: [...requesters]
        });
      } else {
        // Fetch users data if not available in AuthContext
        console.log('🔄 [DEBUG LIKES] Fetching users data - not available in AuthContext');
        console.log('🚫 [DEBUG LIKES] Skipping processing - allUsers is empty, will fetch data');
        // Don't process empty data, just fetch
        fetchUsers();
        // Release processing lock immediately since we're not processing
        processingLockRef.current = false;
        setIsUpdating(false);
        return; // Exit early to prevent further processing
      }
      
      // Release processing lock
      processingLockRef.current = false;
      console.log('✅ [DEBUG LIKES] Data processing completed');
    }
  }, [currentUser, allUsers, updateStableData]);

  // Removed periodic refresh to prevent excessive API calls

  // Initialize OnlineStatusService for new backend-based online status
  useEffect(() => {
    if (!currentUser) return;

    
    // Initialize the online status service
    OnlineStatusService.initialize();
    
    // Force immediate online status update
    setTimeout(async () => {
      await OnlineStatusService.updateOnlineStatus();
      
      setOnlineStatusRefresh(prev => prev + 1);
    }, 1000);
    
    // Set up periodic refresh of online status
    const refreshInterval = setInterval(() => {
      OnlineStatusService.updateOnlineStatus();
      setOnlineStatusRefresh(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds
    
    // Cleanup on unmount
    return () => {
      clearInterval(refreshInterval);
      OnlineStatusService.cleanup();
    };
  }, [currentUser]); // Only depend on currentUser

  // Update OnlineStatusService with user IDs when data changes
  useEffect(() => {
    if (!currentUser) return;

    // Collect all user IDs from the current data
    const allUserIds = new Set();
    
    // Add current user
    if (currentUser._id) {
      allUserIds.add(currentUser._id);
    }
    
    // Add liked users (use stable data to prevent rapid updates)
    stableLikedUsers.forEach(user => {
      if (user._id) allUserIds.add(user._id);
    });
    
    // Add users who like current user (use stable data to prevent rapid updates)
    stableUsersWhoLikeYou.forEach(user => {
      if (user._id) allUserIds.add(user._id);
    });
    
    // Add connections
    if (currentUser.connections) {
      currentUser.connections.forEach(connectionId => {
        allUserIds.add(connectionId);
      });
    }
    
    // Add requests
    if (currentUser.requests) {
      currentUser.requests.forEach(requestId => {
        allUserIds.add(requestId);
      });
    }
    
    const userIdsArray = Array.from(allUserIds);
    
    // Set the users to check in the OnlineStatusService
    OnlineStatusService.setUsersToCheck(userIdsArray);
    
    // Update online status with new users
    if (userIdsArray.length > 0) {
      OnlineStatusService.updateOnlineStatus();
    }
  }, [currentUser, stableLikedUsers, stableUsersWhoLikeYou]);

  // Removed cleanup inconsistencies function to prevent excessive API calls

  const onRefresh = React.useCallback(() => {
    fetchUsers(true);
    // Refresh online status when pulling to refresh
    OnlineStatusService.updateOnlineStatus();
  }, []);

  // Simplified focus effect - only refresh if data is actually stale
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser && !processingLockRef.current) {
        
        // Only refresh if we don't have allUsers data or if data seems stale
        if (!allUsers || allUsers.length === 0) {
          fetchUsers();
        } else {
          // Check if we need to refresh due to connection changes
          // This will be triggered when returning from connection cancellation
          const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
          if (timeSinceLastUpdate > 2000) { // Refresh if it's been more than 2 seconds
            console.log('🔄 [Likes] Refreshing data on focus - data may be stale');
            fetchUsers();
          }
        }
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
      // Error refreshing user data
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
      return;
    }
    
    // Check if user has subscription
    if (!currentUser?.isSubscribed || !currentUser?.subscriptionExpiryDate || 
        new Date(currentUser.subscriptionExpiryDate) <= new Date()) {
      // Show subscription required modal instead of navigating
      setSubscriptionModalVisible(true);
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
      // Fallback navigation
      navigation.navigate('Premium');
    }
  };

  const handleSubscribe = () => {
    setSubscriptionModalVisible(false);
    navigation.navigate('Premium', { screen: 'SubscriptionScreen' });
  };

  const handleCloseSubscriptionModal = () => {
    setSubscriptionModalVisible(false);
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
      // Optionally show an error message to the user
    } finally {
      setRemovingLike(null);
    }
  };

  // Profile popup modal handlers
  const openProfileModal = (user) => {
    setSelectedProfileUser(user);
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
    setSelectedProfileUser(null);
  };



  const renderUserCard = (user, index) => {
    const cardWidth = getCardWidth();
    const cardHeight = cardWidth * 1.2;
    // Check if this user is the one with a pending request
    const isPendingRequestToThisUser = currentUser && currentUser.requests && currentUser.requests.includes(user._id);
    // Disable connect if user cannot connect globally (but allow if this is the pending request user)
    const disableConnect = !canConnectGlobally() && !isPendingRequestToThisUser;
    
    // Debug online status
    const isOnline = OnlineStatusService.isUserOnline(user._id);
    
    return (
      <View key={user._id} style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}> 
        {/* Overlay for global connect limit, but allow profile image clicks */}
        {disableConnect && (
          <View style={styles.pendingOverlayContainer}>
            {/* Overlay for user info section */}
            <TouchableOpacity
              style={styles.pendingOverlayInfo}
              activeOpacity={0.7}
              onPress={() => setLimitModalVisible(true)}
            />
            {/* Overlay for connect button */}
            <TouchableOpacity
              style={styles.pendingOverlayButton}
              activeOpacity={0.7}
              onPress={() => setLimitModalVisible(true)}
            />
          </View>
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
                        <TouchableOpacity 
                          style={styles.profileImageContainer}
                          onPress={() => openProfileModal(user)}
                          activeOpacity={0.9}
                        >
                          <Image source={getProfileImageSource(user)} style={styles.cardImage} />
                        </TouchableOpacity>
        {/* User Info - Now acts as connection button */}
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => {
            if (isPendingRequestToThisUser) {
              handleOverlayPress(user);
            } else if (disableConnect) {
              setLimitModalVisible(true);
            } else {
              openConnectionModal(user._id || user.id);
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.status}>
            {OnlineStatusService.isUserOnline(user._id) && (
              <>
                <View style={styles.activeDot} />
                <Text style={styles.statusText}>Active</Text>
              </>
            )}
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {user.username || user.name}
              {(user.age || calculateAge(user.dateOfBirth)) ? `, ${user.age || calculateAge(user.dateOfBirth)}` : ''}
            </Text>
            {(user?.verificationStatus === 'verified') && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons 
                  name="verified" 
                  size={getResponsiveFontSize(17, 20)} 
                  color="#ec066a" 
                />
              </View>
            )}
          </View>
          <View style={styles.locationContainer}>
            <Text style={styles.distance}>{user.location || ''}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => {
            if (isPendingRequestToThisUser) {
              handleOverlayPress(user);
            } else if (disableConnect) {
              setLimitModalVisible(true);
            } else {
              openConnectionModal(user._id || user.id);
            }
          }}
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

  // Add timeout effect for when allUsers is empty (moved outside conditional)
  useEffect(() => {
    if ((!allUsers || allUsers.length === 0) && stableLikedUsers.length === 0 && stableUsersWhoLikeYou.length === 0) {
      const timeout = setTimeout(() => {
        if (!allUsers || allUsers.length === 0) {
          fetchUsers();
        }
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [allUsers, stableLikedUsers.length, stableUsersWhoLikeYou.length]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      // Reset rapid swipe detection
      rapidSwipeCountRef.current = 0;
      isRapidSwipingRef.current = false;
      suppressUpdatesRef.current = false;
      // Reset stable data reference
      lastStableDataRef.current = {
        likedUsers: [],
        usersWhoLikeYou: [],
        timestamp: 0
      };
    };
  }, []);

  // Show loading state if allUsers is not loaded yet AND we don't have any likes data
  if ((!allUsers || allUsers.length === 0) && stableLikedUsers.length === 0 && stableUsersWhoLikeYou.length === 0) {
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
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <Text style={styles.loadingText}>...</Text>
            </View>
          </View>
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
      
      
      { error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>{error}</Text></View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.cardsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isUpdating}
              onRefresh={() => {
                onRefresh();
                refreshUserData();
              }}
              tintColor="#ec066a"
              colors={["#ec066a"]}
            />
          }
        >
          <Animated.View style={[styles.cardsGrid, { opacity: fadeAnim }]}>
            {(() => {
              // DEBUG: Log render data
              console.log('🎨 [DEBUG LIKES] RENDERING CARDS:', {
                timestamp: new Date().toISOString(),
                activeTab,
                stableLikedUsersCount: stableLikedUsers.length,
                stableUsersWhoLikeYouCount: stableUsersWhoLikeYou.length,
                stableLikedUserIds: stableLikedUsers.map(u => u._id),
                stableLikersUserIds: stableUsersWhoLikeYou.map(u => u._id),
                isUpdating
              });
              
              return activeTab === 'yourLikes' ? (
                stableLikedUsers.length > 0 ? 
                  stableLikedUsers.map(renderUserCard) : 
                  <Text style={{ color: '#fff' }}>No likes yet</Text>
              ) : (
                stableUsersWhoLikeYou.length > 0 ? 
                  stableUsersWhoLikeYou.map(renderUserCard) : 
                  <Text style={{ color: '#fff' }}>No one has liked you yet</Text>
              );
            })()}
          </Animated.View>
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
      
      <ProfilePopupModal
        visible={profileModalVisible}
        onClose={closeProfileModal}
        user={selectedProfileUser}
        getProfileImageSource={getProfileImageSource}
        getImageSource={getImageSource}
        calculateAge={calculateAge}
        navigation={navigation}
      />
      
      <SubscriptionRequiredModal
        visible={subscriptionModalVisible}
        onClose={handleCloseSubscriptionModal}
        onSubscribe={handleSubscribe}
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
  profileImageContainer: {
    width: '100%',
    height: '100%',
    zIndex: 15,
  },
  userInfo: {
    position: 'absolute',
    bottom: getResponsiveSpacing(14, 18),
    left: getResponsiveSpacing(10, 12),
    right: getResponsiveSpacing(10, 12),
    zIndex: 20,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6ec531',
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
    right: getResponsiveSpacing(-8, -10),
    width: getResponsiveWidth(56, 64),
    height: getResponsiveWidth(56, 64),
    zIndex: 15,
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
    zIndex: 25,
  },
  removingButton: {
    opacity: 0.6,
  },
  closeIcon: {
    width: getResponsiveWidth(16, 20),
    height: getResponsiveWidth(16, 20),
    resizeMode: 'contain',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: getResponsiveWidth(40, 50),
    height: getResponsiveWidth(40, 50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(24, 28),
    fontWeight: 'bold',
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(83, 83, 83, 0.3)',
    zIndex: 10,
    borderRadius: getResponsiveSpacing(10, 12),
  },
  pendingOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'auto',
  },
  pendingOverlayInfo: {
    position: 'absolute',
    bottom: getResponsiveSpacing(14, 18),
    left: 0,
    right: 0,
    height: getResponsiveSpacing(60, 80),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: getResponsiveSpacing(10, 12),
    zIndex: 30,
  },
  pendingOverlayButton: {
    position: 'absolute',
    bottom: getResponsiveSpacing(4, 6),
    right: getResponsiveSpacing(4, 6),
    width: getResponsiveWidth(40, 48),
    height: getResponsiveWidth(40, 48),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: getResponsiveWidth(20, 24),
    zIndex: 30,
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



  activeConnectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeConnectionImageContainer: {
    position: 'relative',
    width: getResponsiveWidth(50, 60),
    height: getResponsiveWidth(50, 60),
    borderRadius: getResponsiveWidth(25, 30),
    marginRight: getResponsiveSpacing(12, 16),
  },
  activeConnectionImage: {
    width: '100%',
    height: '100%',
    borderRadius: getResponsiveWidth(25, 30),
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6ec531',
    borderWidth: 0,
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
