import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert, Modal, Animated } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import { PermissionsAndroid } from 'react-native';
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
    VideoSourceType,
} from 'react-native-agora';
import axios from 'axios';
import { API_BASE_URL } from '../../env';
import SocketManager from '../../utils/socket';
import CallSwitchManager from '../../utils/callSwitchManager';
import { sendCallEventMessage } from './components/ChatFunctions';

// Agora configuration
const appId = 'c6b06b53084241529f38d82e54ea8da7';

const DeclinedCallModal = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide down from top
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto slide up after 2.5 seconds
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onClose();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible, slideAnim, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <View style={{ 
          backgroundColor: '#121212', 
          paddingVertical: 16, 
          paddingHorizontal: 20, 
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.1)'
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#F44336', marginBottom: 4 }}>Call Declined</Text>
          <Text style={{ fontSize: 14, color: '#ccc', textAlign: 'center' }}>The user declined your call.</Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const MinimizedCallModal = ({ visible, onClose, onMaximize, onEndCall, contactName, duration, callType = 'voice' }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!visible) return null;

  return (
    <Animated.View 
      pointerEvents="box-none"
      style={{ 
        position: 'absolute',
        top: 24,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: [{ translateY: slideAnim }]
      }}
    >
      <View pointerEvents="auto" style={styles.minimizedCallContainer}>
        <View style={styles.minimizedCallContent}>
          {/* Call Info */}
          <View style={styles.minimizedCallInfo}>
            <View style={styles.minimizedCallIndicator}>
              <Ionicons 
                name={callType === 'video' ? 'videocam' : 'call'} 
                size={16} 
                color="#4CAF50" 
              />
            </View>
            <View style={styles.minimizedCallText}>
              <Text style={styles.minimizedContactName}>{contactName}</Text>
              <Text style={styles.minimizedDuration}>{formatTime(duration)}</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.minimizedCallActions}>
            <TouchableOpacity 
              style={styles.minimizedActionButton}
              onPress={onMaximize}
            >
              <MaterialCommunityIcons name="arrow-expand" size={18} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.minimizedActionButton, styles.minimizedEndButton]}
              onPress={onEndCall}
            >
              <MaterialIcons name="call-end" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// Global call tracking to prevent multiple instances of the same call
const activeCall = { channelName: null, timestamp: null };

