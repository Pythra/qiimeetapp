import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const VerificationInProgress = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.navigate('PremiumScreen', { verificationSubmitted: true });
  };

  return (
    <View style={styles.container}> 
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="clock" size={104} color="#f29339" />
        </View>

        <Text style={styles.title}>Verification in Progress</Text>
        
        <Text style={styles.description}>
          We've received your ID, and it's now under review. This might take a few minutes.
        </Text>

        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>

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
    backgroundColor: '#000',
    paddingTop: 71,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 150, // Increased padding to avoid button overlap
  },
  iconContainer: { 
    width: 115,
    height: 115,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    color: '#888',
    fontSize: 16,
    lineHeight: 24,
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

export default VerificationInProgress;
