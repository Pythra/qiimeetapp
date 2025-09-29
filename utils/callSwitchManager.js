// Global call switching state manager
class CallSwitchManager {
  constructor() {
    this.switchingStates = new Map(); // channelName -> switching state
  }

  // Set switching state for a channel
  setSwitching(channelName, isSwitching, switchType = null) {
    console.log(`📞 [CallSwitchManager] Setting switching state for ${channelName}:`, { isSwitching, switchType });
    this.switchingStates.set(channelName, {
      isSwitching,
      switchType,
      timestamp: Date.now()
    });
  }

  // Check if a channel is currently switching
  isSwitching(channelName) {
    const state = this.switchingStates.get(channelName);
    if (!state) return false;
    
    // Clear old states (older than 30 seconds)
    if (Date.now() - state.timestamp > 30000) {
      this.switchingStates.delete(channelName);
      return false;
    }
    
    return state.isSwitching;
  }

  // Get switching type for a channel
  getSwitchType(channelName) {
    const state = this.switchingStates.get(channelName);
    return state ? state.switchType : null;
  }

  // Clear switching state for a channel
  clearSwitching(channelName) {
    console.log(`📞 [CallSwitchManager] Clearing switching state for ${channelName}`);
    this.switchingStates.delete(channelName);
  }

  // Clear all switching states
  clearAll() {
    console.log('📞 [CallSwitchManager] Clearing all switching states');
    this.switchingStates.clear();
  }
}

// Export singleton instance
export default new CallSwitchManager();
