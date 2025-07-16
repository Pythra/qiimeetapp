import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import { TEXT_STYLES } from '../../../constants/text';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const LookingForScreen = ({ navigation }) => {
  const [userGender, setUserGender] = useState(null);
  const [lookingForGender, setLookingForGender] = useState(null);

  const handleGenderSelect = (gender) => {
    setUserGender(gender);
    // Automatically select opposite gender
    setLookingForGender(gender === 'male' ? 'female' : 'male');
  };

  const handleNext = async () => { 
    try {
      const token = await AsyncStorage.getItem('token');
      console.log(token);
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { gender: userGender },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update username response:', res.data);
      navigation.navigate('DateOfBirth');
    } catch (error) {
      console.error('Error updating gender:', error);
    }
  };

  const renderGenderOption = (gender, iconSymbol, isSelected, onPress) => (
    <TouchableOpacity
      style={[styles.genderOption, isSelected && styles.genderOptionSelected]}
      onPress={onPress}
    >
      <Text style={styles.genderIcon}>{iconSymbol}</Text>
      <Text style={[styles.genderText, isSelected && styles.genderTextSelected]}>
        {gender}
      </Text>
    </TouchableOpacity>
  );

  return (
    <OnboardingTemplate
      currentStep={2}
      totalSteps={15}
      onNext={handleNext}
      canProgress={userGender !== null && lookingForGender !== null}
      bottomText='By clicking "Next", you expressly give your consent to the processing of this data so we can present you with profiles matching your prefences.'
    >
      <View style={styles.container}>
        <Text style={TEXT_STYLES.header}>You are a...</Text>
        
        <View style={styles.genderRow}>
          {renderGenderOption(
            'Male', 
            '♂', 
            userGender === 'male', 
            () => handleGenderSelect('male')
          )}
          {renderGenderOption(
            'Female', 
            '♀', 
            userGender === 'female', 
            () => handleGenderSelect('female')
          )}
        </View>

        <Text style={TEXT_STYLES.header}>Looking for a...</Text>
        
        <View style={styles.genderRow}>
          {renderGenderOption(
            'Male', 
            '♂', 
            lookingForGender === 'male', 
            null  // Disable manual selection
          )}
          {renderGenderOption(
            'Female', 
            '♀', 
            lookingForGender === 'female', 
            null  // Disable manual selection
          )}
        </View>
      </View>
    </OnboardingTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,  // Add padding to container to help with centering
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the row content
    height: 120,
    marginBottom: 24,
    gap: 16, // Use gap instead of margins for equal spacing
  },
  genderOption: {
    width: '37%', // Slightly reduced width
    height: '95%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#EC066A', 
    borderColor: '#EC066A',
  },
  genderIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  genderText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
});

export default LookingForScreen;