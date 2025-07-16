import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import TopHeader from '../../components/TopHeader';
import CustomButton from '../../constants/button';
import { FONTS } from '../../constants/font';
import Colors from '../../constants/Colors';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import HollowButton from '../../constants/HollowButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

const settingsOptions = [
  { label: 'Account' },
  { label: 'Go Incognito', isSwitch: true },
  { label: 'Help' },
  { label: 'About' },
  { label: 'Blocked Users' },
];

const Settings = ({ navigation }) => {
  const [incognito, setIncognito] = useState(false);
  const handleBack = () => navigation.goBack();
  
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Logged Out', 'You have been successfully logged out.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };
  
  const handleDeleteAccount = () => {/* TODO: Add delete account logic */};

  return (
    <View style={styles.container}>
      <TopHeader title="Settings" onBack={handleBack} />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {settingsOptions.map((option, idx) => (
            <View
              key={option.label}
              style={[
                styles.optionRow,
                idx !== 0 && { marginTop: 16 }, // Increased spacing
              ]}
            >
              {option.isSwitch ? (
                <>
                  <View style={styles.iconLabelRow}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIncognito(!incognito)} activeOpacity={0.7}>
                    <MaterialCommunityIcons
                      name={incognito ? 'toggle-switch' : 'toggle-switch-off-outline'}
                      size={32}
                      color={incognito ? Colors.primaryDark : '#888'}
                      style={{ marginRight: 2 }}
                    />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.rowContent}
                  onPress={
                    option.label === 'Account'
                      ? () => navigation.navigate('Account')
                      : option.label === 'Blocked Users'
                      ? () => navigation.navigate('BlockedUsers')
                      : option.label === 'Help'
                      ? () => navigation.navigate('Help')
                      : option.label === 'About'
                      ? () => navigation.navigate('About')
                      : undefined
                  }
                >
                  <View style={styles.iconLabelRow}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </View>
                  <MaterialIcons name="keyboard-arrow-right" size={32} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
        <View style={styles.bottomButtonsFixed}>
          <CustomButton title="Log Out" onPress={handleLogout} style={styles.logoutButton} />
          <HollowButton title="Delete Account" onPress={handleDeleteAccount} style={styles.deleteButton} />
        </View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    // Remove marginBottom for bottomButtons
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
  logoutButton: {
    marginTop: 12,
    backgroundColor: Colors.primaryDark,
  },
  bottomButtons: {
    // Deprecated, replaced by bottomButtonsFixed
  },
  bottomButtonsFixed: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 56,
    backgroundColor: '#121212',
  },
  deleteButton: {
    marginTop: 4,
    marginBottom: 8, 
    width: '87%',
  },
});

export default Settings;
