import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import TopHeader from '../../components/TopHeader';
import CustomButton from '../../constants/button';
import { FONTS } from '../../constants/font';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ReligionFilter = ({ navigation }) => {
  const [selected, setSelected] = useState('');
  const religions = [
    'Christian',
    'Muslim',
    'Traditional/Spiritual',
    'Others',
    'Agnostic',
    'Atheist'
  ];

  return (
    <View style={styles.container}>
      <TopHeader 
        title="Religion" 
        onBack={() => navigation.goBack()}
      />

      {selected && (
        <View style={styles.selectedContainer}>
          <TouchableOpacity 
            style={styles.selectedChip}
            onPress={() => setSelected('')}
          >
            <Text style={styles.selectedChipText}>{selected}</Text>
            <Ionicons name="close" size={20} color="#fff" style={styles.closeIcon} />
          </TouchableOpacity>
        </View>
      )}

      {selected && <Text style={styles.sectionTitle}>Others</Text>}
      <View style={styles.optionsContainer}>
        {religions
          .filter(religion => religion !== selected)
          .map((religion, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.optionButton}
            onPress={() => setSelected(religion)}
          >
            <Text style={styles.optionText}>
              {religion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.doneButton,
            selected ? styles.doneButtonActive : styles.doneButtonInactive
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 32,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
    marginTop: 10,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 90,
  },
  selectedChipText: {
    color: '#fff',
    marginRight: 5,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  closeIcon: {
    marginLeft: 2,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingBottom: 10,
    fontFamily: FONTS.regular,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 90,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 35,
    backgroundColor: '#000',
  },
  doneButton: {
    borderRadius: 90,
    width: width * 0.87,
    height: height * 0.074,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  doneButtonActive: {
    backgroundColor: '#EC066A',
  },
  doneButtonInactive: {
    backgroundColor: '#4A4A4A',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.regular,
    letterSpacing: 0,
    lineHeight: 32,
  },
});

export default ReligionFilter;
