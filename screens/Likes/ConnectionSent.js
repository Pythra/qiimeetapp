import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HollowButton from '../../constants/HollowButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FontAwesome6 } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';
import axios from 'axios';
const ConnectionSent = ({ route }) => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(86400); // 24 hours in seconds
  const targetUserId = route?.params?.targetUserId;
  const sentAtRef = useRef(null);

  // Helper to get and set sentAt timestamp

  useEffect(() => {
    const initTimer = async () => {
      if (!targetUserId) return;
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_BASE_URL}/auth/request-timestamp`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { targetUserId }
        });
        const sentAt = new Date(res.data.sentAt).getTime();
        sentAtRef.current = sentAt;
        const now = Date.now();
        const elapsed = Math.floor((now - sentAt) / 1000);
        const remaining = 86400 - elapsed;
        if (remaining <= 0) {
          expireRequest();
        } else {
          setTimeLeft(remaining);
        }
      } catch (e) {
        // If not found, fallback to 24 hours
        setTimeLeft(86400);
      }
    };
    initTimer();
    // eslint-disable-next-line
  }, [targetUserId]);

  // Expire request and clear timestamp
  const expireRequest = async (navigateToExpired = true) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_BASE_URL}/auth/expire-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
    } catch (err) {}
    if (navigateToExpired) {
      navigation.replace('ExpiredRequest', { targetUserId });
    }
  };

  useEffect(() => {
    if (timeLeft === 0) {
      expireRequest(true);
      return;
    }
    if (timeLeft < 0) return;
    const timer = setInterval(() => {
      // Use the initial sentAt value to calculate remaining time
      if (sentAtRef.current) {
        const now = Date.now();
        const elapsed = Math.floor((now - sentAtRef.current) / 1000);
        const remaining = 86400 - elapsed;
        setTimeLeft(remaining);
      } else {
        setTimeLeft(prev => prev - 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sentAtRef.current]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCancel = () => {
    setModalVisible(true);
  };

  const handleCancelConfirm = async () => {
    setModalVisible(false);
    await expireRequest(false);
    navigation.reset({ index: 0, routes: [{ name: 'Likes' }] });
  };

  return (
    <View style={styles.container}> 
      
      <TopHeader  
        onBack={() => navigation.goBack()}
      />


      <View style={styles.content}> 
        <Image
          source={require('../../assets/check.png')}
          style={styles.checkIcon}
        />
 
        <Text style={styles.title}>Connection Request Sent</Text>
        <Text style={styles.description}>
          The person you reached out to will be notified and can accept or decline your request. If
          they don't respond within the next 24 hours, you can reconnect.
        </Text>

        <Text style={styles.time}>{formatTime(timeLeft)}</Text>

        <HollowButton
          title="Cancel"
          onPress={handleCancel}
          style={styles.cancelButton}
        />
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.xIconContainer}>
              <FontAwesome6 name="xmark" size={67} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Are you sure you want to cancel this connection?</Text>
            <View style={styles.modalButtons}> 
              <Pressable 
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={handleCancelConfirm}
              >
                <Text style={styles.modalButtonTextConfirm}>Yes</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>No</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', 
    paddingTop:24
  }, 
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  content: {
    flex: 1, 
    top:56, // Adjust top position to avoid overlap with header
    alignItems: 'center',
    paddingHorizontal: 20, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Change to flex-start to position button on left
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    marginTop: 10, // Add margin top
  }, 
  checkIcon: {
    width:178,
    height: 178,
    tintColor: '#ec066a',
    marginBottom: 60,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'FONTS.regular',
    marginBottom: 24,
    opacity: 0.8,
  },
  time: {
    color: '#fff',
    fontSize: 32, 
    fontWeight: '600',
    fontFamily: FONTS.regular,  
  },
  cancelButton: {
    position: 'absolute',
    bottom: 110
   },
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  xIconContainer: {
    width: 104,
    height: 104,
    backgroundColor: '#dc3545',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight:'600',
    textAlign: 'center',
    marginBottom:12,
    lineHeight: 32, 
    fontFamily: FONTS.regular,
    paddingHorizontal: 12
    ,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 90,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelModalButton: {
    borderWidth: 1,
    borderColor: '#ec066a',
  },
  confirmModalButton: {
    backgroundColor: '#ec066a',
  },
  modalButtonTextCancel: {
    color: '#ec066a',
    fontWeight:'600',
    fontSize: 24,
    fontFamily: FONTS.regular,
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight:'600',
    fontFamily: FONTS.regular,
  },
});

export default ConnectionSent;
