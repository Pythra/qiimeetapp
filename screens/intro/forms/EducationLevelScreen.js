import React, { useState } from 'react';
import { View } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import OptionItem from './OptionItem';
import styles from './onboardingStyles';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EducationLevelScreen = ({ navigation }) => {
  const [education, setEducation] = useState(null);
  const educationLevels = [
    'Primary Education',
    'Secondary Education',
    'National Diploma (ND)',
    'Higher National Diploma (HND)',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'Doctorate Degree (Ph.D.)'
  ];

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const selectedEducation = educationLevels[education];
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { education: selectedEducation },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update education response:', res.data);
      navigation.navigate('Personality');
    } catch (error) {
      console.error('Error updating education:', error);
      navigation.navigate('Personality'); // Optionally still navigate
    }
  }; 

  return (
    <OnboardingTemplate
      title="What's your highest level of education?"      
      subtitle="Select your education to share your journey and aspirations."
      currentStep={10}
      totalSteps={15}
      onNext={handleNext}
      canProgress={education !== null}
    >
      <View style={styles.optionsContainer}>
        {educationLevels.map((level, index) => (
          <OptionItem
            key={index}
            label={level}
            selected={education === index}
            onPress={() => setEducation(index)}
          />
        ))}
      </View>
    </OnboardingTemplate>
  );
};

export default EducationLevelScreen;
