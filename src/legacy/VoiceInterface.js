/**
 * VoiceInterface - Handles voice call UI and functionality
 * Part of the unified TextChatWidget
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
      this.showError(error.message || error);
    };
  }

  /**
   * Helper function to get tooltip text
   */
  // Helper function to get translated text
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
      <div id="voiceIdleState" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        <div class="voice-avatar" id="voiceAvatar">
          🤖
        </div>
        <div class="voice-status">
          <div class="voice-status-title">${this.t('clickToStartCall')}</div>
          <div class="voice-status-subtitle">${this.t('realTimeVoice')}</div>
        </div>
        <!-- BIG START CALL BUTTON -->
        <button class="start-call-btn" id="startCallBtn">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
          </svg>
          <span>${this.t('startCall')}</span>
        </button>
      </div>
      <!-- During Call State -->
      <div id="voiceActiveState" style="display: none; flex-direction: column; align-items: center; width: 100%; height: 100%; justify-content: flex-start; overflow: hidden; padding-top: 10px;">
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
   * Generate CSS for voice interface
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
      /* Voice Interface Styles */
      .voice-interface { 
        display: none; 
        flex: 1; 
        flex-direction: column;
        align-items: center; 
        justify-content: flex-start; 
        padding: 10px 20px 20px 20px; 
        background: linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%);
        overflow: hidden;
        min-height: 0;
      }
      .voice-interface.active { display: flex; }
      
      /* Voice Avatar (idle state) */
      .voice-avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${avatarBg} 0%, ${avatarActiveBg} 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 56px;
        margin-top: 10px;
        margin-bottom: 16px;
        box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
        flex-shrink: 0;
      }
      
      /* Voice Avatar (active state with animations) */
      .voice-avatar-active {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${avatarBg} 0%, ${avatarActiveBg} 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 56px;
        margin-top: 10px;
        margin-bottom: 16px;
        position: relative;
        box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
        animation: avatarPulse 2s ease-in-out infinite;
        flex-shrink: 0;
      }
      
      @keyframes avatarPulse {
        0%, 100% { 
          transform: scale(1);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
        }
        50% { 
          transform: scale(1.05);
          box-shadow: 0 15px 50px rgba(102, 126, 234, 0.5);
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
      
      /* Voice Status */
      .voice-status {
        text-align: center;
        margin-bottom: 10px;
        flex-shrink: 0;
      }
      
      .voice-status-title {
        font-size: 18px;
        font-weight: 600;
        color: ${statusTitleColor};
        margin-bottom: 4px;
      }
      
      .voice-status-subtitle {
        font-size: 12px;
        color: ${statusSubtitleColor};
      }
      
      /* Start Call Button */
      .start-call-btn {
        margin-top: 20px;
        width: 200px;
        height: 56px;
        border-radius: 28px;
        border: none;
        background: ${startCallBtnColor};
        color: ${startCallBtnTextColor};
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        flex-shrink: 0;
      }
      
      .start-call-btn:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 40px rgba(102, 126, 234, 0.5);
      }
      
      .start-call-btn:active {
        transform: translateY(-2px);
      }
      
      /* Voice Transcript */
      .voice-transcript {
        background: ${transcriptBg};
        padding: 12px;
        border-radius: 12px;
        max-width: 300px;
        width: 100%;
        margin-bottom: 12px;
        min-height: 50px;
        max-height: 90px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        flex-shrink: 1;
        overflow-y: auto;
      }
      
      .transcript-label {
        font-size: 10px;
        color: ${transcriptLabelColor};
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }
      
      .transcript-text {
        font-size: 14px;
        color: ${transcriptTextColor};
        line-height: 1.5;
        min-height: 30px;
      }
      
      .transcript-text.empty {
        color: #cbd5e1;
        font-style: italic;
      }
      
      /* Voice Controls */
      .voice-controls {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-shrink: 0;
      }
      
      .voice-control-btn {
        width: 72px;
        height: 72px;
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
      
      .voice-control-btn.primary {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
      }
      
      .voice-control-btn.primary:hover {
        transform: scale(1.05);
        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.5);
      }
      
      .voice-control-btn.primary.active {
        background: ${endCallBtnColor === '#ef4444' ? 'white' : controlBtnColor};
        animation: recordingPulse 1.5s ease-in-out infinite;
        box-shadow: 0 8px 20px ${endCallBtnColor === '#ef4444' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 0, 0, 0.2)'};
      }
      
      @keyframes recordingPulse {
        0%, 100% { 
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }
        50% { 
          box-shadow: 0 8px 30px rgba(239, 68, 68, 0.7);
        }
      }
      
      .voice-control-btn.secondary {
        background: ${controlBtnColor};
        color: ${controlBtnSecondaryColor};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
        bottom: -24px;
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }
      
      @media (max-width: 768px) {
        .voice-interface {
          padding: 8px 12px 16px 12px;
        }
        
        .voice-avatar,
        .voice-avatar-active {
          width: 100px;
          height: 100px;
          font-size: 48px;
          margin-top: 8px;
          margin-bottom: 12px;
        }
        
        .voice-status-title {
          font-size: 16px;
        }
        
        .voice-status-subtitle {
          font-size: 13px;
        }
        
        .voice-start-call-btn {
          padding: 12px 24px;
          font-size: 15px;
          min-height: 44px;
        }
        
        .voice-transcript-container {
          padding: 12px;
          max-height: 180px;
        }
        
        .voice-transcript-text {
          font-size: 14px;
          line-height: 1.5;
        }
        
        .voice-controls {
          gap: 12px;
          padding: 12px;
        }
        
        .voice-control-btn {
          width: 48px;
          height: 48px;
          min-width: 48px;
          min-height: 48px;
        }
        
        .voice-control-btn.end-call {
          width: 52px;
          height: 52px;
          min-width: 52px;
          min-height: 52px;
        }
      }
      
      @media (max-width: 480px) {
        .voice-interface {
          padding: 6px 10px 12px 10px;
        }
        
        .voice-avatar,
        .voice-avatar-active {
          width: 90px;
          height: 90px;
          font-size: 42px;
        }
        
        .voice-status-title {
          font-size: 15px;
        }
        
        .voice-status-subtitle {
          font-size: 12px;
        }
        
        .voice-start-call-btn {
          padding: 10px 20px;
          font-size: 14px;
        }
        
        .voice-transcript-container {
          padding: 10px;
          max-height: 150px;
        }
        
        .voice-transcript-text {
          font-size: 13px;
        }
        
        .voice-controls {
          gap: 10px;
          padding: 10px;
        }
        
        .voice-control-btn {
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
        }
        
        .voice-control-btn.end-call {
          width: 48px;
          height: 48px;
          min-width: 48px;
          min-height: 48px;
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

