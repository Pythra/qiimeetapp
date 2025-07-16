import React, { useState } from 'react';
import { View } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import OptionItem from './OptionItem';
import styles from './onboardingStyles';
import { ScrollView } from 'react-native-gesture-handler';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FutureKidsScreen = ({ navigation }) => {
  const [kidsChoice, setKidsChoice] = useState(null);
  const options = [
    'Have kids',
    'Don\'t have kids',
    'Don\'t want kids',
    'Open to kids',
    'Want kids',
    'Not sure'
  ];

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const selectedKids = options[kidsChoice];
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { kids: selectedKids },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update kids response:', res.data);
      navigation.navigate('ZodiacSign');
    } catch (error) {
      console.error('Error updating kids:', error);
      navigation.navigate('ZodiacSign'); // Optionally still navigate
    }
  };

  return (
    <OnboardingTemplate
      title="Do you have kids or plan to in the future?"
      currentStep={8}
      totalSteps={15}
      onNext={handleNext}
      canProgress={kidsChoice !== null}
      subtitle="Share your family preferences and future plans to match with like-minded people."
    >
      <ScrollView>
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <OptionItem
            key={index}
            label={option}
            selected={kidsChoice === index}
            onPress={() => setKidsChoice(index)}
          />
        ))}
      </View>
      </ScrollView>
    </OnboardingTemplate>
  );
};

export default FutureKidsScreen;
