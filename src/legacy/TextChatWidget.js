/**
 * TextChatWidget - Pre-built UI widget for text chat using TextChatSDK
 * Similar to AgentWidget but designed for text-based chat
 */

import TextChatSDK from '../core/TextChatSDK.js';

export class TextChatWidget {
  constructor(config = {}) {
    // Merge user config with defaults (backward compatible with simple config)
    this.config = this.mergeWithDefaults(config);
    this.sdk = new TextChatSDK(this.config);
    this.isOpen = false;
    this.isActive = false;
    this.streamingEl = null;
    this.hasStartedStreaming = false;
    this.streamingTimer = null;
    
    this.setupEventHandlers();
    this.createWidget();
    
    // Start open if configured (immediately)
    if (this.config.behavior.startOpen || this.config.behavior.autoOpen) {
      const panel = document.getElementById('text-chat-panel');
      if (panel) {
        this.isOpen = true;
        panel.classList.add('open');
      }
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
      websocketUrl: userConfig.websocketUrl, // Optional - defaults to backend.talktopc.com/ws/conv (path may need adjustment)
      demo: userConfig.demo !== false, // Optional - defaults to true
      direction: userConfig.direction || 'ltr', // Optional - text direction: 'ltr' or 'rtl'
      
      // Icon/Image Configuration
      icon: {
        type: userConfig.icon?.type || 'chat', // 'chat', 'custom', 'emoji', 'text'
        customImage: userConfig.icon?.customImage || null,
        emoji: userConfig.icon?.emoji || '💬',
        text: userConfig.icon?.text || 'AI',
        size: userConfig.icon?.size || 'medium', // 'small', 'medium', 'large', 'xl'
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
        // Send button colors (inside panel) - similar to micButtonColor in voice widget
        sendButtonColor: userConfig.panel?.sendButtonColor || primaryColor,
        sendButtonHoverColor: userConfig.panel?.sendButtonHoverColor || '#7C3AED',
        sendButtonActiveColor: userConfig.panel?.sendButtonActiveColor || '#059669',
        sendButtonText: userConfig.panel?.sendButtonText || 'Send',
        sendButtonTextColor: userConfig.panel?.sendButtonTextColor || '#FFFFFF',
        sendButtonFontSize: userConfig.panel?.sendButtonFontSize || '14px',
        sendButtonFontWeight: userConfig.panel?.sendButtonFontWeight || '500',
        // Send button hint text (below button or near it, similar to micButtonHint)
        sendButtonHint: {
          text: userConfig.panel?.sendButtonHint?.text || '',
          color: userConfig.panel?.sendButtonHint?.color || '#6B7280',
          fontSize: userConfig.panel?.sendButtonHint?.fontSize || '12px',
          ...userConfig.panel?.sendButtonHint
        },
        // Input field configuration - comprehensive customization
        inputPlaceholder: userConfig.panel?.inputPlaceholder || 'Type your message...',
        inputBorderColor: userConfig.panel?.inputBorderColor || '#E5E7EB',
        inputFocusColor: userConfig.panel?.inputFocusColor || primaryColor,
        inputBackgroundColor: userConfig.panel?.inputBackgroundColor || '#FFFFFF',
        inputTextColor: userConfig.panel?.inputTextColor || '#1F2937',
        inputFontSize: userConfig.panel?.inputFontSize || '14px',
        inputBorderRadius: userConfig.panel?.inputBorderRadius || 8,
        inputPadding: userConfig.panel?.inputPadding || '12px',
        ...userConfig.panel
      },
      
      // Header Configuration (top of panel)
      header: {
        title: userConfig.header?.title || 'Chat Assistant',
        showTitle: userConfig.header?.showTitle !== false,
        backgroundColor: userConfig.header?.backgroundColor || userConfig.button?.backgroundColor || primaryColor,
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
        startOpen: userConfig.behavior?.startOpen || false,
        hidden: userConfig.behavior?.hidden || false,
        autoConnect: userConfig.behavior?.autoConnect || false,
        showWelcomeMessage: userConfig.behavior?.showWelcomeMessage !== false,
        welcomeMessage: userConfig.behavior?.welcomeMessage || 'Hello! How can I help you today?',
        // Voice selection landing (hidden by default)
        enableVoiceMode: userConfig.behavior?.enableVoiceMode || false,
        ...userConfig.behavior
      },
      
      // Accessibility Configuration
      accessibility: {
        ariaLabel: userConfig.accessibility?.ariaLabel || 'Chat Assistant',
        ariaDescription: userConfig.accessibility?.ariaDescription || 'Click to open chat assistant',
        keyboardNavigation: userConfig.accessibility?.keyboardNavigation !== false,
        ...userConfig.accessibility
      },
      
      // Custom CSS
      customStyles: userConfig.customStyles || '',
      
      // Variables for the agent
      variables: userConfig.variables || {},
      // TEST: allow forcing a conversationId for debugging
      forceConversationId: userConfig.forceConversationId,
      
      // Legacy support (for backward compatibility)
      primaryColor: primaryColor,
      // Keep position string for backward compatibility
      ...(typeof userConfig.position === 'string' ? { positionString: userConfig.position } : {})
    };
  }

