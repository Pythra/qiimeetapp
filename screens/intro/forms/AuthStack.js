import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PhoneNumberScreen from './PhoneNumberScreen';
import VerificationCodeScreen from './VerificationCodeScreen';
import WelcomeScreen from '../WelcomeScreen';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
        <Stack.Screen name="VerificationCode" component={VerificationCodeScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      </Stack.Navigator>
  );
};

export default AuthStack;
