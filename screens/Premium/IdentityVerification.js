import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopHeader from '../../components/TopHeader';
import { useNavigation } from '@react-navigation/native';
import PhaseContainer from './components/PhaseContainer';
import { FONTS } from '../../constants/font';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import idIcon from '../../assets/idicon.png';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const getResponsiveFontSize = (phoneSize, tabletSize = phoneSize) => isTablet ? tabletSize : phoneSize;

const IdentityVerification = () => {
  const navigation = useNavigation();

  const verificationTips = [
    'Ensure the image is clear and legible',
    'Make sure all corners of the ID are visible',
    'Ensure the name on the ID matches your profile details',
  ];

  return (
    <View style={styles.container}>
      <ScrollView>
        <TopHeader onBack={() => navigation.goBack()} />
        <View style={styles.contentContainer}>
          <PhaseContainer currentPhase={3} />

          <View style={styles.mainContent}>
            <View style={styles.avatarContainer}>
              <Image
                source={idIcon}
                style={{ width: 104, height: 104}}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Verify your identity</Text>
            <Text style={styles.description}>
              Upload your ID card to verify your identity and secure your account.
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
                style={styles.uploadButton}
                onPress={() => {navigation.navigate('DocumentUpload')}} // Add your upload logic here
              >
                <Text style={styles.buttonText}>Continue</Text>
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
    marginTop: 24, 
    marginBottom: 16,
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
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    paddingVertical: 16,
    width: '100%',
    marginBottom: 56,
  },
  tipsTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 25,
    alignSelf: 'center',
    fontWeight: '600',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', 
  },
  bulletPoint: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    marginRight: 16,
    marginTop: 8, // Adjust this value to best align with first line of text
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  footer: {
    paddingBottom: 56,
    width: '100%',
  },
  uploadButton: {
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

export default IdentityVerification;
