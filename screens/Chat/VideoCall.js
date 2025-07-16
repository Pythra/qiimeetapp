import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, Image, Text, Platform, Alert, PermissionsAndroid } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';
import axios from 'axios';

const appId = 'c6b06b53084241529f38d82e54ea8da7';
const channelName = 'test';
const localUid = Math.floor(Math.random() * 1000000);

const VideoCall = ({ navigation, route }) => {
  console.log('[VideoCall] Component rendered with localUid:', localUid);

  // UI States
  const [callState, setCallState] = useState('calling'); // calling, ringing, talking
  const [talkingSeconds, setTalkingSeconds] = useState(0);
  const timerRef = useRef(null);

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
  const contactName = route?.params?.contactName || 'Jennifer';
  const contactImage = route?.params?.contactImage || require('../../assets/model1.jpg');

  // Comprehensive debug logging
  const debugLog = (category, message, data = null) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    if (data) {
      console.log(`[${timestamp}][${category}] ${message}:`, data);
    } else {
      console.log(`[${timestamp}][${category}] ${message}`);
    }
  };

  // Fetch Agora token from backend
  const fetchAgoraToken = async () => {
    try {
      setIsLoadingToken(true);
      debugLog('TOKEN', 'Requesting token', { channel: channelName, uid: localUid });
      
      const response = await axios.get(`http://qiimeet-env.eba-cai7crfr.us-east-1.elasticbeanstalk.com/api/agora/token`, {
        params: {
          channelName: channelName,
          uid: localUid,
          role: 'publisher',
        },
      });
      
      const receivedToken = response.data.token;
      setToken(receivedToken);
      setIsLoadingToken(false);
      debugLog('TOKEN', 'Token received successfully', { tokenLength: receivedToken.length });
    } catch (error) {
      debugLog('TOKEN', 'Error fetching token', error);
      Alert.alert('Error', 'Failed to get call token. Please try again.');
      setIsLoadingToken(false);
      navigation.goBack();
    }
  };

  // Initialize call
  useEffect(() => {
    debugLog('INIT', 'Initializing call');
    fetchAgoraToken();
    
    return () => {
      debugLog('CLEANUP', 'Component unmounting');
      cleanupAgoraEngine();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Setup Agora when token is ready
  useEffect(() => {
    if (token && !isJoined) {
      debugLog('SETUP', 'Token ready, setting up Agora');
      const setupAndJoin = async () => {
        await setupVideoSDKEngine();
        setupEventHandler();
        await joinCall();
      };
      setupAndJoin();
    }
  }, [token]);

  // Handle call state transitions
  useEffect(() => {
    debugLog('STATE', 'Call state changed', { 
      callState, 
      isJoined, 
      remoteUserCount: remoteUsers.length,
      primaryRemoteUid 
    });

    let timeout1, timeout2;
    
    if (callState === 'calling') {
      timeout1 = setTimeout(() => {
        if (isJoined && remoteUsers.length > 0) {
          debugLog('STATE', 'Transitioning to talking state');
          setCallState('talking');
        } else {
          debugLog('STATE', 'Transitioning to ringing state');
          setCallState('ringing');
        }
      }, 3000);
    } else if (callState === 'ringing') {
      timeout2 = setTimeout(() => {
        if (isJoined && remoteUsers.length > 0) {
          debugLog('STATE', 'Transitioning from ringing to talking');
          setCallState('talking');
        }
      }, 5000);
    } else if (callState === 'talking') {
      debugLog('STATE', 'Starting call timer');
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
      debugLog('STATE', 'Auto-transitioning to talking due to remote user join');
      setCallState('talking');
    }
  }, [isJoined, remoteUsers, callState]);

  const setupEventHandler = () => {
    debugLog('EVENTS', 'Setting up event handlers');
    
    eventHandler.current = {
      onJoinChannelSuccess: () => {
        debugLog('AGORA', 'Join channel success');
        setIsJoined(true);
      },
      
      onUserJoined: (_connection, uid) => {
        debugLog('AGORA', 'User joined', { uid });
        if (uid !== localUid) { // Only add if not myself
          setRemoteUsers(prev => {
            const newUsers = [...prev.filter(id => id !== uid), uid]; // Remove duplicates
            debugLog('AGORA', 'Updated remote users', { newUsers });
            return newUsers;
          });
          setPrimaryRemoteUid(prevPrimary => {
            if (prevPrimary === 0 || prevPrimary === localUid) {
              debugLog('AGORA', 'Setting primary remote uid', { uid });
              return uid;
            }
            return prevPrimary;
          });
        }
      },
      
      onUserOffline: (_connection, uid) => {
        debugLog('AGORA', 'User offline', { uid });
        if (uid !== localUid) {
          setRemoteUsers(prev => {
            const newUsers = prev.filter(id => id !== uid);
            debugLog('AGORA', 'Updated remote users after offline', { newUsers });
            return newUsers;
          });
          setPrimaryRemoteUid(prevPrimary => {
            if (prevPrimary === uid) {
              const remainingUsers = remoteUsers.filter(id => id !== uid && id !== localUid);
              const newPrimary = remainingUsers.length > 0 ? remainingUsers[0] : 0;
              debugLog('AGORA', 'Primary user left, setting new primary', { newPrimary });
              return newPrimary;
            }
            return prevPrimary;
          });
        }
        if (remoteUsers.filter(id => id !== uid && id !== localUid).length === 0) {
          debugLog('AGORA', 'No more remote users, ending call');
          endCall();
        }
      },
      
      onLocalVideoStateChanged: (source, state, reason) => {
        debugLog('VIDEO', 'Local video state changed', { source, state, reason });
        setVideoDebugInfo(prev => ({
          ...prev,
          localVideoState: { source, state, reason, timestamp: Date.now() }
        }));
      },
      
      onRemoteVideoStateChanged: (connection, uid, state, reason) => {
        debugLog('VIDEO', 'Remote video state changed', { uid, state, reason });
        setVideoDebugInfo(prev => ({
          ...prev,
          remoteVideoState: { uid, state, reason, timestamp: Date.now() }
        }));
      },
      
      onRemoteAudioStateChanged: (connection, uid, state, reason) => {
        debugLog('AUDIO', 'Remote audio state changed', { uid, state, reason });
      },
      
      onVideoSizeChanged: (connection, uid, width, height, rotation) => {
        debugLog('VIDEO', 'Video size changed', { uid, width, height, rotation });
        setVideoDebugInfo(prev => ({
          ...prev,
          videoSizeInfo: { uid, width, height, rotation, timestamp: Date.now() }
        }));
      },
      
      onFirstRemoteVideoDecoded: (connection, uid, width, height, elapsed) => {
        debugLog('VIDEO', 'First remote video decoded', { uid, width, height, elapsed });
        setVideoDebugInfo(prev => ({
          ...prev,
          firstFrameDecoded: { uid, width, height, elapsed, timestamp: Date.now() }
        }));
      },
      
      onFirstRemoteVideoFrame: (connection, uid, width, height, elapsed) => {
        debugLog('VIDEO', 'First remote video frame rendered', { uid, width, height, elapsed });
        setVideoDebugInfo(prev => ({
          ...prev,
          firstFrameRendered: { uid, width, height, elapsed, timestamp: Date.now() }
        }));
      },
      
      onRtcStats: (connection, stats) => {
        debugLog('STATS', 'RTC stats', { 
          users: stats.users,
          txBytes: stats.txBytes,
          rxBytes: stats.rxBytes,
          txAudioBytes: stats.txAudioBytes,
          rxAudioBytes: stats.rxAudioBytes,
          txVideoBytes: stats.txVideoBytes,
          rxVideoBytes: stats.rxVideoBytes
        });
      },
      
      onNetworkQuality: (connection, uid, txQuality, rxQuality) => {
        debugLog('NETWORK', 'Network quality', { uid, txQuality, rxQuality });
      },
      
      onError: (err) => {
        debugLog('ERROR', 'Agora error', err);
      },
      
      onWarning: (warn) => {
        debugLog('WARNING', 'Agora warning', warn);
      },
    };
    
    agoraEngineRef.current?.registerEventHandler(eventHandler.current);
    debugLog('EVENTS', 'Event handlers registered');
  };

  const setupVideoSDKEngine = async () => {
    try {
      debugLog('SETUP', 'Setting up video SDK engine');
      
      if (Platform.OS === 'android') {
        await getPermission();
      }
      
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      
      await agoraEngine.initialize({ appId: appId });
      debugLog('SETUP', 'Agora engine initialized');
      
      // Enable video
      await agoraEngine.enableVideo();
      debugLog('SETUP', 'Video enabled');
      
      // Set video configuration
      await agoraEngine.setVideoEncoderConfiguration({
        dimensions: { width: 640, height: 480 },
        frameRate: 15,
        bitrate: 0, // Auto bitrate
        orientationMode: 0,
      });
      debugLog('SETUP', 'Video encoder configured');
      
      // Enable speaker by default
      await agoraEngine.setEnableSpeakerphone(true);
      debugLog('SETUP', 'Speaker enabled');
      
      // Start preview
      await agoraEngine.startPreview();
      debugLog('SETUP', 'Preview started');
      
    } catch (e) {
      debugLog('ERROR', 'Setup video SDK error', e);
    }
  };

  const joinCall = async () => {
    if (isJoined || !token) {
      debugLog('JOIN', 'Skipping join - already joined or no token', { isJoined, hasToken: !!token });
      return;
    }
    
    try {
      debugLog('JOIN', 'Joining channel', { channel: channelName, uid: localUid });
      
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
      
      debugLog('JOIN', 'Join channel called, video/audio enabled');
      
    } catch (e) {
      debugLog('ERROR', 'Join call error', e);
      Alert.alert('Error', 'Failed to join call');
    }
  };

  const endCall = async () => {
    try {
      debugLog('CALL', 'Ending call');
      await agoraEngineRef.current?.leaveChannel();
      
      // Reset states
      setRemoteUsers([]);
      setPrimaryRemoteUid(0);
      setIsJoined(false);
      setCallState('calling');
      setTalkingSeconds(0);
      
      navigation.goBack();
    } catch (e) {
      debugLog('ERROR', 'End call error', e);
      navigation.goBack();
    }
  };

  const toggleMute = async () => {
    try {
      const newMutedState = !isMuted;
      await agoraEngineRef.current?.muteLocalAudioStream(newMutedState);
      setIsMuted(newMutedState);
      debugLog('CONTROL', 'Mute toggled', { isMuted: newMutedState });
    } catch (e) {
      debugLog('ERROR', 'Toggle mute error', e);
    }
  };

  const toggleSpeaker = async () => {
    try {
      const newSpeakerState = !isSpeakerOn;
      await agoraEngineRef.current?.setEnableSpeakerphone(newSpeakerState);
      setIsSpeakerOn(newSpeakerState);
      debugLog('CONTROL', 'Speaker toggled', { isSpeakerOn: newSpeakerState });
    } catch (e) {
      debugLog('ERROR', 'Toggle speaker error', e);
    }
  };

  const switchCamera = async () => {
    try {
      await agoraEngineRef.current?.switchCamera();
      setIsFrontCamera(prev => !prev);
      debugLog('CONTROL', 'Camera switched', { isFrontCamera: !isFrontCamera });
    } catch (e) {
      debugLog('ERROR', 'Switch camera error', e);
    }
  };

  const toggleVideo = async () => {
    try {
      const newVideoState = !isVideoEnabled;
      await agoraEngineRef.current?.muteLocalVideoStream(!newVideoState);
      setIsVideoEnabled(newVideoState);
      debugLog('CONTROL', 'Video toggled', { isVideoEnabled: newVideoState });
    } catch (e) {
      debugLog('ERROR', 'Toggle video error', e);
    }
  };

  const cleanupAgoraEngine = () => {
    try {
      if (agoraEngineRef.current) {
        debugLog('CLEANUP', 'Cleaning up Agora engine');
        agoraEngineRef.current?.unregisterEventHandler(eventHandler.current);
        agoraEngineRef.current?.release();
        agoraEngineRef.current = null;
      }
    } catch (e) {
      debugLog('ERROR', 'Cleanup error', e);
    }
  };

  const getPermission = async () => {
    if (Platform.OS === 'android') {
      debugLog('PERMISSION', 'Requesting Android permissions');
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
      debugLog('PERMISSION', 'Permission result', result);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Status text
  let statusText = 'Calling...';
  if (isLoadingToken) statusText = 'Connecting...';
  else if (callState === 'ringing') statusText = 'Ringing...';
  else if (callState === 'talking') statusText = formatTime(talkingSeconds);

  // Debug render info
  debugLog('RENDER', 'Component rendering', {
    callState,
    isJoined,
    remoteUsers,
    primaryRemoteUid,
    isVideoEnabled,
    statusText
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.videoContainer}>
        {callState === 'talking' && isJoined && primaryRemoteUid !== 0 && primaryRemoteUid !== localUid ? (
          <View style={{ flex: 1, backgroundColor: 'red' }}>
            <RtcSurfaceView
              canvas={{ 
                uid: primaryRemoteUid, 
                sourceType: VideoSourceType.VideoSourceCamera,
                renderMode: 1, // Hidden mode - scale to fit
                mirrorMode: 0   // No mirror for remote video
              }}
              style={{ flex: 1, backgroundColor: 'green' }}
            />
          </View>
        ) : (
          <ImageBackground
            source={require('../../assets/red_sweater.jpg')}
            style={styles.background}
            resizeMode="cover"
          />
        )}
      </View>
      {/* Debug overlay and UI overlay temporarily removed for testing */}
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
  debugOverlay: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 100,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
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
    marginTop: 200, // Moved down to avoid debug overlay
    paddingHorizontal: 16,
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
    top: 280,
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
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 56,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
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
  previewContainer: {
    position: 'absolute',
    bottom: 141,
    right: 24,
    width: 159,
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#fff',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  previewCameraIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VideoCall; 