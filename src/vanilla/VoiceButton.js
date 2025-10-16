/**
 * VoiceButton - Vanilla JavaScript voice button
 */
import VoiceSDK from '../core/VoiceSDK.js';

export default class VoiceButton {
  constructor(options = {}) {
    this.options = {
      websocketUrl: options.websocketUrl || 'wss://speech.talktopc.com/ws/conv',
      agentId: options.agentId, // Optional - for direct agent access (unsecured method)
      voice: options.voice || 'default',
      language: options.language || 'en',
      container: options.container || document.body,
      buttonText: options.buttonText || 'Start Listening',
      buttonClass: options.buttonClass || 'voice-button',
      ...options
    };
    
    this.isConnected = false;
    this.isRecording = false;
    this.isPlaying = false;
    
    this.voiceSDK = new VoiceSDK({
      websocketUrl: this.options.websocketUrl,
      agentId: this.options.agentId, // Pass through agentId if provided
      voice: this.options.voice,
      language: this.options.language
    });
    
    this.setupEventListeners();
    this.createButton();
    this.connect();
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.voiceSDK.on('connected', () => {
      this.isConnected = true;
      this.updateButton();
      this.options.onConnected?.();
    });
    
    this.voiceSDK.on('disconnected', () => {
      this.isConnected = false;
      this.updateButton();
      this.options.onDisconnected?.();
    });
    
    this.voiceSDK.on('recordingStarted', () => {
      this.isRecording = true;
      this.updateButton();
      this.options.onRecordingStarted?.();
    });
    
    this.voiceSDK.on('recordingStopped', () => {
      this.isRecording = false;
      this.updateButton();
      this.options.onRecordingStopped?.();
    });
    
    this.voiceSDK.on('playbackStarted', () => {
      this.isPlaying = true;
      this.options.onPlaybackStarted?.();
    });
    
    this.voiceSDK.on('playbackStopped', () => {
      this.isPlaying = false;
      this.options.onPlaybackStopped?.();
    });
    
    this.voiceSDK.on('error', (error) => {
      this.options.onError?.(error);
    });
    
    this.voiceSDK.on('message', (message) => {
      this.options.onMessage?.(message);
    });
    
    this.voiceSDK.on('bargeIn', (message) => {
      this.options.onBargeIn?.(message);
    });
    
    this.voiceSDK.on('stopPlaying', (message) => {
      this.options.onStopPlaying?.(message);
    });
  }
  
  /**
   * Create the button element
   */
  createButton() {
    this.button = document.createElement('button');
    this.button.className = this.options.buttonClass;
    this.button.style.cssText = `
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      background-color: #6c757d;
      color: white;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    this.button.addEventListener('click', () => this.toggleRecording());
    this.options.container.appendChild(this.button);
    
    this.updateButton();
  }
  
  /**
   * Update button appearance and state
   */
  updateButton() {
    if (!this.button) return;
    
    const icon = this.isRecording ? '🔴' : '🎤';
    const text = this.isRecording ? 'Stop Listening' : 'Start Listening';
    
    this.button.innerHTML = `
      <span style="font-size: 20px;">${icon}</span>
      <span>${text}</span>
    `;
    
    this.button.disabled = !this.isConnected;
    this.button.style.backgroundColor = this.isRecording ? '#dc3545' : 
                                      this.isConnected ? '#007bff' : '#6c757d';
  }
  
  /**
   * Connect to voice server
   */
  async connect() {
    try {
      await this.voiceSDK.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }
  
  /**
   * Toggle recording
   */
  async toggleRecording() {
    if (!this.voiceSDK) return;
    
    try {
      await this.voiceSDK.toggleRecording();
    } catch (error) {
      console.error('Error toggling recording:', error);
    }
  }
  
  /**
   * Get current status
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
    this.voiceSDK.updateConfig(newConfig);
  }
  
  /**
   * Destroy the button and cleanup
   */
  destroy() {
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
    
    if (this.voiceSDK) {
      this.voiceSDK.destroy();
    }
  }
}
