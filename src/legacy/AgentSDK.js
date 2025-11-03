/**
 * Legacy AgentSDK - Backward Compatibility Layer
 * 
 * This maintains the original AgentSDK API while using the new VoiceSDK internally.
 * This ensures existing integrations continue to work without changes.
 */

import { VoiceSDK } from '../index.js';

export class AgentSDK {
  constructor(config) {
    console.log('🚀 AgentSDK v2.1.8 initialized with config:', config);
    this.config = config;
    this.voiceSDK = null;
    this.isConnected = false;
    this.isListening = false;
    
    // Legacy callback properties
    this.onConnected = () => {};
    this.onDisconnected = () => {};
    this.onError = (error) => console.error('SDK Error:', error);
    this.onTranscript = (text) => {};
    this.onAgentSpeaking = (isStart) => {};
  }

  async connect(signedUrl) {
    try {
      if (!signedUrl) {
        throw new Error('signedUrl is required');
      }
      
      // Clean up existing connection if any
      if (this.voiceSDK) {
        console.log('🔌 AgentSDK: Cleaning up existing connection');
        this.voiceSDK.destroy();
        this.voiceSDK = null;
      }
      
      // Create VoiceSDK instance
      this.voiceSDK = new VoiceSDK({
        websocketUrl: signedUrl,
        autoReconnect: false,
        agentId: this.config.agentId,
        appId: this.config.appId,
        language: this.config.language || 'en'
      });
      
      // Set up event handlers to map to legacy callbacks
      this.voiceSDK.on('connected', () => {
        this.isConnected = true;
        this.onConnected();
      });
      
      this.voiceSDK.on('disconnected', (event) => {
        this.isConnected = false;
        // Check if disconnect was due to domain whitelist violation
        if (event && event.code === 1008 && event.reason && 
            (event.reason.includes('Domain not whitelisted') || 
             event.reason.includes('domain') || 
             event.reason.includes('whitelist'))) {
          const domainError = new Error('DOMAIN_NOT_WHITELISTED');
          domainError.reason = event.reason;
          domainError.code = event.code;
          this.onError(domainError);
        }
        this.onDisconnected();
      });
      
      this.voiceSDK.on('domainError', (error) => {
        this.onError(error);
      });
      
      this.voiceSDK.on('error', (error) => {
        this.onError(error);
      });
      
      this.voiceSDK.on('message', (message) => {
        this.handleWebSocketMessage(message);
      });
      
      this.voiceSDK.on('recordingStarted', () => {
        this.isListening = true;
      });
      
      this.voiceSDK.on('recordingStopped', () => {
        this.isListening = false;
      });
      
      this.voiceSDK.on('playbackStarted', () => {
        this.onAgentSpeaking(true);
      });
      
      this.voiceSDK.on('playbackStopped', () => {
        this.onAgentSpeaking(false);
      });
      
      // Connect using VoiceSDK
      await this.voiceSDK.connect();
      
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  handleWebSocketMessage(message) {
    // Map new message format to legacy format
    switch (message.type) {
      case 'connected':
        console.log('Session started successfully');
        break;
        
      case 'user_transcript':
        this.onTranscript(message.user_transcription || message.text);
        break;
        
      case 'agent_response':
        // Handle agent text response
        break;
        
      case 'barge_in':
        // Handle barge-in
        break;
        
      case 'stop_playing':
        // Handle stop playing
        break;
        
      case 'error':
        this.onError(new Error(message.message));
        break;
    }
  }

  async startListening() {
    console.log('🎤 AgentSDK: startListening() called');
    if (this.voiceSDK) {
      try {
        console.log('🎤 AgentSDK: Starting recording...');
        await this.voiceSDK.startRecording();
        console.log('✅ AgentSDK: Recording started successfully');
      } catch (error) {
        console.error('❌ AgentSDK: Failed to start recording:', error);
        throw error;
      }
    } else {
      console.error('❌ AgentSDK: No voiceSDK instance available');
      throw new Error('No voiceSDK instance available');
    }
  }

  stopListening() {
    if (this.voiceSDK) {
      this.voiceSDK.stopRecording();
    }
  }

  updateVariables(variables) {
    if (this.voiceSDK && this.isConnected) {
      // Send variables update message
      this.voiceSDK.webSocketManager.sendMessage({
        t: 'update_variables',
        variables
      });
    }
  }

  disconnect() {
    if (this.voiceSDK) {
      this.voiceSDK.destroy();
      this.voiceSDK = null;
    }
    this.isConnected = false;
    this.isListening = false;
  }
}
