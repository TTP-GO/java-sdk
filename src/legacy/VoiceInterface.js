/**
 * VoiceInterface - Handles voice call UI and functionality
 * Part of the unified TTPChatWidget
 * Optimized for Wix iframe embedding
 */

import { AgentSDK } from '../index.js';

export class VoiceInterface {
  constructor(config) {
    this.config = config;
    this.audioStream = null;
    this.callStartTime = null;
    this.callTimerInterval = null;
    this.sdk = null;
    this.isActive = false;
    
    // Initialize AgentSDK for voice connection
    this.sdk = new AgentSDK({
      agentId: config.agentId,
      appId: config.appId,
      getSessionUrl: config.getSessionUrl,
      websocketUrl: config.websocketUrl,
      variables: config.variables || {},
      language: config.language || 'en'
    });
    
    // Setup SDK event handlers
    this.setupSDKEventHandlers();
  }
  
  /**
   * Setup event handlers for AgentSDK
   */
  setupSDKEventHandlers() {
    // Handle transcript updates
    this.sdk.onTranscript = (text) => {
      this.updateTranscript(text);
    };
    
    // Handle agent speaking state
    this.sdk.onAgentSpeaking = (isStart) => {
      const avatar = document.getElementById('voiceAvatarActive');
      if (avatar) {
        if (isStart) {
          avatar.classList.add('speaking');
        } else {
          avatar.classList.remove('speaking');
        }
      }
    };
    
    // Handle errors
    this.sdk.onError = (error) => {
      console.error('❌ Voice SDK Error:', error);
      // Check if it's a domain error
      if (error && (error.message === 'DOMAIN_NOT_WHITELISTED' || 
          (error.message && error.message.includes('Domain not whitelisted')))) {
        this.showDomainError();
      } else {
        this.showError(error.message || error);
      }
    };
  }

  /**
   * Helper function to get translated text
   */
  t(key) {
    const lang = this.config.language || 'en';
    const translations = this.config.translations?.[lang] || this.config.translations?.en || {};
    return translations[key] || key;
  }

  getTooltip(key) {
    const tooltip = this.config.tooltips?.[key];
    if (tooltip !== null && tooltip !== undefined) return tooltip;
    // Use translations for default tooltips
    const defaults = {
      mute: this.t('mute'),
      speaker: this.t('speaker'),
      endCall: this.t('endCall')
    };
    return defaults[key] || '';
  }

  /**
   * Generate HTML for voice interface
   */
  generateHTML() {
    return `<div class="voice-interface" id="voiceInterface">
      <!-- Before Call State -->
      <div id="voiceIdleState">
        <div class="voice-avatar" id="voiceAvatar">🤖</div>
        <div class="voice-status">
          <div class="voice-status-title">${this.t('clickToStartCall')}</div>
          <div class="voice-status-subtitle">${this.t('realTimeVoice')}</div>
        </div>
        <button class="start-call-btn" id="startCallBtn">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
          </svg>
          <span>${this.t('startCall')}</span>
        </button>
      </div>
      <!-- During Call State -->
      <div id="voiceActiveState" style="display: none;">
        <div class="voice-avatar-active" id="voiceAvatarActive">
          <div class="voice-rings">
            <div class="voice-ring"></div>
            <div class="voice-ring"></div>
            <div class="voice-ring"></div>
          </div>
          🤖
        </div>
        <div class="voice-status">
          <div class="voice-status-title" id="voiceStatusTitleActive">${this.t('listening')}</div>
          <div class="voice-status-subtitle" id="voiceStatusSubtitleActive">${this.t('speakFreely')}</div>
        </div>
        <div class="voice-transcript">
          <div class="transcript-label">${this.t('liveTranscript')}</div>
          <div class="transcript-text empty" id="transcriptText">
            ${this.t('transcriptWillAppear')}
          </div>
        </div>
        <div class="voice-controls">
          <button class="voice-control-btn secondary" id="muteBtn" title="${this.getTooltip('mute')}">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mute-icon">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
              <line x1="2" y1="2" x2="22" y2="22" class="mute-cross" style="display: none; stroke: #ef4444; stroke-width: 3.5;"/>
            </svg>
          </button>
          <button class="voice-control-btn primary active" id="endCallBtn" title="${this.getTooltip('endCall')}">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="#ef4444">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
            <div class="voice-timer" id="voiceTimer">00:00</div>
          </button>
          <button class="voice-control-btn secondary" id="speakerBtn" title="${this.getTooltip('speaker')}">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
        </div>
      </div>
    </div>`;
  }

