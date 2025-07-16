import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';

const lifestyleOptions = [
  'Regular exercise', 'Smoking', 'Luxurious living', 'Drinking',
  'Travel-focused', 'Healthy eating', 'Family-oriented', 'Fitness enthusiast',
  'Health-conscious', 'Adventurous', 'Tech-savvy', 'Philanthropic',
  'Music lover', 'Cultural explorer', 'Budget-conscious', 'Movie Buff',
  'Career-focused'
];

const Lifestyle = ({ navigation }) => {
  const [selectedChoices, setSelectedChoices] = useState([
    'Regular exercise', 'Luxurious living', 'Drinking', 'Travel-focused', 'Healthy eating', 'Tech-savvy'
  ]);

  const toggleChoice = (choice) => {
    if (selectedChoices.includes(choice)) {
      setSelectedChoices(selectedChoices.filter(c => c !== choice));
    } else {
      setSelectedChoices([...selectedChoices, choice]);
    }
  };

  return (
    <View style={styles.container}>
      <TopHeader title="Lifestyle choices" onBack={() => navigation && navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected Choices */}
        <View style={styles.selectedChoicesContainer}>
          {selectedChoices.map(choice => (
            <View key={choice} style={styles.selectedChoiceTag}>
              <Text style={styles.selectedChoiceText}>{choice}</Text>
              <TouchableOpacity onPress={() => toggleChoice(choice)}>
                <Ionicons name="close" size={16} color="#fff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Text style={styles.addMoreText}>Add more</Text>
        {/* All Choices */}
        <View style={styles.choicesGrid}>
          {lifestyleOptions.filter(choice => !selectedChoices.includes(choice)).map(choice => (
            <TouchableOpacity
              key={choice}
              style={styles.choiceTag}
              onPress={() => toggleChoice(choice)}
            >
              <Text style={styles.choiceTagText}>{choice}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation && navigation.goBack()}
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
  selectedChoicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 16,
    marginLeft: 2,
  },
  selectedChoiceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EC066A',
    borderRadius: 90,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChoiceText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginRight: 4,
  },
  addMoreText: {
    color: '#fff',
    opacity: 0.7,
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 8,
    marginLeft: 2,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginLeft: 2,
  },
  choiceTag: {
    backgroundColor: '#222',
    borderRadius: 90,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  choiceTagText: {
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
    marginTop: 16,
    marginBottom: 56,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
});

export default Lifestyle;
