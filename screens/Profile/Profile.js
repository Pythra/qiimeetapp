import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; 
import { FONTS } from '../../constants/font';
import BlockReportModals from './BlockReportModals'; 
import { FontAwesome6 } from '@expo/vector-icons'; 
import Svg, { Circle } from 'react-native-svg';
import ProfileEditIcon from '../../assets/profileedit.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../env';
import { useIsFocused } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const getResponsiveWidth = (phoneWidth, tabletWidth) => isTablet ? tabletWidth : phoneWidth;
const getResponsiveFontSize = (phoneSize, tabletSize) => isTablet ? tabletSize : phoneSize;
const getResponsiveSpacing = (phoneSpacing, tabletSpacing) => isTablet ? tabletSpacing : phoneSpacing;

const ProfileScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [failedImages, setFailedImages] = useState(new Set());
  const isFocused = useIsFocused();

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

  

  const getImageSource = (imagePath) => {
    const cloudFrontUrl = 'https://dk665xezaubcy.cloudfront.net';
    if (!imagePath) return require('../../assets/model.jpg'); // Default image
    
    console.log('Processing image path:', imagePath);
    
    if (imagePath.startsWith('http')) {
      return { uri: imagePath, cache: 'force-cache' };
    }
    if (imagePath.startsWith('/uploads/')) {
      return { uri: `${cloudFrontUrl}${imagePath}`, cache: 'force-cache' };
    }
    if (!imagePath.startsWith('/')) {
      return { uri: `${cloudFrontUrl}/uploads/images/${imagePath}`, cache: 'force-cache' };
    }
    console.log('Using fallback image for:', imagePath);
    return require('../../assets/model.jpg'); // Fallback
  };

  // Handle image loading errors
  const handleImageError = (imagePath, error) => {
    console.log('Image error for:', imagePath, error.nativeEvent);
    setFailedImages(prev => new Set([...prev, imagePath]));
    
    // Retry the image after a delay
    setTimeout(() => {
      setFailedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imagePath);
        return newSet;
      });
    }, 5000); // Retry after 5 seconds
  };

  // Check what files are available in uploads directory
  const checkUploadsDirectory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/debug/uploads`);
      console.log('Uploads directory contents:', response.data);
    } catch (error) {
      console.log('Failed to check uploads directory:', error.message);
    }
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
      console.log('Fetched user data:', userData);
      console.log('Profile pictures:', userData.profilePictures);
      
      // Check uploads directory after fetching user data
      await checkUploadsDirectory();
      
      setUser(userData);
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

  // Refetch profile when screen is focused
  useEffect(() => {
    if (isFocused) {
      fetchUserProfile();
    }
  }, [isFocused]);

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C40CF2" />
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
  const profileImage = user.profilePictures && user.profilePictures.length > 0 
    ? getImageSource(user.profilePictures[0]) 
    : require('../../assets/model.jpg');

  // Calculate profile completion percentage
  const profileFields = ['username', 'goal', 'height', 'interests', 'kids', 'career', 'zodiac', 'education', 'personality', 'religon', 'lifestyle', 'location', 'age', 'profilePictures'];
  const completedFields = profileFields.filter(field => {
    if (field === 'profilePictures') return user[field] && user[field].length >= 2;
    if (field === 'interests' || field === 'lifestyle') return user[field] && user[field].length > 0;
    return user[field] && user[field] !== '';
  }).length;
  const completionPercentage = Math.round((completedFields / profileFields.length) * 100);

  return ( 
    <View style={styles.container}>
      <BlockReportModals
        blockModalVisible={blockModalVisible}
        setBlockModalVisible={setBlockModalVisible}
        reportModalVisible={reportModalVisible}
        setReportModalVisible={setReportModalVisible}
      />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <FontAwesome6 name="gear" size={getResponsiveWidth(24, 28)} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Profile Header */}
        <View style={styles.profileHeaderContainer}>
          <View style={styles.progressRingContainer}>
            <Svg width={240} height={240}>
              {/* Background ring (unfilled part) */}
              <Circle
                cx={120}
                cy={120}
                r={110}
                stroke="#FFFFFF80"
                strokeWidth={6}
                fill="none"
              />
              {/* Foreground progress ring */}
              <Circle
                cx={120}
                cy={120}
                r={110}
                stroke="#EC066A"
                strokeWidth={6}
                fill="none"
                strokeDasharray={2 * Math.PI * 110}
                strokeDashoffset={2 * Math.PI * 110 * (1 - completionPercentage / 100)}
                strokeLinecap="round"
              />
            </Svg>
            <View style={styles.imageGapWrapper}>
              <Image 
                source={profileImage} 
                style={styles.profileImage}
                onError={(error) => handleImageError(profileImage.uri, error)}
                onLoad={() => console.log('Profile image loaded successfully')}
                key={profileImage.uri + (failedImages.has(profileImage.uri) ? '-retry' : '')}
              />
            </View>
            <View style={styles.progressTextBoxContainer}>
              <View style={styles.progressTextBox}>
                <Text style={styles.progressText}>{completionPercentage}%</Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.profileName}>{user.username || 'User'}, {userAge || 'N/A'}</Text>
              <MaterialIcons name="verified" size={24} color="#EC066A" />
            </View>
            <Text style={styles.profileLocation}>{user.location || 'Location not set'}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editProfileButton}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Image source={ProfileEditIcon} style={{ width: 16, height: 16 }} />
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* Goal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Goal</Text>
          <View style={styles.goalContainer}>
            <Image 
              source={require('../../assets/ring.png')}
              style={{ width: 16, height: 16 }}
            />
            <Text style={styles.goalText}>{user.goal || 'Goal not set'}</Text>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Bio</Text>
          <Text style={styles.bioText}>
            {user.bio || 'Warm-hearted, adventurous, and always up for a good laugh. Let\'s create something meaningful!'}
          </Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <View style={styles.tagsContainer}>
            {[
              user.kids && `Want Kids: ${user.kids}`,
              user.zodiac && user.zodiac,
              user.education && user.education,
              user.personality && user.personality,
              user.religon && user.religon,
              user.height && user.height,
              user.career && user.career
            ].filter(Boolean).map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosContainer}>
              {user.profilePictures && user.profilePictures.length > 0 ? (
                user.profilePictures.map((photo, index) => (
                  <TouchableOpacity 
                    key={index}
                    onPress={() => navigation.navigate('PhotoGallery', {
                      photos: user.profilePictures.map(p => getImageSource(p)),
                      initialIndex: index
                    })}
                  >
                    <Image 
                      source={getImageSource(photo)}
                      style={styles.photo}
                      onError={(error) => handleImageError(photo, error)}
                      onLoad={() => console.log('Gallery image loaded successfully for:', photo)}
                      key={photo + (failedImages.has(photo) ? '-retry' : '')}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No photos uploaded</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Interests</Text>
          <View style={styles.tagsContainer}>
            {user.interests && user.interests.length > 0 ? (
              user.interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No interests added</Text>
            )}
          </View>
        </View>

        {/* Lifestyle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>
          <View style={styles.tagsContainer}>
            {user.lifestyle && user.lifestyle.length > 0 ? (
              user.lifestyle.map((lifestyle, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{lifestyle}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No lifestyle choices added</Text>
            )}
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.loctag}>
            <Text style={styles.locationText}>{user.location || 'Location not set'}</Text>
          </View>
        </View>
      </ScrollView>
    </View> 
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
    paddingVertical: 40,
    marginBottom:56
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(20, 40),
    paddingTop: getResponsiveSpacing(24, 30),
    marginBottom: getResponsiveSpacing(10, 15),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(24, 28),
    color: '#fff',
    fontWeight: '700',
    fontFamily: FONTS.regular,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 90,
    backgroundColor:'#EC066A'
  },
  shareText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  section: {
    paddingHorizontal:20,
    paddingBottom: 20,
    paddingTop:5,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    fontFamily: FONTS.regular,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 90,
    alignSelf: 'flex-start',
  },
  goalText: {
    color: 'rgba(225, 225, 225, 0.5)',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  bioText: {
    color: 'rgba(225, 225, 225, 0.5)',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12, 
    borderRadius: 20,
    alignSelf: 'flex-start', // Ensures tag only takes up its content width
  },
  tagText: {
    color: 'rgba(225, 225, 225, 0.5)',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 10,
    borderwidth: 1,
    borderColor: 'white',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderColor: 'white',
    borderWidth: 1,
  },
  locationText: {
    color: 'rgba(225, 225, 225, 0.5)',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  loctag: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start', // Ensures loctag only takes up its content width
  },
  
  
  
  dislikeButton: {
    backgroundColor: '#fff',
  },
  likeButton: {
    backgroundColor: '#ec066a',
  },
  profileHeaderContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  progressRingContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imageGapWrapper: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 96,
  },
  progressTextBoxContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  progressTextBox: {
    backgroundColor: '#ec066a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#EC066A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '500',
    fontFamily: FONTS.regular,
  },
  profileLocation: {
    color: 'rgba(225,225,225,0.5)',
    fontSize: 16,
    marginVertical: 12,
    fontFamily: FONTS.regular,
  },
  editProfileButton: {
    backgroundColor: '#EC066A',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  editProfileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
});

export default ProfileScreen;