  setupEventHandlers() {
    this.sdk.on('error', (error) => {
      this.showError(error.message || error);
      this.stopStreamingState();
    });

    this.sdk.on('chunk', (chunk) => {
      this.appendStreamingChunk(chunk);
    });

    this.sdk.on('done', ({ text }) => {
      this.finalizeStreaming(text);
    });
  }

  createWidget() {
    const widget = document.createElement('div');
    widget.id = 'text-chat-widget';
    widget.innerHTML = this.generateWidgetHTML();
    
    document.body.appendChild(widget);
    
    this.setupWidgetEvents();
    
    // Ensure initial open state if configured
    if (this.config.behavior.startOpen || this.config.behavior.autoOpen) {
      const panel = document.getElementById('text-chat-panel');
      if (panel) {
        this.isOpen = true;
        panel.classList.add('open');
      }
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

    const voiceEnabled = !!this.config.behavior.enableVoiceMode;

    return `
      <style>
        ${this.generateCSS(positionStyles, buttonSize, iconSize)}
        ${this.config.customStyles}
      </style>
      
      ${this.config.behavior.hidden ? '' : `
      <button id=\"text-chat-button\" 
              aria-label=\"${this.config.accessibility.ariaLabel}\"
              aria-description=\"${this.config.accessibility.ariaDescription}\">\n        ${iconHTML}\n      </button>
      `}
      
      <div id="text-chat-panel">
        <div class="widget-shell">
          <div class="panel-inner widget-container" style="direction: ${this.config.direction};">
          <div class="widget-header">
            <div>
              <div class="header-title">${header.title}</div>
              <div class="header-status">
                <span class="status-dot"></span>
                <span>${this.config.direction === 'rtl' ? 'מקוון' : 'Online'}</span>
              </div>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
              <button class="new-chat-btn header-icon" id="newChatBtn" title="Start new chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
              ${voiceEnabled ? '<button class="back-btn header-icon" id="backBtn">'+
                '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">'+
                '<path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'+
                '</svg></button>' : ''}
              ${header.showCloseButton ? '<button class="close-btn header-icon" id="text-chat-close">'+
                '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">'+
                '<path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'+
                '</svg></button>' : ''}
            </div>
          </div>

          ${voiceEnabled ? `
          <div class="landing-screen" id="landingScreen">
            <div class="landing-logo">🤖</div>
            <div class="landing-title">${this.config.direction === 'rtl' ? 'איך תרצה לתקשר?' : 'How would you like to communicate?'}</div>
            <div class="mode-selection">
              <div class="mode-card voice" id="mode-card-voice">
                <div class="mode-card-icon">🎤</div>
                <div class="mode-card-title">${this.config.direction === 'rtl' ? 'שיחה קולית' : 'Voice Call'}</div>
              </div>
              <div class="mode-card text" id="mode-card-text">
                <div class="mode-card-icon">💬</div>
                <div class="mode-card-title">${this.config.direction === 'rtl' ? "צ'אט טקסט" : 'Text Chat'}</div>
              </div>
            </div>
          </div>` : ''}

          <div class="voice-interface" id="voiceInterface">
            <div class="empty-voice">${this.config.direction === 'rtl' ? 'מצב קול placeholder' : 'Voice mode placeholder'}</div>
          </div>

          <div class="text-interface ${voiceEnabled ? '' : 'active'}" id="textInterface">
            <div class="messages-container" id="messagesContainer">
              <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-title">${this.config.direction === 'rtl' ? 'שלום! איך אפשר לעזור?' : 'Hello! How can I help?'}</div>
                <div class="empty-state-text">${this.config.direction === 'rtl' ? 'שלח הודעה או עבור למצב קולי לשיחה בזמן אמת' : 'Send a message to get started'}</div>
              </div>
              
            </div>
            <div class="input-container">
              ${this.config.direction === 'rtl' ? `
                <button class="send-button" id="sendButton" aria-label="Send message">➤</button>
                <div class="input-wrapper" style="flex:1;">
                  <textarea class="message-input" id="messageInput" placeholder="${panel.inputPlaceholder}" rows="1"></textarea>
                </div>
              ` : `
                <div class="input-wrapper" style="flex:1;">
                  <textarea class="message-input" id="messageInput" placeholder="${panel.inputPlaceholder}" rows="1"></textarea>
                </div>
                <button class="send-button" id="sendButton" aria-label="Send message">➤</button>
              `}
            </div>
          </div>
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
        return `<img src="${icon.customImage}" alt="Chat Assistant" style="width: ${size}px; height: ${size}px; object-fit: contain;" />`;
      
      case 'emoji':
        return `<span style="font-size: ${size}px; line-height: 1;">${icon.emoji}</span>`;
      
      case 'text':
        return `<span style="font-size: ${Math.floor(size * 0.6)}px; font-weight: bold; color: white;">${icon.text}</span>`;
      
      case 'chat':
      default:
        return `<svg viewBox="0 0 24 24" style="width: ${size}px; height: ${size}px; fill: white;">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
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
    const sendButtonColor = panel.sendButtonColor || btn.primaryColor; // Send button (similar to micButtonColor in voice widget)
    const sendButtonHoverColor = panel.sendButtonHoverColor || '#7C3AED'; // Send button hover
    const sendButtonActiveColor = panel.sendButtonActiveColor || '#059669'; // Send button active state

    return `
      #text-chat-widget {
        position: fixed;
        ${positionStyles}
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        will-change: transform;
      }
      
      #text-chat-button {
        width: ${buttonSize}px;
        height: ${buttonSize}px;
        border-radius: ${btn.shape === 'circle' ? '50%' : btn.shape === 'square' ? '0' : '12px'};
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all ${anim.duration}s ease;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        user-select: none;
        min-width: 44px;
        min-height: 44px;
      }
      
      @media (max-width: 768px) {
        #text-chat-button {
          min-width: 56px;
          min-height: 56px;
        }
        
        #text-chat-panel {
          width: calc(100vw - 20px) !important;
          max-width: ${panel.width}px;
          max-height: calc(100vh - 120px) !important;
          left: 10px !important;
          right: 10px !important;
        }
        
        #text-chat-input {
          font-size: 16px !important; /* Prevents iOS zoom on focus */
        }
        
        #text-chat-send {
          min-width: 60px;
          min-height: 44px;
        }
      }
      
      ${anim.enableHover ? `
        #text-chat-button:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
        }
      ` : ''}
      
      #text-chat-panel {
        display: none;
        position: fixed;
        bottom: calc(${buttonSize}px + 20px);
        ${this.config.position.horizontal === 'right' ? 'right: 20px;' : 'left: 20px;'}
        width: ${panel.width}px;
        max-width: calc(100vw - 40px);
        height: ${panel.height}px;
        max-height: calc(100vh - ${buttonSize}px - 40px);
        background: transparent;
        border-radius: ${panel.borderRadius}px;
        border: none;
        flex-direction: column;
        overflow: hidden;
        ${panel.backdropFilter ? `backdrop-filter: ${panel.backdropFilter};` : ''}
        ${anim.enableSlide ? `transition: all ${anim.duration}s ease;` : ''}
      }
      
      #text-chat-panel.open {
        display: flex;
        ${anim.enableSlide ? 'transform: translateY(0); opacity: 1;' : ''}
      }

      /* Shell for gradient border/background */
      .widget-shell { width: 100%; height: 100%; padding: 0; border-radius: ${panel.borderRadius}px; background: transparent; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; display: flex; flex-direction: column; }
      .panel-inner { width: 100%; height: 100%; background: #ffffff; border-radius: ${panel.borderRadius}px; overflow: hidden; display:flex; flex-direction: column; padding: 0; box-sizing: border-box; }

      /* New structure styles matching provided design */
      #text-chat-panel .widget-container {
        width: 100%; height: 100%; min-height: 0; background: #FFFFFF; overflow: hidden; display: flex; flex-direction: column; border-radius: ${panel.borderRadius}px;
      }
      #text-chat-panel .widget-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #FFFFFF;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top-left-radius: ${panel.borderRadius}px;
        border-top-right-radius: ${panel.borderRadius}px;
        flex-shrink: 0;
        min-height: 60px;
        box-sizing: border-box;
      }
      #text-chat-panel .header-title { font-size: 16px; font-weight: 600; }
      #text-chat-panel .header-status { display: flex; align-items: center; gap: 8px; font-size: 12px; opacity: 0.9; }
      #text-chat-panel .status-dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      #text-chat-panel .back-btn, #text-chat-panel .close-btn {
        background: rgba(255,255,255,0.2);
        border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      }
      #text-chat-panel .new-chat-btn { background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }

      /* Landing and mode selection (shown only if voice enabled) */
      .landing-screen { display: none; flex: 1; padding: 20px; background: linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%); align-items: center; justify-content: flex-start; flex-direction: column; gap: 16px; overflow-y: auto; min-height: 0; }
      .landing-screen.active { display: flex; }
      .landing-logo { font-size: 48px; }
      .landing-title { font-size: 20px; color: #1e293b; font-weight: 700; margin-bottom: 20px; }
      .mode-selection { display: flex; gap: 16px; width: 100%; justify-content: center; }
      .mode-card { flex: 1; max-width: 180px; background: #FFFFFF; border: 2px solid #E2E8F0; border-radius: 20px; padding: 20px 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: transform ${anim.duration}s ease, box-shadow ${anim.duration}s ease, border-color ${anim.duration}s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .mode-card:hover { transform: translateY(-6px); box-shadow: 0 12px 24px rgba(102, 126, 234, 0.2); border-color: ${headerColor}; }
      .mode-card-icon { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: ${headerColor}; color: #fff; font-size: 32px; }
      .mode-card-title { color: #111827; font-weight: 600; }

      .voice-interface { display: none; flex: 1; align-items: center; justify-content: center; padding: 20px; background: #F8FAFC; }
      .voice-interface.active { display: flex; }
      .empty-voice { color: #6B7280; font-size: 14px; }
      
      /* Messages container using new classes */
      #messagesContainer { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 20px; background: #f8fafc; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
      .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #64748b; text-align: center; padding: 20px; }
      .empty-state-icon { font-size: 48px; opacity: 0.3; }
      .empty-state-title { font-size: 20px; font-weight: 700; color: #334155; }
      .empty-state-text { font-size: 13px; max-width: 280px; }

      .text-interface { display: none; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
      .text-interface.active { display: flex; }
      
      .message { display: flex; gap: 8px; padding: 4px 0; max-width: 100%; align-items: center; }
      .message.edge-left { flex-direction: row; }
      .message.edge-right { flex-direction: row-reverse; }
      .message-bubble { padding: 12px; border-radius: ${messages.borderRadius}px; max-width: 80%; font-size: ${messages.fontSize}; color: ${messages.textColor}; word-wrap: break-word; text-align: ${this.config.direction === 'rtl' ? 'right' : 'left'}; }
      .message.user { background: ${messages.userBackgroundColor}; align-self: ${this.config.direction === 'rtl' ? 'flex-start' : 'flex-end'}; }
      .message.agent { background: ${messages.agentBackgroundColor}; align-self: ${this.config.direction === 'rtl' ? 'flex-end' : 'flex-start'}; }
      .message .message-bubble { text-align: ${this.config.direction === 'rtl' ? 'right' : 'left'}; }
      .message-avatar { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: inherit; font-size: 18px; line-height: 1; background: transparent; border: none; }
      .message-avatar.user { background: transparent; }
      .message-avatar.agent { background: transparent; }
      
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
      
      .input-container { padding: 10px 16px; background: white; border-top: 1px solid #E2E8F0; display: flex; gap: 10px; align-items: center; border-bottom-left-radius: ${panel.borderRadius}px; border-bottom-right-radius: ${panel.borderRadius}px; flex-shrink: 0; box-sizing: border-box; }
      .input-wrapper { flex: 1; display: flex; align-items: center; order: initial; }
      .message-input { width: 100%; padding: 0 14px; border: 2px solid #E5E7EB; border-radius: 20px; font-size: 14px; font-family: inherit; resize: none; height: 32px; transition: border-color ${anim.duration}s, box-shadow ${anim.duration}s; outline: none; background: #F9FAFB; color: ${panel.inputTextColor}; line-height: 32px; overflow-y: auto; }
      .message-input::placeholder { line-height: 32px; }
      .message-input:focus { border-color: #667eea; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
      .message-input::placeholder { color: #9CA3AF; }
      .send-button { width: 44px; height: 44px; border-radius: 50%; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; flex-shrink: 0; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); order: initial; }
      .send-button:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5); background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); }
      .send-button:active { transform: translateY(0px); box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4); }
      .send-button svg { width: 18px; height: 18px; display: block; pointer-events: none; }
      .send-button svg * { stroke: white !important; fill: none !important; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
      
      #text-chat-send-hint {
        text-align: center;
        line-height: 1.4;
      }
      
      .agent-thinking {
        font-style: italic;
        color: #6B7280;
      }

      /* Typing indicator */
      .typing-indicator { display: inline-flex; gap: 4px; align-items: center; padding: 4px 2px; }
      .typing-dot { width: 6px; height: 6px; background: #9CA3AF; border-radius: 50%; opacity: 0.6; animation: typingBlink 1.2s infinite ease-in-out; }
      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typingBlink { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-3px); opacity: 1; } }
    `;
  }

