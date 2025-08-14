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
import { Platform, Dimensions, View, TouchableOpacity, Alert } from 'react-native';
import { navigationRef, navigateToTab, navigateToChatStack } from './utils/navigationRef';
import SocketManager from './utils/socket';
import EventEmitter from './utils/eventEmitter';
import ConnectionAcceptedPopup from './components/ConnectionAcceptedPopup';
import MatchFoundPopup from './components/MatchFoundPopup';
import { CLERK_PUBLISHABLE_KEY, API_BASE_URL } from './env';
import CustomSplashScreen from './components/CustomSplashScreen';
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import * as SecureStore from 'expo-secure-store'
import axios from 'axios';
import * as Linking from 'expo-linking';

// Enhanced OAuth callback handling function
const handleOAuthCallback = async (url) => {
  if (url && (url.includes('oauth-callback') || url.includes('sso-callback'))) {
    try {
      console.log('[App] Handling OAuth callback:', url);
      
      // Parse Clerk's SSO callback format
      const createdSessionIdMatch = url.match(/[?&]created_session_id=([^&]+)/);
      const rotatingTokenNonceMatch = url.match(/[?&]rotating_token_nonce=([^&]+)/);
      const codeMatch = url.match(/[?&]code=([^&]+)/);
      const stateMatch = url.match(/[?&]state=([^&]+)/);
      const errorMatch = url.match(/[?&]error=([^&]+)/);
      
      if (errorMatch) {
        console.log('[App] OAuth error detected:', errorMatch[1]);
        Alert.alert('Authentication Error', 'OAuth authentication failed. Please try again.');
        return;
      }
      
      // Handle Clerk's SSO callback format
      if (createdSessionIdMatch) {
        console.log('[App] Clerk session created, session ID:', createdSessionIdMatch[1]);
        
        // Wait for Clerk to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('[App] OAuth callback processing complete');
      } else if (codeMatch) {
        console.log('[App] OAuth code received, processing...');
        
        // Improved callback processing with timeout
        const processingTimeout = setTimeout(() => {
          console.log('[App] OAuth callback processing timeout');
        }, 10000);
        
        // Wait for Clerk to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        clearTimeout(processingTimeout);
        console.log('[App] OAuth callback processing complete');
      } else {
        console.log('[App] No recognizable OAuth parameters found in callback URL');
      }
    } catch (error) {
      console.error('[App] Error processing OAuth callback:', error);
    }
  }
};

// Fallback EventEmitter if import fails
const createFallbackEventEmitter = () => {
  const events = {};
  return {
    on: (event, callback) => {
      if (!events[event]) {
        events[event] = [];
      }
      events[event].push(callback);
    },
    off: (event, callback) => {
      if (!events[event]) return;
      events[event] = events[event].filter(cb => cb !== callback);
    },
    emit: (event, data) => {
      if (!events[event]) return;
      events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Event callback error
        }
      });
    }
  };
};

// Create a self-contained EventEmitter for testing
const createSelfContainedEventEmitter = () => {
  const events = {};
  return {
    on: (event, callback) => {
      if (!events[event]) {
        events[event] = [];
      }
      events[event].push(callback);
    },
    off: (event, callback) => {
      if (!events[event]) return;
      events[event] = events[event].filter(cb => cb !== callback);
    },
    emit: (event, data) => {
      if (!events[event]) return;
      events[event].forEach((callback, index) => {
        try {
          callback(data);
        } catch (error) {
          // Event callback error in listener
        }
      });
    }
  };
};

// Use the same EventEmitter that AuthContext uses
const AppEventEmitter = EventEmitter;

