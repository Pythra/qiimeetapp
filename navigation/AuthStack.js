import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/intro/WelcomeScreen';
import OnboardingStack from './OnboardingStack';
import LandingScreen from '../screens/intro/LandingScreen';
import SignInScreen from '../screens/intro/forms/SignInScreen';
import Signup from '../screens/intro/signup';
import VerificationCodeScreen from '../screens/intro/forms/VerificationCodeScreen';
const Stack = createStackNavigator();

const AuthStack = () => {
  return ( 

<Stack.Navigator
      initialRouteName="Landing" 
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
        // Add this to eliminate all transition animations
        animationTypeForReplace: 'none',
        gestureEnabled: false,
        cardStyle: { backgroundColor: '#121212' }, // Ensure all screens have dark background
        cardStyleInterpolator: () => ({
          cardStyle: { opacity: 1 },
        }),
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingStack} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="VerificationCode" component={VerificationCodeScreen} />
    </Stack.Navigator>
  );
};


export default AuthStack;
