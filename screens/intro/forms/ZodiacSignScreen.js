import React, { useState } from 'react';
import { View } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import OptionItem from './OptionItem';
import styles from './onboardingStyles';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ZodiacSignScreen = ({ navigation }) => {
  const [zodiacSign, setZodiacSign] = useState(null);
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const selectedZodiac = signs[zodiacSign];
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { zodiac: selectedZodiac },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update zodiac response:', res.data);
      navigation.navigate('EducationLevel');
    } catch (error) {
      console.error('Error updating zodiac:', error);
      navigation.navigate('EducationLevel'); // Optionally still navigate
    }
  };

  return (
    <OnboardingTemplate
      title="What's your zodiac sign?"
      currentStep={9}
      totalSteps={15}
      onNext={handleNext}
      canProgress={zodiacSign !== null}
      subtitle="Let others know your star sign and see who aligns with your energy."
    >
      <View style={styles.optionsContainer}>
        {signs.map((sign, index) => (
          <OptionItem
            key={index}
            label={sign}
            selected={zodiacSign === index}
            onPress={() => setZodiacSign(index)}
          />
        ))}
      </View>
    </OnboardingTemplate>
  );
};

export default ZodiacSignScreen;
