 // ChatFunctions.js

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from '../../../env.js';
import axios from 'axios';
import { safeJsonParse } from '../../../utils/safeJsonParse';

// Group messages by time for display with date dividers
export function groupMessagesByTime(messages) {
  if (!messages || messages.length === 0) return [];
  
  // Since messages come in reversed order (newest first) for inverted FlatList,
  // we need to process them in chronological order for proper date dividers
  const sortedMessages = [...messages].sort((a, b) => new Date(a.time) - new Date(b.time));
  
  const grouped = [];
  let currentGroup = null;
  let lastDate = null;

  sortedMessages.forEach((msg, idx) => {
    const msgDate = new Date(msg.time);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if we need a date divider (when date changes or first message)
    let needsDateDivider = false;
    let dateDivider = null;
    
    if (lastDate === null || msgDate.toDateString() !== lastDate.toDateString()) {
      needsDateDivider = true;
      
      if (msgDate.toDateString() === today.toDateString()) {
        dateDivider = 'Today';
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        dateDivider = 'Yesterday';
      } else {
        dateDivider = msgDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      lastDate = msgDate;
    }
    
    // If we need a date divider, close current group and add the divider
    if (needsDateDivider) {
      if (currentGroup) {
        grouped.push(currentGroup);
        currentGroup = null;
      }
      
      // Add date divider
      grouped.push({
        type: 'dateDivider',
        date: dateDivider,
        time: msgDate
      });
    }

        // Now handle the message grouping
    if (!currentGroup) {
      currentGroup = {
        time: msg.time,
        messages: [msg],
        sent: msg.sent,
        type: 'messageGroup'
      };
    } else {
      // For sent messages: group consecutive sent messages regardless of read status
      if (msg.sent && currentGroup.sent) {
        // Group consecutive sent messages together, regardless of read status
        // This ensures unread messages are properly grouped without interference
        currentGroup.messages.push(msg);
      } else if (!msg.sent && !currentGroup.sent) {
        // For received messages: group by time and sender as before
        const timeDiff = Math.abs(new Date(msg.time).getTime() - new Date(currentGroup.time).getTime());
        if (timeDiff <= 30000) { // 30 seconds
          currentGroup.messages.push(msg);
        } else {
          grouped.push(currentGroup);
          currentGroup = {
            time: msg.time,
            messages: [msg],
            sent: msg.sent,
            type: 'messageGroup'
          };
        }
      } else {
        // Different sender type, start new group
        grouped.push(currentGroup);
        currentGroup = {
          time: msg.time,
          messages: [msg],
          sent: msg.sent,
          type: 'messageGroup'
        };
      }
    }
  });

  // Add the last group if it exists
  if (currentGroup) {
    grouped.push(currentGroup);
  }

  // Since the FlatList is inverted, we need to reverse the grouped array
  // so that the newest items (including date dividers) appear at index 0
  // which will be rendered at the bottom of the inverted list
  return grouped.reverse();
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
  if (!message.trim() || !user?._id || !otherUserId) {
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
    // Always fetch or create the chat first
    let currentChatId = chatId;
    const chatResponse = await fetch(`${API_BASE_URL}/chat/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        participant1Id: user._id,
        participant2Id: otherUserId,
      }),
    });
    const chatResponseText = await chatResponse.text();
    if (chatResponse.ok) {
      const chatData = safeJsonParse(chatResponseText);
      if (chatData && chatData.chat && chatData.chat.chatId) {
        currentChatId = chatData.chat.chatId;
      }
    } else {
      throw new Error('Failed to ensure chat exists: ' + chatResponseText);
    }

    // Now send the message using the correct chatId
    const response = await fetch(`${API_BASE_URL}/chat/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        senderId: user._id,
        receiverId: otherUserId,
        chatId: currentChatId,
        message,
        messageType: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    setMessage('');
    setIsTyping(false); 
    if (emitTypingStatus) {
      emitTypingStatus(false);
    }
  } catch (err) {
    console.error('Error sending message:', err);
    Alert.alert('Error', 'Failed to send message');
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
    console.log('handleGallerySelect called with:', { chatId, user: user._id, otherUserId });
    console.log('API_BASE_URL:', API_BASE_URL);
    
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
    
    console.log('ImagePicker result:', result);
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageAsset = result.assets[0];
      const tempMessageId = Date.now().toString();
      
      // Add a temporary message to UI with stable properties
      const tempMessage = {
        id: tempMessageId,
        image: imageAsset.uri,
        sent: true,
        time: new Date(),
        status: 'sending',
        isTemp: true,
        // Add stable properties to prevent unnecessary re-renders
        senderId: user._id,
        receiverId: otherUserId,
        chatId: chatId,
      };
      setMessages((prev) => [...prev, tempMessage]);
      setPlusModalVisible(false);
      
      try {
        const token = await AsyncStorage.getItem('token');
        let currentChatId = chatId;
        
        // Always fetch or create the chat first
        const chatResponse = await fetch(`${API_BASE_URL}/chat/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            participant1Id: user._id,
            participant2Id: otherUserId,
          }),
        });
        const chatResponseText = await chatResponse.text();
        if (chatResponse.ok) {
          try {
            const chatData = safeJsonParse(chatResponseText);
            if (chatData.chat && chatData.chat.chatId) {
              currentChatId = chatData.chat.chatId;
            }
          } catch (e) {
            console.error('Error parsing chat response:', e);
          }
        } else {
          throw new Error('Failed to ensure chat exists: ' + chatResponseText);
        }
        
        // Check file existence and copy to cache if needed
        let uploadUri = imageAsset.uri;
        const fileInfo = await FileSystem.getInfoAsync(uploadUri);
        if (!fileInfo.exists) {
          Alert.alert('File does not exist', 'The selected image file could not be found on your device.');
          return;
        }
        // Copy to cache to ensure accessibility
        const newPath = FileSystem.cacheDirectory + 'upload_' + Date.now() + '.jpg';
        await FileSystem.copyAsync({ from: uploadUri, to: newPath });
        uploadUri = newPath;
        // 2. Upload image (always use 'Profilepictures' as the field name)
        const formData = new FormData();
        formData.append('Profilepictures', {
          uri: uploadUri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        });
        // Use fetch for upload, no headers
        const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData,
        });
        const uploadText = await uploadRes.text();
        if (!uploadRes.ok) {
          throw new Error('Image upload failed: ' + uploadText);
        }
        let uploadData = safeJsonParse(uploadText);
        if (!uploadData) {
          throw new Error('Image upload failed: Invalid server response');
        }
        const imageUrl = uploadData.url;
        if (!imageUrl) {
          throw new Error('No image URL returned from upload');
        }
        
        // 3. Add image to chat pictures
        const addPicRes = await fetch(`${API_BASE_URL}/chat/pictures`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chatId: currentChatId, pictures: [imageUrl] }),
        });
        
        if (!addPicRes.ok) {
          // Don't throw error here, just log warning and continue
        }
        
        // 4. Send image message
        const sendRes = await fetch(`${API_BASE_URL}/chat/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            senderId: user._id,
            receiverId: otherUserId,
            chatId: currentChatId,
            message: imageUrl,
            messageType: 'image',
          }),
        });
        
        const sendDataText = await sendRes.text();
        if (!sendRes.ok) {
          throw new Error('Failed to send image message: ' + sendDataText);
        }
        
        let sendData = safeJsonParse(sendDataText);
        if (!sendData) {
          throw new Error('Failed to parse send message response');
        }
        
        const newMessage = sendData.messageData;
        
        // Replace temp message with real message - use minimal update to prevent flickering
        setMessages((prev) => prev.map(msg =>
          msg.id === tempMessageId ? {
            ...msg, // Preserve all existing properties
            id: newMessage._id,
            image: imageUrl,
            sent: true,
            time: new Date(newMessage.timestamp),
            status: newMessage.isRead ? 'read' : (newMessage.isDelivered ? 'delivered' : 'sent'),
            senderId: newMessage.senderId,
            isRead: newMessage.isRead,
            isDelivered: newMessage.isDelivered,
            isTemp: false, // Mark as no longer temporary
            messageType: 'image',
            // Preserve exact same references for stable properties
            receiverId: msg.receiverId,
            chatId: msg.chatId,
          } : msg
        ));
        
      } catch (error) {
        console.error('Error sending image:', error);
        Alert.alert('Error', error.message || 'Failed to send image');
        
        // Remove the temporary message on error
        setMessages(prev => prev.filter(msg => !msg.isTemp));
      }
      
      // Stop typing indicator if needed
      if (emitTypingStatus) {
        emitTypingStatus(false);
      }
    }
  } catch (error) {
    console.error('Error in handleGallerySelect:', error);
    Alert.alert('Error', error.message || 'Failed to pick or send image');
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

// Function to send call event messages to chat
export async function sendCallEventMessage({
  chatId,
  user,
  otherUserId,
  callType, // 'voice' or 'video'
  callStatus, // 'started', 'ended', 'missed', 'declined'
  duration = null, // call duration in seconds (for ended calls)
  setMessages
}) {
  if (!user?._id || !otherUserId || !chatId) {
    console.error('Missing required parameters for sending call event message');
    return;
  }

  try {
    const token = await AsyncStorage.getItem('token');
    
    // Create call event message content
    let messageContent = '';
    let callEventType = '';
    
    switch (callStatus) {
      case 'started':
        callEventType = 'call_started';
        messageContent = `${callType === 'video' ? 'Video' : 'Voice'} call started`;
        break;
      case 'ended':
        callEventType = 'call_ended';
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        messageContent = `${callType === 'video' ? 'Video' : 'Voice'} call ended • ${durationText}`;
        break;
      case 'missed':
        callEventType = 'call_missed';
        messageContent = `Missed ${callType === 'video' ? 'video' : 'voice'} call`;
        break;
      case 'declined':
        callEventType = 'call_declined';
        messageContent = `Declined ${callType === 'video' ? 'video' : 'voice'} call`;
        break;
      default:
        console.error('Invalid call status:', callStatus);
        return;
    }

    console.log('📞 [CALL EVENT] Sending call event:', {
      chatId,
      callType,
      callStatus,
      messageContent,
      callEventType,
      duration
    });

    // Send the call event message
    const response = await fetch(`${API_BASE_URL}/chat/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        senderId: user._id,
        receiverId: otherUserId,
        chatId: chatId,
        message: messageContent,
        messageType: callEventType,
        callData: {
          callType,
          callStatus,
          duration,
          timestamp: new Date().toISOString()
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📞 [CALL EVENT] Backend error:', response.status, errorText);
      throw new Error(`Failed to send call event message: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('📞 [CALL EVENT] Backend response:', responseData);
    
    // Add the call event message to the local messages state
    if (setMessages && responseData.messageData) {
      const callEventMessage = {
        id: responseData.messageData._id,
        text: messageContent,
        time: new Date(responseData.messageData.timestamp),
        sent: true,
        status: 'sent',
        messageType: callEventType,
        callData: {
          callType,
          callStatus,
          duration,
          timestamp: new Date().toISOString()
        },
        isRead: false,
        isDelivered: false,
        senderId: responseData.messageData.senderId
      };
      
      setMessages(prev => [...prev, callEventMessage]);
    }

    return responseData;
  } catch (err) {
    console.error('Error sending call event message:', err);
  }
}