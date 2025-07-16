import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';

const faqData = [
  {
    question: 'Why do I need to verify my identity?',
    answer: 'Verification helps us keep the Qiimeet community safe by ensuring every user is real and serious about making genuine connections.'
  },
  {
    question: 'What documents are accepted for ID verification?',
    answer: 'We accept government-issued IDs like National ID, Driver\’s License, International Passport, or Voter\'s Card.'
  },
  {
    question: 'How does matching work on Qiimeet?',
    answer: 'Qiimeet matches you based on your preferences (age, gender, location), profile content, and activity. Our goal is to help you build meaningful one-on-one connections.'
  },
  {
    question: 'Why can I only connect with one person at a time?',
    answer: 'Qiimeet is designed for meaningful connections. You use coins to send requests and can chat with one person at a time. End a chat to connect with someone new.'
  },
  {
    question: 'What happens if my match doesn\'t accept the request?',
    answer: 'If your connection request isn\’t accepted within the countdown period, the connection resets and your slot is available again.'
  },
  {
    question: 'Is my personal information safe?',
    answer: 'Yes. Qiimeet uses strong encryption and follows strict data privacy practices. Your data is never shared without your consent.'
  },
];

const FAQs = ({ navigation }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <View style={styles.container}>
      <TopHeader title="FAQs" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {faqData.map((item, idx) => (
          <View key={item.question} style={[styles.accordion, idx !== 0 && { marginTop: 12 }]}> 
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setOpenIndex(openIndex === idx ? null : idx)}
            >
              <Text style={styles.question}>{item.question}</Text>
              <MaterialIcons
                name={openIndex === idx ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color="rgba(255, 255, 255, 0.5)"
              />
            </TouchableOpacity>
            {openIndex === idx && (
              <View style={styles.accordionBody}>
                <Text style={styles.answer}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  accordion: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: {
    color: '#fff',
    lineHeight: 24,
    fontSize: 16,
    fontFamily: FONTS.regular,
    flex: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  accordionBody: {
    marginTop: 8,
  },
  answer: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
});

export default FAQs;