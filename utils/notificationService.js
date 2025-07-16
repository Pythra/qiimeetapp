import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../env';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  let status;
  if (Platform.OS === 'android') {
    // Android 13+ requires explicit permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    status = existingStatus;
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      status = newStatus;
    }
  } else {
    // iOS
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    status = existingStatus;
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      status = newStatus;
    }
  }
  return status === 'granted';
}

class NotificationService {
  constructor() {
    this.token = null;
  }

  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      try {
        // Use Expo's push token service - this works for both development and production
        const expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId: 'c2dace00-fd4a-4164-a92b-73c5ade8845f', // Your EAS project ID
        });
        token = expoPushToken.data;
        console.log('Expo push token obtained:', token);
      } catch (error) {
        console.error('Error getting Expo push token:', error);
        // Fallback for development
        try {
          const expoPushToken = await Notifications.getExpoPushTokenAsync();
          token = expoPushToken.data;
          console.log('Fallback push token obtained:', token);
        } catch (fallbackError) {
          console.error('Fallback error getting push token:', fallbackError);
        }
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  async initializeNotifications() {
    try {
      console.log('Initializing notifications...');
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        this.token = token;
        await this.saveTokenToServer(token);
        console.log('Push token saved successfully');
      } else {
        console.log('No push token received - notifications may not work');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      // Don't throw the error, just log it so the app can continue
    }
  }

  async saveTokenToServer(token) {
    try {
      const userToken = await AsyncStorage.getItem('token');
      if (userToken) {
        const response = await fetch(`${API_BASE_URL}/auth/update-notification-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
          body: JSON.stringify({ expoNotificationToken: token }),
        });

        if (response.ok) {
          console.log('Notification token saved to server');
        } else {
          console.error('Failed to save notification token to server');
        }
      }
    } catch (error) {
      console.error('Error saving token to server:', error);
    }
  }

  async updateTokenOnLogin() {
    if (this.token) {
      await this.saveTokenToServer(this.token);
    }
  }

  async sendNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Send immediately
    });
  }
}

export default new NotificationService(); 