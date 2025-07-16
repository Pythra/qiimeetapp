import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopHeader from '../../components/TopHeader';
import { useNavigation } from '@react-navigation/native';
import PhaseContainer from './components/PhaseContainer';
import { FONTS } from '../../constants/font';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import profIcon from '../../assets/proficon.png';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const getResponsiveFontSize = (phoneSize, tabletSize = phoneSize) => isTablet ? tabletSize : phoneSize;

const PhotoVerification = () => {
  const navigation = useNavigation();

  const verificationTips = [
    'Make sure your face is well-lit and not obscured.',
    'Look directly at the camera, and avoid wearing glasses or hats.',
    'Ensure your selfie is recent and matches your profile photo.'
  ];

  return (
    <View style={styles.container}>
      
      <ScrollView>
        <TopHeader onBack={() => navigation.goBack()} />
        <View style={styles.contentContainer} >
          <PhaseContainer currentPhase={2} />

          <View style={styles.mainContent}>
            <View style={styles.avatarContainer}>
              <Image
                source={profIcon}
                style={{ width: 104, height: 104, borderRadius: 60 }}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Verify your photos</Text>
            <Text style={styles.description}>
              To help us confirm your identity, we need you to complete a quick photo verification.
            </Text>

            <View style={styles.cardContainer}>
              <Text style={styles.tipsTitle}>Tips for a successful verification:</Text>
              {verificationTips.map((tip, index) => (
                <View key={index} style={styles.tipRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.takePhotoButton}
                onPress={() => navigation.navigate('CameraVerification')}
              >
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
  },
  contentContainer: {
    paddingHorizontal: 24,
    maxWidth: '100%', 
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
  },
  avatarContainer: {
    width: 104,
    height: 104, 
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24, 
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center', 
    lineHeight: 24,
    marginBottom: 32,
  },
  cardContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  tipsTitle: {
    color: '#fff',
    fontSize: 16, 
    marginBottom: 25,
    alignSelf: 'center',
    fontWeight: '600',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align bullet to top of text
    marginBottom: 2,
  },
  bulletPoint: {
    width: 5,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    marginRight: 16,
    marginTop: 10, // Push bullet down to align with first line of text
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 24,
    fontSize: 16,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  footer: { 
    paddingBottom: 56,
    width: '100%',
  },
  takePhotoButton: {
    backgroundColor: '#ec066a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 90,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default PhotoVerification;
