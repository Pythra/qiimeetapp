import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Alert,
} from 'react-native';
import Colors from '../../../constants/Colors';
import CustomButton from '../../../constants/button';
import { FONTS } from '../../../constants/font';
import { TEXT_STYLES } from '../../../constants/text';
import { usePhoneNumber, formatPhoneNumber } from './phonenumber';
import { loginWithGoogle } from './googleSignin';
import { loginWithApple } from './apple';
import { loginWithFacebook } from './facebook';

const { width, height } = Dimensions.get('window');
const googleIcon = require('../../../assets/google.png');
const fbIcon = require('../../../assets/fb.png');
const appleIcon = require('../../../assets/apple.png');

const PhoneNumberScreen = ({ navigation }) => {
  const {
    phoneNumber, formattedNumber, error,
    handlePhoneChange, handleNext
  } = usePhoneNumber(navigation);

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
    <View style={styles.container}>
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
              maxLength={12}
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
            Ensure you have access to the number on WhatsApp as we will send a verification code there.
          </Text>
          <CustomButton 
            title="Next"
            onPress ={handleNext}
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
              onPress={() => navigation.navigate('Welcome')}
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
  closeButton: {
    alignSelf: 'flex-start',
    padding: 18,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.06,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 90,
    marginBottom: 12,
    width: '100%',
    height: height * 0.074,
    paddingHorizontal: 24, 
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
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 5,
    marginVertical: 4,
    marginTop: 5,
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
    width: '100%',
    marginTop: 20,
  },
  socialButton: {
    padding: 4,
    width: 40,
    height: 40,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  socialIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
});

export default PhoneNumberScreen;