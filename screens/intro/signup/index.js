import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Alert, ActivityIndicator, Modal,
} from 'react-native';
import OAuthErrorModal from './OAuthErrorModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../constants/Colors';
import CustomButton from '../../../constants/button';
import { FONTS } from '../../../constants/font';
import { TEXT_STYLES } from '../../../constants/text';
import { usePhoneNumber, formatPhoneNumber } from './Phone';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useSSO, useAuth, useUser } from '@clerk/clerk-expo'; // Updated Clerk imports
import { API_BASE_URL, CLERK_PUBLISHABLE_KEY } from '../../../env';
import { useAuth as useAuthContext } from '../../../components/AuthContext';
import { WebView } from 'react-native-webview';
const { width, height } = Dimensions.get('window');
const googleIcon = require('../../../assets/google.png');
const fbIcon = require('../../../assets/fb.png');
const appleIcon = require('../../../assets/apple.png');

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: clorses browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

const PhoneNumberScreen = ({ navigation }) => {
  useWarmUpBrowser();
  
  // Enhanced handleExistingUserSignIn function
  const handleExistingUserSignIn = async (clerkUser, provider, clerkId) => {
    try {
      if (!clerkId) {
        console.log('[Signup] No Clerk ID available for existing user sign in');
        return false;
      }

      console.log('[Signup] Attempting backend social login with Clerk ID:', clerkId);

      const signInResponse = await fetch(`${API_BASE_URL}/auth/social-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: clerkId,
          provider: provider,
          email: clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress || undefined,
        }),
      });

      console.log('[Signup] Social login response status:', signInResponse.status);

      if (signInResponse.ok) {
        const signInResult = await signInResponse.json();
        console.log('[Signup] Social login response data:', signInResult);
        
        if (signInResult.token) {
          // Store credentials
          await AsyncStorage.multiSet([
            ['token', signInResult.token],
            ['userId', signInResult.user?._id || signInResult.userId || clerkId]
          ]);

          console.log('[Signup] Credentials stored, attempting login with auth context...');

          // Login using auth context
          const loginSuccess = await login(signInResult.token, signInResult.user);
          if (loginSuccess) {
            console.log('[Signup] Existing user login successful, navigating to MainTabs...');
            
            // Mark navigating first so loader persists through transition
            setIsNavigating(true);
            // Clear all loading states (loader remains due to isNavigating)
            setIsSocialLoginInProgress(false);
            setIsOAuthInProgress(false);
            setIsAutoLoginInProgress(false);
            
            // Navigate to MainTabs
            navigation.navigate('MainTabs');
            return true;
          } else {
            console.error('[Signup] Login with auth context failed');
            // Even if login fails, we have valid credentials, try to navigate anyway
            setIsNavigating(true);
            navigation.navigate('MainTabs');
            return true;
          }
        } else {
          console.error('[Signup] No token in social login response');
          return false;
        }
      } else if (signInResponse.status === 404) {
        // User doesn't exist in backend, this is expected for new users
        console.log('[Signup] User not found in backend (expected for new users)');
        return false;
      } else {
        // Handle other error statuses
        const errorText = await signInResponse.text();
        console.error('[Signup] Social login failed with status:', signInResponse.status, 'Error:', errorText);
        return false;
      }

      return false;
    } catch (error) {
      console.error('[Signup] Error in handleExistingUserSignIn:', error);
      // If checking existing user fails, return false to proceed with normal flow
      return false;
    }
  };

  // Use Clerk's hooks for auth state and user
  const { isSignedIn, isLoaded, signOut, userId: authUserId } = useAuth();
  const { user: clerkUser } = useUser();
  
  // Use AuthContext for login functionality
  const { login } = useAuthContext();
  
  // Use the SSO hook for OAuth providers
  const { startSSOFlow } = useSSO();
  
  // Add listener for OAuth callbacks
  React.useEffect(() => {
    const handleUrl = (url) => {
      // Handle both string URLs and event objects
      const urlString = typeof url === 'string' ? url : url.url;
      if (urlString && (urlString.includes('oauth-callback') || urlString.includes('sso-callback'))) {
        console.log('[Signup] OAuth callback received via deep link:', urlString);
        // Handle OAuth callback that might come from App.js deep link handler
        handleExternalOAuthCallback(urlString);
      }
    };
    
    // Listen for incoming URLs
    const subscription = Linking.addEventListener('url', handleUrl);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // Monitor auth state changes and auto-navigate when user is signed in
  React.useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk to load
    
    // Only trigger auto-navigation when user becomes signed in and we're not in progress
    if (isSignedIn && clerkUser && !isSocialLoginInProgress && !isOAuthInProgress && !isAutoLoginInProgress) {
      console.log('[Signup] Auth state changed - user signed in, attempting auto-navigation...');
      
      const timer = setTimeout(async () => {
        try {
          // Check if we already have local credentials first
          const [token, userId] = await AsyncStorage.multiGet(['token', 'userId']).then((pairs) => pairs.map(([, v]) => v));
          
          if (token && userId) {
            console.log('[Signup] Found existing credentials, navigating to MainTabs');
            setIsNavigating(true);
            navigation.navigate('MainTabs');
            return;
          }
          
          // Otherwise attempt auto-login
          const success = await attemptAutoLogin('google');
          if (success) {
            console.log('[Signup] Auto-navigation successful');
          } else {
            console.log('[Signup] Auto-navigation failed');
            // Don't sign out here, let user try again
          }
        } catch (error) {
          console.warn('[Signup] Error during auto-navigation:', error);
        }
      }, 1000); // Reduced delay for faster response
      
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, clerkUser, isSocialLoginInProgress, isOAuthInProgress, isAutoLoginInProgress, isLoaded]);

  // Cleanup OAuth state when component unmounts
  React.useEffect(() => {
    return () => {
      cleanupOAuthState();
    };
  }, []);

  // Add a cleanup mechanism to reset states when component unmounts
  React.useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      setIsSocialLoginInProgress(false);
      setIsOAuthInProgress(false);
      setIsAutoLoginInProgress(false);
      setIsCheckingCredentials(false);
    };
  }, []);

  // Enhanced monitoring for auth state changes with immediate action
  React.useEffect(() => {
    const checkAuthAndNavigate = async () => {
      // Only proceed if Clerk is loaded and user is signed in
      if (!isLoaded || !isSignedIn || !clerkUser) return;
      
      // Skip if any operation is in progress
      if (isSocialLoginInProgress || isOAuthInProgress || isAutoLoginInProgress || isCheckingCredentials) return;
      
      console.log('[Signup] Auth state monitoring - user is signed in, checking navigation...');
      
      try {
        // Quick check for existing credentials
        const [token, userId] = await AsyncStorage.multiGet(['token', 'userId']).then((pairs) => pairs.map(([, v]) => v));
        
        if (token && userId) {
          console.log('[Signup] Found credentials, navigating immediately');
          setIsNavigating(true);
          navigation.navigate('MainTabs');
          return;
        }
        
        // Try to get existing user
        const clerkId = clerkUser?.id;
        if (clerkId) {
          console.log('[Signup] Attempting quick existing user check...');
          const success = await handleExistingUserSignIn(clerkUser, 'google', clerkId);
          if (success) {
            console.log('[Signup] Quick existing user check successful');
            return;
          }
          
          // If handleExistingUserSignIn failed, check if credentials were stored anyway
          const [retryToken, retryUserId] = await AsyncStorage.multiGet(['token', 'userId']).then((pairs) => pairs.map(([, v]) => v));
          if (retryToken && retryUserId) {
            console.log('[Signup] Found credentials after failed sign in check, navigating to MainTabs');
            setIsNavigating(true);
            navigation.navigate('MainTabs');
            return;
          }
        }
        
        console.log('[Signup] No existing user found, user may need to complete setup');
        
      } catch (error) {
        console.warn('[Signup] Error in auth monitoring:', error);
        
        // Even on error, check if we have credentials
        try {
          const [errorToken, errorUserId] = await AsyncStorage.multiGet(['token', 'userId']).then((pairs) => pairs.map(([, v]) => v));
          if (errorToken && errorUserId) {
            console.log('[Signup] Found credentials despite error, navigating to MainTabs');
            setIsNavigating(true);
            navigation.navigate('MainTabs');
            return;
          }
        } catch (storageError) {
          console.warn('[Signup] Error checking storage after auth monitoring error:', storageError);
        }
      }
    };
    
    // Run immediately and set up a timer for delayed check
    checkAuthAndNavigate();
    
    const timer = setTimeout(checkAuthAndNavigate, 1500);
    
    return () => clearTimeout(timer);
  }, [isSignedIn, clerkUser, isLoaded]);

  // Additional monitoring for OAuth completion when Clerk state hasn't updated yet
  React.useEffect(() => {
    let hasNavigated = false; // Prevent multiple navigations
    
    const checkOAuthCompletion = async () => {
      // Only check if we're not in progress and Clerk is loaded
      if (isSocialLoginInProgress || isOAuthInProgress || isAutoLoginInProgress || isCheckingCredentials || !isLoaded || hasNavigated) return;
      
      // Check if we have credentials that might have been created by OAuth
      const [token, userId, isNewSignup] = await AsyncStorage.multiGet(['token', 'userId', 'isNewSignup']).then((pairs) => pairs.map(([, v]) => v));
      
      if (token && userId && !isSignedIn) {
        console.log('[Signup] OAuth completion detected - credentials exist but Clerk not signed in yet');
        
        // Check if this is a new signup to determine navigation destination
        if (isNewSignup === 'true') {
          console.log('[Signup] New signup detected, navigating to Welcome screen');
          hasNavigated = true; // Prevent further checks
          // Clear the signup flag
          await AsyncStorage.removeItem('isNewSignup');
          setIsNavigating(true);
          // Add a small delay to ensure navigation context is ready
          setTimeout(() => {
            navigation.navigate('Onboarding', { screen: 'Welcome' });
          }, 200);
        } else {
          console.log('[Signup] Existing user, navigating to MainTabs');
          hasNavigated = true; // Prevent further checks
          setIsNavigating(true);
          // Add a small delay to ensure navigation context is ready
          setTimeout(() => {
            navigation.navigate('MainTabs');
          }, 200);
        }
        return;
      }
    };
    
    // Check periodically for OAuth completion
    const interval = setInterval(checkOAuthCompletion, 1000);
    
    return () => clearInterval(interval);
  }, [isSignedIn, isLoaded, isSocialLoginInProgress, isOAuthInProgress, isAutoLoginInProgress, isCheckingCredentials]);

  // Aggressive cleanup function for persistent authentication issues
  const performAggressiveCleanup = async () => {
    try {
      console.log('[Signup] Performing aggressive cleanup...');
      
      // Clear all AsyncStorage data
      await AsyncStorage.clear();
      console.log('[Signup] Cleared all AsyncStorage data');
      
      // Force sign out from Clerk multiple times if needed
      if (isSignedIn && signOut) {
        for (let i = 0; i < 3; i++) {
          try {
            await signOut();
            console.log(`[Signup] Sign out attempt ${i + 1} completed`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.warn(`[Signup] Sign out attempt ${i + 1} failed:`, error);
          }
        }
      }
      
      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('[Signup] Aggressive cleanup completed');
      
      // Show success message
      Alert.alert(
        'Cleanup Complete', 
        'Authentication data has been cleared. You can now try signing up again.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Force a re-render
              setIsSocialLoginInProgress(false);
              setIsOAuthInProgress(false);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('[Signup] Error during aggressive cleanup:', error);
      Alert.alert('Error', 'Failed to clear authentication data. Please try restarting the app.');
    }
  };
  
  const {
    phoneNumber, formattedNumber, error, loading,
    handlePhoneChange, handleNext
  } = usePhoneNumber(navigation);

  // Track if we're in the middle of a social login flow
  const [isSocialLoginInProgress, setIsSocialLoginInProgress] = React.useState(false);
  // Track if we're in the middle of user account creation
  const [isUserCreationInProgress, setIsUserCreationInProgress] = React.useState(false);
  // Track if we're in the middle of OAuth flow
  const [isOAuthInProgress, setIsOAuthInProgress] = React.useState(false);
  
  // Flag to prevent mount cleanup during credential checks
  const [isCheckingCredentials, setIsCheckingCredentials] = React.useState(false);
  
  // Flag to prevent duplicate auto-login attempts
  const [isAutoLoginInProgress, setIsAutoLoginInProgress] = React.useState(false);
  
  // Keep loader visible while transitioning away
  const [isNavigating, setIsNavigating] = useState(false);

  // Combined flag to decide when to block the UI with a loader
  const shouldShowBlockingLoader =
    isOAuthInProgress ||
    isSocialLoginInProgress ||
    isCheckingCredentials ||
    isAutoLoginInProgress ||
    isNavigating;
  
  // WebView OAuth state
  const [showOAuthWebView, setShowOAuthWebView] = useState(false);
  const [oauthUrl, setOauthUrl] = useState(null);
  const [oauthProvider, setOauthProvider] = useState(null);
  const [oauthResultData, setOauthResultData] = useState(null);
  
  // OAuth Error Modal state
  const [showOAuthErrorModal, setShowOAuthErrorModal] = useState(false);
  const [oauthErrorDetails, setOauthErrorDetails] = useState({});
  
  // Enhanced attemptAutoLogin function
  const attemptAutoLogin = async (provider = 'google') => {
    if (isAutoLoginInProgress) {
      console.log('[Signup] Auto-login already in progress, skipping...');
      return false;
    }
    
    setIsAutoLoginInProgress(true);
    setIsCheckingCredentials(true);
    
    try {
      console.log('[Signup] Starting auto-login attempt...');
      
      // First check if we already have local credentials
      const [token, userId] = await AsyncStorage.multiGet(['token', 'userId']).then((pairs) => pairs.map(([, v]) => v));
      
      if (token && userId) {
        console.log('[Signup] Found local credentials, navigating to MainTabs');
        setIsNavigating(true);
        navigation.navigate('MainTabs');
        return true;
      }
      
      // Get Clerk ID
      const clerkId = resolveClerkId();
      if (!clerkId) {
        console.log('[Signup] No Clerk ID available for auto-login');
        return false;
      }
      
      // Try existing user sign in
      console.log('[Signup] Attempting existing user sign in with Clerk ID:', clerkId);
      const success = await handleExistingUserSignIn(clerkUser, provider, clerkId);
      
      if (success) {
        return true;
      }
      
      // If handleExistingUserSignIn fails, check if we have credentials anyway
      // This handles the case where the backend call succeeded but the response wasn't handled properly
      const [retryToken, retryUserId] = await AsyncStorage.multiGet(['token', 'userId']).then((pairs) => pairs.map(([, v]) => v));
      if (retryToken && retryUserId) {
        console.log('[Signup] Found credentials after failed sign in, navigating to MainTabs');
        setIsNavigating(true);
        navigation.navigate('MainTabs');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.warn('[Signup] Error in auto-login:', error);
      
      // Even on error, check if we have credentials
      try {
        const [errorToken, errorUserId] = await AsyncStorage.multiGet(['token', 'userId']).then((pairs) => pairs.map(([, v]) => v));
        if (errorToken && errorUserId) {
          console.log('[Signup] Found credentials despite error, navigating to MainTabs');
          setIsNavigating(true);
          navigation.navigate('MainTabs');
          return true;
        }
      } catch (storageError) {
        console.warn('[Signup] Error checking storage after auto-login error:', storageError);
      }
      
      return false;
    } finally {
      setIsAutoLoginInProgress(false);
      setIsCheckingCredentials(false);
    }
  };

  // Resolve a usable Clerk user ID from available sources
  const resolveClerkId = (oauthResult) => {
    try {
      // First priority: current Clerk user ID
      if (clerkUser?.id) return clerkUser.id;
      
      // Second priority: auth user ID from Clerk hook
      if (authUserId) return authUserId;
      
      // Third priority: OAuth result data
      if (oauthResult?.signUp?.createdUserId) return oauthResult.signUp.createdUserId;
      if (oauthResult?.signIn?.userData?.id) return oauthResult.signIn.userData.id;
      if (oauthResult?.signUp?.userData?.id) return oauthResult.signUp.userData.id;
      
      // Fourth priority: created session ID from OAuth callback
      if (oauthResult?.createdSessionId) return oauthResult.createdSessionId;
      
      // Fifth priority: try to wait a bit for Clerk to update
      if (clerkUser && !clerkUser.id) {
        console.log('[Signup] Waiting for Clerk user ID to become available...');
        // This will be handled by the calling function
      }
    } catch (_) {}
    return null;
  };

  // Wait briefly for Clerk to populate a usable ID
  const waitForClerkId = async (oauthResult, timeoutMs = 5000) => {
    const start = Date.now();
    let candidate = resolveClerkId(oauthResult);
    while (!candidate && Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 250));
      candidate = resolveClerkId(oauthResult);
    }
    console.log('[Signup] Resolved Clerk ID candidate:', candidate || 'none');
    return candidate;
  };

  // Handle OAuth callback from WebView
  // Improved logic to better handle existing vs new users:
  // 1. Try to get user data from OAuth result first
  // 2. If no OAuth data, try social login for existing users
  // 3. Only create new accounts if user doesn't exist
  // 4. Properly detect existing users from backend responses
  const handleOAuthCallback = async (url, oauthResultData = null) => {
    try {
      console.log('🔍 [OAuth Debug] OAuth Callback Started');
      console.log('🔍 [OAuth Debug] Callback URL:', url);
      
      // Parse the callback URL - handle both formats
      const createdSessionIdMatch = url.match(/[?&]created_session_id=([^&]+)/);
      const errorMatch = url.match(/[?&]error=([^&]+)/);
      
      // Check if this is an sso-callback (which means OAuth was successful)
      const isSSOCallback = url.includes('sso-callback');
      
      if (errorMatch) {
        console.error('❌ [OAuth Debug] OAuth error detected:', errorMatch[1]);
        showOAuthError(
          'OAuth Authentication Failed',
          'The OAuth authentication process encountered an error. Please try signing in again.',
          oauthProvider
        );
        cleanupOAuthState();
        return;
      }
      
      // Handle both callback formats: created_session_id and sso-callback
      if (createdSessionIdMatch || isSSOCallback) {
        let sessionId = null;
        
        if (createdSessionIdMatch) {
          sessionId = createdSessionIdMatch[1];
          console.log('✅ [OAuth Debug] Session ID:', sessionId);
        } else if (isSSOCallback && oauthResultData) {
          // Extract session ID from OAuth result data
          sessionId = oauthResultData.createdSessionId;
          console.log('✅ [OAuth Debug] Session ID:', sessionId);
        }
        
        if (!sessionId) {
          console.error('❌ [OAuth Debug] No session ID found in OAuth result');
          showOAuthError(
            'Session Creation Failed',
            'We were unable to create a secure session for your authentication. Please try signing in again.',
            oauthProvider
          );
          cleanupOAuthState();
          return;
        }
        
        // Close WebView immediately
        setShowOAuthWebView(false);
        setOauthUrl(null);
        
        // Activate the session using the result data
        if (oauthResultData && oauthResultData.setActive) {
          try {
            await oauthResultData.setActive({ session: sessionId });
            console.log('✅ [OAuth Debug] Session activated');
          } catch (error) {
            console.warn('⚠️ [OAuth Debug] Failed to activate session:', error);
          }
        }
        
        // Wait for Clerk to update its state and populate user data
        console.log('⏳ [OAuth Debug] Waiting for Clerk user data...');
        console.log('🔍 [OAuth Debug] Session activated, waiting for user data to populate...');
        
        // Reduced delay for faster response
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force refresh Clerk user data and get current user
        let currentClerkUser = null;
        let attempts = 0;
        
        console.log('🔍 [OAuth Debug] Starting user data retrieval...');
        console.log('🔍 [OAuth Debug] - Initial clerkUser state:', clerkUser?.id ? 'Available' : 'Not Available');
        console.log('🔍 [OAuth Debug] - clerkUser object:', {
          id: clerkUser?.id,
          email: clerkUser?.primaryEmailAddress?.emailAddress,
          firstName: clerkUser?.firstName,
          lastName: clerkUser?.lastName,
          hasReload: !!clerkUser?.reload
        });
        
        // First, try to get user data directly from the OAuth result
        if (oauthResultData?.signIn?.userData && Object.keys(oauthResultData.signIn.userData).length > 0) {
          console.log('✅ [OAuth Debug] Found user data directly in OAuth result');
          const userData = oauthResultData.signIn.userData;
          console.log('🔍 [OAuth Debug] - userData keys:', Object.keys(userData));
          
          // If we have user data, we can proceed without waiting for Clerk hook
          if (userData.email) {
            console.log('🔍 [OAuth Debug] - email:', userData.email);
            console.log('🔍 [OAuth Debug] - firstName:', userData.firstName);
            console.log('🔍 [OAuth Debug] - lastName:', userData.lastName);
            
            // Try to find existing user by email immediately
            try {
              const findUserResponse = await fetch(`${API_BASE_URL}/auth/find-user-by-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: userData.email,
                  provider: oauthProvider
                }),
              });
              
              if (findUserResponse.ok) {
                const findUserResult = await findUserResponse.json();
                console.log('🔍 [Database Debug] Find user response:', findUserResult);
                
                if (findUserResult.success && findUserResult.user) {
                  console.log('✅ [OAuth Debug] Found existing user by email from OAuth userData');
                  console.log('🔍 [Database Debug] User details from database:');
                  console.log('🔍 [Database Debug] - userId:', findUserResult.user._id);
                  console.log('🔍 [Database Debug] - clerkId:', findUserResult.user.clerkId);
                  console.log('🔍 [Database Debug] - email:', findUserResult.user.email);
                  console.log('🔍 [Database Debug] - firstName:', findUserResult.user.firstname);
                  console.log('🔍 [Database Debug] - lastName:', findUserResult.user.lastname);
                  console.log('🔍 [Database Debug] - socialProvider:', findUserResult.user.socialProvider);
                  
                  // Try to login with existing user data
                  const loginUserData = {
                    clerkId: findUserResult.user.clerkId || sessionId,
                    email: userData.email,
                    firstName: userData.firstName || findUserResult.user.firstname,
                    lastName: userData.lastName || findUserResult.user.lastname,
                    isNewUser: false
                  };
                  
                  console.log('🔍 [Database Debug] Login attempt with user data:', loginUserData);
                  
                  const accountResult = await createUserAccount(loginUserData, oauthProvider);
                  
                  if (accountResult && accountResult.token) {
                    console.log('✅ [OAuth Debug] Login successful with existing user data from OAuth');
                    setIsNavigating(true);
                    setTimeout(() => {
                      navigation.navigate('MainTabs');
                      setTimeout(() => cleanupOAuthState(), 1000);
                    }, 500);
                    return;
                  }
                } else {
                  console.log('⚠️ [Database Debug] No user found in database for email:', userData.email);
                  console.log('🔍 [Database Debug] Response details:', findUserResult);
                }
              } else {
                console.log('❌ [Database Debug] Find user request failed with status:', findUserResponse.status);
                try {
                  const errorResponse = await findUserResponse.text();
                  console.log('🔍 [Database Debug] Error response body:', errorResponse);
                } catch (e) {
                  console.log('🔍 [Database Debug] Could not read error response body');
                }
              }
            } catch (error) {
              console.error('❌ [OAuth Debug] Error finding existing user by OAuth email:', error);
            }
          }
        }
        
        // Since OAuth result doesn't contain user data, try to get it from Clerk's session
        console.log('🔍 [OAuth Debug] OAuth result missing user data, attempting to get from Clerk session...');
        
        // Try to get user data from Clerk's current session
        try {
          // Minimal delay for Clerk to populate the session
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try to reload the user data immediately
          if (clerkUser?.reload) {
            console.log('🔍 [OAuth Debug] Immediately reloading clerkUser...');
            await clerkUser.reload();
          }
          
          // Check if we now have user data
          if (clerkUser?.id) {
            console.log('✅ [OAuth Debug] Successfully got user data from Clerk:');
            console.log('🔍 [OAuth Debug] - Clerk ID:', clerkUser.id);
            console.log('🔍 [OAuth Debug] - Email:', clerkUser.primaryEmailAddress?.emailAddress);
            console.log('🔍 [OAuth Debug] - First Name:', clerkUser.firstName);
            console.log('🔍 [OAuth Debug] - Last Name:', clerkUser.lastName);
            
            // Now try to find existing user by this email
            const email = clerkUser.primaryEmailAddress?.emailAddress;
            if (email) {
              console.log('🔍 [OAuth Debug] Attempting to find existing user by Clerk email:', email);
              
              const findUserResponse = await fetch(`${API_BASE_URL}/auth/find-user-by-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: email,
                  provider: oauthProvider
                }),
              });
              
              if (findUserResponse.ok) {
                const findUserResult = await findUserResponse.json();
                console.log('🔍 [Database Debug] Find user response (Clerk):', findUserResult);
                
                if (findUserResult.success && findUserResult.user) {
                  console.log('✅ [OAuth Debug] Found existing user by Clerk email');
                  console.log('🔍 [Database Debug] User details from database (Clerk):');
                  console.log('🔍 [Database Debug] - userId:', findUserResult.user._id);
                  console.log('🔍 [Database Debug] - clerkId:', findUserResult.user.clerkId);
                  console.log('🔍 [Database Debug] - email:', findUserResult.user.email);
                  console.log('🔍 [Database Debug] - firstName:', findUserResult.user.firstname);
                  console.log('🔍 [Database Debug] - lastName:', findUserResult.user.lastname);
                  console.log('🔍 [Database Debug] - socialProvider:', findUserResult.user.socialProvider);
                  
                  // Try to login with existing user data
                  const loginUserData = {
                    clerkId: findUserResult.user.clerkId || clerkUser.id,
                    email: email,
                    firstName: clerkUser.firstName || findUserResult.user.firstname,
                    lastName: clerkUser.lastName || findUserResult.user.lastname,
                    isNewUser: false
                  };
                  
                  console.log('🔍 [Database Debug] Login attempt with user data (Clerk):', loginUserData);
                  
                  const accountResult = await createUserAccount(loginUserData, oauthProvider);
                  
                  if (accountResult && accountResult.token) {
                    console.log('✅ [OAuth Debug] Login successful with existing user data from Clerk');
                    setIsNavigating(true);
                    setTimeout(() => {
                      navigation.navigate('MainTabs');
                      setTimeout(() => cleanupOAuthState(), 1000);
                    }, 500);
                    return;
                  }
                } else {
                  console.log('⚠️ [Database Debug] No user found in database for Clerk email:', email);
                  console.log('🔍 [Database Debug] Response details (Clerk):', findUserResult);
                }
              } else {
                console.log('❌ [Database Debug] Find user request failed (Clerk) with status:', findUserResponse.status);
              }
            } else {
              console.log('⚠️ [OAuth Debug] No email found in Clerk user data');
            }
          } else {
            console.log('⚠️ [OAuth Debug] Clerk user still not populated after reload');
          }
        } catch (error) {
          console.log('⚠️ [OAuth Debug] Error getting user data from Clerk session:', error);
        }
        
        while (!currentClerkUser?.id && attempts < 10) {
          try {
            console.log(`🔍 [OAuth Debug] Attempt ${attempts + 1}/10 to get Clerk user data...`);
            
            // Try to get current user from Clerk immediately
            if (clerkUser?.reload) {
              console.log('🔍 [OAuth Debug] Immediately reloading clerkUser...');
              await clerkUser.reload();
            }
            
            // Try to get user from Clerk's current session using the correct method
            try {
              // In @clerk/clerk-expo, we need to use the useUser hook's user object
              // Let's try to force a refresh and wait for the hook to update
              if (clerkUser?.id) {
                currentClerkUser = clerkUser;
                console.log('✅ [OAuth Debug] Got current user from clerkUser hook:', clerkUser.id);
                console.log('🔍 [OAuth Debug] - email:', clerkUser.primaryEmailAddress?.emailAddress);
                console.log('🔍 [OAuth Debug] - firstName:', clerkUser.firstName);
                console.log('🔍 [OAuth Debug] - lastName:', clerkUser.lastName);
                break;
              } else {
                console.log('⚠️ [OAuth Debug] clerkUser hook still not populated');
              }
            } catch (clerkError) {
              console.warn('⚠️ [OAuth Debug] Error accessing clerkUser:', clerkError);
            }
            
            // Fallback to component state
            currentClerkUser = clerkUser;
            console.log('🔍 [OAuth Debug] Fallback to component state clerkUser:', currentClerkUser?.id ? 'Available' : 'Not Available');
            
            if (!currentClerkUser?.id) {
              console.log('🔍 [OAuth Debug] Waiting 200ms before next attempt...');
              await new Promise(resolve => setTimeout(resolve, 200));
              attempts++;
            }
          } catch (error) {
            console.warn('⚠️ [OAuth Debug] Attempt', attempts + 1, 'failed to get Clerk user data:', error);
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
          }
        }
        
        console.log('🔍 [OAuth Debug] Final Clerk User State:');
        console.log('🔍 [OAuth Debug] - clerkUser:', currentClerkUser?.id ? 'Available' : 'Not Available');
        console.log('🔍 [OAuth Debug] - clerkId:', currentClerkUser?.id);
        console.log('🔍 [OAuth Debug] - email:', currentClerkUser?.primaryEmailAddress?.emailAddress);
        console.log('🔍 [OAuth Debug] - firstName:', currentClerkUser?.firstName);
        console.log('🔍 [OAuth Debug] - lastName:', currentClerkUser?.lastName);
        
        // Check if we have user data in the OAuth result
        console.log('🔍 [OAuth Debug] Checking OAuth result data...');
        console.log('🔍 [OAuth Debug] - signUp data:', oauthResultData?.signUp);
        console.log('🔍 [OAuth Debug] - signIn data:', oauthResultData?.signIn);
        console.log('🔍 [OAuth Debug] - signIn.userData keys:', oauthResultData?.signIn?.userData ? Object.keys(oauthResultData.signIn.userData) : 'No userData');
        console.log('🔍 [OAuth Debug] - signUp keys:', oauthResultData?.signUp ? Object.keys(oauthResultData.signUp) : 'No signUp');
        console.log('🔍 [OAuth Debug] - signIn keys:', oauthResultData?.signIn ? Object.keys(oauthResultData.signIn) : 'No signIn');
        
        if (oauthResultData && oauthResultData.signUp) {
          const signUpData = oauthResultData.signUp;
          const hasAnyUserData = signUpData.emailAddress || signUpData.firstName || signUpData.lastName;
          
          if (hasAnyUserData) {
            console.log('✅ [OAuth Debug] OAuth Result Data:');
            console.log('🔍 [OAuth Debug] - email:', signUpData.emailAddress);
            console.log('🔍 [OAuth Debug] - firstName:', signUpData.firstName);
            console.log('🔍 [OAuth Debug] - lastName:', signUpData.lastName);
            console.log('🔍 [OAuth Debug] - createdUserId:', signUpData.createdUserId);
            
            // Try to create user account with available data
            try {
              const userData = {
                clerkId: signUpData.createdUserId || sessionId,
                email: signUpData.emailAddress || 'user@example.com',
                firstName: signUpData.firstName || 'User',
                lastName: signUpData.lastName || 'Name',
                isNewUser: true
              };
              
              const accountResult = await createUserAccount(userData, oauthProvider);
              
              if (accountResult && accountResult.token) {
                console.log('✅ [OAuth Debug] User account result:');
                console.log('🔍 [OAuth Debug] - userExists:', accountResult.userExists);
                console.log('🔍 [OAuth Debug] - message:', accountResult.message);
                console.log('🔍 [OAuth Debug] - userId:', accountResult.user?._id || accountResult.userId);
                
                if (accountResult.userExists) {
                  console.log('🔍 [OAuth Debug] Existing user detected, navigating to MainTabs');
                  setIsNavigating(true);
                  setTimeout(() => {
                    navigation.navigate('MainTabs');
                    setTimeout(() => cleanupOAuthState(), 1000);
                  }, 500);
                } else {
                  console.log('🔍 [OAuth Debug] New user detected, navigating to Welcome screen');
                  setIsNavigating(true);
                  setTimeout(() => {
                    navigation.navigate('Welcome');
                    setTimeout(() => cleanupOAuthState(), 1000);
                  }, 500);
                }
                return;
              }
            } catch (error) {
              console.error('❌ [OAuth Debug] Error creating user with OAuth data:', error);
            }
          }
        }
        
        // Also check signIn data for existing users
        if (oauthResultData && oauthResultData.signIn && oauthResultData.signIn.userData) {
          console.log('✅ [OAuth Debug] Found signIn user data for existing user');
          const signInData = oauthResultData.signIn.userData;
          console.log('🔍 [OAuth Debug] - email:', signInData.email);
          console.log('🔍 [OAuth Debug] - firstName:', signInData.firstName);
          console.log('🔍 [OAuth Debug] - lastName:', signInData.lastName);
          
          // Try to find existing user by email
          if (signInData.email) {
            try {
              const findUserResponse = await fetch(`${API_BASE_URL}/auth/find-user-by-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: signInData.email,
                  provider: oauthProvider
                }),
              });
              
              if (findUserResponse.ok) {
                const findUserResult = await findUserResponse.json();
                console.log('🔍 [Database Debug] Find user response (signIn):', findUserResult);
                
                if (findUserResult.success && findUserResult.user) {
                  console.log('✅ [OAuth Debug] Found existing user by email from signIn data');
                  console.log('🔍 [Database Debug] User details from database (signIn):');
                  console.log('🔍 [Database Debug] - userId:', findUserResult.user._id);
                  console.log('🔍 [Database Debug] - clerkId:', findUserResult.user.clerkId);
                  console.log('🔍 [Database Debug] - email:', findUserResult.user.email);
                  console.log('🔍 [Database Debug] - firstName:', findUserResult.user.firstname);
                  console.log('🔍 [Database Debug] - lastName:', findUserResult.user.lastname);
                  console.log('🔍 [Database Debug] - socialProvider:', findUserResult.user.socialProvider);
                  
                  // Try to login with existing user data
                  const userData = {
                    clerkId: findUserResult.user.clerkId || currentClerkUser?.id || sessionId,
                    email: signInData.email,
                    firstName: signInData.firstName || findUserResult.user.firstname,
                    lastName: signInData.lastName || findUserResult.user.lastname,
                    isNewUser: false
                  };
                  
                  console.log('🔍 [Database Debug] Login attempt with user data (signIn):', userData);
                  
                  const accountResult = await createUserAccount(userData, oauthProvider);
                  
                  if (accountResult && accountResult.token) {
                    console.log('✅ [OAuth Debug] Login successful with existing user data from signIn');
                    setIsNavigating(true);
                    setTimeout(() => {
                      navigation.navigate('MainTabs');
                      setTimeout(() => cleanupOAuthState(), 1000);
                    }, 500);
                    return;
                  }
                } else {
                  console.log('⚠️ [Database Debug] No user found in database for signIn email:', signInData.email);
                  console.log('🔍 [Database Debug] Response details (signIn):', findUserResult);
                }
              } else {
                console.log('❌ [Database Debug] Find user request failed (signIn) with status:', findUserResponse.status);
                try {
                  const errorResponse = await findUserResponse.text();
                  console.log('🔍 [Database Debug] Error response body (signIn):', errorResponse);
                } catch (e) {
                  console.log('🔍 [Database Debug] Could not read error response body (signIn)');
                }
              }
            } catch (error) {
              console.error('❌ [OAuth Debug] Error finding existing user by signIn email:', error);
            }
          }
        }
        
        if (!currentClerkUser?.id) {
          // console.error('❌ [OAuth Debug] Failed to get Clerk user data after OAuth');
          
          // Show OAuth error modal instead of just logging
          showOAuthError(
            'Authentication Issue',
            'We encountered an issue retrieving your Google profile data. This usually resolves itself - please try signing in again.',
            oauthProvider
          );
          
          // Try to get existing user data from backend using email from OAuth result
          if (oauthResultData && oauthResultData.signUp && oauthResultData.signUp.emailAddress) {
            const email = oauthResultData.signUp.emailAddress;
            console.log('🔍 [OAuth Debug] Attempting to find existing user by email:', email);
            
            try {
              // Try to find existing user by email
              const findUserResponse = await fetch(`${API_BASE_URL}/auth/find-user-by-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: email,
                  provider: oauthProvider
                }),
              });
              
              console.log('🔍 [OAuth Debug] Find user response status:', findUserResponse.status);
              
              if (findUserResponse.ok) {
                const findUserResult = await findUserResponse.json();
                console.log('🔍 [Database Debug] Find user response (signUp):', findUserResult);
                console.log('✅ [OAuth Debug] Database query result:');
                console.log('🔍 [OAuth Debug] - success:', findUserResult.success);
                console.log('🔍 [OAuth Debug] - message:', findUserResult.message);
                
                if (findUserResult.success && findUserResult.user) {
                  console.log('🔍 [Database Debug] User details from database (signUp):');
                  console.log('🔍 [Database Debug] - userId:', findUserResult.user._id);
                  console.log('🔍 [Database Debug] - clerkId:', findUserResult.user.clerkId);
                  console.log('🔍 [Database Debug] - email:', findUserResult.user.email);
                  console.log('🔍 [Database Debug] - firstName:', findUserResult.user.firstname);
                  console.log('🔍 [Database Debug] - lastName:', findUserResult.user.lastname);
                  console.log('🔍 [Database Debug] - socialProvider:', findUserResult.user.socialProvider);
                  
                  if (findUserResult.user.clerkId) {
                    console.log('✅ [OAuth Debug] Using existing user Clerk ID:', findUserResult.user.clerkId);
                    
                    // Try to login with existing user data
                    const userData = {
                      clerkId: findUserResult.user.clerkId,
                      email: email,
                      firstName: signUpData.firstName || findUserResult.user.firstname,
                      lastName: signUpData.lastName || findUserResult.user.lastname,
                      isNewUser: false
                    };
                    
                    console.log('🔍 [Database Debug] Login attempt with user data (signUp):', userData);
                    
                    const accountResult = await createUserAccount(userData, oauthProvider);
                    
                    if (accountResult && accountResult.token) {
                      console.log('✅ [OAuth Debug] Login successful with existing user data');
                      setIsNavigating(true);
                      setTimeout(() => {
                        navigation.navigate('MainTabs');
                        setTimeout(() => cleanupOAuthState(), 1000);
                      }, 500);
                      return;
                    }
                  }
                } else {
                  console.log('⚠️ [Database Debug] No user found in database for signUp email:', email);
                  console.log('🔍 [Database Debug] Response details (signUp):', findUserResult);
                }
              } else {
                console.log('❌ [Database Debug] Find user request failed (signUp) with status:', findUserResponse.status);
                try {
                  const errorResponse = await findUserResponse.text();
                  console.log('🔍 [Database Debug] Error response body (signUp):', errorResponse);
                } catch (e) {
                  console.log('🔍 [Database Debug] Could not read error response body (signUp)');
                }
              }
            } catch (error) {
              console.error('❌ [OAuth Debug] Error finding existing user by email:', error);
            }
          } else {
            console.log('⚠️ [OAuth Debug] No email in OAuth result, cannot perform email lookup');
            console.log('🔍 [OAuth Debug] OAuth result structure:', {
              hasSignUp: !!oauthResultData?.signUp,
              hasSignIn: !!oauthResultData?.signIn,
              signUpKeys: oauthResultData?.signUp ? Object.keys(oauthResultData.signUp) : [],
              signInKeys: oauthResultData?.signIn ? Object.keys(oauthResultData.signIn) : []
            });
            
            // Try to extract email from other sources
            let extractedEmail = null;
            if (oauthResultData?.signIn?.userData?.email) {
              extractedEmail = oauthResultData.signIn.userData.email;
              console.log('🔍 [OAuth Debug] Found email in signIn.userData:', extractedEmail);
            } else if (oauthResultData?.signUp?.emailAddress) {
              extractedEmail = oauthResultData.signUp.emailAddress;
              console.log('🔍 [OAuth Debug] Found email in signUp.emailAddress:', extractedEmail);
            } else if (oauthResultData?.signIn?.identifier) {
              extractedEmail = oauthResultData.signIn.identifier;
              console.log('🔍 [OAuth Debug] Found email in signIn.identifier:', extractedEmail);
            }
            
            if (extractedEmail) {
              console.log('🔍 [OAuth Debug] Attempting to find existing user by extracted email:', extractedEmail);
              
              try {
                const findUserResponse = await fetch(`${API_BASE_URL}/auth/find-user-by-email`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: extractedEmail,
                    provider: oauthProvider
                  }),
                });
                
                console.log('🔍 [OAuth Debug] Find user response status:', findUserResponse.status);
                
                if (findUserResponse.ok) {
                  const findUserResult = await findUserResponse.json();
                  console.log('🔍 [Database Debug] Find user response (extracted email):', findUserResult);
                  console.log('✅ [OAuth Debug] Database query result with extracted email:');
                  console.log('🔍 [OAuth Debug] - success:', findUserResult.success);
                  console.log('🔍 [OAuth Debug] - message:', findUserResult.message);
                  
                  if (findUserResult.success && findUserResult.user) {
                    console.log('🔍 [Database Debug] User details from database (extracted email):');
                    console.log('🔍 [Database Debug] - userId:', findUserResult.user._id);
                    console.log('🔍 [Database Debug] - clerkId:', findUserResult.user.clerkId);
                    console.log('🔍 [Database Debug] - email:', findUserResult.user.email);
                    console.log('🔍 [Database Debug] - firstName:', findUserResult.user.firstname);
                    console.log('🔍 [Database Debug] - lastName:', findUserResult.user.lastname);
                    console.log('🔍 [Database Debug] - socialProvider:', findUserResult.user.socialProvider);
                    
                    if (findUserResult.user.clerkId) {
                      console.log('✅ [OAuth Debug] Using existing user Clerk ID from extracted email:', findUserResult.user.clerkId);
                      
                      // Try to login with existing user data
                      const userData = {
                        clerkId: findUserResult.user.clerkId,
                        email: extractedEmail,
                        firstName: oauthResultData?.signUp?.firstName || findUserResult.user.firstname,
                        lastName: oauthResultData?.signUp?.lastName || findUserResult.user.lastname,
                        isNewUser: false
                      };
                      
                      console.log('🔍 [Database Debug] Login attempt with user data (extracted email):', userData);
                      
                      const accountResult = await createUserAccount(userData, oauthProvider);
                      
                      if (accountResult && accountResult.token) {
                        console.log('✅ [OAuth Debug] Login successful with existing user data from extracted email');
                        setIsNavigating(true);
                        setTimeout(() => {
                          navigation.navigate('MainTabs');
                          setTimeout(() => cleanupOAuthState(), 1000);
                        }, 500);
                        return;
                      }
                    }
                  } else {
                    console.log('⚠️ [Database Debug] No user found in database for extracted email:', extractedEmail);
                    console.log('🔍 [Database Debug] Response details (extracted email):', findUserResult);
                  }
                } else {
                  console.log('❌ [Database Debug] Find user request failed (extracted email) with status:', findUserResponse.status);
                  try {
                    const errorResponse = await findUserResponse.text();
                    console.log('🔍 [Database Debug] Error response body (extracted email):', errorResponse);
                  } catch (e) {
                    console.log('🔍 [Database Debug] Could not read error response body (extracted email)');
                  }
                }
              } catch (error) {
                console.error('❌ [OAuth Debug] Error finding existing user by extracted email:', error);
              }
            }
          }
        }
        
        // If no email found in OAuth result, show error and stop
        if (!oauthResultData?.signUp?.emailAddress && !oauthResultData?.signIn?.userData?.email) {
           cleanupOAuthState();
          return;
        }
        
        // Check if we have local credentials first
        const [token, userId] = await AsyncStorage.multiGet(['token', 'userId']).then((pairs) => pairs.map(([, v]) => v));
        if (token && userId) {
          console.log('[Signup] Found existing credentials after OAuth, navigating to MainTabs');
          setIsNavigating(true);
          setTimeout(() => {
            setIsNavigating(true);
            navigation.navigate('MainTabs');
            setTimeout(() => cleanupOAuthState(), 1000);
          }, 500);
          return;
        }
        
        // Try to get Clerk ID and attempt existing user sign in
        const clerkId = clerkUser?.id || sessionId;
        if (clerkId) {
          console.log('[Signup] Attempting existing user sign in with Clerk ID:', clerkId);
          
          try {
            console.log('[Signup] Attempting social login for existing user...');
            const success = await handleExistingUserSignIn(clerkUser, oauthProvider, clerkId);
            if (success) {
              console.log('[Signup] Existing user sign in successful after OAuth');
              return;
            }
          } catch (error) {
            console.warn('[Signup] Social login attempt failed, user may not exist:', error);
          }
        }
        
        // If no existing user, try to create one
        if (clerkUser) {
          console.log('🔍 [OAuth Debug] No existing user found, attempting user creation...');
          
          // Wait for Clerk to fully populate user data
          let attempts = 0;
          let userDataComplete = false;
          
          while (!userDataComplete && attempts < 10) {
            const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;
            const firstName = clerkUser.firstName;
            const lastName = clerkUser.lastName;
            
            if (email && firstName && lastName) {
              userDataComplete = true;
              console.log('✅ [OAuth Debug] Complete user data received:', { email, firstName, lastName });
            } else {
              await new Promise(resolve => setTimeout(resolve, 500));
              attempts++;
            }
          }
          
          if (!userDataComplete) {
            console.error('❌ [OAuth Debug] Failed to get complete user data after OAuth');
            showOAuthError(
              'Profile Data Error',
              'We were unable to retrieve your Google profile information. This usually resolves itself - please try signing in again.',
              oauthProvider
            );
            cleanupOAuthState();
            return;
          }
          
          try {
            const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;
            const firstName = clerkUser.firstName;
            const lastName = clerkUser.lastName;
            
            if (email && firstName && lastName) {
              const userData = {
                clerkId: clerkUser.id,
                email: email,
                firstName: firstName,
                lastName: lastName,
                isNewUser: true
              };
              
              const accountResult = await createUserAccount(userData, oauthProvider);
              
              if (accountResult && accountResult.token) {
                console.log('✅ [OAuth Debug] User creation successful after OAuth');
                console.log('🔍 [OAuth Debug] - userExists:', accountResult.userExists);
                console.log('🔍 [OAuth Debug] - message:', accountResult.message);
                console.log('🔍 [OAuth Debug] - userId:', accountResult.user?._id || accountResult.userId);
                
                if (accountResult.userExists) {
                  console.log('🔍 [OAuth Debug] Existing user detected, navigating to MainTabs');
                  setIsNavigating(true);
                  setTimeout(() => {
                    navigation.navigate('MainTabs');
                    setTimeout(() => cleanupOAuthState(), 1000);
                  }, 500);
                } else {
                  console.log('🔍 [OAuth Debug] New user detected, navigating to Welcome screen');
                  setIsNavigating(true);
                  setTimeout(() => {
                    navigation.navigate('Welcome');
                    setTimeout(() => cleanupOAuthState(), 1000);
                  }, 500);
                }
                return;
              }
            } else {
              console.error('❌ [OAuth Debug] Missing required user data after validation');
              Alert.alert('Profile Data Error', 'Unable to retrieve your Google profile information. Please try again or use phone number signup.');
              cleanupOAuthState();
              return;
            }
          } catch (error) {
            console.error('❌ [OAuth Debug] User creation failed after OAuth:', error);
            Alert.alert('Account Creation Failed', 'Failed to create your account. Please try again or use phone number signup.');
            cleanupOAuthState();
            return;
          }
        }
        
        // If all else fails, attempt auto-login as fallback
        try {
        console.log('[Signup] Attempting auto-login as fallback...');
        const success = await attemptAutoLogin(oauthProvider);
        if (success) {
          console.log('[Signup] Auto-login successful after OAuth callback');
          return;
        }
        
        // If auto-login fails, the useEffect monitoring auth state should handle it
        console.log('[Signup] Auto-login failed, waiting for auth state monitoring...');
      } catch (error) {
        console.error('[Signup] Error processing OAuth callback:', error);
        cleanupOAuthState();
        Alert.alert('Error', 'Failed to process authentication. Please try again.');
        }
      }
    } catch (error) {
      console.error('[Signup] Error in handleOAuthCallback:', error);
      cleanupOAuthState();
      Alert.alert('Error', 'An unexpected error occurred during authentication. Please try again.');
      }
    };

  // Handle OAuth callback that might come from App.js deep link handler
  const handleExternalOAuthCallback = async (url) => {
    // Only process if we're in the middle of OAuth
    if (showOAuthWebView && oauthUrl) {
      console.log('[Signup] External OAuth callback received while WebView is active:', url);
      
      // Close the WebView since callback came from outside
      setShowOAuthWebView(false);
      setOauthUrl(null);
      setOauthProvider(null);
      setOauthResultData(null);
      
      // Process the callback
      await handleOAuthCallback(url, oauthResultData);
    }
  };

  // Cleanup OAuth state
  const cleanupOAuthState = () => {
    setShowOAuthWebView(false);
    setOauthUrl(null);
    setOauthProvider(null);
    setOauthResultData(null);
    setIsSocialLoginInProgress(false);
    setIsOAuthInProgress(false);
  };

  // Handle OAuth error modal
  const showOAuthError = (title, subtitle, provider = 'google') => {
    setOauthErrorDetails({
      title: title || 'OAuth Error',
      subtitle: subtitle || 'There was an issue with the authentication process. Please try again.',
      provider: provider
    });
    setShowOAuthErrorModal(true);
  };

  const hideOAuthError = () => {
    setShowOAuthErrorModal(false);
    setOauthErrorDetails({});
  };

  const retryOAuth = () => {
    hideOAuthError();
    
    // Trigger immediate refresh before retrying
    immediateRefreshUserData().then(() => {
      // Trigger the same OAuth flow again after refresh
      handleSocialLogin(oauthErrorDetails.provider || 'google');
    });
  };

  // Immediate refresh function for faster OAuth response
  const immediateRefreshUserData = async () => {
    try {
      console.log('🔍 [OAuth Debug] Starting immediate user data refresh...');
      
      // Force reload user data immediately
      if (clerkUser?.reload) {
        console.log('🔍 [OAuth Debug] Immediately reloading user data...');
        await clerkUser.reload();
      }
      
      // Force a re-render by updating state
      setIsSocialLoginInProgress(false);
      setIsOAuthInProgress(false);
      
      // Wait minimal time for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ [OAuth Debug] Immediate refresh completed');
      return true;
    } catch (error) {
      console.warn('⚠️ [OAuth Debug] Immediate refresh failed:', error);
      return false;
    }
  };

  // Wait for local credentials (token + userId) to appear in AsyncStorage
  const waitForLocalCredentials = async (timeoutMs = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const [token, userId] = await AsyncStorage.multiGet(['token', 'userId']).then((pairs) => pairs.map(([, v]) => v));
      if (token && userId) {
        return { token, userId };
      }
      await new Promise(r => setTimeout(r, 250));
    }
    return null;
  };

  // Add timeout mechanism to prevent getting stuck
  React.useEffect(() => {
    let timeoutId;
    if (isSocialLoginInProgress) {
      timeoutId = setTimeout(() => {
        console.warn('[Signup] Social login timeout reached, cleaning up...');
        setIsSocialLoginInProgress(false);
        setIsOAuthInProgress(false);
        cleanupOAuthState();
        Alert.alert('Timeout', 'Authentication is taking too long. Please try again.');
      }, 60000); // 60 second timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSocialLoginInProgress]);
  
  // Add OAuth WebView timeout
  React.useEffect(() => {
    let timeoutId;
    if (showOAuthWebView && oauthUrl) {
      timeoutId = setTimeout(() => {
        console.warn('[Signup] OAuth WebView timeout reached, cleaning up...');
        cleanupOAuthState();
        showOAuthError(
          'Authentication Timeout',
          'The authentication process is taking longer than expected. Please try signing in again.',
          oauthProvider
        );
      }, 15000); // Reduced to 15 second timeout for WebView
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showOAuthWebView, oauthUrl]);

  // Enhanced createUserAccount function
  const createUserAccount = async (userData, provider) => {
    try {
      console.log('�� [createUserAccount] Started');
      console.log('🔍 [createUserAccount] Input:', {
        clerkId: userData.clerkId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        provider: provider
      });
      
      // Validate minimum required data
      if (!userData.clerkId) {
        console.error('❌ [createUserAccount] Clerk ID is missing');
        throw new Error('Clerk ID is required');
      }
      
      // Email is required but we can use a fallback if not provided
      if (!userData.email) {
        console.warn('⚠️ [createUserAccount] Email address is missing, using fallback');
        userData.email = 'user@example.com'; // Fallback email
      }
      
      // Ensure firstName and lastName have fallbacks
      if (!userData.firstName) {
        console.warn('⚠️ [createUserAccount] First name is missing, using fallback');
        userData.firstName = 'User';
      }
      
      if (!userData.lastName) {
        console.warn('⚠️ [createUserAccount] Last name is missing, using fallback');
        userData.lastName = 'Name';
      }
      
      const requestBody = {
        clerkId: userData.clerkId,
        provider: provider, // google, facebook, apple
        email: userData.email,
      };
      
      // Add optional fields if available
      if (userData.firstName) {
        requestBody.firstName = userData.firstName;
      }
      
      if (userData.lastName) {
        requestBody.lastName = userData.lastName;
      }
      
      console.log('🔍 [createUserAccount] Making request to backend...');
      
      const response = await fetch(`${API_BASE_URL}/auth/create-social-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🔍 [createUserAccount] Response status:', response.status);

      let result;
      try {
        result = await response.json();
        console.log('🔍 [createUserAccount] Backend response:');
        console.log('🔍 [createUserAccount] - message:', result.message);
        console.log('🔍 [createUserAccount] - token present:', !!result.token);
        console.log('🔍 [createUserAccount] - user ID:', result.user?._id);
        console.log('🔍 [createUserAccount] - clerk ID:', result.user?.clerkId);
        console.log('🔍 [createUserAccount] - email:', result.user?.email);
        console.log('🔍 [createUserAccount] - firstName:', result.user?.firstname);
        console.log('🔍 [createUserAccount] - lastName:', result.user?.lastname);
        console.log('🔍 [createUserAccount] - socialProvider:', result.user?.socialProvider);
        console.log('🔍 [createUserAccount] - verificationStatus:', result.user?.verificationStatus);
      } catch (parseError) {
        console.error('❌ [createUserAccount] Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response from server');
      }
      
      if (response.ok) {
        // Check if this is actually an existing user being updated
        if (result.message && (result.message.includes('Existing user updated') || result.message.includes('already exists') || result.message.includes('duplicate'))) {
          console.log('✅ [createUserAccount] Existing user updated successfully');
          // Store both token and user ID for future use
          await AsyncStorage.multiSet([
            ['token', result.token],
            ['userId', result.user?.id || result.userId || userData.clerkId]
          ]);
          
          return { ...result, userExists: true };
        } else if (result.user && result.user.phone && result.user.phone.startsWith('temp_')) {
          // If the user has a temporary phone number, this is definitely a new user
          console.log('✅ [createUserAccount] New user detected by temporary phone number');
          // Store both token and user ID for future use
          await AsyncStorage.multiSet([
            ['token', result.token],
            ['userId', result.user._id]
          ]);
          
          return { ...result, userExists: false };
        } else if (result.message && result.message.includes('User created successfully')) {
          // If the message says "User created successfully", this is a new user
          console.log('✅ [createUserAccount] New user detected by success message');
          // Store both token and user ID for future use
          await AsyncStorage.multiSet([
            ['token', result.token],
            ['userId', result.user?._id || result.userId || userData.clerkId]
          ]);
          
          return { ...result, userExists: false };
        } else {
          // Default case - assume existing user if we can't determine
          console.log('✅ [createUserAccount] Default case - assuming existing user');
          // Store both token and user ID for future use
          await AsyncStorage.multiSet([
            ['token', result.token],
            ['userId', result.user?._id || result.userId || userData.clerkId]
          ]);
          
          return { ...result, userExists: true };
        }
      } else {
        console.error('❌ [createUserAccount] Failed to create user account:', result);
        
        // Check if user already exists
        if (result.error && (result.error.includes('already exists') || result.error.includes('duplicate'))) {
          console.log('🔍 [createUserAccount] User already exists, attempting login...');
          // If user exists, we should get a token back
          if (result.token) {
            console.log('✅ [createUserAccount] Token received for existing user');
            await AsyncStorage.multiSet([
              ['token', result.token],
              ['userId', result.user?.id || result.userId || userData.clerkId]
            ]);
            return { ...result, userExists: true };
          }
          
          // If no token but user exists, try to login
          try {
            console.log('🔍 [createUserAccount] Attempting social login for existing user...');
            const loginResponse = await fetch(`${API_BASE_URL}/auth/social-login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clerkId: userData.clerkId,
                provider: provider,
              }),
            });
            
            const loginResult = await loginResponse.json();
            console.log('🔍 [createUserAccount] Social login result:', {
              status: loginResponse.status,
              success: loginResponse.ok,
              hasToken: !!loginResult.token,
              userId: loginResult.user?._id
            });
            
            if (loginResponse.ok && loginResult.token) {
              console.log('✅ [createUserAccount] Social login successful');
              await AsyncStorage.multiSet([
                ['token', loginResult.token],
                ['userId', loginResult.user?.id || loginResult.userId || userData.clerkId]
              ]);
              return { ...loginResult, userExists: true };
            }
          } catch (loginError) {
            console.error('❌ [createUserAccount] Login attempt failed:', loginError);
          }
        }
        
        throw new Error(result.error || result.message || 'Failed to create user account');
      }
    } catch (error) {
      console.error('❌ [createUserAccount] Error creating user account:', error);
      throw error;
    }
  };

  // SIMPLER SOLUTION: Let the useAuth hook handle user data
  const handleSocialLogin = async (provider) => {
    console.log('🔍 [Social Login Debug] ===== handleSocialLogin Started =====');
    console.log('🔍 [Social Login Debug] Provider:', provider);
    console.log('🔍 [Social Login Debug] Current state:');
    console.log('🔍 [Social Login Debug] - isSocialLoginInProgress:', isSocialLoginInProgress);
    console.log('🔍 [Social Login Debug] - isCheckingCredentials:', isCheckingCredentials);
    console.log('🔍 [Social Login Debug] - isLoaded:', isLoaded);
    console.log('🔍 [Social Login Debug] - isSignedIn:', isSignedIn);
    console.log('🔍 [Social Login Debug] - clerkUser:', clerkUser);
    
    if (isSocialLoginInProgress || isCheckingCredentials) {
      console.log('⚠️ [Social Login Debug] Social login already in progress, ignoring request');
      return;
    }

    // Ensure Clerk is properly loaded
    if (!isLoaded) {
      console.log('❌ [Social Login Debug] Clerk not loaded yet');
      Alert.alert('Please Wait', 'Authentication system is still loading. Please try again in a moment.');
      return;
    }

    // If user is already signed in, try auto-login first
    if (isSignedIn) {
      console.log('🔍 [Social Login Debug] User already signed in, attempting auto-login...');
      
      const success = await attemptAutoLogin(provider);
      if (success) {
        console.log('✅ [Social Login Debug] Auto-login succeeded');
        return; // Auto-login succeeded and navigated
      }
      
      // Auto-login failed, clear Clerk state and proceed with fresh OAuth
      console.log('⚠️ [Social Login Debug] Auto-login failed, clearing state and starting fresh OAuth...');
      try {
        if (signOut) {
          await signOut();
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ [Social Login Debug] Clerk state cleared');
        }
      } catch (error) {
        console.warn('⚠️ [Social Login Debug] Error clearing state:', error);
      }
      
      setIsSocialLoginInProgress(false);
    }

    // Check if we're already in the middle of OAuth
    if (showOAuthWebView) {
      console.log('⚠️ [Social Login Debug] OAuth WebView already open, ignoring duplicate request');
      return;
    }

    // Check network connectivity
    try {
      console.log('🔍 [Social Login Debug] Checking network connectivity...');
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        timeout: 5000 
      });
      if (!response.ok) {
        throw new Error('Network response not ok');
      }
      console.log('✅ [Social Login Debug] Network connectivity confirmed');
    } catch (networkError) {
      console.error('❌ [Social Login Debug] Network connectivity check failed:', networkError);
      Alert.alert('Network Error', 'Please check your internet connection and try again.');
      return;
    }

    try {
      console.log('🔍 [Social Login Debug] Starting OAuth flow...');
      setIsSocialLoginInProgress(true);
      setIsOAuthInProgress(true);
      
      if (isSignedIn) {
        // Check if user account exists before deciding navigation
        // We need both Clerk authentication AND local credentials to proceed
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');
        
        if (token && userId) {
          // User account exists, navigating to MainTabs
          setIsNavigating(true);
          navigation.navigate('MainTabs');
          return;
        } else {
          // User is signed in to Clerk but no local account exists
          // This could happen after logout or if there's a state mismatch
          // Check if this user already has an account in our backend
          const candidateId = await waitForClerkId(result);
          const existingUserSignedIn = await handleExistingUserSignIn(clerkUser, provider, candidateId);
          
          if (existingUserSignedIn) {
            // User was successfully signed in, function already handled navigation
            return;
          }
          
          // Proceed with OAuth flow to create/retrieve account
        }
      }

      let result;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let strategy;
      switch (provider) {
        case 'google':
          strategy = 'oauth_google';
          break;
        case 'facebook':
          strategy = 'oauth_facebook';
          break;
        case 'apple':
          Alert.alert('Coming Soon', 'Apple login will be available soon');
          return;
        default:
          console.error('Unsupported provider:', provider);
          return;
      }
      
      // Use WebView-based OAuth for better Android compatibility
      console.log('[Signup] Using WebView-based OAuth for better cross-device compatibility');
      
      // Generate OAuth URL using Clerk's strategy
      const oauthResult = await startSSOFlow({
        strategy: strategy,
        fallbackRedirectUrl: 'qiimeet://oauth-callback',
        // Add additional parameters to ensure we get profile data
        additionalParameters: {
          prompt: 'consent', // Force consent screen to ensure we get profile data
        }
      });
      
      console.log('[Signup] OAuth result:', oauthResult);
      
      // Validate OAuth result
      if (!oauthResult) {
        throw new Error('OAuth result is empty or undefined');
      }
      
      // Extract the OAuth URL from the result
      let oauthUrl;
      if (typeof oauthResult === 'string') {
        oauthUrl = oauthResult;
      } else if (oauthResult && oauthResult.url) {
        oauthUrl = oauthResult.url;
      } else if (oauthResult && oauthResult.redirectUrl) {
        oauthUrl = oauthResult.redirectUrl;
      } else if (oauthResult && oauthResult.authSessionResult && oauthResult.authSessionResult.url) {
        // Handle Clerk's authSessionResult format
        oauthUrl = oauthResult.authSessionResult.url;
      } else {
        console.error('[Signup] Unexpected OAuth result format:', oauthResult);
        console.error('[Signup] OAuth result keys:', Object.keys(oauthResult || {}));
        throw new Error('Failed to generate OAuth URL - unexpected result format');
      }
      
      if (!oauthUrl) {
        throw new Error('Failed to generate OAuth URL');
      }
      
      console.log('[Signup] Extracted OAuth URL:', oauthUrl);
      console.log('[Signup] OAuth result type:', typeof oauthResult);
      console.log('[Signup] OAuth result keys:', Object.keys(oauthResult || {}));
      
      // Check if user is already signed in before opening WebView
      if (isSignedIn || clerkUser) {
        console.log('[Signup] User already signed in, skipping WebView and attempting auto-login...');
        const success = await attemptAutoLogin(provider);
        if (success) {
          return; // Auto-login succeeded and navigated
        }
      }
      
      // Store OAuth result data for callback handling
      setOauthResultData(oauthResult);
      
      // Show WebView with OAuth URL
      console.log('[Signup] Opening WebView with OAuth URL:', oauthUrl);
      setOauthProvider(provider);
      setOauthUrl(oauthUrl);
      setShowOAuthWebView(true);
      setIsOAuthInProgress(false);
      return; // Exit early, WebView will handle the rest
      
      // Simplified session handling - focus on the most reliable path
      let sessionEstablished = false;
      
      if (oauthResult?.createdSessionId) {
        try {
          await setActive({ session: oauthResult.createdSessionId });
          sessionEstablished = true;
          console.log('[Signup] Session established via createdSessionId');
        } catch (error) {
          console.error('[Signup] Failed to set active session:', error);
        }
      }
      
              // Wait for Clerk to establish the session with better polling
        if (!sessionEstablished) {
          console.log('[Signup] Waiting for Clerk session to establish...');
          
          // Poll for session establishment with exponential backoff
          let pollAttempts = 0;
          const maxPollAttempts = 5;
          
          while (!sessionEstablished && pollAttempts < maxPollAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, pollAttempts)));
            pollAttempts++;
            
            // Check if user is now signed in
            if (isSignedIn || clerkUser) {
              sessionEstablished = true;
              console.log(`[Signup] Session established via Clerk state on attempt ${pollAttempts}`);
              break;
            }
            
            console.log(`[Signup] Session not yet established, attempt ${pollAttempts}/${maxPollAttempts}`);
          }
        }
        
        // If still no session, try one more time with a longer wait
        if (!sessionEstablished) {
          console.log('[Signup] Final attempt to establish session...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          if (isSignedIn || clerkUser) {
            sessionEstablished = true;
            console.log('[Signup] Session established on final attempt');
          }
        }
      
      // Final verification and user creation
      if (sessionEstablished || isSignedIn) {
        // First, for returning users, try backend social-login immediately if no local token exists
        const localToken = await AsyncStorage.getItem('token');
        const localUserId = await AsyncStorage.getItem('userId');
        if (!localToken || !localUserId) {
          const candidateId = resolveClerkId(oauthResult);
          const signedInExisting = await handleExistingUserSignIn(clerkUser, provider, candidateId);
          if (signedInExisting) {
            setIsOAuthInProgress(false);
            return;
          }
        }
        // Use the user data that's already available from the OAuth result
        // instead of trying to fetch it again from Clerk
        let currentUser = clerkUser;
        
        // If we don't have clerkUser but we have OAuth result data, use that
        if (!currentUser && (oauthResult?.signUp || oauthResult?.signIn)) {
          // Check if this is a new user (signUp) or returning user (signIn)
          if (oauthResult.signUp && oauthResult.signUp.createdUserId) {
            // New user - use signUp data
            const signUpData = oauthResult.signUp;
            
            try {
              // Get user data from Clerk if available
              let userData;
              
              if (clerkUser) {
                // Use Clerk user data if available
                const email = clerkUser.primaryEmailAddress?.emailAddress || 
                             clerkUser.emailAddresses?.[0]?.emailAddress;
                
                if (!email) {
                  throw new Error('Email address not available from Clerk user data');
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                  throw new Error('Invalid email format received from Google account');
                }
                
                userData = {
                  clerkId: clerkUser.id,
                  email: email,
                  firstName: clerkUser.firstName || 'User',
                  lastName: clerkUser.lastName || 'Name',
                  isNewUser: true
                };
              } else {
                // Fallback to OAuth result data
                const email = signUpData.emailAddress;
                
                if (!email) {
                  throw new Error('Email address not available from OAuth flow');
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                  throw new Error('Invalid email format received from OAuth flow');
                }
                
                userData = {
                  clerkId: signUpData.createdUserId || oauthResult.createdSessionId,
                  email: email,
                  firstName: signUpData.firstName || 'User',
                  lastName: signUpData.lastName || 'Name',
                  isNewUser: true
                };
              }
              
              setIsUserCreationInProgress(true);
              
              let providerType = provider;
              if (signUpData.optionalFields && signUpData.optionalFields.includes('oauth_google')) {
                providerType = 'google';
              } else if (signUpData.optionalFields && signUpData.optionalFields.includes('oauth_facebook')) {
                providerType = 'facebook';
              } else if (signUpData.optionalFields && signUpData.optionalFields.includes('oauth_apple')) {
                providerType = 'apple';
              }
              
              const accountResult = await createUserAccount(userData, providerType);
            
              if (accountResult && accountResult.token) {
                const loginSuccess = await login(accountResult.token, accountResult.user);
                
                if (loginSuccess) {
                  // Wait for credentials to be available before proceeding
                  const creds = await waitForLocalCredentials(3000);
                  if (creds?.token && creds?.userId) {
                    // Check the backend response message to determine if user is new or existing
                    if (accountResult.message === 'User already exists' || 
                        accountResult.message === 'Existing user updated with social login') {
                      setIsSocialLoginInProgress(false);
                      setIsUserCreationInProgress(false);
                      setIsOAuthInProgress(false);
                      setIsNavigating(true);
                      navigation.navigate('MainTabs');
                    } else {
                      // This is a new user signup - set the flag and navigate to Welcome
                      await AsyncStorage.setItem('isNewSignup', 'true');
                      console.log('🔍 [Social Login] Marked as new signup');
                      
                      setIsSocialLoginInProgress(false);
                      setIsUserCreationInProgress(false);
                      
                      // Navigate immediately to Welcome screen via Onboarding stack
                      setIsNavigating(true);
                      // Add a small delay to ensure navigation context is ready
                      setTimeout(() => {
                        navigation.navigate('Onboarding', { screen: 'Welcome' });
                      }, 200);
                      
                      // Continue background processes without blocking navigation
                      
                      // Clear OAuth progress flag
                      setIsOAuthInProgress(false);
                    }
                } else {
                  setIsSocialLoginInProgress(false);
                  setIsUserCreationInProgress(false);
                  // We likely have a token in memory, try navigating anyway
                  setIsNavigating(true);
                  navigation.navigate('MainTabs');
                }
                } else {
                  setIsSocialLoginInProgress(false);
                  setIsUserCreationInProgress(false);
                  Alert.alert('Login Failed', 'Failed to complete login process. Please try again.');
                }
              } else {
                setIsSocialLoginInProgress(false);
                setIsUserCreationInProgress(false);
                Alert.alert('Account Creation Failed', 'Failed to create user account. Please try again.');
              }
            } catch (userError) {
              setIsSocialLoginInProgress(false);
              setIsUserCreationInProgress(false);
              
              let errorMessage = 'Failed to create user account. Please try again.';
              if (userError.message?.includes('Failed to create user account')) {
                errorMessage = 'Account creation failed. Please check your internet connection and try again.';
              } else if (userError.message?.includes('network')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
              } else if (userError.message?.includes('Email address not available')) {
                errorMessage = 'Unable to get email address from Google account. Please try again or use phone number signup.';
              } else if (userError.message?.includes('Invalid email format')) {
                errorMessage = 'Invalid email format received from Google account. Please try again or use phone number signup.';
              }
              
              Alert.alert('Error', errorMessage);
            }
            return; // Exit early since we handled the new user creation
          } else if (oauthResult.signIn && oauthResult.signIn.firstFactorVerification?.status === 'transferable') {
            // Returning user - handle differently
            
            try {
              // For returning users, we need to check if they exist in our system
              // and either log them in or create an account
              const signInData = result.signIn;
              
              // Try to get user data from Clerk if available
              if (clerkUser) {
                const email = clerkUser.primaryEmailAddress?.emailAddress || 
                             clerkUser.emailAddresses?.[0]?.emailAddress;
                
                if (!email) {
                  throw new Error('Email address not available from Clerk user data');
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                  throw new Error('Invalid email format received from Google account');
                }
                
                const userData = {
                  clerkId: clerkUser.id,
                  email: email,
                  firstName: clerkUser.firstName || 'User',
                  lastName: clerkUser.lastName || 'Name',
                  isNewUser: false
                };
                
                let providerType = provider;
                if (clerkUser.externalAccounts && clerkUser.externalAccounts.length > 0) {
                  const externalAccount = clerkUser.externalAccounts[0];
                  providerType = externalAccount.provider || provider;
                }
                
                const accountResult = await createUserAccount(userData, providerType);
                
                if (accountResult && accountResult.token) {
                  const loginSuccess = await login(accountResult.token, accountResult.user);
                  
                  if (loginSuccess) {
                  setIsSocialLoginInProgress(false);
                  setIsNavigating(true);
                  navigation.navigate('MainTabs');
                  } else {
                    setIsSocialLoginInProgress(false);
                    Alert.alert('Login Failed', 'Failed to complete login process. Please try again.');
                  }
                } else {
                  setIsSocialLoginInProgress(false);
                  Alert.alert('Account Error', 'Failed to process returning user account. Please try again.');
                }
              } else {
                // No clerkUser available, but we have transferable verification
                // This means the user is authenticated but we need to wait for Clerk to provide user data
                
                // Wait a bit more for Clerk to provide user data
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                if (clerkUser) {
                  // Retry the above logic
                  // This will be handled in the next iteration
                } else {
                  setIsSocialLoginInProgress(false);
                  Alert.alert('Authentication Error', 'Unable to retrieve user information. Please try again.');
                }
              }
            } catch (userError) {
              setIsSocialLoginInProgress(false);
              
              let errorMessage = 'Failed to process returning user. Please try again.';
              if (userError.message?.includes('Email address not available')) {
                errorMessage = 'Unable to get email address from Google account. Please try again or use phone number signup.';
              } else if (userError.message?.includes('Invalid email format')) {
                errorMessage = 'Invalid email format received from Google account. Please try again or use phone number signup.';
              }
              
              Alert.alert('Error', errorMessage);
            }
            return; // Exit early since we handled the returning user
          }
        }
        
        // Fallback to the original Clerk user approach if OAuth data isn't available
        if (!currentUser) {
          // Wait a moment for the session to be fully established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to get user data with retries
          let retryCount = 0;
          const maxRetries = 3;
          
          while (!currentUser && retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            currentUser = clerkUser;
            retryCount++;
          }
        }
        
        if (currentUser) {
          try {
            const email = currentUser.primaryEmailAddress?.emailAddress || 
                         currentUser.emailAddresses?.[0]?.emailAddress;
            
            if (!email) {
              throw new Error('Email address not available from Clerk user data');
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              throw new Error('Invalid email format received from Google account');
            }
            
            const userData = {
              clerkId: currentUser.id,
              email: email,
              firstName: currentUser.firstName || 'User',
              lastName: currentUser.lastName || 'Name',
              isNewUser: true
            };
            
            setIsUserCreationInProgress(true);
            
            let providerType = provider;
            if (currentUser.externalAccounts && currentUser.externalAccounts.length > 0) {
              const externalAccount = currentUser.externalAccounts[0];
              providerType = externalAccount.provider || provider;
            }
            
            const accountResult = await createUserAccount(userData, providerType);
            
            if (accountResult && accountResult.token) {
              const loginSuccess = await login(accountResult.token, accountResult.user);
              
              if (loginSuccess) {
                // Wait for credentials to be available before proceeding
                const creds = await waitForLocalCredentials(3000);
                if (creds?.token && creds?.userId) {
                  // Check the backend response message to determine if user is new or existing
                  if (accountResult.message === 'User already exists' || 
                      accountResult.message === 'Existing user updated with social login') {
                    setIsSocialLoginInProgress(false);
                    setIsUserCreationInProgress(false);
                    setIsNavigating(true);
                    navigation.navigate('MainTabs');
                  } else {
                    setIsSocialLoginInProgress(false);
                    setIsUserCreationInProgress(false);
                    
                    // Navigate immediately to Welcome screen
                    setIsNavigating(true);
                    navigation.navigate('Welcome');
                    
                    // Continue background processes without blocking navigation
                  }
                } else {
                  console.warn('[Signup] Credentials not available after user creation, proceeding anyway...');
                  // Navigate based on response message
                  if (accountResult.message === 'User already exists' || 
                      accountResult.message === 'Existing user updated with social login') {
                    setIsSocialLoginInProgress(false);
                    setIsUserCreationInProgress(false);
                    setIsNavigating(true);
                    navigation.navigate('MainTabs');
                  } else {
                    setIsSocialLoginInProgress(false);
                    setIsUserCreationInProgress(false);
                    setIsNavigating(true);
                    navigation.navigate('Welcome');
                  }
                }
              } else {
                setIsSocialLoginInProgress(false);
                setIsUserCreationInProgress(false);
                Alert.alert('Login Failed', 'Failed to complete login process. Please try again.');
              }
            } else {
              setIsSocialLoginInProgress(false);
              setIsUserCreationInProgress(false);
              Alert.alert('Account Creation Failed', 'Failed to create user account. Please try again.');
            }
          } catch (userError) {
            setIsSocialLoginInProgress(false);
            setIsUserCreationInProgress(false);
            
            let errorMessage = 'Failed to create user account. Please try again.';
            if (userError.message?.includes('Failed to create user account')) {
              errorMessage = 'Account creation failed. Please check your internet connection and try again.';
            } else if (userError.message?.includes('network')) {
              errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (userError.message?.includes('Email address not available')) {
              errorMessage = 'Unable to get email address from Google account. Please try again or use phone number signup.';
            } else if (userError.message?.includes('Invalid email format')) {
              errorMessage = 'Invalid email format received from Google account. Please try again or use phone number signup.';
            }
            
            Alert.alert('Error', errorMessage);
          }
        } else {
          setIsSocialLoginInProgress(false);
          // Before erroring, check if local credentials appeared shortly after
          const creds = await waitForLocalCredentials(2000);
          if (creds?.token && creds?.userId) {
            setIsSocialLoginInProgress(false);
            setIsNavigating(true);
            navigation.navigate('MainTabs');
          } else {
            Alert.alert('Authentication Error', 'Failed to retrieve user information. Please try again.');
          }
        }
      } else {
        console.error('Failed to establish session after all strategies');
        setIsSocialLoginInProgress(false);
        Alert.alert(
          'Authentication Failed', 
          'Unable to complete authentication. Please check your internet connection and try again.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                console.log('User chose to try again');
                // Reset state and allow retry
                setIsSocialLoginInProgress(false);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                console.log('User cancelled authentication');
                setIsSocialLoginInProgress(false);
              }
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Enhanced social login error:', error);
      setIsSocialLoginInProgress(false);
      setIsOAuthInProgress(false);
      
      // Provide more specific error messages based on the error
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.message?.includes('cancelled') || error.message?.includes('user_cancelled')) {
        return; // Don't show error for user cancellation
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('redirect')) {
        errorMessage = 'Authentication redirect failed. This may be a device-specific issue. Please try again or use phone number signup.';
      } else if (error.message?.includes('browser')) {
        errorMessage = 'Browser authentication failed. Please ensure you have a web browser installed and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Authentication timed out. Please try again.';
      } else if (error.message?.includes('All OAuth redirect URLs failed')) {
        errorMessage = 'Authentication failed on all available methods. Please try again or use phone number signup.';
      }
      
      Alert.alert('Authentication Error', errorMessage);
    }
  };

  const [loadingMessage, setLoadingMessage] = useState('Fetching your data...');

  // Update loading message based on OAuth progress
  useEffect(() => {
    if (shouldShowBlockingLoader) {
      if (isNavigating) {
        setLoadingMessage('Finalizing sign-in...');
      } else if (isCheckingCredentials || isAutoLoginInProgress) {
        setLoadingMessage('Fetching your data...');
      } else if (isOAuthInProgress) {
      if (showOAuthWebView) {
        setLoadingMessage('Connecting to Google...');
      } else if (oauthResultData) {
        setLoadingMessage('Setting up your account...');
      } else {
        setLoadingMessage('Fetching your data...');
      }
      }
    }
  }, [shouldShowBlockingLoader, isOAuthInProgress, showOAuthWebView, oauthResultData, isNavigating, isCheckingCredentials, isAutoLoginInProgress]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <TouchableOpacity style={styles.closeButton} onPress={() => {
          // Prevent going back if critical flows are in progress
          if (shouldShowBlockingLoader) {
            Alert.alert('Please Wait', 'Please wait while we set up your account. You cannot go back during this process.');
            return;
          }
          navigation.goBack();
        }}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
        <View style={styles.content}>
          {shouldShowBlockingLoader && (
            <View style={styles.fullScreenLoading}>
              <ActivityIndicator size="large" color="#ec066a" />
              <Text style={styles.fullScreenLoadingText}>{loadingMessage}</Text>
            </View>
          )}
          <Text style={TEXT_STYLES.header}>What's your phone number?</Text>
          <View style={[styles.inputContainer, error && styles.inputContainerError]}>
            <View style={styles.countryCodeContainer}>
              <Image 
                source={require('../../../assets/nig.png')} 
                style={{ width: 21, height: 20}} 
              />
              <Text style={styles.countryCodeText}>+234</Text>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="phone-pad"
              value={formattedNumber}
              onChangeText={handlePhoneChange}
              maxLength={12}
            />
          </View>
          {error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconContainer}>
                <Text style={styles.errorIcon}>!</Text>
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <Text style={TEXT_STYLES.explanation}>
            Ensure you have access to the number on WhatsApp as we will send a verification code there.
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color="#ec066a" style={{ marginTop: 22 }} />
          ) : (
            <CustomButton 
              title="Next"
              onPress={handleNext}
              disabled={phoneNumber.length < 10}
              style={{ marginTop: 22 }}
            />
          )}
          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={TEXT_STYLES.dividerText}>or sign in with</Text>
            <View style={styles.orLine} />
          </View>
          <View style={styles.socialIconsContainer}>
            {shouldShowBlockingLoader && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#ec066a" />
                <Text style={styles.loadingText}>{loadingMessage}</Text>
              </View>
            )}
            <TouchableOpacity 
              style={[styles.socialButton, isOAuthInProgress && styles.socialButtonDisabled]}
              onPress={() => handleSocialLogin('google')}
              disabled={isOAuthInProgress}
            >
              <View style={styles.socialIconCircle}>
                <Image 
                  source={googleIcon} 
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialButton, isOAuthInProgress && styles.socialButtonDisabled]}
              onPress={() => handleSocialLogin('apple')}
              disabled={isOAuthInProgress}
            >
              <View style={styles.socialIconCircle}>
                <Image 
                  source={appleIcon} 
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialButton, isOAuthInProgress && styles.socialButtonDisabled]}
              onPress={() => handleSocialLogin('facebook')}
              disabled={isOAuthInProgress}
            >
              <View style={styles.socialIconCircle}>
                <Image 
                  source={fbIcon} 
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Removed cleanup button for authentication issues */}
          
        </View>
      </KeyboardAvoidingView>
      
      {/* OAuth WebView Modal */}
      <Modal visible={showOAuthWebView} animationType="slide">
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.modalClose} 
            onPress={() => {
              cleanupOAuthState();
            }}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            Sign in with {oauthProvider === 'google' ? 'Google' : 'Facebook'}
          </Text>
        </View>
        
        {oauthUrl && (
          <WebView 
            source={{ uri: oauthUrl }} 
            key={`oauth-webview-${oauthProvider}-${Date.now()}`}
            onMessage={(event) => {
              // WebView message received
            }}
            onNavigationStateChange={(navState) => {
              // Check for OAuth callbacks
              if (navState.url.includes('oauth-callback') || navState.url.includes('sso-callback')) {
                // Close WebView immediately and trigger refresh
                setShowOAuthWebView(false);
                setOauthUrl(null);
                setOauthProvider(null);
                
                // Trigger immediate refresh before processing callback
                immediateRefreshUserData().then(() => {
                  // Process the callback after refresh
                  handleOAuthCallback(navState.url, oauthResultData);
                });
              }
            }}
            onShouldStartLoadWithRequest={(request) => {
              console.log('🔗 OAuth WebView request:', request.url);
              
              // Handle OAuth callback redirects (including sso-callback)
              if (request.url.includes('oauth-callback') || request.url.includes('sso-callback')) {
                console.log('🎯 OAuth callback detected in WebView onShouldStartLoadWithRequest, processing...');
                
                // Close WebView immediately
                setShowOAuthWebView(false);
                setOauthUrl(null);
                setOauthProvider(null);
                
                // Trigger immediate refresh before processing callback
                immediateRefreshUserData().then(() => {
                  // Process the OAuth callback after refresh
                  handleOAuthCallback(request.url, oauthResultData);
                });
                return false; // Don't load in WebView
              }
              
              // Handle deep links
              if (request.url.startsWith('qiimeet://')) {
                console.log('🎯 Deep link detected in WebView, opening with Linking:', request.url);
                Linking.openURL(request.url);
                return false; // Don't load in WebView
              }
              
              // Handle navigation errors and invalid URLs
              if (request.url === 'about:blank' || request.url === 'data:' || !request.url.startsWith('http')) {
                console.log('🔗 Blocking invalid URL:', request.url);
                return false;
              }
              
              return true; // Load in WebView
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('OAuth WebView error:', nativeEvent);
              
              // Don't show error for navigation errors that don't affect functionality
              if (nativeEvent.code === -10 || nativeEvent.code === -6) {
                console.log('🔗 WebView navigation error (non-critical):', nativeEvent.code);
                return;
              }
              
              showOAuthError(
                'OAuth Page Load Failed',
                'We were unable to load the Google sign-in page. Please try again.',
                oauthProvider
              );
              cleanupOAuthState();
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('OAuth WebView HTTP error:', nativeEvent);
              
              // Only show error for actual HTTP errors, not navigation issues
              if (nativeEvent.statusCode >= 400) {
                showOAuthError(
                  'Connection Error',
                  'We were unable to connect to Google\'s authentication service. Please try again.',
                  oauthProvider
                );
                cleanupOAuthState();
              }
            }}
            onLoadEnd={() => {
              console.log('🔗 OAuth WebView finished loading URL:', oauthUrl);
            }}
            onLoadStart={() => {
              console.log('🔗 OAuth WebView started loading URL:', oauthUrl);
              console.log('🔗 WebView source:', { uri: oauthUrl });
            }}
            onLoadProgress={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              if (nativeEvent.progress < 1) {
                console.log('🔗 WebView loading progress:', Math.round(nativeEvent.progress * 100) + '%');
              }
            }}
            style={{ flex: 1 }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#EC066A" />
                <Text style={styles.webViewLoadingText}>Loading...</Text>
              </View>
            )}
            // Add these props to prevent WebView errors
            allowsBackForwardNavigationGestures={false}
            allowsLinkPreview={false}
            incognito={true}
            // Better error handling
            onContentProcessDidTerminate={() => {
              console.log('🔗 WebView content process terminated, reloading...');
              // Don't show error, just log it
            }}
          />
        )}
      </Modal>
      
      {/* OAuth Error Modal */}
      <OAuthErrorModal
        visible={showOAuthErrorModal}
        title={oauthErrorDetails.title}
        subtitle={oauthErrorDetails.subtitle}
        buttonText="Try Again"
        onRetry={retryOAuth}
        onClose={hideOAuthError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
    backgroundColor: '#121212',
  },
  keyboardView: {
    flex: 1,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 18,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.06,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 90,
    marginBottom: 12,
    width: '100%',
    height: height * 0.074,
    paddingHorizontal: 24, 
    alignItems: 'center',
  },
  inputContainerError: {
    borderColor: '#EC066A',
    borderWidth: 1,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  countryCodeText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.5,
    marginLeft: 5,
  },
  divider: {
    width: 1,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    opacity: 0.5,
    height: 20,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16, 
    fontFamily: FONTS.regular,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  errorIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EC066A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  errorIcon: {
    color: '#121212',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: '#EC066A',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 5,
    marginVertical: 4,
    marginTop: 5,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#fff',
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    width: '100%',
    marginTop: 20,
  },
  socialButton: {
    padding: 4,
    width: 40,
    height: 40,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  socialIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 25,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
    fontFamily: FONTS.regular,
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  fullScreenLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  fullScreenLoadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  cleanupButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#EC066A',
    borderRadius: 8,
    alignSelf: 'center',
  },
  cleanupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  // WebView Modal Styles
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalClose: {
    padding: 10,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    flex: 1,
    textAlign: 'center',
    marginRight: 44, // Compensate for close button width
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewLoadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    fontFamily: FONTS.regular,
  },
});

export default PhoneNumberScreen;