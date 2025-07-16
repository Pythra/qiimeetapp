import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PremiumScreen from '../screens/Premium/Premium'; 
import ProfileVerificationScreen from '../screens/Premium/ProfileVerificationScreen';
import VerificationProcess from '../screens/Premium/VerificationProcess';
import PhotoVerification from '../screens/Premium/PhotoVerification';
import CameraVerification from '../screens/Premium/CameraVerification';
import IdentityVerification from '../screens/Premium/IdentityVerification';
import DocumentUpload from '../screens/Premium/DocumentUpload';
import VerificationInProgress from '../screens/Premium/VerificationInProgress';
import AllFeatures from '../screens/Premium/AllFeatures';
import FundWallet from '../screens/Premium/FundWallet';
import VerificationSuccessful from '../screens/Premium/VerificationSuccessful';
import PayForConnectionScreen from '../screens/Premium/PayForConnectionScreen';
import SubscriptionScreen from '../screens/Premium/SubscriptionScreen';
import ViewHistoryScreen from '../screens/Premium/ViewHistoryScreen';
import HistoryDetailScreen from '../screens/Premium/HistoryDetailScreen';
import ReSubscribeScreen from '../screens/Premium/ReSubscribeScreen';
import DateOfBirthScreen from '../screens/intro/forms/DateOfBirthScreen';

const Stack = createStackNavigator();

const PremiumStack = () => {
  return (
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
      <Stack.Screen name="PremiumScreen" component={PremiumScreen} /> 
      <Stack.Screen name="ProfileVerification" component={ProfileVerificationScreen} />
      <Stack.Screen name="VerificationProcess" component={VerificationProcess} />
      <Stack.Screen name="PhotoVerification" component={PhotoVerification} />
      <Stack.Screen name="CameraVerification" component={CameraVerification} />
      <Stack.Screen name="IdentityVerification" component={IdentityVerification} />
      <Stack.Screen name="DocumentUpload" component={DocumentUpload} />
      <Stack.Screen name="VerificationInProgress" component={VerificationInProgress} />
      <Stack.Screen name="AllFeatures" component={AllFeatures} />
      <Stack.Screen name="FundWallet" component={FundWallet} />
      <Stack.Screen name="VerificationSuccessful" component={VerificationSuccessful} />
      <Stack.Screen name="PayForConnection" component={PayForConnectionScreen} /> 
      <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <Stack.Screen name="ViewHistoryScreen" component={ViewHistoryScreen} />
      <Stack.Screen name="HistoryDetailScreen" component={HistoryDetailScreen} />
      <Stack.Screen name="ReSubscribeScreen" component={ReSubscribeScreen} />
      <Stack.Screen name="DateOfBirthScreen" component={DateOfBirthScreen} />
    </Stack.Navigator>
  );
};

export default PremiumStack;
