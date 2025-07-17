import React, { useState } from 'react';
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
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';
import { API_BASE_URL } from '../../../env';

// Ensure Buffer is available globally (for some environments)
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Helper: base64url encode (no padding, +/ replaced)
function base64UrlEncode(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper: generate PKCE values
const generatePKCE = async () => {
  // Generate a 32-byte random array
  const randomBytes = new Uint8Array(32);
  Crypto.getRandomValues(randomBytes);

  // Convert to base64 string
  const verifier = base64UrlEncode(Buffer.from(randomBytes).toString('base64'));

  // SHA256 hash and base64url encode
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  const challenge = base64UrlEncode(hash);

  return { verifier, challenge };
};

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'qiimeet',
  path: 'auth'
});

// AWS Cognito Configuration
const discovery = {
  authorizationEndpoint: 'https://us-east-1satk1s7rf.auth.us-east-1.amazoncognito.com/oauth2/authorize',
  tokenEndpoint: 'https://us-east-1satk1s7rf.auth.us-east-1.amazoncognito.com/oauth2/token',
};

const cognitoConfig = {
  clientId: '15iaae67g5l5ri9allt7f866',
  redirectUri: AuthSession.makeRedirectUri({
    useProxy: true,
    scheme: 'qiimeet'
  }),
  responseType: 'code',
  scopes: ['openid', 'email', 'phone'],
  additionalParameters: {
    identity_provider: 'Google',
  },
  usePKCE: true,
};

const { width, height } = Dimensions.get('window');
const googleIcon = require('../../../assets/google.png');
const fbIcon = require('../../../assets/fb.png');
const appleIcon = require('../../../assets/apple.png');

const PhoneNumberScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedNumber, setFormattedNumber] = useState('');
  const [error, setError] = useState('');

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
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const data = await response.json();
      
      if (data.success && data.pinId) {
        // Store pinId for verification
        await AsyncStorage.setItem('otpPinId', data.pinId);
        navigation.navigate('Auth', { 
          screen: 'VerificationCode',
          params: { phoneNumber: phoneNumber }
        });
      } else {
        Alert.alert('Error', data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send verification code');
    }
  };

  // Google Authentication Function
  const loginWithGoogle = async () => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });
      
      // Generate PKCE values
      const { verifier, challenge } = await generatePKCE();
      await AsyncStorage.setItem('codeVerifier', verifier);
      
      const request = new AuthSession.AuthRequest({
        clientId: cognitoConfig.clientId,
        scopes: cognitoConfig.scopes,
        redirectUri: redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          ...cognitoConfig.additionalParameters,
          code_challenge: challenge,
          code_challenge_method: 'S256',
        },
      });

      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success' && result.params.code) {
        const tokenResponse = await exchangeCodeForTokens(result.params.code, verifier);
        
        if (tokenResponse.access_token) {
          // Store tokens securely
          await AsyncStorage.setItem('accessToken', tokenResponse.access_token);
          await AsyncStorage.setItem('idToken', tokenResponse.id_token);
          await AsyncStorage.setItem('refreshToken', tokenResponse.refresh_token);
          
          // Get user info from the token
          const userInfo = await getUserInfo(tokenResponse.access_token);
          
          // Navigate to the welcome screen
          navigation.navigate('Welcome'); // Changed from 'Home' to 'Welcome'
        }
      } else {
        console.warn('Google login cancelled or failed', result);
        Alert.alert('Login Failed', 'Google authentication was cancelled or failed');
      }
    } catch (error) {
      console.error('Detailed Google login error:', error);
      Alert.alert('Error', 'Failed to authenticate with Google');
    }
  };

  // Exchange authorization code for tokens
  const exchangeCodeForTokens = async (code, codeVerifier) => {
    try {
      if (!code || !codeVerifier) {
        throw new Error('Missing code or code verifier');
      }

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: cognitoConfig.clientId,
        code: code,
        redirect_uri: cognitoConfig.redirectUri,
        code_verifier: codeVerifier,
      });

      console.log('Token exchange params:', params.toString());

      const response = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const tokenData = await response.json();
      console.log('Token exchange response:', tokenData);
      
      if (!response.ok) {
        throw new Error(tokenData.error_description || 'Token exchange failed');
      }
      
      return tokenData;
    } catch (error) {
      console.error('Detailed token exchange error:', error);
      throw error;
    }
  };

  // Get user information using access token
  const getUserInfo = async (accessToken) => {
    try {
      const response = await fetch('https://us-east-1satk1s7rf.auth.us-east-1.amazoncognito.com/oauth2/userInfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const userInfo = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      
      console.log('User info:', userInfo);
      return userInfo;
    } catch (error) {
      console.error('Get user info error:', error);
      throw error;
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
        loginWithGoogle();
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
          <Text style={TEXT_STYLES.header}>What's your phone number?</Text>
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
            We'll text you a code to verify you're really you. Message and data rates may apply.
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