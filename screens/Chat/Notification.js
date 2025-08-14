import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/font';
import TopHeader from '../../components/TopHeader';
import { useAuth } from '../../components/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../env';

const Notification = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update the notification in the local state
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getImageSource = (notification) => {
    // If notification has a sender with profile picture, use it
    if (notification.senderId && notification.senderId.profilePictures && notification.senderId.profilePictures.length > 0) {
      const imagePath = notification.senderId.profilePictures[0];
      if (imagePath.startsWith('http')) {
        return { uri: imagePath };
      }
      return { uri: `https://d11n4tndq0o4wh.cloudfront.net/uploads/images/${imagePath}` };
    }
    
    // Default avatar based on notification type
    switch (notification.type) {
      case 'profile_visit':
        return require('../../assets/model3.jpg');
      case 'new_message':
        return require('../../assets/model1.jpg');
      case 'new_match':
        return require('../../assets/model2.jpg');
      case 'connection_accepted':
        return require('../../assets/model1.jpg');
      case 'connection_request':
        return require('../../assets/guy1.jpg');
      default:
        return require('../../assets/model1.jpg');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    fetchNotifications(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <TopHeader title="Notifications" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EC066A" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeader title="Notifications" onBack={() => navigation.goBack()} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EC066A"
            colors={["#EC066A"]}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#666" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>You'll see notifications here when you receive them</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification._id}
              style={styles.notificationBox}
              onPress={() => markAsRead(notification._id)}
            >
              <Image source={getImageSource(notification)} style={styles.avatar} />
              <View style={styles.textContent}>
                <Text style={styles.title}>{notification.title}</Text>
                {!!notification.body && <Text style={styles.subtitle}>{notification.body}</Text>}
                <Text style={styles.timestamp}>
                  {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  }, 
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  notificationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 55,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  subtitle: {
    color: '#bbb',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.regular,
    opacity: 0.8,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EC066A',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#EC066A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#EC066A',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC066A',
    marginLeft: 12,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
});

export default Notification;
