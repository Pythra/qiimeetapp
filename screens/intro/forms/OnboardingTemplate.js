import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../../../constants/font';
import { TEXT_STYLES } from '../../../constants/text';
import CustomButton from '../../../constants/button';
import { Ionicons } from '@expo/vector-icons';


const OnboardingTemplate = ({
  children,
  title,
  subtitle,
  bottomText,
  currentStep,
  totalSteps,
  showSkip = true,
  onNext,
  canProgress = true,
  buttonText = 'Next'
}) => {
  const navigation = useNavigation();

  // Set status bar style
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('light-content', true);
      StatusBar.setBackgroundColor('#121212', true);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#121212" 
        translucent={false}
      />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          
      <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        {showSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={async () => {
              // Wait a bit for authentication state to fully establish
              console.log('[OnboardingTemplate] Waiting for auth state to establish before skip navigation...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Navigate to main app using navigate instead of replace for better state sync
              console.log('[OnboardingTemplate] Navigating to MainTabs from skip...');
              navigation.navigate('MainTabs');
            }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${(currentStep/totalSteps) * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {title && <Text style={TEXT_STYLES.header}>{title}</Text>}
        {subtitle && <Text style={TEXT_STYLES.bigexplanation}>{subtitle}</Text>}
        {children}
      </View>

      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
      
      <View style={styles.bottomSection}>
        {bottomText && <Text style={styles.bottomText}>{bottomText}</Text>}
        <CustomButton
          title={buttonText}
          onPress={onNext}
          disabled={!canProgress}
        />
        {buttonText === 'Allow' && (
          <Text style={styles.whyText}>Why do we need this?</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 12,
    fontWeight: '700',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '300',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#333333',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  progress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    height: 133,
    zIndex: 1,
  },
  bottomSection: {
    paddingHorizontal: 24, 
    zIndex: 2,
  },
  bottomText: {
    fontSize: 12,
    color: '#999999',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  whyText: {
    color: '#ec066a',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 16,
    fontFamily: FONTS.regular,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
  },
});

export default OnboardingTemplate;