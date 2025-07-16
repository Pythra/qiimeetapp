import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import TopHeader from '../../components/TopHeader';
import CustomButton from '../../constants/button';
import { FONTS } from '../../constants/font';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const PersonalityFilter = ({ navigation }) => {
  const [selectedTraits, setSelectedTraits] = useState([]);
  const traits = [
    'Introvert',
    'Extrovert',
    'Ambitious',
    'Creative',
    'Adventurous',
    'Intellectual',
    'Empathetic',
    'Organized',
    'Spontaneous',
    'Humorous'
  ];

  const toggleTrait = (trait) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(item => item !== trait));
    } else {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };

  return (
    <View style={styles.container}>
      <TopHeader 
        title="Personality" 
        onBack={() => navigation.goBack()}
      />

      {selectedTraits.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedTraits.map((trait, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.selectedChip}
              onPress={() => toggleTrait(trait)}
            >
              <Text style={styles.selectedChipText}>{trait}</Text>
              <Ionicons name="close" size={20} color="#fff" style={styles.closeIcon} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedTraits.length > 0 && <Text style={styles.sectionTitle}>Others</Text>}
      <View style={styles.optionsContainer}>
        {traits
          .filter(trait => !selectedTraits.includes(trait))
          .map((trait, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.optionButton}
            onPress={() => toggleTrait(trait)}
          >
            <Text style={styles.optionText}>
              {trait}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.doneButton,
            selectedTraits.length > 0 ? styles.doneButtonActive : styles.doneButtonInactive
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

export default PersonalityFilter;
