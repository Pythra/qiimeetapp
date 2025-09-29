const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const socketServer = require('../socketServer');

// Get online status for multiple users
router.post('/status', auth, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    console.log('🔍 [OnlineStatus] Received request for userIds:', userIds);
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'User IDs array is required in request body' });
    }

    const onlineStatus = {};
    userIds.forEach(userId => {
      const isOnline = socketServer.isUserOnline(userId);
      onlineStatus[userId] = isOnline;
      console.log(`🔍 [OnlineStatus] User ${userId} is ${isOnline ? 'online' : 'offline'}`);
    });

    console.log('🔍 [OnlineStatus] Returning online status:', onlineStatus);
    res.json({ onlineStatus });
  } catch (error) {
    console.error('Error getting online status:', error);
    res.status(500).json({ error: 'Failed to get online status' });
  }
});

// Get all online users
router.get('/online-users', auth, async (req, res) => {
  try {
    const onlineUsers = socketServer.getOnlineUsers();
    res.json({ onlineUsers });
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({ error: 'Failed to get online users' });
  }
});

// Check if specific user is online
router.get('/status/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const isOnline = socketServer.isUserOnline(userId);
    
    res.json({ 
      userId, 
      isOnline,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking user online status:', error);
    res.status(500).json({ error: 'Failed to check online status' });
  }
});

module.exports = router;
