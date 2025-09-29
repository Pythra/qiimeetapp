import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';

const PrivacyPolicy = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <TopHeader title="Privacy Policy" onBack={() => navigation && navigation.goBack()} />
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.subHeading}>Last Updated: {new Date().toLocaleDateString()}</Text>
        
        <Text style={styles.sectionHeading}>1. Information We Collect</Text>
        <Text style={styles.text}>
          We collect information you provide directly to us, such as when you create an account, complete your profile, or communicate with us. This may include your name, email address, phone number, photos, age, location, interests, and preferences.
        </Text>
        
        <Text style={styles.sectionHeading}>2. How We Use Your Information</Text>
        <Text style={styles.text}>
          We use the information we collect to provide, maintain, and improve our services, including matching you with potential connections, facilitating communication between users, and ensuring platform safety and security.
        </Text>
        
        <Text style={styles.sectionHeading}>3. Information Sharing</Text>
        <Text style={styles.text}>
          We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with service providers who assist us in operating our platform.
        </Text>
        
        <Text style={styles.sectionHeading}>4. Data Security</Text>
        <Text style={styles.text}>
          We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
        </Text>
        
        <Text style={styles.sectionHeading}>5. Your Rights</Text>
        <Text style={styles.text}>
          You have the right to access, update, or delete your personal information. You can also control your privacy settings and choose what information to share with other users on our platform.
        </Text>
        
        <Text style={styles.sectionHeading}>6. Cookies and Tracking</Text>
        <Text style={styles.text}>
          We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and provide personalized content and advertisements.
        </Text>
        
        <Text style={styles.sectionHeading}>7. Children's Privacy</Text>
        <Text style={styles.text}>
          Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
        </Text>
        
        <Text style={styles.sectionHeading}>8. Changes to This Policy</Text>
        <Text style={styles.text}>
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
        </Text>
        
        <Text style={styles.sectionHeading}>9. Contact Us</Text>
        <Text style={styles.text}>
          If you have any questions about this privacy policy, please contact us at privacy@qiimeet.com or through our support channels within the app.
        </Text>
      </ScrollView>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  heading: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: FONTS.regular,
  },
  subHeading: {
    color: '#888',
    fontSize: 14,
    marginBottom: 24,
    fontFamily: FONTS.regular,
  },
  sectionHeading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    fontFamily: FONTS.regular,
  },
  text: {
    color: '#bbb',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: FONTS.regular,
  },
});

export default PrivacyPolicy;