import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ProfilePopupModal = ({ visible, onClose, user, getProfileImageSource, getImageSource, calculateAge, navigation }) => {
  if (!user) {
    return null;
  }


  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* Profile Image Container */}
            <View style={styles.modalImageContainer}>
              <Image 
                source={getProfileImageSource(user)} 
                style={styles.modalProfileImage}
                resizeMode="cover"
              />
              
              {/* User Info Overlay on Bottom-Left of Image */}
              <View style={styles.userInfoOverlay}>
                <View style={styles.nameAgeRow}>
                  <Text style={styles.overlayName}>
                    {user?.username || user?.name || 'User'}
                    {user?.age || calculateAge(user?.dateOfBirth) ? `, ${user?.age || calculateAge(user?.dateOfBirth)}` : ''}
                  </Text>
                  {(user?.verificationStatus === 'verified') && (
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons name="verified" size={16} color="#fff" />
                    </View>
                  )}
                </View>
                
                {user?.location && (
                  <View style={styles.locationRow}>
                    <MaterialIcons name="location-on" size={14} color="#fff" />
                    <Text style={styles.locationText}>{user.location}</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Profile Details Section */}
            <View style={styles.modalDetailsContainer}>
              {/* Goal Section */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Goal</Text>
                <View style={styles.goalContainer}>
                  <Text style={styles.goalText}>💍 {user?.goal || 'No goal set'}</Text>
                </View>
              </View>

              {/* Bio Section */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Bio</Text>
                <Text style={styles.bioText}>
                  {user?.bio || 'No bio available'}
                </Text>
              </View>

              {/* About Section */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>About</Text>
                <View style={styles.tagsContainer}>
                  {user?.kids && <View style={styles.tag}><Text style={styles.tagText}>Want Kids: {user.kids}</Text></View>}
                  {user?.zodiac && <View style={styles.tag}><Text style={styles.tagText}>{user.zodiac}</Text></View>}
                  {user?.education && <View style={styles.tag}><Text style={styles.tagText}>{user.education}</Text></View>}
                  {user?.personality && <View style={styles.tag}><Text style={styles.tagText}>{user.personality}</Text></View>}
                  {user?.religon && <View style={styles.tag}><Text style={styles.tagText}>{user.religon}</Text></View>}
                  {user?.height && <View style={styles.tag}><Text style={styles.tagText}>{user.height}</Text></View>}
                  {user?.career && <View style={styles.tag}><Text style={styles.tagText}>{user.career}</Text></View>}
                </View>
              </View>

              {/* Photos Section */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.photosContainer}>
                    {Array.isArray(user?.profilePictures) && user.profilePictures.length > 0 ? (
                      user.profilePictures.map((photo, index) => (
                        <TouchableOpacity 
                          key={index}
                          onPress={() => {
                            if (navigation) {
                              navigation.navigate('PhotoGallery', {
                                photos: user.profilePictures.map(photo => getImageSource(photo)),
                                initialIndex: index
                              });
                            }
                          }}
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
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Interests</Text>
                <View style={styles.tagsContainer}>
                  {Array.isArray(user?.interests) && user.interests.length > 0 ? (
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

              {/* Languages Section */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Languages</Text>
                <View style={styles.tagsContainer}>
                  {Array.isArray(user?.languages) && user.languages.length > 0 ? (
                    user.languages.map((language, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{language}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No languages added</Text>
                  )}
                </View>
              </View>

              {/* Location Section */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Location</Text>
                <View style={styles.locationContainer}>
                  <Text style={styles.locationText}>
                    {user?.location || 'No location added'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: 'transparent',
    borderRadius: 8,
    position: 'relative',
    overflow: 'visible',
  },
  headerButtons: {
    position: 'absolute',
    top: 5,
    right: 20,
    zIndex: 1000,
    flexDirection: 'row',
    gap: 10,
  },
  closeButton: { 
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',  
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    backgroundColor: 'transparent',
  },
  modalImageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalProfileImage: {
    width: '100%',
    height: '100%',
  },
  modalDetailsContainer: {
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  // Profile Details Styles
  profileSection: {
    marginBottom: 24,
  },
  profileSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  goalContainer: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  goalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  bioText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  locationContainer: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  // User Info Overlay Styles
  userInfoOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  nameAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  overlayName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ec066a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 4,
  },
});

export default ProfilePopupModal;
