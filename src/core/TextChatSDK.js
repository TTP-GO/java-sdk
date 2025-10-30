/**
 * TextChatSDK - Single-shot WebSocket per message
 * - Opens a new WS to /chat for each message, streams chunks, emits events, then closes
 * - Persists conversationId locally to allow continuity across messages
 */
import EventEmitter from './EventEmitter.js';

export default class TextChatSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    
    const scriptConfig = this.readScriptTagConfig();

    this.config = {
      // Prefer SockJS native upgrade endpoint directly to avoid an initial failed attempt on /chat
      baseWsUrl: 'wss://backend.talktopc.com/chat/websocket',
      appId: config.appId || scriptConfig.appId,
      agentId: config.agentId || scriptConfig.agentId,
      conversationId: config.conversationId !== undefined ? config.conversationId : this.getPersistedConversationId(),
      // Optional testing override: force a specific conversationId for all sends
      forceConversationId: config.forceConversationId,
      // queueing behavior
      queue: [],
      inFlight: false,
      ...config
    };
    
    this.fullResponseBuffer = '';
  }

  // Read appId/agentId from the embedding script tag data attributes
  readScriptTagConfig() {
    try {
      const scripts = Array.from(document.getElementsByTagName('script'));
      const sdkScript = scripts.reverse().find(s => (s.dataset && (s.dataset.appId || s.dataset.agentId)) || (s.src && s.src.includes('agent-widget')));
      if (!sdkScript) return {};
      return {
        appId: sdkScript.dataset.appId,
        agentId: sdkScript.dataset.agentId
      };
    } catch (_) {
      return {};
    }
  }

  // Build WS URL with query params
  buildWebSocketUrl(base = this.config.baseWsUrl) {
    const params = new URLSearchParams();
    if (this.config.appId) params.append('appId', this.config.appId);
    if (this.config.agentId) params.append('agentId', this.config.agentId);
    if (this.config.conversationId) params.append('conversationId', this.config.conversationId);
    return `${base}?${params.toString()}`;
  }

  // Public API: sendMessage opens a fresh WS, streams, then closes
  async sendMessage(text) {
    return new Promise((resolve, reject) => {
      if (!text || !text.trim()) {
        reject(new Error('Message is empty'));
        return;
      }
      if (!this.config.appId || !this.config.agentId) {
        reject(new Error('Missing appId or agentId'));
        return;
  }
  
      const task = { text, resolve, reject };
      if (this.config.inFlight) {
        this.config.queue.push(task);
      } else {
        this.executeTask(task);
      }
    });
  }

  executeTask(task) {
    this.config.inFlight = true;
    this.fullResponseBuffer = '';

    // If conversationId is missing in memory, try to hydrate from localStorage before sending
    if (!this.config.conversationId) {
      const persisted = this.getPersistedConversationId();
      if (persisted) {
        this.config.conversationId = persisted;
        console.log('🔍 TextChatSDK hydrated conversationId from storage:', persisted);
      }
    }

    const primaryUrl = this.buildWebSocketUrl(this.config.baseWsUrl);
    const fallbackBase = this.config.baseWsUrl.endsWith('/websocket')
      ? this.config.baseWsUrl.replace(/\/websocket$/, '')
      : `${this.config.baseWsUrl}/websocket`;
    const fallbackUrl = this.buildWebSocketUrl(fallbackBase);
    let triedFallback = false;

    let messageSent = false;
    let helloWaitTimer = null;

    const sendPayload = (socket) => {
      if (messageSent) return;
      try {
        const payload = { message: task.text };
        const effectiveConvId = this.config.forceConversationId || this.config.conversationId;
        if (effectiveConvId) {
          payload.conversationId = effectiveConvId;
          // Persist and keep in-memory if coming from a forced value (test mode)
          if (this.config.forceConversationId && !this.config.conversationId) {
            this.config.conversationId = effectiveConvId;
            this.persistConversationId(effectiveConvId);
          }
        }
        console.log('🔍 TextChatSDK sending payload:', payload, 'conversationId in config:', this.config.conversationId);
        socket.send(JSON.stringify(payload));
        messageSent = true;
      } catch (e) {
        task.reject(e);
        this.emit('error', e);
        try { socket.close(); } catch (_) {}
      }
    };

    const handleOpen = (socket) => () => {
      // Wait briefly for server 'hello' to capture conversationId before first send
      // If no hello within 200ms, send anyway
      if (!this.config.conversationId) {
        helloWaitTimer = setTimeout(() => sendPayload(socket), 200);
      } else {
        sendPayload(socket);
      }
    };

    const handleMessage = (socket) => (evt) => {
      try {
        const data = JSON.parse(evt.data);
        // Capture conversationId handshake from server
        if (data.type === 'hello' && data.conversationId) {
          // Persist the conversation id for subsequent messages
          console.log('🔍 TextChatSDK received conversationId:', data.conversationId);
          this.config.conversationId = data.conversationId;
          this.persistConversationId(data.conversationId);
          this.emit && this.emit('conversationIdChanged', data.conversationId);
          // If we were waiting to send the first message, send it now
          if (!messageSent && socket && socket.readyState === 1) {
            if (helloWaitTimer) { try { clearTimeout(helloWaitTimer); } catch (_) {} }
            sendPayload(socket);
          }
          return; // nothing else to do for handshake
        }
        // Fallback: capture conversationId if present on any message shape
        if (!this.config.conversationId && data.conversationId) {
          console.log('🔍 TextChatSDK captured conversationId from message:', data.conversationId);
          this.config.conversationId = data.conversationId;
          this.persistConversationId(data.conversationId);
        }
        if (data.type === 'chunk' && typeof data.content === 'string') {
          this.fullResponseBuffer += data.content;
          this.emit('chunk', data.content);
        } else if (data.type === 'done') {
          // If server sent a final text in the done payload, capture it for non-streaming backends
          try {
            const finalText = data.text || data.content || data.answer || data.message || '';
            if (finalText && !this.fullResponseBuffer) {
              this.fullResponseBuffer = finalText;
            }
          } catch (_) {}
          // Persist conversationId if provided on completion (fallback when hello was missed)
          if (!this.config.conversationId && data.conversationId) {
            console.log('🔍 TextChatSDK captured conversationId from done:', data.conversationId);
            this.config.conversationId = data.conversationId;
          }
          this.persistConversationId(this.config.conversationId);
          this.emit('done', { text: this.fullResponseBuffer });
          task.resolve({ conversationId: this.config.conversationId, fullText: this.fullResponseBuffer });
          try { socket.close(); } catch (_) {}
        } else if (data.type === 'error') {
          const err = new Error(data.message || 'Server error');
          this.emit('error', err);
          task.reject(err);
          try { socket.close(); } catch (_) {}
        }
      } catch (e) {
        // Non-JSON or parse error; ignore or surface
      }
    };

    const handleError = (socket) => (e) => {
      // Try alternate path once: toggle /websocket suffix
      if (!triedFallback) {
        triedFallback = true;
        try { socket.close(); } catch (_) {}
        const fb = new WebSocket(fallbackUrl);
        fb.onopen = handleOpen(fb);
        fb.onmessage = handleMessage(fb);
        fb.onerror = (err) => {
          this.emit('error', err);
          task.reject(err);
        };
        fb.onclose = handleClose;
        return;
      }
      this.emit('error', e);
      task.reject(e);
    };

    const handleClose = () => {
      this.config.inFlight = false;
      this.drainQueue();
    };

    const ws = new WebSocket(primaryUrl);
    ws.onopen = handleOpen(ws);
    ws.onmessage = handleMessage(ws);
    ws.onerror = handleError(ws);
    ws.onclose = handleClose;
  }

  drainQueue() {
    if (this.config.queue.length === 0 || this.config.inFlight) return;
    const next = this.config.queue.shift();
    this.executeTask(next);
  }

  persistConversationId(conversationId) {
    try {
      if (conversationId) localStorage.setItem('ttp_text_chat_conversation_id', conversationId);
    } catch (_) {}
  }

  getPersistedConversationId() {
    try {
      return localStorage.getItem('ttp_text_chat_conversation_id') || null;
    } catch (_) {
      return null;
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  destroy() {
    this.config.queue = [];
    this.config.inFlight = false;
    this.removeAllListeners();
  }
}

