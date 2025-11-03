/**
 * TextInterface - Handles text chat UI and functionality
 * Part of the unified TTPChatWidget
 */

export class TextInterface {
  constructor(config, sdk) {
    this.config = config;
    this.sdk = sdk;
    this.streamingEl = null;
    this.hasStartedStreaming = false;
    this.isActive = false;
  }

  // Helper function to get translated text
  t(key) {
    const lang = this.config.language || 'en';
    const translations = this.config.translations?.[lang] || this.config.translations?.en || {};
    return translations[key] || key;
  }

  /**
   * Generate HTML for text interface
   */
  generateHTML() {
    // Use text config, fallback to panel config, then translation, then default
    const inputPlaceholder = this.config.inputPlaceholder || 
                            this.config.panel?.inputPlaceholder || 
                            this.t('typeMessage') || 
                            'Type your message...';
    return `<div class="text-interface" id="textInterface">
      <div class="messages-container" id="messagesContainer">
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">${this.t('hello')}</div>
          <div class="empty-state-text">${this.t('sendMessage')}</div>
        </div>
      </div>
      <div class="input-container">
        <div class="input-wrapper" style="flex:1;">
          <textarea class="message-input" id="messageInput" placeholder="${inputPlaceholder}" rows="1" dir="${this.config.direction || 'ltr'}"></textarea>
        </div>
        <button class="send-button" id="sendButton" aria-label="${this.t('sendMessageAria')}">${this.config.sendButtonText || '➤'}</button>
        ${(this.config.sendButtonHint?.text || this.config.panel?.sendButtonHint?.text) ? `
          <div class="send-button-hint" style="color: ${this.config.sendButtonHint?.color || this.config.panel?.sendButtonHint?.color || '#6B7280'}; font-size: ${this.config.sendButtonHint?.fontSize || this.config.panel?.sendButtonHint?.fontSize || '12px'}; text-align: center; margin-top: 4px;">
            ${this.config.sendButtonHint?.text || this.config.panel?.sendButtonHint?.text}
          </div>
        ` : ''}
      </div>
    </div>`;
  }

