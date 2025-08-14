import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Alert, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DUMMY_PROFILES } from '../../constants/dummyData';
import SocketManager from '../../utils/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../components/AuthContext';

 
export default function ChatScreen({ navigation, route }) {
  const { user: currentUser, allUsers, updateUser, getProfileImageSource, dataReady, loading, initialized: authInitialized } = useAuth();
  const [olderVisible, setOlderVisible] = useState(true);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [connections, setConnections] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [chatIdMap, setChatIdMap] = useState({});
  const [pastConnections, setPastConnections] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});

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

  // Fetch users data if not available in AuthContext
  const fetchUsersData = async () => {
    if (!currentUser) return;
    
    try {
      const connections = currentUser.connections || [];
      const pastConnectionsIds = currentUser.pastConnections || [];
      
      // Fetch all users with complete data
      const allUsersRes = await fetch(`${API_BASE_URL}/admin/users/home`);
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
            const chatData = await chatRes.json();
            const chatId = chatData.chat && chatData.chat.chatId;
            if (!chatId) return { userId: conn._id, lastMessage: null, chatId: null };
            
            const res = await fetch(`${API_BASE_URL}/chat/history/${chatId}?limit=1`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              const lastMsgObj = data.messages[data.messages.length - 1];
              return { userId: conn._id, lastMessage: lastMsgObj, chatId };
            }
            return { userId: conn._id, lastMessage: null, chatId: null };
          } catch (err) {
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
    }
  };

  // Effect to refresh screen when user data changes (from AuthContext)
  useEffect(() => {
    if (currentUser && initialized) {
      // Refresh screen data when user data changes
      // Add a small delay to ensure AuthContext updates are processed first
      const timeoutId = setTimeout(() => {
        refreshScreenData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentUser?.connections, currentUser?.pastConnections, initialized]);

  // Socket setup effect
  useEffect(() => {
    const setupSocket = async () => {
      try {
        await SocketManager.connect();
        setSocketStatus('connected');

        // Listen for online status updates
        SocketManager.socket?.on('user_online', (data) => {
          setOnlineUsers(prev => new Set([...prev, data.userId]));
        });

        SocketManager.socket?.on('user_offline', (data) => {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        });

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
        
        // Listen for connection updates from AuthContext
        SocketManager.socket?.on('connection_accepted', (data) => {
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
            // Remove from past connections
            setPastConnections(prev => {
              const filtered = prev.filter(conn => conn._id !== connectedUserId);
              return filtered;
            });
            
            // The connection should be added to current connections via AuthContext update
            // But we can also trigger a refresh to ensure it's reflected
            setTimeout(() => {
              refreshScreenData();
            }, 100);
          }
        });
        
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
      SocketManager.socket?.off('connection_accepted');
      SocketManager.socket?.off('connection_canceled');
      SocketManager.socket?.off('connection_blocked');
    };
  }, [currentUser, chatIdMap, refreshScreenData]);

  // Optimize the focus effect to prevent unnecessary re-runs
  useFocusEffect(
    React.useCallback(() => {
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
        // Trigger a refresh to show the new connection
        refreshScreenData();
        
        // Clear the route params to prevent re-processing
        navigation.setParams({ connectionEstablished: undefined, newConnectionUserId: undefined });
      } else {
        // Normal refresh when screen comes into focus
        if (currentUser && initialized) {
          setLastRefreshTime(Date.now());
          refreshScreenData();
        }
      }
    }, [currentUser, initialized, refreshScreenData, route.params])
  );

  // Function to refresh screen data when connections change
  const refreshScreenData = useCallback(async () => {
    if (!currentUser) return;
    
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
      } else {
        // Fetch all users data
        const allUsersRes = await fetch(`${API_BASE_URL}/admin/users/home`);
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
              const isOnline = onlineUsers.has(item._id);
              const unreadCount = unreadCounts[item._id] || 0;
              const lastMessageTime = msg?.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              
              return (
                <TouchableOpacity
                  style={styles.chatItem}
                  onPress={async () => {
                    if (!currentUser) return;
                    // Always use backend chatId
                    const chatId = chatIdMap[item._id];
                    if (!chatId) {
                      Alert.alert('Error', 'Could not find or create chat.');
                      return;
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
                    <Image source={getProfileImageSource(item)} style={styles.avatar} />
                    {isOnline && <View style={styles.onlineIndicator} />}
                  </View>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={styles.name}>{item.username || item.phone || 'User'}</Text>
                        {item.verificationStatus === 'true' && (
                          <View style={styles.verifiedBadge}>
                            <MaterialIcons
                              name="verified"
                              size={16}
                              color="#EC066A"
                            />
                          </View>
                        )}
                      </View>
                      {lastMessageTime && (
                        <Text style={styles.lastMessageTime}>{lastMessageTime}</Text>
                      )}
                    </View>
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
                  </View>
                  {unreadCount > 0 && (
                    <View style={styles.unreadContainer}>
                      <Text style={styles.unreadCount}>{unreadCount}</Text>
                    </View>
                  )}
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
                <Image source={getProfileImageSource(profile)} style={styles.avatar} />
                <View style={styles.chatInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.name}>{profile.username || profile.phone || 'User'}</Text>
                    {profile.verificationStatus === 'true' && (
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
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#121212',
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
    fontSize: 12,
    fontWeight: '400',
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
  message: {
    color: '#bbb',
    fontSize: 16,
    fontWeight:'400',
    marginTop: 8,
  },
  unreadContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
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
    opacity: 0.5,
    marginBottom:16
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
});
 