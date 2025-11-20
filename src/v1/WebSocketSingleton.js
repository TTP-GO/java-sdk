/**
 * WebSocketSingleton - Ensures only one WebSocket connection per URL exists
 */
import EventEmitter from '../shared/EventEmitter.js';

class WebSocketSingleton extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // Map of URL -> WebSocket instance
    this.connectionCounts = new Map(); // Map of URL -> number of subscribers
    this.creatingConnections = new Set(); // Set of URLs currently being created
  }
  
  /**
   * Get or create a WebSocket connection
   */
  async getConnection(url, config = {}) {
    // If connection already exists, just return it
    if (this.connections.has(url)) {
      const existingConnection = this.connections.get(url);
      this.connectionCounts.set(url, (this.connectionCounts.get(url) || 0) + 1);
      return existingConnection;
    }
    
    // Check if we're already in the process of creating a connection
    if (this.creatingConnections && this.creatingConnections.has(url)) {
      // Wait for the existing creation to complete
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.connections.has(url)) {
            const existingConnection = this.connections.get(url);
            this.connectionCounts.set(url, (this.connectionCounts.get(url) || 0) + 1);
            resolve(existingConnection);
          } else {
            setTimeout(checkConnection, 50);
          }
        };
        checkConnection();
      });
    }
    
    // Create new connection
    this.creatingConnections.add(url);
    const connection = new WebSocket(url);
    this.connections.set(url, connection);
    this.connectionCounts.set(url, 1);
    
    // Set up event forwarding
    connection.addEventListener('open', (event) => {
      this.creatingConnections.delete(url);
      this.emit('open', event, url);
    });
    
    connection.addEventListener('close', (event) => {
      this.creatingConnections.delete(url);
      this.connections.delete(url);
      this.connectionCounts.delete(url);
      this.emit('close', event, url);
    });
    
    connection.addEventListener('error', (event) => {
      this.creatingConnections.delete(url);
      this.emit('error', event, url);
    });
    
    connection.addEventListener('message', (event) => {
      this.emit('message', event, url);
    });
    
    return connection;
  }
  
  /**
   * Release a connection (decrement subscriber count)
   */
  releaseConnection(url) {
    if (!this.connections.has(url)) {
      return;
    }
    
    const currentCount = this.connectionCounts.get(url) || 0;
    const newCount = Math.max(0, currentCount - 1);
    this.connectionCounts.set(url, newCount);
    
    // If no more subscribers, close the connection
    if (newCount === 0) {
      const connection = this.connections.get(url);
      if (connection && connection.readyState === WebSocket.OPEN) {
        connection.close(1000, 'No more subscribers');
      }
      this.connections.delete(url);
      this.connectionCounts.delete(url);
    }
  }
  
  /**
   * Force close a connection
   */
  forceClose(url) {
    if (this.connections.has(url)) {
      const connection = this.connections.get(url);
      if (connection && connection.readyState === WebSocket.OPEN) {
        connection.close(1000, 'Force close');
      }
      this.connections.delete(url);
      this.connectionCounts.delete(url);
    }
  }
  
  /**
   * Get connection status
   */
  getConnectionStatus(url) {
    if (!this.connections.has(url)) {
      return { exists: false, readyState: null, subscribers: 0 };
    }
    
    const connection = this.connections.get(url);
    return {
      exists: true,
      readyState: connection.readyState,
      subscribers: this.connectionCounts.get(url) || 0
    };
  }
  
  /**
   * Get all active connections
   */
  getAllConnections() {
    const result = {};
    for (const [url, connection] of this.connections.entries()) {
      result[url] = {
        readyState: connection.readyState,
        subscribers: this.connectionCounts.get(url) || 0
      };
    }
    return result;
  }
  
  /**
   * Clear all connections (for testing)
   */
  clearAll() {
    for (const [url, connection] of this.connections.entries()) {
      if (connection && connection.readyState === WebSocket.OPEN) {
        connection.close(1000, 'Clear all');
      }
    }
    this.connections.clear();
    this.connectionCounts.clear();
    this.creatingConnections.clear();
  }
}

// Global singleton instance
const webSocketSingleton = new WebSocketSingleton();

export default webSocketSingleton;
