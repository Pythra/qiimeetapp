import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, Modal, Alert, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import TopHeader from '../../components/TopHeader';
import { FONTS } from '../../constants/font';
import CustomButton from '../../constants/button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const getResponsiveWidth = (phoneSize, tabletSize = phoneSize * 1.3) => isTablet ? tabletSize : phoneSize;
const getResponsiveFontSize = (phoneSize, tabletSize = phoneSize * 1.2) => isTablet ? tabletSize : phoneSize;
const getResponsiveSpacing = (phoneSize, tabletSize = phoneSize * 1.3) => isTablet ? tabletSize : phoneSize;

const ReportDetailsEnhanced = ({ navigation, route }) => {
  const [details, setDetails] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    reason,
    reportedUserId,
    reportedUser, // User object with details
    reportType = 'inappropriate_behavior'
  } = route.params || {};

  // Get image source with fallback
  const getImageSource = (imageUrl) => {
    if (imageUrl && typeof imageUrl === 'string') {
      return { uri: imageUrl, cache: 'force-cache' };
    }
    return require('../../assets/model.jpg');
  };

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
        reason: reason || 'Inappropriate Behavior',
        details: details.trim(),
        contactEmail: email || null,
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
          'Thank you for your report. We\'ll review it and take appropriate action.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to home or previous screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              }
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
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        style={styles.gradient}
      >
        <TopHeader 
          title="Report User" 
          onBack={() => navigation.goBack()} 
          titleColor="#fff"
        />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Reported User Card */}
          {reportedUser && (
            <View style={styles.userCard}>
              <LinearGradient
                colors={['#ec066a', '#6ec531']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.userCardGradient}
              >
                <View style={styles.userCardContent}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                      <Image
                        source={getImageSource(reportedUser.profilePictures?.[0])}
                        style={styles.avatar}
                        onError={(e) => console.log('Image failed to load:', e.nativeEvent.error)}
                      />
                      <View style={styles.reportBadge}>
                        <MaterialIcons name="report" size={16} color="#fff" />
                      </View>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{reportedUser.username || reportedUser.name || 'User'}</Text>
                      <Text style={styles.userAge}>
                        {reportedUser.age ? `${reportedUser.age} years old` : 'Age not specified'}
                      </Text>
                      {reportedUser.location && (
                        <Text style={styles.userLocation}>
                          <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                          {' ' + reportedUser.location}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.reportTypeContainer}>
                    <Text style={styles.reportTypeLabel}>Reporting for:</Text>
                    <Text style={styles.reportTypeText}>{reason}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Report Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Tell us what happened</Text>
            <Text style={styles.sectionSubtitle}>
              Please provide specific details to help us understand the situation and take appropriate action.
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                multiline
                placeholder="Describe the incident in detail..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={details}
                onChangeText={setDetails}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.characterCount}>{details.length}/1000</Text>
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact Information (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              We may need to follow up with you about this report.
            </Text>
            
            <TouchableOpacity 
              style={styles.emailContainer}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.emailContent}>
                <Ionicons name="mail-outline" size={20} color="#6ec531" />
                <Text style={styles.emailText}>
                  {email || 'Add email address'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {/* Important Notice */}
          <View style={styles.noticeContainer}>
            <View style={styles.noticeHeader}>
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <Text style={styles.noticeTitle}>Important</Text>
            </View>
            <Text style={styles.noticeText}>
              False reports may result in action against your account. We take all reports seriously and investigate thoroughly.
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <CustomButton 
            title={isSubmitting ? "Submitting Report..." : "Submit Report"} 
            onPress={handleSubmit}
            disabled={isSubmitting || !details.trim()}
            style={[
              styles.submitButton,
              (!details.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            textStyle={styles.submitButtonText}
          />
        </View>

        {/* Email Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContainer}>
                  <LinearGradient
                    colors={['#1a1a1a', '#2a2a2a']}
                    style={styles.modalContent}
                  >
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Contact Email</Text>
                      <TouchableOpacity 
                        onPress={() => setModalVisible(false)}
                        style={styles.modalCloseButton}
                      >
                        <Ionicons name="close" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.modalSubtitle}>
                      We'll use this email to contact you if we need more information about your report.
                    </Text>
                    
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter your email address"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={newEmail}
                      onChangeText={setNewEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.modalButtonSecondary]} 
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.modalButtonPrimary]} 
                        onPress={handleEmailChange}
                      >
                        <Text style={styles.modalButtonPrimaryText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(100),
  },
  userCard: {
    marginTop: getResponsiveSpacing(20),
    marginBottom: getResponsiveSpacing(30),
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  userCardGradient: {
    padding: 1,
  },
  userCardContent: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 19,
    padding: getResponsiveSpacing(20),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(16),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: getResponsiveSpacing(16),
  },
  avatar: {
    width: getResponsiveWidth(70),
    height: getResponsiveWidth(70),
    borderRadius: getResponsiveWidth(35),
    borderWidth: 3,
    borderColor: '#fff',
  },
  reportBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: getResponsiveFontSize(22),
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  userAge: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: getResponsiveFontSize(16),
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  userLocation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: getResponsiveFontSize(14),
    fontFamily: FONTS.regular,
  },
  reportTypeContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: getResponsiveSpacing(12),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  reportTypeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: getResponsiveFontSize(12),
    fontFamily: FONTS.regular,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportTypeText: {
    color: '#ef4444',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  detailsSection: {
    marginBottom: getResponsiveSpacing(30),
  },
  sectionTitle: {
    color: '#fff',
    fontSize: getResponsiveFontSize(20),
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: getResponsiveSpacing(8),
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: getResponsiveFontSize(14),
    fontFamily: FONTS.regular,
    lineHeight: getResponsiveFontSize(20),
    marginBottom: getResponsiveSpacing(20),
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: getResponsiveSpacing(16),
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontFamily: FONTS.regular,
    minHeight: getResponsiveWidth(120),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    textAlignVertical: 'top',
  },
  characterCount: {
    position: 'absolute',
    bottom: getResponsiveSpacing(12),
    right: getResponsiveSpacing(16),
    color: 'rgba(255,255,255,0.5)',
    fontSize: getResponsiveFontSize(12),
    fontFamily: FONTS.regular,
  },
  contactSection: {
    marginBottom: getResponsiveSpacing(30),
  },
  emailContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: getResponsiveSpacing(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emailContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emailText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontFamily: FONTS.regular,
    marginLeft: getResponsiveSpacing(12),
  },
  noticeContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: getResponsiveSpacing(16),
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: getResponsiveSpacing(20),
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(8),
  },
  noticeTitle: {
    color: '#f59e0b',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    fontFamily: FONTS.medium,
    marginLeft: getResponsiveSpacing(8),
  },
  noticeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: getResponsiveFontSize(14),
    fontFamily: FONTS.regular,
    lineHeight: getResponsiveFontSize(20),
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(40),
  },
  submitButton: {
    backgroundColor: '#ec066a',
    borderRadius: 16,
    paddingVertical: getResponsiveSpacing(16),
    elevation: 4,
    shadowColor: '#ec066a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSpacing(20),
  },
  modalContainer: {
    width: '100%',
    maxWidth: getResponsiveWidth(400),
  },
  modalContent: {
    borderRadius: 20,
    padding: getResponsiveSpacing(24),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(16),
  },
  modalTitle: {
    color: '#fff',
    fontSize: getResponsiveFontSize(20),
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  modalCloseButton: {
    padding: getResponsiveSpacing(4),
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: getResponsiveFontSize(14),
    fontFamily: FONTS.regular,
    lineHeight: getResponsiveFontSize(20),
    marginBottom: getResponsiveSpacing(20),
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: getResponsiveSpacing(16),
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: getResponsiveSpacing(24),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: getResponsiveSpacing(12),
  },
  modalButton: {
    flex: 1,
    paddingVertical: getResponsiveSpacing(12),
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalButtonPrimary: {
    backgroundColor: '#6ec531',
  },
  modalButtonSecondaryText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});

export default ReportDetailsEnhanced;





