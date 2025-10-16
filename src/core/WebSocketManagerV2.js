/**
 * WebSocketManagerV2 - Uses singleton pattern to prevent multiple connections
 */
import EventEmitter from './EventEmitter.js';
import webSocketSingleton from './WebSocketSingleton.js';

export default class WebSocketManagerV2 extends EventEmitter {
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
        console.log(`🔌 WebSocketManagerV2: Requesting connection ${this.connectionId} for ${this.config.websocketUrl}`);
        
        // Get connection from singleton
        webSocketSingleton.getConnection(this.config.websocketUrl, this.config)
          .then((connection) => {
            this.ws = connection;
            console.log(`🔌 WebSocketManagerV2: Got connection ${this.connectionId}`);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // If already connected, resolve immediately
            if (connection.readyState === WebSocket.OPEN) {
              this.isConnected = true;
              this.emit('connected');
              resolve();
            }
          })
          .catch((error) => {
            console.error(`🔌 WebSocketManagerV2: Connection failed ${this.connectionId}`, error);
            reject(error);
          });
        
      } catch (error) {
        console.error(`🔌 WebSocketManagerV2: Connection error ${this.connectionId}`, error);
        reject(error);
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
        console.log(`🔌 WebSocketManagerV2: Connection opened ${this.connectionId}`);
        this.isConnected = true;
        this.emit('connected');
      }
    };
    
    const handleClose = (event, url) => {
      if (url === this.config.websocketUrl) {
        console.log(`🔌 WebSocketManagerV2: Connection closed ${this.connectionId} (Code: ${event.code})`);
        this.isConnected = false;
        this.emit('disconnected', event);
      }
    };
    
    const handleError = (event, url) => {
      if (url === this.config.websocketUrl) {
        console.log(`🔌 WebSocketManagerV2: Connection error ${this.connectionId}`, event);
        this.emit('error', event);
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
    console.log(`🔌 WebSocketManagerV2: Disconnecting ${this.connectionId}`);
    
    // Remove event listeners
    if (this.eventHandlers) {
      webSocketSingleton.off('open', this.eventHandlers.open);
      webSocketSingleton.off('close', this.eventHandlers.close);
      webSocketSingleton.off('error', this.eventHandlers.error);
      webSocketSingleton.off('message', this.eventHandlers.message);
    }
    
    // Release connection from singleton
    if (this.config.websocketUrl) {
      console.log(`🔌 WebSocketManagerV2: Releasing connection ${this.connectionId} from singleton`);
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
        console.error('🔌 WebSocketManagerV2: Error converting Blob to ArrayBuffer:', err);
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
