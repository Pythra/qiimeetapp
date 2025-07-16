import React, { useState } from 'react';
import { TextInput, StyleSheet, Alert, View, Button } from 'react-native';
import OnboardingTemplate from './OnboardingTemplate';
import { FONTS } from '../../../constants/font';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DisplayNameScreen = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    await logAsyncStorage();
    if (!displayName) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      console.log(token);
      const res = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { username: displayName },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Update username response:', res.data);
      if (res.data && (res.data.success || res.data.message || res.status === 200)) {
        navigation.navigate('LookingFor');
      } else {
        Alert.alert('Error', res.data.error || 'Failed to update display name');
      }
    } catch (err) {
      console.log('Update username error:', err.response?.data || err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to update display name');
    } finally {
      setLoading(false);
    }
  };

  const logAsyncStorage = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const stores = await AsyncStorage.multiGet(keys);
    let message = stores.map(([key, value]) => `${key}: ${value}`).join('\n');
    if (!message) message = 'AsyncStorage is empty';
    console.log('AsyncStorage Contents', message);
  };

  return (
    <View style={{ flex: 1 }}>
      <OnboardingTemplate
        title="What's your display name?"
        subtitle="This name will be seen by other users"
        currentStep={1}
        totalSteps={15}
        onNext={handleNext}
        canProgress={displayName.length > 0 && !loading}
      >
        <TextInput
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor="#666666"
          value={displayName}
          onChangeText={setDisplayName}
          editable={!loading}
        />
      </OnboardingTemplate>
       
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 31,
    paddingVertical: 16,
    paddingHorizontal: 24,
    height: 62,
    width: '100%',
    color: '#FFFFFF',
    fontSize: 16, 
    fontFamily: FONTS.regular
  },
});

export default DisplayNameScreen;