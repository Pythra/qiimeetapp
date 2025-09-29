class SocketServer {
  constructor() {
    this.onlineUsers = new Map(); // userId -> lastSeen timestamp
    this.userActivity = new Map(); // userId -> last activity timestamp
  }

  // Initialize mock socket server for Lambda environment
  initialize() {
    // In Lambda, we can't maintain persistent socket connections
    // So we'll use a timestamp-based approach for online status
    return null;
  }

  // Mark user as online (called when user makes any API request)
  markUserOnline(userId) {
    const now = Date.now();
    this.onlineUsers.set(userId, now);
    this.userActivity.set(userId, now);
    
    console.log(`🟢 [SocketServer] User ${userId} marked as online at ${new Date(now).toISOString()}`);
    
    // Clean up old entries (older than 5 minutes)
    this.cleanupOldEntries();
  }

  // Mark user as offline
  markUserOffline(userId) {
    this.onlineUsers.delete(userId);
    this.userActivity.delete(userId);
  }

  // Check if user is online (active in last 5 minutes)
  isUserOnline(userId) {
    const lastSeen = this.onlineUsers.get(userId);
    if (!lastSeen) {
      console.log(`❌ [SocketServer] User ${userId} not found in online users`);
      return false;
    }
    
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const isOnline = lastSeen > fiveMinutesAgo;
    console.log(`🔍 [SocketServer] User ${userId} last seen: ${new Date(lastSeen).toISOString()}, is online: ${isOnline}`);
    return isOnline;
  }

  // Get all online users
  getOnlineUsers() {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    return Array.from(this.onlineUsers.entries())
      .filter(([userId, lastSeen]) => lastSeen > fiveMinutesAgo)
      .map(([userId]) => userId);
  }

  // Clean up old entries
  cleanupOldEntries() {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    for (const [userId, lastSeen] of this.onlineUsers.entries()) {
      if (lastSeen < fiveMinutesAgo) {
        this.onlineUsers.delete(userId);
        this.userActivity.delete(userId);
      }
    }
  }

  // Get socket instance (returns null in Lambda)
  getIO() {
    return null;
  }

  // Emit to specific user room (not supported in Lambda)
  emitToUser(userId, event, data) {
    // In Lambda environment, we can't emit real-time events
    // This would need to be handled by a separate WebSocket service
    return false;
  }

  // Emit to all users (not supported in Lambda)
  emitToAll(event, data) {
    // In Lambda environment, we can't emit real-time events
    // This would need to be handled by a separate WebSocket service
    return false;
  }
}

module.exports = new SocketServer();
