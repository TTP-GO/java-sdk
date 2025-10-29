/**
 * WebSocketManager - Uses singleton pattern to prevent multiple connections
 */
import EventEmitter from './EventEmitter.js';
import webSocketSingleton from './WebSocketSingleton.js';

export default class WebSocketManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.ws = null;
    this.isConnected = false;
    this.connectionId = null;
  }
  
  /**
   * Connect to WebSocket using singleton
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.connectionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Store resolve/reject for later use
        this.connectResolve = resolve;
        this.connectReject = reject;
        
        // Get connection from singleton
        webSocketSingleton.getConnection(this.config.websocketUrl, this.config)
          .then((connection) => {
            this.ws = connection;
            
            // Set up event listeners (this will set up handlers that can resolve the promise)
            this.setupEventListeners();
            
            // If already connected, resolve immediately
            if (connection.readyState === WebSocket.OPEN) {
              this.isConnected = true;
              this.emit('connected');
              resolve();
              this.connectResolve = null;
              this.connectReject = null;
            }
          })
          .catch((error) => {
            console.error(`🔌 WebSocketManager: Connection failed ${this.connectionId}`, error);
            reject(error);
            this.connectResolve = null;
            this.connectReject = null;
          });
        
      } catch (error) {
        console.error(`🔌 WebSocketManager: Connection error ${this.connectionId}`, error);
        reject(error);
        this.connectResolve = null;
        this.connectReject = null;
      }
    });
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    if (!this.ws) return;
    
    // Use singleton's event forwarding
    const handleOpen = (event, url) => {
      if (url === this.config.websocketUrl) {
        this.isConnected = true;
        this.emit('connected');
        
        // Resolve the connect promise if it hasn't been resolved yet
        if (this.connectResolve) {
          this.connectResolve();
          this.connectResolve = null;
          this.connectReject = null;
        }
      }
    };
    
    const handleClose = (event, url) => {
      if (url === this.config.websocketUrl) {
        this.isConnected = false;
        this.emit('disconnected', event);
      }
    };
    
    const handleError = (event, url) => {
      if (url === this.config.websocketUrl) {
        this.emit('error', event);
        
        // Reject the connect promise if it hasn't been resolved yet
        if (this.connectReject) {
          this.connectReject(event);
          this.connectResolve = null;
          this.connectReject = null;
        }
      }
    };
    
    const handleMessage = (event, url) => {
      if (url === this.config.websocketUrl) {
        this.handleMessage(event);
      }
    };
    
    // Add event listeners
    webSocketSingleton.on('open', handleOpen);
    webSocketSingleton.on('close', handleClose);
    webSocketSingleton.on('error', handleError);
    webSocketSingleton.on('message', handleMessage);
    
    // Store handlers for cleanup
    this.eventHandlers = {
      open: handleOpen,
      close: handleClose,
      error: handleError,
      message: handleMessage
    };
  }
  
  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    // Remove event listeners
    if (this.eventHandlers) {
      webSocketSingleton.off('open', this.eventHandlers.open);
      webSocketSingleton.off('close', this.eventHandlers.close);
      webSocketSingleton.off('error', this.eventHandlers.error);
      webSocketSingleton.off('message', this.eventHandlers.message);
    }
    
    // Release connection from singleton
    if (this.config.websocketUrl) {
      webSocketSingleton.releaseConnection(this.config.websocketUrl);
    }
    
    this.ws = null;
    this.isConnected = false;
  }
  
  /**
   * Send JSON message
   */
  sendMessage(message) {
    if (!this.isConnected || !this.ws) {
      // Silently ignore if not connected (may happen during cleanup/disconnect)
      return;
    }
    
    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      // Log but don't throw - connection may have closed between check and send
      console.warn('🔌 WebSocketManager: Failed to send message:', error.message);
    }
  }
  
  /**
   * Send binary data
   */
  sendBinary(data) {
    if (!this.isConnected || !this.ws) {
      // Silently ignore if not connected (may happen during cleanup/disconnect)
      return;
    }
    
    try {
      this.ws.send(data);
    } catch (error) {
      // Log but don't throw - connection may have closed between check and send
      console.warn('🔌 WebSocketManager: Failed to send binary data:', error.message);
    }
  }
  
  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    // Check if it's binary data
    if (event.data instanceof ArrayBuffer) {
      this.emit('binaryAudio', event.data);
      return;
    } else if (event.data instanceof Blob) {
      event.data.arrayBuffer().then(arrayBuffer => {
        this.emit('binaryAudio', arrayBuffer);
      }).catch(err => {
        console.error('🔌 WebSocketManager: Error converting Blob to ArrayBuffer:', err);
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
      readyState: this.ws ? this.ws.readyState : null,
      connectionId: this.connectionId
    };
  }
  
  /**
   * Get singleton status (for debugging)
   */
  static getSingletonStatus() {
    return webSocketSingleton.getAllConnections();
  }
  
  /**
   * Clear all singleton connections (for testing)
   */
  static clearAllConnections() {
    webSocketSingleton.clearAll();
  }
}
