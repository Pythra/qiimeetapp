import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, Modal, Alert } from 'react-native';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';
import CustomButton from '../../constants/button';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../../env';

const ReportDetails = ({ navigation, route }) => {
  const [details, setDetails] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('email@gmail.com');
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { reason, reportedUserId, reportType = 'technical_issue' } = route.params || {};

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleEmailChange = () => {
    if (newEmail) {
      setEmail(newEmail);
      setNewEmail('');
    }
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!details.trim()) {
      Alert.alert('Missing Details', 'Please provide details about your report.');
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again to submit a report.');
        return;
      }

      const reportData = {
        reportedUserId: reportedUserId || null,
        reportType: reportType,
        reason: reason || 'Support Request',
        details: details.trim(),
        contactEmail: email !== 'email@gmail.com' ? email : null,
        category: reportedUserId ? 'user_report' : 'general'
      };

      const response = await fetch(`${API_BASE_URL}/reports/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportData)
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Report Submitted',
          'Thank you for your report. We\'ll review it and get back to you if needed.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Submission Failed', result.error || 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Network Error', 'Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <TopHeader title="Tell us more" onBack={() => navigation.goBack()} />
        <Text style={styles.subtitle}>
          Please provide details to help us understand the problem.
        </Text>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Add details here"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={details}
          onChangeText={setDetails}
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={dismissKeyboard}
          textAlignVertical="top"
        />
        <View style={styles.footerContainer}>
          <Text style={styles.footnote}>
            If we need more information, we'll contact you at{' '}
            <Text style={styles.email}>{email}</Text>
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.changeEmail}>Change email?</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change your email</Text>
              <Text style={styles.modalSubtitle}>
Let us know the email you’d like to use for these notifications. 
              </Text>
              <Text style={styles.modalSubtitle}> 
We’ll send a confirmation link to that address to verify it’s you.
              </Text>
              <Text style={{fontWeight:'600', color:'#fff', marginBottom:14, fontSize:16}}> 
Email
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your email address"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonPrimary]} 
                  onPress={handleEmailChange}
                >
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: FONTS.medium, fontSize: 16 }}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.buttonContainer}>
          <CustomButton 
            title={isSubmitting ? "Submitting..." : "Submit"} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  subtitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.regular,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  input: {
    color: '#fff',
    fontFamily: FONTS.regular,
    fontSize: 16,
    marginHorizontal: 20, 
    height: '30',
    textAlignVertical: 'top',
    marginBottom: 12, 
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    borderRadius: 0,
  },
  footerContainer: {
    marginHorizontal: 20,
  },
  footnote: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },
  email: {
    color: '#fff',
  },
  changeEmail: {
    color: '#EC066A',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    width: '90%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: FONTS.medium,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: 20,
  },
  modalInput: {
    color: '#fff',
    fontFamily: FONTS.regular,
    fontSize: 16,
    height: 56,
    padding: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2A2A2A',
    borderRadius: 90,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 15,
    padding: 10,
  },
  modalButtonPrimary: { 
  },
  modalButtonText: {
    color: '#fff',
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
});

export default ReportDetails;
