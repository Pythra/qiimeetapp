import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/font';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigateToChatStack } from '../utils/navigationRef';
import axios from 'axios';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ConnectionAcceptedPopup = ({ visible, onClose, connectionData }) => {
  const { token, user: currentUser, getImageSource } = useAuth();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debug logging - only log when props change meaningfully
  useEffect(() => {
    if (visible || connectionData) {
      console.log('[ConnectionAcceptedPopup] Props changed:', { visible, connectionData });
    }
  }, [visible, connectionData]);

  // Fetch the other user's data when popup becomes visible
  useEffect(() => {
    if (visible && connectionData) {
      console.log('[ConnectionAcceptedPopup] Popup became visible, fetching user data for:', connectionData);
      fetchOtherUser();
    } else if (!visible) {
      console.log('[ConnectionAcceptedPopup] Popup hidden, clearing user data');
      setOtherUser(null);
      setLoading(true);
    }
  }, [visible, connectionData]);

  const fetchOtherUser = async () => {
    try {
      setLoading(true);
      console.log('[ConnectionAcceptedPopup] Starting to fetch user data...');
      
      if (!token || !connectionData) {
        console.warn('[ConnectionAcceptedPopup] Missing token or connectionData:', { token: !!token, connectionData });
        setLoading(false);
        return;
      }
      
      // For connection_accepted events, we want to show the accepter's details to the requester
      // The accepterId is the user who accepted the connection request
      const userIdToFetch = connectionData.accepterId;
      if (!userIdToFetch) {
        console.warn('[ConnectionAcceptedPopup] No accepterId found in connectionData:', connectionData);
        setLoading(false);
        return;
      }
      
      console.log('[ConnectionAcceptedPopup] Fetching accepter details for ID:', userIdToFetch);
      
      const response = await axios.get(`${API_BASE_URL}/auth/user/${userIdToFetch}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // Add timeout
        }
      );
      
      console.log('[ConnectionAcceptedPopup] Accepter data fetched successfully:', response.data);
      setOtherUser(response.data);
    } catch (err) {
      // Silently handle errors - popup will work with basic info
      console.warn('[ConnectionAcceptedPopup] Could not fetch user details, continuing with basic info:', err.message);
      
      // Set a basic user object so the popup can still function
      setOtherUser({
        username: 'User',
        profilePictures: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;
    
    console.log('[ConnectionAcceptedPopup] Sending message:', message.trim());
    console.log('[ConnectionAcceptedPopup] Navigating to chat with accepter:', connectionData.accepterId);
    
    // Navigate directly to ChatInterface with the message and user ID
    navigateToChatStack('ChatInterface', {
      otherUserId: connectionData.accepterId,
      initialMessage: message.trim(),
      forceCreateChat: true
    });
    
    // Close the popup
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.fullscreenContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EC066A" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Main Content */}
              <View style={styles.mainContent}>
                {/* Card Stack */}
                <View style={styles.cardStack}>
                  {/* Back Card - Show current user's profile picture */}
                  <View style={styles.backCard}>
                    <Image 
                      source={getImageSource(currentUser?.profilePictures?.[1] || currentUser?.profilePictures?.[0])} 
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  </View>
                  
                  {/* Front Card - Show other user's profile picture */}
                  <View style={styles.frontCard}>
                    <Image 
                      source={getImageSource(otherUser?.profilePictures?.[0])} 
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Heart Icon */}
                  <View style={styles.heartContainer}>
                    <MaterialIcons name="favorite" size={48} color="#fff" />
                  </View>
                </View>

                {/* Title - Moved below the images */}
                <Text style={styles.title}>Connection Accepted!</Text>
                
                {/* Description Text */}
                <Text style={styles.subtitle}>
                  Great! Your connection request has been accepted. Start a conversation and see where this connection takes you.
                </Text>
              </View>

              {/* Input Container */}
              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  <View style={styles.inputBubble}>
                    <TextInput
                      style={styles.input}
                      placeholder="Type your message..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={message}
                      onChangeText={setMessage}
                      onSubmitEditing={handleSendMessage}
                      multiline
                      returnKeyType="send"
                    />
                  </View>
                  {message.trim() ? (
                    <TouchableOpacity 
                      style={styles.sendButton}
                      onPress={handleSendMessage}
                      disabled={!message.trim() || isSending}
                    >
                      <Ionicons name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.micButton}>
                      <Ionicons name="mic" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16, 
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: FONTS?.bold || 'System',
  },
  cardStack: {
    position: 'relative',
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Reduced margin to bring title closer
  },
  backCard: {
    position: 'absolute',
    width: 152,
    height: 192,
    borderRadius: 8,
    backgroundColor: '#333',
    transform: [
      { translateX: 40 },
      { rotate: '23.98deg' }
    ],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 1,
  },
  frontCard: {
    position: 'absolute',
    width: 152,
    height: 192,
    borderRadius: 8,
    backgroundColor: '#333',
    transform: [
      { translateX: -40 },
      { rotate: '-23.98deg' }
    ],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  heartContainer: {
    position: 'absolute',
    top: '75%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 64,
    height: 64,
    borderRadius: 90,
    backgroundColor: '#EC066A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 15,
    zIndex: 999,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: FONTS?.regular || 'System',
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40, // Extra padding for safe area
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBubble: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 90,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    minHeight: 50,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff2d7a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ec066a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ConnectionAcceptedPopup; 