  /**
   * Generate CSS for voice interface - Optimized for small heights
   */
  generateCSS() {
    const avatarBg = this.config.avatarBackgroundColor || '#667eea';
    const avatarActiveBg = this.config.avatarActiveBackgroundColor || this.config.avatarBackgroundColor || '#667eea';
    const statusTitleColor = this.config.statusTitleColor || '#1e293b';
    const statusSubtitleColor = this.config.statusSubtitleColor || '#64748b';
    const startCallBtnColor = this.config.startCallButtonColor || '#667eea';
    const startCallBtnTextColor = this.config.startCallButtonTextColor || '#FFFFFF';
    const transcriptBg = this.config.transcriptBackgroundColor || '#FFFFFF';
    const transcriptTextColor = this.config.transcriptTextColor || '#1e293b';
    const transcriptLabelColor = this.config.transcriptLabelColor || '#94a3b8';
    const controlBtnColor = this.config.controlButtonColor || '#FFFFFF';
    const controlBtnSecondaryColor = this.config.controlButtonSecondaryColor || '#64748b';
    const endCallBtnColor = this.config.endCallButtonColor || '#ef4444';
    
    return `
      /* Voice Interface Styles - Ultra-compact for Wix iframes */
      .voice-interface { 
        display: none; 
        flex: 1; 
        flex-direction: column;
        align-items: center; 
        justify-content: center; 
        padding: 6px 10px 6px 10px; 
        background: linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%);
        overflow: hidden;
        min-height: 0;
        height: 100%;
        width: 100%;
        box-sizing: border-box;
      }
      .voice-interface.active { display: flex; }
      
      /* Voice States - Better scaling gaps */
      #voiceIdleState,
      #voiceActiveState {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        height: 100%;
        min-height: 0;
        justify-content: center;
        overflow: hidden;
        flex: 1;
        box-sizing: border-box;
        gap: clamp(6px, 1.5vh, 12px);
      }
      
      #voiceActiveState[style*="display: none"] {
        display: none !important;
      }
      
      /* Voice Avatar - Scales better from small to large */
      .voice-avatar,
      .voice-avatar-active {
        width: clamp(80px, 18vh, 160px);
        height: clamp(80px, 18vh, 160px);
        aspect-ratio: 1;
        border-radius: 50%;
        background: linear-gradient(135deg, ${avatarBg} 0%, ${avatarActiveBg} 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(40px, 9vh, 80px);
        margin: 0;
        box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
        flex-shrink: 1;
        position: relative;
      }
      
      .voice-avatar-active {
        animation: avatarPulse 2s ease-in-out infinite;
      }
      
      @keyframes avatarPulse {
        0%, 100% { 
          transform: scale(1);
        }
        50% { 
          transform: scale(1.05);
        }
      }
      
      .voice-avatar-active.speaking {
        animation: avatarSpeak 0.5s ease-in-out infinite;
      }
      
      @keyframes avatarSpeak {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }
      
      /* Voice Rings Animation */
      .voice-rings {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }
      
      .voice-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border: 2px solid rgba(102, 126, 234, 0.3);
        border-radius: 50%;
        opacity: 0;
        animation: ringExpand 2s ease-out infinite;
      }
      
      .voice-ring:nth-child(2) { animation-delay: 0.5s; }
      .voice-ring:nth-child(3) { animation-delay: 1s; }
      
      @keyframes ringExpand {
        0% {
          width: 100%;
          height: 100%;
          opacity: 0.6;
        }
        100% {
          width: 160%;
          height: 160%;
          opacity: 0;
        }
      }
      
      /* Voice Status - Scales with container */
      .voice-status {
        text-align: center;
        margin: 0;
        flex-shrink: 1;
        min-height: 0;
      }
      
      .voice-status-title {
        font-size: clamp(12px, 3vh, 20px);
        font-weight: 600;
        color: ${statusTitleColor};
        margin-bottom: clamp(2px, 0.5vh, 4px);
        line-height: 1.2;
      }
      
      .voice-status-subtitle {
        font-size: clamp(10px, 2vh, 14px);
        color: ${statusSubtitleColor};
        line-height: 1.2;
      }
      
      /* Start Call Button - Scales with container */
      .start-call-btn {
        margin: 0;
        width: min(280px, 70vw);
        height: clamp(48px, 8vh, 64px);
        border-radius: clamp(24px, 4vh, 32px);
        border: none;
        background: ${startCallBtnColor};
        color: ${startCallBtnTextColor};
        font-size: clamp(14px, 2.5vh, 18px);
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(8px, 1.5vh, 12px);
        box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        flex-shrink: 0;
      }
      
      .start-call-btn svg {
        width: clamp(22px, 4vh, 32px);
        height: clamp(22px, 4vh, 32px);
      }
      
      .start-call-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(102, 126, 234, 0.5);
      }
      
      .start-call-btn:active {
        transform: translateY(-1px);
      }
      
      /* Voice Transcript - Scales with container */
      .voice-transcript {
        background: ${transcriptBg};
        padding: clamp(6px, 1.5vh, 12px);
        border-radius: 10px;
        width: min(360px, calc(100% - 40px));
        margin: 0;
        min-height: clamp(45px, 10vh, 80px);
        max-height: clamp(70px, 16vh, 110px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        flex-shrink: 1;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      
      .transcript-label {
        font-size: clamp(8px, 1.4vh, 11px);
        color: ${transcriptLabelColor};
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-bottom: clamp(3px, 0.6vh, 6px);
        flex-shrink: 0;
        word-wrap: break-word;
      }
      
      .transcript-text {
        font-size: clamp(11px, 2vh, 15px);
        color: ${transcriptTextColor};
        line-height: 1.4;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      
      .transcript-text.empty {
        color: #cbd5e1;
        font-style: italic;
      }
      
      /* Voice Controls - Scales with container */
      .voice-controls {
        display: flex;
        gap: clamp(8px, 1.8vh, 14px);
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin: 0;
        padding-top: clamp(5px, 1.2vh, 10px);
      }
      
      .voice-control-btn {
        width: clamp(48px, 9vh, 72px);
        height: clamp(48px, 9vh, 72px);
        aspect-ratio: 1;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        position: relative;
        flex-shrink: 0;
      }
      
      .voice-control-btn svg {
        width: 48%;
        height: 48%;
      }
      
      .voice-control-btn.primary {
        width: clamp(54px, 10vh, 80px);
        height: clamp(54px, 10vh, 80px);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 6px 18px rgba(102, 126, 234, 0.4);
      }
      
      .voice-control-btn.primary:hover {
        transform: scale(1.05);
      }
      
      .voice-control-btn.primary.active {
        background: white;
        animation: recordingPulse 1.5s ease-in-out infinite;
      }
      
      @keyframes recordingPulse {
        0%, 100% { 
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
        }
        50% { 
          box-shadow: 0 6px 24px rgba(239, 68, 68, 0.7);
        }
      }
      
      .voice-control-btn.secondary {
        background: ${controlBtnColor};
        color: ${controlBtnSecondaryColor};
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
      }
      
      .voice-control-btn.secondary:hover {
        background: #f8fafc;
        transform: scale(1.05);
      }
      
      .voice-control-btn.secondary.muted {
        background: #f3f4f6;
      }
      
      .voice-control-btn.secondary.muted .mute-icon {
        stroke: #9ca3af !important;
      }
      
      .voice-timer {
        position: absolute;
        bottom: clamp(-18px, -3vh, -24px);
        font-size: clamp(9px, 1.6vh, 12px);
        color: #64748b;
        font-weight: 500;
        white-space: nowrap;
      }
      
      /* Mobile optimization */
      @media (max-width: 768px) {
        .voice-interface {
          padding: 6px 10px;
        }
      }
      
      @media (max-width: 480px) {
        .voice-interface {
          padding: 5px 8px;
        }
      }
    `;
  }

