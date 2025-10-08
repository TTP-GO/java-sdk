// ============================================
// FILE: src/index.js
// This is the main SDK file
// ============================================

// ============================================
// CORE SDK - Handles WebSocket, Auth, Audio
// ============================================

class AgentSDK {
  constructor(config) {
    this.config = config;
    this.ws = null;
    this.isConnected = false;
    this.isListening = false;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
    
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
      
      this.ws = new WebSocket(signedUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
      };

      this.ws.onmessage = (event) => {
      	try {
      	    const message = JSON.parse(event.data);
      	    this.handleWebSocketMessage(message);
        } catch (error) {
        // For testing: echo server returns plain text
      	console.log('Received non-JSON message (testing mode):', event.data);
        }
      };

      this.ws.onerror = (error) => {
        this.onError(error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.onDisconnected();
      };

      await this.waitForConnection();
      this.isConnected = true;
      this.onConnected();
      
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      const checkConnection = () => {
        if (this.ws.readyState === WebSocket.OPEN) {
          clearTimeout(timeout);
          resolve();
        }
      };

      this.ws.addEventListener('open', checkConnection);
    });
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'connected':
        console.log('Session started successfully');
        break;
        
      case 'transcript':
        this.onTranscript(message.text);
        break;
        
      case 'agent_audio':
        this.playAudio(message.audio);
        break;
        
      case 'agent_speaking_start':
        this.onAgentSpeaking(true);
        break;
        
      case 'agent_speaking_end':
        this.onAgentSpeaking(false);
        break;
        
      case 'error':
        this.onError(new Error(message.message));
        break;
    }
  }

  async startListening() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws.readyState === WebSocket.OPEN) {
          this.sendAudioChunk(event.data);
        }
      };

      this.mediaRecorder.start(100);
      this.isListening = true;
      
    } catch (error) {
      this.onError(new Error('Microphone access denied'));
      throw error;
    }
  }

  async sendAudioChunk(blob) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result.split(',')[1];
      this.ws.send(JSON.stringify({
        type: 'audio',
        audio: base64Audio
      }));
    };
    reader.readAsDataURL(blob);
  }

  stopListening() {
    if (this.mediaRecorder && this.isListening) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isListening = false;
    }
  }

  async playAudio(base64Audio) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const audioData = atob(base64Audio);
    const arrayBuffer = new ArrayBuffer(audioData.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < audioData.length; i++) {
      view[i] = audioData.charCodeAt(i);
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioQueue.push(audioBuffer);
      
      if (!this.isPlaying) {
        this.playNextInQueue();
      }
    } catch (error) {
      console.error('Error decoding audio:', error);
    }
  }

  playNextInQueue() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift();
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    source.onended = () => {
      this.playNextInQueue();
    };
    
    source.start(0);
  }

  updateVariables(variables) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({
        type: 'update_variables',
        variables
      }));
    }
  }

  disconnect() {
    this.stopListening();
    if (this.ws) {
      this.ws.close();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}


// ============================================
// WIDGET - Pre-built UI using the SDK
// ============================================

class AgentWidget {
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
      const response = await fetch(this.config.getSessionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: this.config.agentId,
          variables: this.config.variables || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get session URL: ${response.statusText}`);
      }

      const data = await response.json();
      return data.signedUrl || data.wsUrl || data.url;
    }
    else if (typeof this.config.getSessionUrl === 'function') {
      const result = await this.config.getSessionUrl({
        agentId: this.config.agentId,
        variables: this.config.variables || {}
      });
      
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


// ============================================
// GLOBAL API
// ============================================

// Expose to window for script tag usage
if (typeof window !== 'undefined') {
  window.AgentWidget = {
    init: (config) => {
      if (!config.agentId) {
        throw new Error('agentId is required');
      }
      if (!config.getSessionUrl) {
        throw new Error('getSessionUrl is required');
      }
      return new AgentWidget(config);
    }
  };
  
  window.AgentSDK = AgentSDK;
}

// Also export for npm usage
export { AgentSDK, AgentWidget };
export default { AgentSDK, AgentWidget };
