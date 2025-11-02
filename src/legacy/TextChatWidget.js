/**
 * TextChatWidget - Pre-built UI widget for text chat using TextChatSDK
 * Similar to AgentWidget but designed for text-based chat
 */

import TextChatSDK from '../core/TextChatSDK.js';
import { VoiceInterface } from './VoiceInterface.js';
import { TextInterface } from './TextInterface.js';
import widgetTranslations from './widget-translations.js';

export class TextChatWidget {
  constructor(config = {}) {
    // Merge user config with defaults (backward compatible with simple config)
    this.config = this.mergeWithDefaults(config);
    this.sdk = new TextChatSDK(this.config);
    this.isOpen = false;
    this.isActive = false;
    this.translations = widgetTranslations;
    
    // Initialize interfaces with proper config
    // Voice interface needs voice config merged with main config
    const voiceConfig = {
      ...this.config,
      ...this.config.voice,
      language: this.config.voice?.language || this.config.language || 'en',
      websocketUrl: this.config.voice?.websocketUrl || this.config.websocketUrl || 'wss://speech.talktopc.com/ws/conv',
      translations: this.translations
    };
    this.voiceInterface = new VoiceInterface(voiceConfig);
    // Text interface needs text config merged with main config
    const textConfig = {
      ...this.config,
      ...this.config.text,
      translations: this.translations
    };
    this.textInterface = new TextInterface(textConfig, this.sdk);
    
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

    // Handle legacy primaryColor - default to purple
    const primaryColor = userConfig.primaryColor || userConfig.button?.primaryColor || userConfig.button?.backgroundColor || '#7C3AED';
    
    // Calculate headerColor for use in landing config (needed before landing config is defined)
    const headerColor = userConfig.header?.backgroundColor || userConfig.button?.backgroundColor || primaryColor;

    return {
      // Required (agentId is required, appId is optional)
      agentId: userConfig.agentId,
      appId: userConfig.appId,
      getSessionUrl: userConfig.getSessionUrl, // Optional - will auto-construct URL if omitted (for voice)
      websocketUrl: userConfig.websocketUrl, // Optional - defaults to backend.talktopc.com/ws/conv (for text), speech.talktopc.com/ws/conv (for voice)
      demo: userConfig.demo !== false, // Optional - defaults to true
      direction: userConfig.direction || 'ltr', // Optional - text direction: 'ltr' or 'rtl'
      language: userConfig.language || 'en', // Optional - language for voice (defaults to 'en')
      
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
      
      // Panel Configuration (common to both voice and text)
      panel: {
        width: userConfig.panel?.width || 350,
        height: userConfig.panel?.height || 500,
        borderRadius: userConfig.panel?.borderRadius || 12,
        backgroundColor: userConfig.panel?.backgroundColor || '#FFFFFF',
        backdropFilter: userConfig.panel?.backdropFilter || null,
        border: userConfig.panel?.border || '1px solid rgba(0,0,0,0.1)',
        ...userConfig.panel
      },
      
      // Voice-specific Configuration
      voice: {
        // Voice button colors (inside panel)
        micButtonColor: userConfig.voice?.micButtonColor || userConfig.panel?.micButtonColor || primaryColor,
        micButtonActiveColor: userConfig.voice?.micButtonActiveColor || userConfig.panel?.micButtonActiveColor || '#EF4444',
        // Voice button hint text (below button)
        micButtonHint: {
          text: userConfig.voice?.micButtonHint?.text || userConfig.panel?.micButtonHint?.text || 'Click the button to start voice conversation',
          color: userConfig.voice?.micButtonHint?.color || userConfig.panel?.micButtonHint?.color || '#6B7280',
          fontSize: userConfig.voice?.micButtonHint?.fontSize || userConfig.panel?.micButtonHint?.fontSize || '12px',
          ...userConfig.voice?.micButtonHint,
          ...userConfig.panel?.micButtonHint
        },
        // Voice interface colors
        avatarBackgroundColor: userConfig.voice?.avatarBackgroundColor || '#667eea',
        avatarActiveBackgroundColor: userConfig.voice?.avatarActiveBackgroundColor || '#667eea',
        statusTitleColor: userConfig.voice?.statusTitleColor || '#1e293b',
        statusSubtitleColor: userConfig.voice?.statusSubtitleColor || '#64748b',
        startCallButtonColor: userConfig.voice?.startCallButtonColor || '#667eea',
        startCallButtonTextColor: userConfig.voice?.startCallButtonTextColor || '#FFFFFF',
        transcriptBackgroundColor: userConfig.voice?.transcriptBackgroundColor || '#FFFFFF',
        transcriptTextColor: userConfig.voice?.transcriptTextColor || '#1e293b',
        transcriptLabelColor: userConfig.voice?.transcriptLabelColor || '#94a3b8',
        controlButtonColor: userConfig.voice?.controlButtonColor || '#FFFFFF',
        controlButtonSecondaryColor: userConfig.voice?.controlButtonSecondaryColor || '#64748b',
        endCallButtonColor: userConfig.voice?.endCallButtonColor || '#ef4444',
        // Voice language setting
        language: userConfig.voice?.language || userConfig.language || 'en',
        // Voice websocket URL (can override global websocketUrl)
        websocketUrl: userConfig.voice?.websocketUrl || userConfig.websocketUrl,
        ...userConfig.voice
      },
      
      // Text-specific Configuration
      text: {
        // Send button colors (inside panel)
        sendButtonColor: userConfig.text?.sendButtonColor || userConfig.panel?.sendButtonColor || '#7C3AED', // Purple default
        sendButtonHoverColor: userConfig.text?.sendButtonHoverColor || userConfig.panel?.sendButtonHoverColor || '#6D28D9',
        sendButtonActiveColor: userConfig.text?.sendButtonActiveColor || userConfig.panel?.sendButtonActiveColor || '#6D28D9', // Purple darker for active
        sendButtonText: userConfig.text?.sendButtonText || userConfig.panel?.sendButtonText || '➤',
        sendButtonTextColor: userConfig.text?.sendButtonTextColor || userConfig.panel?.sendButtonTextColor || '#FFFFFF',
        sendButtonFontSize: userConfig.text?.sendButtonFontSize || userConfig.panel?.sendButtonFontSize || '18px',
        sendButtonFontWeight: userConfig.text?.sendButtonFontWeight || userConfig.panel?.sendButtonFontWeight || '500',
        // Send button hint text (below button or near it)
        sendButtonHint: {
          text: userConfig.text?.sendButtonHint?.text || userConfig.panel?.sendButtonHint?.text || '',
          color: userConfig.text?.sendButtonHint?.color || userConfig.panel?.sendButtonHint?.color || '#6B7280',
          fontSize: userConfig.text?.sendButtonHint?.fontSize || userConfig.panel?.sendButtonHint?.fontSize || '12px',
          ...userConfig.text?.sendButtonHint,
          ...userConfig.panel?.sendButtonHint
        },
        // Input field configuration
        inputPlaceholder: userConfig.text?.inputPlaceholder || userConfig.panel?.inputPlaceholder || 'Type your message...',
        inputBorderColor: userConfig.text?.inputBorderColor || userConfig.panel?.inputBorderColor || '#E5E7EB',
        inputFocusColor: userConfig.text?.inputFocusColor || userConfig.panel?.inputFocusColor || '#7C3AED', // Purple default
        inputBackgroundColor: userConfig.text?.inputBackgroundColor || userConfig.panel?.inputBackgroundColor || '#FFFFFF',
        inputTextColor: userConfig.text?.inputTextColor || userConfig.panel?.inputTextColor || '#1F2937',
        inputFontSize: userConfig.text?.inputFontSize || userConfig.panel?.inputFontSize || '14px',
        inputBorderRadius: userConfig.text?.inputBorderRadius || userConfig.panel?.inputBorderRadius || 20,
        inputPadding: userConfig.text?.inputPadding || userConfig.panel?.inputPadding || '6px 14px',
        ...userConfig.text
      },
      
      // Landing Screen Configuration (only for unified mode)
      landing: {
        backgroundColor: userConfig.landing?.backgroundColor || 'linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%)',
        logo: userConfig.landing?.logo || '🤖',
        title: userConfig.landing?.title || null, // null means use default translated text
        titleColor: userConfig.landing?.titleColor || '#1e293b',
        modeCardBackgroundColor: userConfig.landing?.modeCardBackgroundColor || '#FFFFFF',
        modeCardBorderColor: userConfig.landing?.modeCardBorderColor || '#E2E8F0',
        modeCardHoverBorderColor: userConfig.landing?.modeCardHoverBorderColor || headerColor,
        modeCardIconBackgroundColor: userConfig.landing?.modeCardIconBackgroundColor || headerColor,
        modeCardTitleColor: userConfig.landing?.modeCardTitleColor || '#111827',
        voiceCardIcon: userConfig.landing?.voiceCardIcon || '🎤',
        textCardIcon: userConfig.landing?.textCardIcon || '💬',
        ...userConfig.landing
      },
      
      // Header Configuration (top of panel)
      header: {
        title: userConfig.header?.title || 'Chat Assistant',
        showTitle: userConfig.header?.showTitle !== false,
        backgroundColor: userConfig.header?.backgroundColor || userConfig.button?.backgroundColor || '#7C3AED', // Default purple
        textColor: userConfig.header?.textColor || '#FFFFFF',
        showCloseButton: userConfig.header?.showCloseButton !== false,
        ...userConfig.header
      },
      
      // Tooltips Configuration
      tooltips: {
        newChat: userConfig.tooltips?.newChat || null, // null means use default based on direction
        back: userConfig.tooltips?.back || null,
        close: userConfig.tooltips?.close || null,
        mute: userConfig.tooltips?.mute || null,
        speaker: userConfig.tooltips?.speaker || null,
        endCall: userConfig.tooltips?.endCall || null,
        ...userConfig.tooltips
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
        // Voice selection landing (enabled by default)
        enableVoiceMode: userConfig.behavior?.enableVoiceMode !== undefined ? userConfig.behavior.enableVoiceMode : true,
        // Widget mode: 'unified' (both voice and text with landing screen), 'voice-only' (only voice), 'text-only' (only text)
        mode: userConfig.behavior?.mode || 'unified',
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
      this.textInterface.showError(error.message || error);
      this.textInterface.stopStreamingState();
    });

    this.sdk.on('chunk', (chunk) => {
      this.textInterface.appendStreamingChunk(chunk);
    });

    this.sdk.on('done', ({ text }) => {
      this.textInterface.finalizeStreaming(text);
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

    const widgetMode = this.config.behavior.mode || 'unified';
    const showLanding = widgetMode === 'unified';
    const showVoice = widgetMode === 'unified' || widgetMode === 'voice-only';
    const showText = widgetMode === 'unified' || widgetMode === 'text-only';
    const voiceEnabled = showVoice;
    
    // Helper function to get translated text
    const t = (key) => {
      const lang = this.config.language || 'en';
      const translations = this.translations[lang] || this.translations.en;
      return translations[key] || key;
    };
    
    // Helper function to get tooltip text
    const getTooltip = (key) => {
      const tooltip = this.config.tooltips?.[key];
      if (tooltip !== null && tooltip !== undefined) return tooltip;
      // Use translations for default tooltips
      const defaults = {
        newChat: t('newChat'),
        back: t('back'),
        close: t('close'),
        mute: t('mute'),
        speaker: t('speaker'),
        endCall: t('endCall')
      };
      return defaults[key] || '';
    };

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
          <div class="widget-header" style="background: ${header.backgroundColor}; color: ${header.textColor};">
            <div>
              ${header.showTitle ? `<div class="header-title">${header.title}</div>` : ''}
              <div class="header-status">
                <span class="status-dot"></span>
                <span>${t('online')}</span>
              </div>
            </div>
            
            <div style="display: flex; gap: 12px; align-items: center;">
              <!-- New Chat Button (hide on landing screen, show otherwise) -->
              <button class="header-icon new-chat-btn" id="newChatBtn" title="${getTooltip('newChat')}" style="${showLanding ? 'display: none;' : ''}">
                <span style="font-size: 18px; font-weight: bold;">+</span>
              </button>
              
              <!-- Back Button (only show in unified mode) -->
              ${widgetMode === 'unified' ? `<button class="header-icon back-btn" id="backBtn" title="${getTooltip('back')}" style="display: none;">
                <span style="font-size: 16px;">‹</span>
              </button>` : ''}
              
              <!-- Close Button -->
              ${header.showCloseButton ? '<button class="header-icon close-btn" id="closeBtn" title="' + getTooltip('close') + '">'+
                '<span style="font-size: 18px; font-weight: bold;">×</span>'+
                '</button>' : ''}
            </div>
          </div>

          ${showLanding ? `
          <div class="landing-screen" id="landingScreen">
            <div class="landing-logo">🤖</div>
            <div class="landing-title">${t('landingTitle')}</div>
            <div class="mode-selection">
              ${showVoice ? `<div class="mode-card voice" id="mode-card-voice">
                <div class="mode-card-icon">🎤</div>
                <div class="mode-card-title">${t('voiceCall')}</div>
              </div>` : ''}
              ${showText ? `<div class="mode-card text" id="mode-card-text">
                <div class="mode-card-icon">💬</div>
                <div class="mode-card-title">${t('textChat')}</div>
              </div>` : ''}
            </div>
          </div>` : ''}

          ${showVoice ? this.voiceInterface.generateHTML() : ''}
          ${showText ? this.textInterface.generateHTML() : ''}
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
    const sendButtonColor = panel.sendButtonColor || btn.primaryColor || '#7C3AED'; // Send button (similar to micButtonColor in voice widget) - Purple default
    const sendButtonHoverColor = panel.sendButtonHoverColor || '#7C3AED'; // Send button hover
    const sendButtonActiveColor = panel.sendButtonActiveColor || '#6D28D9'; // Send button active state - Purple darker
    
    // Determine which interfaces to show
    const widgetMode = this.config.behavior.mode || 'unified';
    const showVoice = widgetMode === 'unified' || widgetMode === 'voice-only';
    const showText = widgetMode === 'unified' || widgetMode === 'text-only';

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
      /* Header icon buttons */
      .header-icon {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        flex-shrink: 0;
        font-size: 16px;
        padding: 0;
        box-sizing: border-box;
      }
      
      .header-icon:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .header-icon svg {
        pointer-events: none;
        stroke: white;
        fill: none;
      }
      
      .back-btn.visible {
        display: flex !important;
      }

      /* Landing and mode selection (shown only if voice enabled) */
      .landing-screen { 
        display: none; 
        flex: 1; 
        padding: 20px; 
        background: ${this.config.landing?.backgroundColor || 'linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%)'}; 
        align-items: center; 
        justify-content: flex-start; 
        flex-direction: column; 
        gap: 16px; 
        overflow-y: auto; 
        min-height: 0; 
      }
      .landing-screen.active { display: flex; }
      .landing-logo { font-size: 48px; }
      .landing-title { 
        font-size: 20px; 
        color: ${this.config.landing?.titleColor || '#1e293b'}; 
        font-weight: 700; 
        margin-bottom: 20px; 
        text-align: center;
        width: 100%;
      }
      .mode-selection { display: flex; gap: 16px; width: 100%; justify-content: center; }
      .mode-card { 
        flex: 1; 
        max-width: 180px; 
        background: ${this.config.landing?.modeCardBackgroundColor || '#FFFFFF'}; 
        border: 2px solid ${this.config.landing?.modeCardBorderColor || '#E2E8F0'}; 
        border-radius: 20px; 
        padding: 20px 12px; 
        cursor: pointer; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        gap: 8px; 
        transition: transform ${anim.duration}s ease, box-shadow ${anim.duration}s ease, border-color ${anim.duration}s ease; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
      }
      .mode-card:hover { 
        transform: translateY(-6px); 
        box-shadow: 0 12px 24px rgba(102, 126, 234, 0.2); 
        border-color: ${this.config.landing?.modeCardHoverBorderColor || headerColor}; 
      }
      .mode-card-icon { 
        width: 60px; 
        height: 60px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        border-radius: 50%; 
        background: ${this.config.landing?.modeCardIconBackgroundColor || headerColor}; 
        color: #fff; 
        font-size: 32px; 
      }
      .mode-card-title { 
        color: ${this.config.landing?.modeCardTitleColor || '#111827'}; 
        font-weight: 600; 
        text-align: center;
        width: 100%;
      }

      ${showVoice ? this.voiceInterface.generateCSS() : ''}
      ${showText ? this.textInterface.generateCSS() : ''}
      
      #text-chat-send-hint {
        text-align: center;
        line-height: 1.4;
      }
      
      .agent-thinking {
        font-style: italic;
        color: #6B7280;
      }
    `;
  }

  setupWidgetEvents() {
    const openBtn = document.getElementById('text-chat-button');
    if (openBtn) {
      openBtn.onclick = () => this.togglePanel();
    }
    
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
      closeBtn.onclick = () => this.togglePanel();
    }
    
    // Voice selection events (based on widget mode)
    const widgetMode = this.config.behavior.mode || 'unified';
    const showLanding = widgetMode === 'unified';
    const showVoice = widgetMode === 'unified' || widgetMode === 'voice-only';
    const showText = widgetMode === 'unified' || widgetMode === 'text-only';
    
    const backBtn = document.getElementById('backBtn');
    const landing = document.getElementById('landingScreen');
    const voiceCard = document.getElementById('mode-card-voice');
    const textCard = document.getElementById('mode-card-text');
    const textInterface = document.getElementById('textInterface');
    const voiceInterface = document.getElementById('voiceInterface');
    
    // Setup back button handler
    if (backBtn) {
      backBtn.onclick = () => this.showLanding();
    }
    
    if (showLanding) {
      if (voiceCard) voiceCard.onclick = () => this.showVoice();
      if (textCard) textCard.onclick = () => this.showText();
      // Initial state: landing visible in unified mode
      if (landing) landing.classList.add('active');
      if (textInterface) textInterface.classList.remove('active');
      if (voiceInterface) voiceInterface.classList.remove('active');
      // Hide back button on landing screen (only exists in unified mode)
      if (backBtn && widgetMode === 'unified') backBtn.classList.remove('visible');
    } else if (widgetMode === 'voice-only') {
      // Voice-only mode: show voice interface directly
      if (voiceInterface) voiceInterface.classList.add('active');
      if (textInterface) textInterface.classList.remove('active');
      if (landing) landing.classList.remove('active');
      // Back button doesn't exist in voice-only mode (only in unified)
    } else if (widgetMode === 'text-only') {
      // Text-only mode: show text interface directly
      if (textInterface) textInterface.classList.add('active');
      if (voiceInterface) voiceInterface.classList.remove('active');
      if (landing) landing.classList.remove('active');
      // Back button doesn't exist in text-only mode (only in unified)
    }
    
    // Setup interface event handlers
    if (showVoice) {
      this.voiceInterface.setupEventHandlers();
    }
    if (showText) {
      this.textInterface.setupEventHandlers();
    }
    
    // Setup header button handlers
    const newChatBtn = document.getElementById('newChatBtn');
    
    if (newChatBtn) {
      newChatBtn.onclick = () => this.textInterface.startNewChat();
      // Hide new chat button on landing screen initially
      if (showLanding) {
        newChatBtn.style.display = 'none';
      }
    }
    
    // Keyboard navigation
    if (this.config.accessibility.keyboardNavigation) {
      this.setupKeyboardNavigation();
    }
  }

  startNewChat() {
    this.textInterface.startNewChat();
  }

  showLanding() {
    const widgetMode = this.config.behavior.mode || 'unified';
    if (widgetMode !== 'unified') return; // Only show landing in unified mode
    const landing = document.getElementById('landingScreen');
    const textInterface = document.getElementById('textInterface');
    const voiceInterface = document.getElementById('voiceInterface');
    const backBtn = document.getElementById('backBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    if (landing) landing.classList.add('active');
    if (textInterface) textInterface.classList.remove('active');
    if (voiceInterface) voiceInterface.classList.remove('active');
    // Hide back button on landing screen
    if (backBtn) backBtn.classList.remove('visible');
    // Hide new chat button on landing screen
    if (newChatBtn) newChatBtn.style.display = 'none';
  }

  showText() {
    const landing = document.getElementById('landingScreen');
    const voiceInterface = document.getElementById('voiceInterface');
    const backBtn = document.getElementById('backBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    if (landing) landing.classList.remove('active');
    if (voiceInterface) voiceInterface.classList.remove('active');
    this.textInterface.show();
    // Show back button when not on landing (only in unified mode)
    const widgetMode = this.config.behavior.mode || 'unified';
    if (backBtn && widgetMode === 'unified') backBtn.classList.add('visible');
    // Show new chat button when not on landing
    if (newChatBtn) newChatBtn.style.display = '';
  }

  showVoice() {
    const landing = document.getElementById('landingScreen');
    const textInterface = document.getElementById('textInterface');
    const voiceInterface = document.getElementById('voiceInterface');
    const backBtn = document.getElementById('backBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    if (landing) landing.classList.remove('active');
    if (textInterface) textInterface.classList.remove('active');
    if (voiceInterface) voiceInterface.classList.add('active');
    // Show back button when not on landing (only in unified mode)
    const widgetMode = this.config.behavior.mode || 'unified';
    if (backBtn && widgetMode === 'unified') backBtn.classList.add('visible');
    // Show new chat button when not on landing
    if (newChatBtn) newChatBtn.style.display = '';
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
    this.textInterface.setActive(true);
  }

  async sendMessage() {
    await this.textInterface.sendMessage();
  }

  updateSendButtonState() {
    this.textInterface.updateSendButtonState();
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

  // Delegated to TextInterface
  addMessage(type, text) {
    this.textInterface.addMessage(type, text);
  }

  beginStreaming() {
    this.textInterface.beginStreaming();
  }

  appendStreamingChunk(chunk) {
    this.textInterface.appendStreamingChunk(chunk);
  }

  finalizeStreaming(fullText) {
    this.textInterface.finalizeStreaming(fullText);
  }

  stopStreamingState() {
    this.textInterface.stopStreamingState();
  }

  showError(message) {
    this.textInterface.showError(message);
  }

  updateStatus(status) {
    // Status update handler (can be overridden by users)
  }

  // Public API methods
  updateConfig(newConfig) {
    // Deep merge nested objects
    const mergedConfig = { ...this.config };
    
    // Deep merge panel config if it exists (common config)
    if (newConfig.panel) {
      mergedConfig.panel = { ...this.config.panel, ...newConfig.panel };
    }
    
    // Deep merge voice config if it exists
    if (newConfig.voice) {
      mergedConfig.voice = { ...this.config.voice, ...newConfig.voice };
      // Deep merge micButtonHint if it exists
      if (newConfig.voice.micButtonHint) {
        mergedConfig.voice.micButtonHint = {
          ...this.config.voice?.micButtonHint,
          ...newConfig.voice.micButtonHint
        };
      }
    }
    
    // Deep merge text config if it exists
    if (newConfig.text) {
      mergedConfig.text = { ...this.config.text, ...newConfig.text };
      // Deep merge sendButtonHint if it exists
      if (newConfig.text.sendButtonHint) {
        mergedConfig.text.sendButtonHint = {
          ...this.config.text?.sendButtonHint,
          ...newConfig.text.sendButtonHint
        };
      }
    }
    
    // Update language if provided - must be before mergeWithDefaults
    if (newConfig.language !== undefined) {
      mergedConfig.language = newConfig.language;
    }
    
    // Update direction if language changed to RTL language
    if (newConfig.language !== undefined) {
      const rtlLanguages = ['he', 'ar'];
      if (rtlLanguages.includes(newConfig.language)) {
        mergedConfig.direction = 'rtl';
      } else if (newConfig.direction === undefined) {
        mergedConfig.direction = 'ltr';
      }
    }
    
    // Update translations if provided
    if (newConfig.translations) {
      mergedConfig.translations = newConfig.translations;
      this.translations = newConfig.translations;
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
    if (newConfig.animation) {
      mergedConfig.animation = { ...this.config.animation, ...newConfig.animation };
    }
    if (newConfig.behavior) {
      mergedConfig.behavior = { ...this.config.behavior, ...newConfig.behavior };
    }
    if (newConfig.accessibility) {
      mergedConfig.accessibility = { ...this.config.accessibility, ...newConfig.accessibility };
    }
    if (newConfig.tooltips) {
      mergedConfig.tooltips = { ...this.config.tooltips, ...newConfig.tooltips };
    }
    if (newConfig.landing) {
      mergedConfig.landing = { ...this.config.landing, ...newConfig.landing };
    }
    
    // Merge direction property (only if not set by language change above)
    if (newConfig.direction !== undefined && mergedConfig.direction === undefined) {
      mergedConfig.direction = newConfig.direction;
    }
    
    // Merge primaryColor if provided
    if (newConfig.primaryColor !== undefined) {
      mergedConfig.primaryColor = newConfig.primaryColor;
    }
    
    // Merge any other top-level properties
    Object.keys(newConfig).forEach(key => {
      if (!['panel', 'button', 'header', 'icon', 'messages', 'direction', 'voice', 'text', 'animation', 'behavior', 'accessibility', 'language', 'tooltips', 'landing', 'primaryColor'].includes(key)) {
        mergedConfig[key] = newConfig[key];
      }
    });
    
    // Store current language before merge to detect changes
    const oldLanguage = this.config?.language || 'en';
    
    this.config = this.mergeWithDefaults(mergedConfig);
    
    // Recreate interfaces with new config (after mergeWithDefaults, so language is current)
    // Ensure language is correctly passed - use the merged config value
    const currentLanguage = this.config.language || 'en';
    const voiceConfig = {
      ...this.config,
      ...this.config.voice,
      language: currentLanguage, // Use the current language from merged config
      websocketUrl: this.config.voice?.websocketUrl || this.config.websocketUrl || 'wss://speech.talktopc.com/ws/conv',
      translations: this.translations
    };
    this.voiceInterface = new VoiceInterface(voiceConfig);
    const textConfig = {
      ...this.config,
      ...this.config.text,
      language: currentLanguage, // Ensure language is set from merged config
      translations: this.translations
    };
    this.textInterface = new TextInterface(textConfig, this.sdk);
    
    // Recreate widget with new config
    const existingWidget = document.getElementById('text-chat-widget');
    if (existingWidget) {
      existingWidget.remove();
    }
    this.createWidget();
    
    // Update input attributes in case widget was recreated
    if (this.textInterface && this.textInterface.updateInputAttributes) {
      this.textInterface.updateInputAttributes();
    }
  }

  destroy() {
    const widget = document.getElementById('text-chat-widget');
    if (widget) {
      widget.remove();
    }
    if (this.sdk) {
      this.sdk.destroy();
    }
    // Clean up interface resources
    if (this.voiceInterface) {
      this.voiceInterface.destroy();
    }
  }

  // Delegated to VoiceInterface
  async startVoiceCall() {
    await this.voiceInterface.startVoiceCall();
  }

  endVoiceCall() {
    this.voiceInterface.endVoiceCall();
  }

  toggleMute() {
    this.voiceInterface.toggleMute();
  }

  toggleSpeaker() {
    this.voiceInterface.toggleSpeaker();
  }
}

