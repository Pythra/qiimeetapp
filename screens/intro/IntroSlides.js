import React, { useState, useRef, useEffect } from 'react';
import { FONTS } from '../../constants/font';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Image,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import CustomButton from '../../constants/button';
import ScreenWrapper from '../../components/ScreenWrapper';

const { width, height } = Dimensions.get('window');

// Function to preload images using Expo's Asset
const preloadImages = async (imageRequires) => {
  const cacheImages = imageRequires.map(image => {
    return Asset.fromModule(image).downloadAsync();
  });
  
  return Promise.all(cacheImages);
};

const IntroSlides = ({ navigation, onReady }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const flatListRef = useRef(null);
  
  const data = [
    {
      id: '1',
      title: 'Maturity',
      subtitle: 'Find connections based on respect, understanding and emotional maturity. Real relationships that grow overtime.',
      image: require('../../assets/swing-thumbnail.jpg'),
    },
    {
      id: '2',
      title: 'Security',
      subtitle: 'Your safety is our major priority, with a secure verification process and privacy first policies, you can connect with confidence.',
      image: require('../../assets/phone-thumbnail.jpg'),
    },
    {
      id: '3',
      title: 'Good Connection',
      subtitle: 'Connect with people who share your values, interests and goals. We focus on quality connections that matter.',
      image: require('../../assets/dance-thumbnail.jpg'),
    },
  ];

  // Preload images when component mounts
  useEffect(() => {
    const loadAssetsAsync = async () => {
      try {
        const imagesToPreload = data.map(item => item.image);
        await preloadImages(imagesToPreload);
        
        // Mark all images as loaded after preloading
        const loadedState = {};
        data.forEach((_, index) => {
          loadedState[index] = true;
        });
        setImagesLoaded(loadedState);
        setAllImagesLoaded(true);
        
        // Notify parent that component is ready
        if (onReady) {
          onReady();
        }
      } catch (error) {
        console.warn('Error loading images:', error);
        // Still mark as ready even if images fail to load
        if (onReady) {
          onReady();
        }
      }
    };

    loadAssetsAsync();
  }, [onReady]);

  const renderItem = ({ item, index }) => {
    const isLoaded = imagesLoaded[index];
    
    return (
      <View style={styles.slide}>
        <View style={styles.imageContainer}>
          <Image 
            source={item.image} 
            style={styles.image} 
            resizeMode="cover" 
          />
          
          {/* Loading indicator */}
          {!isLoaded && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#C40CF2" />
            </View>
          )}
          
          <LinearGradient
            colors={['rgba(0,0,0,0)', '#121212']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradient}
          />
        </View>
        {/* Removed textContainer with title and subtitle */}
      </View>
    );
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const goToSlide = (index) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  const handleGetStarted = () => {
    navigation.replace('Landing');
  };

  // If fonts aren't loaded, show loading indicator
  if (!allImagesLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C40CF2" />
      </View>
    );
  }

  return ( 
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          initialScrollIndex={0}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={3}
        />
        
        {/* New vertical stack for text, indicator, and button */}
        <View style={styles.verticalStack}>
          <Text style={styles.title}>{data[currentIndex].title}</Text>
          <Text style={styles.subtitle}>{data[currentIndex].subtitle}</Text>
          <View style={styles.pagination}>
            {data.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToSlide(index)}
              >
                <View
                  style={[
                    styles.dot,
                    currentIndex === index && styles.activeDot,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
          <CustomButton
            title="Get Started"
            onPress={handleGetStarted}
          />
        </View>
      </View> 
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
    paddingTop: 44,
  },
  slide: {
    width: width,
    alignItems: 'center',
    paddingTop: 30,
    flex: 1,
  },
  imageContainer: {
    width: width * 0.87, 
    height: height * 0.55,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
    width: '100%',
  },
  textContainer: {
    flex: 1,
    width: width * 0.87,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: Platform.OS === 'android' ? 140 : 120, // More padding on Android
  },
  verticalStack: {
    position: 'absolute',
    bottom: 28,  
    alignItems: 'center',
    width: width * 0.87,
    alignSelf: 'center',
    gap: 20, // Even vertical spacing between title, subtitle, indicator, and button
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: -8,
    textAlign: 'center',
    fontFamily: FONTS.bold, 
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)', 
    textAlign: 'center', 
    lineHeight: Platform.OS === 'android' ? 22 : 24,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    includeFontPadding: false, // Android specific - removes extra padding
    textAlignVertical: 'top', // Android specific
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center', 
  },
  dot: {
    height: 8,
    width: 8,
    backgroundColor: '#fff', 
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#fff',
    opacity: 1,
  }
});

export default IntroSlides;