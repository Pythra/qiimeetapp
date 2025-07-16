import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  interpolate,
  withSpring,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function SwipeCard({ user, onSwipeLeft, onSwipeRight, getProfileImage, navigation }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Calculate age from dateOfBirth if not present
  const getAge = () => {
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
  const age = getAge();

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      console.log('SwipeCard - onActive triggered:', {
        translationX: event.translationX,
        translationY: event.translationY,
        userId: user._id || user.id,
        userName: user.name
      });
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: (event) => {
      console.log('SwipeCard - onEnd triggered:', {
        translationX: event.translationX,
        translationY: event.translationY,
        threshold: SWIPE_THRESHOLD,
        willSwipeRight: event.translationX > SWIPE_THRESHOLD,
        willSwipeLeft: event.translationX < -SWIPE_THRESHOLD,
        userId: user._id || user.id,
        userName: user.name
      });

      if (event.translationX > SWIPE_THRESHOLD) {
        console.log('SwipeCard - Swiping RIGHT for user:', user.name);
        // Animate completely off screen first, then call callback
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, (finished) => {
          if (finished) {
            console.log('SwipeCard - Animation complete, calling onSwipeRight for:', user.name);
            runOnJS(onSwipeRight)();
          }
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        console.log('SwipeCard - Swiping LEFT for user:', user.name);
        // Animate completely off screen first, then call callback
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, (finished) => {
          if (finished) {
            console.log('SwipeCard - Animation complete, calling onSwipeLeft for:', user.name);
            runOnJS(onSwipeLeft)();
          }
        });
      } else {
        console.log('SwipeCard - Returning to center for user:', user.name);
        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    },
  });

  // Card tilt and movement
  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-30, 0, 30]
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: opacity.value,
    };
  });

  // Overlay color
  const animatedOverlayStyle = useAnimatedStyle(() => {
    const likeOpacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 0.7]);
    const nopeOpacity = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [0.7, 0]);
    return {
      backgroundColor:
        translateX.value > 0
          ? 'rgba(110, 197, 49, 0.7)'
          : translateX.value < 0
          ? 'rgba(220, 53, 69, 0.7)'
          : 'transparent',
      opacity: Math.max(likeOpacity, nopeOpacity),
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        <View style={styles.cardInner}>
          <Image source={{ uri: getProfileImage(user) }} style={styles.image} resizeMode="cover" />
          <Animated.View style={[styles.overlay, animatedOverlayStyle]} pointerEvents="none" />
          <LinearGradient
            colors={["transparent", "transparent", "rgba(0, 0, 0, 0.5)", "rgb(0, 0, 0)"]}
            style={styles.gradient}
            locations={[0, 0.6, 0.8, 1]}
          />
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              {age !== null && <Text style={styles.age}>, {age}</Text>}
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={32} color="#ec066a" />
              </View>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#fff" />
              <Text style={styles.location}>{user.location || ''}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cardTouchable} activeOpacity={1} onPress={() => {
            if (navigation) {
              const userId = user._id || user.id;
              navigation.navigate('MatchDetail', { userId });
            }
          }} />
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius:8,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardInner: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  infoContainer: {
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
  name: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  age: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '400',
  },
  verifiedBadge: {
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
  cardTouchable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});