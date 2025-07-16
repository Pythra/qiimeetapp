import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';

const educationLevels = [
  'Primary Education',
  'Secondary Education',
  'National Diploma (ND)',
  'Higher National Diploma (HND)',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate Degree (Ph.D.)',
];

const Education = ({ navigation }) => {
  const [selected, setSelected] = useState(null);

  return (
    <View style={styles.container}>
      <TopHeader title="Educational level" onBack={() => navigation && navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {educationLevels.map((level, idx) => (
          <TouchableOpacity
            key={level}
            style={[styles.optionRow, idx !== 0 && { marginTop: 16 }]}
            onPress={() => setSelected(idx)}
            activeOpacity={0.8}
          >
            <Text style={styles.optionLabel}>{level}</Text>
            <Ionicons
              name={selected === idx ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={selected === idx ? '#EC066A' : '#fff'}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: selected === null ? '#292929' : '#ec066a' }]}
        disabled={selected === null}
        onPress={() => {
          if (selected !== null) {
            navigation.navigate('EditProfile', { education: educationLevels[selected] });
          }
        }}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  doneButton: {
    backgroundColor: '#EC066A',
    borderRadius: 90,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 56,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
});

export default Education;