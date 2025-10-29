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

// ============================================
// WIDGET - Pre-built UI using the SDK
// ============================================

export class AgentWidget {
  constructor(config = {}) {
    // Merge user config with defaults (backward compatible with simple config)
    this.config = this.mergeWithDefaults(config);
    this.sdk = new AgentSDK(this.config);
    this.isOpen = false;
    this.isActive = false;
    
    this.setupEventHandlers();
    this.createWidget();
    
    // Auto-open if configured
    if (this.config.behavior.autoOpen) {
      setTimeout(() => this.togglePanel(), 1000);
    }
  }

  /**
   * Merge user configuration with defaults
   * Supports both simple config (backward compatible) and advanced config
   */
  mergeWithDefaults(userConfig) {
    // Handle legacy position string format
    let positionConfig = userConfig.position || 'bottom-right';
    if (typeof positionConfig === 'string') {
      // Convert legacy format 'bottom-right' to new format
      const parts = positionConfig.split('-');
      positionConfig = {
        vertical: parts[0] || 'bottom',
        horizontal: parts[1] || 'right',
        offset: userConfig.positionOffset || { x: 20, y: 20 }
      };
    }

    // Handle legacy primaryColor
    const primaryColor = userConfig.primaryColor || userConfig.button?.primaryColor || '#4F46E5';

    return {
      // Required (agentId is required, appId is optional)
      agentId: userConfig.agentId,
      appId: userConfig.appId,
      getSessionUrl: userConfig.getSessionUrl, // Optional - will auto-construct URL if omitted
      websocketUrl: userConfig.websocketUrl, // Optional - defaults to speech.talktopc.com
      demo: userConfig.demo !== false, // Optional - defaults to true
      direction: userConfig.direction || 'ltr', // Optional - text direction: 'ltr' or 'rtl'
      
      // Icon/Image Configuration
      icon: {
        type: userConfig.icon?.type || 'microphone', // 'microphone', 'custom', 'emoji', 'text'
        customImage: userConfig.icon?.customImage || null,
        emoji: userConfig.icon?.emoji || '🎤',
        text: userConfig.icon?.text || 'AI',
        size: userConfig.icon?.size || 'medium', // 'small', 'medium', 'large', 'xl'
        // backgroundColor is deprecated - use button.backgroundColor instead
        backgroundColor: userConfig.icon?.backgroundColor || null,
        ...userConfig.icon
      },
      
      // Positioning Configuration (supports both object and legacy string)
      position: {
        vertical: positionConfig.vertical || 'bottom',
        horizontal: positionConfig.horizontal || 'right',
        offset: positionConfig.offset || { x: 20, y: 20 },
        ...(typeof userConfig.position === 'object' ? userConfig.position : {})
      },
      
      // Button Configuration
      button: {
        size: userConfig.button?.size || 'medium',
        shape: userConfig.button?.shape || 'circle',
        // Floating button colors (main button)
        backgroundColor: userConfig.button?.backgroundColor || userConfig.icon?.backgroundColor || primaryColor,
        hoverColor: userConfig.button?.hoverColor || '#7C3AED',
        shadow: userConfig.button?.shadow !== false,
        shadowColor: userConfig.button?.shadowColor || 'rgba(0,0,0,0.15)',
        // Legacy support - map to backgroundColor
        primaryColor: userConfig.button?.backgroundColor || userConfig.icon?.backgroundColor || primaryColor,
        ...userConfig.button
      },
      
      // Panel Configuration
      panel: {
        width: userConfig.panel?.width || 350,
        height: userConfig.panel?.height || 500,
        borderRadius: userConfig.panel?.borderRadius || 12,
        backgroundColor: userConfig.panel?.backgroundColor || '#FFFFFF',
        backdropFilter: userConfig.panel?.backdropFilter || null,
        border: userConfig.panel?.border || '1px solid rgba(0,0,0,0.1)',
        // Mic button colors (inside panel)
        micButtonColor: userConfig.panel?.micButtonColor || primaryColor,
        micButtonActiveColor: userConfig.panel?.micButtonActiveColor || '#EF4444',
        // Mic button hint text (below button)
        // If text is empty or not provided, hint will not be shown
        micButtonHint: {
          text: userConfig.panel?.micButtonHint?.text || 'Click the button to start voice conversation',
          color: userConfig.panel?.micButtonHint?.color || '#6B7280',
          fontSize: userConfig.panel?.micButtonHint?.fontSize || '12px',
          ...userConfig.panel?.micButtonHint
        },
        ...userConfig.panel
      },
      
      // Header Configuration (top of panel)
      header: {
        title: userConfig.header?.title || 'Voice Assistant',
        showTitle: userConfig.header?.showTitle !== false,
        backgroundColor: userConfig.header?.backgroundColor || userConfig.button?.backgroundColor || primaryColor, // Header/top background color
        textColor: userConfig.header?.textColor || '#FFFFFF',
        showCloseButton: userConfig.header?.showCloseButton !== false,
        ...userConfig.header
      },
      
      // Messages Configuration
      messages: {
        userBackgroundColor: userConfig.messages?.userBackgroundColor || '#E5E7EB',
        agentBackgroundColor: userConfig.messages?.agentBackgroundColor || '#F3F4F6',
        systemBackgroundColor: userConfig.messages?.systemBackgroundColor || '#DCFCE7',
        errorBackgroundColor: userConfig.messages?.errorBackgroundColor || '#FEE2E2',
        textColor: userConfig.messages?.textColor || '#1F2937',
        fontSize: userConfig.messages?.fontSize || '14px',
        borderRadius: userConfig.messages?.borderRadius || 8,
        ...userConfig.messages
      },
      
      // Animation Configuration
      animation: {
        enableHover: userConfig.animation?.enableHover !== false,
        enablePulse: userConfig.animation?.enablePulse !== false,
        enableSlide: userConfig.animation?.enableSlide !== false,
        duration: userConfig.animation?.duration || 0.3,
        ...userConfig.animation
      },
      
      // Behavior Configuration
      behavior: {
        autoOpen: userConfig.behavior?.autoOpen || false,
        autoConnect: userConfig.behavior?.autoConnect || false,
        showWelcomeMessage: userConfig.behavior?.showWelcomeMessage !== false,
        welcomeMessage: userConfig.behavior?.welcomeMessage || 'Hello! How can I help you today?',
        ...userConfig.behavior
      },
      
      // Accessibility Configuration
      accessibility: {
        ariaLabel: userConfig.accessibility?.ariaLabel || 'Voice Assistant',
        ariaDescription: userConfig.accessibility?.ariaDescription || 'Click to open voice assistant',
        keyboardNavigation: userConfig.accessibility?.keyboardNavigation !== false,
        ...userConfig.accessibility
      },
      
      // Custom CSS
      customStyles: userConfig.customStyles || '',
      
      // Variables for the agent
      variables: userConfig.variables || {},
      
      // Legacy support (for backward compatibility)
      primaryColor: primaryColor,
      // Keep position string for backward compatibility
      ...(typeof userConfig.position === 'string' ? { positionString: userConfig.position } : {})
    };
  }