const App = () => {
  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      // Prevent the default browser behavior - only for web
      if (Platform.OS === 'web' && event.preventDefault) {
        event.preventDefault();
      }
    };

    const handleError = (event) => {
      // Global error handler
    };

    // Add global error handlers - only for web platform
    if (Platform.OS === 'web') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', handleError);
    }

    // Enhanced deep link listener setup
    const handleDeepLink = async (url) => {
      if (url) {
        const urlString = typeof url === 'string' ? url : url.url;
        if (urlString) {
          console.log('[App] Deep link received:', urlString);
          
          // Handle both custom scheme and HTTPS redirects
          if (urlString.includes('oauth-callback') || urlString.includes('sso-callback')) {
            await handleOAuthCallback(urlString);
          }
        }
      }
    };

    // Set up multiple listeners for better compatibility
    const listeners = [];
    
    // Primary listener
    try {
      const subscription = Linking.addEventListener('url', handleDeepLink);
      listeners.push(subscription);
      console.log('[App] Primary deep link listener established');
    } catch (error) {
      console.error('[App] Error setting up primary deep link listener:', error);
    }
    
    // Backup listener for older React Native versions
    try {
      const backupListener = (event) => {
        handleDeepLink(event?.url || event);
      };
      
      // Add event listener directly if addEventListener is not available
      if (Linking.addListener) {
        const backupSubscription = Linking.addListener('url', backupListener);
        listeners.push({ remove: () => backupSubscription?.remove() });
      }
    } catch (error) {
      console.warn('[App] Backup deep link listener not available:', error);
    }

    // Enhanced initial URL check with multiple attempts
    const checkInitialURL = async () => {
      const maxAttempts = 3;
      let attempt = 0;
      
      while (attempt < maxAttempts) {
        try {
          const url = await Linking.getInitialURL();
          if (url) {
            console.log(`[App] Initial URL found on attempt ${attempt + 1}:`, url);
            await handleDeepLink(url);
            break;
          }
        } catch (error) {
          console.error(`[App] Error getting initial URL on attempt ${attempt + 1}:`, error);
        }
        
        attempt++;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    };
    
    checkInitialURL();

    // Cleanup
    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleError);
      }
      listeners.forEach(listener => {
        try {
          listener?.remove();
        } catch (error) {
          console.warn('[App] Error removing deep link listener:', error);
        }
      });
    };
  }, []);

  const [appReady, setAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState(undefined);
  const [apiConnected, setApiConnected] = useState(false);
  const initialNotificationHandled = useRef(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [preloadedData, setPreloadedData] = useState(null); // Cache preloaded data
  const [connectionAcceptedPopup, setConnectionAcceptedPopup] = useState({
    visible: false,
    data: null
  });
  const [matchFoundPopup, setMatchFoundPopup] = useState({
    visible: false,
    data: null
  });

  // Debug logging for popup state changes - only log meaningful changes
  useEffect(() => {
    if (connectionAcceptedPopup.visible || connectionAcceptedPopup.data) {
      // Popup state changed
    }
  }, [connectionAcceptedPopup]);

  useEffect(() => {
    if (matchFoundPopup.visible || matchFoundPopup.data) {
      // Match popup state changed
    }
  }, [matchFoundPopup]);

  // Define all functions at the top level, after hooks
  const preloadAppData = async (token) => {
    if (!token) {
      return null;
    }
    
    try {
      // Preload user profile, balance, and users list in parallel with better error handling
      const [profileResponse, balanceResponse, usersResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }).catch(error => {
          throw error; // Profile is essential, so throw if it fails
        }),
        axios.get(`${API_BASE_URL}/transaction/balance/current`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }).catch(error => {
          return { data: { balance: 0 } }; // Fallback for balance
        }),
        fetch(`${API_BASE_URL}/admin/users/home`)
          .then(res => res.json())
          .catch(error => {
            return { success: false, users: [] }; // Fallback for users
          })
      ]);

      const profile = profileResponse.data;
      const balance = balanceResponse.data.balance || 0;
      
      // Validate that we have essential data
      if (!profile || !profile._id) {
        console.error('Invalid profile data received:', profile);
        return null;
      }
      
      let users = [];
      if (usersResponse.success && usersResponse.users) {
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

      setApiConnected(true); // Mark API as connected
      return {
        profile,
        balance,
        users,
        allUsers: usersResponse.users || [], // Store all users for likes page
        token
      };
    } catch (error) {
      console.error('Error preloading app data:', error);
      // Even on error, mark API as connected to prevent splash from staying forever
      setApiConnected(true);
      // Return null to allow app to continue without preloaded data
      return null;
    }
  };

  const handleCloseConnectionPopup = () => {
    setConnectionAcceptedPopup({ visible: false, data: null });
  };

  const handleCloseMatchPopup = () => {
    setMatchFoundPopup({ visible: false, data: null });
  };

  // Navigation callbacks for MatchFoundPopup
  const handleNavigateToConnectionSent = (targetUserId) => {
    try {
      if (navigationRef.current) {
        navigationRef.current.navigate('ConnectionSent', { targetUserId });
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleNavigateToPremium = () => {
    try {
      if (navigationRef.current) {
        navigationRef.current.navigate('Premium', { screen: 'PayForConnection' });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      if (navigationRef.current) {
        navigationRef.current.navigate('Premium');
      }
    }
  };

  // Test token cache functionality
  useEffect(() => {
    const testTokenCache = async () => {
      try {
        // Token cache test completed
      } catch (error) {
        // Token cache test error
      }
    };
    
    testTokenCache();
  }, []);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Get token and determine initial route
        const token = await AsyncStorage.getItem('token');
        
        let route = 'IntroSlides';
        if (token) {
          route = 'MainTabs';
          // Preload data while splash screen is showing
          const data = await preloadAppData(token);
          setPreloadedData(data);
        }
        
        setInitialRoute(route);
        
        // Initialize notifications
        try {
          const permissionGranted = await requestNotificationPermission();
          if (!permissionGranted) {
            // Notification permission not granted
          }
          await notificationService.initializeNotifications();
        } catch (notificationError) {
          // Notification initialization failed
        }
        
        setAppReady(true);
      } catch (e) {
        // Error during app preparation
        setInitialRoute('IntroSlides');
        setAppReady(true);
      }
    };
    
    // Handle any unhandled promise rejections in prepare
    prepare().catch(error => {
      // Set fallback values on error
      setInitialRoute('IntroSlides');
      setAppReady(true);
    });
  }, []);



  // Set navigation bar style for Android
  useEffect(() => {
    if (Platform.OS === 'android' && NavigationBar) {
      const setNavigationBarStyle = async () => {
        try {
          // Check if the functions are available before calling them
          if (typeof NavigationBar.setBackgroundColorAsync === 'function') {
            await NavigationBar.setBackgroundColorAsync('#121212');
          }
          if (typeof NavigationBar.setButtonStyleAsync === 'function') {
            await NavigationBar.setButtonStyleAsync('light');
          }
        } catch (error) {
          // NavigationBar styling failed (this is normal on some devices)
          // Don't show error to user as this is just cosmetic
        }
      };
      
      setNavigationBarStyle();
    }
  }, []);

  // Handle notification responses
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (!data) return;
      
      if (data.type === 'call_invite') {
        const channelId = data.channelId || data.channelName;
        const callerId = data.callerId || data.fromUserId;
        const callType = data.callType;
        const callerName = data.callerName;
        const callerAvatar = data.callerAvatar;
        const chatId = data.chatId;
        
        if (callType && channelId && callerId && callerName) {
          navigateToTab('Chat');
          navigateToChatStack('IncomingCall', {
            callType,
            channelName: channelId, // Fixed: use channelName instead of channelId
            callerId,
            callerName,
            callerAvatar,
            chatId,
          });
        } else {
          // Missing call_invite params
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
        // Unknown or incomplete notification data
      }
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (!data) return;
      
      if (data.type === 'call_invite') {
        const channelName = data.channelId || data.channelName;
        const callerId = data.callerId || data.fromUserId;
        const callType = data.callType;
        const callerName = data.callerName;
        const callerAvatar = data.callerAvatar;
        const chatId = data.chatId;
        
        if (callType && channelName && callerId && callerName) {
          navigateToTab('Chat');
          navigateToChatStack('IncomingCall', {
            callType,
            channelName: channelName,
            callerId,
            callerId,
            callerName,
            callerAvatar,
            chatId,
            agoraToken: data.agoraToken, // Include agoraToken if available
          });
        } else {
          // Missing call_invite params
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
        // Unknown or incomplete notification data
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
        if (!data) return;
        
        if (data.type === 'call_invite') {
          const channelName = data.channelId || data.channelName;
          if (data.callType && channelName && data.callerId && data.callerName) {
            navigateToTab('Chat');
            navigateToChatStack('IncomingCall', {
              callType: data.callType,
              channelName: channelName,
              callerId: data.callerId,
              callerName: data.callerName,
              callerAvatar: data.callerAvatar,
              chatId: data.chatId,
              agoraToken: data.agoraToken, // Include agoraToken if available
            });
          } else {
            // Missing call_invite params
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
          // Unknown or incomplete notification data
        }
      }
    };
    
    // Wait for navigation to be ready and app to be fully initialized
    if (appReady && initialRoute) {
      setTimeout(checkInitialNotification, 1000); // Increased delay to ensure full initialization
    }
  }, [appReady, initialRoute]);

  // Global socket setup for incoming call and connection acceptance
  useEffect(() => {
    let isMounted = true;
    
    const setupSocket = async () => {
      if (!appReady) return;
      
      try {
        console.log('[App.js] Setting up socket connection...');
        await SocketManager.connect();
        const token = await AsyncStorage.getItem('token');
        console.log('[App.js] Token retrieved:', token ? 'Yes' : 'No');
        
        if (token) {
          const userId = await AsyncStorage.getItem('userId');
          console.log('[App.js] UserId retrieved:', userId);
          if (userId) {
            console.log('[App.js] Joining user room:', userId);
            SocketManager.joinUserRoom(userId);
          } else {
            console.log('[App.js] No userId found, cannot join user room');
          }
        } else {
          console.log('[App.js] No token found, cannot setup socket');
        }
        
        // Incoming call listener - similar to how we'll handle connection accepted
        SocketManager.onIncomingCall((data) => {
          if (!isMounted) return;
          
          setIncomingCall(data);
          navigateToTab('Chat');
          navigateToChatStack('IncomingCall', {
            callerName: data.callerName || 'Unknown',
            callerAvatar: data.callerAvatar || null,
            callType: data.callType,
            channelName: data.channelName || data.channelId,
            callerId: data.fromUserId || data.callerId,
            agoraToken: data.agoraToken || null,
            chatId: data.chatId,
          }, true);
        });

        // Global connection acceptance listener - similar to incoming calls
        SocketManager.onConnectionAccepted(async (data) => {
          if (!isMounted) return;
          
          // Get current user ID to determine if they should see the popup
          let currentUserId = await AsyncStorage.getItem('userId');
          
          // Show popup for the requester (the one who sent the request)
          if (data.type === 'connection_accepted' && data.targetUserId === currentUserId) {
            // This user is the requester - show the popup
            
            setConnectionAcceptedPopup({
              visible: true,
              data: {
                accepterId: data.accepterId,
                targetUserId: data.targetUserId,
                type: data.type
              }
            });
            
          } else if (data.type === 'connection_established' && data.requesterId === currentUserId) {
            // This user is the accepter - don't show popup, just log
          }
        });
        
        // Listen for connection_established events separately
        SocketManager.socket?.on('connection_established', async (data) => {
          if (!isMounted) return;
          
          // Get current user ID
          let currentUserId = await AsyncStorage.getItem('userId');
          
          // Apply the same fallback logic
          if (!currentUserId) {
            try {
              const userData = await AsyncStorage.getItem('userData');
              if (userData) {
                const parsed = JSON.parse(userData);
                if (parsed._id) {
                  currentUserId = parsed._id;
                }
              }
            } catch (error) {
              // Could not get userId from userData
            }
          }
          
          // For connection_established, the current user is the accepter
          if (data.requesterId && data.requesterId === currentUserId) {
            // Current user is accepter
          }
        });
        
        // Also listen directly to socket for connection_accepted events
        SocketManager.socket?.on('connection_accepted', async (data) => {
          if (!isMounted) return;
          
          // Get current user ID to determine if they should see the popup
          let currentUserId = await AsyncStorage.getItem('userId');
          
          // Show popup for the requester (the one who sent the request)
          if (data.type === 'connection_accepted' && data.targetUserId === currentUserId) {
            // This user is the requester - show the popup
            
            setConnectionAcceptedPopup({
              visible: true,
              data: {
                accepterId: data.accepterId,
                targetUserId: data.targetUserId,
                type: data.type
              }
            });
            
          } else if (data.type === 'connection_established' && data.requesterId === currentUserId) {
            // This user is the accepter - don't show popup, just log
          }
        });

        // Listen for match events
        console.log('[App.js] Setting up match_found listener...');
        if (SocketManager.socket) {
          console.log('[App.js] Socket is available, setting up match_found listener');
          
          // Remove any existing listeners first to prevent duplicates
          SocketManager.socket.off('match_found');
          
          SocketManager.socket.on('match_found', async (data) => {
            console.log('[App.js] 🎉 MATCH_FOUND event received:', data);
            if (!isMounted) {
              console.log('[App.js] Component not mounted, ignoring match event');
              return;
            }
            
            // Get current user ID
            let currentUserId = await AsyncStorage.getItem('userId');
            console.log('[App.js] Current user ID from AsyncStorage:', currentUserId);
            
            // Apply fallback logic for userId
            if (!currentUserId) {
              try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                  const parsed = JSON.parse(userData);
                  if (parsed._id) {
                    currentUserId = parsed._id;
                    console.log('[App.js] Got userId from userData fallback:', currentUserId);
                  }
                }
              } catch (error) {
                console.error('[App.js] Error parsing userData:', error);
              }
            }
            
            // Also try to get userId from the current user context if available
            if (!currentUserId && preloadedData?.profile?._id) {
              currentUserId = preloadedData.profile._id;
              console.log('[App.js] Got userId from preloadedData:', currentUserId);
            }
            
            console.log('[App.js] Final currentUserId:', currentUserId);
            console.log('[App.js] Match data user1Id:', data.user1Id);
            console.log('[App.js] Match data user2Id:', data.user2Id);
            console.log('[App.js] Current user ID type:', typeof currentUserId);
            console.log('[App.js] User1 ID type:', typeof data.user1Id);
            console.log('[App.js] User2 ID type:', typeof data.user2Id);
            
            // Convert all IDs to strings for proper comparison
            const currentUserIdStr = String(currentUserId);
            const user1IdStr = String(data.user1Id);
            const user2IdStr = String(data.user2Id);
            
            console.log('[App.js] String comparison - Current:', currentUserIdStr);
            console.log('[App.js] String comparison - User1:', user1IdStr);
            console.log('[App.js] String comparison - User2:', user2IdStr);
            
            // Show match popup for both users involved in the match
            if ((user1IdStr === currentUserIdStr) || (user2IdStr === currentUserIdStr)) {
              console.log('[App.js] 🎉 User is part of the match! Showing popup...');
              // Determine which user is the "other" user
              const matchedUserId = user1IdStr === currentUserIdStr ? user2IdStr : user1IdStr;
              
              console.log('[App.js] Setting match popup visible with matchedUserId:', matchedUserId);
              setMatchFoundPopup({
                visible: true,
                data: {
                  matchedUserId: matchedUserId,
                  type: 'match_found'
                }
              });
              
              // Log successful match popup display
              console.log('[App.js] ✅ Match popup successfully displayed for user:', currentUserIdStr);
              
            } else {
              console.log('[App.js] User is NOT part of this match. Current user:', currentUserIdStr);
              console.log('[App.js] Available user IDs in match:', user1IdStr, user2IdStr);
            }
          });
          
          // Add error handling for socket events
          SocketManager.socket.on('error', (error) => {
            console.error('[App.js] Socket error in match_found listener:', error);
          });
          
          console.log('[App.js] ✅ match_found listener successfully set up');
        } else {
          console.log('[App.js] Socket not available, cannot set up match_found listener');
        }
      } catch (error) {
        // Socket setup error
        console.error('[App.js] Socket setup error:', error);
      }
    };
    
    // Handle any unhandled promise rejections in setupSocket
    setupSocket().catch(error => {
      // Don't crash the app, just log the error
    });

    // Set up periodic room verification for multiple devices
    const roomVerificationInterval = setInterval(() => {
      if (isMounted && SocketManager.isConnected && SocketManager.userId) {
        console.log('[App.js] 🔄 Periodic room verification check');
        SocketManager.forceRejoinUserRoom();
      }
    }, 30000); // Check every 30 seconds

    return () => { 
      isMounted = false; 
      clearInterval(roomVerificationInterval);
    };
  }, [appReady]);

  // Custom splash screen state management
  const [showSplash, setShowSplash] = useState(true);
  
  // Hide custom splash screen when app is ready, route is set, AND API is connected
  useEffect(() => {
    if (appReady && initialRoute) {
      if (initialRoute === 'IntroSlides') {
        // For IntroSlides, hide immediately
        setTimeout(() => {
          setShowSplash(false);
        }, 1000);
      } else if (apiConnected && preloadedData) {
        // For MainTabs, wait for API connection AND preloaded data
        setTimeout(() => {
          setShowSplash(false);
        }, 2000); // Increased delay to ensure data is fully loaded and screens are ready
      } else {
        // Waiting for API connection and preloaded data before hiding splash screen
        
        // Set a safety timeout to prevent splash from staying forever
        setTimeout(() => {
          setApiConnected(true); // Force API connected state
          setShowSplash(false);
        }, 15000); // 15 second safety timeout
      }
    }
  }, [appReady, initialRoute, apiConnected, preloadedData]);



  useEffect(() => {
    // Listen for connection acceptance via EventEmitter (alternative path)
    const handleConnectionAccepted = async (data) => {
      // Get current user ID to determine if they should see the popup
      let currentUserId = await AsyncStorage.getItem('userId');
      
      // Show popup for the requester (the one who sent the request)
      if (data.type === 'connection_accepted' && data.targetUserId === currentUserId) {
        // This user is the requester - show the popup
        
        // Show the popup immediately when we receive the event
        setConnectionAcceptedPopup({
          visible: true,
          data: {
            accepterId: data.accepterId,
            targetUserId: data.targetUserId,
            type: data.type
          }
        });
        
      } else if (data.type === 'connection_established' && data.requesterId === currentUserId) {
        // This user is the accepter - don't show popup, just log
      }
    };

    // Use the correct EventEmitter methods with error handling
    try {
      if (AppEventEmitter && typeof AppEventEmitter.on === 'function') {
        AppEventEmitter.on('connection_accepted', handleConnectionAccepted);
      } else {
        // EventEmitter not available or invalid
      }
    } catch (error) {
      // Error setting up EventEmitter listener
    }

    return () => {
      try {
        if (AppEventEmitter && typeof AppEventEmitter.off === 'function') {
          AppEventEmitter.off('connection_accepted', handleConnectionAccepted);
        }
      } catch (error) {
        // Error removing EventEmitter listener
      }
    };
  }, []);

  // Show custom splash screen while app is preparing
  // Always show splash first to eliminate white flash
  if (!appReady || !initialRoute || showSplash) {
    return <CustomSplashScreen />;
  }

  // Debug: Log match popup state (only when it changes)
  // console.log('[App.js] Match popup state:', matchFoundPopup);



  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY} 
      tokenCache={tokenCache}
      appearance={{
        variables: {
          colorPrimary: '#EC066A',
        },
      }}
      // Simplified OAuth configuration for WebView-based approach
      oauthOptions={{
        google: {
          scopes: ['email', 'profile', 'openid'],
          fallbackRedirectUrl: 'qiimeet://oauth-callback',
        },
        facebook: {
          scopes: ['email', 'public_profile'],
          fallbackRedirectUrl: 'qiimeet://oauth-callback',
        }
      }}
      fallbackRedirectUrl="qiimeet://oauth-callback"
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
            
            {/* Global Match Found Popup */}
            <MatchFoundPopup
              visible={matchFoundPopup.visible}
              onClose={handleCloseMatchPopup}
              matchData={matchFoundPopup.data}
              onNavigateToConnectionSent={handleNavigateToConnectionSent}
              onNavigateToPremium={handleNavigateToPremium}
            />
            
            <StatusBar style="light" backgroundColor="#121212" />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
};

export default App;