  /**
   * Setup event handlers for voice interface
   */
  setupEventHandlers(callbacks) {
    const startCallBtn = document.getElementById('startCallBtn');
    const endCallBtn = document.getElementById('endCallBtn');
    const muteBtn = document.getElementById('muteBtn');
    const speakerBtn = document.getElementById('speakerBtn');
    
    if (startCallBtn) {
      startCallBtn.onclick = () => this.startVoiceCall();
    }
    if (endCallBtn) {
      endCallBtn.onclick = () => this.endVoiceCall();
    }
    if (muteBtn) {
      muteBtn.onclick = () => this.toggleMute();
    }
    if (speakerBtn) {
      speakerBtn.onclick = () => this.toggleSpeaker();
    }
    
    // Adjust sizes when the interface first loads - with retries
    const tryAdjustSizes = (attempt = 0) => {
      const voiceInterface = document.getElementById('voiceInterface');
      if (voiceInterface && voiceInterface.classList.contains('active')) {
        console.log('✅ Interface is active, adjusting sizes (attempt', attempt + 1, ')');
        this.adjustSizesForContainer();
      } else if (attempt < 10) {
        console.log('⏳ Interface not active yet, retrying... (attempt', attempt + 1, ')');
        setTimeout(() => tryAdjustSizes(attempt + 1), 200);
      } else {
        console.warn('⚠️ Interface never became active, adjusting sizes anyway');
        this.adjustSizesForContainer();
      }
    };
    
    setTimeout(() => tryAdjustSizes(), 100);
    
    // Also adjust on window resize
    window.addEventListener('resize', () => this.adjustSizesForContainer());
  }

