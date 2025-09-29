import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../constants/Colors';
import { TEXT_STYLES } from '../../../constants/text';
import { FONTS } from '../../../constants/font'; 
import CustomButton from '../../../constants/button';
import OnboardingTemplate from './OnboardingTemplate';
import { API_BASE_URL } from '../../../env';
import { useAuth } from '../../../components/AuthContext';

const VerificationCodeScreen = ({ route, navigation }) => {
  const [code, setCode] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(23); // Initial countdown
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { phoneNumber, pinId, isPhoneUpdate } = route.params;
  const { login } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('VerificationCodeScreen params:', route.params);
    console.log('Phone number received:', phoneNumber);
    console.log('Pin ID received:', pinId);
  }, [route.params, phoneNumber, pinId]);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Verify OTP using backend API
const verifyOTP = async () => {
  setError('');
  if (code.length !== 6) {
    setError('Please enter a 6-digit code');
    return;
  }
  setIsVerifying(true);
  try {
    if (isPhoneUpdate) {
      // Handle phone number update verification
      const response = await fetch(`${API_BASE_URL}/auth/verify-phone-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pinId, 
          pin: code, 
          phoneNumber 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Phone number updated successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Account') }
        ]);
      } else {
        setError(data.error || 'Verification failed. Please try again.');
      }
    } else {
      // Handle regular OTP verification
      console.log('Sending OTP verification request:', { pinId, pin: code, phoneNumber });
      
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pinId, 
          pin: code, 
          phoneNumber 
        }),
      });
      
      const data = await response.json();
      console.log('OTP verification response:', data);
      
      if (data.success && data.token && data.user) {
        // Use AuthContext login function to properly set user data
        const loginSuccess = await login(data.token, data.user);
        if (loginSuccess) {
          // Wait a moment to ensure all data is properly loaded
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (route.params && route.params.fromSignIn) {
            navigation.navigate('MainTabs');
          } else {
            navigation.navigate('Welcome');
          }
        } else {
          setError('Login failed. Please try again.');
        }
      } else if (data.success && data.token) {
        // Handle case where user data is missing but token is present
        console.warn('User data missing from response, attempting to fetch user profile...');
        
        try {
          // Fetch user profile using the token
          const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${data.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const loginSuccess = await login(data.token, userData);
            if (loginSuccess) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              if (route.params && route.params.fromSignIn) {
                navigation.navigate('MainTabs');
              } else {
                navigation.navigate('Welcome');
              }
            } else {
              setError('Login failed. Please try again.');
            }
          } else {
            setError('Failed to fetch user profile. Please try again.');
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError('Failed to fetch user profile. Please try again.');
        }
      } else {
        setError(data.error || 'Verification failed. Please try again.');
      }
    }
  } catch (error) {
    console.error('Verification error:', error);
    setError('Verification failed. Please try again.');
  }
  setIsVerifying(false);
};

// Resend OTP using backend API
const handleResendCode = async () => {
  if (!canResend || isResending) return;
  setIsResending(true);
  setError('');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    
    const data = await response.json();
    
    if (data.success && data.pinId) {
      await AsyncStorage.setItem('pinId', data.pinId);
      setCountdown(40);
      setCanResend(false);
      Alert.alert('Success', 'New verification code sent!');
    } else {
      Alert.alert('Error', data.error || 'Failed to resend code');
    }
  } catch (error) {
    console.error('Resend error:', error);
    Alert.alert('Error', 'Failed to resend code');
  }
  
  setIsResending(false);
};

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
         <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>
        <View style={styles.content}>
          <Text style={TEXT_STYLES.header}>Enter your verification code</Text>
          <View style={styles.codeContainer}>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError(''); // Clear error when user types
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <View style={styles.dashesContainer}>
              {[...Array(6)].map((_, index) => (
                <View key={index} style={styles.dash}>
                  <Text style={[
                    styles.codeText,
                    index === code.length && showCursor && styles.cursorText
                  ]}>
                    {code[index] || (index === code.length && showCursor ? '|' : '')}
                  </Text>
                  <View style={[
                    styles.dashUnderline, 
                    error && styles.dashUnderlineError
                  ]} />
                </View>
              ))}
            </View>
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
           We have sent a verification code to your phone number. Write the same here.
          </Text>
          {/* Replace Verify button with loader if verifying */}
          {isVerifying ? (
            <ActivityIndicator size="large" color="#EC066A" style={{ marginTop: 22 }} />
          ) : (
            <CustomButton 
              title="Verify"
              onPress={verifyOTP}
              disabled={code.length !== 6}
              style={{ marginTop: 22 }}
            />
          )}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't get a code? </Text>
            <TouchableOpacity 
              onPress={handleResendCode}
              disabled={!canResend || isResending}
            >
              {isResending ? (
                <ActivityIndicator size="small" color="#EC066A" />
              ) : (
                <Text style={[
                  styles.resendLink,
                  (!canResend || isResending) && styles.resendLinkDisabled
                ]}>
                  {canResend ? 'Resend code' : `Resend Code in ${countdown}s`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
    backgroundColor: '#121212', 
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22, 
    alignItems: 'center',
  },
   backButton: {
    padding:16,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '300',
  }, 
  codeContainer: {
    width: '100%',
    position: 'relative',
    height: 60,
    marginTop: 6,
  },
  codeInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    zIndex: 1,
    fontFamily: FONTS.regular,
  },
  dashesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
  },
  dash: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dashUnderline: {
    width: '100%',
    height: 2,
    backgroundColor: '#fff',
    opacity: 0.5,
    marginTop: 4,
  },
  dashUnderlineError: { 
  },
  codeText: {
    fontSize: 24,
    color: '#fff',
    fontFamily: FONTS.regular,
    minWidth: 16,
    textAlign: 'center',
  },
  cursorText: {
    opacity: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', 
    paddingHorizontal: 4,
    marginBottom: 10,
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
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: '#EC066A',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  resendText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  resendLink: {
    color: '#EC066A',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  resendLinkDisabled: {
    color: '#666',
  },
});

export default VerificationCodeScreen;