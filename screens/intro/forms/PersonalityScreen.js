import React, { useState } from 'react';
import { View } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import OptionItem from './OptionItem';
import styles from './onboardingStyles';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PersonalityScreen = ({ navigation }) => {
  const [personality, setPersonality] = useState(null);
  const personalityTypes = [
    "Introverted",
    "Extroverted",
    "Ambivert",
    "Not sure"
  ];

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const selectedPersonality = personalityTypes[personality];
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { personality: selectedPersonality },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update personality response:', res.data);
      navigation.navigate('Religion');
    } catch (error) {
      console.error('Error updating personality:', error);
      navigation.navigate('Religion'); // Optionally still navigate
    }
  };

  return (
    <OnboardingTemplate
      title="How would you describe your personality?"      
      subtitle="Choose traits that best describe you and how you connect"

      currentStep={11}
      totalSteps={15}
      onNext={handleNext}
      canProgress={personality !== null}
    >
      <View style={styles.optionsContainer}>
        {personalityTypes.map((type, index) => (
          <OptionItem
            key={index}
            label={type}
            selected={personality === index}
            onPress={() => setPersonality(index)}
          />
        ))}
      </View>
    </OnboardingTemplate>
  );
};

export default PersonalityScreen;
