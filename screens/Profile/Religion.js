import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';

const religionOptions = [
  'Christian',
  'Muslim',
  'Traditional/Spiritual',
  'Agnostic',
  'Atheist',
];

const Religion = ({ navigation }) => {
  const [selected, setSelected] = useState(null);

  return (
    <View style={styles.container}>
      <TopHeader title="Religion" onBack={() => navigation && navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {religionOptions.map((option, idx) => (
          <TouchableOpacity
            key={option}
            style={[styles.optionRow, idx !== 0 && { marginTop: 12 }]}
            onPress={() => setSelected(idx)}
            activeOpacity={0.8}
          >
            <Text style={styles.optionLabel}>{option}</Text>
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
            navigation.navigate('EditProfile', { religon: religionOptions[selected] });
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
    paddingHorizontal: 8,
  },
  scrollContent: {
    paddingHorizontal: 8,
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
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
});

export default Religion;
