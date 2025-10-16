/**
 * VoiceSDK - Core voice interaction SDK
 * Handles WebSocket connection, audio recording, and audio playback
 */
import EventEmitter from './EventEmitter.js';
import WebSocketManagerV2 from './WebSocketManagerV2.js';
import AudioRecorder from './AudioRecorder.js';
import AudioPlayer from './AudioPlayer.js';

export default class VoiceSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      websocketUrl: config.websocketUrl || 'wss://speech.bidme.co.il/ws/conv',
      agentId: config.agentId, // Optional - for direct agent access (unsecured method)
      appId: config.appId, // User's app ID for authentication
      ttpId: config.ttpId, // Optional - custom TTP ID (fallback if appId not provided)
      voice: config.voice || 'default',
      language: config.language || 'en',
      sampleRate: config.sampleRate || 16000,
      ...config
    };
    
    // State
    this.isConnected = false;
    this.isRecording = false;
    this.isPlaying = false;
    this.isDestroyed = false;
    
    // Components
    this.webSocketManager = new WebSocketManagerV2({
      ...this.config,
      autoReconnect: this.config.autoReconnect !== false // Default to true unless explicitly disabled
    });
    this.audioRecorder = new AudioRecorder(this.config);
    this.audioPlayer = new AudioPlayer(this.config);
    
    // Bind event handlers
    this.setupEventHandlers();
  }
  
  /**
   * Setup event handlers for all components
   */
  setupEventHandlers() {
    // WebSocket events
    this.webSocketManager.on('connected', () => {
      this.isConnected = true;
      this.sendHelloMessage();
      this.emit('connected');
    });
    
    this.webSocketManager.on('disconnected', () => {
      this.isConnected = false;
      this.emit('disconnected');
    });
    
    this.webSocketManager.on('error', (error) => {
      this.emit('error', error);
    });
    
    this.webSocketManager.on('message', (message) => {
      this.emit('message', message);
    });
    
    this.webSocketManager.on('binaryAudio', (audioData) => {
      this.audioPlayer.playAudio(audioData);
    });
    
    this.webSocketManager.on('bargeIn', (message) => {
      this.emit('bargeIn', message);
    });
    
    this.webSocketManager.on('stopPlaying', (message) => {
      this.emit('stopPlaying', message);
      // Immediately stop all audio playback
      this.audioPlayer.stopImmediate();
    });
    
    // Audio recorder events
    this.audioRecorder.on('recordingStarted', () => {
      this.isRecording = true;
      this.emit('recordingStarted');
    });
    
    this.audioRecorder.on('recordingStopped', () => {
      this.isRecording = false;
      this.emit('recordingStopped');
    });
    
    this.audioRecorder.on('audioData', (audioData) => {
      if (this.isConnected) {
        this.webSocketManager.sendBinary(audioData);
      }
    });
    
    // Audio player events
    this.audioPlayer.on('playbackStarted', () => {
      this.isPlaying = true;
      this.emit('playbackStarted');
    });
    
    this.audioPlayer.on('playbackStopped', () => {
      this.isPlaying = false;
      this.emit('playbackStopped');
    });
    
    this.audioPlayer.on('playbackError', (error) => {
      this.emit('playbackError', error);
    });
  }
  
  /**
   * Connect to the voice server
   */
  async connect() {
    if (this.isDestroyed) {
      return false; // Prevent connect after destroy
    }
    
    try {
      // Build WebSocket URL with query parameters if needed
      const wsUrl = this.buildWebSocketUrl();
      console.log('VoiceSDK: Using WebSocket URL:', wsUrl);
      
      // Update the WebSocket manager with the URL that includes query parameters
      this.webSocketManager.config.websocketUrl = wsUrl;
      
      await this.webSocketManager.connect();
      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Build WebSocket URL with query parameters for authentication
   */
  buildWebSocketUrl() {
    let url = this.config.websocketUrl;
    const params = new URLSearchParams();
    
    // Add agentId as query parameter if provided
    if (this.config.agentId) {
      params.append('agentId', this.config.agentId);
      console.log('VoiceSDK: Adding agentId to URL:', this.config.agentId);
    }
    
    // Add appId as query parameter if provided
    if (this.config.appId) {
      params.append('appId', this.config.appId);
      console.log('VoiceSDK: Adding appId to URL:', this.config.appId);
    }
    
    // Add other parameters if needed
    if (this.config.voice && this.config.voice !== 'default') {
      params.append('voice', this.config.voice);
    }
    
    if (this.config.language && this.config.language !== 'en') {
      params.append('language', this.config.language);
    }
    
    // Append query parameters to URL if any exist
    if (params.toString()) {
      const separator = url.includes('?') ? '&' : '?';
      url += separator + params.toString();
    }
    
    return url;
  }
  
  /**
   * Disconnect from the voice server
   */
  disconnect() {
    if (this.isDestroyed) {
      console.log(`🎙️ VoiceSDK: Disconnect called but already destroyed`);
      return; // Prevent disconnect after destroy
    }
    console.log(`🎙️ VoiceSDK: Disconnecting from voice server`);
    this.stopRecording();
    this.webSocketManager.disconnect();
  }
  
  /**
   * Reset reconnection attempts (useful for manual reconnection)
   */
  resetReconnectionAttempts() {
    if (this.isDestroyed) {
      return;
    }
    this.webSocketManager.resetReconnectionAttempts();
  }
  
  /**
   * Manually reconnect to the voice server
   */
  async reconnect() {
    if (this.isDestroyed) {
      return false;
    }
    
    this.disconnect();
    this.resetReconnectionAttempts();
    return await this.connect();
  }
  
  /**
   * Start voice recording and streaming
   */
  async startRecording() {
    if (!this.isConnected) {
      throw new Error('Not connected to voice server');
    }
    
    try {
      // Send start continuous mode message
      this.webSocketManager.sendMessage({
        t: 'start_continuous_mode',
        ttpId: this.generateTtpId(),
        voice: this.config.voice,
        language: this.config.language
      });
      
      // Start audio recording
      await this.audioRecorder.start();
      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Stop voice recording and streaming
   */
  async stopRecording() {
    if (!this.isRecording) {
      return;
    }
    
    try {
      // Send stop continuous mode message
      this.webSocketManager.sendMessage({
        t: 'stop_continuous_mode',
        ttpId: this.generateTtpId()
      });
      
      // Stop audio recording
      await this.audioRecorder.stop();
      
      // Stop audio playback immediately when stopping recording
      this.audioPlayer.stopImmediate();
      
      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Toggle recording state
   */
  async toggleRecording() {
    if (this.isRecording) {
      return await this.stopRecording();
    } else {
      return await this.startRecording();
    }
  }
  
  /**
   * Stop audio playback immediately (for barge-in scenarios)
   */
  stopAudioPlayback() {
    this.audioPlayer.stopImmediate();
  }
  
  /**
   * Handle barge-in (user starts speaking while audio is playing)
   */
  async handleBargeIn() {
    // Stop current audio playback immediately
    this.stopAudioPlayback();
    
    // If not already recording, start recording
    if (!this.isRecording) {
      await this.startRecording();
    }
  }
  
  /**
   * Get current connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isRecording: this.isRecording,
      isPlaying: this.isPlaying
    };
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Generate unique TTP ID
   */
  generateTtpId() {
    return 'sdk_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Send hello message with appropriate authentication
   */
  sendHelloMessage() {
    if (!this.isConnected) {
      console.warn('VoiceSDK: Cannot send hello message - not connected');
      return;
    }

    const helloMessage = {
      t: "hello"
    };

    // Use app ID for authentication (preferred method)
    if (this.config.appId) {
      helloMessage.appId = this.config.appId;
      console.log('VoiceSDK: Sending hello message with appId (app-based authentication)');
    } else if (this.config.ttpId) {
      // Fallback to custom TTP ID if app ID not provided
      helloMessage.ttpId = this.config.ttpId;
      console.log('VoiceSDK: Sending hello message with custom TTP ID (fallback method)');
    } else {
      // Generate TTP ID as last resort
      helloMessage.ttpId = this.generateTtpId();
      console.log('VoiceSDK: Sending hello message with generated TTP ID (last resort)');
    }

    // Note: agentId is now sent as query parameter in WebSocket URL, not in hello message

    // Log authentication method for debugging
    if (this.config.appId) {
      console.log('VoiceSDK: Using app ID for authentication:', this.config.appId);
    } else if (this.config.ttpId) {
      console.log('VoiceSDK: Using custom TTP ID:', this.config.ttpId);
    } else {
      console.log('VoiceSDK: Using generated TTP ID:', helloMessage.ttpId);
    }

    try {
      this.webSocketManager.sendMessage(helloMessage);
      console.log('VoiceSDK: Hello message sent:', helloMessage);
    } catch (error) {
      console.error('VoiceSDK: Failed to send hello message:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    if (this.isDestroyed) {
      console.log(`🎙️ VoiceSDK: Destroy called but already destroyed`);
      return; // Prevent multiple destroy calls
    }
    
    console.log(`🎙️ VoiceSDK: Destroying VoiceSDK instance`);
    
    // Disconnect first, before setting isDestroyed
    this.disconnect();
    
    this.isDestroyed = true;
    this.audioRecorder.destroy();
    this.audioPlayer.destroy();
    this.removeAllListeners();
    
    console.log(`🎙️ VoiceSDK: VoiceSDK instance destroyed`);
  }
}
