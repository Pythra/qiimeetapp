import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import * as ImagePicker from 'expo-image-picker';
import onboardingStyles from '../intro/forms/onboardingStyles';
import { useNavigation } from '@react-navigation/native';
import SharpCheck from '../../assets/sharpcheck.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../env';

const MAX_PHOTOS = 6;

const EditProfile = (props) => {
  const navigation = useNavigation();
  const route = props.route || {};
  const [selectedImages, setSelectedImages] = useState(Array(MAX_PHOTOS).fill(null));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [work, setWork] = useState({ jobTitle: '', company: '' });
  const [education, setEducation] = useState('');
    
  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No authentication token found');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const userData = response.data;
      console.log('Fetched user data for edit:', userData);
      setUser(userData);

      // Load existing profile pictures
      if (userData.profilePictures && userData.profilePictures.length > 0) {
        const existingImages = Array(MAX_PHOTOS).fill(null);
        userData.profilePictures.forEach((photo, index) => {
          if (index < MAX_PHOTOS) {
            existingImages[index] = { uri: photo };
          }
        });
        setSelectedImages(existingImages);
      }
      // Load work and education from userData
      setWork({ jobTitle: userData.career || '', company: userData.company || '' });
      setEducation(userData.education || '');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Listen for navigation params (work, education)
  useEffect(() => {
    if (props.route && props.route.params) {
      if (props.route.params.work) {
        setWork(props.route.params.work);
      }
      if (props.route.params.education) {
        setEducation(props.route.params.education);
      }
    }
  }, [props.route && props.route.params]);

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
        const updatedImages = [...selectedImages];
        updatedImages[index] = result.assets[0];
        setSelectedImages(updatedImages);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...selectedImages];
    updatedImages[index] = null;
    setSelectedImages(updatedImages);
  };

  // Update profile in backend
  const handleApplyChanges = async () => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No authentication token found');
        return;
      }
      // Filter out null images and get valid ones
      const validImages = selectedImages.filter(img => img !== null);
      const userId = user?._id;
      let s3Urls = [];
      for (const img of validImages) {
        if (img && img.uri && !img.uri.startsWith('http')) { // Only upload new images
          const formData = new FormData();
          formData.append('Profilepictures', {
            uri: img.uri,
            name: img.fileName || `photo.jpg`,
            type: img.type || 'image/jpeg',
          });
          formData.append('userId', userId);
          const uploadRes = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          if (uploadRes.data && uploadRes.data.url) {
            s3Urls.push(uploadRes.data.url);
          }
        } else if (img && img.uri && img.uri.startsWith('http')) {
          s3Urls.push(img.uri);
        }
      }
      // Update user profile with new S3 URLs and other fields
      const updateData = {
        profilePictures: s3Urls,
        career: work.jobTitle,
        company: work.company,
        education: education,
      };
      console.log('Update data being sent:', updateData);
      const response = await axios.put(`${API_BASE_URL}/auth/update`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      Alert.alert('Success', 'Profile updated successfully!');
      await fetchUserProfile();
      navigation.navigate('Profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      console.log('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Loading profile...</Text>
      </View>
    );
  }

  // Show error state if no user data
  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Failed to load profile</Text>
        <TouchableOpacity onPress={fetchUserProfile} style={{ marginTop: 10, padding: 10, backgroundColor: '#EC066A', borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userAge = calculateAge(user.dateOfBirth);

  return (
    <View style={styles.container}>
      {/* Header */}
      <TopHeader 
        title="Edit Profile"
        onBack={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo Grid */}
        <View style={{paddingHorizontal: 24, paddingBottom: 24,  marginTop:-16
         }}>
          <View style={onboardingStyles.photosGrid}>
            {selectedImages.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={onboardingStyles.photoUploadBox}
                onPress={image ? null : () => handleImageSelection(index)}
                activeOpacity={image ? 1 : 0.7}
              >
                {image ? (
                  <View style={onboardingStyles.imageContainer}>
                    <Image
                      source={{ uri: image.uri }}
                      style={onboardingStyles.uploadedImage}
                    />
                    <TouchableOpacity
                      style={onboardingStyles.removeIconButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <View style={styles.removeIconBackground}>
                        <Ionicons name="close" size={12} color="#000" />
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Ionicons name="add" size={32} color="#fff" style={{ opacity: 0.5 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Verify Profile */}
        <TouchableOpacity style={styles.verifyRow}>
          <Image source={SharpCheck} style={{ width: 16, height: 16, marginRight: 8 }} />
          <Text style={styles.verifyText}>Verify my profile</Text>
          <View style={styles.notVerifiedTag}>
            <Text style={styles.notVerifiedText}>Not verified</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Basic info</Text>
          <View style={{gap: 10, paddingVertical: 4}}>
          <TouchableOpacity style={styles.sectionRow} 
          onPress={() => navigation.navigate('BasicInfo')}>
            <View style={{flex: 1}}>
              <Text style={styles.sectionMainText}>{user.username || 'User'}, {userAge || 'N/A'}</Text>
              <Text style={styles.sectionSubText}>{user.gender || 'Not set'}, {user.location || 'Location not set'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity></View>
        </View>
        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bio</Text>
          <TouchableOpacity style={styles.sectionRow}>
            <Text style={styles.placeholderText}>{user.bio || 'Add bio'}</Text>
          </TouchableOpacity>
        </View>
        {/* Relationship goals */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Relationship goals</Text>
          <TouchableOpacity style={styles.sectionRow} onPress={() => navigation.navigate('RelationshipGoals')}>
            <Text style={styles.placeholderText}>{user.goal || 'Add your goal'}</Text>
            <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
        </View>
        {/* Work */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Work</Text>
          <TouchableOpacity style={styles.sectionRow} onPress={() => navigation.navigate('Work')}>
            <Text style={styles.placeholderText}>{work.jobTitle || user.career || 'Add your work'}</Text>
            <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
        </View>
        {/* Education */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Education</Text>
          <TouchableOpacity style={styles.sectionRow} onPress={() => navigation.navigate('Education')}>
            <Text style={styles.placeholderText}>{education || user.education || 'Add your education'}</Text>
            <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
        </View>
        {/* More about you */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>More about you</Text>
          <View style={styles.moreAboutList}>
            <TouchableOpacity style={styles.moreAboutItem} onPress={() => navigation.navigate('Height')}>
              <Image source={require('../../assets/ruler.png')} style={styles.moreAboutIcon} />
              <Text style={styles.moreAboutText}>Height</Text>
              <Text style={styles.moreAboutValue}>{user.height || 'Empty'}</Text>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreAboutItem} onPress={() => navigation.navigate('Kids')}>
              <Image source={require('../../assets/kids.png')} style={styles.moreAboutIcon} />
              <Text style={styles.moreAboutText}>Kids</Text>
              <Text style={styles.moreAboutValue}>{user.kids || 'Empty'}</Text>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreAboutItem} onPress={() => navigation.navigate('Zodiac')}>
              <Image source={require('../../assets/zodiac.png')} style={styles.moreAboutIcon} />
              <Text style={styles.moreAboutText}>Zodiac sign</Text>
              <Text style={styles.moreAboutValue}>{user.zodiac || 'Empty'}</Text>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreAboutItem} onPress={() => navigation.navigate('Education')}>
              <Image source={require('../../assets/graduation.png')} style={styles.moreAboutIcon} />
              <Text style={styles.moreAboutText}>Educational level</Text>
              <Text style={styles.moreAboutValue}>{user.education || 'Empty'}</Text>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreAboutItem} onPress={() => navigation.navigate('Personality')}>
              <FontAwesome6 name="user-astronaut" size={18} color="#fff" style={styles.moreAboutIcon} />
              <Text style={styles.moreAboutText}>Personality</Text>
              <Text style={styles.moreAboutValue}>{user.personality || 'Empty'}</Text>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreAboutItem} onPress={() => navigation.navigate('Religion')}>
              <MaterialIcons name="church" size={20} color="#fff" style={styles.moreAboutIcon} />
              <Text style={styles.moreAboutText}>Religion</Text>
              <Text style={styles.moreAboutValue}>{user.religon || 'Empty'}</Text>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreAboutItem} onPress={() => navigation.navigate('Career')}>
              <MaterialIcons name="work" size={20} color="#fff" style={styles.moreAboutIcon} />
              <Text style={styles.moreAboutText}>Career</Text>
              <Text style={styles.moreAboutValue}>{user.career || 'Empty'}</Text>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Interests */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Interests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Interests')}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {user.interests && user.interests.length > 0 ? (
              user.interests.map((interest, idx) => (
                <View key={idx} style={styles.chip}><Text style={styles.chipText}>{interest}</Text></View>
              ))
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, textAlign: 'center', padding: 20 }}>No interests added</Text>
            )}
          </View>
        </View>
        {/* Lifestyle choices */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Lifestyle choices</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Lifestyle')}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {user.lifestyle && user.lifestyle.length > 0 ? (
              user.lifestyle.map((lifestyle, idx) => (
                <View key={idx} style={styles.chip}><Text style={styles.chipText}>{lifestyle}</Text></View>
              ))
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, textAlign: 'center', padding: 20 }}>No lifestyle choices added</Text>
            )}
          </View>
        </View>
        {/* Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Languages</Text>
          <TouchableOpacity style={styles.sectionRow} onPress={() => navigation.navigate('Language')}>
            <Text style={styles.placeholderText}>Add languages</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
        </View>
        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location</Text>
          <TouchableOpacity style={styles.sectionRow} onPress={() => navigation.navigate('Language')}>
            <Text style={styles.locationText}>{user.location || 'Location not set'}</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
        {/* Apply Button */}
        <TouchableOpacity 
          style={[styles.applyButton, updating && styles.applyButtonDisabled]} 
          onPress={handleApplyChanges}
          disabled={updating}
        >
          <Text style={styles.applyButtonText}>
            {updating ? 'Updating...' : 'Apply'}
          </Text>
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 16,
    marginBottom: 18, 
    height:56
  },
  verifyText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  notVerifiedTag: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8, 
  },
  notVerifiedText: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  section: {
    marginBottom: 10,
    paddingHorizontal: 20,
    gap: 4,
  },
  sectionLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  sectionRow: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionMainText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: '600', 
    marginBottom: 12,
  },
  sectionSubText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  removeIconBackground: {
    width: 16,
    height: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAboutList: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,  
    marginBottom: 18,
    paddingVertical: 8,
  },
  moreAboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  moreAboutIcon: {
    marginRight: 12,
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  moreAboutText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    fontFamily: FONTS.regular,
  },
  moreAboutValue: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginRight: 8,
    fontFamily: FONTS.regular,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editText: {
    color: '#fff',
    fontSize: 12, 
    fontFamily: FONTS.regular,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  chip: {
    backgroundColor: '#ec066a',
    borderRadius: 90,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginBottom: 6,
  },
  chipText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  locationBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 18,
  },
  locationText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  applyButton: {
    backgroundColor: '#ec066a',
    borderRadius: 90,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 56,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize:24,
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
  applyButtonDisabled: {
    backgroundColor: 'rgba(236, 6, 106, 0.5)',
  },
});

export default EditProfile;