  /**
   * Generate CSS for text interface
   */
  generateCSS() {
    const messages = this.config.messages;
    const panel = this.config.panel;
    const anim = this.config.animation;
    
    // Use text config, fallback to panel config for backward compatibility
    const sendButtonColor = this.config.sendButtonColor || this.config.panel?.sendButtonColor || '#7C3AED'; // Purple default
    const sendButtonHoverColor = this.config.sendButtonHoverColor || this.config.panel?.sendButtonHoverColor || '#6D28D9';
    const sendButtonTextColor = this.config.sendButtonTextColor || this.config.panel?.sendButtonTextColor || '#FFFFFF';
    const inputPlaceholder = this.config.inputPlaceholder || this.config.panel?.inputPlaceholder || 'Type your message...';
    const inputBorderColor = this.config.inputBorderColor || this.config.panel?.inputBorderColor || '#E5E7EB';
    const inputFocusColor = this.config.inputFocusColor || this.config.panel?.inputFocusColor || '#7C3AED'; // Purple default
    const inputBackgroundColor = this.config.inputBackgroundColor || this.config.panel?.inputBackgroundColor || '#FFFFFF';
    const inputTextColor = this.config.inputTextColor || this.config.panel?.inputTextColor || '#1F2937';
    const inputFontSize = this.config.inputFontSize || this.config.panel?.inputFontSize || '14px';
    const inputBorderRadius = this.config.inputBorderRadius || this.config.panel?.inputBorderRadius || 20;
    const inputPadding = this.config.inputPadding || this.config.panel?.inputPadding || '6px 14px';
    
    return `
      /* Messages container using new classes */
      #messagesContainer { 
        flex: 1; 
        overflow-y: auto; 
        overflow-x: hidden; 
        padding: 20px; 
        background: #f8fafc; 
        display: flex; 
        flex-direction: column; 
        gap: 16px; 
        min-height: 0; 
      }
      .empty-state { 
        flex: 1; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        gap: 12px; 
        color: #64748b; 
        text-align: center; 
        padding: 20px; 
      }
      .empty-state-icon { font-size: 48px; opacity: 0.3; }
      .empty-state-title { font-size: 20px; font-weight: 700; color: #334155; }
      .empty-state-text { font-size: 13px; max-width: 280px; }

      .text-interface { 
        display: none; 
        flex: 1; 
        flex-direction: column; 
        min-height: 0; 
        overflow: hidden; 
      }
      .text-interface.active { display: flex; }
      
      .message { 
        display: flex; 
        gap: 8px; 
        padding: 4px 0; 
        max-width: 100%; 
        align-items: center; 
      }
      .message.edge-left { flex-direction: row; }
      .message.edge-right { flex-direction: row-reverse; }
      .message-bubble { 
        padding: 12px; 
        border-radius: ${messages.borderRadius}px; 
        max-width: 80%; 
        font-size: ${messages.fontSize}; 
        color: ${messages.textColor}; 
        word-wrap: break-word; 
        text-align: ${this.config.direction === 'rtl' ? 'right' : 'left'}; 
        direction: ${this.config.direction || 'ltr'};
      }
      .message.user { 
        background: ${messages.userBackgroundColor}; 
        align-self: ${this.config.direction === 'rtl' ? 'flex-start' : 'flex-end'}; 
      }
      .message.agent { 
        background: ${messages.agentBackgroundColor}; 
        align-self: ${this.config.direction === 'rtl' ? 'flex-end' : 'flex-start'}; 
      }
      .message .message-bubble { 
        text-align: ${this.config.direction === 'rtl' ? 'right' : 'left'}; 
      }
      .message-avatar { 
        width: 20px; 
        height: 20px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        flex-shrink: 0; 
        color: inherit; 
        font-size: 18px; 
        line-height: 1; 
        background: transparent; 
        border: none; 
      }
      .message-avatar.user { background: transparent; }
      .message-avatar.agent { background: transparent; }
      
      .message.system {
        background: ${messages.systemBackgroundColor};
        align-self: flex-start;
      }
      .message.error {
        background: ${messages.errorBackgroundColor};
        align-self: flex-start;
      }
      
      .input-container {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        background: #FFFFFF;
        border-top: 1px solid #E5E7EB;
        align-items: center;
        flex-shrink: 0;
        flex-direction: ${this.config.direction === 'rtl' ? 'row-reverse' : 'row'};
      }
      
      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }
      
      .message-input {
        width: 100%;
        min-height: 32px;
        max-height: 120px;
        padding: ${inputPadding};
        border: 1px solid ${inputBorderColor};
        border-radius: ${inputBorderRadius}px;
        font-size: ${inputFontSize};
        font-family: inherit;
        line-height: 1.3;
        resize: none;
        overflow-y: auto;
        background: ${inputBackgroundColor};
        color: ${inputTextColor};
        vertical-align: top;
        margin: 0;
        display: block;
        white-space: pre-wrap;
        word-wrap: break-word;
        text-align: ${this.config.direction === 'rtl' ? 'right' : 'left'};
        direction: ${this.config.direction || 'ltr'};
        -webkit-appearance: none;
        appearance: none;
        box-sizing: border-box;
      }
      
      .message-input:focus {
        outline: none;
        border-color: ${inputFocusColor};
        background: ${inputBackgroundColor === '#FFFFFF' ? '#FFFFFF' : inputBackgroundColor};
        box-shadow: 0 0 0 3px ${inputFocusColor}33;
      }
      
      .message-input::placeholder {
        color: #9CA3AF;
        text-align: ${this.config.direction === 'rtl' ? 'right' : 'left'};
      }
      
      .send-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: ${sendButtonColor};
        color: ${sendButtonTextColor};
        font-size: ${this.config.sendButtonFontSize || this.config.panel?.sendButtonFontSize || '18px'};
        font-weight: ${this.config.sendButtonFontWeight || this.config.panel?.sendButtonFontWeight || '500'};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(124, 60, 237, 0.3);
      }
      
      .send-button:hover:not(:disabled) {
        background: ${sendButtonHoverColor};
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(124, 60, 237, 0.4);
      }
      
      .send-button-hint {
        width: 100%;
        text-align: center;
        margin-top: 4px;
      }
      
      .send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .typing-indicator {
        display: inline-flex;
        gap: 4px;
        align-items: center;
      }
      
      .typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #64748b;
        animation: typingDot 1.4s ease-in-out infinite;
      }
      
      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      
      @keyframes typingDot {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
        30% { transform: translateY(-8px); opacity: 1; }
      }
      
      .error-message {
        padding: 12px;
        background: ${messages.errorBackgroundColor};
        border-radius: ${messages.borderRadius}px;
        color: #991B1B;
        font-size: ${messages.fontSize};
        margin: 8px 0;
      }
      
      @media (max-width: 768px) {
        #messagesContainer {
          padding: 12px;
          gap: 12px;
        }
        
        .message-bubble {
          max-width: 85%;
          font-size: 14px;
          padding: 10px;
        }
        
        .text-input-container {
          padding: 10px;
          gap: 8px;
        }
        
        #text-chat-input {
          font-size: 16px !important; /* Prevents iOS zoom on focus */
          padding: 10px 14px;
          min-height: 44px;
        }
        
        #text-chat-send {
          min-width: 56px;
          min-height: 44px;
          width: 56px;
          height: 44px;
        }
        
        .empty-state-icon {
          font-size: 40px;
        }
        
        .empty-state-title {
          font-size: 18px;
        }
        
        .empty-state-text {
          font-size: 12px;
        }
      }
      
      @media (max-width: 480px) {
        #messagesContainer {
          padding: 10px;
          gap: 10px;
        }
        
        .message-bubble {
          max-width: 90%;
          font-size: 13px;
          padding: 8px;
        }
        
        .text-input-container {
          padding: 8px;
        }
        
        #text-chat-input {
          font-size: 16px !important;
          padding: 8px 12px;
        }
      }
    `;
  }

