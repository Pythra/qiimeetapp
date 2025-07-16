// ChatFunctions.js

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../../../frontend.env.js';

// Group messages by time for display
export function groupMessagesByTime(messages) {
  const grouped = [];
  let currentGroup = null;

  messages.forEach((msg) => {
    if (!currentGroup) {
      currentGroup = {
        time: msg.time,
        messages: [msg],
        sent: msg.sent
      };
    } else {
      const timeDiff = Math.abs(msg.time.getTime() - currentGroup.time.getTime());
      if (timeDiff <= 30000 && msg.sent === currentGroup.sent) { // 30 seconds
        currentGroup.messages.push(msg);
      } else {
        grouped.push(currentGroup);
        currentGroup = {
          time: msg.time,
          messages: [msg],
          sent: msg.sent
        };
      }
    }
  });

  if (currentGroup) {
    grouped.push(currentGroup);
  }

  return grouped;
}

export async function handleSend({
  message,
  chatId,
  user,
  otherUserId,
  setMessage,
  setIsTyping, 
  inputRef,
  setMessages,
  emitTypingStatus, // Add this parameter
}) {
  if (!message.trim() || !chatId || !user?._id || !otherUserId) {
    Alert.alert('Error', 'Missing required parameters for sending message');
    return;
  }

  // Add a temporary "sending" message
  const tempMessageId = `temp_${Date.now()}`;
  const tempMessage = {
    id: tempMessageId,
    text: message,
    time: new Date(),
    sent: true,
    status: 'sending',
    isTemp: true, // Flag to identify temporary messages
  };
  
  setMessages(prev => [...prev, tempMessage]);

  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/chat/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        senderId: user._id,
        receiverId: otherUserId,
        chatId,
        message,
        messageType: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    setMessage('');
    setIsTyping(false); 
    inputRef.current?.blur();
    
    // Stop typing indicator immediately when message is sent
    if (emitTypingStatus) {
      emitTypingStatus(false);
    }
  } catch (err) {
    console.error('Error sending message:', err);
    Alert.alert('Error', 'Failed to send message');
    
    // Remove the temporary message on error
    setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
  }
}

export async function handleGallerySelect({
  chatId,
  user,
  otherUserId,
  setMessages,
  setPlusModalVisible,
  emitTypingStatus
}) {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageAsset = result.assets[0];
      const tempMessageId = Date.now().toString();
      // Add a temporary message to UI
      const tempMessage = {
        id: tempMessageId,
        image: imageAsset.uri,
        sent: true,
        time: new Date(),
        status: 'sending',
        isTemp: true,
      };
      setMessages((prev) => [...prev, tempMessage]);
      setPlusModalVisible(false);
      // Upload image to backend
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('Profilepictures', {
        uri: imageAsset.uri,
        name: imageAsset.fileName || `chat_image.jpg`,
        type: imageAsset.type || 'image/jpeg',
      });
      // No userId for chat images
      const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      if (!uploadRes.ok) {
        throw new Error('Failed to upload image');
      }
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;
      // Send image message to backend
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
          message: imageUrl,
          messageType: 'image',
        }),
      });
      if (!sendRes.ok) {
        throw new Error('Failed to send image message');
      }
      const sendData = await sendRes.json();
      const newMessage = sendData.messageData;
      // Replace temp message with real message
      setMessages((prev) => prev.map(msg =>
        msg.id === tempMessageId ? {
          id: newMessage._id,
          image: imageUrl,
          sent: true,
          time: new Date(newMessage.timestamp),
          status: newMessage.isRead ? 'read' : (newMessage.isDelivered ? 'delivered' : 'sent'),
          senderId: newMessage.senderId,
          isRead: newMessage.isRead,
          isDelivered: newMessage.isDelivered,
        } : msg
      ));
      // Stop typing indicator if needed
      if (emitTypingStatus) emitTypingStatus(false);
    }
  } catch (error) {
    console.error('Error sending image:', error);
    Alert.alert('Error', error.message || 'Failed to send image');
    // Remove the temporary message on error
    setMessages(prev => prev.filter(msg => !msg.isTemp));
  }
}

export function handleMicPress(setIsRecording, setMessages, setShowReceiverRecording) {
  setIsRecording(true);
  // Add a temporary 'recording' message
  setMessages((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      audio: true, // just a flag for UI
      isRecording: true,
      sent: true,
      time: new Date(),
      status: 'sending',
    },
  ]);
  // Show receiver recording animation after 1s
  setTimeout(() => {
    setShowReceiverRecording(true);
  }, 1000);
  // After 5s, remove recording, show receiver response
  setTimeout(() => {
    setIsRecording(false);
    setShowReceiverRecording(false);
    setMessages((prev) => {
      // Update the last sent recording message to no longer be isRecording
      const updated = prev.map(msg =>
        msg.isRecording && msg.sent
          ? { ...msg, isRecording: false, status: 'sent' }
          : msg
      );
      // Add the receiver's message after
      return [
        ...updated,
        {
          id: (Date.now() + 1).toString(),
          audio: true,
          sent: false,
          time: new Date(),
        },
      ];
    });
  }, 6000);
}

export async function markMessageAsRead(messageId) {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/chat/message/${messageId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark message as read');
    }

    return await response.json();
  } catch (err) {
    console.error('Error marking message as read:', err);
  }
}

export async function markMessageAsDelivered(messageId) {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/chat/message/${messageId}/delivered`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark message as delivered');
    }

    return await response.json();
  } catch (err) {
    console.error('Error marking message as delivered:', err);
  }
}

export async function markAllMessagesAsRead(messages, currentUserId) {
  try {
    const unreadMessages = messages.filter(msg => 
      !msg.sent && !msg.isRead && msg.senderId?._id !== currentUserId
    );

    const promises = unreadMessages.map(msg => markMessageAsRead(msg.id));
    await Promise.all(promises);
  } catch (err) {
    console.error('Error marking all messages as read:', err);
  }
}

export async function markAllMessagesAsDelivered(messages, currentUserId) {
  try {
    const undeliveredMessages = messages.filter(msg => 
      !msg.sent && !msg.isDelivered && msg.senderId?._id !== currentUserId
    );

    const promises = undeliveredMessages.map(msg => markMessageAsDelivered(msg.id));
    await Promise.all(promises);
  } catch (err) {
    console.error('Error marking all messages as delivered:', err);
  }
}
