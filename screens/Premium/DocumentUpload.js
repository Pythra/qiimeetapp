import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import PhaseContainer from './components/PhaseContainer';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const DocumentUpload = () => {
  const navigation = useNavigation();
  const [selectedFrontImage, setSelectedFrontImage] = useState(null);
  const [selectedBackImage, setSelectedBackImage] = useState(null);
  const [documentType, setDocumentType] = useState('National Identity Card');
  const [showDocumentTypes, setShowDocumentTypes] = useState(false);

  const documentTypes = [
    'National Identity Card',
    'International Passport',
    'Driver\'s License',
    'Permanent Voter\'s Card'
  ];

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleImageSelection = async (type) => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (type === 'front') {
          setSelectedFrontImage(result.assets[0]);
        } else {
          setSelectedBackImage(result.assets[0]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = () => {
    if (selectedFrontImage && selectedBackImage) {
      navigation.navigate('VerificationInProgress');
    }
  };

  const handleDocumentTypeSelect = (type) => {
    setDocumentType(type);
    setShowDocumentTypes(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainContainer}>
          <View>
            <TopHeader onBack={() => navigation.goBack()} />
            
            <View style={styles.contentContainer}>
                <PhaseContainer currentPhase={3} /> 
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Document Type</Text>
                <TouchableOpacity 
                  style={styles.pickerContainer}
                  onPress={() => setShowDocumentTypes(!showDocumentTypes)}
                >
                  <Text style={styles.pickerText}>{documentType}</Text>
                  <Icon name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
                
                {showDocumentTypes && (
                  <View style={styles.dropdownContainer}>
                    {documentTypes
                      .filter(type => type !== documentType)
                      .map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.dropdownItem}
                        onPress={() => handleDocumentTypeSelect(type)}
                      >
                        <Text style={styles.dropdownText}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Upload ID Section */}
              <View style={styles.sectionContainer2}>
                <Text style={styles.sectionTitle}>Upload ID:</Text>
                
                <View style={styles.uploadContainer}>
                <View style={styles.requirementsContainer}>
                  <View style={styles.requirementRow}>
                    <View style={styles.requirementBullet} />
                    <Text style={styles.requirementText}>
                      Please upload a clear image of your government-issued ID (Passport, Driver's License, etc.)
                    </Text>
                  </View>
                  <View style={styles.requirementRow}>
                    <View style={styles.requirementBullet} />
                    <Text style={styles.requirementText}>
                      Ensure your ID is eligible and all text is visible
                    </Text>
                  </View>
                  <View style={styles.requirementRow}>
                    <View style={styles.requirementBullet} />
                    <Text style={styles.requirementText}>
                      Accept formats: JPG, PNG, or PDF
                    </Text>
                  </View>
                </View>

                {/* Upload Front */}
                {!selectedFrontImage ? (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleImageSelection('front')}
                  >
                    <View style={styles.uploadIconBg}>
                      <SimpleLineIcons name="cloud-upload" size={24} color="#fff" />
                    </View>
                    <Text style={styles.uploadButtonText}>Upload Front</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadedImageContainer}
                    onPress={() => handleImageSelection('front')}
                  >
                    <Image source={{ uri: selectedFrontImage.uri }} style={styles.previewImage} />
                  </TouchableOpacity>
                )}

                {/* Upload Back */}
                {!selectedBackImage ? (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleImageSelection('back')}
                  >
                    <View style={styles.uploadIconBg}>
                      <SimpleLineIcons name="cloud-upload" size={32} color="#fff" />
                    </View>
                    <Text style={styles.uploadButtonText}>Upload Back</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadedImageContainer}
                    onPress={() => handleImageSelection('back')}
                  >
                    <Image source={{ uri: selectedBackImage.uri }} style={styles.previewImage} />
                  </TouchableOpacity>
                )}
              </View>
          </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.continueButton, 
            (!selectedFrontImage || !selectedBackImage) ? 
              styles.continueButtonDisabled : 
              styles.continueButtonEnabled
          ]}
          onPress={handleSubmit}
          disabled={!selectedFrontImage || !selectedBackImage}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#000', 
  },
  container: {
    flex: 1,
    backgroundColor: '#000', 
  },
  uploadContainer:{backgroundColor: '#1e1e1e', borderRadius: 8, 
    padding: 16,},
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ec066a',
  },
  progressDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ec066a',
    borderWidth: 2,
    borderColor: '#fff',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ec066a',
    marginHorizontal: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionContainer: {
    marginBottom: 24,
    marginTop: 20,
  },
  sectionContainer2: {
    marginBottom: 30, 
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 90, 
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  pickerText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  requirementsContainer: {
    marginBottom: 20,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', 
  },
  requirementBullet: {
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    marginRight: 16,
    marginTop: 8, // aligns with first line of text
  },
  requirementText: {
    color: '#888',
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dotted',
    height: 116,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  uploadIconBg: {
    width: 50,
    height: 50,
    backgroundColor: '#292929',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadIcon: {
    marginRight: 8,
  },
  uploadIconAbove: {
    marginBottom: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  uploadedImageContainer: {
    height: 116,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 90,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  continueButtonEnabled: {
    backgroundColor: '#ec066a',
  },
  continueButtonDisabled: {
    backgroundColor: '#333',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.medium,
  },
  dropdownContainer: {
    position: 'absolute',
    width: '75%',
    top: 100,
    left: 75,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 16, 
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 24, 
  },
  dropdownText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
});

export default DocumentUpload;