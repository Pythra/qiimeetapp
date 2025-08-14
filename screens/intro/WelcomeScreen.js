 import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import ScreenWrapper from '../../components/WelcomeWrapper';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { width, height } = Dimensions.get('window');

import CustomButton from '../../constants/button';
import { FONTS } from '../../constants/font';
import TopMaleOrbit from '../../animations/TopMaleOrbit';
import HeartBeatAnimation from '../../animations/HeartBeatAnimation';
import WelcomeWrapper from '../../components/WelcomeWrapper';
import { useAuth } from '../../components/AuthContext';

const WelcomeScreen = ( ) => {
  const navigation = useNavigation();
  const { refreshAllData, user, initialized } = useAuth();
  const innerSpinValue = useRef(new Animated.Value(0)).current;
  const innerSpinValue2 = useRef(new Animated.Value(0.33)).current; // Start at 120° (1/3 of circle)
  const innerSpinValue3 = useRef(new Animated.Value(0.67)).current; // Start at 240° (2/3 of circle)

  const innerOrbitRadius = width * 0.45; // Increased from 0.35
  const innerRevolveSpeed = 15000; // Increased for smoother motion
  
  // Center point of both orbits
  const centerX = width / 2;
  const centerY = height * 0.33;

  const generateOrbitPoints = (phase = 0) => {
    const numPoints = 360;
    const inputRange = [];
    const outputRangeX = [];
    const outputRangeY = [];

    for (let i = 0; i <= numPoints; i++) {
      const progress = i / numPoints;
      inputRange.push(progress);
      const angle = (progress * 2 * Math.PI) + (phase * 2 * Math.PI);
      outputRangeX.push(innerOrbitRadius * Math.cos(angle));
      outputRangeY.push(innerOrbitRadius * Math.sin(angle));
    }
    return { inputRange, outputRangeX, outputRangeY };
  };

  // Generate orbit paths with different phases
  const orbit1 = generateOrbitPoints(0);
  const orbit2 = generateOrbitPoints(0.33);
  const orbit3 = generateOrbitPoints(0.67);

  useEffect(() => {
    const startAnimations = () => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(innerSpinValue, {
            toValue: 1,
            duration: innerRevolveSpeed,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(innerSpinValue2, {
            toValue: 1,
            duration: innerRevolveSpeed,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(innerSpinValue3, {
            toValue: 1,
            duration: innerRevolveSpeed,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ])
      ).start();
    };

    startAnimations();
  }, []);

  // Check for authentication tokens and load data if needed
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const idToken = await AsyncStorage.getItem('idToken');
        
        // If we have social login tokens but no user data in AuthContext, load the data
        if ((accessToken || idToken) && initialized && !user) {
          await refreshAllData();
        }
      } catch (error) {
        console.warn('Error checking auth tokens:', error);
      }
    };

    checkAuthAndLoadData();
  }, [initialized, user, refreshAllData]);

  // Update interpolations to use new orbit paths
  const innerAnimatedTranslateX = innerSpinValue.interpolate({
    inputRange: orbit1.inputRange,
    outputRange: orbit1.outputRangeX,
  });
  
  const innerAnimatedTranslateY = innerSpinValue.interpolate({
    inputRange: orbit1.inputRange,
    outputRange: orbit1.outputRangeY,
  });

  const ropeAnimatedTranslateX = innerSpinValue2.interpolate({
    inputRange: orbit2.inputRange,
    outputRange: orbit2.outputRangeX,
  });

  const ropeAnimatedTranslateY = innerSpinValue2.interpolate({
    inputRange: orbit2.inputRange,
    outputRange: orbit2.outputRangeY,
  });

  const glassesAnimatedTranslateX = innerSpinValue3.interpolate({
    inputRange: orbit3.inputRange,
    outputRange: orbit3.outputRangeX,
  });

  const glassesAnimatedTranslateY = innerSpinValue3.interpolate({
    inputRange: orbit3.inputRange,
    outputRange: orbit3.outputRangeY,
  });

  return (
    <WelcomeWrapper>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Image source={require('../../assets/circles.png')} style={styles.circlesBg} resizeMode="contain" />
        <TopMaleOrbit />
        
        <View style={styles.heartBeatWrapper}>
          <HeartBeatAnimation />
        </View>

        {/* Inner orbit - flower.jpg */}
        <Animated.Image
          source={require('../../assets/flower.jpg')}
          style={[
            styles.innerRotatingImage,
            {
              transform: [
                { translateX: innerAnimatedTranslateX },
                { translateY: innerAnimatedTranslateY },
              ]
            }
          ]}
        />

        {/* Inner orbit - rope.jpg */}
        <Animated.Image
          source={require('../../assets/rope.jpg')}
          style={[
            styles.innerRotatingImage,
            {
              transform: [
                { translateX: ropeAnimatedTranslateX },
                { translateY: ropeAnimatedTranslateY },
              ]
            }
          ]}
        />

        {/* Inner orbit - glasses.jpg */}
        <Animated.Image
          source={require('../../assets/glasses.jpg')}
          style={[
            styles.innerRotatingImage,
            {
              transform: [
                { translateX: glassesAnimatedTranslateX },
                { translateY: glassesAnimatedTranslateY },
              ]
            }
          ]}
        />

        <View style={styles.contentContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <View style={styles.appNameRow}>       
            <Image source={require('../../assets/logo.png')} style={styles.appName} resizeMode="contain" />
            <Image source={require('../../assets/red.png')} style={styles.appNameHeart} resizeMode="contain" />
          </View>
          <Text style={styles.subtitleText}>
            You're one step closer to finding meaningful
            connections. Let's set up your profile to help
            you meet the right match.
          </Text> 
          <CustomButton 
                title="Continue"
                onPress={() => navigation.navigate('Onboarding', { screen: 'DisplayName' })}
              />
        </View>
      </View>
    </WelcomeWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  circlesBg: {
    position: 'absolute',
    marginTop: 30,
    width: width,
    height: '67%',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  webIcon: {
    position: 'absolute',
    top: height * 0.01,
    alignSelf: 'center',
    width: 300, 
    marginBottom: 20,
  },
  welcomeIcon: {
    position: 'absolute',
    top: height * 0.32,
    alignSelf: 'center',
    width: 120,
    height: 120,
    zIndex: 2,
  },
  contentContainer: {
    position: 'absolute', 
    width: '100%',
    paddingHorizontal: 24, 
    zIndex: 3,
  },
  welcomeText: {
    color: '#FFF',
    lineHeight: 40,
    letterSpacing: 0,
    fontSize: 30, 
    fontFamily: FONTS.regular 
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, 
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center', 
    marginBottom: 12,
  },
  appName: {
    height: 40,
    width:'48%',
  },
  appNameQ: {
    color: '#FFF',
  },
  appNamePink: {
    color: '#FF3D7F',
  },
  appNameRest: {
    color: '#FFF',
  },
  appNameHeart: { 
    width: 35,
    height: 35,
    marginLeft: 8,
  },
  subtitleText: {
    color: '#AAAAAA',
    fontSize: 15, 
    marginBottom: 25,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  }, 
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rotatingImage: {
    width: 97,
    height: 97,
    position: 'absolute',
    top: height * 0.33 - 48.5,
    left: width / 2 - 48.5,
    borderRadius: 50,
    zIndex: 2,
  },
  innerRotatingImage: {
    width: 60,
    height: 60,
    position: 'absolute',
    top: height * 0.35 - 30, // Adjusted from 0.33 to come down lower
    left: width / 2 - 30,
    borderRadius: 30,
    zIndex: 2,
  },
  heartBeatWrapper: {
    position: 'absolute',
    top: height * 0.33 - 85, // Center vertically relative to circles
    left: width / 2 - 85, // Center horizontally
    zIndex: 2,
  },
});

export default WelcomeScreen;