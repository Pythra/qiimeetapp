import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import Colors from '../../../constants/Colors';
import CustomButton from '../../../constants/button';
import { FONTS } from '../../../constants/font';
import { TEXT_STYLES } from '../../../constants/text';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../../../env';



const { width, height } = Dimensions.get('window');
const googleIcon = require('../../../assets/google.png');
const fbIcon = require('../../../assets/fb.png');
const appleIcon = require('../../../assets/apple.png');

const PhoneNumberScreen = ({ navigation, route }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedNumber, setFormattedNumber] = useState('');
  const [error, setError] = useState('');
  
  // Get social login data from route params
  const socialLoginData = route?.params?.socialLoginData;
  const provider = route?.params?.provider;
  const isSignIn = route?.params?.isSignIn;

  // Check if we have social login data
  useEffect(() => {
    if (socialLoginData) {
      console.log('Social login data received:', socialLoginData);
      // You can pre-fill some fields or show different UI based on social login
    }
  }, [socialLoginData]);

  const formatPhoneNumber = (number) => {
    // Remove all non-digits
    const cleaned = number.replace(/\D/g, '');
    // Group numbers as 3-3-4
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const groups = [match[1], match[2], match[3]].filter(group => group);
      return groups.join(' ');
    }
    return cleaned;
  };

  const handlePhoneChange = (text) => {
    setError(''); // Clear error when user types
    const rawNumber = text.replace(/\D/g, '');
    
    // Remove leading zero if present
    const numberWithoutLeadingZero = rawNumber.startsWith('0') ? rawNumber.substring(1) : rawNumber;
    
    // Validate first digit for Nigerian numbers
    if (numberWithoutLeadingZero.length > 0) {
      const firstDigit = numberWithoutLeadingZero[0];
      if (!['7', '8', '9'].includes(firstDigit)) {
        setError('Invalid Phone Number');
      }
    }

    if (numberWithoutLeadingZero.length <= 10) {
      setPhoneNumber(numberWithoutLeadingZero);
      setFormattedNumber(formatPhoneNumber(numberWithoutLeadingZero));
    }
  };

  const sendOTP = async (phoneNumber) => {
    try {
      // Prepare the request body
      const requestBody = { phoneNumber };
      
      // If we have social login data, include it
      if (socialLoginData) {
        requestBody.socialLoginData = socialLoginData;
        requestBody.provider = provider;
        requestBody.isSignIn = isSignIn;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (data.success && data.pinId) {
        // Store pinId for verification
        await AsyncStorage.setItem('otpPinId', data.pinId);
        
        // Use the processed phone number from the backend response if available
        const phoneNumberToUse = data.phoneNumber || phoneNumber;
        
        // Store social login data for verification screen
        if (socialLoginData) {
          await AsyncStorage.setItem('socialLoginData', JSON.stringify(socialLoginData));
          await AsyncStorage.setItem('socialProvider', provider);
          await AsyncStorage.setItem('isSocialSignIn', isSignIn ? 'true' : 'false');
        }
        
        navigation.navigate('Auth', { 
          screen: 'VerificationCode',
          params: { 
            phoneNumber: phoneNumberToUse,
            socialLoginData: socialLoginData,
            provider: provider,
            isSignIn: isSignIn
          }
        });
      } else {
        Alert.alert('Error', data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send verification code');
    }
  };





  const handleNext = async () => {
    if (phoneNumber.length === 10) {
      // Bypass OTP sending for testing
      navigation.navigate('Auth', {
        screen: 'VerificationCode',
        params: { phoneNumber, pinId: 'dummy-pin-id' },
      });
    }
  };

  // Handle social media button clicks
  const handleSocialLogin = (provider) => {
    switch (provider) {
      case 'google':
        // Navigate back to signup screen for Google login
        navigation.navigate('SignUp');
        break;
      case 'apple':
        // TODO: Implement Apple login
        Alert.alert('Coming Soon', 'Apple login will be available soon');
        break;
      case 'facebook':
        // TODO: Implement Facebook login
        Alert.alert('Coming Soon', 'Facebook login will be available soon');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={TEXT_STYLES.header}>
            {socialLoginData ? 'Complete your profile' : 'What\'s your phone number?'}
          </Text>
          {socialLoginData && (
            <Text style={[TEXT_STYLES.explanation, { marginBottom: 20, textAlign: 'center' }]}>
              Welcome! Please provide your phone number to complete your {isSignIn ? 'sign in' : 'registration'}.
            </Text>
          )}
          <View style={[styles.inputContainer, error && styles.inputContainerError]}>
            <View style={styles.countryCodeContainer}>
              <Image 
                source={require('../../../assets/nig.png')} 
                style={{ width: 21, height: 20}} 
              />
              <Text style={styles.countryCodeText}>+234</Text>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="phone-pad"
              value={formattedNumber}
              onChangeText={handlePhoneChange}
              maxLength={12} // Increased to account for spaces
            />
          </View>
          {error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconContainer}>
                <Text style={styles.errorIcon}>!</Text>
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <Text style={TEXT_STYLES.explanation}>
            {socialLoginData 
              ? 'We\'ll text you a code to verify your phone number and complete your profile.'
              : 'We\'ll text you a code to verify you\'re really you. Message and data rates may apply.'
            }
          </Text>
          <CustomButton 
            title="Next"
            onPress={handleNext}
            disabled={phoneNumber.length < 10}
            style={{ marginTop: 22 }}
          />
          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={TEXT_STYLES.dividerText}>or sign in with</Text>
            <View style={styles.orLine} />
          </View>
          <View style={styles.socialIconsContainer}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
            >
              <View style={styles.socialIconCircle}>
                <Image 
                  source={googleIcon} 
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('apple')}
            >
              <View style={styles.socialIconCircle}>
                <Image 
                  source={appleIcon} 
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('facebook')}
            >
              <View style={styles.socialIconCircle}>
                <Image 
                  source={fbIcon} 
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  ); 
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.06, // 6% padding on each side (100% - 88% = 12% ÷ 2 = 6%)
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 32,
  },
  inputContainer: {
    flexDirection: 'row', 
    backgroundColor: '#1E1E1E',
    borderRadius: 90,
    marginBottom: 12,
    width: '100%',
    height: height * 0.074, 
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  countryCodeText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.5,
  },
  divider: {
    width: 1,
    backgroundColor: '#fff',
    marginHorizontal: 8, 
    opacity: 0.5,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: FONTS.regular,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 15,
    marginVertical:4,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#fff',
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32, 
  },
  socialButton: {
    padding: 4,
  },
  socialIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  errorIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EC066A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  errorIcon: {
    color: '#121212',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: '#EC066A',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  inputContainerError: {
    borderColor: '#EC066A',
    borderWidth: 1,
  },
});

export default PhoneNumberScreen;