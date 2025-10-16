/**
 * WebSocketManager - Handles WebSocket connection and message routing
 */
import EventEmitter from './EventEmitter.js';
import connectionManager from './ConnectionManager.js';

export default class WebSocketManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.autoReconnect !== false ? 3 : 0; // Disable auto-reconnect if explicitly set to false
    this.isReconnecting = false;
    this.isConnecting = false; // Track if we're currently trying to connect
    this.connectionId = null; // Unique ID for this connection attempt
  }
  
  /**
   * Connect to WebSocket
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        // Prevent multiple connections
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
          resolve();
          return;
        }
        
        // Prevent connection if already reconnecting
        if (this.isReconnecting) {
          resolve();
          return;
        }
        
        // Prevent connection if already connecting
        if (this.isConnecting) {
          resolve();
          return;
        }
        
        // Check if connection is allowed by global manager
        if (!connectionManager.isConnectionAllowed(this.config.websocketUrl)) {
          console.log(`🔌 WebSocketManager: Connection blocked by global manager for ${this.config.websocketUrl}`);
          resolve();
          return;
        }
        
        this.isConnecting = true;
        this.connectionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Register with global connection manager
        if (!connectionManager.registerConnection(this.config.websocketUrl, this.connectionId)) {
          console.log(`🔌 WebSocketManager: Connection registration failed for ${this.connectionId}`);
          this.isConnecting = false;
          resolve();
          return;
        }
        
        console.log(`🔌 WebSocketManager: Starting connection attempt ${this.connectionId}`);
        this.ws = new WebSocket(this.config.websocketUrl);
        
        this.ws.onopen = () => {
          console.log(`🔌 WebSocketManager: Connection successful ${this.connectionId}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this.isConnecting = false;
          this.emit('connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
        
        this.ws.onclose = (event) => {
          console.log(`🔌 WebSocketManager: Connection closed ${this.connectionId} (Code: ${event.code})`);
          this.isConnected = false;
          this.isConnecting = false;
          this.emit('disconnected', event);
          
          // Attempt reconnection if not intentional and not already reconnecting
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts && !this.isReconnecting) {
            this.isReconnecting = true;
            this.reconnectAttempts++;
            console.log(`🔌 WebSocketManager: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
              this.isReconnecting = false;
              this.connect().catch(() => {
                // Ignore reconnection errors to prevent infinite loops
              });
            }, 1000 * this.reconnectAttempts);
          }
        };
        
        this.ws.onerror = (error) => {
          console.log(`🔌 WebSocketManager: Connection error ${this.connectionId}`, error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };
        
      } catch (error) {
        console.log(`🔌 WebSocketManager: Connection failed ${this.connectionId}`, error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    // Stop any reconnection attempts
    this.isReconnecting = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    
    // Unregister from global connection manager
    if (this.connectionId) {
      connectionManager.unregisterConnection(this.config.websocketUrl, this.connectionId);
    }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Intentional disconnect');
    }
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
  }
  
  /**
   * Reset reconnection attempts (useful for manual reconnection)
   */
  resetReconnectionAttempts() {
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }
  
  /**
   * Clear all global connections (useful for testing)
   */
  static clearAllConnections() {
    connectionManager.clearAll();
  }
  
  /**
   * Send JSON message
   */
  sendMessage(message) {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }
    
    this.ws.send(JSON.stringify(message));
  }
  
  /**
   * Send binary data
   */
  sendBinary(data) {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }
    
    this.ws.send(data);
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(event) {
    // Check if it's binary data first
    if (event.data instanceof ArrayBuffer) {
      this.emit('binaryAudio', event.data);
      return;
    } else if (event.data instanceof Blob) {
      event.data.arrayBuffer().then(arrayBuffer => {
        this.emit('binaryAudio', arrayBuffer);
      }).catch(err => {
        this.emit('error', err);
      });
      return;
    }
    
    // Handle JSON messages
    try {
      const message = JSON.parse(event.data);
      
      // Handle barge-in related messages
      if (message.t === 'barge_in_ack' || message.t === 'stop_sending') {
        this.emit('bargeIn', message);
      }
      
      // Handle stop playing message
      if (message.t === 'stop_playing') {
        this.emit('stopPlaying', message);
      }
      
      this.emit('message', message);
    } catch (error) {
      this.emit('error', error);
    }
  }
  
  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED
    };
  }
}
