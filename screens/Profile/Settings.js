import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopHeader from '../../components/TopHeader';
import CustomButton from '../../constants/button';
import { FONTS } from '../../constants/font';
import Colors from '../../constants/Colors';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import HollowButton from '../../constants/HollowButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../components/AuthContext';
import SocketManager from '../../utils/socket';
import { clearAllCachedData } from '../../utils/clearCache';
import { API_BASE_URL } from '../../env';

const settingsOptions = [
  { label: 'Account' },
  { label: 'Go Incognito', isSwitch: true },
  { label: 'Help' },
  { label: 'About' },
  { label: 'Blocked Users' },
];

const Settings = ({ navigation }) => {
  const [incognito, setIncognito] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { logout, user, updateUser, token } = useAuth();
  const handleBack = () => navigation.goBack();
  
  // Initialize incognito state from user data
  useEffect(() => {
    if (user && user.incognito !== undefined) {
      setIncognito(user.incognito);
    }
  }, [user]);
  
  // Handle incognito toggle
  const handleIncognitoToggle = async () => {
    try {
      const newIncognitoState = !incognito;
      
      // Optimistically update UI
      setIncognito(newIncognitoState);
      
      // Update backend
      const response = await fetch(`${API_BASE_URL}/auth/update-incognito`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ incognito: newIncognitoState })
      });
      
      if (!response.ok) {
        // Revert on error
        setIncognito(!newIncognitoState);
        Alert.alert('Error', 'Failed to update incognito status. Please try again.');
        return;
      }
      
      // Update user context
      const updatedUser = { ...user, incognito: newIncognitoState };
      updateUser(updatedUser);
      
    } catch (error) {
      console.error('Error updating incognito status:', error);
      // Revert on error
      setIncognito(!incognito);
      Alert.alert('Error', 'Failed to update incognito status. Please try again.');
    }
  };
  
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple calls
    
    try {
      setIsLoggingOut(true);
      // Call AuthContext logout to clear all state and Clerk sessions
      await logout();
      
      // Alert removed as requested
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return; // Prevent multiple calls
    
    // Show custom modal instead of alert
    setDeleteModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }
      
      // Clear all cached data
      await clearAllCachedData();
      
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Disconnect socket
      SocketManager.disconnect();
      
      // Call AuthContext logout to clear all state and Clerk sessions
      await logout();
      
      // Navigate to landing screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
      setDeleteModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
                  <TouchableOpacity onPress={handleIncognitoToggle} activeOpacity={0.7}>
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
          <CustomButton 
            title={isLoggingOut ? "Logging Out..." : "Log Out"} 
            onPress={handleLogout} 
            style={[
              styles.logoutButton,
              (isLoggingOut || isDeletingAccount) && styles.buttonDisabled
            ]}
            disabled={isLoggingOut || isDeletingAccount}
          />
          <HollowButton 
            title={isDeletingAccount ? "Deleting Account..." : "Delete Account"} 
            onPress={handleDeleteAccount} 
            style={[
              styles.deleteButton,
              (isLoggingOut || isDeletingAccount) && styles.buttonDisabled
            ]}
            disabled={isLoggingOut || isDeletingAccount}
          />
        </View>
      </View>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setDeleteModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalContent}>
              <View style={styles.iconContainer}>
                <FontAwesome6 name="xmark" size={56} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.modalDescription}>
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setDeleteModalVisible(false)}
                  disabled={isDeletingAccount}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalDeleteButton}
                  onPress={confirmDeleteAccount}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalDeleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    position: 'relative', 
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -36,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16, 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 75,
    height: 75,
    borderRadius: 52,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold', 
    marginBottom: 16,
    fontFamily: FONTS?.bold || 'System',
    textAlign: 'center',
  },
  modalDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    lineHeight: 24, 
    marginBottom: 24,
    fontFamily: FONTS?.regular || 'System',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: '#ec066a',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#ec066a',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS?.bold || 'System',
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 90,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS?.bold || 'System',
  },
});

export default Settings;