const VoiceCall = ({ navigation, route }) => {
  
  // Extract channel name early for validation
  const channelName = route?.params?.channelName;
  
  // Log switching information
  if (route?.params?.isSwitchingFromVideo) {
    console.log('📞 Switching from video call with preserved state:', {
      callState: route.params.preservedCallState,
      talkingSeconds: route.params.preservedTalkingSeconds,
      isJoined: route.params.preservedIsJoined
    });
  }
  
  // Prevent multiple instances of the same call
  useEffect(() => {
    if (channelName) {
      const now = Date.now();
      const isSwitching = route?.params?.isSwitchingFromVideo || route?.params?.isSwitchingFromVoice;
      
      // Don't treat switching as duplicate calls
      if (!isSwitching && activeCall.channelName === channelName && activeCall.timestamp && (now - activeCall.timestamp) < 5000) {
        console.log('⚠️ Duplicate call detected, going back to prevent multiple instances');
        navigation.goBack();
        return;
      }
      
      // Update active call tracking
      activeCall.channelName = channelName;
      activeCall.timestamp = now;
    }
    
    // Cleanup on unmount
    return () => {
      if (activeCall.channelName === channelName) {
        activeCall.channelName = null;
        activeCall.timestamp = null;
      }
    };
  }, [channelName, navigation, route?.params?.isSwitchingFromVideo, route?.params?.isSwitchingFromVoice]);
  
  // UI States
  const [callState, setCallState] = useState('calling'); // calling, ringing, talking
  const [talkingSeconds, setTalkingSeconds] = useState(0);
  const timerRef = useRef(null);
  
  // Check if this is a switch from video call
  const isSwitchingFromVideo = route?.params?.isSwitchingFromVideo || false;
  const preservedCallState = route?.params?.preservedCallState;
  const preservedTalkingSeconds = route?.params?.preservedTalkingSeconds || 0;
  
  // State to track if we're switching to video call
  const [isSwitchingToVideo, setIsSwitchingToVideo] = useState(false);
  const preservedIsJoined = route?.params?.preservedIsJoined || false;
  const hasInitializedFromVideo = useRef(false);
  
  // Function to start the call timer
  const startCallTimer = (preservedSeconds = null) => {
    console.log('📞 Starting call timer from preserved state');
    console.log('📞 Current timer state:', { 
      hasTimer: !!timerRef.current, 
      callState, 
      talkingSeconds,
      isJoined,
      preservedSeconds
    });
    
    if (timerRef.current) {
      console.log('📞 Clearing existing timer before starting new one');
      clearInterval(timerRef.current);
    }
    
    // Use preserved seconds if provided, otherwise use current state
    const startFrom = preservedSeconds !== null ? preservedSeconds : talkingSeconds;
    
    timerRef.current = setInterval(() => {
      setTalkingSeconds((s) => s + 1);
    }, 1000);
    
    console.log('📞 Timer started successfully from:', startFrom);
  };
  
  // Initialize call state from preserved values if switching from video
  useEffect(() => {
    if (isSwitchingFromVideo && preservedCallState) {
      console.log('📞 Restoring preserved call state from video call:', {
        callState: preservedCallState,
        talkingSeconds: preservedTalkingSeconds,
        isJoined: preservedIsJoined
      });
      
      setCallState(preservedCallState);
      setTalkingSeconds(preservedTalkingSeconds);
      setIsJoined(preservedIsJoined); // Also restore the joined state
      
      // If we were already in a call, start the timer immediately
      if (preservedCallState === 'talking') {
        console.log('📞 Restarting call timer from preserved state');
        startCallTimer(preservedTalkingSeconds);
      }
    }
  }, [isSwitchingFromVideo, preservedCallState, preservedTalkingSeconds, preservedIsJoined]);
  
  // Agora States
  const agoraEngineRef = useRef();
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [token, setToken] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const eventHandler = useRef();
  const [declinedModalVisible, setDeclinedModalVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false); // Start with video disabled in voice call

  // Extract parameters with fallbacks and validation
  // channelName already extracted above for duplicate prevention
  const providedToken = route?.params?.agoraToken; // Token provided for incoming calls
  const localUid = route?.params?.localUid || Math.floor(Math.random() * 1000000);
  const contactName = route?.params?.contactName || route?.params?.callerName || 'User';
  const contactImage = route?.params?.contactImage || route?.params?.callerAvatar || require('../../assets/model1.jpg');
  const chatId = route?.params?.chatId;
  const currentUser = route?.params?.currentUser;
  const otherUserId = route?.params?.otherUserId || route?.params?.calleeId || route?.params?.callerId;
  const callType = route?.params?.callType || 'voice';

  // Validate required parameters
  useEffect(() => {
    console.log('Validating VoiceCall parameters:', {
      channelName, localUid, contactName, chatId, 
      currentUser: currentUser?.username || currentUser?.name || 'Unknown', 
      otherUserId
    });

    if (!channelName) {
      console.error('❌ Missing required parameter: channelName');
      Alert.alert('Error', 'Call configuration is incomplete. Missing channel name.');
      navigation.goBack();
      return;
    }

    if (!otherUserId) {
      console.warn('⚠️ Missing otherUserId - call events may not work properly');
    }

    if (!chatId) {
      console.warn('⚠️ Missing chatId - call events may not be saved');
    }
  }, [channelName, localUid, otherUserId, chatId]);

  // Fetch Agora token from backend
  const fetchAgoraToken = async () => {
    if (!channelName) {
      throw new Error('Channel name is required to fetch token');
    }

    try {
      setIsLoadingToken(true);
      console.log('🔑 Fetching Agora token:', { channelName, localUid });
      
      const response = await axios.get(`${API_BASE_URL}/agora/token`, {
        params: {
          channelName: channelName,
          uid: localUid,
          role: 'publisher'
        }
      });

      const receivedToken = response.data.token;
      console.log('✅ Agora token received:', receivedToken ? 'Yes' : 'No');
      
      if (!receivedToken) {
        throw new Error('No token received from server');
      }
      
      setToken(receivedToken);
      setIsLoadingToken(false);
      return receivedToken;
    } catch (error) {
      console.error('❌ Error fetching Agora token:', error.response?.data || error.message);
      setIsLoadingToken(false);
      Alert.alert('Error', 'Failed to get call token. Please try again.');
      navigation.goBack();
      throw error;
    }
  };

  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Validate channelName first
        if (!channelName) {
          console.error('❌ Cannot initialize call: channelName is missing');
          Alert.alert('Error', 'Call configuration is incomplete.');
          navigation.goBack();
          return;
        }

        console.log('🚀 Initializing call:', { channel: channelName, hasToken: !!providedToken });

        // Check if token is already provided (for incoming calls)
        if (providedToken) {
          setToken(providedToken);
          setIsLoadingToken(false);
        } else {
          // Fetch token for outgoing calls
          await fetchAgoraToken();
        }
      } catch (error) {
        console.error('❌ Error initializing call:', error);
        Alert.alert('Error', 'Failed to initialize call. Please try again.');
        navigation.goBack();
      }
    };
    
    initializeCall().catch(error => {
      console.error('❌ Unhandled error in initializeCall:', error);
      Alert.alert('Error', 'An unexpected error occurred while initializing call.');
      navigation.goBack();
    });
    
    return () => {
      cleanupAgoraEngine();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [channelName, providedToken]);

  // Initialize Agora engine and join call once token is available
  useEffect(() => {
    if (token && !isJoined && channelName) {
      const setupAndJoin = async () => {
        try {
          if (isSwitchingFromVideo && preservedIsJoined) {
            // When switching from video, we're continuing an existing call
            console.log('🔧 Setting up voice engine for call continuation...');
            await setupVoiceSDKEngine();
            setupEventHandler();
            await joinCall();
          } else {
            // Normal setup for new voice calls
            console.log('🔧 Setting up Agora engine...');
            await setupVoiceSDKEngine();
            setupEventHandler();
            await joinCall();
          }
        } catch (error) {
          console.error('❌ Error during setup and join:', error);
          Alert.alert('Call Setup Error', 'Failed to setup call. Please try again.');
          navigation.goBack();
        }
      };
      
      setupAndJoin().catch(error => {
        console.error('❌ Unhandled error in setupAndJoin:', error);
        Alert.alert('Call Setup Error', 'An unexpected error occurred. Please try again.');
        navigation.goBack();
      });
    }
  }, [token, channelName, isSwitchingFromVideo, preservedIsJoined]);

  // Handle call state transitions and timer
  useEffect(() => {
    let timeout1, timeout2;
    
    // Don't start new timers if we're switching from video call
    if (isSwitchingFromVideo) {
      console.log('📞 Skipping timer setup - switching from video call');
      return;
    }
    
    if (callState === 'calling') {
      timeout1 = setTimeout(() => {
        if (isJoined && remoteUid !== 0) {
          setCallState('talking');
        } else {
          setCallState('ringing');
        }
      }, 3000);
    } else if (callState === 'ringing') {
      timeout2 = setTimeout(() => {
        if (isJoined && remoteUid !== 0) {
          setCallState('talking');
        }
      }, 5000);
    } else if (callState === 'talking') {
      timerRef.current = setInterval(() => {
        setTalkingSeconds((s) => s + 1);
      }, 1000);
    }
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState, isJoined, remoteUid, isSwitchingFromVideo]);

  // Update call state when remote user joins
  useEffect(() => {
    if (isJoined && remoteUid !== 0 && callState !== 'talking') {
      setCallState('talking');
      
      // Send call started event message when call actually begins
      if (chatId && currentUser && otherUserId && callType) {
        console.log('📞 Sending call started event message');
        sendCallEventMessage({
          chatId,
          user: currentUser,
          otherUserId,
          callType,
          callStatus: 'started',
          setMessages: () => {} // We don't have setMessages here, so pass empty function
        });
      }
    }
  }, [isJoined, remoteUid, callState, chatId, currentUser, otherUserId, callType]);

  useEffect(() => {
    // Listen for call_response events only if we have a channelName
    if (!channelName) return;

    const handleCallResponse = (data) => {
      console.log('📞 Received call response:', data);
      console.log('📞 Current switching states:', { isSwitchingFromVideo, isSwitchingToVideo });
      console.log('📞 Global switching state:', CallSwitchManager.isSwitching(channelName));
      
      if (data && data.channelName === channelName) {
        // Check global switching state first
        if (CallSwitchManager.isSwitching(channelName)) {
          console.log('📞 Ignoring call response - channel is switching globally');
          return;
        }
        
        // Ignore call response events if we're switching calls
        if (isSwitchingFromVideo || isSwitchingToVideo) {
          console.log('📞 Ignoring call response during call switch');
          return;
        }
        
        // Additional check: if this is a call response with "ended" and we just switched from video,
        // it might be a leftover event from the video call ending
        if (data.response === 'ended' && data.reason === 'caller_ended' && route?.params?.isSwitchingFromVideo) {
          console.log('📞 Ignoring call ended response from video call switch');
          return;
        }
        
        if (data.response === 'declined') {
          setDeclinedModalVisible(true);
        } else if (data.response === 'ended') {
          console.log('📞 Other user ended the call');
          endCall();
        }
      }
    };
    SocketManager.onCallResponse(handleCallResponse);
    return () => {
      SocketManager.onCallResponse(() => {}); // Remove listener
    };
  }, [channelName, isSwitchingFromVideo, isSwitchingToVideo]);

  useEffect(() => {
    // Listen for call type switch events
    if (!channelName) return;

    const handleCallTypeSwitch = (data) => {
      console.log('📞 Received call type switch:', data);
      if (data && data.channelName === channelName) {
        // Set global switching state on the receiving device
        if (data.newCallType === 'video') {
          console.log('📞 Setting global switching state for incoming video switch');
          CallSwitchManager.setSwitching(channelName, true, 'voice-to-video');
        }
        
        if (data.isVideoToggle) {
          // Handle video toggle from the other user
          const shouldEnableVideo = data.newCallType === 'video';
          console.log(`📹 Other user ${shouldEnableVideo ? 'enabled' : 'disabled'} video`);
          // We don't need to change our own video state, just log for awareness
        } else {
          // Handle full screen switch - navigate to VideoCall
          if (data.newCallType === 'video') {
            console.log('📞 Other user switched to video call, navigating to VideoCall');
            navigation.replace('VideoCall', {
              channelName: channelName,
              agoraToken: token,
              localUid: localUid,
              contactName: contactName,
              contactImage: contactImage,
              chatId: chatId,
              currentUser: currentUser,
              otherUserId: otherUserId,
              callType: 'video',
              // Preserve call state for smooth switching
              preservedCallState: callState,
              preservedTalkingSeconds: talkingSeconds,
              preservedIsJoined: isJoined,
              isSwitchingFromVoice: true // Flag to indicate this is a switch from voice, not a new call
            });
            
            // Clear global switching state after successful navigation
            setTimeout(() => {
              CallSwitchManager.clearSwitching(channelName);
            }, 1000);
          }
        }
      }
    };
    SocketManager.onCallTypeSwitched(handleCallTypeSwitch);
    return () => {
      SocketManager.onCallTypeSwitched(() => {}); // Remove listener
    };
  }, [channelName, token, localUid, contactName, contactImage, chatId, currentUser, otherUserId, navigation, callState, talkingSeconds, isJoined]);

  // Cleanup effect to ensure timer is cleared on unmount
  useEffect(() => {
    return () => {
      console.log('📞 VoiceCall component unmounting, cleaning up timer...');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Clear global switching state if this component is unmounting
      if (channelName) {
        CallSwitchManager.clearSwitching(channelName);
      }
    };
  }, [channelName]);

  const handleDeclinedModalClose = () => {
    setDeclinedModalVisible(false);
    endCall();
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    // Navigate back to the previous screen so user can interact with the app
    navigation.goBack();
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    // Navigate back to VoiceCall screen
    navigation.navigate('VoiceCall', route.params);
  };

  const handleMinimizedEndCall = () => {
    setIsMinimized(false);
    endCall();
  };

  const toggleVideo = async () => {
    if (callState !== 'talking') return;
    
    try {
      const newVideoState = !isVideoEnabled;
      
      // Notify the other user about video state change
      if (otherUserId && channelName) {
        console.log(`📞 Notifying other user about video ${newVideoState ? 'enable' : 'disable'}`);
        SocketManager.emitCallTypeSwitch({
          toUserId: otherUserId,
          newCallType: newVideoState ? 'video' : 'voice',
          fromCallType: newVideoState ? 'voice' : 'video',
          channelName: channelName,
          isVideoToggle: true // Flag to indicate this is a video toggle, not a full screen switch
        });
      }
      
      if (newVideoState) {
        // Enable video
        await agoraEngineRef.current?.enableLocalVideo(true);
        await agoraEngineRef.current?.muteLocalVideoStream(false);
      } else {
        // Disable video
        await agoraEngineRef.current?.muteLocalVideoStream(true);
        await agoraEngineRef.current?.enableLocalVideo(false);
      }
      
      setIsVideoEnabled(newVideoState);
      console.log(`📹 Video ${newVideoState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const switchToVideoCall = async () => {
    try {
      if (!channelName) return;
      
      console.log('📞 Starting switch to video call...');
      
      // Set global switching state FIRST
      CallSwitchManager.setSwitching(channelName, true, 'voice-to-video');
      
      // Set flag FIRST to prevent endCall during switch
      setIsSwitchingToVideo(true);
      console.log('📞 Set isSwitchingToVideo flag to true');
      
      // Notify the other user to switch screens
      if (otherUserId) {
        SocketManager.emitCallTypeSwitch({
          toUserId: otherUserId,
          newCallType: 'video',
          fromCallType: 'voice',
          channelName: channelName,
          isVideoToggle: false
        });
      }
      
      // Navigate to full VideoCall with same parameters
      navigation.replace('VideoCall', {
        channelName: channelName,
        agoraToken: token,
        localUid: localUid,
        contactName: contactName,
        contactImage: contactImage,
        chatId: chatId,
        currentUser: currentUser,
        otherUserId: otherUserId,
        callType: 'video',
        // Preserve call state for smooth switching
        preservedCallState: callState,
        preservedTalkingSeconds: talkingSeconds,
        preservedIsJoined: isJoined,
        isSwitchingFromVoice: true // Flag to indicate this is a switch from voice, not a new call
      });
      
      // Clear global switching state after successful navigation
      setTimeout(() => {
        CallSwitchManager.clearSwitching(channelName);
      }, 1000);
    } catch (error) {
      console.error('Error switching to video call:', error);
      setIsSwitchingToVideo(false); // Reset flag on error
      CallSwitchManager.clearSwitching(channelName); // Clear global state on error
    }
  };

  const setupEventHandler = () => {
    eventHandler.current = {
      onJoinChannelSuccess: () => {
        console.log('✅ Successfully joined channel:', channelName);
        setIsJoined(true);
      },
      onUserJoined: (_connection, uid) => {
        console.log('👤 Remote user', uid, 'joined');
        setRemoteUid(uid);
        setCallState('talking');
      },
      onUserOffline: (_connection, uid) => {
        console.log('👤 Remote user', uid, 'left the channel');
        setRemoteUid(0);
        endCall();
      },
      onError: (err) => {
        console.error('❌ Agora Error:', err);
      },
    };
    agoraEngineRef.current?.registerEventHandler(eventHandler.current);
  };

  const setupVoiceSDKEngine = async () => {
    try {
      console.log('🔧 Setting up Agora Voice SDK Engine...');
      
      if (Platform.OS === 'android') { 
        console.log('🔧 Requesting Android permissions...');
        await getPermission(); 
      }
      
      console.log('🔧 Creating Agora RTC Engine...');
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      
      console.log('🔧 Initializing with App ID:', appId);
      await agoraEngine.initialize({ appId: appId });
      
      console.log('🔧 Enabling audio...');
      await agoraEngine.enableAudio();
      
      // Set audio profile for voice calls
      console.log('🔧 Setting audio profile...');
      await agoraEngine.setAudioProfile(1, 1); // Speech standard, speech standard
      
      console.log('✅ Agora Voice SDK Engine setup completed');
    } catch (e) {
      console.error('❌ Error setting up Agora engine:', e);
      Alert.alert('Setup Error', `Failed to setup call engine: ${e.message || 'Unknown error'}`);
      throw e;
    }
  };

  const joinCall = async () => {
    if (isJoined || !token || !channelName) {
      console.log('🚫 Cannot join call:', {
        isJoined,
        hasToken: !!token,
        hasChannelName: !!channelName
      });
      return;
    }
    try {
      console.log('🎯 Joining Agora channel...');
      console.log('🎯 Channel name:', channelName);
      console.log('🎯 Local UID:', localUid);
      
      // Ensure we have a valid engine
      if (!agoraEngineRef.current) {
        console.error('❌ Agora engine not initialized');
        Alert.alert('Error', 'Call engine not ready. Please try again.');
        return;
      }
      
      await agoraEngineRef.current.joinChannel(token, channelName, localUid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
      });
    } catch (e) {
      console.error('❌ Error joining channel:', e);
      Alert.alert('Call Error', `Failed to join call: ${e.message || 'Unknown error'}`);
      navigation.goBack();
      throw e;
    }
  };

  const endCall = async () => {
    try {
      console.log('📞 Ending call...');
      
      // Skip ending the call if we're switching to video mode
      if (isSwitchingToVideo) {
        console.log('📞 Skipping call end notification - switching to video mode');
        return;
      }
      
      // Notify the other user that the call has ended
      if (otherUserId && channelName) {
        console.log('📞 Notifying other user that call has ended');
        SocketManager.emitCallResponse({
          toUserId: otherUserId,
          response: 'ended',
          channelName: channelName,
          callType: callType,
          reason: 'caller_ended'
        });
      }
      
      await agoraEngineRef.current?.leaveChannel();
      setRemoteUid(0);
      setIsJoined(false);
      setCallState('calling');
      
      // Send call ended event message if we have the required parameters (skip if switching to video)
      if (!isSwitchingToVideo && chatId && currentUser && otherUserId && callType) {
        console.log('📞 Sending call ended event message');
        sendCallEventMessage({
          chatId,
          user: currentUser,
          otherUserId,
          callType,
          callStatus: 'ended',
          duration: talkingSeconds,
          setMessages: () => {} // We don't have setMessages here, so pass empty function
        });
      }
      
      // Clear active call tracking
      if (activeCall.channelName === channelName) {
        activeCall.channelName = null;
        activeCall.timestamp = null;
      }
      
      // Navigate to ChatInterface instead of going back to avoid IncomingCall screen
      if (chatId && otherUserId) {
        navigation.navigate('ChatInterface', {
          chatId: chatId,
          otherUserId: otherUserId,
          senderId: otherUserId // For compatibility
        });
      } else {
        // Fallback to ChatScreen if we don't have the required parameters
        navigation.navigate('ChatScreen');
      }
    } catch (e) {
      console.error('❌ Error ending call:', e);
      
      // Clear active call tracking
      if (activeCall.channelName === channelName) {
        activeCall.channelName = null;
        activeCall.timestamp = null;
      }
      
      // Fallback navigation
      if (chatId && otherUserId) {
        navigation.navigate('ChatInterface', {
          chatId: chatId,
          otherUserId: otherUserId,
          senderId: otherUserId
        });
      } else {
        navigation.navigate('ChatScreen');
      }
    }
  };

  const toggleMute = async () => {
    try {
      await agoraEngineRef.current?.muteLocalAudioStream(!isMuted);
      setIsMuted(!isMuted);
    } catch (e) {
      console.error('❌ Error toggling mute:', e);
      Alert.alert('Error', 'Failed to toggle mute. Please try again.');
    }
  };

  const toggleSpeaker = async () => {
    try {
      await agoraEngineRef.current?.setEnableSpeakerphone(!isSpeakerOn);
      setIsSpeakerOn(!isSpeakerOn);
    } catch (e) {
      console.error('❌ Error toggling speaker:', e);
      Alert.alert('Error', 'Failed to toggle speaker. Please try again.');
    }
  };

  const cleanupAgoraEngine = () => {
    try {
      console.log('🧹 Cleaning up Agora engine...');
      agoraEngineRef.current?.unregisterEventHandler(eventHandler.current);
      agoraEngineRef.current?.release();
    } catch (error) {
      console.error('❌ Error cleaning up Agora engine:', error);
    }
  };

  const getPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        
        if (result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Microphone permission denied');
        }
      }
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      Alert.alert('Permission Error', 'Microphone permission is required for voice calls.');
      throw error;
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Early return if critical parameters are missing
  if (!channelName) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Call configuration error</Text>
          <Text style={styles.errorSubtext}>Missing channel information</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  let statusText = 'Calling...';
  if (isLoadingToken) statusText = 'Connecting...';
  else if (callState === 'ringing') statusText = 'Ringing...';
  else if (callState === 'talking') statusText = formatTime(talkingSeconds);

  return (
    <View style={styles.container}>
      {/* Declined Call Modal */}
      <DeclinedCallModal visible={declinedModalVisible} onClose={handleDeclinedModalClose} />
      
      {/* Minimized Call Modal */}
      <MinimizedCallModal
        visible={isMinimized}
        onClose={() => setIsMinimized(false)}
        onMaximize={handleMaximize}
        onEndCall={handleMinimizedEndCall}
        contactName={contactName}
        duration={talkingSeconds}
        callType={callType}
      />
      
      {/* Main Call Interface - Hide when minimized */}
      {!isMinimized && (
        <>
          {/* Minimize icon */}
          <TouchableOpacity style={styles.expandIcon} onPress={handleMinimize}>
            <MaterialCommunityIcons name="arrow-expand" size={24} color="#fff" />
          </TouchableOpacity>
      
      {/* Video Views - Show when video is enabled */}
      {isVideoEnabled ? (
        <>
          {/* Remote Video (Full Screen) */}
          {remoteUid !== 0 && callState === 'talking' ? (
            <RtcSurfaceView
              style={styles.remoteVideo}
              canvas={{
                uid: remoteUid,
                sourceType: VideoSourceType.VideoSourceRemote,
              }}
              zOrderMediaOverlay={false}
            />
          ) : (
            /* Local Video (Full Screen) during calling/ringing */
            <RtcSurfaceView
              style={styles.remoteVideo}
              canvas={{
                uid: localUid,
                sourceType: VideoSourceType.VideoSourceCamera,
              }}
              zOrderMediaOverlay={false}
            />
          )}
          
          {/* Local Video (Small overlay) - Only show during talking */}
          {callState === 'talking' && remoteUid !== 0 && (
            <View style={styles.localVideoOverlay}>
              <RtcSurfaceView
                style={styles.localVideo}
                canvas={{
                  uid: localUid,
                  sourceType: VideoSourceType.VideoSourceCamera,
                }}
                zOrderMediaOverlay={true}
              />
            </View>
          )}
        </>
      ) : (
        /* User image - Show when video is disabled */
        <View style={styles.avatarContainer}>
          <Image
            source={typeof contactImage === 'string' ? { uri: contactImage } : contactImage}
            style={styles.avatar}
          />
        </View>
      )}
      
      {/* Name and status */}
      <Text style={[styles.name, isVideoEnabled && { color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 }]}>{contactName}</Text>
      <Text style={[styles.status, isVideoEnabled && { color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 }]}>{statusText}</Text>
      
      {/* Call controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity 
          style={[
            styles.controlButton, 
            { backgroundColor: isSpeakerOn ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)' }
          ]}
          onPress={toggleSpeaker}
          disabled={isLoadingToken}
        >
          <Ionicons 
            name={isSpeakerOn ? "volume-high" : "volume-medium"} 
            size={32} 
            color={isLoadingToken ? 'rgba(255,255,255,0.5)' : '#fff'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: 'rgba(255,255,255,0.3)' }
          ]}
          disabled={isLoadingToken}
          onPress={switchToVideoCall}
        >
          <Ionicons name="videocam" size={32} color={'#fff'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.controlButton,
            { backgroundColor: isMuted ? 'rgba(220,53,69,0.8)' : 'rgba(255,255,255,0.3)' }
          ]}
          onPress={toggleMute}
          disabled={isLoadingToken}
        >
          <FontAwesome 
            name={isMuted ? "microphone-slash" : "microphone"} 
            size={32} 
            color={isLoadingToken ? 'rgba(255,255,255,0.5)' : '#fff'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <MaterialIcons name="call-end" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 171,
    paddingBottom: 24,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  errorText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#ff2d7a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  expandIcon: {
    position: 'absolute',
    top: 56,
    left: 18,
    zIndex: 2,
    padding: 4,
  },
  avatarContainer: {
    width: 200,
    height: 200,
    borderRadius: 70,  
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    resizeMode: 'cover',
  },
  name: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    fontFamily: FONTS.medium, 
    marginBottom: 12,
    textAlign: 'center',
  },
  status: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 0,
    marginBottom: 16,
    textAlign: 'center',
  },
  // Video styles
  remoteVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  localVideoOverlay: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 1,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  controlButton: {
    width: 54,
    height: 54,
    borderRadius: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  endCallButton: {
    backgroundColor: '#dc3545',
  },
  // Minimized call modal styles
  minimizedCallContainer: {
    backgroundColor: 'rgba(18,18,18,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    borderRadius: 90,
  },
  minimizedCallContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  minimizedCallInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  minimizedCallIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  minimizedCallText: {
    flex: 1,
  },
  minimizedContactName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  minimizedDuration: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  minimizedCallActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimizedActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  minimizedEndButton: {
    backgroundColor: '#dc3545',
  },
});

export default VoiceCall;