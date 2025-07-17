import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../../../env'; // <-- fix import path

export function formatPhoneNumber(number) {
  const cleaned = number.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    const groups = [match[1], match[2], match[3]].filter(group => group);
    return groups.join(' ');
  }
  return cleaned;
}

export async function sendOTP(phoneNumber) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.log('OTP send error:', err);
    throw err;
  }
}

export function usePhoneNumber(navigation) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedNumber, setFormattedNumber] = useState('');
  const [error, setError] = useState('');

  const handlePhoneChange = (text) => {
    setError('');
    const rawNumber = text.replace(/\D/g, '');
    const numberWithoutLeadingZero = rawNumber.startsWith('0') ? rawNumber.substring(1) : rawNumber;
    if (numberWithoutLeadingZero.length > 0) {
      const firstDigit = numberWithoutLeadingZero[0];
      if (!['7', '8', '9'].includes(firstDigit)) {
        setError('Invalid Phone Number');
      }
    }
    if (numberWithoutLeadingZero.length <= 10) {
      setPhoneNumber(numberWithoutLeadingZero);
      setFormattedNumber(formatPhoneNumber(numberWithoutLeadingZero));
    }
  };

  // Only register phone number and save token, no OTP/verification
  const handleNext = async () => {
    if (phoneNumber.length === 10) {
      try {
        // Fetch all users from admin endpoint
        const usersRes = await fetch(`${API_BASE_URL}/admin/users`);
        const usersData = await usersRes.json();
        if (usersData.success && Array.isArray(usersData.users)) {
          const exists = usersData.users.some(
            user => (user.phoneNumber || '').replace(/^0/, '') === phoneNumber
          );
          if (exists) {
            Alert.alert('Error', 'Phone number already exists. Please use a different number.');
            return;
          }
        }
        // If not exists, send OTP
        const otpResult = await sendOTP(phoneNumber);
        if (otpResult.pinId) {
          await AsyncStorage.setItem('pinId', otpResult.pinId);
          navigation.navigate('Auth', {
            screen: 'VerificationCode',
            params: { phoneNumber, pinId: otpResult.pinId },
          });
        } else {
          Alert.alert('Error', otpResult.message || 'Failed to send OTP');
        }
      } catch (err) {
        console.log('OTP send error:', err);
        Alert.alert('Error', 'Failed to send OTP');
      }
    }
  };

  return {
    phoneNumber,
    formattedNumber,
    error,
    handlePhoneChange,
    handleNext,
  };
}