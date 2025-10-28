/**
 * Legacy AgentSDK - Backward Compatibility Layer
 * 
 * This maintains the original AgentSDK API while using the new VoiceSDK internally.
 * This ensures existing integrations continue to work without changes.
 */

import { VoiceSDK } from '../index.js';

export class AgentSDK {
  constructor(config) {
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
      
      // Create VoiceSDK instance
      this.voiceSDK = new VoiceSDK({
        websocketUrl: signedUrl,
        autoReconnect: false
      });
      
      // Set up event handlers to map to legacy callbacks
      this.voiceSDK.on('connected', () => {
        this.isConnected = true;
        this.onConnected();
      });
      
      this.voiceSDK.on('disconnected', () => {
        this.isConnected = false;
        this.onDisconnected();
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
    if (this.voiceSDK) {
      await this.voiceSDK.startRecording();
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

// ============================================
// WIDGET - Pre-built UI using the SDK
// ============================================

export class AgentWidget {
  constructor(config) {
    this.config = config;
    this.sdk = new AgentSDK();
    this.isOpen = false;
    this.isActive = false;
    
    this.position = config.position || 'bottom-right';
    this.primaryColor = config.primaryColor || '#4F46E5';
    
    this.setupEventHandlers();
    this.createWidget();
  }

  setupEventHandlers() {
    this.sdk.onConnected = () => {
      this.updateStatus('connected');
    };

    this.sdk.onDisconnected = () => {
      this.updateStatus('disconnected');
      this.isActive = false;
    };

    this.sdk.onError = (error) => {
      this.showError(error.message);
    };

    this.sdk.onTranscript = (text) => {
      this.addMessage('user', text);
    };

    this.sdk.onAgentSpeaking = (isStart) => {
      if (isStart) {
        this.showAgentThinking();
      } else {
        this.hideAgentThinking();
      }
    };
  }

  createWidget() {
    const widget = document.createElement('div');
    widget.id = 'agent-widget';
    widget.innerHTML = `
      <style>
        #agent-widget {
          position: fixed;
          ${this.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
          ${this.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        #agent-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${this.primaryColor};
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        
        #agent-button:hover {
          transform: scale(1.1);
        }
        
        #agent-button svg {
          width: 28px;
          height: 28px;
          fill: white;
        }
        
        #agent-panel {
          display: none;
          position: absolute;
          bottom: 80px;
          ${this.position.includes('right') ? 'right: 0;' : 'left: 0;'}
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          flex-direction: column;
          overflow: hidden;
        }
        
        #agent-panel.open {
          display: flex;
        }
        
        #agent-header {
          background: ${this.primaryColor};
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        #agent-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 24px;
        }
        
        #agent-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .message {
          padding: 12px;
          border-radius: 8px;
          max-width: 80%;
        }
        
        .message.user {
          background: #E5E7EB;
          align-self: flex-end;
        }
        
        .message.agent {
          background: #F3F4F6;
          align-self: flex-start;
        }
        
        #agent-controls {
          padding: 16px;
          border-top: 1px solid #E5E7EB;
          display: flex;
          justify-content: center;
        }
        
        #agent-mic-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: ${this.primaryColor};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        #agent-mic-button.active {
          background: #EF4444;
          animation: pulse 1.5s infinite;
        }
        
        #agent-mic-button svg {
          width: 28px;
          height: 28px;
          fill: white;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .agent-thinking {
          font-style: italic;
          color: #6B7280;
        }
        
        .error-message {
          background: #FEE2E2;
          color: #991B1B;
          padding: 12px;
          border-radius: 8px;
          margin: 8px;
        }
      </style>
      
      <button id="agent-button">
        <svg viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </button>
      
      <div id="agent-panel">
        <div id="agent-header">
          <h3 style="margin: 0;">Voice Assistant</h3>
          <button id="agent-close">&times;</button>
        </div>
        
        <div id="agent-messages"></div>
        
        <div id="agent-controls">
          <button id="agent-mic-button">
            <svg viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    
    document.getElementById('agent-button').onclick = () => this.togglePanel();
    document.getElementById('agent-close').onclick = () => this.togglePanel();
    document.getElementById('agent-mic-button').onclick = () => this.toggleVoice();
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('agent-panel');
    panel.classList.toggle('open');
  }

  async toggleVoice() {
    if (!this.isActive) {
      try {
        const signedUrl = await this.getSignedUrl();
        await this.sdk.connect(signedUrl);
        await this.sdk.startListening();
        this.isActive = true;
        document.getElementById('agent-mic-button').classList.add('active');
        this.addMessage('system', 'Listening...');
      } catch (error) {
        console.error('Failed to start:', error);
        this.showError(error.message);
      }
    } else {
      this.sdk.stopListening();
      this.sdk.disconnect();
      this.isActive = false;
      document.getElementById('agent-mic-button').classList.remove('active');
    }
  }

  async getSignedUrl() {
    if (typeof this.config.getSessionUrl === 'string') {
      const requestBody = {
        agentId: this.config.agentId,
        variables: this.config.variables || {}
      };
      
      // Add appId if provided in config
      if (this.config.appId) {
        requestBody.appId = this.config.appId;
      }
      
      const response = await fetch(this.config.getSessionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to get session URL: ${response.statusText}`);
      }

      const data = await response.json();
      return data.signedUrl || data.wsUrl || data.url;
    }
    else if (typeof this.config.getSessionUrl === 'function') {
      const params = {
        agentId: this.config.agentId,
        variables: this.config.variables || {}
      };
      
      // Add appId if provided in config
      if (this.config.appId) {
        params.appId = this.config.appId;
      }
      
      const result = await this.config.getSessionUrl(params);
      
      return typeof result === 'string' ? result : (result.signedUrl || result.wsUrl || result.url);
    }
    else {
      throw new Error('getSessionUrl is required (URL string or function)');
    }
  }

  addMessage(type, text) {
    const messages = document.getElementById('agent-messages');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  showAgentThinking() {
    const messages = document.getElementById('agent-messages');
    const thinking = document.createElement('div');
    thinking.className = 'message agent agent-thinking';
    thinking.id = 'thinking-indicator';
    thinking.textContent = 'Agent is speaking...';
    messages.appendChild(thinking);
    messages.scrollTop = messages.scrollHeight;
  }

  hideAgentThinking() {
    const thinking = document.getElementById('thinking-indicator');
    if (thinking) thinking.remove();
  }

  showError(message) {
    const messages = document.getElementById('agent-messages');
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    messages.appendChild(error);
  }

  updateStatus(status) {
    console.log('Widget status:', status);
  }
}
