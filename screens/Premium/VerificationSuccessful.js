import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import { Feather } from '@expo/vector-icons';  // Change this import

const VerificationSuccessful = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.navigate('PremiumScreen', { verificationCompleted: true });
  };

  return (
    <View style={styles.container}>
      <TopHeader onBack={handleBack} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={{
            backgroundColor: '#6EC531', 
            borderRadius: 52,
            width: 104,
            height: 104,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Feather 
              name="check" 
              size={70}
              color="#000" 
            />
          </View>
        </View>

        <Text style={styles.title}>Verification Successful</Text>
        
        <Text style={styles.description}>
You're all set! Your verification is complete. You can now start connecting, chatting, and exploring potential matches.        </Text>

        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleBack}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 150, // Increased padding to avoid button overlap
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: '#888',
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: '#ec066a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 90,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 56,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.medium,
  },
});

export default VerificationSuccessful;