  setupWidgetEvents() {
    const openBtn = document.getElementById('text-chat-button');
    if (openBtn) {
      openBtn.onclick = () => this.togglePanel();
    }
    
    const closeBtn = document.getElementById('text-chat-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.togglePanel();
    }
    
    // Voice selection events (if enabled)
    const backBtn = document.getElementById('backBtn');
    const landing = document.getElementById('landingScreen');
    const voiceCard = document.getElementById('mode-card-voice');
    const textCard = document.getElementById('mode-card-text');
    const textInterface = document.getElementById('textInterface');
    const voiceInterface = document.getElementById('voiceInterface');
    if (this.config.behavior.enableVoiceMode) {
      if (backBtn) backBtn.onclick = () => this.showLanding();
      if (voiceCard) voiceCard.onclick = () => this.showVoice();
      if (textCard) textCard.onclick = () => this.showText();
      // Initial state: landing visible when voice enabled
      if (landing) landing.classList.add('active');
      if (textInterface) textInterface.classList.remove('active');
      if (voiceInterface) voiceInterface.classList.remove('active');
    }
    
    const sendButton = document.getElementById('sendButton');
    const inputField = document.getElementById('messageInput');
    const newChatBtn = document.getElementById('newChatBtn');
    
    if (sendButton) sendButton.onclick = () => this.sendMessage();
    if (newChatBtn) newChatBtn.onclick = () => this.startNewChat();
    
    // Send on Enter key
    if (inputField) {
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
    
    // Keyboard navigation
    if (this.config.accessibility.keyboardNavigation) {
      this.setupKeyboardNavigation();
    }
  }

  startNewChat() {
    try { localStorage.removeItem('ttp_text_chat_conversation_id'); } catch (_) {}
    if (this.sdk) {
      this.sdk.config.conversationId = null;
    }
    // Reset UI messages to empty state
    const container = document.getElementById('messagesContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">${this.config.direction === 'rtl' ? 'שלום! איך אפשר לעזור?' : 'Hello! How can I help?'}</div>
          <div class="empty-state-text">${this.config.direction === 'rtl' ? 'שלח הודעה כדי להתחיל' : 'Send a message to get started'}</div>
        </div>
        <div class="message assistant">
          <div class="message-avatar">🤖</div>
          <div class="typing-indicator" id="typingIndicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>`;
    }
    // Focus message input
    const input = document.getElementById('messageInput');
    if (input) input.focus();
  }

  showLanding() {
    if (!this.config.behavior.enableVoiceMode) return;
    const landing = document.getElementById('landingScreen');
    const textInterface = document.getElementById('textInterface');
    const voiceInterface = document.getElementById('voiceInterface');
    if (landing) landing.classList.add('active');
    if (textInterface) textInterface.classList.remove('active');
    if (voiceInterface) voiceInterface.classList.remove('active');
  }

  showText() {
    const landing = document.getElementById('landingScreen');
    const textInterface = document.getElementById('textInterface');
    const voiceInterface = document.getElementById('voiceInterface');
    if (landing) landing.classList.remove('active');
    if (textInterface) textInterface.classList.add('active');
    if (voiceInterface) voiceInterface.classList.remove('active');
    // Focus input soon after render
    setTimeout(() => {
      const input = document.getElementById('messageInput');
      if (input) input.focus();
    }, 50);
  }

  showVoice() {
    const landing = document.getElementById('landingScreen');
    const textInterface = document.getElementById('textInterface');
    const voiceInterface = document.getElementById('voiceInterface');
    if (landing) landing.classList.remove('active');
    if (textInterface) textInterface.classList.remove('active');
    if (voiceInterface) voiceInterface.classList.add('active');
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
    const panel = document.getElementById('text-chat-panel');
    panel.classList.toggle('open');
    
    // Focus input when opening
    if (this.isOpen) {
      setTimeout(() => {
    const input = document.getElementById('messageInput');
        if (input) input.focus();
      }, 100);
    }
    
    // Auto-connect if enabled
    if (this.isOpen && !this.isActive && this.config.behavior.autoConnect) {
      this.startChat();
    }
  }

  async startChat() {
    // No-op with single-shot design; connection happens per message
    this.isActive = true;
    this.updateSendButtonState();
  }

  async sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) {
      return;
    }
    
