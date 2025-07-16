import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions,
} from 'react-native';

import { Ionicons, FontAwesome6, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { FONTS } from '../../constants/font';
import { API_BASE_URL } from '../../env';
import ScreenWrapper from '../../components/ScreenWrapper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Home = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Reanimated shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  // Next card animation values
  const nextCardScale = useSharedValue(0.95);
  const nextCardOpacity = useSharedValue(0.8);
  
  // Constants
  const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
  const ROTATION_FACTOR = 0.3;
  const CARD_WIDTH = SCREEN_WIDTH * 0.9;
  const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(null);
  const [balance, setBalance] = useState(0); // Add balance state

  // Reset card position
  const resetCard = useCallback(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
  }, []);

  // Animate card out
  const animateCardOut = useCallback((direction) => {
    const targetX = direction > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    
    translateX.value = withTiming(targetX, { duration: 300 });
    translateY.value = withTiming(translateY.value + Math.random() * 100 - 50, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      // Reset values immediately after animation
      translateX.value = 0;
      translateY.value = 0;
      scale.value = 1;
      opacity.value = 1;
      
      // Animate next card to current position
      nextCardScale.value = withSpring(1);
      nextCardOpacity.value = withSpring(1);
      
      // Update index on JS thread
      runOnJS(setCurrentIndex)(currentIndex + 1);
      runOnJS(setIsAnimating)(false);
    });
  }, [currentIndex]);

  // Handle swipe action
  const handleSwipe = useCallback(async (direction) => {
    if (isAnimating || currentIndex >= users.length) return;
    setIsAnimating(true);
    animateCardOut(direction); // Move animation up for instant feedback
    const swipedUser = users[currentIndex];
    const swipedUserId = swipedUser._id || swipedUser.id;
    console.log('--- SWIPE DEBUG ---');
    console.log('Direction:', direction > 0 ? 'LIKE' : 'DISLIKE');
    console.log('Swiped user:', swipedUser);
    console.log('Current user profile:', profile);
    if (profile && token && swipedUser && swipedUserId) {
      try {
        let updatedLikes = Array.isArray(profile.likes) ? [...profile.likes] : [];
        let updatedDislikes = Array.isArray(profile.dislikes) ? [...profile.dislikes] : [];
        if (direction > 0) {
          if (!updatedLikes.includes(swipedUserId)) updatedLikes.push(swipedUserId);
          updatedDislikes = updatedDislikes.filter(id => id !== swipedUserId);
        } else {
          if (!updatedDislikes.includes(swipedUserId)) updatedDislikes.push(swipedUserId);
          updatedLikes = updatedLikes.filter(id => id !== swipedUserId);
        }
        console.log('Updated likes:', updatedLikes);
        console.log('Updated dislikes:', updatedDislikes);
        console.log('Sending PUT /auth/update...');
        const response = await axios.put(`${API_BASE_URL}/auth/update`, {
          likes: updatedLikes,
          dislikes: updatedDislikes
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('PUT /auth/update response:', response.data);
        setProfile(response.data); // Update local profile state
      } catch (err) {
        console.error('Failed to update like/dislike:', err?.response?.data || err.message);
      }
    } else {
      console.warn('Missing profile, token, or swipedUser._id');
    }
  }, [isAnimating, currentIndex, users, animateCardOut, profile, token]);

  // Gesture handler
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      if (isAnimating) return;
      
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
      
      // Scale down slightly when dragging
      const dragScale = interpolate(
        Math.abs(event.translationX),
        [0, SCREEN_WIDTH * 0.5],
        [1, 0.95],
        Extrapolate.CLAMP
      );
      scale.value = dragScale;
      
      // Animate next card
      const nextScale = interpolate(
        Math.abs(event.translationX),
        [0, SCREEN_WIDTH * 0.5],
        [0.95, 1],
        Extrapolate.CLAMP
      );
      nextCardScale.value = nextScale;
      
      const nextOpacity = interpolate(
        Math.abs(event.translationX),
        [0, SCREEN_WIDTH * 0.5],
        [0.8, 1],
        Extrapolate.CLAMP
      );
      nextCardOpacity.value = nextOpacity;
    },
    onEnd: (event) => {
      if (isAnimating) return;
      
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD || 
                         Math.abs(event.velocityX) > 1000;
      
      if (shouldSwipe) {
        const direction = event.translationX > 0 ? 1 : -1;
        runOnJS(handleSwipe)(direction);
      } else {
        // Spring back to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        
        // Reset next card
        nextCardScale.value = withSpring(0.95);
        nextCardOpacity.value = withSpring(0.8);
      }
    },
  });

  // Button swipe handlers
  const handleButtonSwipe = useCallback((direction) => {
    if (isAnimating || currentIndex >= users.length) return;
    handleSwipe(direction);
  }, [handleSwipe, isAnimating, currentIndex, users.length]);

  // Animated styles for card container (position only)
  const cardContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  // Animated styles for card content (rotation and scale)
  const cardContentStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-30, 0, 30],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [
        { rotate: `${rotation}deg` },
        { scale: scale.value },
      ],
    };
  });

  const nextCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextCardScale.value }],
    opacity: nextCardOpacity.value,
  }));

  // Overlay animations
  const likeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SCREEN_WIDTH * 0.3],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const dislikeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SCREEN_WIDTH * 0.3, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  // Button overlay animations
  const likeButtonOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [SCREEN_WIDTH * 0.24, SCREEN_WIDTH * 0.3],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const dislikeButtonOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SCREEN_WIDTH * 0.3, -SCREEN_WIDTH * 0.24],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  // Data fetching
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/admin/users/home`);
        const data = await response.json();
        if (data.success) {
          const usersWithPhotos = data.users.filter(user => {
            if (Array.isArray(user.profilePictures)) {
              return user.profilePictures.length > 0 && user.profilePictures[0];
            }
            return user.profilePictures && user.profilePictures.length > 0;
          });
          // Exclude current user from swipe list
          if (profile && profile._id) {
            setUsers(usersWithPhotos.filter(u => u._id !== profile._id && u.id !== profile._id));
          } else {
            setUsers(usersWithPhotos);
          }
        } else {
          setError('Failed to fetch users');
        }
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [profile]);

  // Format balance with commas
  const formatBalance = (amount) => {
    return amount?.toLocaleString?.() ?? '0';
  };

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

  // Fetch user balance from backend
  const fetchUserBalance = async (authToken) => {
    try {
      if (!authToken) return;
      const response = await axios.get(`${API_BASE_URL}/transaction/balance/current`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setBalance(response.data.balance);
      }
    } catch (error) {
      // Optionally handle error
      // console.error('Error fetching balance:', error);
    }
  };

  // Fetch user profile and token on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
        if (!storedToken) {
          setProfile(null);
          return;
        }
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        });
        setProfile(response.data);
        fetchUserBalance(storedToken); // Fetch balance after token is set
      } catch (error) {
        setProfile(null);
      }
    };
    fetchUserProfile();
  }, []);

  // Log current user data whenever profile changes
  useEffect(() => {
    if (profile) {
      console.log('=== CURRENT USER DATA ===');
      console.log('Full Profile Object:', JSON.stringify(profile, null, 2));
      console.log('User ID:', profile._id || profile.id);
      console.log('Name:', profile.name);
      console.log('Email:', profile.email);
      console.log('Age:', profile.age);
      console.log('Gender:', profile.gender);
      console.log('Location:', profile.location);
      console.log('Bio:', profile.bio);
      console.log('Profile Picture:', profile.profilePicture);
      console.log('Likes:', profile.likes);
      console.log('Dislikes:', profile.dislikes);
      console.log('Matches:', profile.matches);
      console.log('Premium Status:', profile.isPremium);
      console.log('Verification Status:', profile.isVerified);
      console.log('Account Balance:', balance);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('=== END CURRENT USER DATA ===');
    } else {
      console.log('=== CURRENT USER DATA ===');
      console.log('No user profile available');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('=== END CURRENT USER DATA ===');
    }
  }, [profile, balance, token]);

  // Reset animations when index changes
  useEffect(() => {
    if (currentIndex < users.length) {
      nextCardScale.value = 0.95;
      nextCardOpacity.value = 0.8;
    }
  }, [currentIndex, users.length]);

  // Helper to get profile image
  const getProfileImage = (user) => {
    const cloudFrontUrl = 'https://dk665xezaubcy.cloudfront.net';
    let profilePic = user.profilePictures;
    
    if (Array.isArray(profilePic) && profilePic.length > 0) {
      profilePic = profilePic[0];
    }
    
    if (profilePic) {
      if (profilePic.startsWith('/uploads/')) {
        return `${cloudFrontUrl}${profilePic}`;
      }
      if (profilePic.startsWith('http')) {
        return profilePic;
      }
      if (!profilePic.startsWith('/')) {
        return `${cloudFrontUrl}/uploads/images/${profilePic}`;
      }
      return profilePic;
    }
    
    return require('../../assets/model.jpg');
  };

  // Helper to get age (same as SwipeCard.js)
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

  // Render card component
  const renderCard = () => {
    if (currentIndex >= users.length) {
      return (
        <View style={styles.endCard}>
          <Text style={styles.endText}>No more profiles!</Text>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              setCurrentIndex(0);
              resetCard();
            }}
          >
            <Text style={styles.resetText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const currentUser = users[currentIndex];
    const nextUser = users[currentIndex + 1];

    // Log current user details
    if (currentUser) {
      console.log('=== CURRENT CARD USER DATA ===');
      console.log('Full User Object:', JSON.stringify(currentUser, null, 2));
      console.log('--- Available Fields from Complete User Data ---');
      console.log('User ID:', currentUser._id || currentUser.id);
      console.log('Username:', currentUser.username);
      console.log('Name:', currentUser.name);
      console.log('Phone:', currentUser.phone);
      console.log('Email:', currentUser.email);
      console.log('Goal:', currentUser.goal);
      console.log('Height:', currentUser.height);
      console.log('Gender:', currentUser.gender);
      console.log('Interests:', currentUser.interests);
      console.log('Kids:', currentUser.kids);
      console.log('Career:', currentUser.career);
      console.log('Zodiac:', currentUser.zodiac);
      console.log('Location:', currentUser.location);
      console.log('Age:', currentUser.age);
      console.log('Religion:', currentUser.religon);
      console.log('Personality:', currentUser.personality);
      console.log('Lifestyle:', currentUser.lifestyle);
      console.log('Education:', currentUser.education);
      console.log('Date of Birth:', currentUser.dateOfBirth);
      console.log('Profile Pictures:', currentUser.profilePictures);
      console.log('Verification Status:', currentUser.verificationStatus);
      console.log('Likes:', currentUser.likes);
      console.log('Dislikes:', currentUser.dislikes);
      console.log('Connections:', currentUser.connections);
      console.log('Created At:', currentUser.createdAt);
      console.log('--- End Available Fields ---');
      console.log('=== END CURRENT CARD USER DATA ===');
    }

    // Improved UI from SwipeCard.js for current card
    return (
      <View style={styles.cardsContainer}>
        {/* Next Card */}
        {nextUser && (
          <Animated.View style={[styles.card, nextCardAnimatedStyle]}>
            <View style={styles.cardInner}>
              <Image 
                source={{ uri: getProfileImage(nextUser) }} 
                style={styles.cardImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "transparent", "rgba(0, 0, 0, 0.5)", "rgb(0, 0, 0)"]}
                style={styles.overlayGradient}
                locations={[0, 0.6, 0.8, 1]}
              />
              <View style={styles.userInfoSwipe}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{nextUser.name}</Text>
                  {getAge(nextUser) !== null && <Text style={styles.age}>, {getAge(nextUser)}</Text>}
                  <View style={styles.verifiedBadgeSwipe}>
                    <MaterialIcons name="verified" size={32} color="#ec066a" />
                  </View>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color="#fff" />
                  <Text style={styles.location}>{nextUser.location || ''}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

          {/* Current Card */}
          {currentUser && (
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View style={[styles.card, cardContainerStyle]}>
                <Animated.View style={[styles.cardInner, cardContentStyle]}>
                  <Image 
                    source={{ uri: getProfileImage(currentUser) }} 
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  {/* Like/Dislike Overlay */}
                  <Animated.View style={[styles.overlay, likeOverlayStyle]} pointerEvents="none" />
                  <Animated.View style={[styles.overlay, dislikeOverlayStyle]} pointerEvents="none" />
                  {/* Main Gradient */}
                  <LinearGradient
                    colors={["transparent", "transparent", "rgba(0, 0, 0, 0.5)", "rgb(0, 0, 0)"]}
                    style={styles.overlayGradient}
                    locations={[0, 0.6, 0.8, 1]}
                  />
                  {/* User Info */}
                  <View style={styles.userInfoSwipe}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{currentUser.name}</Text>
                      {getAge(currentUser) !== null && <Text style={styles.age}>, {getAge(currentUser)}</Text>}
                      <View style={styles.verifiedBadgeSwipe}>
                        <MaterialIcons name="verified" size={32} color="#ec066a" />
                      </View>
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={16} color="#fff" />
                      <Text style={styles.location}>{currentUser.location || ''}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.cardTouchable}
                    activeOpacity={1}
                    onPress={() => {
                      if (!isAnimating) {
                        const swipedUserId = currentUser._id || currentUser.id;
                        navigation.navigate('MatchDetail', { userId: swipedUserId });
                      }
                    }}
                  />
                </Animated.View>
              </Animated.View>
            </PanGestureHandler>
          )}
        </View>
      );
    };

  // Loading and error states
  if (loading && users.length === 0) {
    return (
      <ScreenWrapper backgroundColor="#000" statusBarColor="#000" barStyle="light-content" paddingTop={24}>
        <View style={styles.centerContainer}>
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
          <TouchableOpacity onPress={() => navigation.navigate('BasicFilters')}>
            <Image 
              source={require('../../assets/filter.png')}
              style={styles.filterIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards */}
      <View style={styles.cardsArea}>
        {renderCard()}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Dislike Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.dislikeButton]}
            onPress={() => handleButtonSwipe(-1)}
            disabled={isAnimating}
          >
            <FontAwesome6 name="xmark" size={42} color="#ec066a" style={styles.xIcon} />
          </TouchableOpacity>
          <Animated.View style={[styles.button, styles.dislikeButtonOverlay, dislikeButtonOverlayStyle]}>
            <FontAwesome6 name="xmark" size={38} color="#fff" style={styles.xIcon} />
          </Animated.View>
        </View>

        {/* Rewind Button */}
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.rewindButton]}
            onPress={() => {
              setCurrentIndex(currentIndex - 1);
              resetCard();
            }}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="undo" size={32} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Like Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.likeButton]}
            onPress={() => handleButtonSwipe(1)}
            disabled={isAnimating}
          >
            <Ionicons name="heart" size={40} color="#fff" />
          </TouchableOpacity>
          <Animated.View style={[styles.button, styles.likeButtonOverlay, likeButtonOverlayStyle]}>
            <Ionicons name="heart" size={40} color="#fff" />
          </Animated.View>
        </View>
      </View>
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
    paddingTop: 20, // Add some top padding
  },
  cardsContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Card styles
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    position: 'absolute',
    backgroundColor: 'transparent', // Make container transparent
  },
  cardContent: {
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
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  
  // Overlay styles
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // User info styles
  userInfo: {
    position: 'absolute',
    bottom: 56,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  status: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 90,
    alignSelf: 'flex-start',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#4CD964',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '400',
    fontFamily: FONTS.regular,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    marginRight: 5,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 16,
    fontWeight: '400',
    color: '#fff',
    marginLeft: 4,
    fontFamily: FONTS.regular,
  },
  
  // Action buttons
  actions: {
    position: 'absolute',
    bottom: 124,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  buttonContainer: {
    position: 'relative',
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
  dislikeButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#dc3545',
  },
  likeButton: {
    backgroundColor: '#ec066a',
  },
  likeButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#6EC531',
  },
  rewindButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    shadowColor: 'transparent',
    elevation: 0,
  },
  xIcon: {
    transform: [{ scale: 1.2 }],
    fontWeight: '900',
  },
  
  // End card styles
  endCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 8,
  },
  endText: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#ec066a',
    padding: 12,
    borderRadius: 8,
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
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    color: 'red',
    fontSize: 18,
  },
  cardInner: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  userInfoSwipe: {
    position: 'absolute',
    bottom: 56,
    left: 16,
    zIndex: 4,
    flexDirection: 'column',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default Home;