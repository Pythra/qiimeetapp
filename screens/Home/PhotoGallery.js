import React, { useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import ScreenWrapper from '../../components/ScreenWrapper';

const { width, height } = Dimensions.get('window');

const PhotoGallery = ({ navigation, route }) => {
  const { photos, initialIndex = 0 } = route.params;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleSwipe = (event) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      const swipeThreshold = 50; // Minimum distance for a swipe
      
      if (translationX > swipeThreshold) {
        // Swipe right - go to previous image
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      } else if (translationX < -swipeThreshold) {
        // Swipe left - go to next image
        if (currentIndex < photos.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    }
  };

  return (
    <ScreenWrapper 
      style={styles.container}
      backgroundColor="#000"
      statusBarColor="#000"
    > 
      <View style={styles.header}>
        <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={32} color="white" />
        </TouchableWithoutFeedback>
      </View>

      <PanGestureHandler onHandlerStateChange={handleSwipe}>
        <View style={styles.contentContainer}>
          <Image
            source={photos[currentIndex]}
            style={styles.photo}
            resizeMode="cover"
          />
          <View style={styles.paginationWrapper}>
            {[...Array(photos.length)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationLine,
                  {
                    backgroundColor:
                      index === currentIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </PanGestureHandler>
    </ScreenWrapper> 
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: { 
    paddingHorizontal: 12, 
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: width * 0.91,
    height: height * 0.8,
    borderRadius: 8,
    top:-12
  },
  paginationWrapper: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    width: 294,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    zIndex: 2,
  },
  paginationLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});

export default PhotoGallery;