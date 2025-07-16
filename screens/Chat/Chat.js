import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DUMMY_PROFILES } from '../../constants/dummyData';
import SocketManager from '../../utils/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';
import { useFocusEffect } from '@react-navigation/native';

 
export default function ChatScreen({ navigation }) {
  const [olderVisible, setOlderVisible] = useState(true);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [connections, setConnections] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const setupSocket = async () => {
      try {
        await SocketManager.connect();
        setSocketStatus('connected');
      } catch (error) {
        console.error('Socket connection failed:', error);
        setSocketStatus('error');
      }
    };
    setupSocket();
    // Optionally cleanup socket here
    // return () => { SocketManager.cleanup(); };
  }, []);

  // Move fetchConnections into a function
  const fetchConnections = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token');
      // Fetch current user profile
      const profileRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      setCurrentUser(profileData);
      const connections = profileData.connections || [];
      // Fetch each connection user's details
      const userPromises = connections.map(id =>
        fetch(`${API_BASE_URL}/auth/user/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .catch(() => null)
      );
      const users = (await Promise.all(userPromises)).filter(Boolean);
      setConnections(users);
      // Fetch last messages for each connection
      const lastMsgPromises = users.map(async (conn) => {
        // Deterministic chatId
        const ids = [profileData._id, conn._id].sort();
        const chatId = ids.join('_');
        try {
          const res = await fetch(`${API_BASE_URL}/chat/history/${chatId}?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            const lastMsgObj = data.messages[data.messages.length -1];
            return { userId: conn._id, lastMessage: lastMsgObj?.text || lastMsgObj?.message };
          }
        } catch (err) {}
        return { userId: conn._id, lastMessage: '' };
      });
      const results = await Promise.all(lastMsgPromises);
      const msgMap = {};
      results.forEach(({ userId, lastMessage }) => {
        msgMap[userId] = lastMessage;
      });
      setLastMessages(msgMap);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setConnections([]);
    }
  };

  // Use useFocusEffect to refresh data every time screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchConnections();
    }, [])
  );
 

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
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() => {
                  if (!currentUser) return;
                  // Deterministic chatId (sorted IDs)
                  const ids = [currentUser._id, item._id].sort();
                  navigation.navigate('ChatInterface', {
                    chatId: ids.join('_'),
                    user: item,
                    otherUserId: currentUser._id,
                  });
                }}
              >
                <Image source={item.profilePictures && item.profilePictures.length > 0 ? { uri: item.profilePictures[0] } : require('../../assets/model.jpg')} style={styles.avatar} />
                <View style={styles.chatInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.name}>{item.username || item.phone || 'User'}</Text>
                    {item.verificationStatus === 'true' && (
                      <View style={styles.verifiedBadge}>
                        <MaterialIcons
                          name="verified"
                          size={16}
                          color="#ff2d7a"
                        />
                      </View>
                    )}
                  </View>
                  <Text style={styles.message}>{(lastMessages[item._id] ? lastMessages[item._id].slice(-10) : 'No messages yet')}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListFooterComponent={<View style={{ height: 24 }} />}
          />
        )}

        {/* Older messages section */}
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
        {olderVisible && DUMMY_PROFILES.map(profile => (
          <View key={profile.id} style={[styles.chatItem, styles.olderItem]}>
            <Image source={profile.image} style={styles.avatar} />
            <View style={styles.chatInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.name}>{profile.name}</Text>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons
                    name="verified"
                    size={16}
                    color="#ff2d7a"
                  />
                </View>
              </View>
              <Text style={styles.olderMessage}>Connection canceled!</Text>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // dark background
    paddingTop: 24,
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
    fontWeight: 'bold',
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
    fontWeight: '600',
  },
  chatItem: {
    flexDirection: 'row',
    marginBottom:24,
    alignItems: 'flex-end',  
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 55,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',  
    marginBottom:4
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 6,
    textTransform:'capitalize'
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
    fontWeight:400,
    marginTop: 16,
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
    fontWeight: '600',
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
