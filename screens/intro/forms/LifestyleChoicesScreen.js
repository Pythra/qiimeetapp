import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import Colors from '../../../constants/Colors';
import { FONTS } from '../../../constants/font';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';

// Simple event bus for lifestyle choice updates
const lifestyleEventBus = {
  listeners: new Set(),
  emit(choice) {
    this.listeners.forEach(listener => listener(choice));
  },
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

const LifestyleChoicesScreen = ({ navigation }) => {
  const [selectedChoices, setSelectedChoices] = useState([]);

  const lifestyleOptions = [
    'Regular exercise', 'Smoking', 'Luxurious living', 'Drinking',
    'Travel-focused', 'Healthy eating', 'Family-oriented', 'Fitness enthusiast',
    'Health-conscious', 'Adventurous', 'Tech-savvy', 'Philanthropic',
    'Music lover', 'Cultural explorer', 'Budget-conscious', 'Movie Buff',
    'Career-focused'
  ];

  useEffect(() => {
    const loadSavedChoices = async () => {
      try {
        const savedChoices = await AsyncStorage.getItem('userLifestyleChoices');
        if (savedChoices) {
          setSelectedChoices(JSON.parse(savedChoices));
        }
      } catch (error) {
        console.error('Error loading choices:', error);
      }
    };
    loadSavedChoices();
  }, []);

  // Add listener for removed choices
  React.useEffect(() => {
    const unsubscribe = lifestyleEventBus.subscribe((removedChoice) => {
      setSelectedChoices(prev => prev.filter(c => c !== removedChoice));
    });
    return () => unsubscribe();
  }, []);

  const toggleChoice = async (choice) => {
    try {
      let newChoices;
      if (selectedChoices.includes(choice)) {
        newChoices = selectedChoices.filter(c => c !== choice);
      } else {
        newChoices = [...selectedChoices, choice];
      }
      setSelectedChoices(newChoices);
      await AsyncStorage.setItem('userLifestyleChoices', JSON.stringify(newChoices));
    } catch (error) {
      console.error('Error saving choice:', error);
    }
  };

  const handleDisplayChoices = () => {
    navigation.navigate('DisplayLifestyleChoices');
  };

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { lifestyle: selectedChoices },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update lifestyle response:', res.data);
      navigation.navigate('FutureKids');
    } catch (error) {
      console.error('Error updating lifestyle:', error);
      navigation.navigate('FutureKids'); // Optionally still navigate
    }
  };

  return (
    <OnboardingTemplate
      title="What are your lifestyle choices?"
      subtitle="Choose what defines your daily life and values to find a compatible match."
      currentStep={5}
      totalSteps={8}
      onNext={handleNext}
      canProgress={selectedChoices.length > 0}
    >
      {selectedChoices.length > 0 && (
        <View style={styles.viewSelectionsContainer}>
          <TouchableOpacity onPress={handleDisplayChoices}>
            <Text style={styles.viewSelectionsText}>View selections</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={handleDisplayChoices}
          >
            <View style={styles.innerCircle}>
              <Text style={styles.counterText}>{selectedChoices.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.choicesContainer}>
          {lifestyleOptions
            .filter(choice => !selectedChoices.includes(choice))
            .map((choice, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.choiceButton]}
                onPress={() => toggleChoice(choice)}
              >
                <Text style={styles.choiceButtonText}>{choice}</Text>
              </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </OnboardingTemplate>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  choicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingBottom: 20, // Add padding at bottom for better scrolling
  },
  choiceButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#222',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedChoiceButton: {
    backgroundColor:  Colors.primary,
  },
  choiceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  viewSelectionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 15,
    float: 'right',
    justifyContent: 'flex-end',
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  viewSelectionsText: {
    color: '#FFFFFF',
    opacity: 0.6,
    marginRight: 8,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});

export { lifestyleEventBus };
export default LifestyleChoicesScreen;