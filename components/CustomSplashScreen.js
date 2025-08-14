import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CustomSplashScreen = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EC076C', '#F70546']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/splashy.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EC076C', // Match the native splash background
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: SCREEN_WIDTH * 0.7, // Increased from 0.5 to 0.7 for bigger logo
    height: SCREEN_WIDTH * 0.7 * 0.21, // Maintain aspect ratio
  },
});

export default CustomSplashScreen;
