import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import OptionItem from './OptionItem';
import styles from './onboardingStyles';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReligionScreen = ({ navigation }) => {
  const [religion, setReligion] = useState(null);
  const religions = [
    "Agnostic",
    "Atheist",
    "Buddhist",
    "Catholic",
    "Christian",
    "Hindu",
    "Jewish",
    "Muslim",
    "Spiritual",
    "Other",
    "Prefer not to say"
  ];

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const selectedReligion = religions[religion];
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { religon: selectedReligion },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update religion response:', res.data);
      navigation.navigate('CurrentWork');
    } catch (error) {
      console.error('Error updating religion:', error);
      navigation.navigate('CurrentWork'); // Optionally still navigate
    }
  };

  return (
    <OnboardingTemplate
      title="What is your religion or belief?"      
      subtitle="Choose your religion or belief to find people who share similar values and principles."

      currentStep={12}
      totalSteps={15}
      onNext={handleNext}
      canProgress={religion !== null}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.optionsContainer}>
          {religions.map((option, index) => (
            <OptionItem
              key={index}
              label={option}
              selected={religion === index}
              onPress={() => setReligion(index)}
            />
          ))}
        </View>
      </ScrollView>
    </OnboardingTemplate>
  );
};

export default ReligionScreen;
