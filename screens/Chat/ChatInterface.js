import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Platform, ScrollView, Animated, Modal, Alert, KeyboardAvoidingView, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Audio } from 'expo-av';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import * as FileSystem from 'expo-file-system';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthContext';
import { API_BASE_URL } from '../../env';
import smileyImg from '../../assets/smiley.png';
import readImg from '../../assets/read.png';
import sentImg from '../../assets/sent.png';
import phoneplusImg from '../../assets/phoneplus.png';
import waveformImg from '../../assets/waveform.png';
import blackwave from '../../assets/blackwave.png'; 
import SocketManager from '../../utils/socket';
import { groupMessagesByTime, handleSend, handleGallerySelect, handleMicPress, markMessageAsRead, markAllMessagesAsRead, markAllMessagesAsDelivered, markMessageAsDelivered, sendCallEventMessage } from './components/ChatFunctions';
import { CallModal, PlusModal, DropdownMenu } from './components/ChatModals';
import CallEventMessage from './components/CallEventMessage';
import AudioWaveformRecorder from './components/AudioWaveformRecorder';
import AudioWaveformPlayer from './components/AudioWaveformPlayer';
import recordingImg from '../../assets/recording.png';
import { safeJsonParse } from '../../utils/safeJsonParse';

 

// Add ChatImage component for dynamic image sizing
const ChatImage = ({ uri }) => {
  const [imageSize, setImageSize] = useState({width: 100}); // fallback
  const maxWidth = 300;
  const maxHeight = 500;
  const [loading, setLoading] = useState(true);
  const [opacity, setOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (uri) {
      Image.getSize(uri, (width, height) => {
        let scale = Math.min(maxWidth / width, maxHeight / height, 1);
        setImageSize({
          width: width * scale,
          height: height * scale,
        });
      }, (error) => {
        setImageSize({ width: maxWidth, height: maxWidth });
      });
    }
  }, [uri]);

  const onLoad = () => {
    setLoading(false);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={{
      borderRadius: 8,
      alignSelf: 'flex-start',
      backgroundColor: '#222',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      maxWidth,
      maxHeight,
      minHeight: 40,
    }}>
      {loading && (
        <ActivityIndicator size="small" color="#ff2d7a" style={{ position: 'absolute', alignSelf: 'center', zIndex: 1 }} />
      )}
      <Animated.Image
        source={{ uri }}
        style={{
          width: imageSize.width,
          height: imageSize.height,
          borderRadius: 8,
          opacity: opacity,
        }}
        resizeMode="contain"
        onLoad={onLoad}
      />
    </View>
  );
};

// Audio message bubble with waveform playback
const AudioMessageBubble = ({ uri, isSent }) => {
  return (
    <AudioWaveformPlayer
      uri={uri}
      isSent={isSent}
      onPlaybackStatusChange={(status) => {
        // Handle any additional playback status changes if needed
        console.log('Playback status:', status);
      }}
    />
  );
};

// --- Emoji categories (simple default) ---
const defaultEmojiCategories = {
  'Smileys': ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳','🥺','🤠','🤡','🤥','🤫','🤭','🧐','🤓'],
  'Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🕸','🐢','🐍','🦎','🦂','🦀','🦞','🦐','🦑','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🐘','🦏','🦛','🐪','🐫','🦙','🦒','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦌','🐐','🦃','🐓','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿','🦔'],
};

