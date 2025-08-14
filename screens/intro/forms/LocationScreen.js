import React, { useState } from 'react';
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

  // Helper to save location to backend
  const saveLocationToBackend = async (locationString) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const requestBody = { location: locationString };
      await axios.put(
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
      console.log('✅ Location saved successfully:', locationString);
    } catch (err) {
      console.log('❌ Location update error:', err.response?.data || err);
    }
  };

  const handleLocationAccess = async () => {
    setIsLoading(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLoading(false);
        setShowStateSelector(true);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      // Reverse geocode to get address
      const place = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const addressData = place.length > 0 ? place[0] : null;
      
      setLocationData({
        coords: location.coords,
        address: addressData
      });

      // Log the location data to console
      console.log('📍 Location Data:', {
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
        await saveLocationToBackend(locationString);
      } else {
        console.log('⚠️ No address data available to save');
      }

      // Simulate a brief delay to show the loading animation
      setTimeout(async () => {
        setIsLoading(false);
        
        // Wait a bit more for authentication state to fully establish
        console.log('[LocationScreen] Waiting for auth state to establish before navigation...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay for better auth sync
        
        // Navigate to main app using navigate instead of replace for better state sync
        console.log('[LocationScreen] Navigating to MainTabs...');
        navigation.navigate('MainTabs');
      }, 1500);

    } catch (error) {
      console.error('Error getting location:', error);
      setIsLoading(false);
      setShowStateSelector(true);
    }
  };

  // Handler for when user selects a state manually
  const handleStateSelect = async (state) => {
    setShowStateSelector(false);
    setIsLoading(true);
    await saveLocationToBackend(state);
    setIsLoading(false);
    
    // Wait a bit for authentication state to fully establish
    console.log('[LocationScreen] Waiting for auth state to establish before manual navigation...');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay for better auth sync
    
    // Navigate to main app using navigate instead of replace for better state sync
    console.log('[LocationScreen] Navigating to MainTabs from manual selection...');
    navigation.navigate('MainTabs');
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
