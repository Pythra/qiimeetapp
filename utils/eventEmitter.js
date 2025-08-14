// Simple EventEmitter implementation
const events = {};

const EventEmitter = {
  on: (event, callback) => {
    if (!events[event]) {
      events[event] = [];
    }
    events[event].push(callback);
  },

  off: (event, callback) => {
    if (!events[event]) return;
    events[event] = events[event].filter(cb => cb !== callback);
  },

  emit: (event, data) => {
    if (!events[event]) return;
    events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Event callback error:', error);
      }
    });
  },

  removeAllListeners: (event) => {
    if (event) {
      delete events[event];
    } else {
      Object.keys(events).forEach(key => delete events[key]);
    }
  }
};

// Export as both default and named export for compatibility
export default EventEmitter;
export { EventEmitter };
