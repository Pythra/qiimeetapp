import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import IntroSlides from '../screens/intro/IntroSlides';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import TabNavigator from './TabNavigator';
import LandingScreen from '../screens/intro/LandingScreen';
import Bio from '../screens/Profile/Bio';
import Location from '../screens/Profile/Location';

const Stack = createStackNavigator();

const AppStack = ({ initialRouteName }) => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#121212' } // Ensure all screens have dark background
      }} 
      initialRouteName={initialRouteName || 'IntroSlides'}
    >
      <Stack.Screen 
        name="IntroSlides" 
        component={IntroSlides}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="Onboarding" component={OnboardingStack} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Bio" component={Bio} />
      <Stack.Screen name="Location" component={Location} />
    </Stack.Navigator>
  );
};

export default AppStack;
