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
      // Prefer native WebSocket endpoint; server is registered at /chat with SockJS fallback
      baseWsUrl: 'wss://backend.talktopc.com/chat',
      appId: config.appId || scriptConfig.appId,
      agentId: config.agentId || scriptConfig.agentId,
      conversationId: config.conversationId || this.getPersistedConversationId(),
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

    const primaryUrl = this.buildWebSocketUrl(this.config.baseWsUrl);
    const fallbackBase = this.config.baseWsUrl.endsWith('/websocket')
      ? this.config.baseWsUrl.replace(/\/websocket$/, '')
      : `${this.config.baseWsUrl}/websocket`;
    const fallbackUrl = this.buildWebSocketUrl(fallbackBase);
    let triedFallback = false;
    let ws = new WebSocket(primaryUrl);

    ws.onopen = () => {
      try {
        const payload = {
          conversationId: this.config.conversationId || undefined,
          message: task.text
        };
        ws.send(JSON.stringify(payload));
      } catch (e) {
        task.reject(e);
        this.emit('error', e);
        try { ws.close(); } catch (_) {}
      }
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        // Capture conversationId handshake from server
        if (data.type === 'hello' && data.conversationId) {
          // Persist the conversation id for subsequent messages
          this.config.conversationId = data.conversationId;
          this.persistConversationId(data.conversationId);
          this.emit && this.emit('conversationIdChanged', data.conversationId);
          return; // nothing else to do for handshake
        }
        if (data.type === 'chunk' && typeof data.content === 'string') {
          this.fullResponseBuffer += data.content;
          this.emit('chunk', data.content);
        } else if (data.type === 'done') {
          // persist conversationId if server assigned it earlier in the session attributes (handled server-side)
          if (!this.config.conversationId) {
            // best-effort: keep existing if set on connect via query; server stores in session
          }
          this.persistConversationId(this.config.conversationId);
          this.emit('done', { text: this.fullResponseBuffer });
          task.resolve({ conversationId: this.config.conversationId, fullText: this.fullResponseBuffer });
          try { ws.close(); } catch (_) {}
        } else if (data.type === 'error') {
          const err = new Error(data.message || 'Server error');
          this.emit('error', err);
          task.reject(err);
          try { ws.close(); } catch (_) {}
        }
      } catch (e) {
        // Non-JSON or parse error; ignore or surface
      }
    };

    ws.onerror = (e) => {
      // Try alternate path once: toggle /websocket suffix
      if (!triedFallback) {
        triedFallback = true;
        try { ws.close(); } catch (_) {}
        try {
          ws = new WebSocket(fallbackUrl);
          // rebind handlers
          ws.onopen = ws.onopen;
          ws.onmessage = ws.onmessage;
          ws.onerror = (err) => {
            this.emit('error', err);
            task.reject(err);
          };
          ws.onclose = ws.onclose;
          return;
        } catch (err) {
          this.emit('error', err);
          task.reject(err);
          return;
        }
      }
      this.emit('error', e);
      task.reject(e);
    };

    ws.onclose = () => {
      this.config.inFlight = false;
      this.drainQueue();
    };
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

