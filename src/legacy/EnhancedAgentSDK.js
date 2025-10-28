/**
 * Enhanced AgentWidget with extensive customization options
 * Supports custom icons, flexible positioning, and many other configuration options
 */

export class EnhancedAgentWidget {
  constructor(config = {}) {
    // Merge user config with defaults
    this.config = this.mergeWithDefaults(config);
    this.sdk = new AgentSDK();
    this.isOpen = false;
    this.isActive = false;
    
    this.setupEventHandlers();
    this.createWidget();
  }

  mergeWithDefaults(userConfig) {
    return {
      // Required
      agentId: userConfig.agentId,
      getSessionUrl: userConfig.getSessionUrl,
      
      // Icon/Image Configuration
      icon: {
        type: userConfig.icon?.type || 'microphone', // 'microphone', 'custom', 'emoji', 'text'
        customImage: userConfig.icon?.customImage || null, // URL to custom image
        emoji: userConfig.icon?.emoji || '🎤', // Emoji to use
        text: userConfig.icon?.text || 'AI', // Text to display
        size: userConfig.icon?.size || 'medium', // 'small', 'medium', 'large', 'xl'
        ...userConfig.icon
      },
      
      // Positioning Configuration
      position: {
        vertical: userConfig.position?.vertical || 'bottom', // 'top', 'bottom', 'center'
        horizontal: userConfig.position?.horizontal || 'right', // 'left', 'right', 'center'
        offset: userConfig.position?.offset || { x: 20, y: 20 }, // Custom offset in pixels
        ...userConfig.position
      },
      
      // Button Configuration
      button: {
        size: userConfig.button?.size || 'medium', // 'small', 'medium', 'large', 'xl'
        shape: userConfig.button?.shape || 'circle', // 'circle', 'square', 'rounded'
        primaryColor: userConfig.button?.primaryColor || '#4F46E5',
        hoverColor: userConfig.button?.hoverColor || '#7C3AED',
        activeColor: userConfig.button?.activeColor || '#EF4444',
        shadow: userConfig.button?.shadow || true,
        shadowColor: userConfig.button?.shadowColor || 'rgba(0,0,0,0.15)',
        ...userConfig.button
      },
      
      // Panel Configuration
      panel: {
        width: userConfig.panel?.width || 350,
        height: userConfig.panel?.height || 500,
        borderRadius: userConfig.panel?.borderRadius || 12,
        backgroundColor: userConfig.panel?.backgroundColor || 'rgba(255,255,255,0.95)',
        backdropFilter: userConfig.panel?.backdropFilter || 'blur(10px)',
        border: userConfig.panel?.border || '1px solid rgba(0,0,0,0.1)',
        ...userConfig.panel
      },
      
      // Header Configuration
      header: {
        title: userConfig.header?.title || 'Voice Assistant',
        showTitle: userConfig.header?.showTitle !== false,
        backgroundColor: userConfig.header?.backgroundColor || null, // Uses button primaryColor if null
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
      primaryColor: userConfig.primaryColor || '#4F46E5',
      position: userConfig.position || 'bottom-right'
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
    widget.id = 'enhanced-agent-widget';
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
    const messages = this.config.messages;
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
      
      <button id="enhanced-agent-button" 
              aria-label="${this.config.accessibility.ariaLabel}"
              aria-description="${this.config.accessibility.ariaDescription}">
        ${iconHTML}
      </button>
      
      <div id="enhanced-agent-panel">
        ${header.showTitle ? `
          <div id="enhanced-agent-header">
            <h3 style="margin: 0; color: ${header.textColor};">${header.title}</h3>
            ${header.showCloseButton ? '<button id="enhanced-agent-close">&times;</button>' : ''}
          </div>
        ` : ''}
        
        <div id="enhanced-agent-messages"></div>
        
        <div id="enhanced-agent-controls">
          <button id="enhanced-agent-mic-button" 
                  aria-label="Start/Stop Voice Recording">
            ${iconHTML}
          </button>
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

    return `
      #enhanced-agent-widget {
        position: fixed;
        ${positionStyles}
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      #enhanced-agent-button {
        width: ${buttonSize}px;
        height: ${buttonSize}px;
        border-radius: ${btn.shape === 'circle' ? '50%' : btn.shape === 'square' ? '0' : '12px'};
        background: ${btn.primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all ${anim.duration}s ease;
        ${btn.shadow ? `box-shadow: 0 4px 12px ${btn.shadowColor};` : ''}
      }
      
      ${anim.enableHover ? `
        #enhanced-agent-button:hover {
          background: ${btn.hoverColor};
          transform: scale(1.05);
          ${btn.shadow ? `box-shadow: 0 8px 20px ${btn.shadowColor};` : ''}
        }
      ` : ''}
      
      #enhanced-agent-panel {
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
      
      #enhanced-agent-panel.open {
        display: flex;
        ${anim.enableSlide ? 'transform: translateY(0); opacity: 1;' : ''}
      }
      
      #enhanced-agent-header {
        background: ${header.backgroundColor || btn.primaryColor};
        color: ${header.textColor};
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: ${panel.borderRadius}px ${panel.borderRadius}px 0 0;
      }
      
      #enhanced-agent-close {
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
      }
      
      #enhanced-agent-messages {
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
      
      #enhanced-agent-controls {
        padding: 16px;
        border-top: 1px solid #E5E7EB;
        display: flex;
        justify-content: center;
      }
      
      #enhanced-agent-mic-button {
        width: ${buttonSize}px;
        height: ${buttonSize}px;
        border-radius: ${btn.shape === 'circle' ? '50%' : btn.shape === 'square' ? '0' : '12px'};
        border: none;
        background: ${btn.primaryColor};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all ${anim.duration}s ease;
      }
      
      #enhanced-agent-mic-button.active {
        background: ${btn.activeColor};
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
    document.getElementById('enhanced-agent-button').onclick = () => this.togglePanel();
    
    const closeBtn = document.getElementById('enhanced-agent-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.togglePanel();
    }
    
    document.getElementById('enhanced-agent-mic-button').onclick = () => this.toggleVoice();
    
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
    const panel = document.getElementById('enhanced-agent-panel');
    panel.classList.toggle('open');
  }

  async toggleVoice() {
    if (!this.isActive) {
      try {
        const signedUrl = await this.getSignedUrl();
        await this.sdk.connect(signedUrl);
        await this.sdk.startListening();
        this.isActive = true;
        document.getElementById('enhanced-agent-mic-button').classList.add('active');
        this.addMessage('system', 'Listening...');
      } catch (error) {
        console.error('Failed to start:', error);
        this.showError(error.message);
      }
    } else {
      this.sdk.stopListening();
      this.sdk.disconnect();
      this.isActive = false;
      document.getElementById('enhanced-agent-mic-button').classList.remove('active');
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
    const messages = document.getElementById('enhanced-agent-messages');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  showAgentThinking() {
    const messages = document.getElementById('enhanced-agent-messages');
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
    const messages = document.getElementById('enhanced-agent-messages');
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    messages.appendChild(error);
  }

  updateStatus(status) {
    console.log('Enhanced Widget status:', status);
  }

  // Public API methods
  updateConfig(newConfig) {
    this.config = this.mergeWithDefaults({ ...this.config, ...newConfig });
    // Recreate widget with new config
    const existingWidget = document.getElementById('enhanced-agent-widget');
    if (existingWidget) {
      existingWidget.remove();
    }
    this.createWidget();
  }

  destroy() {
    const widget = document.getElementById('enhanced-agent-widget');
    if (widget) {
      widget.remove();
    }
    if (this.sdk) {
      this.sdk.disconnect();
    }
  }
}

// Export for use
export default EnhancedAgentWidget;
