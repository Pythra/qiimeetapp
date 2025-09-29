import React, { useState, useEffect } from 'react';
import { View, Text, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import OnboardingTemplate from './OnboardingTemplate';
import LocationLoadingModal from './LocationLoadingModal';
import styles from './onboardingStyles';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StateSelectorModal from './StateSelectorModal';

const LocationScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [showStateSelector, setShowStateSelector] = useState(false);

  // Debug component mount and auth state
  useEffect(() => {
    const debugAuthState = async () => {
      console.log('🔍 [LocationScreen] Component mounted');
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const isNewSignup = await AsyncStorage.getItem('isNewSignup');
      
      console.log('🔍 [LocationScreen] Initial auth state:', {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        userId: userId || 'NO USER ID',
        isNewSignup: isNewSignup || 'NO SIGNUP FLAG'
      });
    };
    
    debugAuthState();
  }, []);

  // Helper to save location to backend
  const saveLocationToBackend = async (locationString) => {
    try {
      console.log('🔍 [LocationScreen] Starting location save process...');
      
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 [LocationScreen] Token retrieved:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      if (!token) {
        console.error('❌ [LocationScreen] No token found for location update');
        return;
      }
      
      const requestBody = { location: locationString };
      console.log('🔍 [LocationScreen] Request body:', requestBody);
      
      const response = await axios.put(
        `${API_BASE_URL}/auth/update`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );
      
      console.log('✅ [LocationScreen] Location saved successfully:', locationString);
      console.log('🔍 [LocationScreen] Backend response:', response.data);
      
      // Check if the response contains updated user data
      if (response.data && response.data.user) {
        console.log('🔍 [LocationScreen] User data updated in backend:', {
          userId: response.data.user._id,
          location: response.data.user.location,
          phone: response.data.user.phone
        });
      }
      
    } catch (err) {
      console.error('❌ [LocationScreen] Location update error:', err.response?.data || err);
      console.error('❌ [LocationScreen] Error status:', err.response?.status);
      console.error('❌ [LocationScreen] Error headers:', err.response?.headers);
    }
  };

  const handleLocationAccess = async () => {
    console.log('🔍 [LocationScreen] handleLocationAccess started');
    setIsLoading(true);
    
    try {
      // Check authentication state before proceeding
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      console.log('🔍 [LocationScreen] Pre-location auth state:', {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        userId: userId || 'NO USER ID'
      });
      
      // Request permission
      console.log('🔍 [LocationScreen] Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('🔍 [LocationScreen] Permission status:', status);
      
      if (status !== 'granted') {
        console.log('⚠️ [LocationScreen] Location permission denied, showing state selector');
        setIsLoading(false);
        setShowStateSelector(true);
        return;
      }

      // Get current position
      console.log('🔍 [LocationScreen] Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });
      console.log('🔍 [LocationScreen] Position obtained:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy
      });

      // Reverse geocode to get address
      console.log('🔍 [LocationScreen] Reverse geocoding...');
      const place = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      console.log('🔍 [LocationScreen] Geocoding result:', place);

      const addressData = place.length > 0 ? place[0] : null;
      
      setLocationData({
        coords: location.coords,
        address: addressData
      });

      // Log the location data to console
      console.log('📍 [LocationScreen] Location Data:', {
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          heading: location.coords.heading,
          speed: location.coords.speed
        },
        address: addressData,
        timestamp: location.timestamp
      });

      // Save location to backend
      if (addressData) {
        const locationString = `${addressData.region}`;
        console.log('🔍 [LocationScreen] Saving location to backend:', locationString);
        await saveLocationToBackend(locationString);
      } else {
        console.log('⚠️ [LocationScreen] No address data available to save');
      }

      // Simulate a brief delay to show the loading animation
      setTimeout(async () => {
        console.log('🔍 [LocationScreen] Starting navigation delay...');
        setIsLoading(false);
        
        // Check auth state again before navigation
        const finalToken = await AsyncStorage.getItem('token');
        const finalUserId = await AsyncStorage.getItem('userId');
        console.log('🔍 [LocationScreen] Pre-navigation auth state:', {
          hasToken: !!finalToken,
          tokenPreview: finalToken ? `${finalToken.substring(0, 20)}...` : 'NO TOKEN',
          userId: finalUserId || 'NO USER ID'
        });
        
        // Wait a bit more for authentication state to fully establish
        console.log('🔍 [LocationScreen] Waiting for auth state to establish before navigation...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay for better auth sync
        
        // Final auth check before navigation
        const navigationToken = await AsyncStorage.getItem('token');
        console.log('🔍 [LocationScreen] Final navigation auth check:', {
          hasToken: !!navigationToken,
          tokenPreview: navigationToken ? `${navigationToken.substring(0, 20)}...` : 'NO TOKEN'
        });
        
        // Navigate to main app using navigate instead of replace for better state sync
        console.log('🔍 [LocationScreen] Navigating to MainTabs...');
        navigation.navigate('MainTabs');
        console.log('✅ [LocationScreen] Navigation to MainTabs completed');
      }, 1500);

    } catch (error) {
      console.error('❌ [LocationScreen] Error getting location:', error);
      setIsLoading(false);
      setShowStateSelector(true);
    }
  };

  // Handler for when user selects a state manually
  const handleStateSelect = async (state) => {
    console.log('🔍 [LocationScreen] handleStateSelect started with state:', state);
    setShowStateSelector(false);
    setIsLoading(true);
    
    // Check auth state before proceeding
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');
    console.log('🔍 [LocationScreen] Manual selection auth state:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
      userId: userId || 'NO USER ID'
    });
    
    await saveLocationToBackend(state);
    setIsLoading(false);
    
    // Check auth state again after saving
    const postSaveToken = await AsyncStorage.getItem('token');
    const postSaveUserId = await AsyncStorage.getItem('userId');
    console.log('🔍 [LocationScreen] Post-save auth state:', {
      hasToken: !!postSaveToken,
      tokenPreview: postSaveToken ? `${postSaveToken.substring(0, 20)}...` : 'NO TOKEN',
      userId: postSaveUserId || 'NO USER ID'
    });
    
    // Wait a bit for authentication state to fully establish
    console.log('🔍 [LocationScreen] Waiting for auth state to establish before manual navigation...');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay for better auth sync
    
    // Final auth check before navigation
    const finalToken = await AsyncStorage.getItem('token');
    console.log('🔍 [LocationScreen] Final manual navigation auth check:', {
      hasToken: !!finalToken,
      tokenPreview: finalToken ? `${finalToken.substring(0, 20)}...` : 'NO TOKEN'
    });
    
    // Navigate to main app using navigate instead of replace for better state sync
    console.log('🔍 [LocationScreen] Navigating to MainTabs from manual selection...');
    navigation.navigate('MainTabs');
    console.log('✅ [LocationScreen] Manual navigation to MainTabs completed');
  };

  const handleStateCancel = () => {
    setShowStateSelector(false);
  };

  return (
    <>
      <OnboardingTemplate
        title="Allow us to access your location"
        subtitle="Enable location access to match with people nearby. You can change anytime."
        currentStep={15}
        totalSteps={15}
        onNext={handleLocationAccess}
        canProgress={!isLoading}
        showSkip={false}
        buttonText="Allow" 
      >
        <View style={styles.locationContainer}>
          <View style={styles.locationIconContainer}>
            <Image 
              source={require('../../../assets/loc.png')}
              style={styles.locationImage}
            />
          </View> 
        </View>
      </OnboardingTemplate>

      <LocationLoadingModal 
        visible={isLoading}
        title="Getting your location..."
        subtitle="Please wait while we access your location and find nearby matches"
      />
      <StateSelectorModal
        visible={showStateSelector}
        onSelect={handleStateSelect}
        onCancel={handleStateCancel}
      />
    </>
  );
};

export default LocationScreen;
