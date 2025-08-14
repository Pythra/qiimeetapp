import React, { useState, useRef, useEffect } from 'react';
import { FONTS } from '../../constants/font';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Image,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import Carousel from 'react-native-reanimated-carousel';
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
            colors={['rgba(0,0,0,0)', '#121212', '#121212']}
            locations={[0.65, 0.88, 0.95]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradient}
          />
        </View>
      </View>
    );
  };

  const handleGetStarted = () => {
    navigation.replace('Landing');
  };

  // If images aren't loaded, show loading indicator with dark background
  if (!allImagesLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <ActivityIndicator size="large" color="#ff2d7a" />
        <Text style={{ 
          color: '#fff', 
          marginTop: 16, 
          fontSize: 16,
          fontFamily: FONTS.regular
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  return ( 
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        
        <Carousel
          loop={true}
          width={width}
          height={height * 0.7}
          data={data}
          renderItem={renderItem}
          scrollEnabled={true}
          autoPlay={true}
          autoplayInterval={4000}
          scrollAnimationDuration={800}
          onProgressChange={(_, absoluteProgress) => {
            setCurrentIndex(Math.round(absoluteProgress) % data.length);
          }}
          style={styles.carousel}
        />
        
        {/* New vertical stack for text, indicator, and button */}
        <View style={styles.verticalStack}>
          <Text style={styles.title}>{data[currentIndex].title}</Text>
          <Text style={styles.subtitle}>{data[currentIndex].subtitle}</Text>
          <View style={styles.pagination}>
            {data.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index && styles.activeDot,
                ]}
              />
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
  carousel: {
    paddingTop: 30,
  },
  slide: {
    width: width,
    alignItems: 'center',
    paddingTop: 30,
    flex: 1,
  },
  imageContainer: {
    width: width * 0.87, 
    height: height * 0.65,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
    bottom: 0,  
    alignItems: 'center',
    width: width * 0.87,
    alignSelf: 'center',
    gap: 24, // Slightly reduced spacing to fit better with taller images
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
    transition: 'all 0.3s ease',
  },
  activeDot: {
    width: 24,
    backgroundColor: '#fff',
    opacity: 1,
    transition: 'all 0.3s ease',
  }
});

export default IntroSlides;