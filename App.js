import React, { useState, useEffect, useRef } from 'react';
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
import { Platform, Dimensions, View, Text, ActivityIndicator, NativeModules } from 'react-native';
import { navigationRef, navigateToTab, navigateToChatStack } from './utils/navigationRef';
import SocketManager from './utils/socket';
import EventEmitter from './utils/eventEmitter';
import ConnectionAcceptedPopup from './components/ConnectionAcceptedPopup';
import { API_BASE_URL, CLERK_PUBLISHABLE_KEY } from './env';
import axios from 'axios';
import RNBootSplash from 'react-native-bootsplash';
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import * as SecureStore from 'expo-secure-store'
import CustomSplashScreen from './components/CustomSplashScreen';

const App = () => {
  const [appReady, setAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState(undefined);
  const [showSplash, setShowSplash] = useState(true);
  const initialNotificationHandled = useRef(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [preloadedData, setPreloadedData] = useState(null); // Cache preloaded data
  const [connectionAcceptedPopup, setConnectionAcceptedPopup] = useState({
    visible: false,
    data: null
  });
  const [incomingConnection, setIncomingConnection] = useState(null);

  // Test token cache functionality
  useEffect(() => {
    const testTokenCache = async () => {
      try {
        console.log('Testing Clerk token cache...');
        console.log('CLERK_PUBLISHABLE_KEY:', CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing');
        console.log('tokenCache available:', !!tokenCache);
      } catch (error) {
        console.error('Token cache test error:', error);
      }
    };
    
    testTokenCache();
  }, []);

  // Preload critical data during splash screen
  const preloadAppData = async (token) => {
    if (!token) return null;
    
    try {
      // Preload user profile, balance, and users list in parallel
      const [profileResponse, balanceResponse, usersResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        axios.get(`${API_BASE_URL}/transaction/balance/current`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => ({ data: { balance: 0 } })), // Fallback for balance
        fetch(`${API_BASE_URL}/admin/users/home`).then(res => res.json()).catch(() => ({ success: false, users: [] }))
      ]);

      const profile = profileResponse.data;
      const balance = balanceResponse.data.balance || 0;
      
      let users = [];
      if (usersResponse.success) {
        const usersWithPhotos = usersResponse.users.filter(user => {
          if (Array.isArray(user.profilePictures)) {
            return user.profilePictures.length > 0 && user.profilePictures[0];
          }
          return user.profilePictures && user.profilePictures.length > 0;
        });
        
        // Exclude current user
        users = usersWithPhotos.filter(u => 
          u._id !== profile._id && u.id !== profile._id
        );
      }

      return {
        profile,
        balance,
        users,
        allUsers: usersResponse.users || [], // Store all users for likes page
        token
      };
    } catch (error) {
      console.warn('Error preloading data:', error);
      return null;
    }
  };

  useEffect(() => {
    const prepare = async () => {
      try {
        console.log('Starting app preparation...');
        
        // Get token and determine initial route
        const token = await AsyncStorage.getItem('token');
        console.log('Token found:', !!token);
        
        let route = 'IntroSlides';
        if (token) {
          route = 'MainTabs';
          console.log('Preloading data for authenticated user...');
          // Preload data while splash screen is showing
          const data = await preloadAppData(token);
          setPreloadedData(data);
        }
        
        console.log('Setting initial route:', route);
        setInitialRoute(route);
        
        // Initialize notifications
        try {
          const permissionGranted = await requestNotificationPermission();
          if (!permissionGranted) {
            console.log('Notification permission not granted');
          }
          await notificationService.initializeNotifications();
        } catch (notificationError) {
          console.warn('Notification initialization failed:', notificationError);
        }
        
        console.log('Setting app ready to true');
        setAppReady(true);
        
        // Hide splash screen after a minimum delay for smooth transition
        setTimeout(() => {
          setShowSplash(false);
        }, 1000);
      } catch (e) {
        console.warn('Error during app preparation:', e);
        setInitialRoute('IntroSlides');
        setAppReady(true);
        
        // Hide splash screen even on error
        setTimeout(() => {
          setShowSplash(false);
        }, 1000);
      }
    };
    
    prepare();
  }, []);



  // Set navigation bar style for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#121212');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  // Handle notification responses
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      console.log('Notification received data:', data);
      if (!data) return;
      
      if (data.type === 'call_invite') {
        const channelId = data.channelId || data.channelName;
        const callerId = data.callerId || data.fromUserId;
        const callType = data.callType;
        const callerName = data.callerName;
        const callerAvatar = data.callerAvatar;
        
        console.log('[Notification] call_invite data:', data);
        if (callType && channelId && callerId && callerName) {
          navigateToTab('Chat');
          navigateToChatStack('IncomingCall', {
            callType,
            channelId,
            callerId,
            callerName,
            callerAvatar,
          });
        } else {
          console.warn('Missing call_invite params:', data);
        }
      } else if (data.type === 'chat_message' && data.chatId && data.senderId) {
        navigateToTab('Chat');
        navigateToChatStack('ChatInterface', {
          chatId: data.chatId,
          senderId: data.senderId,
        });
      } else if (data.type === 'connection_request') {
        navigateToTab('Likes');
        navigationRef.current?.navigate('Likes', { screen: 'ConnectionRequests' });
      } else {
        console.warn('Unknown or incomplete notification data:', data);
      }
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification response data:', data);
      if (!data) return;
      
      if (data.type === 'call_invite') {
        const channelId = data.channelId || data.channelName;
        const callerId = data.callerId || data.fromUserId;
        const callType = data.callType;
        const callerName = data.callerName;
        const callerAvatar = data.callerAvatar;
        
        console.log('[Notification] call_invite data:', data);
        if (callType && channelId && callerId && callerName) {
          navigateToTab('Chat');
          navigateToChatStack('IncomingCall', {
            callType,
            channelId,
            callerId,
            callerName,
            callerAvatar,
          });
        } else {
          console.warn('Missing call_invite params:', data);
        }
      } else if (data.type === 'chat_message' && data.chatId && data.senderId) {
        navigateToTab('Chat');
        navigateToChatStack('ChatInterface', {
          chatId: data.chatId,
          senderId: data.senderId,
        });
      } else if (data.type === 'connection_request') {
        navigateToTab('Likes');
        navigationRef.current?.navigate('Likes', { screen: 'ConnectionRequests' });
      } else {
        console.warn('Unknown or incomplete notification data:', data);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Handle notification taps when app is killed/backgrounded
  useEffect(() => {
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response && !initialNotificationHandled.current) {
        initialNotificationHandled.current = true;
        const data = response.notification.request.content.data;
        console.log('Initial notification data:', data);
        if (!data) return;
        
        if (data.type === 'call_invite') {
          if (data.callType && data.channelId && data.callerId && data.callerName) {
            navigateToTab('Chat');
            navigateToChatStack('IncomingCall', {
              callType: data.callType,
              channelId: data.channelId,
              callerId: data.callerId,
              callerName: data.callerName,
              callerAvatar: data.callerAvatar,
            });
          } else {
            console.warn('Missing call_invite params:', data);
          }
        } else if (data.type === 'chat_message' && data.chatId && data.senderId) {
          navigateToTab('Chat');
          navigateToChatStack('ChatInterface', {
            chatId: data.chatId,
            senderId: data.senderId,
          });
        } else if (data.type === 'connection_request') {
          navigateToTab('Likes');
          navigationRef.current?.navigate('Likes', { screen: 'ConnectionRequests' });
        } else {
          console.warn('Unknown or incomplete notification data:', data);
        }
      }
    };
    
    // Wait for navigation to be ready
    if (appReady && initialRoute) {
      setTimeout(checkInitialNotification, 500);
    }
  }, [appReady, initialRoute]);

  // Global socket setup for incoming call and connection acceptance
  useEffect(() => {
    let isMounted = true;
    
    const setupSocket = async () => {
      if (!appReady) return;
      
      try {
        console.log('🔍 [App.js] Setting up socket connection...');
        await SocketManager.connect();
        console.log('🔍 [App.js] Socket connection completed');
        
        const token = await AsyncStorage.getItem('token');
        console.log('🔍 [App.js] Token exists:', !!token);
        
        if (token) {
          const userId = await AsyncStorage.getItem('userId');
          console.log('🔍 [App.js] UserId:', userId);
          if (userId) {
            console.log('🔍 [App.js] Joining user room...');
            SocketManager.joinUserRoom(userId);
          }
        }
        
        SocketManager.onIncomingCall(async (data) => {
          console.log('🚨🚨🚨 INCOMING CALL RECEIVED IN APP.JS 🚨🚨🚨');
          console.log('🚨 CALL DATA:', JSON.stringify(data));
          
          if (!isMounted) return;
          
          // Get current user ID to filter calls
          const currentUserId = await AsyncStorage.getItem('userId');
          
          // Only process calls that are intended for the current user
          // The backend sends calls to user_${toUserId} room, so if we receive it,
          // it should be for us, but let's add extra validation
          console.log('📞 [App] Received incoming call event:', {
            fromUserId: data.fromUserId,
            currentUserId: currentUserId,
            callType: data.callType,
            channelName: data.channelName,
            callerName: data.callerName,
            fullData: data
          });
          
          // Additional validation: ensure this call is not from ourselves
          if (data.fromUserId === currentUserId) {
            console.log('📞 [App] ❌ IGNORING incoming call from self - this should not happen!');
            console.log('📞 [App] Caller ID matches current user ID:', currentUserId);
            return;
          }
          
          // Additional check: ensure we're not the caller
          if (data.callerName && data.callerName === 'Tamuno' && currentUserId === '689e379f7da4a3ade8671d71') {
            console.log('📞 [App] ❌ IGNORING call - we are the caller (Tamuno)');
            return;
          }
          
          console.log('📞 [App] ✅ Processing incoming call for current user');
          setIncomingCall(data);
          navigateToTab('Chat');
          navigateToChatStack('IncomingCall', {
            callerName: data.callerName || 'Unknown',
            callerAvatar: data.callerAvatar || null,
            callType: data.callType,
            channelName: data.channelName || data.channelId,
            channelId: data.channelName || data.channelId,
            callerId: data.fromUserId || data.callerId,
            agoraToken: data.agoraToken || null,
          }, true);
        });

        // Global connection acceptance listener
        console.log('🔍 [App.js] Setting up connection accepted listener...');
        SocketManager.onConnectionAccepted((data) => {
          console.log('🔍 [App.js] SocketManager.onConnectionAccepted received:', data);
          console.log('🔍 [App.js] isMounted:', isMounted);
          
          if (!isMounted) {
            console.log('🔍 [App.js] Component not mounted, ignoring connection_accepted event');
            return;
          }
          
          console.log('🔍 [App.js] Setting connectionAcceptedPopup to visible with data:', {
            accepterId: data.accepterId || data.targetUserId,
            targetUserId: data.targetUserId
          });
          
          // Show the popup globally
          setConnectionAcceptedPopup({
            visible: true,
            data: {
              accepterId: data.accepterId || data.targetUserId,
              targetUserId: data.targetUserId
            }
          });
          
          // Also emit to EventEmitter for other components that might be listening
          EventEmitter.emit('connection_accepted', data);
        });
        console.log('🔍 [App.js] Connection accepted listener setup completed');
      } catch (error) {
        console.warn('Socket setup error:', error);
      }
    };
    
    setupSocket();
    
    return () => { 
      isMounted = false; 
    };
  }, [appReady]);

  // Hide splash screen when app is ready AND auth context is initialized
  useEffect(() => {
    if (appReady) {
      if (Platform.OS === 'android' && NativeModules.SplashScreenModule) {
        NativeModules.SplashScreenModule.hideSplashAndLoadApp();
      }
    }
  }, [appReady]);

  // Listen for connection acceptance (must be before any conditional return to keep hook order stable)
  useEffect(() => {
    const handleConnectionAccepted = async (data) => {
      try {
        // Get token from AsyncStorage for authentication
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No token found for connection accepted handler');
          return;
        }

        // Remove 'Bearer ' prefix if present
        const authToken = token.startsWith('Bearer ') ? token.substring(7) : token;

        const response = await axios.get(`${API_BASE_URL}/auth/user/${data.accepterId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        setIncomingConnection({
          user: response.data,
          targetUserId: data.targetUserId,
          accepterId: data.accepterId
        });
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    EventEmitter.on('connection_accepted', handleConnectionAccepted);

    return () => {
      EventEmitter.off('connection_accepted', handleConnectionAccepted);
    };
  }, []);

  // Show custom splash screen while app is preparing or during minimum display time
  if (showSplash || !appReady || !initialRoute) {
    return <CustomSplashScreen />;
  }

  const handleCloseConnectionPopup = () => {
    setConnectionAcceptedPopup({
      visible: false,
      data: null
    });
  };

  

  const handleAcceptChat = () => {
    if (incomingConnection) {
      navigationRef.current?.navigate('AcceptedConnection', {
        targetUserId: incomingConnection.targetUserId,
        acceptedBy: incomingConnection.accepterId
      });
      setIncomingConnection(null);
    }
  };

  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY} 
      tokenCache={tokenCache}
      appearance={{
        variables: {
          colorPrimary: '#EC066A',
        },
      }}
      // Add OAuth configuration to ensure proper scopes
      oauthOptions={{
        google: {
          scopes: ['email', 'profile', 'openid'], // Ensure these scopes are requested
        },
        facebook: {
          scopes: ['email', 'public_profile'],
        }
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider style={{ backgroundColor: '#121212' }}>
          <AuthProvider preloadedData={preloadedData}>
            <NavigationContainer 
              ref={navigationRef}
              onReady={() => {
                // Set global navigationRef for use in AuthContext
                global.navigationRef = navigationRef;
              }}
            >
              <AppStack initialRouteName={initialRoute} />
            </NavigationContainer>
            
            {/* Global Connection Accepted Popup */}
            <ConnectionAcceptedPopup
              visible={connectionAcceptedPopup.visible}
              onClose={handleCloseConnectionPopup}
              connectionData={connectionAcceptedPopup.data}
            />
            
            <StatusBar style="light" backgroundColor="#121212" /> 
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
};

export default App;