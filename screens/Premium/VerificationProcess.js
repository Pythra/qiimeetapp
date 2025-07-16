import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopHeader from '../../components/TopHeader';
import CustomButton from '../../constants/button';
import { useNavigation } from '@react-navigation/native';
import PhaseContainer from './components/PhaseContainer';
import VerificationSuccessModal from './components/VerificationSuccessModal';
import { FONTS } from '../../constants/font';
import IdentityVerification from './IdentityVerification';
import PhotoVerification from './PhotoVerification';

const VerificationProcess = () => {
  const navigation = useNavigation();
  const hiddenInputRef = useRef(null);
  const [formStep, setFormStep] = useState(1); // This tracks form progress
  const [currentPhase] = useState(1); // Phase always stays at 1
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false); // Track input focus
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    verificationCode: ''
  });

  // Only blink cursor if input is focused
  useEffect(() => {
    let interval;
    if (isInputFocused) {
      interval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);
    } else {
      setShowCursor(true);
    }
    return () => clearInterval(interval);
  }, [isInputFocused]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    console.log('handleNext called. formData:', formData);
    console.log('Current form step:', formStep);
    console.log('Is valid:', isCurrentPhaseValid());
    
    if (formStep === 1) {
      const firstName = formData.firstName?.trim();
      const lastName = formData.lastName?.trim();
      
      if (!firstName || !lastName) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
    } else if (formStep === 2) {
      const email = formData.email?.trim();
      
      if (!email) {
        Alert.alert('Error', 'Please enter your email address');
        return;
      }
      if (!isValidEmail(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
    }
  
    if (formStep < 3) {
      console.log('Moving to next step:', formStep + 1);
      setFormStep(formStep + 1);
    }
  };
 
  const handleVerify = () => {
    if (formData.verificationCode.length === 6) {
      setShowSuccessModal(true);
    } else {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
    }
  };

  const handleVerificationComplete = () => {
    setShowSuccessModal(true);
  };

  const handleNavigateToPhoto = () => {
    navigation.navigate('PhotoVerification');
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isCurrentPhaseValid = () => {
    console.log('Validating phase:', formStep, 'FormData:', formData); // Add this for debugging
    
    switch (formStep) {
      case 1:
        const firstNameValid = formData.firstName && formData.firstName.trim().length > 0;
        const lastNameValid = formData.lastName && formData.lastName.trim().length > 0;
        console.log('Phase 1 validation:', { firstNameValid, lastNameValid }); // Debug log
        return firstNameValid && lastNameValid;
      
      case 2:
        const emailValid = formData.email && formData.email.trim().length > 0 && isValidEmail(formData.email.trim());
        console.log('Phase 2 validation:', { emailValid }); // Debug log
        return emailValid;
      
      case 3:
        const codeValid = formData.verificationCode && formData.verificationCode.trim().length === 6;
        console.log('Phase 3 validation:', { codeValid }); // Debug log
        return codeValid;
      
      default:
        return false;
    }
  };

  const renderPhase1 = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.formPaginationContainer}>
        {[1, 2, 3].map(index => (
          <View
            key={index}
            style={[
              styles.formPaginationDash,
              formStep === index && styles.formPaginationDashActive
            ]}
          />
        ))}
      </View>
      <Text style={styles.phaseTitle}>What's your name?</Text>
      <Text style={styles.phaseSubtitle}>
Please provide your First, Middle and Last Name as it is on your government-issued ID.
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={formData.firstName}
          onChangeText={(text) => updateFormData('firstName', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Middle Name"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={formData.middleName}
          onChangeText={(text) => updateFormData('middleName', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={formData.lastName}
          onChangeText={(text) => updateFormData('lastName', text)}
        />
      </View>
    </View>
  );

  const renderPhase2 = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.formPaginationContainer}>
        {[1, 2, 3].map(index => (
          <View
            key={index}
            style={[
              styles.formPaginationDash,
              formStep === index && styles.formPaginationDashActive
            ]}
          />
        ))}
      </View>
      <Text style={styles.phaseTitle}>What's your email address?</Text>
      <Text style={[styles.phaseSubtitle, styles.emailSubtitle]}>
We'll send you a code to verify your email address.       </Text>

      <View style={[styles.inputContainer, styles.emailInputContainer]}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderPhase3 = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.formPaginationContainer}>
        {[1, 2, 3].map(index => (
          <View
            key={index}
            style={[
              styles.formPaginationDash,
              formStep === index && styles.formPaginationDashActive
            ]}
          />
        ))}
      </View>
      <Text style={styles.phaseTitle}>Enter your verification code</Text>
      
      <TouchableOpacity 
        activeOpacity={1}
        style={styles.codeContainer}
        onPress={() => {
          hiddenInputRef.current?.focus();
          setIsInputFocused(true); // Start blinking when focused
        }}
      >
        {[...Array(6)].map((_, index) => (
          <View key={index} style={styles.dash}>
            <Text style={styles.codeText}>
              {formData.verificationCode[index] ||
                (isInputFocused && index === formData.verificationCode.length && showCursor ? '|' : '')}
            </Text>
            <View style={styles.dashUnderline} />
          </View>
        ))}
        <TextInput
          ref={hiddenInputRef}
          style={styles.hiddenInput}
          value={formData.verificationCode}
          onChangeText={(text) => {
            if (text.length <= 6 && /^\d*$/.test(text)) {
              updateFormData('verificationCode', text);
            }
          }}
          keyboardType="numeric"
          maxLength={6}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
      </TouchableOpacity>
      <View style={styles.resendContainer}>
        <Text style={styles.emailSubtitle}>
          We have sent a verification code to your email address. Write the same here.
        </Text> 
      </View>
      <VerificationSuccessModal 
        visible={showSuccessModal}
        onContinue={() => setShowSuccessModal(false)}
        onNavigate={handleNavigateToPhoto}
      />
    </View>
  );

  const renderCurrentPhase = () => {
    switch (formStep) {
      case 1:
        return renderPhase1();
      case 2:
        return renderPhase2();
      case 3:
        return renderPhase3();
      default:
        return renderPhase1();
    }
  };

  const getButtonTitle = () => {
    switch (formStep) {
      case 3:
        return 'Verify';
      default:
        return 'Next';
    }
  };

  const handleButtonPress = () => {
    console.log('handleButtonPress called. formStep:', formStep, 'formData:', formData);
    if (formStep === 3) {
      // Only show modal if code is valid and 6 digits
      if (formData.verificationCode.length === 6) {
        setShowSuccessModal(true);
      } else {
        handleVerify();
      }
    } else {
      handleNext();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader onBack={() => navigation.goBack()} />
      {console.log('isCurrentPhaseValid:', isCurrentPhaseValid(), 'formStep:', formStep, 'formData:', formData)}
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <PhaseContainer currentPhase={1} />
        
        <View style={styles.paginationContainer}>
          {[1, 2, 3].map(index => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                formStep === index && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
        
        {renderCurrentPhase()}
        
        <View style={styles.footer}>
          <CustomButton 
            title={getButtonTitle()}
            onPress={handleButtonPress}
            disabled={!isCurrentPhaseValid()}
            backgroundColor={!isCurrentPhaseValid() ? '#4a4a4a' : '#ec066a'}
          />
          {formStep === 3 && (
            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't get a code? </Text>
              <TouchableOpacity>
                <Text style={styles.resendCodeText}>Resend code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    paddingHorizontal: 22,
    width: '100%',
    flex: 1,
  },
  phaseContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 28,
  },
  phaseTitle: {
    color: '#fff',
    fontSize: 32,
    fontFamily: FONTS.bold,
    marginBottom: 12,
    marginTop: -16,
    fontWeight: '700',
  },
  phaseSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    marginBottom: 28,
  },
  emailSubtitle: {
    fontSize: 12,
    marginBottom: 20,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  inputContainer: {
    width: '100%', 
  },
  emailInputContainer: {
    marginTop: 0,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 90,
    padding: 16,
    paddingHorizontal: 24,
    height: 62,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    marginTop: -8,
    padding: 16,
    alignSelf: 'center',
    width: '94%', 
  },
  dash: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 40,
  },
  dashUnderline: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    borderRadius: 8,
  },
  codeText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.medium,
    minWidth: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    top: 0,
    left: 0,
    zIndex: 1,
  },
  footer: {  
    marginBottom:16,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center', 
    marginTop: -8,
  },
  resendText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  resendCodeText: {
    color: '#ec066a',
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  formPaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 42,
  },
  formPaginationDash: {
    width: 24,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  formPaginationDashActive: {
    backgroundColor: '#fff',
  },
});

export default VerificationProcess;