import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';

const careerOptions = [
  'Entrepreneur',
  'Freelancer',
  'Corporate Worker',
  'Creative Industry',
  'Self Employed',
];

const Career = ({ navigation }) => {
  const [selected, setSelected] = useState(null);
  // If coming from EditProfile with a pre-selected value, set it
  React.useEffect(() => {
    if (navigation && navigation.getState) {
      const routes = navigation.getState().routes;
      const editProfileRoute = routes && routes.find(r => r.name === 'EditProfile');
      if (editProfileRoute && editProfileRoute.params && editProfileRoute.params.career) {
        const idx = careerOptions.findIndex(opt => opt === editProfileRoute.params.career);
        if (idx !== -1) setSelected(idx);
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      <TopHeader title="Career" onBack={() => navigation && navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {careerOptions.map((option, idx) => (
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
            navigation.navigate('EditProfile', { career: careerOptions[selected] });
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

export default Career;