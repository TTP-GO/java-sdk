/**
 * VoiceSDK - Core voice interaction SDK
 * Handles WebSocket connection, audio recording, and audio playback
 */
import EventEmitter from './EventEmitter.js';
import WebSocketManager from './WebSocketManager.js';
import AudioRecorder from './AudioRecorder.js';
import AudioPlayer from './AudioPlayer.js';

export default class VoiceSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      websocketUrl: config.websocketUrl || 'wss://speech.talktopc.com/ws/conv',
      agentId: config.agentId, // Optional - for direct agent access (unsecured method)
      appId: config.appId, // User's app ID for authentication (REQUIRED)
      ttpId: config.ttpId, // Optional - custom TTP ID (fallback if appId not provided)
      voice: config.voice || 'default',
      language: config.language || 'en',
      sampleRate: config.sampleRate || 16000,
      
      // NEW: Agent settings override (sent via WebSocket message)
      // Only available with signed link authentication
      agentSettingsOverride: config.agentSettingsOverride || null,
      
      ...config
    };
    
    // State
    this.isConnected = false;
    this.isRecording = false;
    this.isPlaying = false;
    this.isDestroyed = false;
    
    // Components
    this.webSocketManager = new WebSocketManager({
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
    
    this.webSocketManager.on('disconnected', (event) => {
      this.isConnected = false;
      
      // Check if disconnect was due to domain whitelist violation
      if (event && event.code === 1008 && event.reason && 
          (event.reason.includes('Domain not whitelisted') || 
           event.reason.includes('domain') || 
           event.reason.includes('whitelist'))) {
        const domainError = new Error('DOMAIN_NOT_WHITELISTED');
        domainError.reason = event.reason;
        domainError.code = event.code;
        this.emit('domainError', domainError);
        this.emit('error', domainError);
      }
      
      // IMPORTANT: Stop recording when WebSocket disconnects (e.g., no credits, max duration exceeded)
      // This ensures microphone is released and no more audio is streamed
      if (this.isRecording) {
        this.stopRecording().catch(err => {
          console.error('VoiceSDK: Error stopping recording on disconnect:', err);
        });
      }
      
      // Pass close event details (code, reason) to consumers
      this.emit('disconnected', event);
    });
    
    this.webSocketManager.on('error', (error) => {
      this.emit('error', error);
    });
    
    this.webSocketManager.on('message', (message) => {
      // Handle greeting audio message
      if (message.t === 'greeting_audio' && message.data) {
        try {
          // Convert base64 audio data to Uint8Array
          const binaryString = atob(message.data);
          const audioData = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            audioData[i] = binaryString.charCodeAt(i);
          }
          
          this.audioPlayer.playAudio(audioData);
          this.emit('greetingStarted');
        } catch (error) {
          console.error('VoiceSDK: Error playing greeting audio:', error);
        }
      } else {
        this.emit('message', message);
      }
    });
    
    this.webSocketManager.on('binaryAudio', (audioData) => {
      this.audioPlayer.playAudio(audioData);
    });
    
    this.webSocketManager.on('bargeIn', (message) => {
      this.emit('bargeIn', message);
    });
    
    this.webSocketManager.on('stopPlaying', (message) => {
      this.emit('stopPlaying', message);
      // Stop current playback and clear queue, but keep playing new audio
      // Note: stopImmediate() will emit playbackStopped, which will send audio_stopped_playing to backend
      // This ensures backend knows when browser actually stops playing
      this.audioPlayer.stopImmediate();
      // Note: stopImmediate() clears the queue but AudioPlayer can still accept new audio via playAudio()
    });
    
    // Audio recorder events
    this.audioRecorder.on('recordingStarted', () => {
      this.isRecording = true;
      
      // Detect barge-in: if audio is playing when recording starts
      if (this.isPlaying) {
        // Stop audio playback immediately
        this.audioPlayer.stopImmediate();
        // Send barge-in message to server
        if (this.isConnected) {
          this.webSocketManager.sendMessage({
            t: 'barge_in'
          });
        }
      }
      
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
      
      // Send audio_started_playing message to server
      if (this.isConnected) {
        this.webSocketManager.sendMessage({
          t: 'audio_started_playing'
        });
      }
    });
    
    this.audioPlayer.on('playbackStopped', () => {
      this.isPlaying = false;
      this.emit('playbackStopped');
      
      // Send audio_stopped_playing message to server
      if (this.isConnected) {
        this.webSocketManager.sendMessage({
          t: 'audio_stopped_playing'
        });
      }
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
      console.warn('VoiceSDK: Cannot connect - SDK is destroyed');
      return false; // Prevent connect after destroy
    }
    
    try {
      // Build WebSocket URL with query parameters if needed
      const wsUrl = this.buildWebSocketUrl();
      
      // Update the WebSocket manager with the URL that includes query parameters
      this.webSocketManager.config.websocketUrl = wsUrl;
      
      await this.webSocketManager.connect();
      return true;
    } catch (error) {
      console.error('🔌 VoiceSDK: Connection failed with error:', error);
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
    }
    
    // Add appId as query parameter if provided
    if (this.config.appId) {
      params.append('appId', this.config.appId);
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
      return; // Prevent disconnect after destroy
    }
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
      console.error('❌ VoiceSDK: Failed to start recording:', error);
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

    // appId is REQUIRED - no fallback to ttpId
    if (!this.config.appId) {
      const error = new Error('appId is required for connection');
      console.error('VoiceSDK: Failed to send hello message:', error);
      this.emit('error', error);
      return;
    }
    
      helloMessage.appId = this.config.appId;

    // NEW: Include agent settings override if provided
    // This is only accepted by the server if using signed link authentication
    if (this.config.agentSettingsOverride && 
        Object.keys(this.config.agentSettingsOverride).length > 0) {
      helloMessage.agentSettingsOverride = this.config.agentSettingsOverride;
      console.log('🔧 VoiceSDK: Sending agent settings override:', 
        Object.keys(this.config.agentSettingsOverride));
    }

    // Note: agentId is now sent as query parameter in WebSocket URL, not in hello message

    try {
      this.webSocketManager.sendMessage(helloMessage);
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
      return; // Prevent multiple destroy calls
    }
    
    // Disconnect first, before setting isDestroyed
    this.disconnect();
    
    this.isDestroyed = true;
    this.audioRecorder.destroy();
    this.audioPlayer.destroy();
    this.removeAllListeners();
  }
}
