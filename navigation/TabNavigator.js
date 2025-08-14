import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native'; 
import { useFocusEffect } from '@react-navigation/native';
import Home from '../screens/Home/Home';
import HomeStack from './HomeStack'; // Import HomeStack instead of Home
import LikeStack from './LikeStack';
import PremiumStack from './PremiumStack';
import ChatStack from './ChatStack';
import ProfileStack from './ProfileStack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'; // Add this import
import { useAuth } from '../components/AuthContext';

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
    height: '10%',
    paddingBottom: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  };
};

const TabNavigator = () => {
  const { dataReady, loading, initialized, refreshAllData, forceRefreshAuthState, token, user } = useAuth();
  const [forceShow, setForceShow] = useState(false);

  // IMMEDIATE force show - no delays, show app right away
  useEffect(() => {
    console.log('[TabNavigator] Component mounted, forcing immediate show...');
    setForceShow(true);
  }, []);

  // Simple check to restore auth state if needed
  useEffect(() => {
    if (dataReady && !token && !user && !loading) {
      console.log('[TabNavigator] Detected dataReady=true but missing token/user, forcing auth refresh...');
      forceRefreshAuthState();
    }
  }, [dataReady, token, user, loading, forceRefreshAuthState]);

  // Refresh authentication state when MainTabs comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[TabNavigator] MainTabs focused, refreshing authentication state...');
      
      // Force a refresh of the authentication context
      // This will trigger re-renders of all screens with updated user data
      const refreshAuthState = async () => {
        try {
          // Add a small delay to ensure Clerk state is fully established
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Force a refresh by triggering a small state change
          // This will cause all child screens to re-render with fresh data
          console.log('[TabNavigator] Authentication state refresh completed');
          
          // Additional delay to ensure all screens have time to refresh
          await new Promise(resolve => setTimeout(resolve, 300));
          console.log('[TabNavigator] Screen refresh delay completed');
          
        } catch (error) {
          console.warn('[TabNavigator] Error refreshing auth state:', error);
        }
      };
      
      // Only refresh if we haven't refreshed recently to prevent unnecessary re-renders
      const lastRefresh = Date.now();
      if (!global.lastTabNavigatorRefresh || (lastRefresh - global.lastTabNavigatorRefresh) > 10000) { // 10 seconds
        global.lastTabNavigatorRefresh = lastRefresh;
        refreshAuthState();
      }
    }, [])
  );

  // ALWAYS show the app - no loading screens, no delays
  console.log('[TabNavigator] Force show active, displaying app immediately...');
  
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
              source={focused ? require('../assets/tab_icons/redcompass.png') : require('../assets/tab_icons/compass.png')}
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
              source={focused ? require('../assets/tab_icons/redlikes.png') : require('../assets/tab_icons/likes.png')}
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
              source={focused ? require('../assets/tab_icons/reddiamond.png') : require('../assets/tab_icons/diamond.png')}
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
              source={focused ? require('../assets/tab_icons/redchat.png') : require('../assets/tab_icons/chat.png')}
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
              source={focused ? require('../assets/tab_icons/redprofile.png') : require('../assets/tab_icons/profile.png')}
              style={{ width: 24, height: 24 }}
            />
          ),
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});

export default TabNavigator;