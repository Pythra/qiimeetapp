import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Alert, Platform, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DUMMY_PROFILES } from '../../constants/dummyData';
import SocketManager from '../../utils/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';
import OnlineStatusService from '../../utils/onlineStatusService';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../components/AuthContext';
import ConnectionPolicyModal from '../Likes/ConnectionPolicyModal';
import ConnectionLimitModal from '../Likes/ConnectionLimitModal';


 
export default function ChatScreen({ navigation, route }) {
  const { user: currentUser, allUsers, updateUser, getProfileImageSource, getImageSource, dataReady, loading, initialized: authInitialized, refreshUser } = useAuth();
  const [olderVisible, setOlderVisible] = useState(true);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [connections, setConnections] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [chatIdMap, setChatIdMap] = useState({});
  const [pastConnections, setPastConnections] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  const [unreadCounts, setUnreadCounts] = useState({});
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [profileModalType, setProfileModalType] = useState('past'); // 'past' or 'active'
  const [onlineStatusRefresh, setOnlineStatusRefresh] = useState(0);

  // Connection modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Process user data when currentUser changes (optimized like LikesScreen)
  useEffect(() => {
    if (currentUser) {
      // Process the data immediately without any loading state
      const connections = currentUser.connections || [];
      const pastConnectionsIds = currentUser.pastConnections || [];
      
      let users = [];
      let pastUsers = [];
      
      // Use AuthContext allUsers data if available
      if (allUsers && allUsers.length > 0) {
        users = connections.map(id => allUsers.find(user => user._id === id)).filter(Boolean);
        pastUsers = pastConnectionsIds.map(id => allUsers.find(user => user._id === id)).filter(Boolean);
        
        // Set connections immediately for instant UI
        setConnections(users);
        setPastConnections(pastUsers);
        setInitialized(true);
        
        // Initialize online status service and set users to check
        OnlineStatusService.initialize();
        
        // Set all user IDs to check for online status (current user + all connections)
        const allUserIds = [currentUser._id, ...users.map(u => u._id), ...pastUsers.map(u => u._id)].filter(Boolean);
        OnlineStatusService.setUsersToCheck(allUserIds);
        
        // Force immediate online status update
        setTimeout(async () => {
          await OnlineStatusService.updateOnlineStatus();
          const onlineUsers = OnlineStatusService.getOnlineUsers();
          setOnlineStatusRefresh(prev => prev + 1);
        }, 1000);
        
        // Fetch last messages and unread counts in background (completely non-blocking)
        if (users.length > 0) {
          // Use setTimeout to ensure UI renders first
          setTimeout(() => {
            fetchLastMessagesForUsers(users);
            fetchUnreadCounts(users);
          }, 100);
        } else {
          setLastMessages({});
          setChatIdMap({});
          setUnreadCounts({});
        }
      } else {
        // Fetch users data if not available in AuthContext
        fetchUsersData();
      }
    }
  }, [currentUser, allUsers]);

  // REAL-TIME REFRESH: Fetch fresh user data every 3 seconds to stay in sync with database
  useEffect(() => {
    if (!currentUser || !initialized) return;

    
    const refreshInterval = setInterval(async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          return;
        }

        // Fetch fresh user data from server
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const freshUserData = await response.json();

          // Check if connections have changed
          const currentConnections = currentUser.connections || [];
          const freshConnections = freshUserData.connections || [];
          const currentPastConnections = currentUser.pastConnections || [];
          const freshPastConnections = freshUserData.pastConnections || [];

          const connectionsChanged = JSON.stringify(currentConnections.sort()) !== JSON.stringify(freshConnections.sort());
          const pastConnectionsChanged = JSON.stringify(currentPastConnections.sort()) !== JSON.stringify(freshPastConnections.sort());

          if (connectionsChanged || pastConnectionsChanged) {
            
            // Update the user context with fresh data
            updateUser(freshUserData);
            
            // Update online status for new connections
            const newAllUserIds = [freshUserData._id, ...freshConnections, ...freshPastConnections].filter(Boolean);
            OnlineStatusService.setUsersToCheck(newAllUserIds);
            setTimeout(async () => {
              await OnlineStatusService.updateOnlineStatus();
              setOnlineStatusRefresh(prev => prev + 1);
            }, 500);
            
            // Force immediate refresh
            refreshScreenData();
          } else {
          }
        } else {
        }
      } catch (error) {
      }
    }, 3000); // Every 3 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [currentUser, initialized, updateUser, refreshScreenData]);

  // Periodic online status refresh
  useEffect(() => {
    if (!currentUser || !initialized) return;

    
    const onlineRefreshInterval = setInterval(async () => {
      try {
        await OnlineStatusService.updateOnlineStatus();
        setOnlineStatusRefresh(prev => prev + 1);
      } catch (error) {
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(onlineRefreshInterval);
    };
  }, [currentUser, initialized]);

  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Profile popup modal handlers
  const openProfileModal = (user, type = 'past') => {
    setSelectedProfileUser(user);
    setProfileModalType(type);
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
    setSelectedProfileUser(null);
    setProfileModalType('past');
  };

  // Remove past connection functionality
  const handleRemovePastConnection = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/remove-past-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId: userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove connection');
      }

      // Update local state immediately
      setPastConnections(prev => prev.filter(user => user._id !== userId));
      
      // Update user context
      if (currentUser) {
        const updatedPastConnections = (currentUser.pastConnections || []).filter(id => id !== userId);
        const updatedUser = { ...currentUser, pastConnections: updatedPastConnections };
        updateUser(updatedUser);
      }

      Alert.alert('Success', 'User removed from past connections');
      closeProfileModal();
    } catch (error) {
      console.error('Error removing past connection:', error);
      Alert.alert('Error', error.message || 'Failed to remove connection');
    }
  };

  // Connection modal handlers
  const hasExistingConnectionOrRequest = () => {
    const hasActiveConnection = currentUser?.connections && currentUser.connections.length > 0;
    const hasPendingRequest = currentUser?.requests && currentUser.requests.length > 0;
    return hasActiveConnection || hasPendingRequest;
  };

  const openConnectionModal = (userId) => {
    if (!userId) {
      console.error('No userId provided to openConnectionModal');
      return;
    }
    
    // FIRST: Check if user already has a connection or pending request
    if (hasExistingConnectionOrRequest()) {
      setLimitModalVisible(true);
      return;
    }
    
    // SECOND: If no existing connections/requests, check if user has allowed connections
    if (currentUser && (!currentUser.allowedConnections || currentUser.allowedConnections <= 0)) {
      setLimitModalVisible(true);
      return;
    }
    
    // If we get here, user can connect
    setSelectedUserId(userId);
    setModalVisible(true);
  };

  const handleUpgradeConnections = () => {
    setLimitModalVisible(false);
    try {
      navigation.navigate('Premium', { screen: 'PayForConnection' });
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      navigation.navigate('Premium');
    }
  };

  const handleConnect = () => {
    setModalVisible(false);
    navigation.navigate('ConnectionSent');
  };

  // Fetch users data if not available in AuthContext
  const fetchUsersData = async () => {
    if (!currentUser) return;
    
    try {
      const connections = currentUser.connections || [];
      const pastConnectionsIds = currentUser.pastConnections || [];
      
      // Fetch all users with complete data
      const token = await AsyncStorage.getItem('token');
      const allUsersRes = await fetch(`${API_BASE_URL}/admin/users/home`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      const allUsersData = await allUsersRes.json();
      const usersData = allUsersData.users || [];
      
      const users = connections.map(id => usersData.find(user => user._id === id)).filter(Boolean);
      const pastUsers = pastConnectionsIds.map(id => usersData.find(user => user._id === id)).filter(Boolean);
      
      // Set connections immediately for instant UI
      setConnections(users);
      setPastConnections(pastUsers);
      setInitialized(true);
      
              // Fetch last messages and unread counts in background (completely non-blocking)
        if (users.length > 0) {
          // Use setTimeout to ensure UI renders first
          setTimeout(() => {
            fetchLastMessagesForUsers(users);
            fetchUnreadCounts(users);
          }, 100);
        } else {
          setLastMessages({});
          setChatIdMap({});
          setUnreadCounts({});
        }
    } catch (error) {
      setInitialized(true);
    }
  };

  // Fetch unread counts for users
  const fetchUnreadCounts = async (users) => {
    if (!currentUser || users.length === 0) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const unreadMap = {};
      
      for (const user of users) {
        try {
          const chatRes = await fetch(`${API_BASE_URL}/chat/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ participant1Id: currentUser._id, participant2Id: user._id }),
          });
          const chatData = await chatRes.json();
          const chatId = chatData.chat && chatData.chat.chatId;
          
          if (chatId) {
            const res = await fetch(`${API_BASE_URL}/chat/unread/${chatId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            unreadMap[user._id] = data.count || 0;
          }
        } catch (err) {
          unreadMap[user._id] = 0;
        }
      }
      
      setUnreadCounts(unreadMap);
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  };

  // Fetch last messages for users (non-blocking and optimized)
  const fetchLastMessagesForUsers = async (users) => {
    if (!currentUser || users.length === 0) return;
    
    // Add guard to prevent excessive chat creation
    const currentTime = Date.now();
    if (lastRefreshTime && (currentTime - lastRefreshTime) < 3000) {
      return;
    }
    setLastRefreshTime(currentTime);
    
    // Track ongoing chat creation to prevent duplicates
    if (this.chatCreationInProgress) {
      return;
    }
    this.chatCreationInProgress = true;
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      // Process users in smaller batches to avoid overwhelming the server
      const batchSize = 3;
      const batches = [];
      for (let i = 0; i < users.length; i += batchSize) {
        batches.push(users.slice(i, i + batchSize));
      }
      
      const msgMap = {};
      const chatIdMap = {};
      
      // Process batches sequentially to avoid rate limiting
      for (const batch of batches) {
        const batchPromises = batch.map(async (conn) => {
          try {
            const chatRes = await fetch(`${API_BASE_URL}/chat/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ participant1Id: currentUser._id, participant2Id: conn._id }),
            });
            
            if (!chatRes.ok) {
              console.error(`[Chat] Chat creation failed for user ${conn._id}:`, chatRes.status, chatRes.statusText);
              const errorText = await chatRes.text();
              console.error(`[Chat] Error response:`, errorText);
              return { userId: conn._id, lastMessage: null, chatId: null };
            }
            
            const chatData = await chatRes.json();
            
            const chatId = chatData.chat && chatData.chat.chatId;
            if (!chatId) {
              console.error(`[Chat] No chatId in response for user ${conn._id}:`, chatData);
              return { userId: conn._id, lastMessage: null, chatId: null };
            }
            
            
            const res = await fetch(`${API_BASE_URL}/chat/history/${chatId}?limit=1`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
              console.error(`[Chat] Failed to fetch chat history for chatId ${chatId}:`, res.status, res.statusText);
              return { userId: conn._id, lastMessage: null, chatId };
            }
            
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              const lastMsgObj = data.messages[data.messages.length - 1];
              return { userId: conn._id, lastMessage: lastMsgObj, chatId };
            }
            return { userId: conn._id, lastMessage: null, chatId };
          } catch (err) {
            console.error(`[Chat] Error processing user ${conn._id}:`, err);
            return { userId: conn._id, lastMessage: null, chatId: null };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Update state after each batch for progressive loading
        batchResults.forEach(({ userId, lastMessage, chatId }) => {
          msgMap[userId] = lastMessage;
          chatIdMap[userId] = chatId;
        });
        
        // Update state progressively
        setLastMessages(prev => ({ ...prev, ...msgMap }));
        setChatIdMap(prev => ({ ...prev, ...chatIdMap }));
      }
      
      // Messages loaded successfully
      
    } catch (err) {
      // Error fetching last messages
      console.error('Error fetching last messages:', err);
    } finally {
      // Always clear the flag when done
      this.chatCreationInProgress = false;
    }
  };

  // Single effect to handle all data refresh - prevents multiple simultaneous calls
  useEffect(() => {
    if (currentUser && initialized) {
      // Always refresh on initial load, then use debounce for subsequent calls
      const currentTime = Date.now();
      if (!lastRefreshTime || (currentTime - lastRefreshTime) > 2000) {
        refreshScreenData();
      } else {
      }
    }
  }, [currentUser?.connections, currentUser?.pastConnections, initialized]);

  // Handle connection cancellation from navigation params
  useEffect(() => {
    if (route.params?.connectionCanceled && route.params?.canceledUserId) {
      const canceledUserId = route.params.canceledUserId;
      
      // Remove from connections
      setConnections(prev => {
        const filtered = prev.filter(conn => conn._id !== canceledUserId);
        return filtered;
      });
      
      // Remove from past connections as well
      setPastConnections(prev => {
        const filtered = prev.filter(conn => conn._id !== canceledUserId);
        return filtered;
      });
      
      // Clear associated chat data
      setLastMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[canceledUserId];
        return newMessages;
      });
      
      setChatIdMap(prev => {
        const newMap = { ...prev };
        delete newMap[canceledUserId];
        return newMap;
      });
      
      // Clear navigation params to prevent re-processing
      navigation.setParams({
        connectionCanceled: undefined,
        canceledUserId: undefined
      });
      
    }
  }, [route.params?.connectionCanceled, route.params?.canceledUserId]);

  // Define connection accepted callback outside useEffect for proper cleanup
  const connectionAcceptedCallback = useCallback((data) => {
    
    // When a connection is accepted, remove the user from pastConnections
    // The event data structure depends on which user receives it:
    // - For requester: { type: 'connection_accepted', accepterId: userId, accepterName: accepter }
    // - For accepter: { type: 'connection_established', requesterId: targetUserId, requesterName: requester }
    let connectedUserId = null;
    
    if (data.type === 'connection_accepted' && data.accepterId) {
      // This user is the requester, the accepterId is the user they connected with
      connectedUserId = data.accepterId;
    } else if (data.type === 'connection_established' && data.requesterId) {
      // This user is the accepter, the requesterId is the user they connected with
      connectedUserId = data.requesterId;
    }
    
    if (currentUser && connectedUserId) {
      
      // Find user data first
      const userData = allUsers.find(user => user._id === connectedUserId);
      
      // Remove from past connections
      setPastConnections(prev => {
        const filtered = prev.filter(conn => conn._id !== connectedUserId);
        return filtered;
      });
      
      // Add to active connections if not already there and we have user data
      setConnections(prev => {
        const exists = prev.some(conn => conn._id === connectedUserId);
        if (!exists && userData) {
          return [...prev, userData];
        }
        return prev;
      });
      
      // Only refresh if we actually made changes
      if (userData) {
      // Give server time to process the connection before refreshing
      setTimeout(() => {
        refreshUser();
      }, 1000); // 1 second delay to let server catch up
      }
    }
  }, [currentUser, refreshUser, refreshScreenData, allUsers]);

  // Socket setup effect
  useEffect(() => {
    const setupSocket = async () => {
      try {
        await SocketManager.connect();
        setSocketStatus('connected');



        // Listen for new messages to update last messages in real-time
        SocketManager.socket?.on('new_message', async (data) => {

          if (data.chatId && data.message) {
            // Update last message for the specific chat
            const chatId = data.chatId;
            const userId = Object.keys(chatIdMap).find(key => chatIdMap[key] === chatId);
            

            
            if (userId) {
              setLastMessages(prev => ({
                ...prev,
                [userId]: data.message
              }));

            }
          }
        });
        
        // Listen for message notifications (sent to user room)
        SocketManager.socket?.on('message_notification', async (data) => {

          if (data.chatId && data.message) {
            // Update last message for the specific chat
            const chatId = data.chatId;
            const userId = Object.keys(chatIdMap).find(key => chatIdMap[key] === chatId);
            

            
            if (userId) {
              setLastMessages(prev => ({
                ...prev,
                [userId]: data.message
              }));

            }
          }
        });
        
        // Register the connection accepted callback with SocketManager
        SocketManager.onConnectionAccepted(connectionAcceptedCallback);
        
        SocketManager.socket?.on('connection_canceled', (data) => {
          // Immediately remove the canceled connection from the list
          // Handle both canceler and target user cases
          const canceledUserId = data.targetId || data.cancelerId;
          if (currentUser && canceledUserId) {
            // Remove from connections
            setConnections(prev => {
              const filtered = prev.filter(conn => conn._id !== canceledUserId);
              return filtered;
            });
            
            // Remove from past connections as well
            setPastConnections(prev => {
              const filtered = prev.filter(conn => conn._id !== canceledUserId);
              return filtered;
            });
            
            // Clear associated chat data
            setLastMessages(prev => {
              const newMessages = { ...prev };
              delete newMessages[canceledUserId];
              return newMessages;
            });
            
            setChatIdMap(prev => {
              const newMap = { ...prev };
              delete newMap[canceledUserId];
              return newMap;
            });
          }
          
          // Don't call refreshScreenData() here as it overrides the immediate removal
          // The immediate removal above should be sufficient
        });
        
        SocketManager.socket?.on('connection_blocked', (data) => {

          // Refresh the screen data when connection is blocked
          if (currentUser) {
            refreshScreenData();
          }
        });
        
      } catch (error) {
        console.error('Socket connection failed:', error);
        setSocketStatus('error');
      }
    };
    
    setupSocket();
    
    // Cleanup socket listeners
    return () => {

      SocketManager.socket?.off('new_message');
      SocketManager.socket?.off('message_notification');
      // Properly clean up connection_accepted listener
      SocketManager.offConnectionAccepted(connectionAcceptedCallback);
      SocketManager.socket?.off('connection_canceled');
      SocketManager.socket?.off('connection_blocked');
    };
  }, [currentUser, chatIdMap, refreshScreenData, connectionAcceptedCallback]);

  // Optimize the focus effect to prevent unnecessary re-runs
  useFocusEffect(
    React.useCallback(() => {
      // Note: All data refresh is now handled by the single useEffect above
      
      // Check if we're returning from a connection cancellation
      const connectionCanceled = route.params?.connectionCanceled;
      const canceledUserId = route.params?.canceledUserId;
      
      // Check if we're returning from a new connection establishment
      const connectionEstablished = route.params?.connectionEstablished;
      const newConnectionUserId = route.params?.newConnectionUserId;
      
      if (connectionCanceled && canceledUserId && currentUser) {
        // Immediately remove the canceled connection
        setConnections(prev => {
          const filtered = prev.filter(conn => conn._id !== canceledUserId);
          return filtered;
        });
        
        setPastConnections(prev => {
          const filtered = prev.filter(conn => conn._id !== canceledUserId);
          return filtered;
        });
        
        // Clear associated chat data
        setLastMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[canceledUserId];
          return newMessages;
        });
        
        setChatIdMap(prev => {
          const newMap = { ...prev };
          delete newMap[canceledUserId];
          return newMap;
        });
        
        // Clear the route params to prevent re-processing
        navigation.setParams({ connectionCanceled: undefined, canceledUserId: undefined });
      } else if (connectionEstablished && newConnectionUserId && currentUser) {
        
        // Force refresh user data and screen data for the accepter
        refreshUser();
        setTimeout(() => {
          refreshScreenData();
        }, 200);
        
        // Clear the route params to prevent re-processing
        navigation.setParams({ connectionEstablished: undefined, newConnectionUserId: undefined });
      } else {
        // Note: Screen data refresh is now handled by the single useEffect above
        }
    }, [currentUser, initialized, route.params])
  );

  // Function to refresh screen data when connections change
  const refreshScreenData = useCallback(async () => {
    if (!currentUser) return;
    
    // Add debounce to prevent excessive calls (reduced to 1 second for faster updates)
    const currentTime = Date.now();
    if (lastRefreshTime && (currentTime - lastRefreshTime) < 1000) {
      return;
    }
    setLastRefreshTime(currentTime);
    
    try {
      
      // Process connections from updated user data
      const connections = currentUser.connections || [];
      const pastConnectionsIds = currentUser.pastConnections || [];
      
      let users = [];
      let pastUsers = [];
      
      if (allUsers && allUsers.length > 0) {
        // Use cached data
        users = connections.map(id => allUsers.find(user => user._id === id)).filter(Boolean);
        pastUsers = pastConnectionsIds.map(id => allUsers.find(user => user._id === id)).filter(Boolean);
        
        // If we didn't find all users in cache, fetch missing ones
        const missingConnectionIds = connections.filter(id => !allUsers.find(user => user._id === id));
        const missingPastIds = pastConnectionsIds.filter(id => !allUsers.find(user => user._id === id));
        
        if (missingConnectionIds.length > 0 || missingPastIds.length > 0) {
          const token = await AsyncStorage.getItem('token');
          
          // Fetch missing users individually
          const missingIds = [...new Set([...missingConnectionIds, ...missingPastIds])];
          const missingUsers = [];
          
          for (const userId of missingIds) {
            try {
              const userRes = await fetch(`${API_BASE_URL}/auth/user/${userId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
              });
              
              if (userRes.ok) {
                const userData = await userRes.json();
                if (userData && userData._id) {
                  missingUsers.push(userData);
                } else {
                  console.error(`[Chat] No user data in response for ${userId}:`, userData);
                }
              } else {
                const errorText = await userRes.text();
                console.error(`[Chat] API error for user ${userId}:`, userRes.status, errorText);
              }
            } catch (error) {
              console.error(`[Chat] Error fetching user ${userId}:`, error);
            }
          }
          
          // Add missing users to our results
          const missingConnections = missingUsers.filter(user => missingConnectionIds.includes(user._id));
          const missingPast = missingUsers.filter(user => missingPastIds.includes(user._id));
          
          users = [...users, ...missingConnections];
          pastUsers = [...pastUsers, ...missingPast];
          
        }
      } else {
        // Fetch all users data
        const token = await AsyncStorage.getItem('token');
        const allUsersRes = await fetch(`${API_BASE_URL}/admin/users/home`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
        });
        const allUsersData = await allUsersRes.json();
        const usersData = allUsersData.users || [];
        
        users = connections.map(id => usersData.find(user => user._id === id)).filter(Boolean);
        pastUsers = pastConnectionsIds.map(id => usersData.find(user => user._id === id)).filter(Boolean);
      }
      
      // Update connections and past connections immediately
      setConnections(users);
      setPastConnections(pastUsers);
      
      // Clear chat data for users that are no longer in connections
      setLastMessages(prev => {
        const newMessages = { ...prev };
        const currentUserIds = users.map(user => user._id);
        Object.keys(newMessages).forEach(userId => {
          if (!currentUserIds.includes(userId)) {
            delete newMessages[userId];
          }
        });
        return newMessages;
      });
      
      setChatIdMap(prev => {
        const newMap = { ...prev };
        const currentUserIds = users.map(user => user._id);
        Object.keys(newMap).forEach(userId => {
          if (!currentUserIds.includes(userId)) {
            delete newMap[userId];
          }
        });
        return newMap;
      });
      
      // Fetch last messages for current connections (non-blocking)
      if (users.length > 0) {
        setTimeout(() => {
          fetchLastMessagesForUsers(users);
        }, 100);
      } else {
        // Clear last messages if no connections
        setLastMessages({});
        setChatIdMap({});
      }
      
    } catch (error) {
      console.error('Error refreshing screen data:', error);
    }
  }, [currentUser, allUsers]);

  // Memoize user data calculations to avoid recalculating on every render
  const userData = useMemo(() => {
    const allowedConnections = currentUser?.allowedConnections || 0;
    const usedConnections = currentUser?.usedConnections || 0;
    const remainingConnections = currentUser?.remainingConnections || 0;
    const availableConnectionsLeftToBuy = Math.max(0, 3 - allowedConnections);
    
    return {
      allowedConnections,
      usedConnections,
      remainingConnections,
      availableConnectionsLeftToBuy
    };
  }, [currentUser?.allowedConnections, currentUser?.usedConnections, currentUser?.remainingConnections]);

  // Filter out pastConnections that are also in current connections
  const filteredPastConnections = useMemo(() => {
    if (!currentUser || !pastConnections.length) return pastConnections;
    
    const currentConnectionIds = currentUser.connections || [];
    return pastConnections.filter(pastUser => !currentConnectionIds.includes(pastUser._id));
  }, [pastConnections, currentUser?.connections]);


  // Update loading condition - show loading if data is not ready yet
  if (!authInitialized || loading || !dataReady || !currentUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#EC066A" />
      </View>
    );
  }
 

  return (
    <SafeAreaView style={styles.container}>
      <View>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
              <Ionicons name="notifications" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Message label always visible */}
        <Text style={styles.messageLabel}>Message</Text>

        {/* If no connections, show 'No active connection' */}
        {connections.length === 0 ? (
          <Text style={{ color: '#888', fontSize: 16, marginBottom: 24 }}>No active connection</Text>
        ) : (
          <FlatList  
            data={connections}
            keyExtractor={item => item._id}
            renderItem={({ item }) => {
              const msg = lastMessages[item._id];
              const isOnline = OnlineStatusService.isUserOnline(item._id);
              const unreadCount = unreadCounts[item._id] || 0;
              // Force re-render when online status changes
              const _ = onlineStatusRefresh;
              // Try different timestamp fields that might exist
              const timestamp = msg?.createdAt || msg?.timestamp || msg?.time;
              const lastMessageTime = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              
              return (
                <TouchableOpacity
                  style={styles.chatItem}
                  onPress={async () => {
                    if (!currentUser) return;
                    
                    // Try to get existing chatId first
                    let chatId = chatIdMap[item._id];
                    
                    // If no chatId exists, try to create one on-demand
                    if (!chatId) {
                      try {
                        const token = await AsyncStorage.getItem('token');
                        const chatRes = await fetch(`${API_BASE_URL}/chat/create`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ participant1Id: currentUser._id, participant2Id: item._id }),
                        });
                        
                        if (!chatRes.ok) {
                          console.error(`[Chat] On-demand chat creation failed:`, chatRes.status, chatRes.statusText);
                          Alert.alert('Error', 'Could not create chat. Please try again.');
                          return;
                        }
                        
                        const chatData = await chatRes.json();
                        chatId = chatData.chat && chatData.chat.chatId;
                        
                        if (!chatId) {
                          console.error(`[Chat] No chatId in on-demand response:`, chatData);
                          Alert.alert('Error', 'Could not create chat. Please try again.');
                          return;
                        }
                        
                        // Update the chatIdMap for future use
                        setChatIdMap(prev => ({ ...prev, [item._id]: chatId }));
                      } catch (error) {
                        console.error(`[Chat] Error creating chat on-demand:`, error);
                        Alert.alert('Error', 'Could not create chat. Please try again.');
                        return;
                      }
                    }
                    
                    navigation.navigate('ChatInterface', {
                      chatId,
                      user: currentUser, // sender (me)
                      otherUserId: item._id, // receiver (them)
                      otherUser: item, // pass full user object
                    });
                  }}
                >
                  <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={() => openProfileModal(item, 'active')}>
                      <Image source={getProfileImageSource(item)} style={styles.avatar} />
                    </TouchableOpacity>
                    {isOnline && <View style={styles.onlineIndicator} />}
                  </View>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={styles.name}>{item.username || item.phone || 'User'}</Text>
                        {(item.verificationStatus === 'verified') && (
                          <View style={styles.verifiedBadge}>
                            <MaterialIcons
                              name="verified"
                              size={16}
                              color="#EC066A"
                            />
                          </View>
                        )}
                      </View>
                      {lastMessageTime && unreadCount > 0 && (
                        <Text style={styles.lastMessageTime}>{lastMessageTime}</Text>
                      )}
                    </View>
                    <View style={styles.messageRow}>
                      <Text style={styles.message}>
                        {(() => {
                          if (!msg) {
                            return 'No messages yet';
                          }
                          if (msg.messageType === 'image') {
                            return (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="image" size={16} color="#fff" />
                                <Text style={{ marginTop: -3, color: '#bbb', fontSize: 16, fontWeight: '400' }}> image</Text>
                              </View>
                            );
                          }
                          if (msg.messageType === 'audio') {
                            let duration = '';
                            if (msg.audioDuration) {
                              const min = Math.floor(msg.audioDuration / 60);
                              const sec = Math.floor(msg.audioDuration % 60).toString().padStart(2, '0');
                              duration = ` ${min}:${sec}`;
                            }
                            return (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="mic" size={18} color="rgba(255, 255, 255, 0.7)" />
                                <Text style={{ marginTop: -3, color: '#bbb', fontSize: 16, fontWeight: '400' }}> audio message{duration}</Text>
                              </View>
                            );
                          }
                          if (msg.messageType && msg.messageType.startsWith('call_')) {
                            // Handle call event messages
                            const { callType, callStatus } = msg.callData || {};
                            let iconName = 'call';
                            let iconColor = '#4CAF50';
                            
                            if (callType === 'video') {
                              iconName = 'videocam';
                            }
                            
                            if (callStatus === 'missed' || callStatus === 'declined') {
                              iconColor = '#F44336';
                            }
                            
                            return (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name={iconName} size={16} color={iconColor} />
                                <Text style={{ marginTop: -3, color: '#bbb', fontSize: 16, fontWeight: '400' }}> {msg.text || msg.message}</Text>
                              </View>
                            );
                          }
                          // Default: text
                          return msg.text || msg.message || '';
                        })()}
                      </Text>
                      {unreadCount > 0 && (
                        <View style={styles.unreadContainer}>
                          <Text style={styles.unreadCount}>{unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={<View style={{ height: 24 }} />}
          />
        )}

        {/* Older messages section - only show if there are past connections */}
        {filteredPastConnections.length > 0 && (
          <>
            <View style={styles.olderHeader}>
              <Text style={styles.olderLabel}>Older messages</Text>
              <TouchableOpacity onPress={() => setOlderVisible(v => !v)}>
                <Ionicons
                  name={olderVisible ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="rgba(255, 255, 255, 0.5)"
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>
            </View>
            {olderVisible && filteredPastConnections.map(profile => (
              <View key={profile._id} style={[styles.chatItem, styles.olderItem]}>
                <TouchableOpacity onPress={() => openProfileModal(profile, 'past')}>
                  <Image source={getProfileImageSource(profile)} style={styles.olderAvatar} />
                </TouchableOpacity>
                <View style={styles.chatInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.name}>{profile.username || profile.phone || 'User'}</Text>
                    {(profile.verificationStatus === 'verified') && (
                      <View style={styles.verifiedBadge}>
                        <MaterialIcons
                          name="verified"
                          size={16}
                          color="#ff2d7a"
                        />
                      </View>
                    )}
                  </View>
                  <Text style={styles.olderMessage}>Connection canceled!</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Custom Profile Modal */}
        <Modal
          visible={profileModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeProfileModal}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.closeButton} onPress={closeProfileModal}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={profileModalType === 'active' ? styles.fullScreenModalContainer : styles.modalContainer}>
              {profileModalType === 'active' ? (
                <View style={styles.fullScreenContent}>
                  {/* Profile Image Container */}
                  <View style={styles.fullScreenImageContainer}>
                    <Image 
                      source={getProfileImageSource(selectedProfileUser)} 
                      style={styles.fullScreenProfileImage}
                      resizeMode="cover"
                    />
                    
                    {/* User Info Overlay on Bottom-Left of Image */}
                    <View style={styles.userInfoOverlay}>
                      <View style={styles.nameAgeRow}>
                        <Text style={styles.overlayName}>
                          {selectedProfileUser?.username || selectedProfileUser?.name || 'User'}
                          {selectedProfileUser?.age || calculateAge(selectedProfileUser?.dateOfBirth) ? `, ${selectedProfileUser?.age || calculateAge(selectedProfileUser?.dateOfBirth)}` : ''}
                        </Text>
                        {(selectedProfileUser?.verificationStatus === 'verified') && (
                          <View style={styles.verifiedBadge}>
                            <MaterialIcons name="verified" size={16} color="#fff" />
                          </View>
                        )}
                      </View>
                      
                      {selectedProfileUser?.location && (
                        <View style={styles.locationRow}>
                          <MaterialIcons name="location-on" size={14} color="#fff" />
                          <Text style={styles.locationText}>{selectedProfileUser.location}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {/* Profile Details Section - Full screen scrollable */}
                  <ScrollView style={styles.fullScreenDetailsScroll} showsVerticalScrollIndicator={false}>
                    {/* Goal Section */}
                    <View style={styles.profileSection}>
                      <Text style={styles.profileSectionTitle}>Goal</Text>
                      <View style={styles.goalContainer}>
                        <Text style={styles.goalText}>💍 {selectedProfileUser?.goal || 'No goal set'}</Text>
                      </View>
                    </View>

                    {/* Bio Section */}
                    <View style={styles.profileSection}>
                      <Text style={styles.profileSectionTitle}>Bio</Text>
                      <Text style={styles.bioText}>
                        {selectedProfileUser?.bio || 'No bio available'}
                      </Text>
                    </View>

                    {/* About Section */}
                    <View style={styles.profileSection}>
                      <Text style={styles.profileSectionTitle}>About</Text>
                      <View style={styles.tagsContainer}>
                        {selectedProfileUser?.kids && <View style={styles.tag}><Text style={styles.tagText}>Want Kids: {selectedProfileUser.kids}</Text></View>}
                        {selectedProfileUser?.zodiac && <View style={styles.tag}><Text style={styles.tagText}>{selectedProfileUser.zodiac}</Text></View>}
                        {selectedProfileUser?.education && <View style={styles.tag}><Text style={styles.tagText}>{selectedProfileUser.education}</Text></View>}
                        {selectedProfileUser?.personality && <View style={styles.tag}><Text style={styles.tagText}>{selectedProfileUser.personality}</Text></View>}
                        {selectedProfileUser?.religon && <View style={styles.tag}><Text style={styles.tagText}>{selectedProfileUser.religon}</Text></View>}
                        {selectedProfileUser?.height && <View style={styles.tag}><Text style={styles.tagText}>{selectedProfileUser.height}</Text></View>}
                        {selectedProfileUser?.career && <View style={styles.tag}><Text style={styles.tagText}>{selectedProfileUser.career}</Text></View>}
                      </View>
                    </View>

                    {/* Photos Section */}
                    <View style={styles.profileSection}>
                      <Text style={styles.profileSectionTitle}>Photos</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.photosContainer}>
                          {Array.isArray(selectedProfileUser?.profilePictures) && selectedProfileUser.profilePictures.length > 0 ? (
                            selectedProfileUser.profilePictures.map((photo, index) => (
                              <Image 
                                key={index}
                                source={getImageSource(photo)}
                                style={styles.photo}
                              />
                            ))
                          ) : (
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No photos uploaded</Text>
                          )}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Interests Section */}
                    <View style={styles.profileSection}>
                      <Text style={styles.profileSectionTitle}>Interests</Text>
                      <View style={styles.tagsContainer}>
                        {Array.isArray(selectedProfileUser?.interests) && selectedProfileUser.interests.length > 0 ? (
                          selectedProfileUser.interests.map((interest, index) => (
                            <View key={index} style={styles.tag}>
                              <Text style={styles.tagText}>{interest}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No interests added</Text>
                        )}
                      </View>
                    </View>

                    {/* Languages Section */}
                    <View style={styles.profileSection}>
                      <Text style={styles.profileSectionTitle}>Languages</Text>
                      <View style={styles.tagsContainer}>
                        {Array.isArray(selectedProfileUser?.languages) && selectedProfileUser.languages.length > 0 ? (
                          selectedProfileUser.languages.map((language, index) => (
                            <View key={index} style={styles.tag}>
                              <Text style={styles.tagText}>{language}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No languages added</Text>
                        )}
                      </View>
                    </View>

                    {/* Location Section */}
                    <View style={styles.profileSection}>
                      <Text style={styles.profileSectionTitle}>Location</Text>
                      <View style={styles.locationContainer}>
                        <Text style={styles.locationText}>
                          {selectedProfileUser?.location || 'No location added'}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              ) : (
              <View style={styles.modalContent}>
                {/* Profile Image Container */}
                <View style={styles.modalImageContainer}>
                  <Image 
                    source={getProfileImageSource(selectedProfileUser)} 
                    style={styles.modalProfileImage}
                    resizeMode="cover"
                  />
                  
                  {/* User Info Overlay on Bottom-Left of Image */}
                  <View style={styles.userInfoOverlay}>
                    <View style={styles.nameAgeRow}>
                      <Text style={styles.overlayName}>
                        {selectedProfileUser?.username || selectedProfileUser?.name || 'User'}
                        {selectedProfileUser?.age || calculateAge(selectedProfileUser?.dateOfBirth) ? `, ${selectedProfileUser?.age || calculateAge(selectedProfileUser?.dateOfBirth)}` : ''}
                      </Text>
                      {(selectedProfileUser?.verificationStatus === 'verified') && (
                        <View style={styles.verifiedBadge}>
                          <MaterialIcons name="verified" size={16} color="#fff" />
                        </View>
                      )}
                    </View>
                    
                    {selectedProfileUser?.location && (
                      <View style={styles.locationRow}>
                        <MaterialIcons name="location-on" size={14} color="#fff" />
                        <Text style={styles.locationText}>{selectedProfileUser.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                  {/* Action Buttons - Only for past connections */}
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.connectButton}
                    onPress={() => {
                      closeProfileModal();
                      openConnectionModal(selectedProfileUser?._id || selectedProfileUser?.id);
                    }}
                  >
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => {
                      closeProfileModal();
                        handleRemovePastConnection(selectedProfileUser?._id || selectedProfileUser?.id);
                    }}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Connection Policy Modal */}
        <ConnectionPolicyModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedUserId(null);
          }}
          onAccept={handleConnect}
          modalType="likes"
          targetUserId={selectedUserId}
          onConnectionLimit={() => setLimitModalVisible(true)}
        />

        {/* Connection Limit Modal */}
        <ConnectionLimitModal
          visible={limitModalVisible}
          onClose={() => setLimitModalVisible(false)}
          onUpgrade={handleUpgradeConnections}
          currentConnections={currentUser?.allowedConnections || 0}
          maxConnections={currentUser?.allowedConnections || 0}
          hasPendingRequest={hasExistingConnectionOrRequest()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // dark background
    paddingTop: 40,
    paddingHorizontal: 24,
    marginBottom:56
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold', // commented out
  },
  messageLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 24, 
  },
  testButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    // fontWeight: '600', // commented out
  },
  chatItem: {
    flexDirection: 'row',
    marginBottom:24,
    alignItems: 'flex-start',  
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  olderAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6ec531',
    borderWidth: 0,
  },
  chatInfo: {
    flex: 1,  
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lastMessageTime: {
    color: '#EC066A',
    fontSize: 16,
    fontWeight: '400',
    marginLeft: 'auto',
  },
  name: {
    color: '#fff',
    // fontWeight: 'bold', // commented out
    fontSize: 16,
    marginRight: 6,
    textTransform:'capitalize'
    // fontFamily: 'YourFontFamily', // commented out if present
  },
  verifiedBadge: {
    marginTop: 2,
    marginRight: 6,
  },
  time: {
    color: '#888',
    fontSize: 12,
    marginLeft: 'auto',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  message: {
    color: '#bbb',
    fontSize: 16,
    fontWeight:'400',
    flex: 1,
    marginRight: 8,
  },
  unreadContainer: {
    backgroundColor: '#EC066A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  olderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 16,
  },
  olderLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    opacity: 0.5,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  olderItem: {
    marginBottom: 16,
  },
  olderMessage: {
    color: '#bbb',
    fontSize: 16,
    marginTop: 12,
  },
  socketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
  },
  suggestionsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  suggestionsLabel: {
    color: '#fff',
    // fontWeight: '600', // commented out
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 2,
    opacity: 0.8,
  },
  suggestionsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  suggestionItem: {
    alignItems: 'center',
    marginRight: 18,
    width: 64,
  },
  suggestionAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#ff2d7a',
  },
  suggestionName: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 60,
    opacity: 0.8,
    // fontFamily: 'YourFontFamily', // commented out if present
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000',
    height: 60,
    borderTopWidth: 0,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
  },
  navIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    opacity: 0.7,
  },
  activeNav: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 6,
  },
  activeNavIcon: {
    width: 24,
    height: 24,
    tintColor: '#ff2d7a', // pink
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: 'transparent',
    borderRadius: 8,
    position: 'relative',
    overflow: 'visible',
  },
  closeButton: { 
    position: 'absolute',
    top: 5,
    right: 20,
    zIndex: 1000,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',  
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 0,
    alignItems: 'center',
  },
  modalImageContainer: {
    width: '100%',
    height: '66%',
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalProfileImage: {
    width: '100%',
    height: '100%',
  },
  userInfoOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  nameAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  overlayName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    marginRight: 8, 
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EC066A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%', 
    paddingBottom: 20,
    paddingTop: 20,
    backgroundColor: 'transparent',
    marginTop: 16,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#EC066A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius:89,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  removeButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: '#EC066A',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#EC066A',
    fontSize: 20,
    fontWeight: '700',
  },
  // Profile Details Styles
  profileDetailsContainer: {
    flex: 1,
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
  },
  profileDetailsScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    marginBottom: 24,
  },
  profileSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  goalContainer: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  goalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  bioText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  locationContainer: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  // Full Screen Modal Styles
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  fullScreenContent: {
    flex: 1,
  },
  fullScreenImageContainer: {
    height: 300,
    position: 'relative',
    marginTop: -20,
  },
  fullScreenProfileImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  fullScreenDetailsScroll: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
 