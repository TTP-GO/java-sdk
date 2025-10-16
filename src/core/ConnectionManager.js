/**
 * ConnectionManager - Global connection manager to prevent multiple connections to the same URL
 */
class ConnectionManager {
  constructor() {
    this.connections = new Map(); // Map of URL -> connection info
  }
  
  /**
   * Register a connection attempt
   */
  registerConnection(url, connectionId) {
    if (!this.connections.has(url)) {
      this.connections.set(url, {
        connectionId,
        timestamp: Date.now(),
        count: 1
      });
      console.log(`🔌 ConnectionManager: Registered connection ${connectionId} for ${url}`);
      return true;
    }
    
    const existing = this.connections.get(url);
    const timeSinceLastConnection = Date.now() - existing.timestamp;
    
    // If it's been more than 30 seconds since the last connection, allow it
    if (timeSinceLastConnection > 30000) {
      this.connections.set(url, {
        connectionId,
        timestamp: Date.now(),
        count: 1
      });
      console.log(`🔌 ConnectionManager: Allowed new connection ${connectionId} for ${url} (old connection was ${timeSinceLastConnection}ms ago)`);
      return true;
    }
    
    // Otherwise, prevent the connection
    existing.count++;
    console.log(`🔌 ConnectionManager: Blocked connection ${connectionId} for ${url} (${existing.count} attempts in ${timeSinceLastConnection}ms)`);
    return false;
  }
  
  /**
   * Unregister a connection
   */
  unregisterConnection(url, connectionId) {
    const existing = this.connections.get(url);
    if (existing && existing.connectionId === connectionId) {
      this.connections.delete(url);
      console.log(`🔌 ConnectionManager: Unregistered connection ${connectionId} for ${url}`);
    }
  }
  
  /**
   * Check if a connection is allowed
   */
  isConnectionAllowed(url) {
    const existing = this.connections.get(url);
    if (!existing) {
      return true;
    }
    
    const timeSinceLastConnection = Date.now() - existing.timestamp;
    return timeSinceLastConnection > 30000; // Allow if more than 30 seconds ago
  }
  
  /**
   * Get connection info
   */
  getConnectionInfo(url) {
    return this.connections.get(url);
  }
  
  /**
   * Clear all connections (useful for testing)
   */
  clearAll() {
    this.connections.clear();
    console.log('🔌 ConnectionManager: Cleared all connections');
  }
}

// Global instance
const connectionManager = new ConnectionManager();

export default connectionManager;
