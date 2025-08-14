import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  TextInput,
  SafeAreaView,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import { useAuth } from '../../components/AuthContext';
import { API_BASE_URL } from '../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigateToChatStack, navigationRef } from '../../utils/navigationRef';
import axios from 'axios';

const AcceptedConnection = ({ navigation, route }) => {
  const { user: currentUser, token, getImageSource, getProfileImageSource } = useAuth();
  const { targetUserId, acceptedBy } = route.params || {};
  const otherUserId = acceptedBy || targetUserId;
  
  const [message, setMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the other user's data
  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        setLoading(true);
        
        if (!token || !otherUserId) {
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_BASE_URL}/auth/user/${otherUserId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setOtherUser(response.data);
      } catch (err) {
        Alert.alert('Error', 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOtherUser();
  }, [otherUserId, token]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      navigation.navigate('MainTabs', {
        screen: 'Chat',
        params: {
          screen: 'ChatInterface',
          params: {
            otherUserId: otherUserId,
            initialMessage: message.trim(),
            forceCreateChat: true
          }
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    } finally {
      setIsSending(false);
    }
  };



  // Helper to calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#EC066A" />
        </View>
      </SafeAreaView>
    );
  }

  // Add returnRoute from params
  const { returnRoute } = route.params || {};

  // Modify header close button handler
  const handleClose = () => {
    if (returnRoute) {
      // If we have a return route, navigate back to it
      navigation.navigate(returnRoute.name, returnRoute.params);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Content - takes up available space */}
      <View style={styles.content}>
        {/* Card Stack */}
        <View style={styles.cardStack}>
          {/* Back Card */}
          <View style={styles.backCard}>
            <Image 
              source={getImageSource(otherUser?.profilePictures?.[1] || otherUser?.profilePictures?.[0])} 
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>
          
          {/* Front Card */}
          <View style={styles.frontCard}>
            <Image 
              source={getImageSource(otherUser?.profilePictures?.[0])} 
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>

          {/* Heart Icon - moved to bottom of JSX structure */}
          <View style={styles.heartContainer}>
            <MaterialIcons name="favorite" size={39} color="#fff" />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>Connection Accepted</Text>
          <Text style={styles.subtitle}>
            Great news! {otherUser?.username || 'User'} has accepted your connection request. Start chatting and get to know each other better.
          </Text>
          <Text style={[styles.subtitle, { marginTop: 9 }]}>
            Make the first move and say hello!          
          </Text>
        </View>
      </View>

      {/* Message Input - positioned at bottom like ChatInterface */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardStack: {
    position: 'relative',
    width: 300,
    height: 280,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    elevation: 15, // Higher elevation for Android
    zIndex: 999, // Very high z-index
  },
  textContent: {
    alignItems: 'center', 
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: FONTS?.bold || 'System',
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: FONTS?.regular || 'System',
  },
  inputContainer: {
    backgroundColor: '#121212',
    paddingHorizontal: 12,
    paddingBottom: 16,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default AcceptedConnection;