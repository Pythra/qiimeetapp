const socketServer = require('../socketServer');

// Middleware to mark user as online when they make API requests
const markUserOnline = (req, res, next) => {
  try {
    // Only mark as online for authenticated requests
    if (req.userId) {
      socketServer.markUserOnline(req.userId);
    }
    next();
  } catch (error) {
    // Don't block the request if online status tracking fails
    next();
  }
};

module.exports = markUserOnline;
