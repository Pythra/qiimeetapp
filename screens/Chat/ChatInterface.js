import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Platform, ScrollView, Animated, Modal, Alert, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../frontend.env.js';
import { Audio } from 'expo-av';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import * as FileSystem from 'expo-file-system';

import smileyImg from '../../assets/smiley.png';
import readImg from '../../assets/read.png';
import sentImg from '../../assets/sent.png';
import phoneplusImg from '../../assets/phoneplus.png';
import waveformImg from '../../assets/waveform.png';
import blackwave from '../../assets/blackwave.png'; 
import SocketManager from '../../utils/socket';
import { groupMessagesByTime, handleSend, handleGallerySelect, handleMicPress, markMessageAsRead, markAllMessagesAsRead, markAllMessagesAsDelivered, markMessageAsDelivered } from './components/ChatFunctions';
import { CallModal, PlusModal, DropdownMenu } from './components/ChatModals';

 

// Add ChatImage component for dynamic image sizing
const ChatImage = ({ uri }) => {
  const [imageHeight, setImageHeight] = useState(200); // fallback height
  const imageWidth = 280; // or any fixed width
  const [loading, setLoading] = useState(true);
  const [opacity, setOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (uri) {
      Image.getSize(uri, (width, height) => {
        const scaleFactor = imageWidth / width;
        const scaledHeight = height * scaleFactor;
        setImageHeight(scaledHeight);
      }, (error) => {
        console.log('Error loading image:', error);
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
    <View style={{ width: imageWidth, height: imageHeight, borderRadius: 8, alignSelf: 'flex-start', backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      {loading && (
        <ActivityIndicator size="small" color="#ff2d7a" style={{ position: 'absolute', alignSelf: 'center', zIndex: 1 }} />
      )}
      <Animated.Image
        source={{ uri }}
        style={{
          width: imageWidth,
          height: imageHeight,
          borderRadius: 8,
          opacity: opacity,
        }}
        resizeMode="cover"
        onLoad={onLoad}
      />
    </View>
  );
};

// Audio message bubble with playback
const AudioMessageBubble = ({ uri, isSent }) => {
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [controlsOpacity] = useState(new Animated.Value(0));
  const [localUri, setLocalUri] = useState(null);

  // Log the audio URI for debugging
  useEffect(() => {
    // console.log('AudioMessageBubble uri:', uri);
  }, [uri]);

  // Audio caching logic
  useEffect(() => {
    let isMounted = true;
    const cacheAudio = async () => {
      if (!uri) return;
      try {
        const fileName = uri.split('/').pop();
        const localPath = `${FileSystem.cacheDirectory}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          if (isMounted) setLocalUri(localPath);
        } else {
          const downloadRes = await FileSystem.downloadAsync(uri, localPath);
          if (isMounted) setLocalUri(downloadRes.uri);
        }
      } catch (err) {
        console.error('Audio cache error:', err);
        if (isMounted) setLocalUri(uri); // fallback to remote
      }
    };
    cacheAudio();
    return () => { isMounted = false; };
  }, [uri]);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      controlsOpacity.setValue(0);
    }
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (sound) {
        // console.log('Cleaning up audio sound');
        sound.unloadAsync().catch(err => console.error('Error unloading sound on cleanup:', err));
      }
    };
  }, [sound]);

  // Reset sound when URI changes
  useEffect(() => {
    if (sound) {
      // console.log('URI changed, unloading previous sound');
      sound.unloadAsync().catch(err => console.error('Error unloading sound on URI change:', err));
      setSound(undefined);
      setIsPlaying(false);
      setPosition(0);
    }
  }, [uri]);

  const onPlaybackStatusUpdate = (status) => {
    // console.log('Audio playback status update:', status);
    
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        // console.log('Audio playback finished');
        if (sound) {
          sound.unloadAsync().catch(err => console.error('Error unloading finished sound:', err));
        }
        setSound(undefined);
        setIsPlaying(false);
        setPosition(0);
      }
    } else if (status.error) {
      // console.error('Audio playback error:', status.error);
      setIsPlaying(false);
      if (sound) {
        sound.unloadAsync().catch(err => console.error('Error unloading sound on error:', err));
      }
      setSound(undefined);
      setPosition(0);
    }
  };

  const handlePlayPause = async () => {
    if (isLoading) return;
    
    try {
      if (!sound) {
        // Create and play new sound
        setIsLoading(true);
        // console.log('Creating new audio sound for URI:', uri);
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: localUri || uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        
        setSound(newSound);
        setIsPlaying(true);
        // console.log('Audio started playing');
      } else {
        // Handle existing sound
        const status = await sound.getStatusAsync();
        // console.log('Current audio status:', status);
        
        if (status.isPlaying) {
          // Pause the sound
          await sound.pauseAsync();
          setIsPlaying(false);
          // console.log('Audio paused');
        } else {
          if (status.positionMillis >= status.durationMillis) {
            // Sound finished, restart it
            // console.log('Audio finished, restarting');
            await sound.unloadAsync();
            setSound(undefined);
            setIsPlaying(false);
            setPosition(0);
            
            setIsLoading(true);
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: localUri || uri },
              { shouldPlay: true },
              onPlaybackStatusUpdate
            );
            setSound(newSound);
            setIsPlaying(true);
          } else {
            // Resume playing
            // console.log('Resuming audio playback');
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      }
    } catch (error) {
      console.error('Error handling audio play/pause:', error);
      Alert.alert('Audio Error', 'Could not play this audio file.');
      // Reset state on error
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (unloadError) {
          console.error('Error unloading sound:', unloadError);
        }
      }
      setSound(undefined);
      setIsPlaying(false);
      setPosition(0);
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 220 }}>
      <TouchableOpacity onPress={handlePlayPause} style={{ marginRight: 8 }} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color={isSent ? '#fff' : '#121212'} />
        ) : (
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={isSent ? '#fff' : '#121212'} />
        )}
      </TouchableOpacity>
      <Image 
        source={isSent ? require('../../assets/waveform.png') : require('../../assets/blackwave.png')} 
        style={isSent 
          ? { height: 24, width: 121, resizeMode: 'contain' } 
          : { height: 24, width: 121, resizeMode: 'cover' }
        }
      />
    </View>
  );
};

export default function ChatInterface({ route, navigation }) {
  const { user, chatId, otherUserId } = route.params || {};
  
  // Debug navigation parameters
  // console.log('ChatInterface navigation params:', { user, chatId, otherUserId });
  
  // Helper to get profile image with CloudFront URL
  const getImageSource = (imagePath) => {
    const cloudFrontUrl = 'https://dk665xezaubcy.cloudfront.net';
    if (!imagePath) return require('../../assets/model.jpg');
    if (imagePath.startsWith('http')) {
      return { uri: imagePath, cache: 'force-cache' };
    }
    if (imagePath.startsWith('/uploads/')) {
      return { uri: `${cloudFrontUrl}${imagePath}`, cache: 'force-cache' };
    }
    if (!imagePath.startsWith('/')) {
      return { uri: `${cloudFrontUrl}/uploads/images/${imagePath}`, cache: 'force-cache' };
    }
    return require('../../assets/model.jpg');
  };
  const [isTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [showReceiverRecording, setShowReceiverRecording] = useState(false);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [plusModalVisible, setPlusModalVisible] = useState(false);
  const [socketStatus, setSocketStatus] = useState('connected');
  
  // Typing indicator refs
  const typingTimeoutRef = useRef(null);
  const typingDebounceRef = useRef(null);

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
  const chatIdRef = useRef(chatId);
  const userIdRef = useRef(user?._id);
  useEffect(() => { chatIdRef.current = chatId; }, [chatId]);
  useEffect(() => { userIdRef.current = user?._id; }, [user?._id]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/chat/history/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const formattedMessages = data.messages.map(msg => {
          // Determine if this is an image message
          const isImage = msg.messageType === 'image' || (typeof msg.message === 'string' && (msg.message.startsWith('http://') || msg.message.startsWith('https://')) && (msg.message.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)));
          // Detect audio message
          const isAudio = msg.messageType === 'audio' || (typeof msg.message === 'string' && (msg.message.startsWith('http://') || msg.message.startsWith('https://')) && (msg.message.match(/\.(m4a|mp3|wav|ogg|aac)$/i)));
          if (isImage) {
            return {
              image: msg.message, // image URL
              messageType: 'image',
              time: new Date(msg.timestamp),
              sent: msg.senderId._id === user._id,
              id: msg._id,
              status: msg.isRead ? 'read' : 'sent',
              senderId: msg.senderId,
              isRead: msg.isRead,
            };
          } else if (isAudio) {
            return {
              message: msg.message, // audio URL
              messageType: 'audio',
              time: new Date(msg.timestamp),
              sent: msg.senderId._id === user._id,
              id: msg._id,
              status: msg.isRead ? 'read' : 'sent',
              senderId: msg.senderId,
              isRead: msg.isRead,
            };
          } else {
            return {
              text: msg.message,
              messageType: msg.messageType || 'text',
              time: new Date(msg.timestamp),
              sent: msg.senderId._id === user._id,
              id: msg._id,
              status: msg.isRead ? 'read' : 'sent',
              senderId: msg.senderId,
              isRead: msg.isRead,
            };
          }
        });
        setMessages(formattedMessages);
        
        // Mark all unread messages as read when opening the chat
        if (formattedMessages.length > 0) {
          markAllMessagesAsRead(formattedMessages, user._id);
          markAllMessagesAsDelivered(formattedMessages, user._id);
        }
      } catch (err) {
        // console.error('Failed to fetch chat history:', err);
      }
    };
    if (chatId && user?._id) fetchHistory();
  }, [chatId, user?._id]);

  useEffect(() => {
    let removeNewMessage, removeTyping, removeStatusUpdate;
    const setupSocket = async () => {
      try {
        await SocketManager.connect();
        setSocketStatus('connected');
        SocketManager.setActiveChat(chatId);
        SocketManager.joinChat(chatId);

        // Remove previous listeners if any
        if (removeNewMessage) removeNewMessage();
        if (removeTyping) removeTyping();
        if (removeStatusUpdate) removeStatusUpdate();

        // Listen for new messages
        removeNewMessage = SocketManager.onNewMessage(async (data) => {
          if (data.chatId === chatIdRef.current) {
            // Determine message type
            const isImage = data.message.messageType === 'image' || (typeof data.message.message === 'string' && (data.message.message.startsWith('http://') || data.message.message.startsWith('https://')) && (data.message.message.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)));
            const isAudio = data.message.messageType === 'audio' || (typeof data.message.message === 'string' && (data.message.message.startsWith('http://') || data.message.message.startsWith('https://')) && (data.message.message.match(/\.(m4a|mp3|wav|ogg|aac)$/i)));
            
            let newMessage;
            if (isImage) {
              newMessage = {
                image: data.message.message,
                messageType: 'image',
                time: new Date(data.message.timestamp),
                sent: data.message.senderId._id === userIdRef.current,
                id: data.message._id,
                status: data.message.isRead ? 'read' : 'sent',
                senderId: data.message.senderId,
                isRead: data.message.isRead,
              };
            } else if (isAudio) {
              newMessage = {
                message: data.message.message,
                messageType: 'audio',
                time: new Date(data.message.timestamp),
                sent: data.message.senderId._id === userIdRef.current,
                id: data.message._id,
                status: data.message.isRead ? 'read' : 'sent',
                senderId: data.message.senderId,
                isRead: data.message.isRead,
              };
            } else {
              newMessage = {
                text: data.message.message,
                messageType: data.message.messageType || 'text',
                time: new Date(data.message.timestamp),
                sent: data.message.senderId._id === userIdRef.current,
                id: data.message._id,
                status: data.message.isRead ? 'read' : 'sent',
                senderId: data.message.senderId,
                isRead: data.message.isRead,
              };
            }
            // Check if message already exists to prevent duplicates
            setMessages((prev) => {
              const messageExists = prev.some(msg => msg.id === newMessage.id);
              if (messageExists) return prev;
              // If this is a sent message, replace any temporary messages with the same text
              if (newMessage.sent) {
                const updatedMessages = prev.map(msg => {
                  if (msg.isTemp && msg.text === newMessage.text && msg.sent) {
                    return { ...newMessage, status: 'sent' };
                  }
                  return msg;
                });
                // If we didn't replace a temp message, add the new message
                const tempMessageReplaced = updatedMessages.some(msg => msg.id === newMessage.id && !msg.isTemp);
                if (!tempMessageReplaced) {
                  return [...updatedMessages, newMessage];
                }
                // Update status to delivered after a short delay
                setTimeout(() => {
                  setMessages(prev => prev.map(msg =>
                    msg.id === newMessage.id
                      ? { ...msg, status: 'delivered' }
                      : msg
                  ));
                }, 1000);
                return updatedMessages;
              }
              // If this is a received message, mark as read immediately
              if (!newMessage.sent) {
                // Mark as delivered and read
                markMessageAsDelivered(newMessage.id);
                markMessageAsRead(newMessage.id).then(() => {
                  setMessages(prevMsgs => prevMsgs.map(msg =>
                    msg.id === newMessage.id ? { ...msg, status: 'read', isRead: true } : msg
                  ));
                }).catch(err => {
                  console.error('Error marking message as read:', err);
                  // Fallback: manually update the message status
                  setMessages(prevMsgs => prevMsgs.map(msg =>
                    msg.id === newMessage.id ? { ...msg, status: 'read', isRead: true } : msg
                  ));
                });
              }
              return [...prev, newMessage];
            });
          }
        });

        // Listen for typing events
        removeTyping = SocketManager.onTyping((data) => {
          // console.log('Received typing event:', data);
          if (data.chatId === chatIdRef.current && data.userId !== userIdRef.current) {
            setOtherUserTyping(data.isTyping);
          }
        });

        // Listen for message status updates
        removeStatusUpdate = SocketManager.onMessageStatusUpdate((data) => {
          // console.log('Received message status update:', data);
          // console.log('Current chatId:', chatIdRef.current);
          // console.log('Message ID from server:', data.messageId);
          // console.log('Current messages:', messages);
          if (data.chatId === chatIdRef.current) {
            setMessages(prev => {
              // console.log('Updating messages with status:', data.status);
              const updated = prev.map(msg => {
                // console.log('Checking message:', msg.id, 'against:', data.messageId);
                if (msg.id === data.messageId) {
                  // console.log('Found matching message, updating status to:', data.status);
                  return { ...msg, status: data.status, isRead: data.isRead };
                }
                return msg;
              });
              // console.log('Updated messages:', updated);
              return updated;
            });
          }
        });
      } catch (error) {
        // console.error('Error setting up socket:', error);
        setSocketStatus('error');
      }
    };
    setupSocket();
    return () => {
      SocketManager.leaveChat(chatIdRef.current);
      if (removeNewMessage) removeNewMessage();
      if (removeTyping) removeTyping();
      if (removeStatusUpdate) removeStatusUpdate();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      emitTypingStatus(false);
    };
  }, [chatId, user?._id]);

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
      if (chatId && user?._id) {
        try {
          const token = await AsyncStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/chat/history/${chatId}?limit=50`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const serverMessages = data.messages;
            
            setMessages(prev => {
              const updated = prev.map(localMsg => {
                const serverMsg = serverMessages.find(sm => sm._id === localMsg.id);
                if (serverMsg && serverMsg.isRead !== localMsg.isRead) {
                  // console.log('Syncing message status:', localMsg.id, 'from', localMsg.isRead, 'to', serverMsg.isRead);
                  return {
                    ...localMsg,
                    isRead: serverMsg.isRead,
                    status: serverMsg.isRead ? 'read' : (serverMsg.isDelivered ? 'delivered' : 'sent')
                  };
                }
                return localMsg;
              });
              return updated;
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
  }, [chatId, user?._id]);

  // Function to emit typing status with immediate stop on send
  const emitTypingStatus = (isTyping) => {
    if (!chatId) return;

    // console.log(`Emitting typing status: ${isTyping} for chat: ${chatId}`);

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
      SocketManager.emitTyping(chatId, true);

      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        // console.log('Typing timeout - stopping typing indicator');
        setIsTyping(false);
        SocketManager.emitTyping(chatId, false);
      }, 3000);
    } else {
      // Stop typing immediately (no debounce for stopping)
      SocketManager.emitTyping(chatId, false);
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
    SocketManager.emitTyping(chatId, false);
  };

  const handleInputFocus = () => {
    setIsTyping(true);
    emitTypingStatus(true);
  };

  const handleInputBlur = () => {
    if (!message) {
      setIsTyping(false);
      emitTypingStatus(false);
    }
  };

  const handleChangeText = (text) => {
    setMessage(text);
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
            <Text style={styles.typingText}>{user.name} is typing...</Text>
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

  const groupedMessages = groupMessagesByTime(messages);
  const audioRecorder = useAudioRecorder();


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
          <Image source={getImageSource(user.profilePicture || user.profilePictures?.[0])} style={styles.avatar} />
          <Text style={styles.name}>{user.name}</Text>
          {user.verified && (
            <MaterialIcons name="verified" size={18} color="#ff2d7a" style={{ marginLeft: 4 }} />
          )}
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
            navigation.navigate('VoiceCall', {
              contactName: user.name,
              contactImage: getImageSource(user.profilePicture || user.profilePictures?.[0])
            }); 
          }}
          onVideoCallPress={() => { 
            setCallModalVisible(false); 
            navigation.navigate('VideoCall', {
              contactName: user.name,
              contactImage: getImageSource(user.profilePicture || user.profilePictures?.[0])
            }); 
          }}
          styles={styles}
        />

        {/* Dropdown Menu */}
        <DropdownMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onViewProfilePress={() => { setMenuVisible(false); }}
          onCancelConnectionPress={() => { setMenuVisible(false); Alert.alert('Cancel Connection', 'Are you sure you want to cancel this connection? This action cannot be undone.'); }}
          onBlockPress={() => { setMenuVisible(false); Alert.alert('Block', 'Are you sure you want to block this user? This action cannot be undone.'); }}
          onReportPress={() => { setMenuVisible(false); Alert.alert('Report', 'Are you sure you want to report this user?'); }}
          styles={styles}
        />

        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, paddingTop: 0, flexGrow: 1, justifyContent: 'flex-start' }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Text inside ScrollView, only if no messages sent */}
          {messages.length === 0 && (
            <Text style={styles.infoText}>
              You're now connected with <Text style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>{user.name}</Text>. Start the conversation with a friendly hello!
            </Text>
          )}
          <View style={{marginBottom:16, alignItems:'center'}}>
            <Text style={{color:'#888'}}>Today</Text>
          </View>
          
          {groupedMessages.map((group, groupIdx) => (
            <View key={groupIdx} style={{ marginBottom: 8 }}>
              {group.messages.map((msg, msgIdx) => (
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
              ))}
              <View style={group.sent ? styles.sentTimeContainer : styles.receivedTimeContainer}>
                <Text style={styles.messageTime}>
                  {group.time instanceof Date ? group.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : group.time}
                </Text>
                {group.sent && group.messages.length > 0 && renderMessageStatus(group.messages[group.messages.length - 1].status)}
              </View>
            </View>
          ))}
          
          {/* Receiver recording animation bubble */}
          {showReceiverRecording && (
            <View style={styles.receivedMessageContainer}>
              <ReceiverRecordingBubble animation={typingAnimation} />
            </View>
          )}
          {renderTypingIndicator()}
        </ScrollView>

        {/* Plus Modal */}
        <PlusModal
          visible={plusModalVisible}
          onClose={() => setPlusModalVisible(false)}
          onGallerySelect={() => handleGallerySelect({
            chatId,
            user,
            otherUserId,
            setMessages,
            setPlusModalVisible,
            emitTypingStatus
          })}
          onAudioSelect={() => { setPlusModalVisible(false); Alert.alert('Audio', 'Audio feature coming soon!'); }}
          styles={styles}
        />



        {/* Message Input */}
        {isRecordingAudio && (
          <View style={{alignItems:'center', marginBottom:4}}>
            <Text style={{color:'#ff2d7a', fontWeight:'bold'}}>Recording...</Text>
          </View>
        )}
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
                  if (!user || !user._id || !chatId || !otherUserId) {
                    Alert.alert('Error', 'Chat is not ready. Please try again later.');
                    return;
                  }
                  handleSend({ message, chatId, user, otherUserId, setMessage, setIsTyping, inputRef, setMessages, emitTypingStatus });
                  stopTypingImmediately();
                }}
                multiline
                returnKeyType="send"
              />

            </View>
            {message.trim() ? (
              <TouchableOpacity style={styles.sendButton} onPress={() => {
                if (!user || !user._id || !chatId || !otherUserId) {
                  Alert.alert('Error', 'Chat is not ready. Please try again later.');
                  return;
                }
                handleSend({ message, chatId, user, otherUserId, setMessage, setIsTyping, inputRef, setMessages, emitTypingStatus });
                stopTypingImmediately();
              }}>
                <Ionicons name="send" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.micButton}
                onPressIn={async () => {
                  // console.debug('Mic button pressed in. Starting recording...');
                  setIsRecordingAudio(true);
                  // console.debug('audioRecorder object:', audioRecorder);
                  await audioRecorder.startRecording();
                }}
                onPressOut={async () => {
                  // console.debug('Mic button released. Stopping recording...');
                  setIsRecordingAudio(false);
                  const uri = await audioRecorder.stopRecording();
                  // console.debug('stopRecording returned URI:', uri);
                  if (uri) {
                    // Upload audio and send as message
                    // Similar to image upload logic
                    try {
                      // console.debug('Uploading audio file...');
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
                      // console.debug('Upload response status:', uploadRes.status);
                      if (!uploadRes.ok) throw new Error('Failed to upload audio');
                      const uploadData = await uploadRes.json();
                      let audioUrl = uploadData.url;
                      // console.debug('Audio uploaded. URL:', audioUrl);
                      // Ensure audioUrl is public (CloudFront)
                      if (audioUrl && !audioUrl.startsWith('http')) {
                        audioUrl = `https://dk665xezaubcy.cloudfront.net/${audioUrl.replace(/^\/+/, '')}`;
                        // console.debug('Fixed audioUrl to CloudFront:', audioUrl);
                      }
                      // Send audio message to backend
                      // console.debug('Sending audio message to backend...');
                      const sendRes = await fetch(`${API_BASE_URL}/chat/send-message`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          senderId: user._id,
                          receiverId: otherUserId,
                          chatId,
                          message: audioUrl,
                          messageType: 'audio',
                        }),
                      });
                      // console.debug('Send message response status:', sendRes.status);
                      if (!sendRes.ok) throw new Error('Failed to send audio message');
                      // Don't add to UI immediately - wait for the server response
                      // The message will be added when the server sends it back via socket
                    } catch (err) {
                      // console.error('Error sending audio:', err);
                    }
                  }
                }}
              >
                <Ionicons name={isRecordingAudio ? 'mic-outline' : 'mic'} size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 0,
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
    backgroundColor: 'rgba(0,0,0,0.01)',
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