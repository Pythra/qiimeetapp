import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../env.js';

class OnlineStatusService {
  constructor() {
    this.onlineUsers = new Set();
    this.currentUser = null;
    this.updateInterval = null;
    this.isInitialized = false;
  }

  // Initialize the service
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      
      if (token && userId) {
        this.currentUser = userId;
        this.isInitialized = true;
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        // Get initial online status
        await this.updateOnlineStatus();
      }
    } catch (error) {
      console.error('Error initializing online status service:', error);
    }
  }

  // Start periodic updates every 30 seconds
  startPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(async () => {
      await this.updateOnlineStatus();
    }, 30000);
  }

  // Stop periodic updates
  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Update online status for all users
  async updateOnlineStatus() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // Use the users set by setUsersToCheck instead of making API calls
      const userIds = this.usersToCheck || [];
      
      if (userIds.length === 0) {
        return;
      }

      // Send userIds as JSON body in POST request for better compatibility
      const fullUrl = `${API_BASE_URL}/online-status/status`;
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds })
      });

      if (response.ok) {
        const data = await response.json();
        this.updateOnlineUsers(data.onlineStatus);
      } else {
        // If API is not available, mark all users as offline
        const offlineStatus = {};
        userIds.forEach(userId => {
          offlineStatus[userId] = false;
        });
        this.updateOnlineUsers(offlineStatus);
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  // Get all users we need to check online status for
  async getUsersToCheck() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // console.log('❌ OnlineStatusService: No token found');
        return [];
      }

      // console.log('🔑 OnlineStatusService: Token found, length:', token.length);
      
      // Instead of making separate API calls, we'll get users from the context
      // This method will be called with the users we already have
      return [];
    } catch (error) {
      console.error('Error getting users to check:', error);
      return [];
    }
  }

  // New method to set users to check from the Likes screen data
  setUsersToCheck(userIds) {
    this.usersToCheck = userIds;
  }

  // Update the online users set
  updateOnlineUsers(onlineStatus) {
    this.onlineUsers.clear();
    
    Object.entries(onlineStatus).forEach(([userId, isOnline]) => {
      if (isOnline) {
        this.onlineUsers.add(userId);
      }
    });
  }

  // Check if a specific user is online
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  // Get all online users
  getOnlineUsers() {
    return Array.from(this.onlineUsers);
  }

  // Cleanup
  cleanup() {
    this.stopPeriodicUpdates();
    this.onlineUsers.clear();
    this.currentUser = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export default new OnlineStatusService();
