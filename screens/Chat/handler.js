// handler.js
// Logic handlers for ChatInterface. Pure functions only, no React hooks or UI.

// Example: handleInputFocus, handleInputBlur, handleChangeText, groupMessagesByTime, handleSend, handleEmojiSelect, toggleEmojiPicker, handleMicPress, handleGallerySelect

// Note: Some handlers require state setters, refs, or navigation. Pass them as arguments.

export function handleInputFocus(setIsTyping, setEmojiVisible) {
  setIsTyping(true);
}

export function handleInputBlur(message, setIsTyping) {
  if (!message) setIsTyping(false);
}

export function handleChangeText(text, setMessage, setIsTyping) {
  setMessage(text);
  if (text.length > 0) setIsTyping(true);
  else setIsTyping(false);
}

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
      if (timeDiff <= 30000 && msg.sent === currentGroup.sent) {
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

export function handleSend({
  message,
  setMessages,
  setMessage,
  setIsTyping, 
  inputRef,
  setOtherUserTyping
}) {
  if (!message.trim()) return;
  const newMessage = {
    text: message,
    time: new Date(),
    sent: true,
    status: 'sending',
    id: Date.now().toString()
  };
  setMessages((prev) => [...prev, newMessage]);
  setMessage('');
  setIsTyping(false); 
  if (inputRef.current) inputRef.current.blur();
  setTimeout(() => {
    setMessages(prev => prev.map(msg =>
      msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
    ));
  }, 100);
  setTimeout(() => {
    setMessages(prev => prev.map(msg =>
      msg.id === newMessage.id ? { ...msg, status: 'read' } : msg
    ));
  }, 5000);
  setTimeout(() => {
    setOtherUserTyping(true);
  }, 15000);
  setTimeout(() => {
    setOtherUserTyping(false);
    setMessages(prev => [...prev, {
      text: "Hey! How are you doing?",
      time: new Date(),
      sent: false,
      id: (Date.now() + 1).toString()
    }]);
  }, 20000);
}

export function handleEmojiSelect(emoji, setMessage, setIsTyping) {
  setMessage(prev => prev + emoji);
  setIsTyping(true);
}

export function toggleEmojiPicker(setEmojiVisible, inputRef, setIsTyping) {
  setEmojiVisible(prev => !prev);
  if (inputRef.current) inputRef.current.blur();
  setIsTyping(true);
}

export function handleMicPress({
  setIsRecording,
  setMessages,
  setShowReceiverRecording
}) {
  setIsRecording(true);
  setMessages((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      audio: true,
      isRecording: true,
      sent: true,
      time: new Date(),
      status: 'sending',
    },
  ]);
  setTimeout(() => {
    setShowReceiverRecording(true);
  }, 1000);
  setTimeout(() => {
    setIsRecording(false);
    setShowReceiverRecording(false);
    setMessages((prev) => {
      const updated = prev.map(msg =>
        msg.isRecording && msg.sent
          ? { ...msg, isRecording: false, status: 'sent' }
          : msg
      );
      return [
        ...updated,
        {
          id: (Date.now() + 1).toString(),
          audio: true,
          isRecording: false,
          sent: false,
          time: new Date(),
        },
      ];
    });
  }, 6000);
}

// handleGallerySelect is async and needs Alert, ImagePicker, setMessages, setPlusModalVisible, model1Img
// Pass dependencies as arguments. UI: Alert.alert stubbed.
export async function handleGallerySelect({
  ImagePicker,
  Alert,
  setMessages,
  setPlusModalVisible,
  model1Img
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
      const imageMsg = {
        id: Date.now().toString(),
        image: result.assets[0].uri,
        sent: true,
        time: new Date(),
        status: 'sending',
      };
      setMessages((prev) => [...prev, imageMsg]);
      setPlusModalVisible(false);
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === imageMsg.id ? { ...msg, status: 'sent' } : msg
        ));
      }, 100);
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === imageMsg.id ? { ...msg, status: 'read' } : msg
        ));
      }, 5000);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          image: model1Img,
          sent: false,
          time: new Date(),
        }]);
      }, 5000);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to pick image');
  }
} 