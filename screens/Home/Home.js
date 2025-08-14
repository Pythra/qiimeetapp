import React, { useState, useRef, useCallback, useEffect } from 'react';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Home = ({ navigation, route }) => {
  const { user: profile, token, balance, users: contextUsers, updateUser, initialized, dataReady, refreshBalance, getProfileImageSource } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNextCard, setShowNextCard] = useState(true);
  const swiperRef = useRef(null);
  const [swipedCards, setSwipedCards] = useState([]);
  const [cardHistory, setCardHistory] = useState([]);
  

  const [users, setUsers] = useState(contextUsers || []);
  const [swiperCards, setSwiperCards] = useState([]);
  const swiperCardsRef = useRef(swiperCards);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [filtersActive, setFiltersActive] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const [isRewinding, setIsRewinding] = useState(false);
  const [rewindCounter, setRewindCounter] = useState(0);
  const usersRef = useRef(users);
  const filterCooldownUntilRef = useRef(0);
  const [swipeX, setSwipeX] = useState(0);

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

  // Initialize and synchronize swiperCards from users when safe
  useEffect(() => {
    if (!isProcessingSwipe && Date.now() >= filterCooldownUntilRef.current) {
      const next = users.filter(user => user && (user._id || user.id));
      const sameLength = next.length === swiperCardsRef.current.length;
      const sameIds = sameLength && next.every((u, i) => (u?._id || u?.id) === (swiperCardsRef.current[i]?._id || swiperCardsRef.current[i]?.id));
      if (!sameIds) {
        setSwiperCards(next);
      }
    }
  }, [users, isProcessingSwipe]);

  // Check for filtered users from route params and load saved filters when component mounts
  useEffect(() => {
    const loadSavedFilters = async () => {
      try {
        const savedFilters = await AsyncStorage.getItem('activeFilters');
        if (savedFilters) {
          const filters = JSON.parse(savedFilters);
          console.log('📋 Loading saved filters from AsyncStorage:', filters);
          
          // Check if any filters are actually set
          const hasActiveFilters = Object.values(filters).some(value => 
            value !== null && value !== false && 
            (Array.isArray(value) ? value.length > 0 : true)
          );
          
          if (hasActiveFilters) {
            setFiltersActive(true);
            setActiveFilters(filters);
            console.log('✅ Restored active filters');
          }
        }
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    };

    if (route?.params?.filteredUsers && route.params.filtersApplied) {
      console.log('🎯 Received filtered users from route params:', route.params.filteredUsers.length);
      setFiltersActive(true);
      setActiveFilters(route.params.filters || {});
      filterAndSetUsers(route.params.filteredUsers, false, true); // Preserve history for filtered users
      // Clear route params to prevent re-application on re-render
      navigation.setParams({ filteredUsers: undefined, filtersApplied: undefined });
    } else {
      // Load saved filters if no route params
      loadSavedFilters();
    }
  }, [route?.params]);

  // Constants
  const CARD_WIDTH = SCREEN_WIDTH * 0.9;
  const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

  // Function to handle "start over" - fetch fresh users including disliked ones and new users
  const handleStartOver = useCallback(async () => {
    try {
      setLoading(true);

      // First, reset likes and dislikes via API
      try {
        const resetResponse = await fetch(`${API_BASE_URL}/auth/reset-likes-dislikes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const resetData = await resetResponse.json();
        if (resetData.success) {
          // Update the user context with the reset data
          updateUser(resetData.user);
        } else {
          // Failed to reset likes and dislikes
        }
      } catch (resetError) {
        // Error resetting likes and dislikes
      }

      // Clear any active filters
      setFiltersActive(false);
      setActiveFilters({});
      
      // Clear saved filters from AsyncStorage
      AsyncStorage.removeItem('activeFilters').catch(error => 
        console.error('Error clearing saved filters:', error)
      );

      // Always try to fetch fresh data from server to get any new users
      try {
        const response = await fetch(`${API_BASE_URL}/admin/users/home`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.users) {
          filterAndSetUsers(data.users, true, false); // Include disliked users, clear history
          setCurrentIndex(0);
          setCardHistory([]); // Clear history when starting over
          console.log('🔄 Start over: Reset current index and card history');
          return;
        }
      } catch (fetchError) {
        // Failed to fetch fresh users, falling back to context users
      }

      // Fallback: use context users if server fetch fails
      if (contextUsers && contextUsers.length > 0) {
        filterAndSetUsers(contextUsers, true, false); // Include disliked users, clear history
        setCurrentIndex(0);
        setCardHistory([]); // Clear history when starting over
        console.log('🔄 Start over (fallback): Reset current index and card history');
      } else {
        // No users available for start over
      }
    } catch (error) {
      // Error in handleStartOver
    } finally {
      setLoading(false);
    }
  }, [contextUsers, filterAndSetUsers, token, updateUser, navigation]);

  // Handle rewind functionality
  const handleRewind = useCallback(() => {
    console.log(`🔄 Rewind requested - Current state:`);
    console.log(`🔄 - isAnimating: ${isAnimating}`);
    console.log(`🔄 - isRewinding: ${isRewinding}`);
    console.log(`🔄 - isProcessingSwipe: ${isProcessingSwipe}`);
    console.log(`🔄 - cardHistory.length: ${cardHistory.length}`);
    console.log(`🔄 - users.length: ${users.length}`);
    console.log(`🔄 - currentIndex: ${currentIndex}`);
    
    if (!isAnimating && !isRewinding && !isProcessingSwipe && cardHistory.length > 0) {
      setIsAnimating(true);
      setIsRewinding(true);
      
      // Get the last swiped card from history
      const lastSwipedCard = cardHistory[cardHistory.length - 1];
      console.log(`🔄 Rewind: Restoring card: ${lastSwipedCard.name || lastSwipedCard.username}`);
      
      // Remove the last card from history
      const newHistory = cardHistory.slice(0, -1);
      setCardHistory(newHistory);
      console.log(`🔄 Rewind: Card history reduced to ${newHistory.length} cards`);
      
      // Add the card back to the beginning of users array
      const newUsers = [lastSwipedCard, ...users];
      setUsers(newUsers);
      console.log(`🔄 Rewind: Added card back to users array, total users: ${newUsers.length}`);
      
      // Reset current index to 0 since we're adding the card at the beginning
      setCurrentIndex(0);
      console.log(`🔄 Rewind: Current index reset to 0`);
      
      // Increment rewind counter to force swiper re-render
      setRewindCounter(prev => prev + 1);
      console.log(`🔄 Rewind: Incremented rewind counter to force re-render`);
      
      // Use a timeout to ensure the state updates are processed
      setTimeout(() => {
        // Reset animation states
        setIsAnimating(false);
        setIsRewinding(false);
        console.log('🔄 Rewind animation completed');
      }, 200);
    } else {
      console.log(`🔄 Rewind blocked: isAnimating=${isAnimating}, isRewinding=${isRewinding}, isProcessingSwipe=${isProcessingSwipe}, cardHistory.length=${cardHistory.length}`);
    }
  }, [isAnimating, isRewinding, isProcessingSwipe, cardHistory, users, currentIndex]);

  // Handle swipe action
  const handleSwipe = useCallback(async (direction, swipedUser) => {
    if (isAnimating) return;
    
    // Block filtering updates during and shortly after swipe to avoid flashes
    filterCooldownUntilRef.current = Date.now() + 350;
    
    setIsAnimating(true);
    setIsProcessingSwipe(true);
    
    const swipedUserId = swipedUser._id || swipedUser.id;
    
    // Optimistically update UI first for instant responsiveness
    setCardHistory(prev => {
      const newHistory = [...prev, swipedUser];
      console.log(`📚 Card history updated: ${prev.length} → ${newHistory.length} cards`);
      console.log(`📚 Swiped user: ${swipedUser.name || swipedUser.username}`);
      console.log(`📚 New history length: ${newHistory.length}`);
      return newHistory;
    });
    
    // currentIndex will be updated in onSwiped callbacks to stay in sync with Swiper
    
    console.log(`🎯 Swipe completed for: ${swipedUser.name || swipedUser.username}`);
    console.log(`🎯 Card history should now be: ${cardHistory.length + 1} cards`);
    
    // Reduce animation timeout to match swiper animation
    setTimeout(() => {
      setIsAnimating(false);
      setIsProcessingSwipe(false);
      console.log(`🎯 Animation states reset after swipe`);
    }, 150); // Reduced from 300ms to 150ms
    
    // Fire-and-forget API call to avoid blocking UI
    if (profile && token && swipedUser && swipedUserId) {
      (async () => {
        try {
          let updatedLikes = Array.isArray(profile.likes) ? [...profile.likes] : [];
          let updatedDislikes = Array.isArray(profile.dislikes) ? [...profile.dislikes] : [];
          
          if (direction === 'right') {
            if (!updatedLikes.includes(swipedUserId)) updatedLikes.push(swipedUserId);
            updatedDislikes = updatedDislikes.filter(id => id !== swipedUserId);
          } else {
            if (!updatedDislikes.includes(swipedUserId)) updatedDislikes.push(swipedUserId);
            updatedLikes = updatedLikes.filter(id => id !== swipedUserId);
          }
          
          const response = await axios.put(`${API_BASE_URL}/auth/update-likes-dislikes`, {
            likes: updatedLikes,
            dislikes: updatedDislikes
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          updateUser(response.data);
        } catch (err) {
          // Error handling for like/dislike update
        }
      })();
    }
  }, [isAnimating, profile, token, updateUser]);

  // Button swipe handlers
  const handleButtonSwipe = useCallback((direction) => {
    console.log(`🔘 Button swipe: direction=${direction}, isAnimating=${isAnimating}, isProcessingSwipe=${isProcessingSwipe}, currentIndex=${currentIndex}, cards.length=${swiperCardsRef.current.length}`);
    
    if (isAnimating || isProcessingSwipe || currentIndex >= swiperCardsRef.current.length) {
      console.log('❌ Button swipe blocked: isAnimating, isProcessingSwipe, or invalid index');
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
      console.log('⚠️ Error invoking swiper swipe:', err);
      // Fallback: directly trigger handleSwipe if swiper command fails
      const list = swiperCardsRef.current;
      const currentUser = list[currentIndex];
      if (currentUser) {
        handleSwipe(direction === 1 ? 'right' : 'left', currentUser);
      }
    }
  }, [handleSwipe, isAnimating, isProcessingSwipe, currentIndex]);

  // Function to apply basic filters to users
  const applyBasicFilters = useCallback((usersToFilter) => {
    if (!usersToFilter || usersToFilter.length === 0) {
      return [];
    }

    // If no filters are active, return all users
    if (!filtersActive || Object.keys(activeFilters).length === 0) {
      return usersToFilter;
    }

    let filteredUsers = usersToFilter;

    // Apply age filter
    if (activeFilters.ageRange && activeFilters.ageRange.length === 2) {
      const [minAge, maxAge] = activeFilters.ageRange;
      filteredUsers = filteredUsers.filter(user => {
        const userAge = getAge(user);
        return userAge !== null && userAge >= minAge && userAge <= maxAge;
      });
    }

    // Apply location filter
    if (activeFilters.location && activeFilters.location !== 'All') {
      filteredUsers = filteredUsers.filter(user => 
        user.location && user.location.toLowerCase() === activeFilters.location.toLowerCase()
      );
    }

    // Apply verified filter
    if (activeFilters.verifiedOnly) {
      filteredUsers = filteredUsers.filter(user => 
        user.verificationStatus === 'true'
      );
    }

    // Apply height filter
    if (activeFilters.heightRange && activeFilters.heightRange.length === 2) {
      const [minHeight, maxHeight] = activeFilters.heightRange;
      filteredUsers = filteredUsers.filter(user => {
        if (user.height) {
          // Extract numeric height from string format like "5'8\" (173 cm)"
          const heightMatch = user.height.match(/\((\d+)\s*cm\)/);
          if (heightMatch) {
            const heightCm = parseInt(heightMatch[1]);
            return heightCm >= minHeight && heightCm <= maxHeight;
          }
        }
        return true; // Include users without height if filter can't be applied
      });
    }

    // Apply relationship type filter
    if (activeFilters.relationshipType && activeFilters.relationshipType !== 'All') {
      filteredUsers = filteredUsers.filter(user => 
        user.goal === activeFilters.relationshipType
      );
    }

    // Apply education level filter
    if (activeFilters.educationLevel && activeFilters.educationLevel !== 'All') {
      filteredUsers = filteredUsers.filter(user => 
        user.education === activeFilters.educationLevel
      );
    }

    // Apply zodiac sign filter
    if (activeFilters.zodiacSign && activeFilters.zodiacSign !== 'All') {
      filteredUsers = filteredUsers.filter(user => 
        user.zodiac === activeFilters.zodiacSign
      );
    }

    // Apply family plan filter
    if (activeFilters.familyPlan && activeFilters.familyPlan !== 'All') {
      filteredUsers = filteredUsers.filter(user => 
        user.kids === activeFilters.familyPlan
      );
    }

    // Apply personality filter
    if (activeFilters.personality && activeFilters.personality !== 'All') {
      filteredUsers = filteredUsers.filter(user => 
        user.personality === activeFilters.personality
      );
    }

    // Apply religion filter
    if (activeFilters.religion && activeFilters.religion !== 'All') {
      filteredUsers = filteredUsers.filter(user => 
        user.religon === activeFilters.religion
      );
    }

    // Apply lifestyle choices filter
    if (activeFilters.lifestyleChoices && activeFilters.lifestyleChoices.length > 0) {
      filteredUsers = filteredUsers.filter(user => 
        user.lifestyle && activeFilters.lifestyleChoices.some(choice => 
          user.lifestyle.includes(choice)
        )
      );
    }

    // Apply similar interests filter
    if (activeFilters.similarInterests && profile?.interests && profile.interests.length > 0) {
      filteredUsers = filteredUsers.filter(user => 
        user.interests && user.interests.some(interest => 
          profile.interests.includes(interest)
        )
      );
    }

    console.log(`🔍 Applied filters: ${filteredUsers.length} users remaining out of ${usersToFilter.length}`);
    return filteredUsers;
  }, [filtersActive, activeFilters, profile?.interests]);

  // Function to fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/users/home`);
      const data = await response.json();
      
      if (data.success) {
        filterAndSetUsers(data.users, false, true); // Preserve history when fetching users
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filterAndSetUsers]);

  // Initialize users from context or fetch if needed
  useEffect(() => {
    if (contextUsers && contextUsers.length > 0 && users.length === 0) {
      filterAndSetUsers(contextUsers, false, true); // Preserve history when initializing
    } else if (initialized && !loading && users.length === 0) {
      // Fallback: fetch users if not preloaded
      fetchUsers();
    }
  }, [contextUsers, initialized, profile, users.length, fetchUsers]);

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

  // Function to filter users based on connections and other criteria
  const filterAndSetUsers = useCallback((usersToFilter, includeDisliked = false, preserveHistory = false) => {
    // Prevent filtering during swipe operations or cooldown to preserve card history and avoid flashes
    if (isProcessingSwipe || Date.now() < filterCooldownUntilRef.current) {
      console.log('🚫 Skipping filterAndSetUsers during swipe operation or cooldown');
      return;
    }
    
    if (!usersToFilter || usersToFilter.length === 0) {
      setUsers([]);
      return;
    }

    let filteredUsers = usersToFilter;

    // Apply basic filters if they're active
    if (filtersActive) {
      filteredUsers = applyBasicFilters(usersToFilter);
    }

    // Enforce presence of at least one profile picture
    filteredUsers = filteredUsers.filter(userHasProfilePhoto);

    // Apply connection/likes/dislikes filtering and exclude current user
    const finalFilteredUsers = filteredUsers.filter(user => {
      if (!user || !user._id) return false;
      
      // IMPORTANT: Exclude current user's profile
      if (profile && user._id === profile._id) {
        console.log('🚫 Excluding current user profile:', user.name || user.username);
        return false;
      }
      
      // Check if user is already connected
      if (profile?.connections?.includes(user._id)) return false;
      
      // Check if user has already been liked or disliked
      if (profile?.likes?.includes(user._id)) return false;
      if (profile?.dislikes?.includes(user._id) && !includeDisliked) return false;
      
      return true;
    });

    // Skip update if unchanged to avoid unnecessary remounts
    const sameLength = finalFilteredUsers.length === usersRef.current.length;
    const sameIds = sameLength && finalFilteredUsers.every((u, i) => (u?._id || u?.id) === (usersRef.current[i]?._id || usersRef.current[i]?.id));
    if (sameIds) {
      console.log('ℹ️ Users unchanged; skipping setUsers to prevent remount');
    } else {
      console.log(`👥 Filtered users: ${finalFilteredUsers.length} out of ${usersToFilter.length} (excluded current user and connections)`);
      setUsers(finalFilteredUsers);
    }

    // Only reset index if not preserving history
    if (!preserveHistory) {
      setCurrentIndex(0);
    }
    
    // Only clear card history if explicitly requested
    if (!preserveHistory) {
      setCardHistory([]); // Clear card history when users change
      console.log('🧹 Card history cleared due to user change');
    } else {
      console.log('💾 Card history preserved during user update');
    }
  }, [filtersActive, profile, applyBasicFilters, isProcessingSwipe]);

  // Refresh balance and users when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (dataReady && initialized && !loading && token && profile) {
        refreshBalance();
        
        // Use context users if available, otherwise fetch fresh
        if (contextUsers && contextUsers.length > 0) {
          filterAndSetUsers(contextUsers, false, true); // Preserve history when refreshing
        } else {
          // Fetch fresh users if context is empty
          fetchUsers();
        }
      }
    }, [dataReady, initialized, loading, token, profile, contextUsers, refreshBalance, filterAndSetUsers, fetchUsers])
  );

  // Ensure current index is valid when users change
  useEffect(() => {
    if (users.length > 0 && currentIndex >= users.length) {
      setCurrentIndex(0);
      console.log('🔧 Fixed invalid current index: reset to 0');
    }
  }, [users.length, currentIndex]);

  // Debug logging for state changes
  useEffect(() => {
    console.log(`🎯 State update - Users: ${users.length}, Current Index: ${currentIndex}, Card History: ${cardHistory.length}`);
  }, [users.length, currentIndex, cardHistory.length]);

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

  // Render card component for deck swiper
  const renderCard = (user, index) => {
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
    
    const isTopCard = index === currentIndex;
    const rightOpacity = isTopCard ? Math.max(0, Math.min(1, Math.max(0, swipeX) / 15)) : 0; // start immediately with very small threshold
    const leftOpacity = isTopCard ? Math.max(0, Math.min(1, Math.max(0, -swipeX) / 15)) : 0; // start immediately with very small threshold
    
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
  };

  // Render end card when no more profiles
  const renderEndCard = () => {
    return (
      <View style={styles.endCard}>
        <Text style={styles.endText}>No more profiles!</Text>
        <Text style={styles.endSubText}>Start over to see profiles again.</Text>
        <TouchableOpacity 
          style={[styles.resetButton, loading && styles.resetButtonDisabled]}
          onPress={handleStartOver}
          disabled={loading}
        >
          <Text style={styles.resetText}>
            {loading ? 'Loading...' : 'Start Over'}
          </Text>
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
        {swiperCards.length > 0 && swiperCards.every(user => user && (user._id || user.id)) ? (
          <Swiper
            key={`swiper-${swiperCards.length}-${rewindCounter}`}
            ref={swiperRef}
            cards={swiperCards}
            renderCard={renderCard}
            onSwipedLeft={(cardIndex) => {
              const list = swiperCardsRef.current;
              const swipedUser = list[cardIndex];
              if (!list || cardIndex < 0 || cardIndex >= list.length) {
                console.log('❌ Invalid cardIndex in onSwipedLeft:', cardIndex);
                return;
              }
              if (swipedUser && !isProcessingSwipe) {
                console.log(`👈 Swiper left swipe detected at index: ${cardIndex}`);
                console.log(`👈 Swiping left: ${swipedUser.name || swipedUser.username}`);
                console.log(`👈 Current card history before swipe: ${cardHistory.length} cards`);
                setCurrentIndex(cardIndex + 1);
                handleSwipe('left', swipedUser);
              } else {
                console.log('❌ No user found at card index or swipe in progress:', cardIndex);
              }
              // Immediately reset swipe visual
              setSwipeX(0);
            }}
            onSwipedRight={(cardIndex) => {
              const list = swiperCardsRef.current;
              const swipedUser = list[cardIndex];
              if (!list || cardIndex < 0 || cardIndex >= list.length) {
                console.log('❌ Invalid cardIndex in onSwipedRight:', cardIndex);
                return;
              }
              if (swipedUser && !isProcessingSwipe) {
                console.log(`👉 Swiper right swipe detected at index: ${cardIndex}`);
                console.log(`👉 Swiping right: ${swipedUser.name || swipedUser.username}`);
                console.log(`👉 Current card history before swipe: ${cardHistory.length} cards`);
                setCurrentIndex(cardIndex + 1);
                handleSwipe('right', swipedUser);
              } else {
                console.log('❌ No user found at card index or swipe in progress:', cardIndex);
              }
              // Immediately reset swipe visual
              setSwipeX(0);
            }}
            onSwipedAborted={() => {
              console.log('🔄 Swipe aborted, resetting states');
              setIsAnimating(false);
              setIsProcessingSwipe(false);
              // Immediately reset swipeX to clear overlay
              setSwipeX(0);
            }}
            onSwipedAll={renderEndCard}
            onSwiped={(cardIndex, direction) => {
              console.log(`🎯 Swiper general swipe: index=${cardIndex}, direction=${direction}`);
              // Reset swipeX after a short delay to ensure smooth transition
              setTimeout(() => setSwipeX(0), 50);
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
            swipeAnimationDuration={150}
            disableBottomSwipe={true}
            disableTopSwipe={true}
            animateOverlayLabelsOpacity
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
      {initialized && swiperCards.length > 0 && currentIndex < swiperCards.length && (
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
    justifyContent: 'flex-start',
    backgroundColor: '#1E1E1E',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 8,
    marginTop: SCREEN_HEIGHT * 0.15,
    paddingTop: 40,
  },
  endText: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  endSubText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  resetButton: {
    backgroundColor: '#ec066a',
    padding: 12,
    borderRadius: 8,
    opacity: 1,
    marginTop: 10,
  },
  clearFiltersButton: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
    opacity: 1,
    marginBottom: 10,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetText: {
    color: '#fff',
    fontSize: 16,
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
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  splashLogo: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4 * 0.21, // Maintain aspect ratio
  },
  errorText: {
    color: 'red',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

export default Home;