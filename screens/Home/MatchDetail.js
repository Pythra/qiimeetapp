import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS } from '../../constants/font';
import BlockReportModals from './BlockReportModals';
import ScreenWrapper from '../../components/ScreenWrapper';
import { FontAwesome6 } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../../env';
import { useAuth } from '../../components/AuthContext';

const MatchDetail = ({ navigation, route }) => {
  const userId = route.params?.userId;
  const { token, initialized, getProfileImageSource, getImageSource } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_BASE_URL}/auth/user/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setUser(response.data);
      } catch (err) {
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId && initialized) fetchUser();
  }, [userId, token, initialized]);

    // Show skeleton loader while loading or if no user data
  if (loading || !user) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          {/* Header - Keep interactive elements outside skeleton */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 90,
              backgroundColor: '#2A2A2A',
              width: 100,
              height: 40
            }} />
          </View>

          <ScrollView>
            {/* Goal Section Skeleton */}
            <View style={[styles.section, { paddingBottom: 20, paddingTop: 5 }]}>
              <View style={{ width: 50, height: 38, borderRadius: 4, marginBottom: 10, backgroundColor: '#2A2A2A' }} />
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#1E1E1E',
                padding: 10,
                borderRadius: 90,
                alignSelf: 'flex-start',
                width: 200,
                height: 80
              }}>
                <View style={{ width: 16, height: 32, borderRadius: 8, backgroundColor: '#2A2A2A' }} />
                <View style={{ width: 150, height: 32, borderRadius: 4, backgroundColor: '#2A2A2A' }} />
              </View>
            </View>

            {/* Bio Section Skeleton */}
            <View style={[styles.section, { paddingBottom: 20, paddingTop: 5 }]}>
              <View style={{ width: 40, height: 38, borderRadius: 4, marginBottom: 10, backgroundColor: '#2A2A2A' }} />
              <View style={{ width: '85%', height: 40, borderRadius: 4, backgroundColor: '#2A2A2A' }} />
            </View>

            {/* About Section Skeleton */}
            <View style={[styles.section, { paddingBottom: 20, paddingTop: 5 }]}>
              <View style={{ width: 60, height: 38, borderRadius: 4, marginBottom: 10, backgroundColor: '#2A2A2A' }} />
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
              }}>
                {[
                  { width: 110, text: 'Want Kids' },
                  { width: 85, text: 'Zodiac' },
                  { width: 95, text: 'Education' },
                  { width: 100, text: 'Personality' },
                  { width: 75, text: 'Religion' },
                  { width: 70, text: 'Height' },
                  { width: 80, text: 'Career' }
                ].map((item, index) => (
                  <View key={index} style={{
                    backgroundColor: '#1E1E1E',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    alignSelf: 'flex-start',
                    width: item.width,
                    height: 64
                  }}>
                    <View style={{ width: item.width - 24, height: 32, borderRadius: 4, backgroundColor: '#2A2A2A' }} />
                  </View>
                ))}
              </View>
            </View>

            {/* Lifestyle Section Skeleton */}
            <View style={[styles.section, { paddingBottom: 20, paddingTop: 5 }]}>
              <View style={{ width: 80, height: 38, borderRadius: 4, marginBottom: 10, backgroundColor: '#2A2A2A' }} />
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
              }}>
                {[
                  { width: 120 },
                  { width: 95 },
                  { width: 110 }
                ].map((item, index) => (
                  <View key={index} style={{
                    backgroundColor: '#1E1E1E',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    alignSelf: 'flex-start',
                    width: item.width,
                    height: 64
                  }}>
                    <View style={{ width: item.width - 24, height: 32, borderRadius: 4, backgroundColor: '#2A2A2A' }} />
                  </View>
                ))}
              </View>
            </View>

            {/* Photos Section Skeleton */}
            <View style={[styles.section, { paddingBottom: 20, paddingTop: 5 }]}>
              <View style={{ width: 70, height: 38, borderRadius: 4, marginBottom: 10, backgroundColor: '#2A2A2A' }} />
              <View style={{
                flexDirection: 'row',
                gap: 10,
              }}>
                {[1, 2, 3].map((item) => (
                  <View 
                    key={item} 
                    style={{
                      width: 100,
                      height: 200,
                      borderRadius: 8,
                      backgroundColor: '#1E1E1E'
                    }} 
                  />
                ))}
              </View>
            </View>

            {/* Interests Section Skeleton */}
            <View style={[styles.section, { paddingBottom: 20, paddingTop: 5 }]}>
              <View style={{ width: 90, height: 38, borderRadius: 4, marginBottom: 10, backgroundColor: '#2A2A2A' }} />
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
              }}>
                {[
                  { width: 80 },
                  { width: 100 },
                  { width: 70 },
                  { width: 110 },
                  { width: 90 },
                  { width: 85 }
                ].map((item, index) => (
                  <View key={index} style={{
                    backgroundColor: '#1E1E1E',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    alignSelf: 'flex-start',
                    width: item.width,
                    height: 64
                  }}>
                    <View style={{ width: item.width - 24, height: 32, borderRadius: 4, backgroundColor: '#2A2A2A' }} />
                  </View>
                ))}
              </View>
            </View>

            {/* Language Section Skeleton */}
            <View style={[styles.section, { paddingBottom: 20, paddingTop: 5 }]}>
              <View style={{ width: 80, height: 38, borderRadius: 4, marginBottom: 10, backgroundColor: '#2A2A2A' }} />
              <View style={{
                backgroundColor: '#1E1E1E',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 20,
                alignSelf: 'flex-start',
                width: 80,
                height: 64
              }}>
                <View style={{ width: 56, height: 32, borderRadius: 4, backgroundColor: '#2A2A2A' }} />
              </View>
            </View>

            {/* Location Section Skeleton */}
            <View style={[styles.section, { paddingBottom: 20, paddingTop: 5 }]}>
              <View style={{ width: 70, height: 38, borderRadius: 4, marginBottom: 10, backgroundColor: '#2A2A2A' }} />
              <View style={{
                backgroundColor: '#1E1E1E',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 20,
                alignSelf: 'flex-start',
                width: 75,
                height: 64
              }}>
                <View style={{ width: 51, height: 32, borderRadius: 4, backgroundColor: '#2A2A2A' }} />
              </View>
            </View>

            {/* Bottom Actions Skeleton */}
            <View style={{ padding: 20 }}>
              {/* Block Button */}
              <View style={{
                padding: 15,
                borderRadius: 8,
                alignItems: 'center',
                height: 100,
                justifyContent: 'center'
              }}>
                <View style={{ width: 120, height: 38, borderRadius: 4, backgroundColor: '#2A2A2A' }} />
              </View>
              
              {/* Report Button */}
              <View style={{
                padding: 15,
                borderRadius: 8,
                alignItems: 'center',
                height: 100,
                justifyContent: 'center'
              }}>
                <View style={{ width: 140, height: 38, borderRadius: 4, backgroundColor: '#2A2A2A' }} />
              </View>
              
              {/* Action Buttons */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 24,
                marginTop: 20,
              }}>
                <View style={{
                  width: 64,
                  height: 128,
                  borderRadius: 32,
                  backgroundColor: '#1E1E1E'
                }} />
                <View style={{
                  width: 64,
                  height: 128,
                  borderRadius: 32,
                  backgroundColor: '#1E1E1E'
                }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </ScreenWrapper>
    );
  }

  // Show error state only if there's an actual error
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <Text style={{ color: 'white' }}>{error}</Text>
      </View>
    );
  }



  // Helper to calculate age from dateOfBirth
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

  return (
    <ScreenWrapper>
    <View style={styles.container}>
      <BlockReportModals
        blockModalVisible={blockModalVisible}
        setBlockModalVisible={setBlockModalVisible}
        reportModalVisible={reportModalVisible}
        setReportModalVisible={setReportModalVisible}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />     
           </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareText}>Share</Text>
          <Ionicons name="share-outline" size={18} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Goal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal</Text>
          <View style={styles.goalContainer}>
            <Image 
              source={require('../../assets/ring.png')}
              style={{ width: 16, height: 16 }}
            />
            <Text style={styles.goalText}>{user.goal || 'No goal set'}</Text>
          </View>
        </View>
        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bioText}>
            {user.username ? `${user.username}, ` : ''}
            {user.gender ? `${user.gender}, ` : ''}
            {user.dateOfBirth ? `Age: ${calculateAge(user.dateOfBirth)}` : ''}
          </Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.tagsContainer}>
            {user.kids && <View style={styles.tag}><Text style={styles.tagText}>Want Kids: {user.kids}</Text></View>}
            {user.zodiac && <View style={styles.tag}><Text style={styles.tagText}>{user.zodiac}</Text></View>}
            {user.education && <View style={styles.tag}><Text style={styles.tagText}>{user.education}</Text></View>}
            {user.personality && <View style={styles.tag}><Text style={styles.tagText}>{user.personality}</Text></View>}
            {user.religon && <View style={styles.tag}><Text style={styles.tagText}>{user.religon}</Text></View>}
            {user.height && <View style={styles.tag}><Text style={styles.tagText}>{user.height}</Text></View>}
            {user.career && <View style={styles.tag}><Text style={styles.tagText}>{user.career}</Text></View>}
          </View>
        </View>

        {/* Lifestyle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>
          <View style={styles.tagsContainer}>
            {Array.isArray(user.lifestyle) && user.lifestyle.length > 0 ? (
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


        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosContainer}>
              {Array.isArray(user.profilePictures) && user.profilePictures.length > 0 ? (
                user.profilePictures.map((photo, index) => (
                  <TouchableOpacity 
                    key={index}
                    onPress={() => navigation.navigate('PhotoGallery', {
                      photos: user.profilePictures.map(photo => getImageSource(photo)),
                      initialIndex: index
                    })}
                  >
                    <Image 
                      source={getImageSource(photo)}
                      style={styles.photo}
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
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tagsContainer}>
            {Array.isArray(user.interests) && user.interests.length > 0 ? (
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
        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
           <View style={styles.loctag}>
          <Text style={styles.locationText}>English</Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
           <View style={styles.loctag}>
          <Text style={styles.locationText}>Abuja</Text>
          </View>
        </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.blockButton}
          onPress={() => setBlockModalVisible(true)}
        >
          <Text style={styles.blockText}>Block {user.name}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => setReportModalVisible(true)}
        >
          <Text style={styles.reportText}>Report {user.name}</Text>
        </TouchableOpacity>
        {/* Like/Dislike Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.dislikeButton]}>
          <FontAwesome6 name="xmark" size={44} color="#ec066a" style={styles.xIcon} />

          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.likeButton]}>
          <Ionicons name="heart" size={40} color="#fff" />

          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, 
    marginBottom:8,
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
    lineHeight: 20,
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
  bottomActions: {
    padding: 20, 
  },
  blockButton: { 
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  blockText: {
    color: '#DC3545',
    fontSize: 16,
    fontFamily: FONTS.regular,
    fontWeight: '600',
  },
  reportButton: { 
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  reportText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 20,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  dislikeButton: {
    backgroundColor: '#fff',
  },
  likeButton: {
    backgroundColor: '#ec066a',
  },
});

export default MatchDetail;