  /**
   * Get signed URL for WebSocket connection
   */
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

  /**
   * Adjust UI sizes based on container height
   */
  adjustSizesForContainer() {
    const voiceInterface = document.getElementById('voiceInterface');
    if (!voiceInterface) {
      console.warn('⚠️ voiceInterface not found, skipping size adjustment');
      return;
    }
    
    const containerHeight = voiceInterface.clientHeight;
    const containerWidth = voiceInterface.clientWidth;
    
    console.log('📏 Container size:', containerHeight, 'x', containerWidth);
    
    // Check if we have visible elements
    const idleState = document.getElementById('voiceIdleState');
    const activeState = document.getElementById('voiceActiveState');
    const isIdleVisible = idleState && idleState.style.display !== 'none';
    const isActiveVisible = activeState && activeState.style.display !== 'none';
    
    console.log('👁️ Visible state - Idle:', isIdleVisible, 'Active:', isActiveVisible);
    
    // Calculate sizes ensuring everything fits
    // Total height = padding + gaps + avatar + status + transcript + controls
    const padding = 12; // top + bottom padding
    const gapsCount = 4; // gaps between elements
    
    let avatarSize, avatarFontSize, titleSize, subtitleSize, statusHeight, transcriptHeight, buttonSize, primaryButtonSize, gapSize;
    
    if (containerHeight <= 350) {
      // Very small - ultra compact
      gapSize = 5;
      avatarSize = 70;
      avatarFontSize = 35;
      titleSize = 11;
      subtitleSize = 9;
      statusHeight = 32;
      transcriptHeight = 45;
      buttonSize = 42;
      primaryButtonSize = 48;
    } else if (containerHeight <= 450) {
      // Small (400-420px) - BIGGER AVATAR for 500px Wix height
      gapSize = 7;
      avatarSize = 110;  // Increased from 85 to 110
      avatarFontSize = 55;  // Increased from 42 to 55
      titleSize = 15;  // Increased from 13
      subtitleSize = 11;  // Increased from 10
      statusHeight = 38;
      transcriptHeight = 58;  // Slightly reduced
      buttonSize = 52;  // Increased from 48
      primaryButtonSize = 58;  // Increased from 54
    } else if (containerHeight <= 550) {
      // Medium (500px) - BIGGER ROBOT
      gapSize = 8;
      avatarSize = 140;  // Increased from 110 to 140
      avatarFontSize = 70;  // Increased from 55 to 70
      titleSize = 16;  // Increased from 15
      subtitleSize = 12;  // Increased from 11
      statusHeight = 42;
      transcriptHeight = 68;  // Reduced slightly to compensate for bigger robot
      buttonSize = 56;  // Increased from 54
      primaryButtonSize = 64;  // Increased from 62
    } else if (containerHeight <= 700) {
      // Medium-Large (600px)
      gapSize = 10;
      avatarSize = 130;
      avatarFontSize = 65;
      titleSize = 18;
      subtitleSize = 13;
      statusHeight = 46;
      transcriptHeight = 85;
      buttonSize = 60;
      primaryButtonSize = 70;
    } else {
      // Large (700+)
      gapSize = 12;
      avatarSize = 150;
      avatarFontSize = 75;
      titleSize = 20;
      subtitleSize = 14;
      statusHeight = 50;
      transcriptHeight = 100;
      buttonSize = 66;
      primaryButtonSize = 76;
    }
    
    // Apply gap size
    const stateContainers = document.querySelectorAll('#voiceIdleState, #voiceActiveState');
    stateContainers.forEach(container => {
      container.style.gap = `${gapSize}px`;
    });
    
    // Apply sizes to avatar
    const avatars = document.querySelectorAll('.voice-avatar, .voice-avatar-active');
    console.log('🤖 Found', avatars.length, 'avatars, setting size to', avatarSize, 'px');
    avatars.forEach(avatar => {
      avatar.style.width = `${avatarSize}px`;
      avatar.style.height = `${avatarSize}px`;
      avatar.style.fontSize = `${avatarFontSize}px`;
    });
    
    // Apply sizes to status text
    const statusTitle = document.querySelectorAll('.voice-status-title');
    statusTitle.forEach(el => el.style.fontSize = `${titleSize}px`);
    
    const statusSubtitle = document.querySelectorAll('.voice-status-subtitle');
    statusSubtitle.forEach(el => el.style.fontSize = `${subtitleSize}px`);
    
    // Apply sizes to transcript
    const transcript = document.querySelector('.voice-transcript');
    if (transcript) {
      transcript.style.minHeight = `${transcriptHeight}px`;
      transcript.style.maxHeight = `${transcriptHeight}px`;
      transcript.style.height = `${transcriptHeight}px`;
      transcript.style.width = `min(360px, ${containerWidth - 40}px)`;  // Ensure it doesn't overflow
      transcript.style.boxSizing = 'border-box';
    }
    
    const transcriptLabel = document.querySelector('.transcript-label');
    if (transcriptLabel) {
      transcriptLabel.style.fontSize = `${Math.max(8, titleSize - 4)}px`;
    }
    
    const transcriptText = document.querySelector('.transcript-text');
    if (transcriptText) {
      transcriptText.style.fontSize = `${Math.max(10, titleSize - 2)}px`;
    }
    
    // Apply sizes to control buttons
    const secondaryButtons = document.querySelectorAll('.voice-control-btn.secondary');
    secondaryButtons.forEach(btn => {
      btn.style.width = `${buttonSize}px`;
      btn.style.height = `${buttonSize}px`;
      
      // Scale the SVG icon inside the button - much bigger!
      const svg = btn.querySelector('svg');
      if (svg) {
        const iconSize = buttonSize * 0.65; // Increased from 50% to 65%
        svg.style.setProperty('width', `${iconSize}px`, 'important');
        svg.style.setProperty('height', `${iconSize}px`, 'important');
        svg.style.setProperty('min-width', `${iconSize}px`, 'important');
        svg.style.setProperty('min-height', `${iconSize}px`, 'important');
      }
    });
    
    const primaryButton = document.querySelector('.voice-control-btn.primary');
    if (primaryButton) {
      primaryButton.style.width = `${primaryButtonSize}px`;
      primaryButton.style.height = `${primaryButtonSize}px`;
      
      // Scale the SVG icon inside the primary button - much bigger!
      const svg = primaryButton.querySelector('svg');
      if (svg) {
        const iconSize = primaryButtonSize * 0.70; // Increased from 55% to 70%
        svg.style.setProperty('width', `${iconSize}px`, 'important');
        svg.style.setProperty('height', `${iconSize}px`, 'important');
        svg.style.setProperty('min-width', `${iconSize}px`, 'important');
        svg.style.setProperty('min-height', `${iconSize}px`, 'important');
      }
    }
    
    // Apply to start call button
    const startCallBtn = document.querySelector('.start-call-btn');
    if (startCallBtn) {
      let btnHeight, btnFontSize;
      if (containerHeight <= 350) {
        btnHeight = 48;
        btnFontSize = 14;
      } else if (containerHeight <= 450) {
        btnHeight = 52;
        btnFontSize = 15;
      } else if (containerHeight <= 550) {
        btnHeight = 58;  // Bigger button at 500px
        btnFontSize = 17;
      } else if (containerHeight <= 700) {
        btnHeight = 62;
        btnFontSize = 18;
      } else {
        btnHeight = 64;
        btnFontSize = 18;
      }
      startCallBtn.style.height = `${btnHeight}px`;
      startCallBtn.style.fontSize = `${btnFontSize}px`;
      
      // Also adjust the SVG icon size in the button
      const btnIcon = startCallBtn.querySelector('svg');
      if (btnIcon) {
        const iconSize = Math.max(22, btnHeight * 0.5);
        btnIcon.style.width = `${iconSize}px`;
        btnIcon.style.height = `${iconSize}px`;
      }
    }
    
    console.log('✅ Sizes adjusted - Avatar:', avatarSize, 'Status:', statusHeight, 'Transcript:', transcriptHeight, 'Buttons:', buttonSize);
  }

