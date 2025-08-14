import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../env';
import wavyCheck from '../../assets/wavycheck.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const getResponsiveFontSize = (phoneSize, tabletSize = phoneSize) => isTablet ? tabletSize : phoneSize;
const getResponsiveSpacing = (phoneSpacing, tabletSpacing = phoneSpacing) => isTablet ? tabletSpacing : phoneSpacing;

const ProfileVerificationScreen = ({ onClose }) => {
const navigation = useNavigation();
const [isLoading, setIsLoading] = useState(false);

// Clear verification data for rejected users
const clearVerificationData = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'No authentication token found');
      return false;
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/clear-verification`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.success;
  } catch (error) {
    console.error('Error clearing verification data:', error);
    return false;
  }
};

// Handle start verification
const handleStartVerification = async () => {
  setIsLoading(true);
  
  try {
    // Check if user has rejected verification status and clear data
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (userResponse.data.success && userResponse.data.user.verificationStatus === 'rejected') {
        const cleared = await clearVerificationData();
        if (!cleared) {
          Alert.alert('Error', 'Failed to clear previous verification data');
          setIsLoading(false);
          return;
        }
      }
    }
    
    navigation.navigate('VerificationProcess');
  } catch (error) {
    console.error('Error starting verification:', error);
    Alert.alert('Error', 'Failed to start verification process');
  } finally {
    setIsLoading(false);
  }
};

  const VerificationIcon = () => (
    <View style={styles.iconContainer}>
      <Image
        source={wavyCheck}
        style={{ width: 104, height: 104 }}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <TopHeader  
        onBack={() => navigation.goBack()}
        close // Show X icon
      />
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >

        <VerificationIcon />

        <Text style={styles.title}>Verify your profile</Text>

        <Text style={styles.description}>
          To ensure a safe and authentic experience, we need to verify your identity. The process is simple and takes just a few minutes.
        </Text>

        <View style={styles.cardContainer}>
          <Text style={styles.phasesTitle}>You'll need to complete three phases:</Text>
          <View style={styles.phaseItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.phaseText}>Name & Email Verification</Text>
          </View>
          <View style={styles.phaseItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.phaseText}>Photo Verification</Text>
          </View>
          <View style={styles.phaseItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.phaseText}>ID Verification</Text>
          </View>
          <Text style={styles.finalDescription}>
            Once verified, you'll get full access to Qiimeet and can connect securely.
          </Text>
        </View> 
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          activeOpacity={0.8}
          onPress={handleStartVerification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Preparing...' : 'Start Verification'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop:32,
  },
  contentContainer: {
    paddingHorizontal: 16,
    maxWidth: isTablet ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: -24,
  },
  iconContainer: {
    marginBottom: getResponsiveSpacing(40, 50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: getResponsiveSpacing(12, 16),
    padding: 24,
    width: '100%',
    marginBottom: getResponsiveSpacing(20, 25),
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(20, 25),
    fontWeight: '600',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: getResponsiveFontSize(16, 18),
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(22, 25),
    marginBottom: 36,
    paddingHorizontal: 6,
  },
  phasesTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium, 
    marginBottom: getResponsiveSpacing(25, 30),
    fontWeight: '600',
  },
  phaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    marginRight: getResponsiveSpacing(16, 20),
  },
  phaseText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: getResponsiveFontSize(16, 18),
    fontFamily: FONTS.regular,
    flex: 1,
  },
  finalDescription: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: getResponsiveFontSize(16, 18),
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(22, 25),
    paddingHorizontal: getResponsiveSpacing(10, 20),
    marginTop: 16,
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingBottom: 24,
  },
  button: {
    backgroundColor: '#EC066A',
    borderRadius: 90,
    width: screenWidth * 0.87,
    height: screenHeight * 0.074,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.regular,
    letterSpacing: 0,
    lineHeight: 32,
  },
  buttonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
});

export default ProfileVerificationScreen;