export default function ChatInterface({ route, navigation }) {
  const { 
    user: currentUser, 
    allUsers, 
    updateUser,
    messageCache,
    updateMessageCache,
    getMessageCache,
    addMessageToCache,
    getImageSource,
    getProfileImageSource
  } = useAuth();
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Accept both user (current user) and otherUser (chat partner) from params
  const { chatId: initialChatId, senderId: initialSenderId, otherUser, otherUserId, initialMessage, forceCreateChat } = route.params || {};
  // Always resolve senderId and chatId from params or fallback
  const resolvedSenderId = otherUserId || initialSenderId;
  const resolvedChatId = initialChatId;
  

  
  if (!resolvedSenderId) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}><Text style={{ color: '#fff' }}>No chat partner selected.</Text></View>;
  }
  
  // Use the passed otherUser if available, otherwise fetch from AuthContext
  const [displayUser, setDisplayUser] = useState(null); // This is the chat partner
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(resolvedChatId || null);
  const [chatCache, setChatCache] = useState({}); // Cache for chat data

  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true); // Only auto-scroll for new messages
  const [initialScrollDone, setInitialScrollDone] = useState(false); // Track if initial scroll is done
  const [cacheLoaded, setCacheLoaded] = useState(false); // Track if cache is loaded from storage


  // Load persistent cache from AsyncStorage
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cachedChats = await AsyncStorage.getItem('chatCache');
        
        if (cachedChats) {
          setChatCache(safeJsonParse(cachedChats, {}));
        }
        setCacheLoaded(true);
      } catch (err) {
        console.error('Error loading cache:', err);
        // Clear corrupted cache
        AsyncStorage.removeItem('chatCache');
        setCacheLoaded(true);
      }
    };
    loadCache();
  }, []);

  // Save cache to AsyncStorage whenever it changes
  useEffect(() => {
    if (cacheLoaded) {
      try {
        AsyncStorage.setItem('chatCache', JSON.stringify(chatCache));
      } catch (err) {
        console.error('Error saving cache:', err);
      }
    }
  }, [chatCache, cacheLoaded]);

  // Use AuthContext to get other user immediately - NO API CALLS
  useEffect(() => {
    if (otherUser) {
      setDisplayUser(otherUser);
      return;
    }
    
    // Use AuthContext allUsers data - instant access
    if (allUsers && allUsers.length > 0) {
      const foundUser = allUsers.find(user => user._id === resolvedSenderId);
      if (foundUser) {
        setDisplayUser(foundUser);
        return;
      }
    }
    
    // Only fetch if absolutely necessary (not found in AuthContext)
    const fetchOtherUser = async () => {
      const idToFetch = resolvedSenderId;
      if (!idToFetch) return;
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/auth/user/${idToFetch}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setDisplayUser(data.user || data);
      } catch (err) {
        setDisplayUser(null);
      }
    };
    fetchOtherUser();
  }, [otherUser, resolvedSenderId, allUsers]);



  const [isTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const inputRef = useRef(null);
  const flatListRef = useRef(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const [showReceiverRecording, setShowReceiverRecording] = useState(false);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [plusModalVisible, setPlusModalVisible] = useState(false);
  const [socketStatus, setSocketStatus] = useState('connected');
  const [incomingCall, setIncomingCall] = useState(null); // { fromUserId, callType, channelName, agoraToken }
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);
  const [outgoingCall, setOutgoingCall] = useState(null); // { toUserId, callType, channelName, agoraToken }
  const [showOutgoingCallModal, setShowOutgoingCallModal] = useState(false);
  const [outgoingCallStatus, setOutgoingCallStatus] = useState('ringing'); // 'ringing', 'accepted', 'declined', 'timeout'
  const isFocused = useIsFocused();
  
  // Typing indicator refs
  const typingTimeoutRef = useRef(null);
  const typingDebounceRef = useRef(null);
  // Add refs to track message statuses and prevent race conditions
  const messageStatusMap = useRef(new Map());
  const lastStatusUpdate = useRef(new Map());

  // Typing animation effect
  useEffect(() => {
    if (otherUserTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [otherUserTyping]);

  // Keep a ref to the current chatId and userId for event handlers
  const chatIdRef = useRef(resolvedChatId);
  const userIdRef = useRef(currentUser?._id);
  useEffect(() => { chatIdRef.current = resolvedChatId; }, [resolvedChatId]);
  useEffect(() => { userIdRef.current = currentUser?._id; }, [currentUser?._id]);

  useEffect(() => {
    if (currentUser && currentUser._id) {
      SocketManager.joinUserRoom(currentUser._id);
    }
  }, [currentUser && currentUser._id]);

  // Create or fetch chat efficiently using AuthContext data
  useEffect(() => {
    const fetchOrCreateChat = async () => {
      if (!currentUser?._id || !resolvedSenderId) return;
      
      // If forceCreateChat is true, skip cache and create immediately
      if (!forceCreateChat && cacheLoaded) {
        // Check if we have cached chat data
        const cacheKey = `${currentUser._id}_${resolvedSenderId}`;
        if (chatCache[cacheKey]) {
          setCurrentChatId(chatCache[cacheKey]);
          return;
        }
      }
      
      // Create chat immediately
      try {
        const token = await AsyncStorage.getItem('token');
        const chatResponse = await fetch(`${API_BASE_URL}/chat/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            participant1Id: currentUser._id,
            participant2Id: resolvedSenderId,
          }),
        });
        const chatResponseText = await chatResponse.text();
  
        
        if (chatResponse.ok) {
          const chatData = safeJsonParse(chatResponseText);
          if (chatData && chatData.chat && chatData.chat.chatId) {
            setCurrentChatId(chatData.chat.chatId);
            // Cache the chat ID
            setChatCache(prev => ({ ...prev, [`${currentUser._id}_${resolvedSenderId}`]: chatData.chat.chatId }));
    
          } else {
            console.error('No chat ID in response:', chatData);
          }
        } else {
          console.error('Chat creation failed:', chatResponseText);
        }
      } catch (e) {
        console.error('Error fetching/creating chat:', e);
      }
    };
    
    fetchOrCreateChat();
  }, [currentUser?._id, resolvedSenderId, chatCache, cacheLoaded, forceCreateChat]);

  // Handle initial message from AcceptedConnection screen
  useEffect(() => {
    if (initialMessage && currentChatId && currentUser?._id && resolvedSenderId) {
      
      
      // Send the initial message
      handleSend({ 
        message: initialMessage, 
        chatId: currentChatId, 
        user: currentUser, 
        otherUserId: resolvedSenderId, 
        setMessage, 
        setIsTyping, 
        inputRef, 
        setMessages, 
        emitTypingStatus 
      });
      
      // Clear the initial message to prevent re-sending
      navigation.setParams({ initialMessage: undefined });
    } else {

    }
  }, [initialMessage, currentChatId, currentUser?._id, resolvedSenderId]);

    // Fetch chat history with pagination - load last 10 messages first
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentChatId || !currentUser?._id || !cacheLoaded) return;
      
      // Check if we have cached messages in AuthContext - use it immediately
      const cachedMessages = getMessageCache(currentChatId);
      if (cachedMessages && cachedMessages.length > 0) {
        setMessages(cachedMessages);
        return;
      }

      try {
        const token = await AsyncStorage.getItem('token');
        // First, fetch only the last 10 messages to show immediately
        const res = await fetch(`${API_BASE_URL}/chat/history/${currentChatId}?limit=10&sort=desc`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data && Array.isArray(data.messages)) {
          const processedMessages = data.messages.reverse().map(msg => {
            const isImage = msg.messageType === 'image' || (typeof msg.message === 'string' && (msg.message.startsWith('http://') || msg.message.startsWith('https://')) && (msg.message.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)));
            const isAudio = msg.messageType === 'audio' || (typeof msg.message === 'string' && (msg.message.startsWith('http://') || msg.message.startsWith('https://')) && (msg.message.match(/\.(m4a|mp3|wav|ogg|aac)$/i)));
            let status = 'sent';
            if (msg.isRead) {
              status = 'read';
            } else if (msg.isDelivered) {
              status = 'delivered';
            }
            const baseMessage = {
              time: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              sent: msg.senderId._id === currentUser._id,
              id: msg._id,
              status: status,
              senderId: msg.senderId,
              isRead: msg.isRead,
              isDelivered: msg.isDelivered,
              messageType: msg.messageType || 'text',
            };
            
            if (isImage) {
              return {
                ...baseMessage,
                image: msg.message,
                messageType: 'image',
              };
            } else if (isAudio) {
              return {
                ...baseMessage,
                message: msg.message,
                messageType: 'audio',
              };
            } else if (msg.messageType && msg.messageType.startsWith('call_')) {
              // Handle call event messages
              return {
                ...baseMessage,
                text: msg.message,
                messageType: msg.messageType,
                callData: msg.callData || {},
              };
            } else {
              return {
                ...baseMessage,
                text: msg.message,
              };
            }
          });
          
          // Set initial messages (last 10)
          setMessages(processedMessages);
          
          // Now fetch all messages in the background and cache them
          const fullRes = await fetch(`${API_BASE_URL}/chat/history/${currentChatId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fullData = await fullRes.json();
          
          if (fullData && Array.isArray(fullData.messages)) {
            const fullProcessedMessages = fullData.messages.map(msg => {
              const isImage = msg.messageType === 'image' || (typeof msg.message === 'string' && (msg.message.startsWith('http://') || msg.message.startsWith('https://')) && (msg.message.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)));
              const isAudio = msg.messageType === 'audio' || (typeof msg.message === 'string' && (msg.message.startsWith('http://') || msg.message.startsWith('https://')) && (msg.message.match(/\.(m4a|mp3|wav|ogg|aac)$/i)));
              let status = 'sent';
              if (msg.isRead) {
                status = 'read';
              } else if (msg.isDelivered) {
                status = 'delivered';
              }
              const baseMessage = {
                time: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                sent: msg.senderId._id === currentUser._id,
                id: msg._id,
                status: status,
                senderId: msg.senderId,
                isRead: msg.isRead,
                isDelivered: msg.isDelivered,
                messageType: msg.messageType || 'text',
              };
              
              if (isImage) {
                return {
                  ...baseMessage,
                  image: msg.message,
                  messageType: 'image',
                };
              } else if (isAudio) {
                return {
                  ...baseMessage,
                  message: msg.message,
                  messageType: 'audio',
                };
              } else if (msg.messageType && msg.messageType.startsWith('call_')) {
                // Handle call event messages
                return {
                  ...baseMessage,
                  text: msg.message,
                  messageType: msg.messageType,
                  callData: msg.callData || {},
                };
              } else {
                return {
                  ...baseMessage,
                  text: msg.message,
                };
              }
            });
            
            // Update messages with full history and cache them in AuthContext
            setMessages(fullProcessedMessages);
            updateMessageCache(currentChatId, fullProcessedMessages);
          }
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      }
    };
    
    fetchHistory();
  }, [currentChatId, currentUser?._id, cacheLoaded]);

  // Set up polling for real-time message updates with smart caching
  useEffect(() => {
    if (!currentChatId || !currentUser?._id) return;
    
    let intervalId;
    let isUnmounted = false;
    let lastMessageIds = new Set(messages.map(m => m.id));
    
    const pollForNewMessages = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/chat/history/${currentChatId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (!isUnmounted && data && Array.isArray(data.messages)) {
          const newIds = new Set(data.messages.map(m => m._id));
          let hasNew = false;
          
          if (newIds.size !== lastMessageIds.size) {
            hasNew = true;
          } else {
            for (let id of newIds) {
              if (!lastMessageIds.has(id)) {
                hasNew = true;
                break;
              }
            }
          }
          
          if (hasNew) {
            setMessages(prevMsgs => {
              const prevMap = new Map(prevMsgs.map(m => [m.id, m]));
              const newMessages = data.messages.map(msg => {
                const isImage = msg.messageType === 'image' || (typeof msg.message === 'string' && (msg.message.startsWith('http://') || msg.message.startsWith('https://')) && (msg.message.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)));
                const isAudio = msg.messageType === 'audio' || (typeof msg.message === 'string' && (msg.message.startsWith('http://') || msg.message.startsWith('https://')) && (msg.message.match(/\.(m4a|mp3|wav|ogg|aac)$/i)));
                let status = 'sent';
                if (msg.isRead) {
                  status = 'read';
                } else if (msg.isDelivered) {
                  status = 'delivered';
                }
                const baseMessage = {
                  time: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                  sent: msg.senderId._id === currentUser._id,
                  id: msg._id,
                  status: status,
                  senderId: msg.senderId,
                  isRead: msg.isRead,
                  isDelivered: msg.isDelivered,
                  messageType: msg.messageType || 'text',
                };
                
                const prev = prevMap.get(msg._id);
                if (prev) {
                  return {
                    ...prev,
                    status,
                    isRead: msg.isRead,
                    isDelivered: msg.isDelivered,
                  };
                }
                
                if (isImage) {
                  return {
                    ...baseMessage,
                    image: msg.message,
                    messageType: 'image',
                  };
                } else if (isAudio) {
                  return {
                    ...baseMessage,
                    message: msg.message,
                    messageType: 'audio',
                  };
                } else if (msg.messageType && msg.messageType.startsWith('call_')) {
                  // Handle call event messages
                  return {
                    ...baseMessage,
                    text: msg.message,
                    messageType: msg.messageType,
                    callData: msg.callData || {},
                  };
                } else {
                  return {
                    ...baseMessage,
                    text: msg.message,
                  };
                }
              });
              
              // Update cache in AuthContext
              updateMessageCache(currentChatId, newMessages);
              return newMessages;
            });
            lastMessageIds = newIds;
            
            // Only auto-scroll if the new message is from the other user
            const lastMessage = data.messages[data.messages.length - 1];
            if (lastMessage && lastMessage.senderId._id !== currentUser._id) {
              setShouldAutoScroll(true);
            }
          }
        }
      } catch (err) {
        // Ignore polling errors
      }
    };
    
    // Start polling after a short delay
    intervalId = setInterval(pollForNewMessages, 3000);
    
    return () => {
      isUnmounted = true;
      clearInterval(intervalId);
    };
  }, [currentChatId, currentUser?._id, messages.length]);

  useEffect(() => {
    if (currentChatId && currentUser?._id) {
      SocketManager.setActiveChat(currentChatId);
      SocketManager.joinChat(currentChatId);
    }
  }, [currentChatId, currentUser?._id]);

  // Ensure scroll starts at bottom when messages are first loaded
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll && !initialScrollDone) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        // With FlatList inverted, new messages will automatically appear at the bottom
        // No need to manually scroll
        setInitialScrollDone(true);
      }, 100);
    }
  }, [messages.length, shouldAutoScroll, initialScrollDone]);



  // Only mark unread received messages as read when the chat is focused
  useFocusEffect(
    React.useCallback(() => {
      const unreadReceivedMessages = messages.filter(msg => !msg.sent && !msg.isRead);
      if (unreadReceivedMessages.length > 0) {
        setMessages(prevMsgs =>
          prevMsgs.map(msg =>
            !msg.sent && !msg.isRead ? { 
              ...msg, 
              status: 'read', 
              isRead: true 
            } : msg
          )
        );
        unreadReceivedMessages.forEach(msg => {
          messageStatusMap.current.set(msg.id, 'read');
          lastStatusUpdate.current.set(msg.id, Date.now());
        });
        markAllMessagesAsRead(unreadReceivedMessages, currentUser._id);
        markAllMessagesAsDelivered(unreadReceivedMessages, currentUser._id);
      }
    }, [messages, currentUser?._id])
  );

  useEffect(() => {
    if (!currentChatId || !currentUser?._id) return; // Only set up socket after chat is ready
    let removeNewMessage, removeTyping, removeStatusUpdate;
    const setupSocket = async () => {
      try {
        await SocketManager.connect();
        setSocketStatus('connected');
        SocketManager.setActiveChat(currentChatId);
        SocketManager.joinChat(currentChatId);

        // Remove previous listeners if any
        if (removeNewMessage) removeNewMessage();
        if (removeTyping) removeTyping();
        if (removeStatusUpdate) removeStatusUpdate();

        // Listen for new messages
        removeNewMessage = SocketManager.onNewMessage(async (data) => {
          if (!isMountedRef.current) return; // Prevent updates after unmount
          if (data.chatId === currentChatId) {
            const isImage = data.message.messageType === 'image' || (typeof data.message.message === 'string' && (data.message.message.startsWith('http://') || data.message.message.startsWith('https://')) && (data.message.message.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)));
            const isAudio = data.message.messageType === 'audio' || (typeof data.message.message === 'string' && (data.message.message.startsWith('http://') || data.message.message.startsWith('https://')) && (data.message.message.match(/\.(m4a|mp3|wav|ogg|aac)$/i)));
            let status = 'sent';
            if (data.message.isRead) {
              status = 'read';
            } else if (data.message.isDelivered) {
              status = 'delivered';
            }
            const baseMessage = {
              time: new Date(data.message.timestamp),
              sent: data.message.senderId._id === userIdRef.current,
              id: data.message._id,
              status: status,
              senderId: data.message.senderId,
              isRead: data.message.isRead,
              messageType: data.message.messageType || 'text',
            };
            let newMessage;
            if (isImage) {
              newMessage = {
                ...baseMessage,
                image: data.message.message,
                messageType: 'image',
              };
            } else if (isAudio) {
              newMessage = {
                ...baseMessage,
                message: data.message.message,
                messageType: 'audio',
              };
            } else if (data.message.messageType && data.message.messageType.startsWith('call_')) {
              // Handle call event messages
              newMessage = {
                ...baseMessage,
                text: data.message.message,
                messageType: data.message.messageType,
                callData: data.message.callData || {},
              };
            } else {
              newMessage = {
                ...baseMessage,
                text: data.message.message,
              };
            }
            // Update tracking maps
            messageStatusMap.current.set(newMessage.id, 'read');
            lastStatusUpdate.current.set(newMessage.id, Date.now());
            setMessages((prev) => {
              const messageExists = prev.some(msg => msg.id === newMessage.id);
              if (messageExists) return prev;
              if (newMessage.sent) {
                // Handle sent messages - replace temporary message
                const updatedMessages = prev.map(msg => {
                  if (msg.isTemp && msg.text === newMessage.text && msg.sent) {
                    return { ...newMessage, status: 'sent' };
                  }
                  return msg;
                });
                const tempMessageReplaced = updatedMessages.some(msg => msg.id === newMessage.id && !msg.isTemp);
                if (!tempMessageReplaced) {
                  return [...updatedMessages, newMessage];
                }
                setTimeout(() => {
                  const currentStatus = messageStatusMap.current.get(newMessage.id);
                  if (currentStatus === 'sent') {
                    messageStatusMap.current.set(newMessage.id, 'delivered');
                    lastStatusUpdate.current.set(newMessage.id, Date.now());
                    setMessages(prev => prev.map(msg =>
                      msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
                    ));
                  }
                }, 1000);
                return updatedMessages;
              } else {
                // Handle received messages - mark as read immediately
                const messageToAdd = { ...newMessage, status: 'read', isRead: true };
                messageStatusMap.current.set(messageToAdd.id, 'read');
                lastStatusUpdate.current.set(messageToAdd.id, Date.now());
                // Mark as read on server (async)
                markMessageAsDelivered(messageToAdd.id);
                markMessageAsRead(messageToAdd.id)
                  
                // Add to AuthContext cache
                addMessageToCache(currentChatId, messageToAdd);
                return [...prev, messageToAdd];
              }
            });
          }
        });

        // Listen for typing events
        removeTyping = SocketManager.onTyping((data) => {
          if (!isMountedRef.current) return; // Prevent updates after unmount
          // Show typing indicator for any typing event in this chat (for debugging)
          if (data.chatId === currentChatId) {
            setOtherUserTyping(data.isTyping);
          }
        });

        // Listen for message status updates with improved logic
        removeStatusUpdate = SocketManager.onMessageStatusUpdate((data) => {
          if (!isMountedRef.current) return; // Prevent updates after unmount
          // Only allow status to progress forward
          setMessages(prev => {
            let updated = false;
            const statusOrder = { sent: 0, delivered: 1, read: 2 };
            const newMsgs = prev.map(msg => {
              if (msg.id === data.messageId) {
                updated = true;
                const currentStatusIndex = statusOrder[msg.status] ?? 0;
                const newStatusIndex = statusOrder[data.status] ?? 0;
                if (newStatusIndex < currentStatusIndex) {
                  // Ignore regression
                  return msg;
                }
                return {
                  ...msg,
                  status: data.status,
                  isRead: data.isRead !== undefined ? data.isRead : msg.isRead,
                  isDelivered: data.isDelivered !== undefined ? data.isDelivered : msg.isDelivered,
                };
              }
              return msg;
            });
            if (!updated) {
      
            }
            return newMsgs;
          });
          // Update tracking maps
          messageStatusMap.current.set(data.messageId, data.status);
          lastStatusUpdate.current.set(data.messageId, Date.now());
        });
      } catch (error) {
        // console.error('Error setting up socket:', error);
        setSocketStatus('error');
      }
    };
    setupSocket();
    return () => {
      isMountedRef.current = false; // Mark component as unmounted
      SocketManager.leaveChat(currentChatId);
      if (removeNewMessage) removeNewMessage();
      if (removeTyping) removeTyping();
      if (removeStatusUpdate) removeStatusUpdate();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      emitTypingStatus(false);
    };
  }, [currentChatId, currentUser?._id]);

  // Monitor socket connection status and sync message statuses
  useEffect(() => {
    const checkConnectionStatus = () => {
      const status = SocketManager.getConnectionStatus();
      if (status.isConnecting) {
        setSocketStatus('connecting');
      } else if (status.isConnected) {
        setSocketStatus('connected');
      } else {
        setSocketStatus('error');
      }
    };

    // Sync message statuses periodically
    const syncMessageStatuses = async () => {
      if (currentChatId && currentUser?._id) {
        try {
          const token = await AsyncStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/chat/history/${currentChatId}?limit=50`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const serverMessages = data.messages;
            
            setMessages(prev => {
              // Only add new messages from the backend, never update isRead/status for existing ones
              const existingIds = new Set(prev.map(m => m.id));
              const newMsgs = serverMessages
                .filter(sm => !existingIds.has(sm._id))
                .map(sm => ({
                  id: sm._id,
                  text: sm.message,
                  messageType: sm.messageType,
                  time: new Date(sm.timestamp),
                  sent: sm.senderId._id === currentUser._id,
                  status: sm.isRead ? 'read' : (sm.isDelivered ? 'delivered' : 'sent'),
                  senderId: sm.senderId,
                  isRead: sm.isRead,
                }));
              return [...prev, ...newMsgs];
            });
          }
        } catch (error) {
          // console.error('Error syncing message statuses:', error);
        }
      }
    };

    // Check status every 5 seconds
    const statusInterval = setInterval(checkConnectionStatus, 5000);
    
    // Sync message statuses every 30 seconds
    const syncInterval = setInterval(syncMessageStatuses, 30000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(syncInterval);
    };
  }, [currentChatId, currentUser?._id]);

  useEffect(() => {
    // Listen for incoming call
    // Listen for call response
    SocketManager.onCallResponse((data) => {
      console.log('🔔 [CHAT] Call response received:', data);
      console.log('🔔 [CHAT] Current outgoing call:', outgoingCall);
      
      if (!outgoingCall) {
        console.log('🔔 [CHAT] No outgoing call, ignoring response');
        return;
      }
      
      if (!data || !data.channelName) {
        console.error('🔔 [CHAT] Call response data missing channelName:', data);
        return;
      }
      
      if (data.channelName !== outgoingCall.channelName) {
        console.log('🔔 [CHAT] Channel name mismatch:', data.channelName, 'vs', outgoingCall.channelName);
        return;
      }
      if (data.response === 'accepted') {
        setOutgoingCallStatus('accepted');
        setShowOutgoingCallModal(false);
        
        // Clear missed call timeout if it exists
        if (outgoingCall.missedCallTimeout) {
          clearTimeout(outgoingCall.missedCallTimeout);
        }
        
        // Navigate to call screen with full parameters
        if (outgoingCall.callType === 'video') {
          navigation.navigate('VideoCall', {
            channelName: outgoingCall.channelName,
            agoraToken: outgoingCall.agoraToken,
            calleeId: outgoingCall.toUserId,
            contactName: displayUser?.username || displayUser?.name || 'User',
            contactImage: getImageSource(displayUser?.profilePicture || displayUser?.profilePictures?.[0]),
            chatId: currentChatId,
            currentUser: currentUser,
            otherUserId: outgoingCall.toUserId,
            callType: 'video',
            localUid: outgoingCall.localUid,
          });
        } else {
          navigation.navigate('VoiceCall', {
            channelName: outgoingCall.channelName,
            agoraToken: outgoingCall.agoraToken,
            calleeId: outgoingCall.toUserId,
            contactName: displayUser?.username || displayUser?.name || 'User',
            contactImage: getImageSource(displayUser?.profilePicture || displayUser?.profilePictures?.[0]),
            chatId: currentChatId,
            currentUser: currentUser,
            otherUserId: outgoingCall.toUserId,
            callType: 'voice',
            localUid: outgoingCall.localUid,
          });
        }
        setOutgoingCall(null);
      } else if (data.response === 'declined') {
        setOutgoingCallStatus('declined');
        
        // Clear missed call timeout if it exists
        if (outgoingCall.missedCallTimeout) {
          clearTimeout(outgoingCall.missedCallTimeout);
        }
        
        // Send call declined event message
        sendCallEventMessage({
          chatId: currentChatId,
          user: currentUser,
          otherUserId: outgoingCall.toUserId,
          callType: outgoingCall.callType,
          callStatus: 'declined',
          setMessages
        });
        
        setTimeout(() => {
          setShowOutgoingCallModal(false);
          setOutgoingCall(null);
        }, 1500);
      }
    });
    return () => {
      SocketManager.onCallResponse(() => {}); // Remove listener
    };
  }, [outgoingCall]);

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    setShowIncomingCallModal(false);
    SocketManager.emitCallResponse({
      toUserId: incomingCall.fromUserId,
      response: 'accepted',
      channelName: incomingCall.channelName,
      callType: incomingCall.callType,
    });
    
    // Send call started event message
    sendCallEventMessage({
      chatId: currentChatId,
      user: currentUser,
      otherUserId: incomingCall.fromUserId,
      callType: incomingCall.callType,
      callStatus: 'started',
      setMessages
    });
    
    if (incomingCall.callType === 'video') {
      navigation.navigate('VideoCall', {
        channelName: incomingCall.channelName,
        agoraToken: incomingCall.agoraToken,
        callerId: incomingCall.fromUserId,
        contactName: incomingCall.callerName || 'User',
        contactImage: incomingCall.callerAvatar || require('../../assets/model1.jpg'),
        chatId: currentChatId,
        currentUser: currentUser,
        otherUserId: incomingCall.fromUserId,
        callType: 'video',
        localUid: Math.floor(Math.random() * 1000000),
      });
    } else {
      navigation.navigate('VoiceCall', {
        channelName: incomingCall.channelName,
        agoraToken: incomingCall.agoraToken,
        callerId: incomingCall.fromUserId,
        contactName: incomingCall.callerName || 'User',
        contactImage: incomingCall.callerAvatar || require('../../assets/model1.jpg'),
        chatId: currentChatId,
        currentUser: currentUser,
        otherUserId: incomingCall.fromUserId,
        callType: 'voice',
        localUid: Math.floor(Math.random() * 1000000),
      });
    }
  };

  const handleDeclineCall = () => {
    if (!incomingCall) return;
    setShowIncomingCallModal(false);
    SocketManager.emitCallResponse({
      toUserId: incomingCall.fromUserId,
      response: 'declined',
      channelName: incomingCall.channelName,
      callType: incomingCall.callType,
    });
    
    // Send call declined event message
    sendCallEventMessage({
      chatId: currentChatId,
      user: currentUser,
      otherUserId: incomingCall.fromUserId,
      callType: incomingCall.callType,
      callStatus: 'declined',
      setMessages
    });
    
    setIncomingCall(null);
  };

  // Function to emit typing status with immediate stop on send
  const emitTypingStatus = (isTyping) => {
    if (!currentChatId || !SocketManager.isConnected) {
      return;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Clear existing debounce
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    if (isTyping) {
      // Emit typing start immediately
      SocketManager.emitTyping(currentChatId, true);

      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        SocketManager.emitTyping(currentChatId, false);
      }, 3000);
    } else {
      // Stop typing immediately (no debounce for stopping)
      SocketManager.emitTyping(currentChatId, false);
    }
  };

  // Function to immediately stop typing (called when message is sent)
  const stopTypingImmediately = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }
    setIsTyping(false);
    SocketManager.emitTyping(currentChatId, false);
  };

  const handleInputFocus = () => {
    setIsTyping(true);
    emitTypingStatus(true);
  };

  const handleInputBlur = () => {
    setIsTyping(false);
    emitTypingStatus(false);
  };

  const handleChangeText = (text) => {
    setMessage(text);
    // Always emit typing status on every keystroke
    if (text.length > 0) {
      setIsTyping(true);
      emitTypingStatus(true);
    } else {
      setIsTyping(false);
      emitTypingStatus(false);
    }
  };

  const renderMessageStatus = (status) => {
    switch (status) {
      case 'sending':
        return (
          <View style={{ marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.sendingDot} />
          </View>
        );
      case 'sent':
        return <Image source={sentImg} style={{ width: 16, height: 8, marginLeft: 4, resizeMode: 'contain' }} />;
      case 'delivered':
        return <Image source={sentImg} style={{ width: 16, height: 8, marginLeft: 4, resizeMode: 'contain' }} />;
      case 'read':
        return <Image source={readImg} style={{ width: 16, height: 8, marginLeft: 4, resizeMode: 'contain' }} />;
      default:
        return <Image source={sentImg} style={{ width: 16, height: 8, marginLeft: 4, resizeMode: 'contain' }} />;
    }
  };

  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null;

    return (
      <View style={{ alignItems: 'flex-start', marginBottom: 8, paddingHorizontal: 16 }}>
        <View style={styles.receivedBubble}>
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>{currentUser ? currentUser.username : 'Unknown User'} is typing...</Text>
            <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
            <Animated.View style={[styles.typingDot, { opacity: typingAnimation, marginLeft: 4 }]} />
            <Animated.View style={[styles.typingDot, { opacity: typingAnimation, marginLeft: 4 }]} />
          </View>
        </View>
      </View>
    );
  };



  // Voice message bubble UI
  const VoiceMessageBubble = ({ isSent, isRecording, isPlay }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity style={{ marginRight: 8 }}>
        <Ionicons name={isRecording ? 'pause' : (isPlay ? 'play' : 'pause')} size={18} color={isSent ? '#fff' : '#121212'} />
      </TouchableOpacity>
      <Image source={isSent ? waveformImg : blackwave} style={{ height: 24, width: 121 }} />
    </View>
  );

  // Receiver recording animation bubble
  const ReceiverRecordingBubble = React.memo(({ animation }) => (
    <View style={[styles.receivedBubble, { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 }]}> 
      <Animated.View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#ff2d7a',
          marginRight: 8,
          opacity: animation,
        }}
      />
      <Ionicons name="mic" size={18} color="#ff2d7a" />
    </View>
  ));

  // For inverted FlatList, we need to reverse the messages so newest appear at bottom
  // Also depends on currentDate to force re-grouping when date changes
  const groupedMessages = useMemo(() => {
    return groupMessagesByTime([...messages].reverse());
  }, [messages, currentDate]);
  
  // Force re-grouping when date changes to update date dividers
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());
  
  useEffect(() => {
    const checkDateChange = () => {
      const today = new Date().toDateString();
      if (today !== currentDate) {
        setCurrentDate(today);
      }
    };
    
    // Check for date change every minute
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);
  const audioRecorder = useAudioRecorder();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Helper to generate consistent channel name
  const getChannelName = (callerId, receiverId) => {
    if (!callerId || !receiverId) {
      console.error('❌ Cannot generate channel name: missing callerId or receiverId');
      return null;
    }
    // Ensure consistent ordering for the same two users
    const sortedIds = [callerId, receiverId].sort();
    return `${sortedIds[0]}-${sortedIds[1]}-${Date.now()}`;
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Cleanup effect: stop and unload recording on unmount or chat leave
  useEffect(() => {
    console.log('🧹 [CHAT] Cleanup effect created');
    return () => {
      console.log('🧹 [CHAT] Cleanup effect triggered');
      console.log('🧹 [CHAT] Current audio state:', { 
        isRecording: audioRecorder.isRecording, 
        isPaused: audioRecorder.isPaused 
      });
      // Only cleanup if not actively recording to prevent interference
      if (!audioRecorder.isRecording) {
        console.log('🧹 [CHAT] Calling cleanupRecording');
        audioRecorder.cleanupRecording();
      } else {
        console.log('🧹 [CHAT] Skipping cleanup - recording is active');
      }
    };
  }, []); // Remove dependency to prevent recreation

  const handleMicPress = async () => {
    console.log('🎤 [CHAT] handleMicPress called');
    console.log('🎤 [CHAT] Current audio state:', { 
      isRecording: audioRecorder.isRecording, 
      isPaused: audioRecorder.isPaused 
    });
    
    if (audioRecorder.isRecording) {
      console.log('⚠️ [CHAT] Already recording, ignoring mic press');
      return;
    }
    
    console.log('🎤 [CHAT] Starting recording...');
    await audioRecorder.startRecording();
  };

  const handlePauseResume = async () => {
    console.log('⏸️ [CHAT] handlePauseResume called');
    console.log('⏸️ [CHAT] Current audio state:', { 
      isRecording: audioRecorder.isRecording, 
      isPaused: audioRecorder.isPaused 
    });
    
    if (!audioRecorder.isRecording) {
      console.log('⚠️ [CHAT] Not recording, ignoring pause/resume');
      return;
    }
    
    if (audioRecorder.isPaused) {
      console.log('▶️ [CHAT] Resuming recording...');
      await audioRecorder.resumeRecording();
    } else {
      console.log('⏸️ [CHAT] Pausing recording...');
      await audioRecorder.pauseRecording();
    }
  };

  const handleDeleteRecording = async () => {
    console.log('🗑️ [CHAT] handleDeleteRecording called');
    console.log('🗑️ [CHAT] Current audio state:', { 
      isRecording: audioRecorder.isRecording, 
      isPaused: audioRecorder.isPaused 
    });
    
    if (!audioRecorder.isRecording) {
      console.log('⚠️ [CHAT] Not recording, ignoring delete');
      return;
    }
    
    console.log('🗑️ [CHAT] Deleting recording...');
    await audioRecorder.deleteRecording();
  };

  const handleSendRecording = async () => {
    console.log('📤 [CHAT] handleSendRecording called');
    console.log('📤 [CHAT] Current audio state:', { 
      isRecording: audioRecorder.isRecording, 
      isPaused: audioRecorder.isPaused 
    });
    
    if (!audioRecorder.isRecording) return;
    
    try {
      const uri = await audioRecorder.stopRecording();
      
      // Add temporary message immediately with stable properties
      const tempMessageId = `temp_${Date.now()}`;
      const tempMessage = {
        id: tempMessageId,
        message: uri, // Use local URI temporarily
        messageType: 'audio',
        time: new Date(),
        sent: true,
        status: 'sending',
        isTemp: true,
        // Add stable properties to prevent unnecessary re-renders
        senderId: currentUser?._id,
        receiverId: resolvedSenderId,
        chatId: currentChatId,
      };
      setMessages(prev => [...prev, tempMessage]);
      
      if (uri && currentUser?._id && currentChatId && resolvedSenderId) {
        try {
          const token = await AsyncStorage.getItem('token');
          const formData = new FormData();
          formData.append('audio', {
            uri,
            name: 'audio_message.m4a',
            type: 'audio/m4a',
          });
          
          const uploadRes = await fetch(`${API_BASE_URL}/upload-audio`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
            body: formData,
          });
          
          if (!uploadRes.ok) throw new Error('Failed to upload audio');
          const uploadData = await uploadRes.json();
          let audioUrl = uploadData.url;
          
          if (audioUrl && !audioUrl.startsWith('http')) {
            audioUrl = `https://d11n4tndq0o4wh.cloudfront.net/${audioUrl.replace(/^\/+/,'')}`;
          }
          
          const sendRes = await fetch(`${API_BASE_URL}/chat/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              senderId: currentUser._id,
              receiverId: resolvedSenderId,
              chatId: currentChatId,
              message: audioUrl,
              messageType: 'audio',
            }),
          });
          
          if (!sendRes.ok) throw new Error('Failed to send audio message');
          
          // Update temp message with real URL - use minimal update to prevent flickering
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessageId ? {
              ...msg,
              message: audioUrl,
              isTemp: false,
              status: 'sent',
              messageType: 'audio',
              // Preserve exact same references for stable properties
              time: msg.time,
              sent: msg.sent,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              chatId: msg.chatId,
            } : msg
          ));
          
        } catch (err) {
          console.error('❌ [CHAT] Error sending audio:', err);
          // Remove temp message on error
          setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
          Alert.alert('Error', 'Failed to send audio message');
        }
      }
    } catch (e) {
      console.error('❌ [CHAT] Failed to stop recording', e);
    }
  };

  // Only show loading if essential data is missing
  if (!displayUser || !currentChatId) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#121212' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: '#121212', flex: 1 }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('ChatScreen')} style={styles.headerLeft}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.avatar, { backgroundColor: '#333' }]} />
                <Text style={styles.name}>Loading...</Text>
              </View>
            </View>
            <View style={{ flex: 1 }} />
          </View>
          
          {/* Minimal loading indicator */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#ff2d7a" />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#121212' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Outgoing Call Modal */}
      <Modal
        visible={showOutgoingCallModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOutgoingCallModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', width: 300 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>{outgoingCall?.callType === 'video' ? 'Video' : 'Voice'} Call</Text>
            <Text style={{ fontSize: 16, marginBottom: 24 }}>Calling: {displayUser?.username || displayUser?.name || 'User'}</Text>
            {outgoingCallStatus === 'ringing' && <Text style={{ color: '#888', marginBottom: 12 }}>Ringing...</Text>}
            {outgoingCallStatus === 'accepted' && <Text style={{ color: '#4CAF50', marginBottom: 12 }}>Call accepted!</Text>}
            {outgoingCallStatus === 'declined' && <Text style={{ color: '#F44336', marginBottom: 12 }}>Call declined</Text>}
            {outgoingCallStatus === 'timeout' && <Text style={{ color: '#F44336', marginBottom: 12 }}>No answer</Text>}
            <TouchableOpacity onPress={() => { setShowOutgoingCallModal(false); setOutgoingCall(null); }} style={{ backgroundColor: '#F44336', padding: 16, borderRadius: 8, marginTop: 16 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Incoming Call Modal */}
      <Modal
        visible={showIncomingCallModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIncomingCallModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', width: 300 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Incoming {incomingCall?.callType === 'video' ? 'Video' : 'Voice'} Call</Text>
            <Text style={{ fontSize: 16, marginBottom: 24 }}>From: {incomingCall?.fromUserId || 'Unknown'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity onPress={handleAcceptCall} style={{ backgroundColor: '#4CAF50', padding: 16, borderRadius: 8, flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeclineCall} style={{ backgroundColor: '#F44336', padding: 16, borderRadius: 8, flex: 1, marginLeft: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <SafeAreaView style={[styles.container, { backgroundColor: '#121212', flex: 1 }]}> 
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('ChatScreen')} style={styles.headerLeft}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          {/* Group avatar, name, and verified icon in a row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            {displayUser ? (
              <>
                <Image source={getImageSource(displayUser?.profilePicture || displayUser?.profilePictures?.[0])} style={styles.avatar} />
                <Text style={styles.name}>{displayUser?.username || displayUser?.name || 'User'}</Text>
                {(displayUser?.verified || displayUser?.verificationStatus === 'true') && (
                  <MaterialIcons name="verified" size={18} color="#ff2d7a" style={{ marginLeft: 4 }} />
                )}
              </>
            ) : (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            )}
          </View>
          <View style={{ flex: 1 }} />
          
          {/* Connection Status Indicator */}
          {socketStatus !== 'connected' && (
            <View style={styles.connectionStatus}>
              <View style={[styles.statusDot, { backgroundColor: socketStatus === 'error' ? '#ff4444' : '#ffaa00' }]} />
              <Text style={styles.statusText}>
                {socketStatus === 'error' ? 'Reconnecting...' : 'Connecting...'}
              </Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.headerIcon} onPress={() => setCallModalVisible(true)}>
            <Image source={phoneplusImg} style={{ width: 20, height: 20 }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => setMenuVisible((v) => !v)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Call Modal */}
        <CallModal
          visible={callModalVisible}
          onClose={() => setCallModalVisible(false)}
          onVoiceCallPress={() => { 
            setCallModalVisible(false); 
            
            if (!currentUser?._id || !resolvedSenderId) {
              Alert.alert('Error', 'Call cannot be initiated. Missing user information.');
              return;
            }
            
            const channelName = getChannelName(currentUser._id, resolvedSenderId);
            if (!channelName) {
              Alert.alert('Error', 'Failed to create call channel.');
              return;
            }
            
            console.log('🔊 Initiating voice call with channel:', channelName);
            
            // Emit call_user event
            SocketManager.emitCallUser({
              toUserId: resolvedSenderId,
              fromUserId: currentUser._id,
              callType: 'voice',
              channelName,
              callerName: currentUser.username || currentUser.name || 'User',
              callerAvatar: currentUser.profilePicture || (currentUser.profilePictures && currentUser.profilePictures[0]) || null,
              chatId: currentChatId,
            });
            
            // Set up missed call detection
            const missedCallTimeout = setTimeout(() => {
              if (showOutgoingCallModal) {
                sendCallEventMessage({
                  chatId: currentChatId,
                  user: currentUser,
                  otherUserId: resolvedSenderId,
                  callType: 'voice',
                  callStatus: 'missed',
                  setMessages
                });
                setShowOutgoingCallModal(false);
                setOutgoingCall(null);
              }
            }, 30000);
            
            setOutgoingCall({ 
              toUserId: resolvedSenderId, 
              callType: 'voice', 
              channelName,
              missedCallTimeout 
            });
            
            // Navigate with all required parameters
            navigation.navigate('VoiceCall', {
              channelName: channelName, // This is the critical parameter that was missing
              contactName: displayUser?.username || displayUser?.name || 'User',
              contactImage: getImageSource(displayUser?.profilePicture || displayUser?.profilePictures?.[0]),
              chatId: currentChatId,
              currentUser: currentUser,
              otherUserId: resolvedSenderId,
              callType: 'voice',
              localUid: Math.floor(Math.random() * 1000000), // Generate a random UID for this call
            }); 
          }}
          onVideoCallPress={() => { 
            setCallModalVisible(false); 
            
            if (!currentUser?._id || !resolvedSenderId) {
              Alert.alert('Error', 'Call cannot be initiated. Missing user information.');
              return;
            }
            
            const channelName = getChannelName(currentUser._id, resolvedSenderId);
            if (!channelName) {
              Alert.alert('Error', 'Failed to create call channel.');
              return;
            }
            
            console.log('📹 Initiating video call with channel:', channelName);
            
            // Emit call_user event
            SocketManager.emitCallUser({
              toUserId: resolvedSenderId,
              fromUserId: currentUser._id,
              callType: 'video',
              channelName,
              callerName: currentUser.username || currentUser.name || 'User',
              callerAvatar: currentUser.profilePicture || (currentUser.profilePictures && currentUser.profilePictures[0]) || null,
              chatId: currentChatId,
            });
            
            // Set up missed call detection
            const missedCallTimeout = setTimeout(() => {
              if (showOutgoingCallModal) {
                sendCallEventMessage({
                  chatId: currentChatId,
                  user: currentUser,
                  otherUserId: resolvedSenderId,
                  callType: 'video',
                  callStatus: 'missed',
                  setMessages
                });
                setShowOutgoingCallModal(false);
                setOutgoingCall(null);
              }
            }, 30000);
            
            setOutgoingCall({ 
              toUserId: resolvedSenderId, 
              callType: 'video', 
              channelName,
              missedCallTimeout 
            });
            
            // Navigate with all required parameters
            navigation.navigate('VideoCall', {
              channelName: channelName, // This is the critical parameter that was missing
              contactName: displayUser?.username || displayUser?.name || 'User',
              contactImage: getImageSource(displayUser?.profilePicture || displayUser?.profilePictures?.[0]),
              chatId: currentChatId,
              currentUser: currentUser,
              otherUserId: resolvedSenderId,
              callType: 'video',
              localUid: Math.floor(Math.random() * 1000000), // Generate a random UID for this call
            }); 
          }}
          styles={styles}
        />

        {/* Dropdown Menu */}
        <DropdownMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onViewProfilePress={() => { setMenuVisible(false); }}
          onCancelConnectionPress={() => {
            setMenuVisible(false);
            setCancelModalVisible(true);
          }}
          onBlockPress={async () => {
            setMenuVisible(false);
            Alert.alert(
              'Block',
              'Are you sure you want to block this user? This action cannot be undone.',
              [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', style: 'destructive', onPress: async () => {
                  try {
                    const token = await AsyncStorage.getItem('token');
                    const res = await fetch(`${API_BASE_URL}/auth/block-user`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({ targetUserId: resolvedSenderId }),
                    });
                    if (res.ok) {
                      Alert.alert('User blocked', 'You have blocked this user and removed the connection.');
                      navigation.goBack();
                    } else {
                      const data = await res.json().catch(() => ({}));
                      Alert.alert('Error', data.error || 'Failed to block user.');
                    }
                  } catch (err) {
                    Alert.alert('Error', 'Failed to block user.');
                  }
                }},
              ]
            );
          }}
          onReportPress={() => { setMenuVisible(false); Alert.alert('Report', 'Are you sure you want to report this user?'); }}
          styles={styles}
        />

        {/* Cancel Connection Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={cancelModalVisible}
          onRequestClose={() => setCancelModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCancelModalVisible(false)}>
            <View style={styles.modalContent}>
              <View style={styles.xIconContainer}>
                <FontAwesome6 name="xmark" size={67} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Are you sure you want to cancel this connection?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmModalButton]}
                  disabled={cancelLoading}
                  onPress={async () => {
                    setCancelLoading(true);
                    try {
                      const token = await AsyncStorage.getItem('token');
                      const res = await fetch(`${API_BASE_URL}/auth/cancel-connection`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ targetUserId: resolvedSenderId }),
                      });
                      if (res.ok) {
                        setCancelModalVisible(false);
                        Alert.alert('Connection cancelled', 'You have cancelled this connection.');
                        navigation.goBack({
                          params: {
                            connectionCanceled: true,
                            canceledUserId: resolvedSenderId
                          }
                        });
                      } else {
                        const data = await res.json().catch(() => ({}));
                        Alert.alert('Error', data.error || 'Failed to cancel connection.');
                      }
                    } catch (err) {
                      Alert.alert('Error', 'Failed to cancel connection.');
                    } finally {
                      setCancelLoading(false);
                    }
                  }}
                >
                  <Text style={styles.modalButtonTextConfirm}>{cancelLoading ? 'Please wait...' : 'Yes'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  disabled={cancelLoading}
                  onPress={() => setCancelModalVisible(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={groupedMessages}
          inverted={true}
          keyExtractor={(item, index) => `group-${index}`}
          renderItem={({ item: group, index: groupIdx }) => {
            // Handle date dividers
            if (group.type === 'dateDivider') {
              return (
                <View style={{marginBottom:16, alignItems:'center', marginTop: 8}}>
                  <Text style={{color:'#888'}}>{group.date}</Text>
                </View>
              );
            }
            
            // Handle message groups
            if (group.type === 'messageGroup') {
              // Determine the lowest status in the group (sent < delivered < read)
              const statusOrder = { sending: 0, sent: 1, delivered: 2, read: 3 };
              let groupStatus = group.messages.reduce((acc, msg) => {
                const idx = statusOrder[msg.status] ?? 0;
                return idx < acc ? idx : acc;
              }, 3); // Start with 'read' as max
              // Find the status string for the lowest status
              const statusStrings = Object.keys(statusOrder);
              const lowestStatus = statusStrings.find(key => statusOrder[key] === groupStatus) || 'sent';
              
              return (
                <View style={{ marginBottom: 8 }}>
                  {group.messages.map((msg, msgIdx) => {
                    // Handle call event messages
                    if (msg.messageType && msg.messageType.startsWith('call_')) {
                      return (
                        <CallEventMessage 
                          key={msgIdx} 
                          message={msg} 
                          isSent={group.sent} 
                        />
                      );
                    }
                    
                    return (
                      <View key={msgIdx} style={group.sent ? styles.sentMessageContainer : styles.receivedMessageContainer}>
                        {(msg.image || (msg.messageType === 'image' && msg.message)) ? (
                          <View style={{ borderRadius: 8, maxWidth: 220, overflow: 'hidden', backgroundColor: 'transparent', padding: 0 }}>
                            <ChatImage uri={msg.image || msg.message} />
                          </View>
                        ) : msg.messageType === 'audio' && msg.message ? (
                          <View style={group.sent ? styles.sentBubble : styles.receivedBubble}>
                            <AudioMessageBubble uri={msg.message} isSent={group.sent} />
                          </View>
                        ) : (
                          <View style={group.sent ? styles.sentBubble : styles.receivedBubble}>
                            {msg.audio ? (
                              <VoiceMessageBubble isSent={group.sent} isRecording={!!msg.isRecording} isPlay={!group.sent && !msg.isRecording} />
                            ) : (
                              <Text style={group.sent ? styles.sentText : styles.receivedText}>{msg.text || msg.message}</Text>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                  <View style={group.sent ? styles.sentTimeContainer : styles.receivedTimeContainer}>
                    <Text style={styles.messageTime}>
                        {group.time && group.time instanceof Date ? group.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 
                         group.time && typeof group.time === 'string' ? new Date(group.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) :
                         'Unknown time'}
                    </Text>
                    {group.sent && group.messages.length > 0 && renderMessageStatus(lowestStatus)}
                  </View>
                </View>
              );
            }
            
            return null;
          }}
          ListHeaderComponent={() => (
            <>
              {/* Info Text, only if no messages sent */}
              {messages.length === 0 && (
                <Text style={styles.infoText}>
                  You're now connected with <Text style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>{displayUser ? displayUser.name : 'Unknown User'}</Text>. Start the conversation with a friendly hello!
                </Text>
              )}
              
              {/* Receiver recording animation bubble */}
              {showReceiverRecording && (
                <View style={styles.receivedMessageContainer}>
                  <ReceiverRecordingBubble animation={typingAnimation} />
                </View>
              )}
              {renderTypingIndicator()}
            </>
          )}
          contentContainerStyle={{ 
            padding: 16, 
            paddingTop: 0, 
            flexGrow: 1,
            justifyContent: messages.length === 0 ? 'center' : 'flex-start'
          }}
          onScrollToIndexFailed={() => {}}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />

        {/* Plus Modal */}
        <PlusModal
          visible={plusModalVisible}
          onClose={() => setPlusModalVisible(false)}
          onGallerySelect={() => handleGallerySelect({
            chatId: currentChatId,
            user: currentUser,
            otherUserId: resolvedSenderId,
            setMessages,
            setPlusModalVisible,
            emitTypingStatus
          })}
          onAudioSelect={() => { setPlusModalVisible(false); Alert.alert('Audio', 'Audio feature coming soon!'); }}
          styles={styles}
        />



        {/* Message Input */}
        {audioRecorder.isRecording ? (
          <AudioWaveformRecorder
            isRecording={audioRecorder.isRecording}
            isPaused={audioRecorder.isPaused}
            recordingDuration={audioRecorder.duration}
            onPauseResume={handlePauseResume}
            onDelete={handleDeleteRecording}
            onSend={handleSendRecording}
            audioUri={audioRecorder.audioUri}
            formatTime={formatTime}
          />
        ) : (
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity onPress={() => setPlusModalVisible(true)} style={styles.plusButton}>
              <Ionicons name="add-circle" size={32} color="#fff" />
            </TouchableOpacity>
            <View style={styles.inputBubble}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={message}
                onFocus={handleInputFocus}
                onChangeText={handleChangeText}
                onBlur={handleInputBlur}
                onSubmitEditing={() => {
                  if (!currentUser || !currentUser._id || !currentChatId || !resolvedSenderId) {
                    Alert.alert('Error', 'Chat is not ready. Please try again later.');
                    return;
                  }
                  handleSend({ message, chatId: currentChatId, user: currentUser, otherUserId: resolvedSenderId, setMessage, setIsTyping, inputRef, setMessages, emitTypingStatus });
                  // Add log for notification target
          
                  stopTypingImmediately();
                }}
                multiline
                returnKeyType="send"
                editable={!!currentChatId}
              /> 
            </View>
            {message.trim() ? (
              <TouchableOpacity style={styles.sendButton} onPress={() => {
                if (!currentUser || !currentUser._id || !currentChatId || !resolvedSenderId) {
                  Alert.alert('Error', 'Chat is not ready. Please try again later.');
                  return;
                }
                handleSend({ message, chatId: currentChatId, user: currentUser, otherUserId: resolvedSenderId, setMessage, setIsTyping, inputRef, setMessages, emitTypingStatus });
                stopTypingImmediately();
              }} disabled={!currentChatId}>
                <Ionicons name="send" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.micButton}
                onPress={handleMicPress}
              >
                <Ionicons name={audioRecorder.isRecording ? 'mic-outline' : 'mic'} size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8, 
    borderBottomWidth:1,
    borderColor:'rgba(255, 255, 255, 0.5)',
    paddingRight: 24,
    paddingLeft: 8,
  },
  headerLeft: {
    marginRight: 6,
    padding: 4,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
  },
  name: {
    color: '#fff',
    // fontWeight: 'bold', // commented out
    fontSize: 17,
    marginRight: 4,
    // fontFamily: 'YourFontFamily', // commented out if present
  },
  headerIcon: {
    marginLeft: 24,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  sendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',
    opacity: 0.6,
  },
  infoText: {
    color: '#bbb',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 10,
    lineHeight: 20,
    opacity: 0.5,
    marginHorizontal:16
  },
  inputContainer: {
    backgroundColor: '#121212',
    paddingHorizontal: 12,
    paddingBottom: -8,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusButton: {
    marginRight: 8,
    alignSelf: 'center',
  },
  inputBubble: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 90,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    minHeight: 40,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff2d7a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ec066a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 120,
    right: 24,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingVertical: 6,
    width: 200,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    // fontWeight: '400', // commented out
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  // Message styles
  sentMessageContainer: {
    alignItems: 'flex-end',
    marginTop:8,
  },
  receivedMessageContainer: {
    alignItems: 'flex-start',
    marginTop:8,
  },
  sentBubble: {
    backgroundColor: '#ec066a',
    borderRadius: 8,
    borderBottomRightRadius:4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    maxWidth: '72%',
  },
  receivedBubble: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderBottomLeftRadius:4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    maxWidth: '72%',
  },
  sentText: {
    color: '#fff',
    fontSize: 16,
    // fontWeight: 'bold', // commented out if present
    // fontFamily: 'YourFontFamily', // commented out if present
  },
  receivedText: {
    color: '#121212',
    fontSize: 16,
    // fontWeight: 'bold', // commented out if present
    // fontFamily: 'YourFontFamily', // commented out if present
  },
  sentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  receivedTimeContainer: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  messageTime: {
    color: '#bbb',
    fontSize: 11,
    opacity: 0.7,
  },
  // Typing indicator styles
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#bbb',
  },
  typingText: {
    color: '#121212',
    fontSize: 14,
    marginRight: 8,
    fontStyle: 'italic',
    // fontWeight: 'bold', // commented out if present
    // fontFamily: 'YourFontFamily', // commented out if present
  },
  // Emoji picker styles
  emojiPicker: {
    backgroundColor: '#1e1e1e',
    maxHeight: 300,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: '#333',
  },
  emojiCategories: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingHorizontal: 16,
  },
  emojiCategoryTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  emojiCategoryTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff2d7a',
  },
  emojiCategoryText: {
    color: '#bbb',
    fontSize: 12,
    // fontWeight: '500', // commented out
  },
  emojiCategoryTextActive: {
    color: '#ff2d7a',
    // fontWeight: '500', // commented out
  },
  emojiGrid: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 16,
  },
  emojiButton: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  xIconContainer: {
    width: 104,
    height: 104,
    backgroundColor: '#dc3545',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight:'600',
    textAlign: 'center',
    marginBottom:12,
    lineHeight: 32, 
    fontFamily: 'FONTS.regular',
    paddingHorizontal: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 90,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelModalButton: {
    borderWidth: 1,
    borderColor: '#ec066a',
  },
  confirmModalButton: {
    backgroundColor: '#ec066a',
  },
  modalButtonTextCancel: {
    color: '#ec066a',
    fontWeight:'600',
    fontSize: 24,
    fontFamily: 'FONTS.regular',
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight:'600',
    fontFamily: 'FONTS.regular',
  },
  callModal: {
    position: 'absolute',
    top: 60,
    right: 24,
    backgroundColor: '#232323',
    borderRadius: 14,
    paddingVertical: 8,
    width: 160,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  callModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  callModalText: {
    color: '#fff',
    fontSize: 16,
    // fontWeight: '500', // commented out
  },
  plusModal: {
    position: 'absolute',
    bottom: 105, // adjust as needed to sit above the input
    left: 16,
    backgroundColor: '#232323',
    borderRadius: 14,
    paddingVertical: 8,
    width: 128,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  plusModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  plusModalText: {
    color: '#fff',
    fontSize: 15,
    // fontWeight: '500', // commented out
  },
});