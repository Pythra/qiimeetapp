import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';
import { MaterialIcons } from '@expo/vector-icons';

const aboutOptions = [
  { label: 'About Qiimeet', route: 'AboutQiimeet' },
  { label: 'Privacy Policy', route: 'PrivacyPolicy' },
  { label: 'Terms of Service', route: 'TermsOfService' },
];

const About = ({ navigation }) => {
  const handleBack = () => navigation.goBack();
  return (
    <View style={styles.container}>
      <TopHeader title="About" onBack={handleBack} />
      <View style={styles.content}>
        {aboutOptions.map((option, idx) => (
          <TouchableOpacity
            key={option.label}
            style={[styles.optionRow, idx !== 0 && { marginTop: 16 }]}
            onPress={
              option.route === 'AboutQiimeet'
                ? () => navigation.navigate('AboutQiimeet')
                : undefined // Add navigation for other routes if needed
            }
            activeOpacity={0.7}
          >
            <Text style={styles.optionLabel}>{option.label}</Text>
            <MaterialIcons name="keyboard-arrow-right" size={28} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 20, 
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding:16,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
});

export default About;

// Reminder: Add AboutQiimeet to your navigation stack if not already present.