    // Ensure active state
    if (!this.isActive) {
      await this.startChat();
    }
    
    // Add user message to UI
    this.addMessage('user', text);
    
    // Clear input
    input.value = '';
    
    // Prepare streaming bubble and send via SDK
    try {
      this.beginStreaming();
      await this.sdk.sendMessage(text);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      this.showError(error.message);
      this.stopStreamingState();
    }
  }

  updateSendButtonState() {
    const sendButton = document.getElementById('sendButton');
    if (!sendButton) return;
    
    sendButton.disabled = !this.isActive; // single-shot; enable when ready for input
  }

  async getSignedUrl() {
    // If getSessionUrl is not provided, construct URL directly from agentId and appId
    if (!this.config.getSessionUrl) {
      if (!this.config.agentId) {
        throw new Error('agentId is required');
      }
      
      // Build WebSocket URL directly
      // Default uses backend.talktopc.com for text chat (path may need adjustment)
      const baseUrl = this.config.websocketUrl || 'wss://backend.talktopc.com/ws/conv';
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
    const messages = document.getElementById('messagesContainer');
    const message = document.createElement('div');
    const edgeClass = (this.config.direction === 'rtl')
      ? (type === 'user' ? 'edge-left' : 'edge-right')
      : (type === 'user' ? 'edge-right' : 'edge-left');
    message.className = `message ${type} ${edgeClass}`;

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${type}`;
    avatar.textContent = type === 'user' ? '👤' : '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;

    // Order is controlled by edgeClass via flex-direction
    message.appendChild(avatar);
    message.appendChild(bubble);
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  beginStreaming() {
    const messages = document.getElementById('messagesContainer');
    // Clean any previous indicator
    this.stopStreamingState();
    const el = document.createElement('div');
    const edgeClass = (this.config.direction === 'rtl') ? 'edge-right' : 'edge-left';
    el.className = `message agent ${edgeClass}`;
    el.id = 'agent-streaming';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar agent';
    avatar.textContent = '🤖';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    // show typing dots until first chunk
    bubble.innerHTML = '<span class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';

    el.appendChild(avatar);
    el.appendChild(bubble);
    messages.appendChild(el);
    this.streamingEl = bubble;
    this.hasStartedStreaming = false;
    messages.scrollTop = messages.scrollHeight;
  }

  appendStreamingChunk(chunk) {
    if (!this.streamingEl) return;
    if (!this.hasStartedStreaming) {
      // remove typing indicator on first content
      this.streamingEl.textContent = '';
      this.hasStartedStreaming = true;
    }
    this.streamingEl.textContent += chunk;
    const messages = document.getElementById('messagesContainer');
    messages.scrollTop = messages.scrollHeight;
  }

  finalizeStreaming(fullText) {
    if (this.streamingEl) {
      // If no chunks arrived, simulate typing char-by-char
      if (!this.hasStartedStreaming && fullText && fullText.length > 0) {
        this.streamingEl.textContent = '';
        this.hasStartedStreaming = true;
        const text = fullText;
        let i = 0;
        const messages = document.getElementById('messagesContainer');
        clearInterval(this.streamingTimer);
        this.streamingTimer = setInterval(() => {
          if (!this.streamingEl) { clearInterval(this.streamingTimer); return; }
          this.streamingEl.textContent += text.charAt(i);
          if (messages) messages.scrollTop = messages.scrollHeight;
          i++;
          if (i >= text.length) {
            clearInterval(this.streamingTimer);
            const container = document.getElementById('agent-streaming');
            if (container) container.id = '';
            this.streamingEl = null;
            this.updateSendButtonState();
          }
        }, 20);
        return;
      }
      // Normal path: chunks already appended; just ensure final text and cleanup
      this.streamingEl.textContent = fullText || this.streamingEl.textContent;
      const container = document.getElementById('agent-streaming');
      if (container) container.id = '';
      this.streamingEl = null;
    }
    this.updateSendButtonState();
  }

  stopStreamingState() {
    const existing = document.getElementById('agent-streaming');
    if (existing) existing.remove();
    this.streamingEl = null;
    this.hasStartedStreaming = false;
    clearInterval(this.streamingTimer);
  }

  showError(message) {
    const messages = document.getElementById('messagesContainer');
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    messages.appendChild(error);
    messages.scrollTop = messages.scrollHeight;
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
      // Deep merge sendButtonHint if it exists (similar to micButtonHint in voice widget)
      if (newConfig.panel.sendButtonHint) {
        mergedConfig.panel.sendButtonHint = {
          ...this.config.panel?.sendButtonHint,
          ...newConfig.panel.sendButtonHint
        };
      }
      // Deep merge inputConfig if it exists (for future extensibility)
      if (newConfig.panel.inputConfig) {
        mergedConfig.panel.inputConfig = {
          ...this.config.panel?.inputConfig,
          ...newConfig.panel.inputConfig
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
    const existingWidget = document.getElementById('text-chat-widget');
    if (existingWidget) {
      existingWidget.remove();
    }
    this.createWidget();
  }

  destroy() {
    const widget = document.getElementById('text-chat-widget');
    if (widget) {
      widget.remove();
    }
    if (this.sdk) {
      this.sdk.destroy();
    }
  }
}

