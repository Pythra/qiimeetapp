import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import { PermissionsAndroid } from 'react-native';
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType, 
} from 'react-native-agora';
import axios from 'axios';
import { API_BASE_URL } from '../../env';

// Agora configuration
const appId = 'c6b06b53084241529f38d82e54ea8da7';
// Remove hardcoded token - will be fetched dynamically
const channelName = 'test';
const localUid = Math.floor(Math.random() * 1000000);


const VoiceCall = ({ navigation, route }) => {
  // UI States
  const [callState, setCallState] = useState('calling'); // calling, ringing, talking
  const [talkingSeconds, setTalkingSeconds] = useState(0);
  const timerRef = useRef(null);
  
  // Agora States
  const agoraEngineRef = useRef();
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [token, setToken] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const eventHandler = useRef();

  // Get contact info from route params or use default
  const contactName = route?.params?.contactName || 'Jennifer';
  const contactImage = route?.params?.contactImage || require('../../assets/model1.jpg');

  // Fetch Agora token from backend
  const fetchAgoraToken = async () => {
    try {
      setIsLoadingToken(true);
      console.log('🔑 Fetching Agora token from backend...');
      
      const response = await axios.get(`http://qiimeet-env.eba-cai7crfr.us-east-1.elasticbeanstalk.com/api/agora/token`, {
        params: {
          channelName: channelName,
          uid: localUid,
          role: 'publisher'
        }
      });

      const receivedToken = response.data.token;
      console.log('✅ Agora token received:', receivedToken);
      setToken(receivedToken);
      setIsLoadingToken(false);
    } catch (error) {
      console.error('❌ Error fetching Agora token:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to get call token. Please try again.');
      setIsLoadingToken(false);
      navigation.goBack();
    }
  };

  useEffect(() => {
    const initializeCall = async () => {
      // First fetch the token
      await fetchAgoraToken();
    };
    
    initializeCall();
    
    return () => {
      cleanupAgoraEngine();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Initialize Agora engine and join call once token is available
  useEffect(() => {
    if (token && !isJoined) {
      const setupAndJoin = async () => {
        await setupVoiceSDKEngine();
        setupEventHandler();
        await joinCall();
      };
      setupAndJoin();
    }
  }, [token]);

  // Handle call state transitions and timer
  useEffect(() => {
    let timeout1, timeout2;
    
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
  }, [callState, isJoined, remoteUid]);

  // Update call state when remote user joins
  useEffect(() => {
    if (isJoined && remoteUid !== 0 && callState !== 'talking') {
      setCallState('talking');
    }
  }, [isJoined, remoteUid, callState]);

  const setupEventHandler = () => {
    eventHandler.current = {
      onJoinChannelSuccess: () => {
        console.log('Successfully joined channel: ' + channelName);
        setIsJoined(true);
      },
      onUserJoined: (_connection, uid) => {
        console.log('Remote user ' + uid + ' joined');
        setRemoteUid(uid);
        setCallState('talking');
      },
      onUserOffline: (_connection, uid) => {
        console.log('Remote user ' + uid + ' left the channel');
        setRemoteUid(0);
        // You might want to end the call here
        endCall();
      },
      onError: (err) => {
        console.error('Agora Error:', err);
      },
    };
    agoraEngineRef.current?.registerEventHandler(eventHandler.current);
  };

  const setupVoiceSDKEngine = async () => {
    try {
      if (Platform.OS === 'android') { 
        await getPermission(); 
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      await agoraEngine.initialize({ appId: appId });
      
      // Enable audio
      await agoraEngine.enableAudio();
    } catch (e) {
      console.error('Error setting up Agora engine:', e);
    }
  };

  const joinCall = async () => {
    if (isJoined || !token) {
      console.log('🚫 Cannot join call: isJoined=', isJoined, 'token=', !!token);
      return;
    }
    try {
      console.log('🎯 Joining Agora channel with token:', token);
      await agoraEngineRef.current?.joinChannel(token, channelName, localUid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
      });
    } catch (e) {
      console.error('Error joining channel:', e);
      Alert.alert('Error', 'Failed to join call');
    }
  };

  const endCall = async () => {
    try {
      await agoraEngineRef.current?.leaveChannel();
      setRemoteUid(0);
      setIsJoined(false);
      setCallState('calling');
      navigation.goBack();
    } catch (e) {
      console.error('Error ending call:', e);
      navigation.goBack();
    }
  };

  const toggleMute = async () => {
    try {
      await agoraEngineRef.current?.muteLocalAudioStream(!isMuted);
      setIsMuted(!isMuted);
    } catch (e) {
      console.error('Error toggling mute:', e);
    }
  };

  const toggleSpeaker = async () => {
    try {
      await agoraEngineRef.current?.setEnableSpeakerphone(!isSpeakerOn);
      setIsSpeakerOn(!isSpeakerOn);
    } catch (e) {
      console.error('Error toggling speaker:', e);
    }
  };

  const cleanupAgoraEngine = () => {
    agoraEngineRef.current?.unregisterEventHandler(eventHandler.current);
    agoraEngineRef.current?.release();
  };

  const getPermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  let statusText = 'Calling...';
  if (isLoadingToken) statusText = 'Connecting...';
  else if (callState === 'ringing') statusText = 'Ringing...';
  else if (callState === 'talking') statusText = formatTime(talkingSeconds);

  return (
    <View style={styles.container}>
      {/* Expand icon */}
      <TouchableOpacity style={styles.expandIcon} onPress={() => navigation.goBack()}>
        <Image source={require('../../assets/compress.png')} style={{ width: 24, height: 24 }} />
      </TouchableOpacity>
      
      {/* User image */}
      <View style={styles.avatarContainer}>
        <Image
          source={contactImage}
          style={styles.avatar}
        />
      </View>
      
      {/* Name and status */}
      <Text style={styles.name}>{contactName}</Text>
      <Text style={styles.status}>{statusText}</Text>
      
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
            { backgroundColor: callState === 'talking' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.17)' }
          ]}
          disabled={callState !== 'talking' || isLoadingToken}
        >
          <Ionicons
            name="videocam"
            size={32}
            color={
              isLoadingToken || callState === 'calling' || callState === 'ringing'
                ? 'rgba(255,255,255,0.5)'
                : '#fff'
            }
          />
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
});

export default VoiceCall;