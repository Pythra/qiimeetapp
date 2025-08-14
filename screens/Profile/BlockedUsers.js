import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, ActivityIndicator } from 'react-native';
import TopHeader from '../../components/TopHeader';
import Colors from '../../constants/Colors';
import { FONTS } from '../../constants/font';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthContext';
import { API_BASE_URL } from '../../env';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BlockedUsers = ({ navigation }) => {
  const { user: currentUser, refreshUser } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState({});

  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getImageSource = (imagePath) => {
    const cloudFrontUrl = 'https://d11n4tndq0o4wh.cloudfront.net';
    if (!imagePath) return require('../../assets/model.jpg');
    if (imagePath.startsWith('http')) {
      return { uri: imagePath, cache: 'force-cache' };
    }
    if (imagePath.startsWith('/uploads/')) {
      return { uri: `${cloudFrontUrl}${imagePath}`, cache: 'force-cache' };
    }
    if (!imagePath.startsWith('/')) {
      return { uri: `${cloudFrontUrl}/uploads/images/${imagePath}`, cache: 'force-cache' };
    }
    return require('../../assets/model.jpg');
  };

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/blocked-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setBlockedUsers(data.blockedUsers || []);
      } else {
        console.error('Failed to fetch blocked users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unblock', 
          style: 'destructive',
          onPress: async () => {
            try {
              setUnblocking(prev => ({ ...prev, [userId]: true }));
              
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                console.error('No token found');
                return;
              }

              const response = await fetch(`${API_BASE_URL}/auth/unblock-user`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ targetUserId: userId })
              });

              const data = await response.json();
              
              if (data.success) {
                // Remove user from local state
                setBlockedUsers(prev => prev.filter(user => user.id !== userId));
                // Refresh user data in context
                refreshUser();
                Alert.alert('Success', 'User unblocked successfully');
              } else {
                Alert.alert('Error', data.error || 'Failed to unblock user');
              }
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user');
            } finally {
              setUnblocking(prev => ({ ...prev, [userId]: false }));
            }
          }
        }
      ]
    );
  };

  // Fetch blocked users when screen loads
  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchBlockedUsers();
    }, [])
  );

  const renderUser = ({ item }) => {
    const userAge = item.age || calculateAge(item.dateOfBirth);
    
    return (
      <View style={styles.userRow}>
        <Image 
          source={getImageSource(item.profilePicture)} 
          style={styles.avatar} 
        />
        <View style={styles.infoRow}>
          <Text style={styles.name}>
            {item.username || item.name}
            {userAge ? `, ${userAge}` : ''}
          </Text>
          {item.verified && (
            <MaterialIcons 
              name="verified" 
              size={20} 
              color="#ec066a" 
              style={styles.verifiedIcon} 
            />
          )}
        </View>
        <TouchableOpacity 
          style={[styles.unblockButton, unblocking[item.id] && styles.unblockButtonDisabled]}
          onPress={() => handleUnblock(item.id)}
          disabled={unblocking[item.id]}
        >
          {unblocking[item.id] ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.unblockText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopHeader title="Blocked Users" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeader title="Blocked Users" onBack={() => navigation.goBack()} />
      {blockedUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="block" size={64} color="#666" />
          <Text style={styles.emptyTitle}>No Blocked Users</Text>
          <Text style={styles.emptyText}>
            You haven't blocked any users yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderUser}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 32,
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
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONTS.regular,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.regular,
    marginRight: 4,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  unblockButton: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 22,
    minWidth: 80,
    alignItems: 'center',
  },
  unblockButtonDisabled: {
    opacity: 0.6,
  },
  unblockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
});

export default BlockedUsers;
