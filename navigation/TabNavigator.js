import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Image } from 'react-native'; 
import Home from '../screens/Home/Home';
import HomeStack from './HomeStack'; // Import HomeStack instead of Home
import LikeStack from './LikeStack';
import PremiumStack from './PremiumStack';
import ChatStack from './ChatStack';
import ProfileStack from './ProfileStack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'; // Add this import

const Tab = createBottomTabNavigator();

const getTabBarStyle = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeScreen';
  const visibleForRoutes = ['HomeScreen', 'LikesMain', 'PremiumScreen', 'ChatScreen', 'ProfileScreen'];

  if (!visibleForRoutes.includes(routeName)) {
    return { display: 'none' };
  }
  
  return {
    backgroundColor: '#121212',
    borderTopWidth: 0,
    elevation: 0,
    height: 100,
    paddingBottom: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  };
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: 60,
          paddingVertical: 8,
        },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={HomeStack} // Use HomeStack instead of Home
        options={({ route }) => ({
          headerShown: false,
          tabBarStyle: getTabBarStyle(route),
          tabBarIcon: ({ focused }) => (
            <Image 
              source={focused ? require('../assets/icons/redcompass.png') : require('../assets/icons/compass.png')}
              style={{ width: 24, height: 24 }}
            />
          ),
        })}
      />
      <Tab.Screen
        name="Likes"
        component={LikeStack}
        options={({ route }) => ({
          headerShown: false,
          tabBarStyle: getTabBarStyle(route),
          tabBarIcon: ({ focused }) => (
            <Image 
              source={focused ? require('../assets/icons/redlikes.png') : require('../assets/icons/likes.png')}
              style={{ width: 27, height: 24 }}
            />
          ),
        })}
      />
      <Tab.Screen
        name="Premium"
        component={PremiumStack}
        options={({ route }) => ({
          headerShown: false,
          tabBarStyle: getTabBarStyle(route),
          tabBarIcon: ({ focused }) => (
            <Image 
              source={focused ? require('../assets/icons/reddiamond.png') : require('../assets/icons/diamond.png')}
              style={{ width: 24, height: 24 }}
            />
          ),  
        })}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStack}
        options={({ route }) => ({
          headerShown: false,
          tabBarStyle: getTabBarStyle(route),
          tabBarIcon: ({ focused }) => (
            <Image 
              source={focused ? require('../assets/icons/redchat.png') : require('../assets/icons/chat.png')}
              style={{ width: 24, height: 24 }}
            />
          ),
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={({ route }) => ({
          headerShown: false,
          tabBarStyle: getTabBarStyle(route),
          tabBarIcon: ({ focused }) => (
            <Image 
              source={focused ? require('../assets/icons/redprofile.png') : require('../assets/icons/profile.png')}
              style={{ width: 24, height: 24 }}
            />
          ),
        })}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;