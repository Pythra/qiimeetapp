import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ImageBackground,
  StatusBar,
  Dimensions
} from 'react-native';
import { FONTS } from '../../constants/font';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../../constants/button';

const { width, height } = Dimensions.get('window');

const googleIcon = require('../../assets/google.png');
const fbIcon = require('../../assets/fb.png');
const appleIcon = require('../../assets/apple.png');

const LandingScreen = () => {
  const navigation = useNavigation();

  const onCreateAccount = () => {
    navigation.navigate('Auth', { screen: 'Signup' });
  };

  const onSignIn = () => {
    navigation.navigate('Auth', { screen: 'SignIn' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#121212"
        translucent={false} />
      
      {/* Background Image */}
      <ImageBackground 
        source={require('../../assets/sky.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
        imageStyle={styles.backgroundImageStyle}
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)', 'rgba(0,0,0,0.99)']}
          locations={[0, 0.6, 1]}
          style={styles.gradient}
        />
        
        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo} 
            />
            <Text style={styles.tagline}>Find love, make it last.</Text>
          </View>
          
          {/* Button Section */}
          <View style={styles.buttonContainer}>
            <CustomButton 
              title="Create an Account"
              onPress={onCreateAccount}
            />
            
            {/* Sign In Button */}
            <TouchableOpacity 
              style={styles.signInButton} 
              activeOpacity={0.8}
              onPress={onSignIn}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
            
            {/* Social Sign Up Section */}
            <View style={styles.socialContainer}>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or sign up with</Text>
                <View style={styles.divider} />
              </View>
              
              {/* Social Auth Buttons */}
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton}>
                  <View style={styles.socialIconCircle}>
                    <Image source={googleIcon} style={styles.socialIcon} resizeMode="contain" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <View style={styles.socialIconCircle}>
                    <Image source={appleIcon} style={styles.socialIcon} resizeMode="contain" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <View style={styles.socialIconCircle}>
                    <Image source={fbIcon} style={styles.socialIcon} resizeMode="contain" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Terms Section */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By signing up for Qiimeet, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Services</Text>
              {'. Learn how we process your data in our '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
              {' and '}
              <Text style={styles.termsLink}>Cookies Policy</Text>
              {'.'}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Add dark background to prevent white flash
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    width: '104%', // Zoom in
    height: '104%', // Zoom in
    left: '-4%', // Push left
    top: '-6%', // Push up slightly
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: height * 0.34, 
    paddingBottom: height * 0.13, // Adjusted to fit the new layout
  },
  logoContainer: {
    alignItems: 'center',
    height: height * 0.19,
    paddingHorizontal: width * 0.15, // Add horizontal padding of 15% on each side
  },
  logo: {
    width: width * 0.47, // Try a much larger width
    height: height * 0.0462,
  },
  tagline: {
    color: 'white',
    opacity: 0.8, 
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 42,
    fontWeight: '400',  
    alignSelf: 'center',
    letterSpacing: 0,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',  
  },
  signInButton: {
    borderColor: '#EC066A',
    borderWidth: 1,
    borderRadius: 90,
    width: width * 0.87,
    height: height * 0.074,
    justifyContent: 'center',
    alignItems: 'center', 
  },
  signInText: {
    color: '#EC066A',
    fontSize: 23,
    lineHeight: 32,
    fontWeight: '600',
        fontFamily: FONTS.semiBold,
  },
  socialContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.37,    
    marginVertical: 27,
    marginBottom: 24,
    
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  dividerText: {
    color: 'white',
    paddingHorizontal: 10,
    fontSize: 12,
    opacity: 0.8,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    width: '100%',
  },
  socialButton: {
    padding: 3,
  },
  socialIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  termsContainer: {
    paddingHorizontal: 35,
    marginTop: 20,
    alignItems: 'center',
  },
  termsText: {
    color: 'white',
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    fontWeight: '400',
    lineHeight: 20,
  },
  termsLink: {
    color: '#FF3D7F',
    fontWeight: '500',
  },  
});

export default LandingScreen;