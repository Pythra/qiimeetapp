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
  Platform
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';

const AcceptedConnection = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message logic
      console.log('Message sent:', message);
      setMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Card Stack */}
        <View style={styles.cardStack}>
          {/* Back Card */}
          <View style={styles.backCard}>
            <Image 
              source={require('../../assets/guy1.jpg')} 
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>
          
          {/* Front Card */}
          <View style={styles.frontCard}>
            <Image 
              source={require('../../assets/model2.jpg')} 
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>

          {/* Heart Icon */}
          <View style={styles.heartContainer}>
            <MaterialIcons name="favorite" size={39} color="#fff" />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>Connection Accepted</Text>
          <Text style={styles.subtitle}>
            Great news! Emilia has accepted your connection request. Start chatting and get to know each other better.
          </Text>
          <Text style={[styles.subtitle, { marginTop: 9 }]}>
            Make the first move and say hello!          
          </Text>
        </View>
      </View>

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[
          styles.messageContainer,
          isKeyboardVisible && {
            position: 'absolute',
            bottom: keyboardHeight,
            left: 0,
            right: 0,
            backgroundColor: '#000'
          }
        ]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Send a message"
              placeholderTextColor="#888"
              multiline={false}
            />
            <TouchableOpacity 
              style={[styles.sendButton, message.trim() && styles.sendButtonActive]}
              onPress={handleSendMessage}
              disabled={!message.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={"#EC066A"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  },
  cardStack: {
    position: 'relative',
    width: 300, // slightly wider
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
      { translateX: 40 },  // NEW: manually shift right
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
      { translateX: -40 },  // NEW: manually shift left
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
    top: '70%',
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
    elevation: 4,
    zIndex: 3,
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
  messageContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 90,
    paddingHorizontal: 16,
    paddingVertical: 12, 
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS?.regular || 'System',
    minHeight: 20,
  },
  sendButton: {
    width: 39,
    height: 39,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: 'transparent',
  },
});

export default AcceptedConnection;