import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';

const PrivacyPolicy = ({ navigation }) => (
  <View style={styles.container}>
    <TopHeader title="Privacy Policy" onBack={() => navigation && navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Qiimeet Privacy Policy</Text>
      <Text style={styles.text}>
        Welcome to Qiimeet! Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our app.
      </Text>
      <Text style={styles.subheading}>1. Information We Collect</Text>
      <Text style={styles.text}>
        We may collect information you provide directly, such as your name, email, photos, and profile details. We also collect usage data and device information.
      </Text>
      <Text style={styles.subheading}>2. How We Use Your Information</Text>
      <Text style={styles.text}>
        We use your information to personalize your experience, improve our services, and keep Qiimeet safe. We may use your data for analytics and communication.
      </Text>
      <Text style={styles.subheading}>3. Sharing Your Information</Text>
      <Text style={styles.text}>
        We do not sell your personal information. We may share data with trusted partners for service delivery, or as required by law.
      </Text>
      <Text style={styles.subheading}>4. Data Security</Text>
      <Text style={styles.text}>
        We implement security measures to protect your data. However, no method of transmission over the internet is 100% secure.
      </Text>
      <Text style={styles.subheading}>5. Changes to This Policy</Text>
      <Text style={styles.text}>
        We may update this Privacy Policy from time to time. We will notify you of any significant changes.
      </Text>
      <Text style={styles.text}>
        If you have questions, contact us at privacy@qiimeet.com.
      </Text>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  heading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    fontFamily: FONTS.regular,
  },
  subheading: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 6,
    fontFamily: FONTS.regular,
  },
  text: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 8,
    fontFamily: FONTS.regular,
  },
});

export default PrivacyPolicy;
