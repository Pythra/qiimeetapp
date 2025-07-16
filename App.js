import React, { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import AppStack from './navigation/AppStack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './components/AuthContext';
import notificationService, { requestNotificationPermission } from './utils/notificationService';
import * as Notifications from 'expo-notifications';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const App = () => {
  const [appReady, setAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState(undefined);

  useEffect(() => {
    const prepare = async () => {
      try {
        await AsyncStorage.getItem('token');
        const token = await AsyncStorage.getItem('token');
        console.log(token);
        if (token) {
          setInitialRoute('MainTabs');
        } else {
          setInitialRoute('IntroSlides'); // Set your default route here
        }
        
        // Request notification permissions before initializing notifications
        try {
          const permissionGranted = await requestNotificationPermission();
          if (!permissionGranted) {
            console.log('Notification permission not granted');
          }
          // Initialize push notifications
          await notificationService.initializeNotifications();
        } catch (notificationError) {
          console.warn('Notification initialization failed:', notificationError);
          // Continue with app initialization even if notifications fail
        }
        
        setAppReady(true);
      } catch (e) {
        console.warn('Error during app preparation:', e);
        setInitialRoute('IntroSlides'); // Fallback to default
        setAppReady(true);
      }
    };
    prepare();
  }, []);

  useEffect(() => {
    if (appReady) {
      const hideSplash = async () => {
        await SplashScreen.hideAsync();
      };
      hideSplash();
    }
  }, [appReady]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#121212');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  // Handle notification responses
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap - navigate to appropriate screen
      const data = response.notification.request.content.data;
      if (data && data.type === 'connection_request') {
        // Navigate to connection requests screen
        // You can implement navigation logic here
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  if (!appReady || !initialRoute) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={{ backgroundColor: '#121212' }}>
        <AuthProvider>
          <NavigationContainer>
            <AppStack initialRouteName={initialRoute} />
          </NavigationContainer>
          <StatusBar style="light" backgroundColor="#121212" /> 
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;