  /**
   * Start voice call
   */
  async startVoiceCall() {
    if (this.isActive) {
      console.log('⚠️ Voice call already active');
      return;
    }
    
    console.log('🎤 Starting voice call...');
    
    try {
      // Hide idle state, show active state
      const idleState = document.getElementById('voiceIdleState');
      const activeState = document.getElementById('voiceActiveState');
      const voiceInterface = document.getElementById('voiceInterface');
      
      if (idleState) idleState.style.display = 'none';
      if (activeState) activeState.style.display = 'flex';
      
      // Adjust sizes based on container dimensions
      setTimeout(() => this.adjustSizesForContainer(), 50);
      
      // Prevent any scrolling when switching states
      if (voiceInterface) {
        voiceInterface.scrollTop = 0;
      }
      
      // Get signed URL and connect
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
        
        // Start timer
        this.callStartTime = Date.now();
        this.callTimerInterval = setInterval(() => {
          const elapsed = Date.now() - this.callStartTime;
          const minutes = Math.floor(elapsed / 60000);
          const seconds = Math.floor((elapsed % 60000) / 1000);
          const timerEl = document.getElementById('voiceTimer');
          if (timerEl) {
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
        }, 1000);
      } else {
        console.warn('⚠️ Connection not fully ready, but trying to start listening anyway...');
        await this.sdk.startListening();
        console.log('🎤 Started listening');
        
        this.isActive = true;
        
        // Start timer
        this.callStartTime = Date.now();
        this.callTimerInterval = setInterval(() => {
          const elapsed = Date.now() - this.callStartTime;
          const minutes = Math.floor(elapsed / 60000);
          const seconds = Math.floor((elapsed % 60000) / 1000);
          const timerEl = document.getElementById('voiceTimer');
          if (timerEl) {
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
        }, 1000);
      }
      
      console.log('✅ Voice call started successfully');
      
    } catch (error) {
      console.error('❌ Error starting voice call:', error);
      this.showError(error.message || error);
      
      // Reset UI state on error
      const idleState = document.getElementById('voiceIdleState');
      const activeState = document.getElementById('voiceActiveState');
      if (idleState) idleState.style.display = 'flex';
      if (activeState) activeState.style.display = 'none';
    }
  }

  /**
   * End voice call
   */
  endVoiceCall() {
    console.log('🔴 Ending voice call...');
    
    // Stop listening and disconnect
    if (this.sdk && this.isActive) {
      this.sdk.stopListening();
      this.sdk.disconnect();
      this.isActive = false;
    }
    
    // Stop audio stream (if any)
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    // Stop timer
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
    
    // Show idle state, hide active state
    const idleState = document.getElementById('voiceIdleState');
    const activeState = document.getElementById('voiceActiveState');
    
    if (idleState) idleState.style.display = 'flex';
    if (activeState) activeState.style.display = 'none';
    
    // Re-adjust sizes for idle state
    setTimeout(() => this.adjustSizesForContainer(), 50);
    
    // Reset transcript
    const transcriptEl = document.getElementById('transcriptText');
    if (transcriptEl) {
      transcriptEl.textContent = this.t('transcriptWillAppear');
      transcriptEl.classList.add('empty');
    }
    
    // Remove speaking state from avatar
    const avatar = document.getElementById('voiceAvatarActive');
    if (avatar) {
      avatar.classList.remove('speaking');
    }
    
    console.log('✅ Voice call ended');
  }
  
  /**
   * Update transcript text
   */
  updateTranscript(text) {
    const transcriptEl = document.getElementById('transcriptText');
    if (transcriptEl) {
      transcriptEl.textContent = text;
      transcriptEl.classList.remove('empty');
    }
  }
  
  /**
   * Show error message
   */
  showError(message) {
    const transcriptEl = document.getElementById('transcriptText');
    if (transcriptEl) {
      transcriptEl.textContent = `${this.t('error')}: ${message}`;
      transcriptEl.classList.remove('empty');
    }
  }
  
  /**
   * Show domain validation error
   */
  showDomainError() {
    const transcriptEl = document.getElementById('transcriptText');
    if (transcriptEl) {
      const title = this.t('domainNotValidated');
      const message = this.t('domainErrorMessage');
      transcriptEl.innerHTML = `<div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #991B1B;">${title}</div><div style="font-size: 14px; color: #991B1B; line-height: 1.5;">${message}</div>`;
      transcriptEl.classList.remove('empty');
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    if (!this.sdk || !this.isActive) {
      return;
    }
    
    // Access the audio recorder's media stream through VoiceSDK
    let audioTrack = null;
    if (this.sdk.voiceSDK && this.sdk.voiceSDK.audioRecorder && this.sdk.voiceSDK.audioRecorder.mediaStream) {
      audioTrack = this.sdk.voiceSDK.audioRecorder.mediaStream.getAudioTracks()[0];
    }
    
    // Fallback to stored audioStream if available
    if (!audioTrack && this.audioStream) {
      audioTrack = this.audioStream.getAudioTracks()[0];
    }
    
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      
      const muteBtn = document.getElementById('muteBtn');
      const muteIcon = muteBtn?.querySelector('.mute-icon');
      const muteCross = muteBtn?.querySelector('.mute-cross');
      
      if (muteBtn && muteIcon && muteCross) {
        if (!audioTrack.enabled) {
          // Muted state: gray color and show cross
          muteIcon.style.stroke = '#9ca3af'; // gray color
          muteCross.style.display = 'block';
          muteBtn.classList.add('muted');
        } else {
          // Unmuted state: normal color and hide cross
          muteIcon.style.stroke = '';
          muteCross.style.display = 'none';
          muteBtn.classList.remove('muted');
        }
      }
      
      console.log(audioTrack.enabled ? '🔊 Unmuted' : '🔇 Muted');
    } else {
      console.warn('⚠️ No audio track available for mute toggle');
    }
  }

  /**
   * Toggle speaker (placeholder)
   */
  toggleSpeaker() {
    // Speaker toggle logic (placeholder)
    console.log('🔊 Speaker toggle');
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // End call if active
    if (this.isActive) {
      this.endVoiceCall();
    }
    
    // Clean up voice call resources
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
    
    // Disconnect SDK
    if (this.sdk) {
      this.sdk.disconnect();
      this.sdk = null;
    }
  }
}