  setupEventHandlers() {
    this.sdk.onConnected = () => {
      this.updateStatus('connected');
      if (this.config.behavior.showWelcomeMessage) {
        this.addMessage('system', this.config.behavior.welcomeMessage);
      }
    };

    this.sdk.onDisconnected = () => {
      this.updateStatus('disconnected');
      this.isActive = false;
      this.updateMicButtonState(false);
      this.showError('Conversation ended. Click to start a new conversation.');
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
    widget.innerHTML = this.generateWidgetHTML();
    
    document.body.appendChild(widget);
    
    this.setupWidgetEvents();
    
    // Auto-open if configured
    if (this.config.behavior.autoOpen) {
      setTimeout(() => this.togglePanel(), 1000);
    }
  }

  generateWidgetHTML() {
    const pos = this.config.position;
    const btn = this.config.button;
    const icon = this.config.icon;
    const panel = this.config.panel;
    const header = this.config.header;
    const anim = this.config.animation;

    // Calculate button size
    const buttonSizes = {
      small: 50,
      medium: 60,
      large: 70,
      xl: 80
    };
    const buttonSize = buttonSizes[btn.size] || 60;

    // Calculate icon size
    const iconSizes = {
      small: 20,
      medium: 28,
      large: 36,
      xl: 44
    };
    const iconSize = iconSizes[icon.size] || 28;

    // Generate position styles
    const positionStyles = this.generatePositionStyles();

    // Generate icon HTML
    const iconHTML = this.generateIconHTML(iconSize);

    return `
      <style>
        ${this.generateCSS(positionStyles, buttonSize, iconSize)}
        ${this.config.customStyles}
      </style>
      
      <button id="agent-button" 
              aria-label="${this.config.accessibility.ariaLabel}"
              aria-description="${this.config.accessibility.ariaDescription}">
        ${iconHTML}
      </button>
      
      <div id="agent-panel">
        ${header.showTitle ? `
          <div id="agent-header" style="direction: ${this.config.direction};">
            ${this.config.direction === 'rtl' ? `
              ${header.showCloseButton ? '<button id="agent-close">&times;</button>' : ''}
              <h3 style="margin: 0; color: ${header.textColor};">${header.title}</h3>
            ` : `
              <h3 style="margin: 0; color: ${header.textColor};">${header.title}</h3>
              ${header.showCloseButton ? '<button id="agent-close">&times;</button>' : ''}
            `}
          </div>
        ` : ''}
        
        <div id="agent-messages"></div>
        
        <div id="agent-controls">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <button id="agent-mic-button" 
                    aria-label="Start/Stop Voice Recording">
              ${iconHTML}
            </button>
            ${panel.micButtonHint.text && panel.micButtonHint.text.trim() ? `
              <div id="agent-mic-hint" style="color: ${panel.micButtonHint.color}; font-size: ${panel.micButtonHint.fontSize}; text-align: center; max-width: 200px;">
                ${panel.micButtonHint.text}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  generatePositionStyles() {
    const pos = this.config.position;
    const offset = pos.offset || { x: 20, y: 20 };
    
    let styles = '';
    
    // Vertical positioning
    if (pos.vertical === 'top') {
      styles += `top: ${offset.y}px;`;
    } else if (pos.vertical === 'bottom') {
      styles += `bottom: ${offset.y}px;`;
    } else if (pos.vertical === 'center') {
      styles += `top: 50%; transform: translateY(-50%);`;
    }
    
    // Horizontal positioning
    if (pos.horizontal === 'left') {
      styles += `left: ${offset.x}px;`;
    } else if (pos.horizontal === 'right') {
      styles += `right: ${offset.x}px;`;
    } else if (pos.horizontal === 'center') {
      styles += `left: 50%; transform: translateX(-50%);`;
    }
    
    return styles;
  }

  generateIconHTML(size) {
    const icon = this.config.icon;
    
    switch (icon.type) {
      case 'custom':
        return `<img src="${icon.customImage}" alt="Voice Assistant" style="width: ${size}px; height: ${size}px; object-fit: contain;" />`;
      
      case 'emoji':
        return `<span style="font-size: ${size}px; line-height: 1;">${icon.emoji}</span>`;
      
      case 'text':
        return `<span style="font-size: ${Math.floor(size * 0.6)}px; font-weight: bold; color: white;">${icon.text}</span>`;
      
      case 'microphone':
      default:
        return `<svg viewBox="0 0 24 24" style="width: ${size}px; height: ${size}px; fill: white;">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>`;
    }
  }

  generateCSS(positionStyles, buttonSize, iconSize) {
    const btn = this.config.button;
    const panel = this.config.panel;
    const header = this.config.header;
    const messages = this.config.messages;
    const anim = this.config.animation;
    
    // Color references for clarity
    const floatingButtonColor = btn.backgroundColor || btn.primaryColor; // Floating button (main)
    const headerColor = header.backgroundColor; // Header/top of panel
    const micButtonColor = panel.micButtonColor || btn.primaryColor; // Mic button in panel
    const micButtonActiveColor = panel.micButtonActiveColor || '#EF4444'; // Mic button active state

    return `
      #agent-widget {
        position: fixed;
        ${positionStyles}
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      #agent-button {
        width: ${buttonSize}px;
        height: ${buttonSize}px;
        border-radius: ${btn.shape === 'circle' ? '50%' : btn.shape === 'square' ? '0' : '12px'};
        background: ${floatingButtonColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all ${anim.duration}s ease;
        ${btn.shadow ? `box-shadow: 0 4px 12px ${btn.shadowColor};` : ''}
      }
      
      ${anim.enableHover ? `
        #agent-button:hover {
          background: ${btn.hoverColor};
          transform: scale(1.05);
          ${btn.shadow ? `box-shadow: 0 8px 20px ${btn.shadowColor};` : ''}
        }
      ` : ''}
      
      #agent-panel {
        display: none;
        position: absolute;
        bottom: ${buttonSize + 20}px;
        ${this.config.position.horizontal === 'right' ? 'right: 0;' : 'left: 0;'}
        width: ${panel.width}px;
        height: ${panel.height}px;
        background: ${panel.backgroundColor};
        border-radius: ${panel.borderRadius}px;
        border: ${panel.border};
        flex-direction: column;
        overflow: hidden;
        ${panel.backdropFilter ? `backdrop-filter: ${panel.backdropFilter};` : ''}
        ${anim.enableSlide ? `transition: all ${anim.duration}s ease;` : ''}
      }
      
      #agent-panel.open {
        display: flex;
        ${anim.enableSlide ? 'transform: translateY(0); opacity: 1;' : ''}
      }
      
      #agent-header {
        background: ${headerColor};
        color: ${header.textColor};
        padding: 16px;
        display: flex;
        flex-direction: ${this.config.direction === 'rtl' ? 'row-reverse' : 'row'};
        justify-content: space-between;
        align-items: center;
        border-radius: ${panel.borderRadius}px ${panel.borderRadius}px 0 0;
        direction: ${this.config.direction};
      }
      
      #agent-header h3 {
        margin: 0;
        flex: 1;
        text-align: ${this.config.direction === 'rtl' ? 'right' : 'left'};
      }
      
      #agent-close {
        background: none;
        border: none;
        color: ${header.textColor};
        cursor: pointer;
        font-size: 24px;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
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
        border-radius: ${messages.borderRadius}px;
        max-width: 80%;
        font-size: ${messages.fontSize};
        color: ${messages.textColor};
      }
      
      .message.user {
        background: ${messages.userBackgroundColor};
        align-self: flex-end;
      }
      
      .message.agent {
        background: ${messages.agentBackgroundColor};
        align-self: flex-start;
      }
      
      .message.system {
        background: ${messages.systemBackgroundColor};
        align-self: flex-start;
        font-style: italic;
      }
      
      .error-message {
        background: ${messages.errorBackgroundColor};
        color: #991B1B;
        padding: 12px;
        border-radius: ${messages.borderRadius}px;
        margin: 8px;
      }
      
      #agent-controls {
        padding: 16px;
        border-top: 1px solid #E5E7EB;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      #agent-controls > div {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      
      #agent-mic-hint {
        text-align: center;
        line-height: 1.4;
      }
      
      #agent-mic-button {
        width: ${buttonSize}px;
        height: ${buttonSize}px;
        border-radius: ${btn.shape === 'circle' ? '50%' : btn.shape === 'square' ? '0' : '12px'};
        border: none;
        background: ${micButtonColor};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all ${anim.duration}s ease;
      }
      
      #agent-mic-button.active {
        background: ${micButtonActiveColor};
        ${anim.enablePulse ? `
          animation: pulse 1.5s infinite;
        ` : ''}
      }
      
      ${anim.enablePulse ? `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      ` : ''}
      
      .agent-thinking {
        font-style: italic;
        color: #6B7280;
      }
    `;
  }

  setupWidgetEvents() {
    document.getElementById('agent-button').onclick = () => this.togglePanel();
    
    const closeBtn = document.getElementById('agent-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.togglePanel();
    }
    
    document.getElementById('agent-mic-button').onclick = () => this.toggleVoice();
    
    // Keyboard navigation
    if (this.config.accessibility.keyboardNavigation) {
      this.setupKeyboardNavigation();
    }
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.togglePanel();
      }
    });
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('agent-panel');
    panel.classList.toggle('open');
  }

  async toggleVoice() {
    if (!this.isActive) {
      try {
        console.log('🎤 Starting voice session...');
        const signedUrl = await this.getSignedUrl();
        console.log('🔗 Got signed URL:', signedUrl);
        
        const connected = await this.sdk.connect(signedUrl);
        console.log('✅ Connected to WebSocket, connected:', connected);
        
        // Wait for connection to be fully ready (for hello message exchange)
        let attempts = 0;
        while (!this.sdk.isConnected && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (this.sdk.isConnected) {
          console.log('✅ WebSocket ready, starting listening...');
          await this.sdk.startListening();
          console.log('🎤 Started listening');
          
          this.isActive = true;
          this.updateMicButtonState(true);
          this.addMessage('system', '🎤 Listening... Click mic to stop');
        } else {
          console.warn('⚠️ Connection not fully ready, but trying to start listening anyway...');
          await this.sdk.startListening();
          console.log('🎤 Started listening');
          
          this.isActive = true;
          this.updateMicButtonState(true);
          this.addMessage('system', '🎤 Listening... Click mic to stop');
        }
      } catch (error) {
        console.error('❌ Failed to start:', error);
        this.showError(error.message);
      }
    } else {
      console.log('🔇 Stopping voice session...');
      this.sdk.stopListening();
      this.sdk.disconnect();
      this.isActive = false;
      this.updateMicButtonState(false);
      this.addMessage('system', '🔇 Stopped listening');
    }
  }

  updateMicButtonState(isListening) {
    const micButton = document.getElementById('agent-mic-button');
    if (!micButton) return;
    
    const iconSizes = {
      small: 20,
      medium: 28,
      large: 36,
      xl: 44
    };
    const iconSize = iconSizes[this.config.icon.size] || 28;
    
    if (isListening) {
      micButton.classList.add('active');
      micButton.title = 'Click to stop listening';
      
      // Change icon to stop icon (only if using SVG microphone icon)
      if (this.config.icon.type === 'microphone' || this.config.icon.type === 'custom') {
        const iconElement = micButton.querySelector('svg') || micButton.querySelector('img');
        if (iconElement && iconElement.tagName === 'svg') {
          iconElement.innerHTML = `
            <rect x="6" y="6" width="12" height="12" rx="2"/>
            <path d="M9 9h6"/>
          `;
        }
      }
    } else {
      micButton.classList.remove('active');
      micButton.title = 'Click to start listening';
      
      // Change back to original icon (only if using SVG microphone icon)
      if (this.config.icon.type === 'microphone') {
        const iconElement = micButton.querySelector('svg');
        if (iconElement) {
          iconElement.innerHTML = `
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          `;
        }
      }
    }
  }

  async getSignedUrl() {
    // If getSessionUrl is not provided, construct URL directly from agentId and appId
    if (!this.config.getSessionUrl) {
      if (!this.config.agentId) {
        throw new Error('agentId is required');
      }
      
      // Build WebSocket URL directly
      const baseUrl = this.config.websocketUrl || 'wss://speech.talktopc.com/ws/conv';
      const params = new URLSearchParams();
      params.append('agentId', this.config.agentId);
      
      if (this.config.appId) {
        params.append('appId', this.config.appId);
      }
      
      // Add demo flag if in development
      if (this.config.demo !== false) {
        params.append('demo', 'true');
      }
      
      return `${baseUrl}?${params.toString()}`;
    }
    
    // Handle getSessionUrl as string (backend URL)
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
    
    // Handle getSessionUrl as function
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
      throw new Error('getSessionUrl must be a string (backend URL), a function, or omitted (for direct connection with agentId/appId)');
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
    // Status update handler (can be overridden by users)
  }

  // Public API methods
  updateConfig(newConfig) {
    // Deep merge nested objects
    const mergedConfig = { ...this.config };
    
    // Deep merge panel config if it exists
    if (newConfig.panel) {
      mergedConfig.panel = { ...this.config.panel, ...newConfig.panel };
      // Deep merge micButtonHint if it exists
      if (newConfig.panel.micButtonHint) {
        mergedConfig.panel.micButtonHint = {
          ...this.config.panel?.micButtonHint,
          ...newConfig.panel.micButtonHint
        };
      }
    }
    
    // Merge other configs (shallow merge is fine for these)
    if (newConfig.button) {
      mergedConfig.button = { ...this.config.button, ...newConfig.button };
    }
    if (newConfig.header) {
      mergedConfig.header = { ...this.config.header, ...newConfig.header };
    }
    if (newConfig.icon) {
      mergedConfig.icon = { ...this.config.icon, ...newConfig.icon };
    }
    if (newConfig.messages) {
      mergedConfig.messages = { ...this.config.messages, ...newConfig.messages };
    }
    
    // Merge direction property
    if (newConfig.direction !== undefined) {
      mergedConfig.direction = newConfig.direction;
    }
    
    // Merge any other top-level properties
    Object.keys(newConfig).forEach(key => {
      if (!['panel', 'button', 'header', 'icon', 'messages', 'direction'].includes(key)) {
        mergedConfig[key] = newConfig[key];
      }
    });
    
    this.config = this.mergeWithDefaults(mergedConfig);
    // Recreate widget with new config
    const existingWidget = document.getElementById('agent-widget');
    if (existingWidget) {
      existingWidget.remove();
    }
    this.createWidget();
  }

  destroy() {
    const widget = document.getElementById('agent-widget');
    if (widget) {
      widget.remove();
    }
    if (this.sdk) {
      this.sdk.disconnect();
    }
  }
}
