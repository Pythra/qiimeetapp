import React, { useState } from 'react';
import { View, Platform, Alert, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import OnboardingTemplate from './OnboardingTemplate';
import styles from './onboardingStyles';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_BASE_URL } from '../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PhotosScreen = ({ navigation }) => {
  const [selectedImages, setSelectedImages] = useState(Array(6).fill(null));
  const [profilePictureUrls, setProfilePictureUrls] = useState(Array(6).fill(null));
  const [uploading, setUploading] = useState(false);

  // Request permissions for image picker
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

  // Upload image to backend and return URL
  const uploadImageToBackend = async (uri) => {
    const formData = new FormData();
    formData.append('Profilepictures', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });
    
    try {
      console.log('Uploading image with URI:', uri);
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const text = await res.text();
      console.log('Upload response status:', res.status);
      console.log('Upload response body:', text);
      
      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}: ${text}`);
      }
      
      const data = JSON.parse(text);
      console.log('Upload successful, returned data:', data);
      return data.url;
    } catch (error) {
      console.log('Upload error:', error);
      Alert.alert('Upload Error', `Failed to upload image: ${error.message}`);
      return null;
    }
  };

  const handleImageSelection = async (index) => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const uri = result.assets[0].uri;
        // Upload to backend
        const url = await uploadImageToBackend(uri);
        setUploading(false);
        if (url) {
          // Update local image and url arrays
          const updatedImages = [...selectedImages];
          updatedImages[index] = result.assets[0];
          setSelectedImages(updatedImages);
          const updatedUrls = [...profilePictureUrls];
          updatedUrls[index] = url;
          setProfilePictureUrls(updatedUrls);
          console.log('Selected images after upload:', updatedImages);
          console.log('Profile picture URLs after upload:', updatedUrls);
        }
      }
    } catch (error) {
      setUploading(false);
      console.log('Error in handleImageSelection:', error);
      Alert.alert('Error', 'Failed to pick or upload image');
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...selectedImages];
    updatedImages[index] = null;
    setSelectedImages(updatedImages);
    const updatedUrls = [...profilePictureUrls];
    updatedUrls[index] = null;
    setProfilePictureUrls(updatedUrls);
  };

  const findNextEmptySlot = () => {
    const emptyIndex = selectedImages.findIndex(img => img === null);
    return emptyIndex !== -1 ? emptyIndex : 0;
  };

  const handleAddImage = async () => {
    const index = findNextEmptySlot();
    await handleImageSelection(index);
  };

  const handleNext = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const urls = profilePictureUrls.filter(Boolean);
      console.log('Attempting to save profilePictures:', urls);
      if (urls.length < 2 || urls.length > 6) {
        Alert.alert('Please select between 2 and 6 photos.');
        return;
      }
      const response = await axios.put(
        `${API_BASE_URL}/auth/update`,
        { profilePictures: urls },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      console.log('Profile update response:', response.data);
      navigation.navigate('Location');
    } catch (error) {
      console.log('Error in handleNext:', error);
      Alert.alert('Error', 'Failed to save profile pictures.');
    }
  };

  // Count non-null images to check if we can proceed
  const nonNullImageCount = profilePictureUrls.filter(Boolean).length;

  return (
    <OnboardingTemplate
      title="Add your best photos here"
      subtitle="Add at least two photos to continue"
      currentStep={14}
      totalSteps={15}
      onNext={handleNext}
      canProgress={nonNullImageCount >= 2 && nonNullImageCount <= 6 && !uploading}
    >
      <View style={styles.photosGrid}>
        {selectedImages.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={styles.photoUploadBox}
            onPress={image ? null : () => handleImageSelection(index)}
          >
            {image ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.uploadedImage}
                />
                <TouchableOpacity
                  style={styles.removeIconButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <View style={styles.removeIconBackground}>
                    <Feather name="x" size={12} color="#000" />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <Feather name="plus" size={32} color="#fff" style={{ opacity: 0.7}} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </OnboardingTemplate>
  );
};

export default PhotosScreen;