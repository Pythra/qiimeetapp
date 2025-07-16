import React, { useState } from 'react';
import { View } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import OptionItem from './OptionItem';
import styles from './onboardingStyles';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CurrentWorkScreen = ({ navigation }) => {
  const [work, setWork] = useState(null);
  const workOptions = [
    "Entrepreneur",
    "Freelancer",
    "Corporate worker",
    "Creative industry",
    "Self-employed", 
  ];

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const selectedCareer = workOptions[work];
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { career: selectedCareer },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update career response:', res.data);
      navigation.navigate('Photos');
    } catch (error) {
      console.error('Error updating career:', error);
      navigation.navigate('Photos'); // Optionally still navigate
    }
  };

  return (
    <OnboardingTemplate
      title="What is your current work or career?"
      subtitle="Select your profession to connect with others who share similar goals."
      currentStep={13}
      totalSteps={15}
      onNext={handleNext}
      canProgress={work !== null}
    >
      <View style={styles.optionsContainer}>
        {workOptions.map((option, index) => (
          <OptionItem
            key={index}
            label={option}
            selected={work === index}
            onPress={() => setWork(index)}
          />
        ))}
      </View>
    </OnboardingTemplate>
  );
};

export default CurrentWorkScreen;
