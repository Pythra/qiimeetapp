import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';

const TermsOfService = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <TopHeader title="Terms of Service" onBack={() => navigation && navigation.goBack()} />
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Terms of Service</Text>
        <Text style={styles.subHeading}>Last Updated: {new Date().toLocaleDateString()}</Text>
        
        <Text style={styles.sectionHeading}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing and using Qiimeet, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
        </Text>
        
        <Text style={styles.sectionHeading}>2. Use License</Text>
        <Text style={styles.text}>
          Permission is granted to temporarily download one copy of Qiimeet for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not modify or copy the materials.
        </Text>
        
        <Text style={styles.sectionHeading}>3. User Accounts</Text>
        <Text style={styles.text}>
          You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password.
        </Text>
        
        <Text style={styles.sectionHeading}>4. Prohibited Uses</Text>
        <Text style={styles.text}>
          You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts. You may not violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances.
        </Text>
        
        <Text style={styles.sectionHeading}>5. Content Policy</Text>
        <Text style={styles.text}>
          Users are prohibited from posting content that is illegal, harmful, threatening, abusive, defamatory, vulgar, obscene, invasive of another's privacy, hateful, or racially or ethnically objectionable.
        </Text>
        
        <Text style={styles.sectionHeading}>6. Privacy Policy</Text>
        <Text style={styles.text}>
          Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
        </Text>
        
        <Text style={styles.sectionHeading}>7. Subscription and Payments</Text>
        <Text style={styles.text}>
          Some features of Qiimeet may require a paid subscription. All fees are non-refundable unless otherwise stated. Subscription fees will be charged to your payment method on a recurring basis.
        </Text>
        
        <Text style={styles.sectionHeading}>8. Termination</Text>
        <Text style={styles.text}>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </Text>
        
        <Text style={styles.sectionHeading}>9. Disclaimer</Text>
        <Text style={styles.text}>
          The information on this service is provided on an "as is" basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions and terms relating to our service.
        </Text>
        
        <Text style={styles.sectionHeading}>10. Limitation of Liability</Text>
        <Text style={styles.text}>
          In no event shall Qiimeet, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
        </Text>
        
        <Text style={styles.sectionHeading}>11. Governing Law</Text>
        <Text style={styles.text}>
          These Terms shall be interpreted and governed by the laws of the jurisdiction in which Qiimeet operates, without regard to its conflict of law provisions.
        </Text>
        
        <Text style={styles.sectionHeading}>12. Changes to Terms</Text>
        <Text style={styles.text}>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
        </Text>
        
        <Text style={styles.sectionHeading}>13. Contact Information</Text>
        <Text style={styles.text}>
          If you have any questions about these Terms of Service, please contact us at legal@qiimeet.com or through our support channels within the app.
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

export default TermsOfService;