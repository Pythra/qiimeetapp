import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  ActivityIndicator
} from 'react-native';

import { Ionicons, FontAwesome6, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-deck-swiper';
import { FONTS } from '../../constants/font';
import { API_BASE_URL } from '../../env';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../components/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketManager from '../../utils/socket';
import MatchFoundPopup from '../../components/MatchFoundPopup';
import OnlineStatusService from '../../utils/onlineStatusService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Home = ({ navigation, route }) => {
  const { user: profile, token, balance, users: contextUsers, updateUser, initialized, dataReady, refreshBalance, getProfileImageSource } = useAuth();
  


 
  const [showNextCard, setShowNextCard] = useState(true);
  const swiperRef = useRef(null);
  const [swipedCards, setSwipedCards] = useState([]);
  const [cardHistory, setCardHistory] = useState([]);
  

  const [users, setUsers] = useState(contextUsers || []);
  const [swiperCards, setSwiperCards] = useState([]);
  const swiperCardsRef = useRef(swiperCards);
  
  // Debounced state update to prevent rapid re-renders
  const debouncedSetUsers = useCallback((newUsers) => {
    setUsers(newUsers);
  }, []);

  // Sync users state with contextUsers and clear error when data loads successfully
  useEffect(() => {
    // Don't override if filters are active - we want to keep the filtered users
    if (contextUsers && contextUsers.length > 0 && !filtersActive) {
      console.log('🔄 [Home] Syncing users from AuthContext:', contextUsers.length, 'users');
      setUsers(contextUsers);
      // Clear any error state when data loads successfully
      if (error) {
        console.log('✅ [Home] Clearing error state - data loaded successfully');
        setError(null);
      }
    } else if (filtersActive) {
      console.log('🚫 [Home] Skipping AuthContext sync - filters are active, keeping filtered users');
    }
  }, [contextUsers, error, filtersActive]);
  
  const debouncedSetSwiperCards = useCallback((newCards) => {
    setSwiperCards(newCards);
  }, []);
  
  // Create a stable swiper cards array to prevent unnecessary re-renders
  const stableSwiperCards = useMemo(() => {
    return swiperCards;
  }, [swiperCards, isProcessingSwipe, isAnimating, isRewinding]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [filtersActive, setFiltersActive] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const [isApplyingFilteredUsers, setIsApplyingFilteredUsers] = useState(false);
  const [isRewinding, setIsRewinding] = useState(false);
  
  // Track recently swiped users to prevent them from being added back
  const recentlySwipedRef = useRef(new Set());
  const [rewindCounter, setRewindCounter] = useState(0);
  const [startOverProgress, setStartOverProgress] = useState('');
  const usersRef = useRef(users);
  const filterCooldownUntilRef = useRef(0);
  const [swipeX, setSwipeX] = useState(0);
  const [showEndCard, setShowEndCard] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // Match popup state
  const [matchPopupVisible, setMatchPopupVisible] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const matchPopupTimeoutRef = useRef(null);
  const isMatchPopupPriorityRef = useRef(false);
  
  // Swipe queue to ensure fast swipes don't get lost
  const swipeQueueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);
  const isStartOverInProgressRef = useRef(false);
  const profileUpdateRef = useRef(null);
  const lastAppliedAgeRangeRef = useRef(null);
  


  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    swiperCardsRef.current = swiperCards;
  }, [swiperCards]);



  // Reset swipeX when component unmounts or navigation changes
  useEffect(() => {
    return () => {
      setSwipeX(0);
    };
  }, []);
  




  // Reset swipeX when users array changes (e.g., after filters or rewind)
  useEffect(() => {
    setSwipeX(0);
  }, [users.length]);

  // Use focus effect to reset swipeX when screen becomes focused
  useFocusEffect(
    useCallback(() => {
      // Reset swipeX when screen is focused to prevent lingering overlays
      setSwipeX(0);
    }, [])
  );

  // Socket connection and online status listeners
  useEffect(() => {
    if (!profile) return;

    // Connect to socket immediately
    SocketManager.connect();
    
    // Listen for socket status changes
    const handleSocketStatusChange = (status) => {
      setSocketStatus(status);
    };
    
    // Listen for online status updates
    const handleUserOnline = (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    };
    
    const handleUserOffline = (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    // Add event listeners immediately
    SocketManager.socket?.on('connect', () => handleSocketStatusChange('connected'));
    SocketManager.socket?.on('disconnect', () => handleSocketStatusChange('disconnected'));
    SocketManager.socket?.on('user_online', handleUserOnline);
    SocketManager.socket?.on('user_offline', handleUserOffline);
    
    // Listen for match events
    SocketManager.socket?.on('match_found', (data) => {
      const socketMatchTime = Date.now();
      console.log('🔌 [DEBUG SOCKET MATCH] Received match_found event:', {
        data,
        currentUserId: profile?._id,
        timestamp: new Date().toISOString()
      });
      
      // Check if this match is for the current user
      // The backend sends user1Id and user2Id, we need to check if current user is one of them
      const isMatchForCurrentUser = data.user1Id === profile?._id || data.user2Id === profile?._id;
      
      if (isMatchForCurrentUser) {
        console.log('✅ [DEBUG SOCKET MATCH] Match is for current user, processing:', {
          user1Id: data.user1Id,
          user2Id: data.user2Id,
          currentUserId: profile?._id,
          user1Name: data.user1Name,
          user2Name: data.user2Name
        });
        
        // Transform the data to match the expected format for MatchFoundPopup
        const transformedMatchData = {
          type: data.type,
          matchedUserId: data.user1Id === profile?._id ? data.user2Id : data.user1Id,
          matchedUserName: data.user1Id === profile?._id ? data.user2Name : data.user1Name,
          userId: profile?._id,
          userName: data.user1Id === profile?._id ? data.user1Name : data.user2Name
        };
        
        // Show match popup immediately without any delay
        // Clear any existing timeout
        if (matchPopupTimeoutRef.current) {
          clearTimeout(matchPopupTimeoutRef.current);
        }
        
        // Set priority flag to ensure popup appears immediately
        isMatchPopupPriorityRef.current = true;
        
        const socketPopupShowTime = Date.now();
        console.log('🎉 [DEBUG SOCKET MATCH] Showing socket-based match popup:', {
          matchedUser: transformedMatchData.matchedUserName,
          matchedUserId: transformedMatchData.matchedUserId,
          type: transformedMatchData.type,
          timeSinceSocketEvent: socketPopupShowTime - socketMatchTime + 'ms',
          timestamp: new Date().toISOString()
        });
        
        // Set popup data and show immediately
        setMatchData(transformedMatchData);
        setMatchPopupVisible(true);
        
        // Reset priority flag after a short delay
        setTimeout(() => {
          isMatchPopupPriorityRef.current = false;
        }, 1000);
        
        // Match popup is handled directly by this component
        // Other components can listen to the AuthContext for user updates
      } else {
        console.log('❌ [DEBUG SOCKET MATCH] Match is not for current user, ignoring');
      }
    });

    // Initialize OnlineStatusService for accurate online status
    OnlineStatusService.initialize();
    
    // Set up periodic online status refresh using OnlineStatusService
    const onlineStatusInterval = setInterval(async () => {
      if (users && users.length > 0) {
        // Get user IDs from current users
        const userIds = users.map(user => user._id || user.id).filter(Boolean);
        
        // Set users to check in OnlineStatusService
        OnlineStatusService.setUsersToCheck(userIds);
        
        // Update online status from backend
        await OnlineStatusService.updateOnlineStatus();
        
        // Update local state with accurate online status
        const onlineUsersArray = OnlineStatusService.getOnlineUsers();
('🟢 [Home] Updated online users:', onlineUsersArray);
        setOnlineUsers(new Set(onlineUsersArray));
      }
    }, 30000);
    
    // Initial online status update
    if (users && users.length > 0) {
      const userIds = users.map(user => user._id || user.id).filter(Boolean);
      OnlineStatusService.setUsersToCheck(userIds);
      
      // Get initial online status
      setTimeout(async () => {
        await OnlineStatusService.updateOnlineStatus();
        const onlineUsersArray = OnlineStatusService.getOnlineUsers();
        setOnlineUsers(new Set(onlineUsersArray));
      }, 1000);
    }
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(onlineStatusInterval);
      OnlineStatusService.cleanup();
      SocketManager.socket?.off('connect', () => handleSocketStatusChange('connected'));
      SocketManager.socket?.off('disconnect', () => handleSocketStatusChange('disconnected'));
      SocketManager.socket?.off('user_online', handleUserOnline);
      SocketManager.socket?.off('user_offline', handleUserOffline);
      SocketManager.socket?.off('match_found');
    };
  }, [profile, users, socketStatus]);

  // Update online status when users change
  useEffect(() => {
    if (users && users.length > 0) {
      const userIds = users.map(user => user._id || user.id).filter(Boolean);
      OnlineStatusService.setUsersToCheck(userIds);
      
      // Update online status immediately when users change
      setTimeout(async () => {
        await OnlineStatusService.updateOnlineStatus();
        const onlineUsersArray = OnlineStatusService.getOnlineUsers();
        setOnlineUsers(new Set(onlineUsersArray));
      }, 500);
    }
  }, [users]);

  // Reset swipeX when users change to prevent overlay from persisting
  useEffect(() => {
    setSwipeX(0);
  }, [users]);

  // Initialize and synchronize swiperCards from users when safe
  useEffect(() => {
    // Only sync when not processing swipes, not rewinding, and after cooldown
    if (!isProcessingSwipe && !isRewinding && Date.now() >= filterCooldownUntilRef.current) {
      // Only log when there's a significant change or issue
      const hasSignificantChange = users.length !== swiperCardsRef.current.length;
      if (hasSignificantChange) {
        console.log('🔄 [DEBUG] Syncing swiper cards from users:', {
          usersCount: users.length,
          profileLikesCount: profile?.likes?.length || 0,
          profileDislikesCount: profile?.dislikes?.length || 0,
          currentCardsCount: swiperCardsRef.current.length,
          timestamp: new Date().toISOString()
        });
      }
      
      const next = users.filter(user => {
        if (!user || !(user._id || user.id)) return false;
        
        // Exclude current user's profile
        if (profile && user._id === profile._id) {
          return false;
        }
        
        const userId = user._id || user.id;
        
        // Exclude users without profile pictures
        if (!user.profilePictures || user.profilePictures.length === 0) {
          if (hasSignificantChange) {
            console.log('🚫 [DEBUG] Filtering out user without profile pictures:', {
              userName: user.name || user.username || 'Unknown',
              userId,
              timestamp: new Date().toISOString()
            });
          }
          return false;
        }
        
        // Exclude recently swiped users to prevent them from being added back
        if (recentlySwipedRef.current.has(userId)) {
          if (hasSignificantChange) {
            console.log('🚫 [DEBUG] Filtering out recently swiped user:', {
              userName: user.name || user.username || 'Unknown',
              userId,
              timestamp: new Date().toISOString()
            });
          }
          return false;
        }
        
        // Exclude users who have already been liked or disliked
        const isLiked = profile?.likes?.includes(userId) || false;
        const isDisliked = profile?.dislikes?.includes(userId) || false;
        
        if (isLiked || isDisliked) {
          // Only log when there's a significant filtering happening
          if (hasSignificantChange) {
            console.log('🚫 [DEBUG] Filtering out already swiped user:', {
              userName: user.name || user.username || 'Unknown',
              userId,
              isLiked,
              isDisliked,
              timestamp: new Date().toISOString()
            });
          }
          return false;
        }
        
        return true;
      });
      const current = swiperCardsRef.current;

      
      // TEMPORARY: Force update if we have users but no swiperCards
      if (next.length > 0 && (!current || current.length === 0)) {
        debouncedSetSwiperCards(next);
        setSwipeX(0);
        return;
      }
      
      // More robust comparison to prevent unnecessary updates
      const sameLength = next.length === current.length;
      const sameIds = sameLength && next.every((u, i) => {
        const currentId = current[i]?._id || current[i]?.id;
        const nextId = u?._id || u?.id;
        return currentId === nextId;
      });
      
      // Only update if there's a meaningful difference AND we're not in the middle of processing a swipe or rewind
      // This prevents cards from being added back after swiping or during rewind
      if (!sameIds && next.length > 0 && !isProcessingSwipe && !isRewinding) {
        // Additional safety check: don't update if we're in the middle of a swipe animation
        if (!isAnimating && !isRewinding) {
          console.log('🔄 [DEBUG] Updating swiper cards:', {
            from: current.length,
            to: next.length,
            nextUserIds: next.map(u => u._id || u.id),
            timestamp: new Date().toISOString()
          });
          
          // Debug: Log the actual users being displayed with their ages
          console.log('🎯 [DEBUG] Users being displayed in swiper cards:', next.map(u => ({
            name: u.name || u.username,
            age: u.age,
            dateOfBirth: u.dateOfBirth,
            calculatedAge: getAge(u),
            id: u._id || u.id
          })));
          
          debouncedSetSwiperCards(next);
          // Reset swipeX when swiperCards change to prevent overlay from persisting
          setSwipeX(0);
        } else {
          console.log('⏳ [DEBUG] Skipping card update due to animation state:', {
            isAnimating,
            isRewinding,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log('✅ [DEBUG] No card update needed:', {
          sameIds,
          nextLength: next.length,
          currentLength: current.length,
          isProcessingSwipe,
          isRewinding,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, [users, profile, isProcessingSwipe, isAnimating, isRewinding]);

  // Add focus effect to ensure cards are properly filtered when returning to home
  // Only runs when there's actually a problem that needs fixing
  useFocusEffect(
    useCallback(() => {
      if (profile && swiperCards.length > 0) {
        // Quick check: are there any cards that should be filtered out?
        const needsFiltering = swiperCards.some(card => {
          if (!card || !(card._id || card.id)) return false;
          
          // Check if this card should be filtered out
          const userId = card._id || card.id;
          const isCurrentUser = profile && card._id === profile._id;
          const isLiked = profile?.likes?.includes(userId) || false;
          const isDisliked = profile?.dislikes?.includes(userId) || false;
          
          return isCurrentUser || isLiked || isDisliked;
        });
        
        // Only run filtering if there's actually something to filter
        if (needsFiltering) {
          console.log('🏠 [DEBUG] Home screen focused - filtering needed:', {
            cardsCount: swiperCards.length,
            likesCount: profile.likes?.length || 0,
            dislikesCount: profile.dislikes?.length || 0,
            timestamp: new Date().toISOString()
          });
          
          // Filter out any cards that should not be there
          const filteredCards = swiperCards.filter(card => {
            if (!card || !(card._id || card.id)) return false;
            
            // Exclude current user's profile
            if (profile && card._id === profile._id) {
              return false;
            }
            
            // Exclude users without profile pictures
            if (!card.profilePictures || card.profilePictures.length === 0) {
              console.log('🚫 [DEBUG] Focus check - removing user without profile pictures:', {
                userName: card.name || card.username || 'Unknown',
                userId: card._id || card.id,
                timestamp: new Date().toISOString()
              });
              return false;
            }
            
            // Exclude users who have already been liked or disliked
            const userId = card._id || card.id;
            const isLiked = profile?.likes?.includes(userId) || false;
            const isDisliked = profile?.dislikes?.includes(userId) || false;
            
            if (isLiked || isDisliked) {
              console.log('🚫 [DEBUG] Focus check - removing already swiped user:', {
                userName: card.name || card.username || 'Unknown',
                userId,
                isLiked,
                isDisliked,
                timestamp: new Date().toISOString()
              });
              return false;
            }
            
            return true;
          });
          
          // Update cards if filtering removed any
          if (filteredCards.length !== swiperCards.length) {
            console.log('🔄 [DEBUG] Focus check - updating cards after filtering:', {
              from: swiperCards.length,
              to: filteredCards.length,
              timestamp: new Date().toISOString()
            });
            setSwiperCards(filteredCards);
            swiperCardsRef.current = filteredCards;
          }
        } else {
          console.log('✅ [DEBUG] Home screen focused - no filtering needed');
        }
      }
    }, [profile, swiperCards])
  );

  // Check for filtered users from route params and load saved filters when component mounts
  useEffect(() => {
    console.log('🔍 [DEBUG] Route params check:', {
      hasRoute: !!route,
      hasParams: !!route?.params,
      hasFilteredUsers: !!route?.params?.filteredUsers,
      hasFiltersApplied: !!route?.params?.filtersApplied,
      filteredUsersLength: route?.params?.filteredUsers?.length || 0,
      filtersApplied: route?.params?.filtersApplied,
      allParams: route?.params
    });
    
    if (route?.params?.filteredUsers && route.params.filtersApplied) {
      console.log('📋 [DEBUG] Using filtered users from navigation params:', route.params.filteredUsers.length, 'users');
      console.log('📋 [DEBUG] Applied filters:', route.params.filters);
      
      // Debug: Log the actual users and their ages
      console.log('🔍 [DEBUG] Filtered users details:', route.params.filteredUsers.map(u => ({
        name: u.name || u.username,
        age: u.age,
        dateOfBirth: u.dateOfBirth,
        calculatedAge: getAge(u)
      })));
      
      // Use the filtered users from navigation params
      setUsers(route.params.filteredUsers);
      setFiltersActive(true);
      setActiveFilters(route.params.filters || {});
      
      // Clear any error state when filtered data loads successfully
      if (error) {
        console.log('✅ [Home] Clearing error state - filtered data loaded successfully');
        setError(null);
      }
      
      // Clear the route params to prevent re-processing
      navigation.setParams({ filteredUsers: undefined, filtersApplied: false });
    } else {
      console.log('📋 [DEBUG] No filtered users in route params - will use default data');
    }
  }, [route?.params, error, navigation]);

  // Constants
  const CARD_WIDTH = SCREEN_WIDTH * 0.9;
  const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

  // Function to handle "start over" - ENABLED
  const handleStartOver = useCallback(async () => {
    // Prevent multiple simultaneous start over attempts
    if (isStartOverInProgressRef.current || loading) {
      return;
    }
    
    isStartOverInProgressRef.current = true;
    setLoading(true);
    setStartOverProgress('Clearing your likes and dislikes...');
    
    try {
('🔄 [DEBUG] Starting over - clearing likes and dislikes...');
      
      // First, clear likes and dislikes on the server
      const clearResponse = await fetch(`${API_BASE_URL}/auth/reset-likes-dislikes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!clearResponse.ok) {
        const errorText = await clearResponse.text();
        console.error('❌ [DEBUG] Clear likes/dislikes API Error:', {
          status: clearResponse.status,
          statusText: clearResponse.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error('Failed to clear likes and dislikes');
      }
      
      const clearData = await clearResponse.json();
      
      if (clearData.success) {
        // Update local user state to reflect cleared likes/dislikes
        const updatedUser = {
          ...profile,
          likes: [],
          dislikes: []
        };
        updateUser(updatedUser);
        
('✅ [DEBUG] Likes and dislikes cleared successfully');
      } else {
        throw new Error('Failed to clear likes and dislikes');
      }
      
      setStartOverProgress('Fetching fresh profiles...');
      
      // Fetch fresh users from API
      const response = await fetch(`${API_BASE_URL}/admin/users/home`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DEBUG] Start over API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error('Failed to fetch fresh users');
      }
      
      const data = await response.json();
      
      if (data.success) {
('📊 [DEBUG] Start over - fresh users from API:', {
          totalUsers: data.users?.length || 0,
          users: data.users?.map(u => ({
            name: u.name || u.username,
            id: u._id,
            languages: u.languages,
            hasProfilePictures: u.profilePictures?.length > 0,
            verificationStatus: u.verificationStatus
          })) || []
        });
        

        
        setStartOverProgress('Preparing fresh profiles...');
        
        // Now that likes/dislikes are cleared, show all users except current user and incognito users
        const freshUsers = data.users.filter(user => {
          if (!user || !user._id) return false;
          
          // Exclude current user's profile
          if (profile && user._id === profile._id) {
            return false;
          }
          
          // Exclude users without profile pictures
          if (!user.profilePictures || user.profilePictures.length === 0) {
            return false;
          }
          
          // Exclude incognito users
          if (user.incognito === true) {
            return false;
          }
          
          // Now we can show all users since likes/dislikes are cleared
          return true;
        });
        
('🔄 [DEBUG] Start over - fresh filtering results:', {
          totalUsers: freshUsers.length,
          firstUser: freshUsers[0]?.name || 'none',
          includesAllUsers: true
        });
        
        setStartOverProgress('Resetting card history...');
        
        // Clear card history and reset states
        setCardHistory([]);
        setShowEndCard(false);
        setSwipeX(0);
        
        // Update users with fresh list and apply saved filter settings
        // If filters are active, preserve them instead of applying all users
        if (filtersActive && activeFilters.ageRange) {
          console.log('🔄 [DEBUG] Start over - preserving active age filter:', activeFilters.ageRange);
          
          // Apply age filter to fresh users
          const [minAge, maxAge] = activeFilters.ageRange;
          const ageFilteredUsers = freshUsers.filter(user => {
            const userAge = getAge(user);
            return userAge !== null && userAge >= minAge && userAge <= maxAge;
          });
          
          console.log('🔄 [DEBUG] Start over - age filtered results:', {
            originalCount: freshUsers.length,
            filteredCount: ageFilteredUsers.length,
            ageRange: activeFilters.ageRange
          });
          
          await filterAndSetUsers(ageFilteredUsers, false, false);
        } else {
          console.log('🔄 [DEBUG] Start over - no active filters, showing all users');
          await filterAndSetUsers(freshUsers, false, false);
        }
        
        // Reset animation states
        setIsAnimating(false);
        setIsProcessingSwipe(false);
        setIsRewinding(false);
        
        // Reset cooldown
        filterCooldownUntilRef.current = 0;
        
('✅ [DEBUG] Start over completed successfully');
        
      } else {
        console.error('❌ [DEBUG] Start over - API returned success: false');
        throw new Error('Failed to fetch fresh users');
      }
    } catch (err) {
      console.error('❌ [DEBUG] Start over error:', err);
      
      // Fallback: use context users with fresh filtering
      setStartOverProgress('Using cached profiles...');
      
      if (contextUsers && contextUsers.length > 0) {
        const fallbackUsers = contextUsers.filter(user => {
          if (!user || !user._id) return false;
          
          // Exclude current user's profile
          if (profile && user._id === profile._id) {
            return false;
          }
          
          // Exclude incognito users
          if (user.incognito === true) {
            return false;
          }
          
          // Show all users since likes/dislikes should be cleared
          return true;
        });
        
        setCardHistory([]);
        setShowEndCard(false);
        setSwipeX(0);
        await filterAndSetUsers(fallbackUsers, false, false);
        
('🔄 [DEBUG] Start over fallback completed with context users');
      }
    } finally {
      setLoading(false);
      setStartOverProgress('');
      isStartOverInProgressRef.current = false;
    }
  }, [token, profile, contextUsers, debouncedSetUsers, debouncedSetSwiperCards, updateUser]);

  // Handle rewind functionality
  const handleRewind = useCallback(() => {
    // Enhanced protection against rapid rewind attempts
    if (!isAnimating && !isRewinding && !isProcessingSwipe && cardHistory.length > 0) {
      // Add cooldown protection for rewind
      if (filterCooldownUntilRef.current > Date.now()) {
        return;
      }
      
      // Set cooldown to prevent rapid rewind
      filterCooldownUntilRef.current = Date.now() + 600;
      
      setIsAnimating(true);
      setIsRewinding(true);
      
      // Immediately reset swipeX to clear any lingering overlay
      setSwipeX(0);
      
      // Get the last swiped card from history
      const lastSwipedCard = cardHistory[cardHistory.length - 1];
      const rewoundUserId = lastSwipedCard._id || lastSwipedCard.id;
      
      // Remove the user from recently swiped set so they can be added back
      recentlySwipedRef.current.delete(rewoundUserId);
      
      console.log('🔄 [DEBUG REWIND] Removing user from recently swiped set:', {
        userName: lastSwipedCard?.name || 'unknown',
        rewoundUserId,
        timestamp: new Date().toISOString()
      });
      
      // Remove the user from optimistic likes/dislikes arrays
      const updatedProfile = {
        ...profile,
        likes: profile.likes?.filter(id => id !== rewoundUserId) || [],
        dislikes: profile.dislikes?.filter(id => id !== rewoundUserId) || []
      };
      
      // Update the user profile to reflect the rewind
      updateUser(updatedProfile);
      
      console.log('🔄 [DEBUG REWIND] Updated profile after rewind:', {
        likesCount: updatedProfile.likes.length,
        dislikesCount: updatedProfile.dislikes.length,
        rewoundUserId
      });
      
      // Remove the last card from history
      const newHistory = cardHistory.slice(0, -1);
      setCardHistory(newHistory);
      
      // Add the card back to the beginning of users array
      const newUsers = [lastSwipedCard, ...users];
      setUsers(newUsers);
      
      // Reset end card state since we're adding cards back
      setShowEndCard(false);
      
      // Force swiper cards to update with the new user array
      const newSwiperCards = [lastSwipedCard, ...stableSwiperCards];
      setSwiperCards(newSwiperCards);
      
      // Increment rewind counter to force swiper re-render
      setRewindCounter(prev => prev + 1);
      
      // Use a timeout to ensure the state updates are processed
      setTimeout(() => {
        // Reset animation states
        setIsAnimating(false);
        setIsRewinding(false);
        // Double-check swipeX is reset
        setSwipeX(0);
      }, 400); // Increased delay for rewind to ensure state stability
    }
  }, [isAnimating, isRewinding, isProcessingSwipe, cardHistory, users, stableSwiperCards, filterCooldownUntilRef, profile, updateUser]);

  // Process swipe queue to ensure all swipes are saved
  const processSwipeQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || swipeQueueRef.current.length === 0 || isStartOverInProgressRef.current) {
      return;
    }
    
    isProcessingQueueRef.current = true;
    
    // Process swipes sequentially to avoid race conditions
    while (swipeQueueRef.current.length > 0) {
      const { direction, swipedUser, swipedUserId, optimisticLikes, optimisticDislikes } = swipeQueueRef.current.shift();
      
      // Skip processing if start over is in progress
      if (isStartOverInProgressRef.current) { 
        continue;
      }
      
      const queueProcessStartTime = Date.now();
      console.log('🔄 [DEBUG QUEUE] Processing queued swipe:', {
        direction,
        swipedUser: swipedUser?.name || 'unknown',
        swipedUserId,
        optimisticLikesCount: optimisticLikes.length,
        optimisticDislikesCount: optimisticDislikes.length,
        queueLength: swipeQueueRef.current.length,
        timestamp: new Date().toISOString()
      });
      
      try {
        const response = await axios.put(`${API_BASE_URL}/auth/update-likes-dislikes`, {
          likes: optimisticLikes,
          dislikes: optimisticDislikes
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const queueProcessEndTime = Date.now();
        console.log('✅ [DEBUG QUEUE] Server response received:', {
          serverLikesCount: response.data.likes?.length || 0,
          serverDislikesCount: response.data.dislikes?.length || 0,
          optimisticLikesCount: optimisticLikes.length,
          optimisticDislikesCount: optimisticDislikes.length,
          processingTime: queueProcessEndTime - queueProcessStartTime + 'ms',
          timestamp: new Date().toISOString()
        });
        
        // Update user state with server response to ensure consistency
        const serverUser = response.data;
        
        // Always update with server data to ensure consistency, even if counts match
        // This ensures the actual user IDs are correct, not just the counts
        console.log('🔄 [DEBUG QUEUE] Updating user with server data:', {
          fromLikes: profile?.likes?.length || 0,
          toLikes: serverUser.likes?.length || 0,
          fromDislikes: profile?.dislikes?.length || 0,
          toDislikes: serverUser.dislikes?.length || 0,
          serverLikes: serverUser.likes,
          serverDislikes: serverUser.dislikes,
          timestamp: new Date().toISOString()
        });
        
        updateUser(serverUser);
        
        // Clean up recently swiped set after successful server update
        // Remove users that are now properly in likes/dislikes
        const serverLikes = serverUser.likes || [];
        const serverDislikes = serverUser.dislikes || [];
        const allSwipedUsers = [...serverLikes, ...serverDislikes];
        
        recentlySwipedRef.current.forEach(userId => {
          if (allSwipedUsers.includes(userId)) {
            recentlySwipedRef.current.delete(userId);
            console.log('🧹 [DEBUG] Cleaned up recently swiped user:', userId);
          }
        });
        
        // Add a small delay between processing swipes to prevent overwhelming the server
        if (swipeQueueRef.current.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (err) {
        const errorTime = Date.now();
        console.error('❌ [DEBUG QUEUE] Failed to process queued swipe:', {
          error: err.message,
          processingTime: errorTime - queueProcessStartTime + 'ms',
          timestamp: new Date().toISOString()
        });
        
        // Re-queue the failed swipe for retry
        swipeQueueRef.current.unshift({
          direction,
          swipedUser,
          swipedUserId,
          optimisticLikes,
          optimisticDislikes
        });
        
        // Add delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    isProcessingQueueRef.current = false;
  }, [token, updateUser, profile]);

  // Handle swipe action
  const handleSwipe = useCallback(async (direction, swipedUser) => {
    const swipeStartTime = Date.now();
    console.log('🔄 [DEBUG SWIPE] Starting swipe process:', {
      direction,
      swipedUser: swipedUser?.name || 'unknown',
      swipedUserId: swipedUser?._id || swipedUser?.id,
      timestamp: new Date().toISOString(),
      isAnimating,
      isProcessingSwipe,
      isStartOverInProgress: isStartOverInProgressRef.current
    });

    // Prevent multiple simultaneous swipes
    if (isAnimating || isProcessingSwipe || isStartOverInProgressRef.current) {
      console.log('⚠️ [DEBUG SWIPE] Swipe blocked - already processing:', {
        isAnimating,
        isProcessingSwipe,
        isStartOverInProgress: isStartOverInProgressRef.current
      });
      return;
    }
    
    // Block filtering updates during and shortly after swipe to avoid flashes
    filterCooldownUntilRef.current = Date.now() + 800; // Increased cooldown for rapid swipes
    
    setIsAnimating(true);
    setIsProcessingSwipe(true);
    
    const currentSwipedUserId = swipedUser._id || swipedUser.id;
    
    // Optimistic update for likes/dislikes to make likes tab instantly responsive
    // Use the most current state from the user context to avoid stale data
    let optimisticLikes = Array.isArray(profile.likes) ? [...profile.likes] : [];
    let optimisticDislikes = Array.isArray(profile.dislikes) ? [...profile.dislikes] : [];
    
    // If there are pending swipes in the queue, apply them to get the most current state
    if (swipeQueueRef.current.length > 0) {
      console.log('🔄 [DEBUG SWIPE] Applying pending queue updates to optimistic state:', {
        queueLength: swipeQueueRef.current.length,
        initialLikes: optimisticLikes.length,
        initialDislikes: optimisticDislikes.length
      });
      
      // Apply all pending swipes to get the most current optimistic state
      swipeQueueRef.current.forEach(queuedSwipe => {
        if (queuedSwipe.direction === 'right') {
          if (!optimisticLikes.includes(queuedSwipe.swipedUserId)) {
            optimisticLikes.push(queuedSwipe.swipedUserId);
          }
          optimisticDislikes = optimisticDislikes.filter(id => id !== queuedSwipe.swipedUserId);
        } else {
          if (!optimisticDislikes.includes(queuedSwipe.swipedUserId)) {
            optimisticDislikes.push(queuedSwipe.swipedUserId);
          }
          optimisticLikes = optimisticLikes.filter(id => id !== queuedSwipe.swipedUserId);
        }
      });
      
      console.log('✅ [DEBUG SWIPE] Updated optimistic state from queue:', {
        finalLikes: optimisticLikes.length,
        finalDislikes: optimisticDislikes.length
      });
    }
    
    console.log('📊 [DEBUG SWIPE] Before optimistic update:', {
      currentLikes: optimisticLikes.length,
      currentDislikes: optimisticDislikes.length,
      currentSwipedUserId,
      direction
    });
    
    if (direction === 'right') {
      // Add user to likes
      if (!optimisticLikes.includes(currentSwipedUserId)) optimisticLikes.push(currentSwipedUserId);
      optimisticDislikes = optimisticDislikes.filter(id => id !== currentSwipedUserId);
      console.log('✅ [DEBUG SWIPE] Added to likes:', {
        newLikesCount: optimisticLikes.length,
        currentSwipedUserId
      });
    } else {
      if (!optimisticDislikes.includes(currentSwipedUserId)) optimisticDislikes.push(currentSwipedUserId);
      optimisticLikes = optimisticLikes.filter(id => id !== currentSwipedUserId);
      console.log('❌ [DEBUG SWIPE] Added to dislikes:', {
        newDislikesCount: optimisticDislikes.length,
        currentSwipedUserId
      });
    }
    
    // Update user state immediately for instant likes tab responsiveness
    const updatedUser = {
      ...profile,
      likes: optimisticLikes,
      dislikes: optimisticDislikes
    };
    
    const optimisticUpdateTime = Date.now();
    console.log('⚡ [DEBUG SWIPE] Applying optimistic update to AuthContext:', {
      likesCount: optimisticLikes.length,
      dislikesCount: optimisticDislikes.length,
      timeSinceSwipeStart: optimisticUpdateTime - swipeStartTime + 'ms'
    });
    
    updateUser(updatedUser);
    

    
    // Client-side match detection as fallback
    if (direction === 'right' && swipedUser?.likers && swipedUser.likers.includes(profile?._id)) {
      const matchDetectionTime = Date.now();
      console.log('💕 [DEBUG MATCH] Client-side match detected:', {
        matchedUser: swipedUser?.name || 'Unknown',
        matchedUserId: swipedUserId,
        currentUserId: profile?._id,
        likers: swipedUser?.likers,
        timeSinceSwipeStart: matchDetectionTime - swipeStartTime + 'ms',
        timestamp: new Date().toISOString()
      });
      
      // Show match popup immediately
      const transformedMatchData = {
        type: 'match_found',
        matchedUserId: swipedUserId,
        matchedUserName: swipedUser?.name || 'Unknown',
        userId: profile?._id,
        userName: profile?.name || 'Unknown'
      };
      
      // Clear any existing timeout
      if (matchPopupTimeoutRef.current) {
        clearTimeout(matchPopupTimeoutRef.current);
      }
      
      // Set priority flag to ensure popup appears immediately
      isMatchPopupPriorityRef.current = true;
      
      const popupShowTime = Date.now();
      console.log('🎉 [DEBUG MATCH] Showing match popup:', {
        matchedUser: transformedMatchData.matchedUserName,
        type: transformedMatchData.type,
        timeSinceMatchDetection: popupShowTime - matchDetectionTime + 'ms',
        timeSinceSwipeStart: popupShowTime - swipeStartTime + 'ms',
        timestamp: new Date().toISOString()
      });
      
      // Set popup data and show immediately
      setMatchData(transformedMatchData);
      setMatchPopupVisible(true);
      
      // Reset priority flag after a short delay
      setTimeout(() => {
        isMatchPopupPriorityRef.current = false;
      }, 1000);
    }
    
    // Optimistically update UI first for instant responsiveness
    setCardHistory(prev => {
      const newHistory = [...prev, swipedUser];
      // Only log when there's a significant change
      if (prev.length !== newHistory.length - 1) {
        console.log('📚 [DEBUG] Card history updated:', {
          from: prev.length,
          to: newHistory.length,
          swipedUser: swipedUser?.name || 'unknown'
        });
      }
      return newHistory;
    });
    
    // Add to recently swiped set to prevent sync from adding back
    const swipedUserId = swipedUser._id || swipedUser.id;
    recentlySwipedRef.current.add(swipedUserId);
    
    // Set a timeout to clean up the recently swiped user after 30 seconds
    // This ensures the user doesn't stay permanently blocked if server update fails
    setTimeout(() => {
      recentlySwipedRef.current.delete(swipedUserId);
      console.log('⏰ [DEBUG] Timeout cleanup for recently swiped user:', swipedUserId);
    }, 30000);
    
    // Remove the swiped user from swiper cards immediately
    setSwiperCards(prev => {
      const filteredCards = prev.filter(card => {
        const cardId = card._id || card.id;
        return cardId !== swipedUserId;
      });
      
      console.log('🗑️ [DEBUG] Removed swiped user from cards:', {
        swipedUser: swipedUser?.name || 'unknown',
        swipedUserId,
        cardsBefore: prev.length,
        cardsAfter: filteredCards.length,
        timestamp: new Date().toISOString()
      });
      
      return filteredCards;
    });
    
    // Also update the ref to keep it in sync
    swiperCardsRef.current = swiperCardsRef.current.filter(card => {
      const cardId = card._id || card.id;
      return cardId !== swipedUserId;
    });
    
    // Swiper component manages its own index internally
    
    // Increased timeout to ensure all animations complete before allowing new operations
    // Also add a minimum delay to prevent rapid swipes from interfering
    const animationDelay = Math.max(400, 300); // Minimum 400ms delay
    
    // Use a more robust timeout that can be cleared if needed
    const animationTimer = setTimeout(() => {
      setIsAnimating(false);
      setIsProcessingSwipe(false);
      // Ensure swipeX is reset to clear any lingering overlay
      setSwipeX(0);
    }, animationDelay);
    
    // Add swipe to queue to ensure it gets processed even during fast swiping
    if (profile && token && swipedUser && swipedUserId) {
      const swipeData = {
        direction,
        swipedUser,
        swipedUserId,
        optimisticLikes,
        optimisticDislikes,
        timestamp: Date.now(),
        swipeId: `${swipedUserId}_${direction}_${Date.now()}`
      };
      
      // Check if this swipe is already in the queue to prevent duplicates
      const isDuplicate = swipeQueueRef.current.some(queuedSwipe => 
        queuedSwipe.swipedUserId === swipedUserId && queuedSwipe.direction === direction
      );
      
      if (!isDuplicate) {
        swipeQueueRef.current.push(swipeData);
        
        console.log('📝 [DEBUG SWIPE] Added swipe to queue:', {
          swipeId: swipeData.swipeId,
          direction,
          swipedUser: swipedUser?.name || 'unknown',
          swipedUserId,
          queueLength: swipeQueueRef.current.length,
          timestamp: new Date().toISOString()
        });
        
        // Process queue immediately
        processSwipeQueue();
      } else {
        console.log('⚠️ [DEBUG SWIPE] Duplicate swipe detected, skipping:', {
          swipedUser: swipedUser?.name || 'unknown',
          swipedUserId,
          direction,
          timestamp: new Date().toISOString()
        });
      }
    }
      }, [isAnimating, profile, token, updateUser, processSwipeQueue]);

  // Button swipe handlers
  const handleButtonSwipe = useCallback((direction) => {
    // Enhanced protection against rapid swipes
    if (isAnimating || isProcessingSwipe) {
      // Clear any lingering swipe overlay when button swipe is blocked
      setSwipeX(0);
      return;
    }
    
    // Add a small delay to prevent rapid button presses
    if (filterCooldownUntilRef.current > Date.now()) {
      return;
    }
    
    // Let Swiper perform the swipe so that its callbacks keep state in sync
    try {
      if (swiperRef.current) {
        if (direction === 1) {
          swiperRef.current.swipeRight();
        } else {
          swiperRef.current.swipeLeft();
        }
      }
    } catch (err) {
      // Fallback: let Swiper handle the swipe
      if (swiperRef.current) {
        if (direction === 1) {
          swiperRef.current.swipeRight();
        } else {
          swiperRef.current.swipeLeft();
        }
      }
    }
  }, [handleSwipe, isAnimating, isProcessingSwipe, filterCooldownUntilRef]);

  // Match popup handlers
  const handleMatchPopupClose = useCallback(() => {
    setMatchPopupVisible(false);
    setMatchData(null);
  }, []);

  const handleNavigateToConnectionSent = useCallback((userId) => {
    navigation.navigate('ConnectionSent', { userId });
    handleMatchPopupClose();
  }, [navigation, handleMatchPopupClose]);

  const handleNavigateToPremium = useCallback(() => {
    navigation.navigate('Premium', { screen: 'SubscriptionScreen' });
    handleMatchPopupClose();
  }, [navigation, handleMatchPopupClose]);

  // Function to apply basic filters to users - DISABLED
  const applyBasicFilters = useCallback((usersToFilter) => {
    // Return all users without any filtering
    return usersToFilter;
  }, []);

  // Function to fetch users from API
  const fetchUsers = useCallback(async () => {
    // Skip fetching if filters are active and we already have users
    if (filtersActive && users.length > 0) {
      console.log('🚫 [DEBUG] Skipping fetchUsers - filters are active and users already loaded');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🌐 [DEBUG] Fetching users from API...');
      const response = await fetch(`${API_BASE_URL}/admin/users/home`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DEBUG] API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200)
        });
        
        // Only set error if we don't have users from AuthContext
        if (!contextUsers || contextUsers.length === 0) {
          setError('Failed to fetch users');
        } else {
          console.log('⚠️ [DEBUG] API failed but we have users from AuthContext, not setting error');
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 [DEBUG] All users from API:', {
          totalUsers: data.users?.length || 0,
          users: data.users?.map(u => ({
            name: u.name || u.username,
            id: u._id,
            languages: u.languages,
            hasProfilePictures: u.profilePictures?.length > 0,
            verificationStatus: u.verificationStatus
          })) || []
        });
        
        // Clear any existing error when API call succeeds
        if (error) {
          console.log('✅ [DEBUG] API call succeeded, clearing error state');
          setError(null);
        }

        await filterAndSetUsers(data.users, false, true); // Preserve history when fetching users
      } else {
        console.error('❌ [DEBUG] API returned success: false');
        // Only set error if we don't have users from AuthContext
        if (!contextUsers || contextUsers.length === 0) {
          setError('Failed to fetch users');
        } else {
          console.log('⚠️ [DEBUG] API returned false but we have users from AuthContext, not setting error');
        }
      }
    } catch (err) {
      console.error('❌ [DEBUG] Fetch error:', err);
      // Only set error if we don't have users from AuthContext
      if (!contextUsers || contextUsers.length === 0) {
        setError('Failed to fetch users');
      } else {
        console.log('⚠️ [DEBUG] Fetch error but we have users from AuthContext, not setting error');
      }
    } finally {
      setLoading(false);
    }
  }, [filterAndSetUsers, token, contextUsers, error, filtersActive, users.length]);

  // Initialize users from context or fetch if needed
  useEffect(() => {
    if (initialized && !loading && users.length === 0 && !filtersActive) {
      // Only fetch fresh users from API if no filters are active
      console.log('🔄 [DEBUG] Fetching all users from API');
      fetchUsers();
    } else if (filtersActive) {
      console.log('🚫 [DEBUG] Skipping initialization fetch - filters are active');
    }
  }, [initialized, profile, users.length, fetchUsers, filtersActive]);

  // Load user preferences from database - DISABLED
  const loadUserPreferences = useCallback(async () => {
    // No longer loading preferences since filters are disabled
('📋 [DEBUG] User preferences loading disabled - showing all users');
  }, []);

  // Load user preferences when component mounts
  useEffect(() => {
    if (initialized && profile?._id && token) {
      loadUserPreferences();
    }
  }, [initialized, profile?._id, token, loadUserPreferences]);

  // Helper to ensure a user has a valid profile image before display
  const userHasProfilePhoto = useCallback((u) => {
    if (!u) return false;
    try {
      const src = getProfileImageSource(u);
      return !!src;
    } catch (e) {
      return false;
    }
  }, [getProfileImageSource]);

  // Function to load filter settings and apply age and language filtering
  const loadFilterSettingsAndApplyFilters = useCallback(async () => {
    try {
('🔍 [DEBUG] Loading filter settings...');
      
      // Load filter settings from AsyncStorage
      const filterSettingsString = await AsyncStorage.getItem('filterSettings');
      if (!filterSettingsString) {
('🔍 [DEBUG] No filter settings found');
        return;
      }
      
      const filterSettings = JSON.parse(filterSettingsString);
('🔍 [DEBUG] Loaded filter settings:', filterSettings);
      
      let shouldRefetch = false;
      
      // Check if verification filter is set
      const savedVerifiedOnly = filterSettings.isVerified;
      if (savedVerifiedOnly) {
('🔍 [DEBUG] Verification filter found:', savedVerifiedOnly);
        shouldRefetch = true;
      } else {
('🔍 [DEBUG] No verification filter found or using default');
      }
      
      // Check if relationship type filter is set
      const savedRelationshipType = filterSettings.relationshipType;
      if (savedRelationshipType && ((Array.isArray(savedRelationshipType) && savedRelationshipType.length > 0) || savedRelationshipType !== 'All')) {
('🔍 [DEBUG] Relationship type filter found:', savedRelationshipType);
        shouldRefetch = true;
      } else {
('🔍 [DEBUG] No relationship type filter found or using default');
      }
      
      // Check if lifestyle choices filter is set
      const savedLifestyleChoices = filterSettings.lifestyleChoices;
      if (savedLifestyleChoices && savedLifestyleChoices.length > 0) {
('🔍 [DEBUG] Lifestyle choices filter found:', savedLifestyleChoices);
        shouldRefetch = true;
      } else {
('🔍 [DEBUG] No lifestyle choices filter found or using default');
      }
      
      // Check if zodiac filter is set
      const savedZodiacSign = filterSettings.zodiacSign;
      if (savedZodiacSign && ((Array.isArray(savedZodiacSign) && savedZodiacSign.length > 0) || savedZodiacSign !== 'All')) {
('🔍 [DEBUG] Zodiac filter found:', savedZodiacSign);
        shouldRefetch = true;
      } else {
('🔍 [DEBUG] No zodiac filter found or using default');
      }
      
      // Check if personality filter is set
      const savedPersonality = filterSettings.personality;
      if (savedPersonality && ((Array.isArray(savedPersonality) && savedPersonality.length > 0) || savedPersonality !== 'All')) {
('🔍 [DEBUG] Personality filter found:', savedPersonality);
        shouldRefetch = true;
      } else {
('🔍 [DEBUG] No personality filter found or using default');
      }
      
      // Check if age range is set and different from default
      const savedAgeRange = filterSettings.ageRange;
      if (savedAgeRange && Array.isArray(savedAgeRange) && savedAgeRange.length === 2) {
('🔍 [DEBUG] Age range found:', savedAgeRange);
        
        // Check if age range has changed
        const lastAgeRange = lastAppliedAgeRangeRef.current;
        const hasChanged = !lastAgeRange || 
          lastAgeRange[0] !== savedAgeRange[0] || 
          lastAgeRange[1] !== savedAgeRange[1];
        
        if (hasChanged) {
('🔍 [DEBUG] Age range changed from', lastAgeRange, 'to', savedAgeRange);
          lastAppliedAgeRangeRef.current = savedAgeRange;
          shouldRefetch = true;
        } else {
('🔍 [DEBUG] Age range unchanged, no need to refetch users');
        }
      } else {
('🔍 [DEBUG] No age range filter found or using default');
      }
      
      // Check if languages are set and different from default
      const savedLanguages = filterSettings.languages;
      if (savedLanguages && Array.isArray(savedLanguages)) {
('🔍 [DEBUG] Languages found:', savedLanguages);
        
        // For now, we'll always refetch when languages change to ensure we have all users
        // This could be optimized later to only refetch if we don't have enough users
        shouldRefetch = true;
      } else {
('🔍 [DEBUG] No languages filter found or using default');
      }
      
      if (shouldRefetch && !filtersActive) {
        // Fetch fresh users from API to ensure we have enough data to filter
        console.log('🔍 [DEBUG] Fetching fresh users to apply new filters...');
        await fetchUsers();
      } else if (filtersActive) {
        console.log('🚫 [DEBUG] Skipping filter refetch - filters are already active');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error loading filter settings:', error);
    }
  }, [fetchUsers, filtersActive]);

  // Function to apply age filtering
  const applyAgeFilter = useCallback((ageRange) => {
    if (!users || users.length === 0) {
      console.log('🔍 [DEBUG] No users to filter');
      return;
    }
    
    console.log('🔍 [DEBUG] Applying age filter:', ageRange);
    console.log('🔍 [DEBUG] Current users count:', users.length);
    
    const [minAge, maxAge] = ageRange;
    console.log('🔍 [DEBUG] Age range:', { minAge, maxAge });
    
    // Filter users by age
    const ageFilteredUsers = users.filter(user => {
      if (!user || !user._id) return false;
      
      // Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // Get user's age
      const userAge = getAge(user);
      if (userAge === null) {
        console.log('🔍 [DEBUG] User has no age:', user.name || 'unknown');
        return false; // Exclude users without age
      }
      
      // Check if age is within range
      const isInRange = userAge >= minAge && userAge <= maxAge;
      
      if (!isInRange) {
        console.log('🔍 [DEBUG] User age out of range:', {
          name: user.name || 'unknown',
          age: userAge,
          range: ageRange
        });
      }
      
      return isInRange;
    });
    
    console.log('🔍 [DEBUG] Age filter results:', {
      originalCount: users.length,
      filteredCount: ageFilteredUsers.length,
      ageRange: ageRange,
      usersWithAges: ageFilteredUsers.map(u => ({
        name: u.name || 'unknown',
        age: getAge(u)
      }))
    });
    
    // Update users with filtered list
    debouncedSetUsers(ageFilteredUsers);
    
    // Clear card history since we're applying new filters
    setCardHistory([]);
    setShowEndCard(false);
  }, [users, profile, debouncedSetUsers]);

  // Function to apply relationship type filtering
  const applyRelationshipTypeFilter = useCallback((usersToFilter, relationshipType) => {
    if (!usersToFilter || usersToFilter.length === 0) {
('🔍 [DEBUG] No users to apply relationship type filter to');
      return [];
    }
    
    if (!relationshipType || relationshipType.length === 0 || (Array.isArray(relationshipType) && relationshipType.length === 0)) {
('🔍 [DEBUG] No relationship type filter applied, showing all users');
      return usersToFilter;
    }
    
    // Convert to array if it's a string (comma-separated)
    const relationshipTypes = Array.isArray(relationshipType) ? relationshipType : (relationshipType ? relationshipType.split(', ') : []);
    
('🔍 [DEBUG] Applying relationship type filter:', {
      relationshipTypes: relationshipTypes,
      usersCount: usersToFilter.length
    });
    
    // Filter users by relationship type (goal field) - show users who match ANY of the selected types
    const relationshipFilteredUsers = usersToFilter.filter(user => {
      if (!user || !user._id) return false;
      
      // Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // Check if user's goal matches any of the selected relationship types
      const userGoal = user.goal;
      const matches = relationshipTypes.some(selectedType => userGoal === selectedType);
      
      // Only log for the first few users to avoid spam
      if (usersToFilter.indexOf(user) < 3) {
('🔍 [DEBUG] User relationship type:', {
          name: user.name || 'unknown',
          goal: userGoal,
          selectedTypes: relationshipTypes,
          matches: matches
        });
      }
      
      return matches;
    });
    
('🔍 [DEBUG] Relationship type filter results:', {
      originalCount: usersToFilter.length,
      filteredCount: relationshipFilteredUsers.length,
      relationshipTypes: relationshipTypes,
      usersWithRelationshipType: relationshipFilteredUsers.map(u => ({
        name: u.name || 'unknown',
        goal: u.goal
      }))
    });
    
    return relationshipFilteredUsers;
  }, [profile]);

  // Function to apply lifestyle choices filtering
  const applyLifestyleFilter = useCallback((usersToFilter, lifestyleChoices) => {
    if (!usersToFilter || usersToFilter.length === 0) {
('🔍 [DEBUG] No users to apply lifestyle filter to');
      return [];
    }
    
    if (!lifestyleChoices || lifestyleChoices.length === 0) {
('🔍 [DEBUG] No lifestyle choices selected, showing all users');
      return usersToFilter;
    }
    
('🔍 [DEBUG] Applying lifestyle filter:', {
      lifestyleChoices: lifestyleChoices,
      usersCount: usersToFilter.length
    });
    
    // Filter users by lifestyle choices (show users who have ANY of the selected choices)
    const lifestyleFilteredUsers = usersToFilter.filter(user => {
      if (!user || !user._id) return false;
      
      // Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // Get user's lifestyle choices
      const userLifestyle = user.lifestyle || [];
      
      // Check if user has any of the selected lifestyle choices
      const hasMatchingLifestyle = lifestyleChoices.some(selectedChoice => 
        userLifestyle.includes(selectedChoice)
      );
      
      // Only log for the first few users to avoid spam
      if (usersToFilter.indexOf(user) < 3) {
('🔍 [DEBUG] User lifestyle choices:', {
          name: user.name || 'unknown',
          userLifestyle: userLifestyle,
          selectedChoices: lifestyleChoices,
          hasMatch: hasMatchingLifestyle
        });
      }
      
      return hasMatchingLifestyle;
    });
    
('🔍 [DEBUG] Lifestyle filter results:', {
      originalCount: usersToFilter.length,
      filteredCount: lifestyleFilteredUsers.length,
      lifestyleChoices: lifestyleChoices,
      usersWithLifestyle: lifestyleFilteredUsers.map(u => ({
        name: u.name || 'unknown',
        lifestyle: u.lifestyle || []
      }))
    });
    
    return lifestyleFilteredUsers;
  }, [profile]);

  // Function to apply zodiac sign filtering
  const applyZodiacFilter = useCallback((usersToFilter, zodiacSign) => {
    if (!usersToFilter || usersToFilter.length === 0) {
('🔍 [DEBUG] No users to apply zodiac filter to');
      return [];
    }
    
    if (!zodiacSign || zodiacSign.length === 0 || (Array.isArray(zodiacSign) && zodiacSign.length === 0)) {
('🔍 [DEBUG] No zodiac filter applied, showing all users');
      return usersToFilter;
    }
    
    // Convert to array if it's a string (comma-separated)
    const zodiacSigns = Array.isArray(zodiacSign) ? zodiacSign : (zodiacSign ? zodiacSign.split(', ') : []);
    
('🔍 [DEBUG] Applying zodiac filter:', {
      zodiacSigns: zodiacSigns,
      usersCount: usersToFilter.length
    });
    
    // Filter users by zodiac sign - show users who match ANY of the selected signs
    const zodiacFilteredUsers = usersToFilter.filter(user => {
      if (!user || !user._id) return false;
      
      // Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // Check if user's zodiac matches any of the selected signs
      const userZodiac = user.zodiac;
      const matches = zodiacSigns.some(selectedSign => userZodiac === selectedSign);
      
      // Only log for the first few users to avoid spam
      if (usersToFilter.indexOf(user) < 3) {
('🔍 [DEBUG] User zodiac sign:', {
          name: user.name || 'unknown',
          zodiac: userZodiac,
          selectedSigns: zodiacSigns,
          matches: matches
        });
      }
      
      return matches;
    });
    
('🔍 [DEBUG] Zodiac filter results:', {
      originalCount: usersToFilter.length,
      filteredCount: zodiacFilteredUsers.length,
      zodiacSigns: zodiacSigns,
      usersWithZodiac: zodiacFilteredUsers.map(u => ({
        name: u.name || 'unknown',
        zodiac: u.zodiac
      }))
    });
    
    return zodiacFilteredUsers;
  }, [profile]);

  // Function to apply personality filtering
  const applyPersonalityFilter = useCallback((usersToFilter, personality) => {
    if (!usersToFilter || usersToFilter.length === 0) {
('🔍 [DEBUG] No users to apply personality filter to');
      return [];
    }
    
    if (!personality || personality.length === 0 || (Array.isArray(personality) && personality.length === 0)) {
('🔍 [DEBUG] No personality filter applied, showing all users');
      return usersToFilter;
    }
    
    // Convert to array if it's a string (comma-separated)
    const personalityTraits = Array.isArray(personality) ? personality : (personality ? personality.split(', ') : []);
    
('🔍 [DEBUG] Applying personality filter:', {
      personalityTraits: personalityTraits,
      usersCount: usersToFilter.length
    });
    
    // Filter users by personality - show users who match ANY of the selected traits
    const personalityFilteredUsers = usersToFilter.filter(user => {
      if (!user || !user._id) return false;
      
      // Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // Check if user's personality matches any of the selected traits
      const userPersonality = user.personality;
      const matches = personalityTraits.some(selectedTrait => userPersonality === selectedTrait);
      
      // Only log for the first few users to avoid spam
      if (usersToFilter.indexOf(user) < 3) {
('🔍 [DEBUG] User personality:', {
          name: user.name || 'unknown',
          personality: userPersonality,
          selectedTraits: personalityTraits,
          matches: matches
        });
      }
      
      return matches;
    });
    
('🔍 [DEBUG] Personality filter results:', {
      originalCount: usersToFilter.length,
      filteredCount: personalityFilteredUsers.length,
      personalityTraits: personalityTraits,
      usersWithPersonality: personalityFilteredUsers.map(u => ({
        name: u.name || 'unknown',
        personality: u.personality
      }))
    });
    
    return personalityFilteredUsers;
  }, [profile]);

  // Function to apply education level filtering
  const applyEducationFilter = useCallback((usersToFilter, educationLevel) => {
    if (!usersToFilter || usersToFilter.length === 0) {
('🔍 [DEBUG] No users to apply education filter to');
      return [];
    }
    
    if (!educationLevel || educationLevel === 'All') {
('🔍 [DEBUG] No education filter applied, showing all users');
      return usersToFilter;
    }
    
('🔍 [DEBUG] Applying education filter:', {
      educationLevel: educationLevel,
      usersCount: usersToFilter.length
    });
    
    // Filter users by education level
    const educationFilteredUsers = usersToFilter.filter(user => {
      if (!user || !user._id) return false;
      
      // Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // Check if user's education matches the selected level
      const userEducation = user.education;
      const matches = userEducation === educationLevel;
      
      // Only log for the first few users to avoid spam
      if (usersToFilter.indexOf(user) < 3) {
('🔍 [DEBUG] User education:', {
          name: user.name || 'unknown',
          education: userEducation,
          selectedLevel: educationLevel,
          matches: matches
        });
      }
      
      return matches;
    });
    
('🔍 [DEBUG] Education filter results:', {
      originalCount: usersToFilter.length,
      filteredCount: educationFilteredUsers.length,
      educationLevel: educationLevel,
      usersWithEducation: educationFilteredUsers.map(u => ({
        name: u.name || 'unknown',
        education: u.education
      }))
    });
    
    return educationFilteredUsers;
  }, [profile]);

  // Function to apply family plan filtering
  const applyFamilyPlanFilter = useCallback((usersToFilter, familyPlan) => {
    if (!usersToFilter || usersToFilter.length === 0) {
('🔍 [DEBUG] No users to apply family plan filter to');
      return [];
    }
    
    if (!familyPlan || familyPlan === 'All') {
('🔍 [DEBUG] No family plan filter applied, showing all users');
      return usersToFilter;
    }
    
('🔍 [DEBUG] Applying family plan filter:', {
      familyPlan: familyPlan,
      usersCount: usersToFilter.length
    });
    
    // Filter users by family plan preference
    const familyPlanFilteredUsers = usersToFilter.filter(user => {
      if (!user || !user._id) return false;
      
      // Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // Check if user's kids preference matches the selected family plan
      const userKids = user.kids;
      const matches = userKids === familyPlan;
      
      // Only log for the first few users to avoid spam
      if (usersToFilter.indexOf(user) < 3) {
('🔍 [DEBUG] User family plan:', {
          name: user.name || 'unknown',
          kids: userKids,
          selectedPlan: familyPlan,
          matches: matches
        });
      }
      
      return matches;
    });
    
('🔍 [DEBUG] Family plan filter results:', {
      originalCount: usersToFilter.length,
      filteredCount: familyPlanFilteredUsers.length,
      familyPlan: familyPlan,
      usersWithFamilyPlan: familyPlanFilteredUsers.map(u => ({
        name: u.name || 'unknown',
        kids: u.kids
      }))
    });
    
    return familyPlanFilteredUsers;
  }, [profile]);

  // Function to apply religion filtering
  const applyReligionFilter = useCallback((usersToFilter, religion) => {
    if (!usersToFilter || usersToFilter.length === 0) {
('🔍 [DEBUG] No users to apply religion filter to');
      return [];
    }
    
    if (!religion || religion === 'All') {
('🔍 [DEBUG] No religion filter applied, showing all users');
      return usersToFilter;
    }
    
('🔍 [DEBUG] Applying religion filter:', {
      religion: religion,
      usersCount: usersToFilter.length
    });
    
    // Filter users by religion
    const religionFilteredUsers = usersToFilter.filter(user => {
      if (!user || !user._id) return false;
      
      // Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // Check if user's religion matches the selected religion
      const userReligion = user.religon; // Note: typo in the field name
      const matches = userReligion === religion;
      
      // Only log for the first few users to avoid spam
      if (usersToFilter.indexOf(user) < 3) {
('🔍 [DEBUG] User religion:', {
          name: user.name || 'unknown',
          religion: userReligion,
          selectedReligion: religion,
          matches: matches
        });
      }
      
      return matches;
    });
    
('🔍 [DEBUG] Religion filter results:', {
      originalCount: usersToFilter.length,
      filteredCount: religionFilteredUsers.length,
      religion: religion,
      usersWithReligion: religionFilteredUsers.map(u => ({
        name: u.name || 'unknown',
        religion: u.religon
      }))
    });
    
    return religionFilteredUsers;
  }, [profile]);

  // Function to apply verification status filtering
  const applyVerificationFilter = useCallback((usersToFilter, verifiedOnly) => {
    if (!usersToFilter || usersToFilter.length === 0) {
('🔍 [DEBUG] No users to apply verification filter to');
      return [];
    }
    
    if (!verifiedOnly) {
('🔍 [DEBUG] No verification filter applied, showing all users');
      return usersToFilter;
    }
    
('🔍 [DEBUG] Applying verification filter:', {
      verifiedOnly: verifiedOnly,
      usersCount: usersToFilter.length
    });
    
    // Filter users by verification status
    const verificationFilteredUsers = usersToFilter.filter(user => {
      if (!user || !user._id) return false;
      
      // Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // Check if user is verified
      const isVerified = user.verificationStatus === 'verified';
      
      // Only log for the first few users to avoid spam
      if (usersToFilter.indexOf(user) < 3) {
('🔍 [DEBUG] User verification status:', {
          name: user.name || 'unknown',
          verificationStatus: user.verificationStatus,
          isVerified: isVerified
        });
      }
      
      return isVerified;
    });
    
('🔍 [DEBUG] Verification filter results:', {
      originalCount: usersToFilter.length,
      filteredCount: verificationFilteredUsers.length,
      verifiedOnly: verifiedOnly,
      usersWithVerification: verificationFilteredUsers.map(u => ({
        name: u.name || 'unknown',
        verificationStatus: u.verificationStatus
      }))
    });
    
    return verificationFilteredUsers;
  }, [profile]);

  // Function to apply language filtering
  const applyLanguageFilter = useCallback((usersToFilter, selectedLanguages) => {
    if (!usersToFilter || usersToFilter.length === 0) {
('🔍 [DEBUG] No users to apply language filter to');
      return [];
    }
    
    // If only English is selected, don't apply any language filter - show all users
    if (selectedLanguages && selectedLanguages.length === 1 && selectedLanguages[0] === 'English') {
('🔍 [DEBUG] Only English selected - NO language filter applied, showing all users');
      return usersToFilter;
    }
    
    if (!selectedLanguages || selectedLanguages.length === 0) {
('🔍 [DEBUG] No languages selected, showing all users');
      return usersToFilter;
    }
    
('🔍 [DEBUG] Applying language filter:', {
      selectedLanguages: selectedLanguages,
      usersCount: usersToFilter.length
    });
    
    // Filter users by language
    const languageFilteredUsers = usersToFilter.filter(user => {
      if (!user || !user._id) return false;
      
      // Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // Get user's languages
      const userLanguages = user.languages || [];
      
      // Only log for the first few users to avoid spam
      if (usersToFilter.indexOf(user) < 3) {
('🔍 [DEBUG] User languages:', {
          name: user.name || 'unknown',
          userLanguages: userLanguages,
          selectedLanguages: selectedLanguages
        });
      }
      
      // Check if user has any of the selected languages
      const hasMatchingLanguage = selectedLanguages.some(selectedLang => 
        userLanguages.includes(selectedLang)
      );
      
      if (!hasMatchingLanguage && usersToFilter.indexOf(user) < 3) {
('🔍 [DEBUG] User language mismatch:', {
          name: user.name || 'unknown',
          userLanguages: userLanguages,
          selectedLanguages: selectedLanguages
        });
      }
      
      return hasMatchingLanguage;
    });
    
('🔍 [DEBUG] Language filter results:', {
      selectedLanguages: selectedLanguages,
      filteredCount: languageFilteredUsers.length,
      originalCount: usersToFilter.length,
      usersWithLanguages: languageFilteredUsers.map(u => ({
        name: u.name || 'unknown',
        languages: JSON.stringify(u.languages || [])
      }))
    });
    

    
    return languageFilteredUsers;
  }, [profile]);

  // Function to filter users based on connections and other criteria - ENABLED FOR AGE, LANGUAGE, VERIFICATION, RELATIONSHIP, LIFESTYLE, ZODIAC, AND PERSONALITY FILTERING
  const filterAndSetUsers = useCallback(async (usersToFilter, includeDisliked = false, preserveHistory = false) => {
    if (!usersToFilter || usersToFilter.length === 0) {
      setUsers([]);
      setSwiperCards([]);
      return;
    }

('🔍 [DEBUG] filterAndSetUsers called with:', {
      usersCount: usersToFilter.length,
      includeDisliked,
      preserveHistory
    });

    // First, apply basic filtering (exclude current user and incognito users)
    const basicFilteredUsers = usersToFilter.filter(user => {
      if (!user || !user._id) return false;
      
      // IMPORTANT: Exclude current user's profile
      if (profile && user._id === profile._id) {
        return false;
      }
      
      // IMPORTANT: Exclude incognito users
      if (user.incognito === true) {
        return false;
      }
      
      return true;
    });

('📊 [DEBUG] Basic filter results:', {
      totalUsers: basicFilteredUsers.length,
      firstUser: basicFilteredUsers[0]?.name || 'none'
    });
    


    // Then, check for age filter settings and apply if available
    try {
      const filterSettingsString = await AsyncStorage.getItem('filterSettings');
      if (filterSettingsString) {
        const filterSettings = JSON.parse(filterSettingsString);
        const savedAgeRange = filterSettings.ageRange;
        
('🔍 [DEBUG] Loaded filter settings:', filterSettings);
        
        if (savedAgeRange && Array.isArray(savedAgeRange) && savedAgeRange.length === 2) {
('🔍 [DEBUG] Applying age filter from settings:', savedAgeRange);
          
          // SKIP AGE FILTERING COMPLETELY - SHOW ALL USERS
          const ageFilteredUsers = basicFilteredUsers;
('🔍 [DEBUG] Age filtering COMPLETELY SKIPPED - showing all users');
          
          // Log filtered out users with reasons
          const filteredOutUsers = basicFilteredUsers.filter(user => {
            const age = getAge(user);
            return !age || age < savedAgeRange[0] || age > savedAgeRange[1];
          });
          
('🔍 [DEBUG] Age filter results:', {
            originalCount: basicFilteredUsers.length,
            filteredCount: ageFilteredUsers.length,
            ageRange: savedAgeRange,
            usersWithAges: ageFilteredUsers.map(u => ({
              name: u.name || 'unknown',
              age: getAge(u)
            })),
            filteredOutUsers: filteredOutUsers.map(u => ({
              name: u.name || 'unknown',
              age: getAge(u),
              reason: !getAge(u) ? 'No age data' : `Age ${getAge(u)} outside range ${savedAgeRange[0]}-${savedAgeRange[1]}`
            }))
          });
          

          
          // Apply verification filtering after age filtering
          const verificationFilteredUsers = applyVerificationFilter(ageFilteredUsers, filterSettings.isVerified);
          
          // Apply relationship type filtering after verification filtering
          const relationshipFilteredUsers = applyRelationshipTypeFilter(verificationFilteredUsers, filterSettings.relationshipType);
          
          // Apply lifestyle filtering after relationship type filtering
          const lifestyleFilteredUsers = applyLifestyleFilter(relationshipFilteredUsers, filterSettings.lifestyleChoices);
          
          // Apply zodiac filtering after lifestyle filtering
          const zodiacFilteredUsers = applyZodiacFilter(lifestyleFilteredUsers, filterSettings.zodiacSign);
          
          // Apply personality filtering after zodiac filtering
          const personalityFilteredUsers = applyPersonalityFilter(zodiacFilteredUsers, filterSettings.personality);
          
          // Apply education filtering after personality filtering
          const educationFilteredUsers = applyEducationFilter(personalityFilteredUsers, filterSettings.educationLevel);
          
          // Apply family plan filtering after education filtering
          const familyPlanFilteredUsers = applyFamilyPlanFilter(educationFilteredUsers, filterSettings.familyPlan);
          
          // Apply religion filtering after family plan filtering
          const religionFilteredUsers = applyReligionFilter(familyPlanFilteredUsers, filterSettings.religion);
          
          // Apply language filtering after religion filtering
          const finalFilteredUsers = applyLanguageFilter(religionFilteredUsers, filterSettings.languages);
          
          // Update both users and swiper cards with filtered results
          debouncedSetUsers(finalFilteredUsers);
          const filteredSwiperCards = finalFilteredUsers.filter(user => user && (user._id || user.id));
          debouncedSetSwiperCards(filteredSwiperCards);
          
          // Log final results with all filtering details
('🔍 [DEBUG] FINAL FILTERING RESULTS:', {
            originalUsers: basicFilteredUsers.length,
            afterAgeFilter: ageFilteredUsers.length,
            afterVerificationFilter: verificationFilteredUsers.length,
            afterRelationshipFilter: relationshipFilteredUsers.length,
            afterLifestyleFilter: lifestyleFilteredUsers.length,
            afterZodiacFilter: zodiacFilteredUsers.length,
            afterPersonalityFilter: personalityFilteredUsers.length,
            afterEducationFilter: educationFilteredUsers.length,
            afterFamilyPlanFilter: familyPlanFilteredUsers.length,
            afterReligionFilter: religionFilteredUsers.length,
            finalUsers: finalFilteredUsers.length,
            swiperCardsCount: filteredSwiperCards.length
          });
          
          // Log all users with their details
('🔍 [DEBUG] ALL USERS WITH DETAILS:', basicFilteredUsers.map(u => ({
            name: u.name || 'unknown',
            age: getAge(u),
            verificationStatus: u.verificationStatus,
            languages: u.languages,
            relationshipType: u.goal,
            lifestyle: u.lifestyle,
            zodiac: u.zodiac,
            personality: u.personality,
            education: u.education,
            familyPlan: u.kids,
            religion: u.religon
          })));
          
('🔍 [DEBUG] FINAL FILTERED USERS:', finalFilteredUsers.map(u => ({
            name: u.name || 'unknown',
            age: getAge(u),
            verificationStatus: u.verificationStatus,
            languages: u.languages
          })));
          

          
          // Track the applied age range
          lastAppliedAgeRangeRef.current = savedAgeRange;
        } else {
('🔍 [DEBUG] No age filter found, applying all other filters');
          const verificationFilteredUsers = applyVerificationFilter(basicFilteredUsers, filterSettings.isVerified);
          const relationshipFilteredUsers = applyRelationshipTypeFilter(verificationFilteredUsers, filterSettings.relationshipType);
          const lifestyleFilteredUsers = applyLifestyleFilter(relationshipFilteredUsers, filterSettings.lifestyleChoices);
          const zodiacFilteredUsers = applyZodiacFilter(lifestyleFilteredUsers, filterSettings.zodiacSign);
          const personalityFilteredUsers = applyPersonalityFilter(zodiacFilteredUsers, filterSettings.personality);
          const educationFilteredUsers = applyEducationFilter(personalityFilteredUsers, filterSettings.educationLevel);
          const familyPlanFilteredUsers = applyFamilyPlanFilter(educationFilteredUsers, filterSettings.familyPlan);
          const religionFilteredUsers = applyReligionFilter(familyPlanFilteredUsers, filterSettings.religion);
          const languageFilteredUsers = applyLanguageFilter(religionFilteredUsers, filterSettings.languages);
          debouncedSetUsers(languageFilteredUsers);
          const basicSwiperCards = languageFilteredUsers.filter(user => user && (user._id || user.id));
          debouncedSetSwiperCards(basicSwiperCards);
          
          // Reset age range tracking since no filter is applied
          lastAppliedAgeRangeRef.current = null;
        }
      } else {
('🔍 [DEBUG] No filter settings found, using basic filtered users');
        debouncedSetUsers(basicFilteredUsers);
        const basicSwiperCards = basicFilteredUsers.filter(user => user && (user._id || user.id));
        debouncedSetSwiperCards(basicSwiperCards);
        
        // Reset age range tracking since no filter is applied
        lastAppliedAgeRangeRef.current = null;
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error applying filters:', error);
      debouncedSetUsers(basicFilteredUsers);
      const basicSwiperCards = basicFilteredUsers.filter(user => user && (user._id || user.id));
      debouncedSetSwiperCards(basicSwiperCards);
    }

    // Only clear card history if explicitly requested
    if (!preserveHistory) {
      setCardHistory([]); // Clear card history when users change
      setShowEndCard(false); // Reset end card state when users change
    }
  }, [profile, debouncedSetUsers, debouncedSetSwiperCards, applyLanguageFilter, applyVerificationFilter, applyRelationshipTypeFilter, applyLifestyleFilter, applyZodiacFilter, applyPersonalityFilter, applyEducationFilter, applyFamilyPlanFilter, applyReligionFilter]);

  // Load and apply filters when component mounts
  useEffect(() => {
    if (initialized && profile?._id) {
      console.log('🔍 [DEBUG] Component mounted - loading and applying filters');
      // Add a small delay to ensure everything is ready
      const timeoutId = setTimeout(() => {
        loadFilterSettingsAndApplyFilters();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [initialized, profile?._id, loadFilterSettingsAndApplyFilters]);

  // Refresh balance and users when screen comes into focus - ENABLED FOR ALL FILTERS
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔍 [DEBUG] useFocusEffect triggered - checking for filter updates');
      // Add a small delay to prevent multiple rapid calls
      const timeoutId = setTimeout(() => {
        loadFilterSettingsAndApplyFilters();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }, [loadFilterSettingsAndApplyFilters])
  );

  // Listen for navigation events to refresh when returning from filter screen - DISABLED
  useEffect(() => {
    // No longer listening for navigation events since filters are disabled
    console.log('📋 [DEBUG] Navigation listener disabled - showing all users');
  }, [navigation]);
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      // If states are stuck for more than 5 seconds, reset them
      if (isAnimating || isProcessingSwipe || isRewinding) {
        setIsAnimating(false);
        setIsProcessingSwipe(false);
        setIsRewinding(false);
        setSwipeX(0);
        // Reset cooldown
        filterCooldownUntilRef.current = 0;
      }
    }, 5000);

    return () => clearTimeout(safetyTimer);
  }, [isAnimating, isProcessingSwipe, isRewinding]);

  // Effect to ensure likes/dislikes are properly synchronized
  useEffect(() => {
    if (profile && profile.likes && profile.dislikes) {
      // Only log significant changes to reduce noise
      const prevLikes = profile.likes?.length || 0;
      const prevDislikes = profile.dislikes?.length || 0;
      
      // Use a ref to track previous values and only log when they actually change
      if (!profileUpdateRef.current) {
        profileUpdateRef.current = { likes: prevLikes, dislikes: prevDislikes };
        console.log('🔄 [DEBUG PROFILE] Initial profile state:', {
          likes: prevLikes,
          dislikes: prevDislikes,
          userId: profile._id,
          timestamp: new Date().toISOString()
        });
      } else if (profileUpdateRef.current.likes !== prevLikes || profileUpdateRef.current.dislikes !== prevDislikes) {
        console.log('🔄 [DEBUG PROFILE] User profile updated:', {
          fromLikes: profileUpdateRef.current.likes,
          toLikes: prevLikes,
          fromDislikes: profileUpdateRef.current.dislikes,
          toDislikes: prevDislikes,
          userId: profile._id,
          timestamp: new Date().toISOString()
        });
        profileUpdateRef.current = { likes: prevLikes, dislikes: prevDislikes };
      }
      
      // Profile is automatically updated in context, so other components will receive the update
      // No need for EventEmitter - the AuthContext will handle propagation
    }
  }, [profile?.likes, profile?.dislikes]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Reset all states when component unmounts
      setIsAnimating(false);
      setIsProcessingSwipe(false);
      setIsRewinding(false);
      setIsApplyingFilteredUsers(false);
      setSwipeX(0);
      filterCooldownUntilRef.current = 0;
      
      // Clear match popup timeout
      if (matchPopupTimeoutRef.current) {
        clearTimeout(matchPopupTimeoutRef.current);
      }
      
      // Process any remaining swipes in queue
      if (swipeQueueRef.current.length > 0) {
        processSwipeQueue();
      }
    };
  }, [processSwipeQueue]);



  // Helper functions
  const formatBalance = (amount) => {
    return amount?.toLocaleString?.() ?? '0';
  };

  // Check if there are any active filters
  const hasActiveFilters = () => {
    if (!filtersActive || !activeFilters) return false;
    
    return Object.values(activeFilters).some(value => 
      value !== null && value !== false && 
      (Array.isArray(value) ? value.length > 0 : true)
    );
  };

  const getAge = (user) => {
    if (user.age) return user.age;
    if (user.dateOfBirth) {
      const birthDate = new Date(user.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return null;
  };

  // Render card component for deck swiper - memoized to prevent unnecessary re-renders
  const renderCard = useCallback((user, index) => {
    if (!user) {
      return null;
    }
    
    if (!user._id && !user.id) {
      return null;
    }

    const profileImageSource = getProfileImageSource(user);
    if (!profileImageSource) {
      return null;
    }
    
    const isTopCard = index === 0; // Always show overlay for the top card (index 0)
    // Show overlay immediately when swiping starts (reduced threshold from 20px to 10px for better responsiveness)
    const rightOpacity = isTopCard && swipeX > 10 ? Math.min(1, (swipeX - 10) / 80) : 0;
    const leftOpacity = isTopCard && swipeX < -10 ? Math.min(1, (-swipeX - 10) / 80) : 0;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardInner}>
          <Image 
            source={profileImageSource} 
            style={[styles.cardImage, styles.cardImageScaled]}
            resizeMode="cover"
            onError={(error) => {
              // Image load error for user
            }}
          />
          
          {/* Main Gradient */}
          <LinearGradient
            colors={["transparent", "transparent", "rgba(0, 0, 0, 0.5)", "rgb(0, 0, 0)"]}
            style={styles.overlayGradient}
            locations={[0, 0.6, 0.8, 1]}
          />

          {/* Early right-swipe overlay based on swipeX */}
          {rightOpacity > 0 && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 3, opacity: rightOpacity }]}>
              <LinearGradient
                colors={["rgba(110,197,49,0)", "rgba(110,197,49,0.7)"]}
                locations={[0.1755, 0.7904]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["rgba(18,18,18,0)", "#121212"]}
                locations={[0.676, 0.9813]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          {/* Early left-swipe overlay based on swipeX */}
          {leftOpacity > 0 && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 3, opacity: leftOpacity }]}>
              <LinearGradient
                colors={["rgba(220,53,69,0)", "rgba(220,53,69,0.7)"]}
                locations={[0.1755, 0.7904]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["rgba(18,18,18,0)", "#121212"]}
                locations={[0.676, 0.9813]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}
          
          {/* Online Status Indicator */}
          {onlineUsers.has(user._id || user.id) && (
            <View style={styles.onlineStatusContainer}>
              <View style={styles.onlineIndicator} />
              <Text style={styles.onlineStatusText}>Active</Text>
            </View>
          )}

          {/* User Info */}
          <View style={styles.userInfoSwipe}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              {getAge(user) !== null && <Text style={styles.age}>, {getAge(user)}</Text>}
              {(user?.verificationStatus === 'verified') && (
                <View style={styles.verifiedBadgeSwipe}>
                  <MaterialIcons name="verified" size={32} color="#ec066a" />
                </View>
              )}
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#fff" />
              <Text style={styles.location}>{user.location || ''}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.cardTouchable, { zIndex: 5 }]}
            activeOpacity={1}
            onPress={() => {
              const swipedUserId = user._id || user.id;
              navigation.navigate('MatchDetail', { userId: swipedUserId });
            }}
          />
        </View>
      </View>
    );
  }, [swipeX, getProfileImageSource, navigation]);

  // Render end card when no more profiles
  const renderEndCard = () => {
    return (
      <View style={styles.endCard}>
        <Ionicons name="refresh-circle" size={64} color="#666" />
        <Text style={styles.endText}>No more profiles!</Text>
        <Text style={styles.endSubText}>
          {loading ? startOverProgress || 'Refreshing your matches...' : 'Start over to see profiles again.'}
        </Text>
        <TouchableOpacity 
          style={[styles.resetButton, loading && styles.resetButtonDisabled]}
          onPress={handleStartOver}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.resetText, styles.loadingText]}>
                {startOverProgress || 'Refreshing...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.resetText}>
              Start Over
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Show loading animation until context is initialized and data is loaded
  if (!initialized || loading || !dataReady || !profile) {
    return (
      <ScreenWrapper backgroundColor="#000" statusBarColor="#000" barStyle="light-content" paddingTop={24}>
        <View style={styles.centerContainer}>
          <ActivityIndicator 
            size="large" 
            color="#ec066a" 
            style={styles.loadingSpinner}
          />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper backgroundColor="#000" statusBarColor="#000" barStyle="light-content" paddingTop={24}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper 
      backgroundColor="#000" 
      statusBarColor="#000"
      barStyle="light-content"
      paddingTop={24}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <View style={styles.headerRight}>
          <View style={styles.coinContainer}>
            <Text style={styles.coinText}>₦{formatBalance(balance)}</Text>
          </View>
          
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('BasicFilters')}
            style={styles.filterButton}
          >
            <Image 
              source={require('../../assets/icons/filter.png')}
              style={styles.filterIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards */}
      <View style={styles.cardsArea}>
        {(() => {
          const hasCards = stableSwiperCards.length > 0 && stableSwiperCards.every(user => user && (user._id || user.id));
          const shouldShowSwiper = hasCards && !showEndCard;
          
          return shouldShowSwiper;
        })() ? (
          <Swiper
            key={`swiper-${stableSwiperCards.length}-${rewindCounter}-${stableSwiperCards[0]?._id || 'none'}`}
            ref={swiperRef}
            cards={stableSwiperCards}
            renderCard={renderCard}
            onSwipedLeft={(cardIndex) => {
              const list = stableSwiperCards;
              const swipedUser = list[cardIndex];
              
              if (!list || cardIndex < 0 || cardIndex >= list.length) {
                return;
              }
              // Enhanced protection against rapid swipes
              if (swipedUser && !isProcessingSwipe && !isAnimating) {
                // Don't manually update currentIndex - let Swiper handle it
                handleSwipe('left', swipedUser);
              }
              // Immediately reset swipe visual to clear overlay
              setSwipeX(0);
            }}
            onSwipedRight={(cardIndex) => {
              const list = stableSwiperCards;
              const swipedUser = list[cardIndex];
              
              if (!list || cardIndex < 0 || cardIndex >= list.length) {
                return;
              }
              // Enhanced protection against rapid swipes
              if (swipedUser && !isProcessingSwipe && !isAnimating) {
                // Don't manually update currentIndex - let Swiper handle it
                handleSwipe('right', swipedUser);
              }
              // Immediately reset swipe visual to clear overlay
              setSwipeX(0);
            }}
            onSwipedAborted={() => {
              setIsAnimating(false);
              setIsProcessingSwipe(false);
              // Immediately reset swipeX to clear overlay
              setSwipeX(0);
            }}
            onSwipedAll={() => {
              setShowEndCard(true);
              // Reset swipeX when all cards are swiped
              setSwipeX(0);
            }}
            onSwiped={(cardIndex, direction) => {
              // Reset swipeX immediately to clear overlay
              setSwipeX(0);
            }}
            onSwiping={(x, y) => {
              // Update swipeX immediately for responsive overlay
              setSwipeX(x);
            }}
            onSwipingAborted={() => {
              // Immediately clear overlay when swiping is interrupted
              setSwipeX(0);
            }}
            backgroundColor={'transparent'}
            stackSize={2}
            stackScale={10}
            stackSeparation={14}
            animateCardOpacity={true}
            swipeAnimationDuration={300}
            disableBottomSwipe={true}
            disableTopSwipe={true}
            animateOverlayLabelsOpacity
            useViewOverflow={false}
            disableSwipeUp={true}
            disableSwipeDown={true}
            overlayLabels={{
              left: {
                element: (
                  <View style={styles.overlay}> 
                    <LinearGradient
                      colors={["rgba(220,53,69,0)", "rgba(220,53,69,0.7)"]}
                      locations={[0.1755, 0.7904]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                      colors={["rgba(18,18,18,0)", "#121212"]}
                      locations={[0.676, 0.9813]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                ),
                style: { wrapper: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } }
              },
              right: {
                element: (
                  <View style={styles.overlay}> 
                    {/* Green diagonal gradient (approx 343.57deg) */}
                    <LinearGradient
                      colors={["rgba(110,197,49,0)", "rgba(110,197,49,0.7)"]}
                      locations={[0.1755, 0.7904]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    {/* Dark bottom fade (approx 180deg) */}
                    <LinearGradient
                      colors={["rgba(18,18,18,0)", "#121212"]}
                      locations={[0.676, 0.9813]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                ),
                style: { wrapper: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } }
              }
            }}
            cardStyle={styles.swiperCard}
            containerStyle={styles.swiperContainer}
          />
        ) : (
          renderEndCard()
        )}
      </View>

      {/* Action Buttons */}
              {(() => {
                const shouldShowActions = initialized && stableSwiperCards.length > 0;
                return shouldShowActions;
              })() && (
        <View style={[
          styles.actions,
          { gap: cardHistory.length > 0 ? 16 : 24 } // Wider gap when only two buttons
        ]}>
          {/* Dislike Button */}
          <View style={[styles.button, styles.dislikeButton, { backgroundColor: swipeX < -12 ? '#dc3545' : '#fff' }]}>
            <TouchableOpacity 
              style={{flex: 1, alignItems: 'center', justifyContent: 'center'}} 
              onPress={() => handleButtonSwipe(-1)}
              disabled={isAnimating}
              activeOpacity={0.8}
            >
              <Text style={{ color: swipeX < -12 ? '#fff' : '#ec066a' }}>
                <FontAwesome6 name="xmark" size={46} />
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rewind Button - Show when there are cards in history */}
          {cardHistory.length > 0 && (
            <View 
              style={[
                styles.button, 
                styles.rewindButton,
                { 
                  opacity: (!isProcessingSwipe && !isRewinding) ? 1 : 0.3,
                  transform: [{ scale: isAnimating ? 0.9 : 1 }],
                  pointerEvents: (!isProcessingSwipe && !isRewinding) ? 'auto' : 'none'
                }
              ]}
            >
              <TouchableOpacity
                style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}
                onPress={handleRewind}
                activeOpacity={0.8}
                disabled={isProcessingSwipe || isRewinding}
              >
                <FontAwesome6 name="rotate-left" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          
          

          {/* Like Button */}
          <View style={[styles.button, styles.likeButton, { backgroundColor: swipeX > 12 ? '#6ec531' : '#ec066a' }]}>
            <TouchableOpacity 
              style={{flex: 1, alignItems: 'center', justifyContent: 'center'}} 
              onPress={() => handleButtonSwipe(1)}
              disabled={isAnimating}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={40} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Match Found Popup */}
      <MatchFoundPopup
        visible={matchPopupVisible}
        onClose={handleMatchPopupClose}
        matchData={matchData}
        onNavigateToConnectionSent={handleNavigateToConnectionSent}
        onNavigateToPremium={handleNavigateToPremium}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: {
    width: 113,
    height: 24,
    resizeMode: 'contain',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  coinContainer: {
    backgroundColor: '#1E1E1E',
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  coinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: FONTS.regular,
  },
  debugContainer: {
    display: 'none',
  },
  debugText: {
    display: 'none',
  },
  debugButton: {
    display: 'none',
  },
  filterButton: {
    position: 'relative',
    padding: 4,
  },
  filterIcon: {
    width: 18,
    height: 16,
  },

  // Cards area
  cardsArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    marginTop: -34,
  },
  swiperContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.74,
  },
  swiperCard: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.74,
  },

  // Card styles
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.74,
    backgroundColor: 'transparent',
  },
  cardInner: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // Online status styles
  onlineStatusContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  onlineIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6ec531',
    marginRight: 8,
  },
  onlineStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardImageScaled: {
    // Removed scale transform to match overlay size exactly
  },

  // Overlay styles
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },

  // User info styles
  userInfoSwipe: {
    position: 'absolute',
    bottom: 126,
    left: 16,
    zIndex: 4,
    flexDirection: 'column',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '600',
  },
  age: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '400',
  },
  verifiedBadgeSwipe: {
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  location: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 4,
  },

  // Action buttons
  actions: {
    position: 'absolute',
    bottom: 94,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  dislikeButton: {
    backgroundColor: '#fff',
  },
  likeButton: {
    backgroundColor: '#ec066a',
  },
  rewindButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    shadowColor: 'transparent',
    elevation: 0,
  },

  // End card styles
  endCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 8,
    marginTop: SCREEN_HEIGHT * 0.05,
    padding: 20,
  },
  endText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  endSubText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#ec066a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 90,
    opacity: 1,
    marginTop: 10,
  },

  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Loading and error states
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  splashLogo: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4 * 0.21, // Maintain aspect ratio
  },
  errorText: {
    color: 'red',
    fontSize: 18,
  },
});

export default Home;