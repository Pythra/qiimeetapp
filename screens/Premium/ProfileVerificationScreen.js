import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import { useNavigation } from '@react-navigation/native';
import wavyCheck from '../../assets/wavycheck.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const getResponsiveFontSize = (phoneSize, tabletSize = phoneSize) => isTablet ? tabletSize : phoneSize;
const getResponsiveSpacing = (phoneSpacing, tabletSpacing = phoneSpacing) => isTablet ? tabletSpacing : phoneSpacing;

const ProfileVerificationScreen = ({ onClose }) => {
const navigation = useNavigation();

  const VerificationIcon = () => (
    <View style={styles.iconContainer}>
      <Image
        source={wavyCheck}
        style={{ width: 104, height: 104 }}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <TopHeader  
        onBack={() => navigation.goBack()}
        close // Show X icon
      />
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >

        <VerificationIcon />

        <Text style={styles.title}>Verify your profile</Text>

        <Text style={styles.description}>
          To ensure a safe and authentic experience, we need to verify your identity. The process is simple and takes just a few minutes.
        </Text>

        <View style={styles.cardContainer}>
          <Text style={styles.phasesTitle}>You'll need to complete three phases:</Text>
          <View style={styles.phaseItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.phaseText}>Name & Email Verification</Text>
          </View>
          <View style={styles.phaseItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.phaseText}>Photo Verification</Text>
          </View>
          <View style={styles.phaseItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.phaseText}>ID Verification</Text>
          </View>
          <Text style={styles.finalDescription}>
            Once verified, you'll get full access to Qiimeet and can connect securely.
          </Text>
        </View> 
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('VerificationProcess')}
        >
          <Text style={styles.buttonText}>Start Verification</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop:32,
  },
  contentContainer: {
    paddingHorizontal: 16,
    maxWidth: isTablet ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: -24,
  },
  iconContainer: {
    marginBottom: getResponsiveSpacing(40, 50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: getResponsiveSpacing(12, 16),
    padding: 24,
    width: '100%',
    marginBottom: getResponsiveSpacing(20, 25),
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(20, 25),
    fontWeight: '600',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: getResponsiveFontSize(16, 18),
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(22, 25),
    marginBottom: 36,
    paddingHorizontal: 6,
  },
  phasesTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium, 
    marginBottom: getResponsiveSpacing(25, 30),
    fontWeight: '600',
  },
  phaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    marginRight: getResponsiveSpacing(16, 20),
  },
  phaseText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: getResponsiveFontSize(16, 18),
    fontFamily: FONTS.regular,
    flex: 1,
  },
  finalDescription: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: getResponsiveFontSize(16, 18),
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(22, 25),
    paddingHorizontal: getResponsiveSpacing(10, 20),
    marginTop: 16,
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingBottom: 24,
  },
  button: {
    backgroundColor: '#EC066A',
    borderRadius: 90,
    width: screenWidth * 0.87,
    height: screenHeight * 0.074,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.regular,
    letterSpacing: 0,
    lineHeight: 32,
  },
});

export default ProfileVerificationScreen;