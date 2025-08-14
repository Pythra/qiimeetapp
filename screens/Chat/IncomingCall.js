import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Vibration } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import compressImg from '../../assets/compress.png';
import SocketManager from '../../utils/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../components/AuthContext';

const IncomingCall = ({ route, navigation }) => {
  const { callerName = 'Unknown', callerAvatar, callType = 'voice', channelName, callerId, agoraToken, chatId: routeChatId } = route.params || {};
  const [chatId, setChatId] = useState(routeChatId);
  const [currentUser, setCurrentUser] = useState(null);
  const { getProfileImageSource } = useAuth();
  
  // Handle case where callerAvatar might be a user object
  const callerData = typeof callerAvatar === 'object' && callerAvatar !== null ? callerAvatar : { profilePictures: [callerAvatar] };
  const displayName = callerData.username || callerData.name || callerName;
  
  // Notification management
  const [notificationIds, setNotificationIds] = useState([]);
  const notificationIntervalRef = useRef(null);
  
  // Animation values for ring colors
  const outerRingOpacity = useRef(new Animated.Value(0.2)).current;
  const innerRingOpacity = useRef(new Animated.Value(0.5)).current;
  const isAlternating = useRef(true);
  
  // Ringtone sound state
  const ringtoneSound = useRef(null);
  const vibrationInterval = useRef(null);
  const [isRingtoneLoaded, setIsRingtoneLoaded] = useState(false);
  const autoStopTimeoutRef = useRef(null);

  // Animate rings to alternate colors
  useEffect(() => {
    const animateRings = () => {
      if (isAlternating.current) {
        // Animate outer ring to high opacity, inner ring to low opacity
        Animated.parallel([
          Animated.timing(outerRingOpacity, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(innerRingOpacity, {
            toValue: 0.2,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]).start(() => {
          // Then reverse the animation
          Animated.parallel([
            Animated.timing(outerRingOpacity, {
              toValue: 0.2,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(innerRingOpacity, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: false,
            }),
          ]).start(() => {
            // Continue the loop
            animateRings();
          });
        });
      }
    };

    animateRings();

    // Cleanup on unmount
    return () => {
      isAlternating.current = false;
    };
  }, [outerRingOpacity, innerRingOpacity]);

  // Load and play ringtone with vibration
  useEffect(() => {
    const startRingtoneAndVibration = async () => {
      try {
        console.log('[IncomingCall] Starting ringtone and vibration...');
        
        // Start vibration pattern (vibrate for 1 second, pause for 1 second, repeat)
        const vibrationPattern = [0, 1000, 1000]; // Initial delay, vibrate duration, pause duration
        Vibration.vibrate(vibrationPattern, true); // true = repeat
        
        // Play local notification sound
        const initialNotification = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`,
            body: `${displayName} is calling you`,
            sound: true,
          },
          trigger: null, // Play immediately
        });
        
        // Store notification ID for cleanup
        setNotificationIds(prev => [...prev, initialNotification]);

        // Try to load and play custom ringtone with multiple approaches
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });

          // Approach 1: Try to use a simple online ringtone
          let ringtoneLoaded = false;
          try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
              {
                shouldPlay: true,
                isLooping: true,
                volume: 0.8,
              }
            );
            
            ringtoneSound.current = sound;
            ringtoneLoaded = true;
            console.log('[IncomingCall] Online ringtone loaded successfully');
          } catch (error) {
            console.log('[IncomingCall] Online ringtone failed, trying local notification approach');
          }

          // Approach 2: If online ringtone fails, use repeated notification sounds
          if (!ringtoneLoaded) {
            notificationIntervalRef.current = setInterval(async () => {
              try {
                // Play notification sound repeatedly
                const repeatedNotification = await Notifications.scheduleNotificationAsync({
                  content: {
                    title: `📞 ${callType === 'video' ? 'Video' : 'Voice'} Call`,
                    body: `${displayName} is calling...`,
                    sound: true,
                  },
                  trigger: null,
                });
                
                // Store notification ID for cleanup
                setNotificationIds(prev => [...prev, repeatedNotification]);
              } catch (e) {
                console.log('[IncomingCall] Notification sound failed:', e.message);
              }
            }, 3000); // Play notification every 3 seconds

            ringtoneSound.current = { stop: () => clearInterval(notificationIntervalRef.current) };
            console.log('[IncomingCall] Using repeated notification sounds as ringtone');
          }
          
          setIsRingtoneLoaded(true);
          
        } catch (audioError) {
          console.log('[IncomingCall] All audio approaches failed, using vibration only');
        }

        // Set auto-stop timeout to prevent infinite ringing (e.g., 30 seconds)
        autoStopTimeoutRef.current = setTimeout(() => {
          console.log('[IncomingCall] Auto-stopping ringtone after timeout');
          stopRingtone();
        }, 30000); // 30 seconds

        console.log('[IncomingCall] Ringtone and vibration started');

      } catch (error) {
        console.log('[IncomingCall] Error starting ringtone:', error);
        // Fallback: Just use vibration
        const vibrationPattern = [0, 1000, 1000];
        Vibration.vibrate(vibrationPattern, true);
      }
    };

    startRingtoneAndVibration();

    // Cleanup function
    return () => {
      stopRingtone();
    };
  }, [callType, displayName]);

  const stopRingtone = async () => {
    try {
      console.log('[IncomingCall] Stopping ringtone and vibration...');
      
      // Stop vibration
      Vibration.cancel();
      
      // Stop audio ringtone
      if (ringtoneSound.current) {
        if (ringtoneSound.current.stop) {
          // This is an interval-based ringtone
          ringtoneSound.current.stop();
        } else if (ringtoneSound.current.stopAsync) {
          // This is an Audio.Sound object
          await ringtoneSound.current.stopAsync();
          await ringtoneSound.current.unloadAsync();
        }
        ringtoneSound.current = null;
      }
      
      // Clear notification interval
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
      
      // Clear auto-stop timeout
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
      
      // Cancel all scheduled notifications
      if (notificationIds.length > 0) {
        try {
          await Promise.all(notificationIds.map(id => Notifications.dismissNotificationAsync(id)));
          setNotificationIds([]);
          console.log('[IncomingCall] All notifications cancelled');
        } catch (error) {
          console.log('[IncomingCall] Error cancelling notifications:', error);
        }
      }
      
      setIsRingtoneLoaded(false);
    } catch (error) {
      console.log('[IncomingCall] Error stopping ringtone:', error);
    }
  };

  // Log all incoming params for debugging
  console.log('[IncomingCall] route.params:', route.params);
  console.log('[IncomingCall] callerName:', displayName);
  console.log('[IncomingCall] callerAvatar:', callerData);
  console.log('[IncomingCall] callType:', callType);
  console.log('[IncomingCall] channelName:', channelName);
  console.log('[IncomingCall] callerId:', callerId);
  console.log('[IncomingCall] agoraToken:', agoraToken);
  console.log('[IncomingCall] chatId:', chatId);

  // Retrieve current user and chatId if not provided
  useEffect(() => {
    const retrieveUserData = async () => {
      try {
        if (!currentUser) {
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setCurrentUser(parsedUser);
            console.log('[IncomingCall] Retrieved current user:', parsedUser.username || parsedUser.name);
          }
        }
        
        if (!chatId && currentUser && callerId) {
          // Try to construct chatId if not provided
          const constructedChatId = `${currentUser._id}-${callerId}`;
          setChatId(constructedChatId);
          console.log('[IncomingCall] Constructed chatId:', constructedChatId);
        }
      } catch (error) {
        console.error('[IncomingCall] Error retrieving user data:', error);
      }
    };
    
    retrieveUserData();
  }, [currentUser, chatId, callerId]);

  // Cleanup effect to ensure notifications are cancelled on unmount
  useEffect(() => {
    return () => {
      // Cancel all notifications and clear intervals when component unmounts
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
      
      // Clear auto-stop timeout
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
      
      // Cancel all scheduled notifications
      if (notificationIds.length > 0) {
        notificationIds.forEach(id => {
          try {
            Notifications.dismissNotificationAsync(id);
          } catch (error) {
            console.log('[IncomingCall] Error cancelling notification on unmount:', error);
          }
        });
      }
      
      // Stop vibration
      Vibration.cancel();
    };
  }, [notificationIds]);

  // Accept call: emit call_response, navigate to call screen
  const handleAccept = async () => {
    console.log('[IncomingCall] Accept pressed');
    
    // Stop ringtone immediately
    await stopRingtone();
    
    const responseData = {
      toUserId: callerId,
      response: 'accepted',
      channelName: channelName,
      callType: callType,
    };
    console.log('[IncomingCall] Emitting call_response (accepted):', responseData);
    SocketManager.emitCallResponse(responseData);
    console.log('[IncomingCall] Navigating to', callType === 'video' ? 'VideoCall' : 'VoiceCall', 'with params:', {
      channelName: channelName,
      agoraToken,
      callerId,
      callerName,
      callerAvatar,
    });
    navigation.navigate(callType === 'video' ? 'VideoCall' : 'VoiceCall', {
      channelName: channelName,
      agoraToken,
      callerId,
      callerName: displayName,
      callerAvatar: callerData,
      localUid: Math.floor(Math.random() * 1000000), // Generate UID for receiver
      contactName: displayName || 'User',
      contactImage: getProfileImageSource(callerData),
      chatId: chatId,
      currentUser: currentUser,
      otherUserId: callerId,
      callType: callType,
    });
  };

  // Decline call: emit call_response, close modal
  const handleDecline = async () => {
    console.log('[IncomingCall] Decline pressed');
    
    // Stop ringtone immediately
    await stopRingtone();
    
    const responseData = {
      toUserId: callerId,
      response: 'declined',
      channelName: channelName,
      callType: callType,
    };
    console.log('[IncomingCall] Emitting call_response (declined):', responseData);
    SocketManager.emitCallResponse(responseData);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Top left compress icon */}
      <TouchableOpacity style={styles.expandIcon} onPress={() => navigation.goBack()}>
        <Image source={compressImg} style={{ width: 24, height: 24 }} />
      </TouchableOpacity>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Animated.View style={[
          styles.outerAvatarRing,
          { borderColor: outerRingOpacity.interpolate({
            inputRange: [0.2, 0.8],
            outputRange: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.8)']
          })}
        ]}>
          <Animated.View style={[
            styles.avatarRing,
            { borderColor: innerRingOpacity.interpolate({
              inputRange: [0.2, 0.8],
              outputRange: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.8)']
            })}
          ]}>
            <Image
              source={getProfileImageSource(callerData)}
              style={styles.avatar}
            />
          </Animated.View>
        </Animated.View>
      </View>
      {/* Name and status */}
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.status}>Incoming {callType === 'video' ? 'Video' : 'Voice'} Call...</Text>
      {/* Accept/Decline buttons */}
      <View style={styles.buttonRow}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={handleDecline}>
            <MaterialIcons name="call-end" size={36} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.buttonText}>Decline</Text>
        </View>
                 <View style={styles.buttonContainer}>
           <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAccept}>
             {callType === 'video' ? (
               <Image 
                 source={require('../../assets/icons/cam.png')} 
                 style={{ width: 36, height: 26 }} 
               />
             ) : (
               <MaterialIcons name="call" size={36} color="#fff" />
             )}
           </TouchableOpacity>
           <Text style={styles.buttonText}>Accept</Text>
         </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 2,
    padding: 4,
  },
  avatarContainer: {
    marginTop: 40,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerAvatarRing: {
    width: 248,
    height: 248,
    borderRadius: 124,
    borderWidth: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 224,
    height: 224,
    borderRadius:155,
    borderWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 8,
    marginBottom: 48,
    textAlign: 'center',
  },
  status: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 56,
    width: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  declineButton: {
    backgroundColor: '#dc3545',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
});

export default IncomingCall; 