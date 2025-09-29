import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';

const ProfilePopupModal = ({ visible, onClose, user, getProfileImageSource, getImageSource, calculateAge }) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  
  // Reset to first image when modal opens
  React.useEffect(() => {
    if (visible) {
      setCurrentImageIndex(0);
    }
  }, [visible]);
  
  if (!user) return null;

  const userAge = user.age || calculateAge(user.dateOfBirth);
  
  // Get all user images (profile picture + additional photos)
  const allImages = user.profilePictures || [];
  const currentImage = allImages.length > 0 && allImages[currentImageIndex] 
    ? getImageSource(allImages[currentImageIndex]) 
    : getProfileImageSource(user);
  
  const handleImageChange = (index) => {
    if (index >= 0 && index < allImages.length && allImages[index]) {
      setCurrentImageIndex(index);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
                         {/* Profile Image */}
             <View style={styles.imageContainer}>
               <Image 
                 source={currentImage} 
                 style={styles.profileImage}
                 resizeMode="cover"
                 onError={(error) => console.log('Profile image failed to load:', error)}
                 defaultSource={require('../../assets/model.jpg')}
               />
               
               {/* Image Gallery Overlay at Bottom */}
               {allImages.length > 1 && (
                 <View style={styles.imageGalleryOverlay}>
                   {allImages.filter(image => image).map((image, index) => (
                     <TouchableOpacity
                       key={index}
                       style={[
                         styles.galleryThumbnail,
                         currentImageIndex === index && styles.activeThumbnail
                       ]}
                       onPress={() => handleImageChange(index)}
                     >
                       <Image 
                         source={getImageSource(image)} 
                         style={styles.thumbnailImage}
                         resizeMode="cover"
                         onError={(error) => console.log('Thumbnail image failed to load:', error)}
                         defaultSource={require('../../assets/model.jpg')}
                       />
                     </TouchableOpacity>
                   ))}
                 </View>
               )}
             </View>

            {/* User Basic Info */}
            <View style={styles.basicInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>
                  {user.username || user.name || 'User'}
                  {userAge ? `, ${userAge}` : ''}
                </Text>
                {(user.verificationStatus === 'verified') && (
                  <MaterialIcons 
                    name="verified" 
                    size={24} 
                    color="#ec066a" 
                    style={styles.verifiedBadge}
                  />
                )}
              </View>
              
              {user.location && (
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={16} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.locationText}>{user.location}</Text>
                </View>
              )}
            </View>

            {/* Bio Section */}
            {user.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bioText}>{user.bio}</Text>
              </View>
            )}

            {/* Personal Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              
              {user.gender && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gender:</Text>
                  <Text style={styles.detailValue}>{user.gender}</Text>
                </View>
              )}
              
              {user.goal && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Looking for:</Text>
                  <Text style={styles.detailValue}>{user.goal}</Text>
                </View>
              )}
              
              {user.education && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Education:</Text>
                  <Text style={styles.detailValue}>{user.education}</Text>
                </View>
              )}
              
              {user.career && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Work:</Text>
                  <Text style={styles.detailValue}>{user.career}</Text>
                </View>
              )}
              
              {user.height && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Height:</Text>
                  <Text style={styles.detailValue}>{user.height}</Text>
                </View>
              )}
              
              {user.kids && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kids:</Text>
                  <Text style={styles.detailValue}>{user.kids}</Text>
                </View>
              )}
              
              {user.zodiac && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Zodiac:</Text>
                  <Text style={styles.detailValue}>{user.zodiac}</Text>
                </View>
              )}
              
              {user.personality && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Personality:</Text>
                  <Text style={styles.detailValue}>{user.personality}</Text>
                </View>
              )}
              
              {user.religon && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Religion:</Text>
                  <Text style={styles.detailValue}>{user.religon}</Text>
                </View>
              )}
            </View>

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.interestsContainer}>
                  {user.interests.map((interest, index) => (
                    <View key={index} style={styles.interestChip}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Lifestyle */}
            {user.lifestyle && user.lifestyle.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lifestyle</Text>
                <View style={styles.interestsContainer}>
                  {user.lifestyle.map((item, index) => (
                    <View key={index} style={styles.interestChip}>
                      <Text style={styles.interestText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

                         {/* Languages */}
             {user.languages && user.languages.length > 0 && (
               <View style={styles.section}>
                 <Text style={styles.sectionTitle}>Languages</Text>
                 <View style={styles.interestsContainer}>
                   {user.languages.map((language, index) => (
                     <View key={index} style={styles.interestChip}>
                       <Text style={styles.interestText}>{language}</Text>
                     </View>
                   ))}
                 </View>
               </View>
             )}
             

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
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    position: 'relative',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  basicInfo: {
    padding: 20,
    paddingBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.regular,
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginLeft: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.regular,
    marginBottom: 12,
  },
  bioText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontWeight: '500',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: '#ec066a',
    borderWidth: 0,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  interestText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  imageGalleryOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 5,
  },
  galleryThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  activeThumbnail: {
    borderColor: '#ec066a',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

export default ProfilePopupModal;