  /**
   * Setup event handlers for text interface
   */
  setupEventHandlers() {
    const sendButton = document.getElementById('sendButton');
    const inputField = document.getElementById('messageInput');
    const newChatBtn = document.getElementById('newChatBtn');
    
    if (sendButton) sendButton.onclick = () => this.sendMessage();
    if (newChatBtn) newChatBtn.onclick = () => this.startNewChat();
    
    // Update placeholder and direction when config changes
    this.updateInputAttributes();
    
    // Send on Enter key, auto-resize textarea, and keep cursor visible
    if (inputField) {
      // Set initial height
      inputField.style.height = '32px';
      inputField.style.overflow = 'hidden';
      
      // Auto-resize textarea as user types
      const autoResize = () => {
        inputField.style.height = 'auto';
        const newHeight = Math.min(inputField.scrollHeight, 120);
        inputField.style.height = newHeight + 'px';
        inputField.style.overflowY = newHeight >= 120 ? 'auto' : 'hidden';
        
        // When at max height with overflow, scroll to bottom to keep cursor visible
        if (newHeight >= 120) {
          // Small delay to ensure height is applied first
          setTimeout(() => {
            inputField.scrollTop = inputField.scrollHeight;
          }, 0);
        }
      };
      
      inputField.addEventListener('input', autoResize);
      
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        } else if (e.key === 'Enter' && e.shiftKey) {
          // Allow Enter with Shift for new line, resize after
          setTimeout(autoResize, 0);
        }
      });
    }
  }

  /**
   * Start new chat
   */
  startNewChat() {
    try { 
      localStorage.removeItem('ttp_text_chat_conversation_id'); 
    } catch (_) {}
    
    if (this.sdk) {
      this.sdk.config.conversationId = null;
    }
    
    // Reset UI messages to empty state
    const container = document.getElementById('messagesContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">${this.t('hello')}</div>
          <div class="empty-state-text">${this.t('sendMessage')}</div>
        </div>`;
    }
    
    // Focus message input
    const input = document.getElementById('messageInput');
    if (input) input.focus();
  }

  /**
   * Update input attributes (placeholder, direction) when config changes
   */
  updateInputAttributes() {
    const inputField = document.getElementById('messageInput');
    if (inputField) {
      // Update placeholder based on current language
      const inputPlaceholder = this.config.inputPlaceholder || 
                              this.config.panel?.inputPlaceholder || 
                              this.t('typeMessage') || 
                              'Type your message...';
      inputField.placeholder = inputPlaceholder;
      
      // Update direction
      inputField.dir = this.config.direction || 'ltr';
      
      // Update text-align style
      inputField.style.textAlign = this.config.direction === 'rtl' ? 'right' : 'left';
    }
  }

  /**
   * Show text interface
   */
  show() {
    const textInterface = document.getElementById('textInterface');
    if (textInterface) textInterface.classList.add('active');
    
    // Focus input soon after render
    setTimeout(() => {
      const input = document.getElementById('messageInput');
      if (input) input.focus();
    }, 50);
  }

  /**
   * Hide text interface
   */
  hide() {
    const textInterface = document.getElementById('textInterface');
    if (textInterface) textInterface.classList.remove('active');
  }

  /**
   * Start chat session
   */
  async startChat() {
    // No-op with single-shot design; connection happens per message
    this.isActive = true;
    this.updateSendButtonState();
  }

  /**
   * Send message
   */
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
    
    // Clear input and reset height
    input.value = '';
    input.style.height = '32px';
    input.style.overflow = 'hidden';
    
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

  /**
   * Update send button state
   */
  updateSendButtonState() {
    const sendButton = document.getElementById('sendButton');
    if (!sendButton) return;
    
    sendButton.disabled = !this.isActive; // single-shot; enable when ready for input
  }

  /**
   * Add message to UI
   */
  addMessage(type, text) {
    const messages = document.getElementById('messagesContainer');
    if (!messages) return;
    
    // Remove empty state if present
    const emptyState = messages.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }
    
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

  /**
   * Begin streaming response
   */
  beginStreaming() {
    const messages = document.getElementById('messagesContainer');
    if (!messages) return;
    
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

  /**
   * Append chunk to streaming response
   */
  appendStreamingChunk(chunk) {
    if (!this.streamingEl) return;
    
    if (!this.hasStartedStreaming) {
      // remove typing indicator on first content
      this.streamingEl.textContent = '';
      this.hasStartedStreaming = true;
    }
    
    this.streamingEl.textContent += chunk;
    const messages = document.getElementById('messagesContainer');
    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
  }

  /**
   * Finalize streaming response
   */
  finalizeStreaming(fullText) {
    if (this.streamingEl) {
      this.streamingEl.textContent = fullText || this.streamingEl.textContent;
      const container = document.getElementById('agent-streaming');
      if (container) container.id = '';
      this.streamingEl = null;
    }
    this.updateSendButtonState();
  }

  /**
   * Stop streaming state
   */
  stopStreamingState() {
    const existing = document.getElementById('agent-streaming');
    if (existing) existing.remove();
    this.streamingEl = null;
    this.hasStartedStreaming = false;
  }

  /**
   * Show error message
   */
  showError(message) {
    const messages = document.getElementById('messagesContainer');
    if (!messages) return;
    
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    messages.appendChild(error);
    messages.scrollTop = messages.scrollHeight;
  }

  /**
   * Set active state
   */
  setActive(active) {
    this.isActive = active;
    this.updateSendButtonState();
  }
}

