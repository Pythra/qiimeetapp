import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import TopHeader from '../../components/TopHeader';
import CustomButton from '../../constants/button';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FONTS } from '../../constants/font';
import { useAuth } from '../../components/AuthContext';
import { API_BASE_URL } from '../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Phone number formatting function
const formatPhoneNumber = (number) => {
  const cleaned = number.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    const groups = [match[1], match[2], match[3]].filter(group => group);
    return groups.join(' ');
  }
  return cleaned;
};

// Send OTP function
const sendOTP = async (phoneNumber) => {
  try {
    const url = 'https://api.ng.termii.com/api/sms/otp/send';
    const payload = {
      api_key: 'TLaoOhDNJhrangBPuKfzEtMHjPFbVUOWXyozycKuuNbGcGinofhPGBGqggUXCa',
      message_type: 'NUMERIC',
      to: `234${phoneNumber}`,
      from: 'N-Alert',
      channel: 'dnd',
      pin_attempts: 10,
      pin_time_to_live: 5,
      pin_length: 6,
      pin_placeholder: '< 1234 >',
      message_text: 'Your Qiimeet authentication pin is < 1234 >. It expires in 10 minutes',
      pin_type: 'NUMERIC',
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.log('OTP send error:', err);
    throw err;
  }
};

const Account = ({ navigation }) => {
  const { user: currentUser, updateUser, refreshUser } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedNumber, setFormattedNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Initialize phone number from user data
  useEffect(() => {
    if (currentUser?.phone) {
      const cleanNumber = currentUser.phone.replace(/^0/, ''); // Remove leading zero
      setPhoneNumber(cleanNumber);
      setFormattedNumber(formatPhoneNumber(cleanNumber));
      setIsVerified(true);
    }
  }, [currentUser]);

  // Refresh user data when screen comes into focus (in case phone was updated)
  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

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

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    // Reset to original phone number
    if (currentUser?.phone) {
      const cleanNumber = currentUser.phone.replace(/^0/, '');
      setPhoneNumber(cleanNumber);
      setFormattedNumber(formatPhoneNumber(cleanNumber));
    }
  };

  const handleUpdate = async () => {
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!loading) {
      setLoading(true);
      try {
        // Check if phone number already exists (excluding current user)
        const usersRes = await fetch(`${API_BASE_URL}/admin/users`);
        const usersData = await usersRes.json();
        
        if (usersData.success && Array.isArray(usersData.users)) {
          const exists = usersData.users.some(
            user => user._id !== currentUser._id && (user.phone || '').replace(/^0/, '') === phoneNumber
          );
          if (exists) {
            Alert.alert('Error', 'Phone number already exists. Please use a different number.');
            setLoading(false);
            return;
          }
        }

        // Send OTP for verification
        const otpResult = await sendOTP(phoneNumber);
        if (otpResult.pinId) {
          await AsyncStorage.setItem('pinId', otpResult.pinId);
          await AsyncStorage.setItem('newPhoneNumber', phoneNumber);
          navigation.navigate('VerificationCode', { 
            phoneNumber, 
            pinId: otpResult.pinId,
            isPhoneUpdate: true 
          });
        } else {
          Alert.alert('Error', otpResult.message || 'Failed to send OTP');
        }
      } catch (err) {
        console.log('OTP send error:', err);
        Alert.alert('Error', 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TopHeader title="Account" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.label}>Phone number</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, isEditing && styles.inputEditing]}
            value={formattedNumber}
            onChangeText={handlePhoneChange}
            editable={isEditing}
            placeholder="Phone number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            maxLength={12} // For formatted number (xxx xxx xxxx)
          />
          {isEditing ? (
            <TouchableOpacity onPress={handleCancel} style={styles.iconButton}>
              <Ionicons name="close" size={22} color="#EC066A" />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark" size={22} color="#888" style={styles.checkIcon} />
              <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                <Ionicons name="pencil" size={18} color="#EC066A" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        {isEditing && (
          <Text style={styles.helpText}>
            Enter your new phone number. A verification code will be sent to verify the number.
          </Text>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        {isEditing ? (
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EC066A" />
              <Text style={styles.loadingText}>Sending verification code...</Text>
            </View>
          ) : (
            <CustomButton 
              title="Send Verification Code" 
              onPress={handleUpdate}
              style={styles.updateButton}
            />
          )
        ) : (
          <CustomButton 
            title="Update" 
            onPress={handleEdit}
            style={styles.updateButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
  },
  content: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: '#888',
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingVertical: 8,
  },
  inputEditing: {
    color: '#fff',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginLeft: 8,
  },
  editButton: {
    marginLeft: 12,
    padding: 4,
  },
  iconButton: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    color: '#EC066A',
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 8,
  },
  helpText: {
    color: '#888',
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 8,
    lineHeight: 16,
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: 'center',
  },
  updateButton: {
    width: '90%',
    backgroundColor: Colors.primaryDark,
    borderRadius: 25,
    paddingVertical: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    width: '90%',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: 12,
  },
});

export default Account; 