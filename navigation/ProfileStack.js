import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/Profile/Profile';   
import EditProfile from '../screens/Profile/EditProfile';
import Settings from '../screens/Profile/Settings';
import PhotoGallery from '../screens/Home/PhotoGallery';
import Account from '../screens/Profile/Account';
import BlockedUsers from '../screens/Profile/BlockedUsers';
import Height from '../screens/Profile/Height';
import Education from '../screens/Profile/Education';
import Work from '../screens/Profile/Work';
import Kids from '../screens/Profile/Kids';
import Career from '../screens/Profile/Career';
import Personality from '../screens/Profile/Personality';
import Zodiac from '../screens/Profile/Zodiac';
import Religion from '../screens/Profile/Religion';
import Interests from '../screens/Profile/Interests';
import Lifestyle from '../screens/Profile/Lifestyle';
import Language from '../screens/Profile/Language';
import RelationshipGoals from '../screens/Profile/RelationshipGoals';
import BasicInfo from '../screens/Profile/BasicInfo';
import Help from '../screens/Profile/Help';
import FAQs from '../screens/Profile/FAQs';
import PrivacyPolicy from '../screens/Profile/PrivacyPolicy';
import About from '../screens/Profile/About';
import AboutQiimeet from '../screens/Profile/AboutQiimeet';

const Stack = createStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
        animationTypeForReplace: 'none',
        gestureEnabled: false,
        cardStyleInterpolator: () => ({
          cardStyle: { opacity: 1 },
        }),
      }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />    
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="PhotoGallery" component={PhotoGallery} />
      <Stack.Screen name="Account" component={Account} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsers} />
      <Stack.Screen name="Height" component={Height} />
      <Stack.Screen name="Education" component={Education} />
      <Stack.Screen name="Work" component={Work} />
      <Stack.Screen name="Kids" component={Kids} />
      <Stack.Screen name="Career" component={Career} />
      <Stack.Screen name="Personality" component={Personality} />
      <Stack.Screen name="Zodiac" component={Zodiac} />
      <Stack.Screen name="Religion" component={Religion} />
      <Stack.Screen name="Interests" component={Interests} />
      <Stack.Screen name="Lifestyle" component={Lifestyle} />
      <Stack.Screen name="Language" component={Language} />
      <Stack.Screen name="Goal" component={RelationshipGoals} />
      <Stack.Screen name="BasicInfo" component={BasicInfo} />
      <Stack.Screen name="Help" component={Help} />
      <Stack.Screen name="FAQs" component={FAQs} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <Stack.Screen name="About" component={About} />
      <Stack.Screen name="AboutQiimeet" component={AboutQiimeet} />
      <Stack.Screen name="RelationshipGoals" component={RelationshipGoals} />
    </Stack.Navigator>
  );
};

export default ProfileStack;
