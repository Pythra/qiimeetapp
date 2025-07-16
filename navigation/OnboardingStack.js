import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DisplayNameScreen from '../screens/intro/forms/DisplayNameScreen';
import LookingForScreen from '../screens/intro/forms/LookingForScreen';
import DateOfBirthScreen from '../screens/intro/forms/DateOfBirthScreen';
import GoalsScreen from '../screens/intro/forms/GoalsScreen';
import AboutYouScreen from '../screens/intro/forms/AboutYouScreen';
import InterestsScreen from '../screens/intro/forms/InterestsScreen';
import LifestyleChoicesScreen from '../screens/intro/forms/LifestyleChoicesScreen';
import FutureKidsScreen from '../screens/intro/forms/FutureKidsScreen';
import ZodiacSignScreen from '../screens/intro/forms/ZodiacSignScreen';
import EducationLevelScreen from '../screens/intro/forms/EducationLevelScreen';
import PersonalityScreen from '../screens/intro/forms/PersonalityScreen';
import ReligionScreen from '../screens/intro/forms/ReligionScreen';
import CurrentWorkScreen from '../screens/intro/forms/CurrentWorkScreen';
import PhotosScreen from '../screens/intro/forms/PhotosScreen';
import LocationScreen from '../screens/intro/forms/LocationScreen';
import DisplayInterestsScreen from '../screens/intro/forms/DisplayInterestsScreen';
import DisplayLifestyleChoicesScreen from '../screens/intro/forms/DisplayLifestyleChoicesScreen';
import Home from '../screens/Home/Home';
import SignInScreen from '../screens/intro/forms/SignInScreen';
import VerificationCodeScreen from '../screens/intro/forms/VerificationCodeScreen';

const Stack = createStackNavigator();

const OnboardingStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: false,
      // Add this to eliminate all transition animations
      animationTypeForReplace: 'none',
      gestureEnabled: false,
      cardStyleInterpolator: () => ({
        cardStyle: { opacity: 1 },
      }),
    }}
  >
    <Stack.Screen name="DisplayName" component={DisplayNameScreen} />
    <Stack.Screen name="LookingFor" component={LookingForScreen} />
    <Stack.Screen name="DateOfBirth" component={DateOfBirthScreen} />
    <Stack.Screen name="Goals" component={GoalsScreen} />
    <Stack.Screen name="AboutYou" component={AboutYouScreen} />
    <Stack.Screen name="Interests" component={InterestsScreen} />
    <Stack.Screen name="LifestyleChoices" component={LifestyleChoicesScreen} />
    <Stack.Screen name="FutureKids" component={FutureKidsScreen} />
    <Stack.Screen name="ZodiacSign" component={ZodiacSignScreen} />
    <Stack.Screen name="EducationLevel" component={EducationLevelScreen} />
    <Stack.Screen name="Personality" component={PersonalityScreen} />
    <Stack.Screen name="Religion" component={ReligionScreen} />
    <Stack.Screen name="CurrentWork" component={CurrentWorkScreen} />
    <Stack.Screen name="Photos" component={PhotosScreen} />
    <Stack.Screen name="Location" component={LocationScreen} />
    <Stack.Screen name="DisplayInterests" component={DisplayInterestsScreen} />
    <Stack.Screen name="DisplayLifestyleChoices" component={DisplayLifestyleChoicesScreen} />
    <Stack.Screen name="SignIn" component={SignInScreen} />
    <Stack.Screen name="VerificationCode" component={VerificationCodeScreen} />
  </Stack.Navigator>
);

export default OnboardingStack;
