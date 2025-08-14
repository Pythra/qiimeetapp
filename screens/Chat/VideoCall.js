import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, Image, Text, Platform, Alert, PermissionsAndroid, Modal, Animated, TouchableWithoutFeedback } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { sendCallEventMessage } from './components/ChatFunctions';

const appId = 'c6b06b53084241529f38d82e54ea8da7';
// localUid will be passed from route params or generated as fallback

// Global call tracking to prevent multiple instances of the same call
const activeVideoCall = { channelName: null, timestamp: null };

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

const MinimizedCallModal = ({ visible, onClose, onMaximize, onEndCall, contactName, duration, callType = 'video' }) => {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
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
        <View style={styles.minimizedCallContainer}>
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
    </Modal>
  );
};

const VideoCall = ({ navigation, route }) => {
  console.log('VideoCall screen loaded!');
  console.log('Route params:', route?.params);
  
  // Extract channel name early for validation
  const channelName = route?.params?.channelName;
  
  // Prevent multiple instances of the same call
  useEffect(() => {
    if (channelName) {
      const now = Date.now();
      if (activeVideoCall.channelName === channelName && activeVideoCall.timestamp && (now - activeVideoCall.timestamp) < 5000) {
        console.log('⚠️ Duplicate video call detected, going back to prevent multiple instances');
        navigation.goBack();
        return;
      }
      activeVideoCall.channelName = channelName;
      activeVideoCall.timestamp = now;
    }
    
    // Cleanup on unmount
    return () => {
      if (activeVideoCall.channelName === channelName) {
        activeVideoCall.channelName = null;
        activeVideoCall.timestamp = null;
      }
    };
  }, [channelName, navigation]);
  
  // UI States
  const [callState, setCallState] = useState('calling'); // calling, ringing, talking
  const [talkingSeconds, setTalkingSeconds] = useState(0);
  const timerRef = useRef(null);
  const [declinedModalVisible, setDeclinedModalVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [uiVisible, setUiVisible] = useState(true); // Track UI visibility
  const fadeAnim = useRef(new Animated.Value(1)).current; // Animated value for fade
  const hideUITimer = useRef(null); // Timer to auto-hide UI

  // Agora States
  const agoraEngineRef = useRef();
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [primaryRemoteUid, setPrimaryRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true); // Default to speaker on
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [token, setToken] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [videoDebugInfo, setVideoDebugInfo] = useState({
    localVideoState: null,
    remoteVideoState: null,
    videoSizeInfo: null,
    firstFrameDecoded: false,
    firstFrameRendered: false,
  });
  const eventHandler = useRef();

  // Get contact info from route params or use default
  // channelName already extracted above for duplicate prevention
  const providedToken = route?.params?.agoraToken; // Token provided for incoming calls
  const localUid = route?.params?.localUid || Math.floor(Math.random() * 1000000); // Use passed UID or generate fallback
  // Use correct name/avatar from params
  const contactName = route?.params?.contactName || route?.params?.callerName || 'User';
  const contactImage = route?.params?.contactImage || route?.params?.callerAvatar || require('../../assets/model1.jpg');
  const chatId = route?.params?.chatId;
  const currentUser = route?.params?.currentUser;
  const otherUserId = route?.params?.otherUserId || route?.params?.calleeId || route?.params?.callerId;
  const callType = route?.params?.callType || 'video';

  // Validate required parameters
  useEffect(() => {
    console.log('Validating VideoCall parameters...');
    console.log('channelName:', channelName);
    console.log('localUid:', localUid);
    console.log('contactName:', contactName);
    console.log('chatId:', chatId);
    console.log('currentUser:', currentUser?.username || currentUser?.name || 'Unknown');
    console.log('otherUserId:', otherUserId);

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

  // Auto-hide UI after 5 seconds of inactivity
  const resetHideUITimer = () => {
    if (hideUITimer.current) {
      clearTimeout(hideUITimer.current);
    }
    hideUITimer.current = setTimeout(() => {
      if (uiVisible && callState === 'talking') {
        handleScreenTap();
      }
    }, 5000);
  };

  // Reset timer when UI becomes visible
  useEffect(() => {
    if (uiVisible && callState === 'talking') {
      resetHideUITimer();
    }
    return () => {
      if (hideUITimer.current) {
        clearTimeout(hideUITimer.current);
      }
    };
  }, [uiVisible, callState]);

  // Fetch Agora token from backend
  const fetchAgoraToken = async () => {
    if (!channelName) {
      throw new Error('Channel name is required to fetch token');
    }

    try {
      setIsLoadingToken(true);
      console.log('🔑 Fetching Agora token from backend...');
      console.log('🔑 Parameters:', { channelName, localUid });
      
      const response = await axios.get(`${API_BASE_URL}/agora/token`, {
        params: {
          channelName: channelName,
          uid: localUid,
          role: 'publisher',
        },
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

  // Initialize call
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

        console.log('🚀 Initializing video call with channel:', channelName);

        // Check if token is already provided (for incoming calls)
        if (providedToken) {
          console.log('✅ Using provided Agora token');
          setToken(providedToken);
          setIsLoadingToken(false);
        } else {
          // Fetch token for outgoing calls
          console.log('🔑 Fetching token for outgoing video call...');
          await fetchAgoraToken();
        }
      } catch (error) {
        console.error('❌ Error initializing video call:', error);
        Alert.alert('Error', 'Failed to initialize video call. Please try again.');
        navigation.goBack();
      }
    };
    
    initializeCall().catch(error => {
      console.error('❌ Unhandled error in initializeCall:', error);
      Alert.alert('Error', 'An unexpected error occurred while initializing video call.');
      navigation.goBack();
    });
    
    return () => {
      cleanupAgoraEngine();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (hideUITimer.current) {
        clearTimeout(hideUITimer.current);
      }
    };
  }, [channelName, providedToken]);

  // Initialize Agora engine and join call once token is available
  useEffect(() => {
    if (token && !isJoined && channelName) {
      const setupAndJoin = async () => {
        try {
          console.log('🔧 Setting up Agora video engine and joining call...');
          await setupVideoSDKEngine();
          setupEventHandler();
          await joinCall();
        } catch (error) {
          console.error('❌ Error during video call setup and join:', error);
          Alert.alert('Video Call Setup Error', 'Failed to setup video call. Please try again.');
          navigation.goBack();
        }
      };
      
      setupAndJoin().catch(error => {
        console.error('❌ Unhandled error in setupAndJoin:', error);
        Alert.alert('Video Call Setup Error', 'An unexpected error occurred. Please try again.');
        navigation.goBack();
      });
    }
  }, [token, channelName]);

  // Handle call state transitions
  useEffect(() => {
    let timeout1, timeout2;
    
    if (callState === 'calling') {
      timeout1 = setTimeout(() => {
        if (isJoined && remoteUsers.length > 0) {
          setCallState('talking');
        } else {
          setCallState('ringing');
        }
      }, 3000);
    } else if (callState === 'ringing') {
      timeout2 = setTimeout(() => {
        if (isJoined && remoteUsers.length > 0) {
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callState, isJoined, remoteUsers]);

  // Auto-transition to talking when remote user joins
  useEffect(() => {
    if (isJoined && remoteUsers.length > 0 && callState !== 'talking') {
      setCallState('talking');
      
      // Send call started event message when call actually begins
      const chatId = route?.params?.chatId;
      const currentUser = route?.params?.currentUser;
      const otherUserId = route?.params?.otherUserId;
      const callType = route?.params?.callType;
      
      if (chatId && currentUser && otherUserId && callType) {
        console.log('📞 Sending video call started event message');
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
  }, [isJoined, remoteUsers, callState, route?.params]);

  useEffect(() => {
    // Listen for call_response events
    const handleCallResponse = (data) => {
      if (data && data.channelName === channelName) {
        if (data.response === 'declined') {
          setDeclinedModalVisible(true);
        } else if (data.response === 'ended') {
          console.log('📞 Other user ended the video call');
          endCall();
        }
      }
    };
    SocketManager.onCallResponse(handleCallResponse);
    return () => {
      SocketManager.onCallResponse(() => {}); // Remove listener
    };
  }, [channelName]);

  const handleDeclinedModalClose = () => {
    setDeclinedModalVisible(false);
    endCall();
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleMinimizedEndCall = () => {
    setIsMinimized(false);
    endCall();
  };

  const setupEventHandler = () => {
    
    eventHandler.current = {
      onJoinChannelSuccess: () => {
        setIsJoined(true);
      },
      
      onUserJoined: (_connection, uid) => {
        if (uid !== localUid) { // Only add if not myself
          setRemoteUsers(prev => {
            const newUsers = [...prev.filter(id => id !== uid), uid]; // Remove duplicates
            return newUsers;
          });
          setPrimaryRemoteUid(prevPrimary => {
            if (prevPrimary === 0 || prevPrimary === localUid) {
              return uid;
            }
            return prevPrimary;
          });
        }
      },
      
      onUserOffline: (_connection, uid) => {
        if (uid !== localUid) {
          setRemoteUsers(prev => {
            const newUsers = prev.filter(id => id !== uid);
            return newUsers;
          });
          setPrimaryRemoteUid(prevPrimary => {
            if (prevPrimary === uid) {
              const remainingUsers = remoteUsers.filter(id => id !== uid && id !== localUid);
              const newPrimary = remainingUsers.length > 0 ? remainingUsers[0] : 0;
              return newPrimary;
            }
            return prevPrimary;
          });
        }
        if (remoteUsers.filter(id => id !== uid && id !== localUid).length === 0) {
          endCall();
        }
      },
      
      onLocalVideoStateChanged: (source, state, reason) => {
        setVideoDebugInfo(prev => ({
          ...prev,
          localVideoState: { source, state, reason, timestamp: Date.now() }
        }));
      },
      
      onRemoteVideoStateChanged: (connection, uid, state, reason) => {
        setVideoDebugInfo(prev => ({
          ...prev,
          remoteVideoState: { uid, state, reason, timestamp: Date.now() }
        }));
      },
      
      onRemoteAudioStateChanged: (connection, uid, state, reason) => {
      },
      
      onVideoSizeChanged: (connection, uid, width, height, rotation) => {
        setVideoDebugInfo(prev => ({
          ...prev,
          videoSizeInfo: { uid, width, height, rotation, timestamp: Date.now() }
        }));
      },
      
      onFirstRemoteVideoDecoded: (connection, uid, width, height, elapsed) => {
        setVideoDebugInfo(prev => ({
          ...prev,
          firstFrameDecoded: { uid, width, height, elapsed, timestamp: Date.now() }
        }));
      },
      
      onFirstRemoteVideoFrame: (connection, uid, width, height, elapsed) => {
        setVideoDebugInfo(prev => ({
          ...prev,
          firstFrameRendered: { uid, width, height, elapsed, timestamp: Date.now() }
        }));
      },
      
      onRtcStats: (connection, stats) => {
      },
      
      onNetworkQuality: (connection, uid, txQuality, rxQuality) => {
      },
      
      onError: (err) => {
      },
      
      onWarning: (warn) => {
      },
    };
    
    agoraEngineRef.current?.registerEventHandler(eventHandler.current);
  };

  const setupVideoSDKEngine = async () => {
    try {
      
      if (Platform.OS === 'android') {
        await getPermission();
      }
      
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      
      await agoraEngine.initialize({ appId: appId });
      
      // Enable video
      await agoraEngine.enableVideo();
      
      // Set video configuration
      await agoraEngine.setVideoEncoderConfiguration({
        dimensions: { width: 640, height: 480 },
        frameRate: 15,
        bitrate: 0, // Auto bitrate
        orientationMode: 0,
      });
      
      // Enable speaker by default
      await agoraEngine.setEnableSpeakerphone(true);
      
      // Start preview for local video (but we won't show it)
      await agoraEngine.startPreview();
      
    } catch (e) {
    }
  };

  const joinCall = async () => {
    if (isJoined || !token) {
      return;
    }
    
    try {
      
      await agoraEngineRef.current?.joinChannel(token, channelName, localUid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });
      
      // Explicitly enable local video and audio after joining
      await agoraEngineRef.current?.enableLocalVideo(true);
      await agoraEngineRef.current?.enableLocalAudio(true);
      
      // Force enable video and audio after joining
      await agoraEngineRef.current?.enableVideo();
      await agoraEngineRef.current?.muteLocalVideoStream(false);
      await agoraEngineRef.current?.muteLocalAudioStream(false);
      
    } catch (e) {
      Alert.alert('Error', 'Failed to join call');
    }
  };

  const endCall = async () => {
    try {
      // Notify the other user that the call has ended
      const otherUserId = route?.params?.otherUserId;
      if (otherUserId && channelName) {
        console.log('📞 Notifying other user that video call has ended');
        SocketManager.emitCallResponse({
          toUserId: otherUserId,
          response: 'ended',
          channelName: channelName,
          callType: 'video',
          reason: 'caller_ended'
        });
      }
      
      await agoraEngineRef.current?.leaveChannel();
      
      // Reset states
      setRemoteUsers([]);
      setPrimaryRemoteUid(0);
      setIsJoined(false);
      setCallState('calling');
      
      // Send call ended event message if we have the required parameters
      const chatId = route?.params?.chatId;
      const currentUser = route?.params?.currentUser;
      const callType = route?.params?.callType;
      
      if (chatId && currentUser && otherUserId && callType) {
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
      
      setTalkingSeconds(0);
      
      // Clear active call tracking
      if (activeVideoCall.channelName === channelName) {
        activeVideoCall.channelName = null;
        activeVideoCall.timestamp = null;
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
      // Clear active call tracking
      if (activeVideoCall.channelName === channelName) {
        activeVideoCall.channelName = null;
        activeVideoCall.timestamp = null;
      }
      
      // Fallback navigation
      const chatId = route?.params?.chatId;
      const otherUserId = route?.params?.otherUserId;
      
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
      const newMutedState = !isMuted;
      await agoraEngineRef.current?.muteLocalAudioStream(newMutedState);
      setIsMuted(newMutedState);
    } catch (e) {
    }
  };

  const toggleSpeaker = async () => {
    try {
      const newSpeakerState = !isSpeakerOn;
      await agoraEngineRef.current?.setEnableSpeakerphone(newSpeakerState);
      setIsSpeakerOn(newSpeakerState);
    } catch (e) {
    }
  };

  const switchCamera = async () => {
    try {
      await agoraEngineRef.current?.switchCamera();
      setIsFrontCamera(prev => !prev);
    } catch (e) {
    }
  };

  const toggleVideo = async () => {
    try {
      const newVideoState = !isVideoEnabled;
      await agoraEngineRef.current?.muteLocalVideoStream(!newVideoState);
      setIsVideoEnabled(newVideoState);
    } catch (e) {
    }
  };

  const cleanupAgoraEngine = () => {
    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current?.unregisterEventHandler(eventHandler.current);
        agoraEngineRef.current?.release();
        agoraEngineRef.current = null;
      }
    } catch (e) {
    }
  };

  const getPermission = async () => {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Handle tap to toggle UI visibility
  const handleScreenTap = () => {
    console.log('Screen tapped! Current uiVisible:', uiVisible); // Debug log
    
    const newVisible = !uiVisible;
    setUiVisible(newVisible);
    
    // Clear existing timer
    if (hideUITimer.current) {
      clearTimeout(hideUITimer.current);
    }
    
    // Animate the fade
    Animated.timing(fadeAnim, {
      toValue: newVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Reset auto-hide timer if UI is now visible and in talking state
      if (newVisible && callState === 'talking') {
        resetHideUITimer();
      }
    });
  };

  // Status text
  let statusText = 'Calling...';
  if (isLoadingToken) statusText = 'Connecting...';
  else if (callState === 'ringing') statusText = 'Ringing...';
  else if (callState === 'talking') statusText = formatTime(talkingSeconds);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
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
        callType="video"
      />
      
      {/* Main Video Call Interface - Hide when minimized */}
      {!isMinimized && (
        <>
      
      {/* Main video container - shows remote user's video or fallback image */}
      <View style={styles.videoContainer}>
        {callState === 'talking' && isJoined && remoteUsers.length > 0 && primaryRemoteUid !== 0 && primaryRemoteUid !== localUid ? (
          // Show remote video full screen
          <RtcSurfaceView
            canvas={{
              uid: primaryRemoteUid,
              sourceType: VideoSourceType.VideoSourceRemote,
              renderMode: 1, // Fit mode
              mirrorMode: 0   // No mirror for remote video
            }}
            style={styles.remoteVideo}
            key={`remote-${primaryRemoteUid}`}
            zOrderMediaOverlay={false}
            zOrderOnTop={false}
          />
        ) : (["calling", "ringing"].includes(callState) && isJoined && isVideoEnabled) ? (
          // Show local video full screen during 'calling' or 'ringing'
          <RtcSurfaceView
            canvas={{
              uid: localUid,
              sourceType: VideoSourceType.VideoSourceCamera,
              renderMode: 1, // Fit mode
              mirrorMode: 1   // Mirror for local video
            }}
            style={styles.remoteVideo}
            key={`local-fullscreen-${localUid}`}
            zOrderMediaOverlay={false}
            zOrderOnTop={false}
          />
        ) : null}
        
        {/* Local video as small overlay in bottom right, only in 'talking' state */}
        {callState === 'talking' && isJoined && isVideoEnabled && (
          <View style={[
            styles.localVideoOverlayNew,
            { bottom: uiVisible ? 140 : 24 } // Move down when UI is hidden
          ]}>
            <RtcSurfaceView
              canvas={{
                uid: localUid,
                sourceType: VideoSourceType.VideoSourceCamera,
                renderMode: 1, // Fit mode
                mirrorMode: 1   // Mirror for local video
              }}
              style={styles.localVideoNew}
              key={`local-${localUid}`}
              zOrderMediaOverlay={true}
              zOrderOnTop={true}
            />
          </View>
        )}
      </View>

      {/* Invisible touchable area for screen taps */}
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <View style={styles.touchableArea} />
      </TouchableWithoutFeedback>

      {/* UI Overlay */}
      {uiVisible && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="box-none">
          {/* Top row with expand and more options */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.expandIcon} onPress={handleMinimize}>
              <MaterialCommunityIcons name="arrow-expand" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topIcon} onPress={switchCamera}>
              <Ionicons name="camera-reverse" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Contact name and status */}
          <View style={styles.nameStatusContainer}>
            <Text style={styles.name}>{contactName}</Text>
            <Text style={styles.status}>{statusText}</Text>
          </View>
          
          {/* Call controls */}
          <View style={styles.controlsRow}>
            {['ringing', 'calling', 'talking'].includes(callState) ? (
              <>
                <TouchableOpacity 
                  style={[styles.controlButton, { backgroundColor: isSpeakerOn ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)' }]}
                  onPress={toggleSpeaker}
                >
                  <Ionicons 
                    name={isSpeakerOn ? "volume-high" : "volume-medium"} 
                    size={32} 
                    color={'#fff'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: 'rgba(255,255,255,0.3)' }]}
                  onPress={() => {
                    try {
                      // Notify the other user to switch to voice call UI
                      if (otherUserId && channelName) {
                        SocketManager.emitCallTypeSwitch({
                          toUserId: otherUserId,
                          newCallType: 'voice',
                          fromCallType: 'video',
                          channelName: channelName,
                          isVideoToggle: false
                        });
                      }
                      navigation.replace('VoiceCall', {
                        channelName: channelName,
                        agoraToken: token,
                        localUid: localUid,
                        contactName: contactName,
                        contactImage: contactImage,
                        chatId: chatId,
                        currentUser: currentUser,
                        otherUserId: otherUserId,
                        callType: 'voice',
                      });
                    } catch (e) {}
                  }}
                >
                  <Ionicons
                    name="call"
                    size={32}
                    color={'#fff'}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.controlButton, { backgroundColor: isMuted ? 'rgba(220,53,69,0.8)' : 'rgba(255,255,255,0.3)' }]}
                  onPress={toggleMute}
                >
                  <FontAwesome name={isMuted ? "microphone-slash" : "microphone"} size={32} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.controlButton, styles.endCallButton]}
                  onPress={endCall}
                >
                  <MaterialIcons name="call-end" size={32} color="#fff" />
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </Animated.View>
      )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  touchableArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  localVideoOverlay: {
    position: 'absolute',
    left: 16,
    bottom: 90,
    width: 110,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#222',
    zIndex: 20,
    elevation: 10,
  },
  localVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60, 
  },
  expandIcon: {
    position: 'absolute',
    left: 24,
  },
  topIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 27,
    width: 54,
    height: 54,
    right: 24,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameStatusContainer: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  status: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 56,
    paddingHorizontal: 0,
  },
  controlButton: {
    width: 54,
    height: 54,
    borderRadius: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 18,
  },
  activeButton: {
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
  },
  mutedButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
  },
  endCallButton: {
    backgroundColor: '#dc3545',
  },
  localVideoOverlayNew: {
    position: 'absolute',
    right: 16,
    bottom: 140,
    width: 140,
    height: 190,
    borderRadius: 68,
    overflow: 'hidden',
    zIndex: 20,
  },
  localVideoNew: {
    width: '100%',
    height: '100%',
    borderRadius: 68,
  },
  avatarContainer: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: [{ translateX: -50 }],
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    zIndex: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  // Minimized call modal styles
  minimizedCallContainer: {
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
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

export default VideoCall;