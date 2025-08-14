import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../env.js';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    this.connectionTimeout = null;
    this.eventListeners = new Map();
    this.isManualDisconnect = false;
  }

  async connect() {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;
    this.isManualDisconnect = false;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, cannot connect to socket');
        this.isConnecting = false;
        return;
      }

      // Extract the base URL without /api suffix for socket connection
      const socketUrl = API_BASE_URL.replace('/api', '');
      
      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'], // Allow fallback to polling
        forceNew: false, // Allow reuse of existing connections
        timeout: 30000, // Increased timeout
        reconnection: false, // We'll handle reconnection manually
        reconnectionAttempts: 0,
        reconnectionDelay: 0,
        reconnectionDelayMax: 0,
        maxReconnectionAttempts: 0,
        pingTimeout: 60000, // 60 seconds ping timeout
        pingInterval: 25000, // 25 seconds ping interval
        upgrade: true, // Allow transport upgrade
        rememberUpgrade: true, // Remember transport upgrade
      });

      this.setupEventListeners();
      this.startConnectionTimeout();

      // After successful connection, join the user room if userId is available
      if (this.userId) {
        this.joinUserRoom(this.userId);
      }
      
      // Debug: Log connection status
      console.log('[SocketManager] Connected successfully. UserId:', this.userId);

    } catch (error) {
      console.error('Error connecting to socket:', error);
      this.isConnecting = false;
      this.handleConnectionError();
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.clearConnectionTimeout();
      this.startHeartbeat();
      this.rejoinRooms();
      
      // Ensure user room is joined after connection
      if (this.userId) {
        console.log('[SocketManager] Ensuring user room is joined after connection');
        this.joinUserRoom(this.userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false;
      this.stopHeartbeat();
      this.clearConnectionTimeout();

      if (!this.isManualDisconnect) {
        this.handleDisconnection(reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.isConnecting = false;
      this.handleConnectionError();
    });

    // Add error event listener
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handleConnectionError();
    });
  }

  startConnectionTimeout() {
    this.connectionTimeout = setTimeout(() => {
      if (!this.isConnected) {
        console.log('Connection timeout, attempting reconnection');
        this.isConnecting = false;
        this.handleConnectionError();
      }
    }, 30000); // 30 second timeout
  }

  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
        console.log('Sent ping to server');
      }
    }, 30000); // Send ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  handleDisconnection(reason) {
    if (this.isManualDisconnect) return;

    console.log('Handling disconnection:', reason);
    
    // Don't reconnect if it's a manual disconnect or server shutdown
    if (reason === 'io server disconnect' || reason === 'io client disconnect') {
      return;
    }

    this.scheduleReconnection();
  }

  handleConnectionError() {
    if (this.isManualDisconnect) return;

    console.log('Handling connection error');
    this.scheduleReconnection();
  }

  scheduleReconnection() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isManualDisconnect) {
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect();
      }
    }, delay);
  }

  // Enhanced rejoin rooms method
  rejoinRooms() {
    console.log('[SocketManager] Rejoining rooms after reconnection');
    if (this.activeChatId) {
      this.joinChat(this.activeChatId);
    }
    if (this.userId) {
      console.log('[SocketManager] Rejoining user room after reconnection');
      this.joinUserRoom(this.userId);
    }
  }

  // Force rejoin user room - useful for ensuring room membership
  forceRejoinUserRoom() {
    if (this.userId && this.socket && this.isConnected) {
      console.log('[SocketManager] Force rejoining user room:', this.userId);
      this.socket.emit('join_user_room', this.userId);
      
      // Verify room join multiple times to ensure reliability
      setTimeout(() => {
        if (this.socket && this.isConnected) {
          console.log('[SocketManager] Verifying user room join (1s delay)');
          this.socket.emit('join_user_room', this.userId);
        }
      }, 1000);
      
      setTimeout(() => {
        if (this.socket && this.isConnected) {
          console.log('[SocketManager] Verifying user room join (3s delay)');
          this.socket.emit('join_user_room', this.userId);
        }
      }, 3000);
    }
  }

  // Method to store and rejoin rooms after reconnection
  setActiveChat(chatId) {
    this.activeChatId = chatId;
  }

  getActiveChat() {
    return this.activeChatId;
  }

  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', chatId);
      console.log(`Joined chat: ${chatId}`);
    } else {
      console.log('Cannot join chat: socket not connected');
    }
  }

  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', chatId);
      console.log(`Left chat: ${chatId}`);
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.off('new_message'); // Remove existing listeners
      this.socket.on('new_message', callback);
      this.eventListeners.set('new_message', callback);
    }
  }

  onTyping(callback) {
    if (this.socket) {
      this.socket.off('user_typing'); // Remove existing listeners
      this.socket.on('user_typing', (data) => {
        console.log('[SocketManager] Received user_typing event:', data);
        callback(data);
      });
      this.eventListeners.set('user_typing', callback);
    }
  }

  onMessageStatusUpdate(callback) {
    if (this.socket) {
      this.socket.off('message_status_update'); // Remove existing listeners
      this.socket.on('message_status_update', callback);
      this.eventListeners.set('message_status_update', callback);
    }
  }

  emitTyping(chatId, isTyping) {
    if (this.socket && this.isConnected) {
      console.log('[SocketManager] Emitting', isTyping ? 'typing_start' : 'typing_stop', 'for chat', chatId);
      this.socket.emit(isTyping ? 'typing_start' : 'typing_stop', { chatId });
    } else {
      console.log('Cannot emit typing: socket not connected');
    }
  }

  // Add this method to join the user-specific room
  joinUserRoom(userId) {
    if (this.socket && this.isConnected && userId) {
      this.socket.emit('join_user_room', userId);
      console.log(`[SocketManager] Joined user room: user_${userId}`);
      
      // Verify room join was successful
      setTimeout(() => {
        if (this.socket && this.isConnected) {
          console.log(`[SocketManager] Verifying user room join for: user_${userId}`);
          this.socket.emit('join_user_room', userId);
        }
      }, 1000);
    } else {
      console.log(`[SocketManager] Cannot join user room: socket=${!!this.socket}, connected=${this.isConnected}, userId=${userId}`);
    }
  }

  // Method to set userId
  setUserId(userId) {
    this.userId = userId;
    console.log('[SocketManager] UserId set to:', userId);
    // If already connected, join the user room
    if (this.socket && this.isConnected && userId) {
      this.joinUserRoom(userId);
    }
  }

  onIncomingCall(callback) {
    if (this.socket) {
      this.socket.off('incoming_call');
      this.socket.on('incoming_call', callback);
      this.eventListeners.set('incoming_call', callback);
    }
  }

  onCallResponse(callback) {
    if (this.socket) {
      this.socket.off('call_response');
      this.socket.on('call_response', callback);
      this.eventListeners.set('call_response', callback);
    }
  }

  onConnectionAccepted(callback) {
    if (this.socket) {
      console.log('[SocketManager] Setting up connection_accepted listener');
      this.socket.off('connection_accepted');
      this.socket.on('connection_accepted', (data) => {
        console.log('[SocketManager] Received connection_accepted event:', data);
        callback(data);
      });
      this.eventListeners.set('connection_accepted', callback);
    } else {
      console.warn('[SocketManager] Cannot set up connection_accepted listener - socket not connected');
    }
  }

  emitCallUser(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('call_user', data);
    }
  }

  emitCallResponse(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('call_response', data);
    }
  }

  emitCallTypeSwitch(data) {
    if (this.socket && this.isConnected) {
      console.log('[SocketManager] Emitting call_type_switch:', data);
      this.socket.emit('call_type_switch', data);
    }
  }

  onCallTypeSwitched(callback) {
    if (this.socket) {
      this.socket.off('call_type_switched');
      this.socket.on('call_type_switched', (data) => {
        console.log('[SocketManager] Received call_type_switched event:', data);
        callback(data);
      });
      this.eventListeners.set('call_type_switched', callback);
    }
  }

  // Get connection status with more details
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      socketId: this.socket?.id,
      userId: this.userId,
      hasSocket: !!this.socket
    };
  }

  // Method to force reconnection
  async reconnect() {
    console.log('Forcing reconnection');
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    await this.disconnect();
    await this.connect();
  }

  disconnect() {
    console.log('Disconnecting socket manually');
    this.isManualDisconnect = true;
    this.isConnecting = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopHeartbeat();
    this.clearConnectionTimeout();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.eventListeners.clear();
  }

  // Cleanup method for component unmount
  cleanup() {
    console.log('Cleaning up socket manager');
    this.disconnect();
  }
}

export default new SocketManager(); 