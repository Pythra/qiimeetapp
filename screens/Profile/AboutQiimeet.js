import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';

const About = ({ navigation }) => (
  <View style={styles.container}>
    <TopHeader title="About Qiimeet" onBack={() => navigation && navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Welcome to Qiimeet!</Text>
      <Text style={styles.text}>
        Qiimeet is a modern dating and social connection platform designed to help you find meaningful relationships and genuine connections. Whether you're looking for a life partner, a long-term relationship, or new friends, Qiimeet provides a safe and engaging space to meet like-minded people.
      </Text>
      <Text style={styles.text}>
        Our app features a unique matching system, profile verification, and a variety of ways to express your interests, lifestyle, and goals. We believe in fostering authentic conversations and building a community where everyone feels valued and respected.
      </Text>
      <Text style={styles.text}>
        Qiimeet is committed to your privacy and safety. Our team works continuously to ensure a secure environment and a positive experience for all users.
      </Text>
      <Text style={styles.text}>
        Thank you for choosing Qiimeet. Start your journey to meaningful connections today!
      </Text>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  heading: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
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

export default About;
