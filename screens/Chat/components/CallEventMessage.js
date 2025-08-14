import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CallEventMessage = ({ message, isSent }) => {
  const { callType, callStatus } = message.callData || {};
  
  // Determine icon and color based on call type and status
  const getCallIcon = () => {
    if (callType === 'video') {
      switch (callStatus) {
        case 'started':
        case 'ended':
          return { name: 'videocam', color: '#4CAF50' };
        case 'missed':
        case 'declined':
          return { name: 'videocam-off', color: '#F44336' };
        default:
          return { name: 'videocam', color: '#666' };
      }
    } else {
      switch (callStatus) {
        case 'started':
        case 'ended':
          return { name: 'call', color: '#4CAF50' };
        case 'missed':
        case 'declined':
          return { name: 'call-outline', color: '#F44336' };
        default:
          return { name: 'call', color: '#666' };
      }
    }
  };

  const icon = getCallIcon();

  return (
    <View style={[styles.container, isSent ? styles.sentContainer : styles.receivedContainer]}>
      <View style={[styles.callEventBubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
        <Ionicons name={icon.name} size={16} color={icon.color} style={styles.icon} />
        <Text style={[styles.callText, isSent ? styles.sentText : styles.receivedText]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    alignItems: 'center',
  },
  sentContainer: {
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignItems: 'flex-start',
  },
  callEventBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  sentBubble: {
    backgroundColor: 'rgba(255, 45, 122, 0.1)',
  },
  receivedBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  icon: {
    marginRight: 6,
  },
  callText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sentText: {
    color: '#ff2d7a',
  },
  receivedText: {
    color: '#666',
  },
});

export default CallEventMessage; 