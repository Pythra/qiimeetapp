import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import IntroSlides from '../screens/intro/IntroSlides';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import TabNavigator from './TabNavigator';
import LandingScreen from '../screens/intro/LandingScreen';

const Stack = createStackNavigator();

const AppStack = ({ initialRouteName }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName || 'IntroSlides'}>
      <Stack.Screen 
        name="IntroSlides" 
        component={IntroSlides}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="Onboarding" component={OnboardingStack} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
    </Stack.Navigator>
  );
};

export default AppStack;
