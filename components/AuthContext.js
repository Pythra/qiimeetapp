import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../env';
import SocketManager from '../utils/socket';
import EventEmitter from '../utils/eventEmitter';

import { clearAllCachedData } from '../utils/clearCache';
import { getImageSource, getProfileImageSource, getCloudFrontUrl } from '../utils/imageUtils';

import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, preloadedData }) => {
  const [user, setUser] = useState(preloadedData?.profile || null);
  const [token, setToken] = useState(preloadedData?.token || null);
  const [balance, setBalance] = useState(preloadedData?.balance || 0);
  const [users, setUsers] = useState(preloadedData?.users || []);
  const [allUsers, setAllUsers] = useState(preloadedData?.allUsers || []);
  const [messageCache, setMessageCache] = useState({}); // Cache for chat messages
  const [connectionCache, setConnectionCache] = useState({}); // Cache for connection data
  const [lastMessageCache, setLastMessageCache] = useState({}); // Cache for last messages
  const [loading, setLoading] = useState(!preloadedData);
  const [initialized, setInitialized] = useState(!!preloadedData);
  const [dataReady, setDataReady] = useState(!!preloadedData); // New state to track when all data is ready

  // Get Clerk auth context for session management
  const clerkAuth = useClerkAuth();

  // Initialize auth state if no preloaded data
  useEffect(() => {
    if (preloadedData) {
      // Validate preloaded data
      if (preloadedData.profile && preloadedData.profile._id && preloadedData.token) {
        setInitialized(true);
        setLoading(false);
        setDataReady(true); // Mark data as ready when preloaded
        // Don't hide splash here - let App.js control it when fully ready
        return;
      } else {
        console.warn('Invalid preloaded data, falling back to normal initialization');
        // Fall through to normal initialization
      }
    }

    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUserId = await AsyncStorage.getItem('userId');
        
        console.log('[AuthContext] Initializing auth with stored data:', { 
          hasStoredToken: !!storedToken, 
          hasStoredUserId: !!storedUserId 
        });
        
        setToken(storedToken);
        
        if (storedToken && storedUserId) {
          console.log('[AuthContext] Found stored credentials, fetching user data...');

          // Fetch user profile, balance, and all users in parallel
          try {
            const [userResponse, balanceResponse, usersResponse] = await Promise.all([
              axios.get(`${API_BASE_URL}/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${storedToken}`,
                  'Content-Type': 'application/json'
                }
              }).catch(error => {
                console.error('User profile fetch failed:', error.response?.status, error.message);
                throw error;
              }),
              axios.get(`${API_BASE_URL}/transaction/balance/current`, {
                headers: {
                  'Authorization': `Bearer ${storedToken}`,
                  'Content-Type': 'application/json'
                }
              }).catch(error => {
                console.warn('Balance fetch failed:', error.response?.status, error.message);
                return { data: { balance: 0 } }; // Return default balance on error
              }),
              fetch(`${API_BASE_URL}/admin/users/home`).then(res => res.json()).catch(() => ({ success: false, users: [] }))
            ]);
            
            if (userResponse.data) {
              console.log('[AuthContext] User data loaded successfully');
              setUser(userResponse.data);
              // Store userId in AsyncStorage for socket connections and event handling
              if (userResponse.data._id) {
                await AsyncStorage.setItem('userId', userResponse.data._id);
              }
            } else {
              throw new Error('No user data received');
            }
            
            if (balanceResponse.data) {
              setBalance(balanceResponse.data.balance || 0);
            }
            
            if (usersResponse.success && usersResponse.users) {
              setUsers(usersResponse.users);
              setAllUsers(usersResponse.users);
            }
            
            setInitialized(true);
            setLoading(false);
            setDataReady(true); // Mark data as ready after successful fetch
          } catch (error) {
            console.error('Error fetching initial data:', error);
            setInitialized(true);
            setLoading(false);
            setDataReady(false); // Mark data as not ready on error
          }
        } else {
          setInitialized(true);
          setLoading(false);
          setDataReady(false); // No token means no data
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        setInitialized(true);
        setLoading(false);
        setDataReady(false); // Mark data as not ready on error
      }
    };

    initializeAuth();
  }, [preloadedData]);

  // Monitor for cases where dataReady is true but actual data is missing
  useEffect(() => {
    if (dataReady && !token && !user && initialized && !loading) {
      console.log('[AuthContext] Detected dataReady=true but missing token/user, attempting to restore...');
      
      const restoreAuthState = async () => {
        try {
          const [storedToken, storedUserId] = await AsyncStorage.multiGet(['token', 'userId']);
          const hasStoredCredentials = storedToken[1] && storedUserId[1];
          
          if (hasStoredCredentials) {
            console.log('[AuthContext] Found stored credentials, restoring auth state...');
            setToken(storedToken[1]);
            // Force a refresh to load the user data
            await refreshAllData();
          } else {
            console.log('[AuthContext] No stored credentials found, setting dataReady to false');
            setDataReady(false);
          }
        } catch (error) {
          console.error('[AuthContext] Error restoring auth state:', error);
          setDataReady(false);
        }
      };
      
      restoreAuthState();
    }
  }, [dataReady, token, user, initialized, loading, refreshAllData]);

  // Additional check: if we have a token but no user, try to load user data
  useEffect(() => {
    if (token && !user && !loading && initialized) {
      console.log('[AuthContext] Detected token but no user, attempting to load user data...');
      refreshAllData();
    }
  }, [token, user, loading, initialized, refreshAllData]);

  // Login function
  const login = async (authToken, userData) => {
    try {
      setLoading(true);

      // Store token
      await AsyncStorage.setItem('token', authToken);
      setToken(authToken);

      // Set user data
      if (userData) {
        setUser(userData);
        if (userData._id) {
          await AsyncStorage.setItem('userId', userData._id);
        }
      }

      // Mark app ready immediately and perform data fetches in background
      setInitialized(true);
      setDataReady(true);
      setLoading(false);

      // Fire-and-forget: fetch additional data without blocking navigation
      (async () => {
        try {
          const [balanceResponse, usersResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/transaction/balance/current`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            }).catch(() => ({ data: { balance: 0 } })),
            fetch(`${API_BASE_URL}/admin/users/home`).then(res => res.json()).catch(() => ({ success: false, users: [] }))
          ]);

          if (balanceResponse.data) {
            setBalance(balanceResponse.data.balance || 0);
          }

          if (usersResponse.success && usersResponse.users) {
            setUsers(usersResponse.users);
            setAllUsers(usersResponse.users);
          }
        } catch (error) {
          console.warn('Error fetching additional data during login (background):', error);
        }
      })();

      return true;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false); // Ensure loading is set to false on error
      return false;
    }
  };

  // Helper function to clear Clerk token cache
  const clearClerkTokenCache = async () => {
    try {
      // Clear Clerk's secure token storage
      const clerkKeys = [
        'clerk-db',
        'clerk-session',
        'clerk-token',
        'clerk-user',
        'clerk-oauth',
        'clerk-google',
        'clerk-facebook',
        'clerk-apple'
      ];
      
      for (const key of clerkKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          // Ignore errors for individual keys
        }
      }
      
      // Also try to clear any Clerk-related AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      const clerkRelatedKeys = allKeys.filter(key => 
        key.toLowerCase().includes('clerk') || 
        key.toLowerCase().includes('oauth') || 
        key.toLowerCase().includes('google') || 
        key.toLowerCase().includes('facebook') ||
        key.toLowerCase().includes('apple') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('session')
      );
      
      if (clerkRelatedKeys.length > 0) {
        await AsyncStorage.multiRemove(clerkRelatedKeys);
      }
    } catch (error) {
      // Error clearing Clerk token cache
    }
  };

  // Helper function to force refresh Clerk auth state
  const forceRefreshClerkState = async () => {
    try {
      // Force a refresh of the Clerk authentication state
      if (clerkAuth.reload) {
        await clerkAuth.reload();
      }
      
      // Wait a bit more to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      // Error refreshing Clerk state
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear Clerk token cache first
      await clearClerkTokenCache();
      
      // Sign out from Clerk first with more thorough cleanup
      if (clerkAuth.isSignedIn) {
        try {
          // Try to sign out from all sessions
          if (clerkAuth.signOutAll) {
            await clerkAuth.signOutAll();
          } else {
            await clerkAuth.signOut();
          }
          
          // Add a longer delay to ensure Clerk state is properly updated
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (clerkError) {
          // Clerk signOut error (continuing with cleanup)
        }
      }
      
      // Force refresh Clerk auth state to ensure it's properly cleared
      await forceRefreshClerkState();
      
      // Clear all stored data including Clerk-related data
      try {
        // Clear AsyncStorage data
        await AsyncStorage.multiRemove(['token', 'userId']);
        
        // Clear all AsyncStorage data to ensure no OAuth tokens persist
        const allKeys = await AsyncStorage.getAllKeys();
        const clerkRelatedKeys = allKeys.filter(key => 
          key.includes('clerk') || 
          key.includes('oauth') || 
          key.includes('google') || 
          key.includes('facebook') ||
          key.includes('apple') ||
          key.includes('token') ||
          key.includes('session')
        );
        
        if (clerkRelatedKeys.length > 0) {
          await AsyncStorage.multiRemove(clerkRelatedKeys);
        }
        
        // Also clear all AsyncStorage as a fallback
        await AsyncStorage.clear();
      } catch (storageError) {
        // AsyncStorage clear error (continuing)
      }
      
      // Clear all state
      setToken(null);
      setUser(null);
      setBalance(0);
      setUsers([]);
      setAllUsers([]);
      setMessageCache({});
      setConnectionCache({});
      setLastMessageCache({});
      
      // Disconnect socket
      SocketManager.disconnect();
      
      // Reset initialization state
      setInitialized(false);
      setLoading(false);

    } catch (error) {
      // Even if there's an error, try to clear local state
      try {
        await AsyncStorage.clear();
        setToken(null);
        setUser(null);
        setInitialized(false);
        setLoading(false);
      } catch (clearError) {
        // Error clearing local state
      }
    }
  };

  // Update user function
  const updateUser = (newUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...newUserData
    }));
  };

  // Update balance function
  const updateBalance = (newBalance) => {
    setBalance(newBalance);
  };

  // Update users function
  const updateUsers = (newUsers) => {
    setUsers(newUsers);
  };

  // Update all users function
  const updateAllUsers = (newAllUsers) => {
    setAllUsers(newAllUsers);
  };

  // Message cache management functions
  const updateMessageCache = (chatId, messages) => {
    setMessageCache(prev => ({
      ...prev,
      [chatId]: messages
    }));
  };

  const getMessageCache = (chatId) => {
    return messageCache[chatId] || [];
  };

  const addMessageToCache = (chatId, message) => {
    setMessageCache(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
  };

  const clearMessageCache = (chatId) => {
    if (chatId) {
      setMessageCache(prev => {
        const newCache = { ...prev };
        delete newCache[chatId];
        return newCache;
      });
    } else {
      setMessageCache({});
    }
  };

  // Connection cache functions
  const updateConnectionCache = (userId, connectionData) => {
    setConnectionCache(prev => ({
      ...prev,
      [userId]: connectionData
    }));
  };

  const getConnectionCache = (userId) => {
    return connectionCache[userId] || null;
  };

  const addConnectionToCache = (userId, connectionData) => {
    setConnectionCache(prev => ({
      ...prev,
      [userId]: connectionData
    }));
  };

  const clearConnectionCache = (userId) => {
    if (userId) {
      setConnectionCache(prev => {
        const newCache = { ...prev };
        delete newCache[userId];
        return newCache;
      });
    } else {
      setConnectionCache({});
    }
  };

  // Last message cache functions
  const updateLastMessageCache = (chatId, lastMessage) => {
    setLastMessageCache(prev => ({
      ...prev,
      [chatId]: lastMessage
    }));
  };

  const getLastMessageCache = (chatId) => {
    return lastMessageCache[chatId] || null;
  };

  const addLastMessageToCache = (chatId, lastMessage) => {
    setLastMessageCache(prev => ({
      ...prev,
      [chatId]: lastMessage
    }));
    // Also update the user's connections to reflect new message
    if (lastMessage && user) {
      setUser(prevUser => ({
        ...prevUser,
        lastMessage: lastMessage
      }));
    }
  };

  const clearLastMessageCache = (chatId) => {
    if (chatId) {
      setLastMessageCache(prev => {
        const newCache = { ...prev };
        delete newCache[chatId];
        return newCache;
      });
    } else {
      setLastMessageCache({});
    }
  };

  const refreshBalance = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/transaction/balance/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setBalance(response.data.balance || 0);
    } catch (error) {
      // Failed to refresh balance
    }
  };

  const refreshUser = async () => {
    if (!token) {
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
              if (response.data) {
          setUser(response.data);
        // Store userId in AsyncStorage for socket connections and event handling
        if (response.data._id) {
          await AsyncStorage.setItem('userId', response.data._id);
        }
      } else {
        // No user data in refresh response
      }
    } catch (error) {
      // If it's a 401 error, the token is invalid
      if (error.response?.status === 401) {

        await AsyncStorage.multiRemove(['token', 'userId']);
        setToken(null);
        setUser(null);
      }
    }
  };

  const refreshAllData = useCallback(async () => {
    if (!token) {
      console.log('[AuthContext] refreshAllData: No token available, checking AsyncStorage...');
      // Check if we have a stored token
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          console.log('[AuthContext] refreshAllData: Found stored token, updating state...');
          setToken(storedToken);
          // Continue with the refresh using the stored token
        } else {
          console.log('[AuthContext] refreshAllData: No stored token found');
          return;
        }
      } catch (error) {
        console.error('[AuthContext] refreshAllData: Error checking stored token:', error);
        return;
      }
    }

    try {
      console.log('[AuthContext] refreshAllData: Starting data refresh...');
      // Set loading state while refreshing
      setLoading(true);
      
      // Use the current token (either from state or just retrieved from storage)
      const currentToken = token || await AsyncStorage.getItem('token');
      if (!currentToken) {
        console.error('[AuthContext] refreshAllData: No token available for refresh');
        setLoading(false);
        return;
      }
      
      // Fetch user profile, balance, and all users in parallel
      const [userResponse, balanceResponse, usersResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          }
        }),
        axios.get(`${API_BASE_URL}/transaction/balance/current`, {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/admin/users/home`, {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        }).then(res => res.json())
      ]);

      if (userResponse.data) {
        console.log('[AuthContext] refreshAllData: User data updated');
        setUser(userResponse.data);
        // Store userId in AsyncStorage for socket connections and event handling
        if (userResponse.data._id) {
          await AsyncStorage.setItem('userId', userResponse.data._id);
        }
      }
      
      if (balanceResponse.data) {
        console.log('[AuthContext] refreshAllData: Balance data updated');
        setBalance(balanceResponse.data.balance || 0);
      }
      
      if (usersResponse.success && usersResponse.users) {
        console.log('[AuthContext] refreshAllData: Users data updated');
        setUsers(usersResponse.users);
        setAllUsers(usersResponse.users);
      }
      
      console.log('[AuthContext] refreshAllData: All data refreshed successfully');
      setDataReady(true); // Mark data as ready after successful refresh
    } catch (error) {
      console.error('[AuthContext] Error refreshing all data:', error);
      setDataReady(false); // Mark data as not ready on error
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Force refresh auth state - useful after onboarding completion
  const forceRefreshAuthState = useCallback(async () => {
    try {
      console.log('[AuthContext] forceRefreshAuthState: Starting forced auth state refresh...');
      
      // Check AsyncStorage for credentials
      const [storedToken, storedUserId] = await AsyncStorage.multiGet(['token', 'userId']);
      const hasStoredCredentials = storedToken[1] && storedUserId[1];
      
      if (!hasStoredCredentials) {
        console.log('[AuthContext] forceRefreshAuthState: No stored credentials found');
        setDataReady(false);
        setInitialized(true);
        setLoading(false);
        return;
      }
      
      console.log('[AuthContext] forceRefreshAuthState: Found stored credentials, refreshing...');
      
      // Update token state if needed
      if (!token && storedToken[1]) {
        setToken(storedToken[1]);
      }
      
      // Set initialized to true if not already set
      if (!initialized) {
        setInitialized(true);
      }
      
      // Force a data refresh
      await refreshAllData();
      
      // Ensure dataReady is set to true after successful refresh
      setDataReady(true);
      setLoading(false);
      
      console.log('[AuthContext] forceRefreshAuthState: Auth state refresh completed successfully');
      
    } catch (error) {
      console.error('[AuthContext] forceRefreshAuthState: Error during forced refresh:', error);
      setDataReady(false);
      setLoading(false);
    }
  }, [token, refreshAllData, initialized]);

  // Setup real-time socket listeners for user data updates
  useEffect(() => {
    if (!user?._id) return;

    const setupSocketListeners = async () => {
      try {
        await SocketManager.connect();

        
        // Add logic to the general event listener for connection events
        SocketManager.socket?.onAny((eventName, ...args) => {

          
          // Handle connection_canceled events
          if (eventName === 'connection_canceled' && args.length > 0) {
            const data = args[0];

            // Immediately refresh from database
            refreshUser();
          }
          
          // Handle connection_accepted events
          if (eventName === 'connection_accepted' && args.length > 0) {
            const data = args[0];

            // Immediately refresh from database
            refreshUser();
            
            // Emit the event to App.js to show the popup
            EventEmitter.emit('connection_accepted', data);
          }
        });
        
        // Test socket connection
        SocketManager.socket?.on('connect', () => {
          // Socket connected successfully
        });
        
        SocketManager.socket?.on('disconnect', () => {
          // Socket disconnected
        });
        
        // Listen for like updates
        SocketManager.socket?.on('like_update', (data) => {
          // Refresh user data to get updated likes
          refreshUser();
        });
        
        // Listen for connection request updates
        SocketManager.socket?.on('connection_request_update', (data) => {
          // Refresh user data to get updated requests
          refreshUser();
        });
        
        // Listen for connection acceptance
        SocketManager.socket?.on('connection_accepted', (data) => {
          // Immediately refresh from database to ensure we get the latest state
          refreshUser();
          
          // Also update local state immediately for instant UI update
          if (data.accepterId && user) {
            setUser(prevUser => {
              const newConnections = [...(prevUser.connections || []), data.accepterId];
              return {
                ...prevUser,
                connections: newConnections
              };
            });
            
            // Add to connection cache for instant access
            if (data.accepterId && allUsers.length > 0) {
              const newConnection = allUsers.find(u => u._id === data.accepterId);
              if (newConnection) {
                addConnectionToCache(data.accepterId, newConnection);
              }
            }
          }
        });
        
        // Listen for connection cancellation
        SocketManager.socket?.on('connection_canceled', (data) => {
          // Immediately refresh from database to ensure we get the latest state
          refreshUser();
          
          // Also update local state immediately
          const canceledUserId = data.targetId || data.cancelerId;
          
          if (user && canceledUserId) {
            setUser(prevUser => {
              const filteredConnections = prevUser.connections?.filter(id => id !== canceledUserId) || [];
              return {
                ...prevUser,
                connections: filteredConnections
              };
            });
            
            // Clear connection cache for this user
            clearConnectionCache(canceledUserId);
          }
        });
        
        // Listen for connection blocking
        SocketManager.socket?.on('connection_blocked', (data) => {
          // Refresh user data when connection is blocked
          refreshUser();
        });
        
        // Listen for new messages to update last message cache
        SocketManager.socket?.on('new_message', (data) => {
          if (data.chatId && data.message) {
            // Update last message cache
            addLastMessageToCache(data.chatId, data.message);
            
            // Add message to message cache
            addMessageToCache(data.chatId, data.message);
          }
        });
        
      } catch (error) {
        // Error setting up socket listeners in AuthContext
      }
    };
    
    if (user?._id) {
      // Set userId in SocketManager
      SocketManager.setUserId(user._id);
      setupSocketListeners();
    }
    
    // Cleanup socket listeners
    return () => {
      SocketManager.socket?.off('like_update');
      SocketManager.socket?.off('connection_request_update');
      SocketManager.onConnectionAccepted(() => {});
      SocketManager.socket?.off('connection_accepted');
      SocketManager.socket?.off('connection_canceled');
      SocketManager.socket?.off('connection_blocked');
      SocketManager.socket?.off('new_message');
    };
  }, [user?._id]);

  const value = {
    user,
    token,
    balance,
    users,
    allUsers,
    loading,
    initialized,
    dataReady, // Add dataReady to context
    login,
    logout,
    updateUser,
    updateBalance,
    updateUsers,
    updateAllUsers,
    refreshBalance,
    refreshUser,
    refreshAllData,
    forceRefreshAuthState,
    isAuthenticated: !!token && !!user,
    // Image utility functions
    getImageSource,
    getProfileImageSource,
    getCloudFrontUrl,
    // Message cache functions
    messageCache,
    updateMessageCache,
    getMessageCache,
    addMessageToCache,
    clearMessageCache,
    // Connection and last message cache functions
    connectionCache,
    lastMessageCache,
    updateConnectionCache,
    updateLastMessageCache,
    getConnectionCache,
    getLastMessageCache,
    addConnectionToCache,
    addLastMessageToCache,
    clearConnectionCache,
    clearLastMessageCache,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};