import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, StatusBar, Alert
} from 'react-native';
import { FONTS } from '../../../constants/font';
import { TEXT_STYLES } from '../../../constants/text';
import CustomButton from '../../../constants/button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../env';
import { sendOTP, formatPhoneNumber } from '../signup/phonenumber';
import { loginWithGoogle } from '../signup/googleSignin';
import { loginWithApple } from '../signup/apple';
import { loginWithFacebook } from '../signup/facebook';

const { width, height } = Dimensions.get('window');
const googleIcon = require('../../../assets/google.png');
const fbIcon = require('../../../assets/fb.png');
const appleIcon = require('../../../assets/apple.png');

const SignInScreen = ({ navigation }) => {
  // Use local state for phone number
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [formattedNumber, setFormattedNumber] = React.useState('');
  const [error, setError] = React.useState('');

  const handlePhoneChange = (text) => {
    setError('');
    const rawNumber = text.replace(/\D/g, '');
    const numberWithoutLeadingZero = rawNumber.startsWith('0') ? rawNumber.substring(1) : rawNumber;
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

  // Sign in handler: only allow if phone number exists
  const handleSignIn = async () => {
    if (phoneNumber.length === 10) {
      try {
        // Fetch all users from admin endpoint
        const usersRes = await fetch(`${API_BASE_URL}/admin/users`);
        const usersData = await usersRes.json();
        let exists = false;
        if (usersData.success && Array.isArray(usersData.users)) {
          exists = usersData.users.some(
            user => (user.phoneNumber || '').replace(/^0/, '') === phoneNumber
          );
        }
        if (!exists) {
          Alert.alert('Error', 'Phone number not found. Please check your number or sign up.');
          return;
        }
        // If exists, send OTP
        const otpResult = await sendOTP(phoneNumber);
        if (otpResult.pinId) {
          await AsyncStorage.setItem('pinId', otpResult.pinId);
          
          // Use the processed phone number from the backend response if available
          const phoneNumberToUse = otpResult.phoneNumber || phoneNumber;
          
          navigation.navigate('Auth', {
            screen: 'VerificationCode',
            params: { phoneNumber: phoneNumberToUse, pinId: otpResult.pinId, fromSignIn: true },
          });
        } else {
          Alert.alert('Error', otpResult.message || 'Failed to send OTP');
        }
      } catch (err) {
        console.log('OTP send error:', err);
        Alert.alert('Error', 'Failed to send OTP');
      }
    }
  };

  // Social login handlers
  const handleSocialLogin = (provider) => {
    switch (provider) {
      case 'google':
        loginWithGoogle(navigation);
        break;
      case 'apple':
        loginWithApple(navigation);
        break;
      case 'facebook':
        loginWithFacebook(navigation);
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          </View>

          <Text style={styles.bigExplanation}>Enter your phone number</Text>

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
              maxLength={12}
            />
          </View>
          <Text style={TEXT_STYLES.explanation}>
            We'll text you a code to verify you're really you. Message and data rates may apply.
          </Text>
          <CustomButton 
            title="Sign In"
            onPress={handleSignIn}
            disabled={phoneNumber.length < 10}
            style={{ marginTop: 22 }}
          />
          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={TEXT_STYLES.dividerText}>or continue with</Text>
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
          <TouchableOpacity 
            style={styles.signupLink} 
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupBoldText}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    marginTop: height * 0.02,
  },
  logo: {
    width: 150,
    height: 40,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 32,
    fontFamily: FONTS.regular,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    opacity: 0.7,
  },
  headerText: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 90,
    marginBottom: 12,
    width: '100%',
    height: height * 0.074,
    paddingHorizontal: 24,
    // paddingVertical: 16, // Removed to prevent cut-off
    alignItems: 'center',
  },
  inputContainerError: {
    borderColor: '#EC066A',
    borderWidth: 1,
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
    marginLeft: 5,
  },
  divider: {
    width: 1,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    opacity: 0.5,
    height: 20,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16, 
    fontFamily: FONTS.regular,
    paddingVertical: 0, // Added to fix Android cut-off
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center', includeFontPadding: false } : {}),
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginVertical: 16, // Reduced from 24
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
    gap: 24, // Reduced from 32
    width: '100%',
    marginTop: 12, // Reduced from 20
  },
  socialButton: {
    padding: 4,
    width: 48, // Reduced from 60
    height: 48, // Reduced from 60
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  socialIconCircle: {
    width: 40, // Reduced from 50
    height: 40, // Reduced from 50
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  signupLink: {
    marginTop: 'auto',
    marginBottom: 24, // Reduced from 32
  },
  signupText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  signupBoldText: {
    color: '#EC066A', // Changed from '#fff' to pink
    fontFamily: FONTS.bold,
  },
  bigExplanation: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginLeft: 8,
    opacity: 0.5
  },
});

export default SignInScreen;
