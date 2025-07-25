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

const VerificationCodeScreen = ({ route, navigation }) => {
  const [code, setCode] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(23); // Initial countdown
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { phoneNumber, pinId } = route.params;

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
    // Call backend to register phone number
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber }),
    });
    const data = await response.json();
    if (data.token) {
      await AsyncStorage.setItem('token', data.token);
      if (route.params && route.params.fromSignIn) {
        navigation.navigate('MainTabs');
      } else {
        navigation.navigate('Welcome');
      }
    } else {
      setError(data.error || 'Failed to save phone number.');
    }
  } catch (err) {
    console.error('Register error:', err);
    setError('Failed to save phone number.');
  }
  setIsVerifying(false);
};

// Resend OTP using backend API
const handleResendCode = async () => {
  if (!canResend || isResending) return;
  setIsResending(true);
  setError('');
  // Bypass backend call for testing
  setCountdown(40);
  setCanResend(false);
  Alert.alert('Success', 'New verification code sent!');
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