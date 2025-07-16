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

const LocationScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [locationData, setLocationData] = useState(null);

  const handleLocationAccess = async () => {
    setIsLoading(true);
    
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Denied',
          'We need location access to match you with people nearby. You can enable this in your device settings.',
          [
            { text: 'Continue Anyway', onPress: () => navigation.replace('MainTabs') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        setIsLoading(false);
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
        const token = await AsyncStorage.getItem('token');
        const locationString = `${addressData.region}`;
        
        console.log(' Token:', token ? 'Present' : 'Missing');
        console.log(' Location string to save:', locationString);
        console.log('🌐 API URL:', `${API_BASE_URL}/auth/update`);
        
        try {
          const requestBody = { location: locationString };
          console.log('📤 Request body:', JSON.stringify(requestBody));
          
          const res = await axios.put(
            `${API_BASE_URL}/auth/update`,
            requestBody,
            { 
              headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}` 
              },
              timeout: 10000 // 10 second timeout
            }
          );
          
          console.log('📍 Location update response:', res.data);
          console.log(' Response status:', res.status);
          
          if (res.data && (res.data.success || res.data.message || res.status === 200)) {
            console.log('✅ Location saved successfully:', locationString);
          } else {
            console.log('⚠️ Location update failed:', res.data.error || 'Unknown error');
          }
        } catch (err) {
          console.log('❌ Location update error:', err.response?.data || err);
          console.log('❌ Error status:', err.response?.status);
          console.log('❌ Error message:', err.message);
          console.log('❌ Full error object:', JSON.stringify(err, null, 2));
          // Don't block navigation if location save fails
        }
      } else {
        console.log('⚠️ No address data available to save');
      }

      // Simulate a brief delay to show the loading animation
      setTimeout(() => {
        setIsLoading(false);
        // Navigate to main app
        navigation.replace('MainTabs');
      }, 1500);

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please check your device settings and try again.',
        [
          { text: 'Continue Anyway', onPress: () => navigation.replace('MainTabs') },
          { text: 'Try Again', onPress: () => setIsLoading(false) }
        ]
      );
      setIsLoading(false);
    }
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
    </>
  );
};

export default LocationScreen;
