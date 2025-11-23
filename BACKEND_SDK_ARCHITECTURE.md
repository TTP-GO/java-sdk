# Backend SDK Architecture Proposal

## Overview

Create a backend SDK that allows server-side applications to connect to TTP Agent WebSocket API, handle format negotiation, and stream audio (including PCMU/PCMA) for phone systems and other backend use cases.

## Key Differences from Frontend SDK

| Feature | Frontend SDK | Backend SDK |
|---------|-------------|-------------|
| **Runtime** | Browser only | Node.js, Python, Java, etc. |
| **Audio Playback** | Browser AudioContext | N/A (pass-through) |
| **PCMU/PCMA** | Always decoded to PCM | **Pass-through** (no decoding) |
| **Use Case** | Browser voice chat | Phone systems, backend TTS forwarding |
| **Dependencies** | Web Audio API | WebSocket library only |

## Architecture Options

### Option 1: Multi-Language SDKs (Recommended)

Create separate SDKs for each language:

```
ttp-agent-sdk-nodejs/     # Node.js SDK
ttp-agent-sdk-python/      # Python SDK  
ttp-agent-sdk-java/        # Java SDK
ttp-agent-sdk-go/          # Go SDK
```

**Pros:**
- Native language APIs
- Language-specific optimizations
- Better developer experience
- Can use language-specific WebSocket libraries

**Cons:**
- More maintenance overhead
- Need to keep APIs consistent across languages

### Option 2: Unified SDK with Language Bindings

Single core SDK (e.g., Node.js) with bindings for other languages.

**Pros:**
- Single source of truth
- Easier to maintain

**Cons:**
- Complex FFI/binding setup
- Performance overhead
- Less native feel

## Recommended: Option 1 - Start with Node.js SDK

### Package Structure

```
ttp-agent-sdk-nodejs/
├── src/
│   ├── VoiceSDK.ts          # Main SDK class
│   ├── WebSocketClient.ts   # WebSocket wrapper
│   ├── ProtocolHandler.ts   # Protocol v2 handler
│   ├── AudioStream.ts       # Audio streaming handler
│   └── types.ts             # TypeScript types
├── examples/
│   ├── phone-forwarding.ts  # Phone system example
│   ├── tts-forwarding.ts   # TTS forwarding example
│   └── simple-chat.ts       # Simple chat example
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## Core Features

### 1. WebSocket Connection & Protocol

```typescript
// Node.js Example
import { VoiceSDK } from '@ttp/backend-sdk-nodejs';
import WebSocket from 'ws';

const sdk = new VoiceSDK({
  websocketUrl: 'wss://speech.talktopc.com/ws/conv?agentId=xxx&appId=yyy',
  agentId: 'agent_123',
  appId: 'your_app_id',
  
  // Output format for phone systems
  outputContainer: 'raw',
  outputEncoding: 'pcmu',      // ← PCMU for phone systems!
  outputSampleRate: 8000,       // Phone standard
  outputBitDepth: 16,
  outputChannels: 1,
  
  protocolVersion: 2
});
```

### 2. Format Negotiation (v2 Protocol)

```typescript
// Hello message structure (same as frontend)
const helloMessage = {
  t: 'hello',
  v: 2,
  inputFormat: {
    encoding: 'pcm',
    sampleRate: 16000,
    channels: 1,
    bitDepth: 16
  },
  requestedOutputFormat: {
    encoding: 'pcmu',        // Request PCMU
    sampleRate: 8000,
    channels: 1,
    bitDepth: 16,
    container: 'raw'
  },
  outputFrameDurationMs: 600
};

// Server responds with hello_ack
// {
//   t: 'hello_ack',
//   outputAudioFormat: { ... }
// }
```

### 3. Audio Streaming (Pass-Through)

**Key Difference:** Backend SDK does NOT decode PCMU/PCMA - passes it through!

```typescript
sdk.on('audioData', (rawAudioData, format) => {
  // rawAudioData is RAW PCMU/PCMA bytes (NOT decoded!)
  // format: { container, encoding, sampleRate, bitDepth, channels }
  
  // Forward directly to phone system
  phoneSystem.sendAudio(rawAudioData);  // ← Raw PCMU, ready for phone!
});

sdk.on('formatNegotiated', (format) => {
  console.log('Format:', format);
  // { container: 'raw', encoding: 'pcmu', sampleRate: 8000, ... }
});
```

### 4. Audio Input (Recording)

```typescript
// For phone systems: receive audio from phone, forward to TTP
phoneSystem.on('audio', (phoneAudio) => {
  // phoneAudio is PCMU from phone
  sdk.sendAudio(phoneAudio);  // Forward to TTP backend
});
```

## Implementation Details

### Node.js SDK Example

```typescript
// src/VoiceSDK.ts
import WebSocket from 'ws';
import { EventEmitter } from 'events';

interface VoiceSDKConfig {
  websocketUrl: string;
  agentId?: string;
  appId?: string;
  outputContainer?: 'raw' | 'wav';
  outputEncoding?: 'pcm' | 'pcmu' | 'pcma';
  outputSampleRate?: number;
  outputBitDepth?: number;
  outputChannels?: number;
  outputFrameDurationMs?: number;
  protocolVersion?: number;
}

class VoiceSDK extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: VoiceSDKConfig;
  private outputFormat: any = null;

  constructor(config: VoiceSDKConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.config.websocketUrl);
      
      this.ws.on('open', () => {
        this.sendHelloMessage();
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        this.emit('error', error);
        reject(error);
      });
    });
  }

  private sendHelloMessage() {
    const hello = {
      t: 'hello',
      v: this.config.protocolVersion || 2,
      inputFormat: {
        encoding: 'pcm',
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16
      },
      requestedOutputFormat: {
        encoding: this.config.outputEncoding || 'pcm',
        sampleRate: this.config.outputSampleRate || 16000,
        channels: this.config.outputChannels || 1,
        bitDepth: this.config.outputBitDepth || 16,
        container: this.config.outputContainer || 'raw'
      },
      outputFrameDurationMs: this.config.outputFrameDurationMs || 600
    };

    this.ws?.send(JSON.stringify(hello));
  }

  private handleMessage(data: WebSocket.Data) {
    // Binary message (audio)
    if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
      this.handleBinaryMessage(data);
      return;
    }

    // Text message (JSON)
    try {
      const message = JSON.parse(data.toString());
      
      if (message.t === 'hello_ack') {
        this.outputFormat = message.outputAudioFormat;
        this.emit('formatNegotiated', this.outputFormat);
      } else {
        this.emit('message', message);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  private handleBinaryMessage(data: Buffer | ArrayBuffer) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    
    // ✅ KEY DIFFERENCE: Pass through raw audio (NO decoding!)
    // Frontend SDK would decode PCMU/PCMA here, but backend doesn't
    this.emit('audioData', buffer, this.outputFormat);
  }

  sendAudio(audioData: Buffer | Uint8Array) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
    }
  }

  sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    this.ws?.close();
    this.emit('disconnected');
  }
}

export { VoiceSDK };
```

### Use Case: Phone System Integration

```typescript
// examples/phone-forwarding.ts
import { VoiceSDK } from '@ttp/backend-sdk-nodejs';
import { PhoneSystem } from './phone-system'; // Your phone system SDK

const sdk = new VoiceSDK({
  websocketUrl: signedUrl,
  agentId: 'agent_123',
  appId: 'your_app_id',
  
  // Request PCMU for phone systems
  outputContainer: 'raw',
  outputEncoding: 'pcmu',      // ← Phone systems use PCMU
  outputSampleRate: 8000,      // ← Phone standard
  outputBitDepth: 16,
  outputChannels: 1,
  protocolVersion: 2
});

const phoneSystem = new PhoneSystem();

// Forward TTP audio to phone (raw PCMU, no decoding!)
sdk.on('audioData', (rawPcmuData, format) => {
  console.log('Received PCMU audio:', rawPcmuData.length, 'bytes');
  phoneSystem.sendAudio(rawPcmuData);  // ← Direct forward, no conversion!
});

// Forward phone audio to TTP
phoneSystem.on('audio', (phoneAudio) => {
  sdk.sendAudio(phoneAudio);  // Forward to TTP
});

// Connect
await sdk.connect();
phoneSystem.connect();
```

## Python SDK Example

```python
# ttp_agent_sdk_python/voice_sdk.py
import asyncio
import websockets
import json
from typing import Optional, Callable

class VoiceSDK:
    def __init__(self, config: dict):
        self.config = config
        self.ws = None
        self.output_format = None
        self._audio_callbacks = []
    
    async def connect(self):
        uri = self.config['websocket_url']
        self.ws = await websockets.connect(uri)
        
        # Send hello message
        await self._send_hello()
        
        # Start listening
        asyncio.create_task(self._listen())
    
    async def _send_hello(self):
        hello = {
            't': 'hello',
            'v': self.config.get('protocol_version', 2),
            'inputFormat': {
                'encoding': 'pcm',
                'sampleRate': 16000,
                'channels': 1,
                'bitDepth': 16
            },
            'requestedOutputFormat': {
                'encoding': self.config.get('output_encoding', 'pcm'),
                'sampleRate': self.config.get('output_sample_rate', 16000),
                'channels': self.config.get('output_channels', 1),
                'bitDepth': self.config.get('output_bit_depth', 16),
                'container': self.config.get('output_container', 'raw')
            },
            'outputFrameDurationMs': self.config.get('output_frame_duration_ms', 600)
        }
        await self.ws.send(json.dumps(hello))
    
    async def _listen(self):
        async for message in self.ws:
            # Binary message (audio)
            if isinstance(message, bytes):
                # ✅ Pass through raw audio (NO decoding!)
                for callback in self._audio_callbacks:
                    callback(message, self.output_format)
            else:
                # Text message (JSON)
                data = json.loads(message)
                if data.get('t') == 'hello_ack':
                    self.output_format = data.get('outputAudioFormat')
                    # Emit formatNegotiated event
    
    def on_audio_data(self, callback: Callable):
        self._audio_callbacks.append(callback)
    
    async def send_audio(self, audio_data: bytes):
        await self.ws.send(audio_data)
    
    async def disconnect(self):
        await self.ws.close()
```

## Java SDK Example

```java
// VoiceSDK.java
import java.net.URI;
import java.nio.ByteBuffer;
import javax.websocket.*;

@ClientEndpoint
public class VoiceSDK {
    private Session session;
    private AudioFormat outputFormat;
    
    public void connect(String websocketUrl) throws Exception {
        WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        session = container.connectToServer(this, new URI(websocketUrl));
        sendHelloMessage();
    }
    
    @OnMessage
    public void onMessage(ByteBuffer buffer, Session session) {
        // Binary message (audio) - pass through raw PCMU/PCMA
        byte[] audioData = new byte[buffer.remaining()];
        buffer.get(audioData);
        onAudioData(audioData, outputFormat);
    }
    
    @OnMessage
    public void onMessage(String message, Session session) {
        // Text message (JSON)
        JSONObject json = new JSONObject(message);
        if ("hello_ack".equals(json.getString("t"))) {
            outputFormat = parseFormat(json.getJSONObject("outputAudioFormat"));
            onFormatNegotiated(outputFormat);
        }
    }
    
    private void sendHelloMessage() {
        JSONObject hello = new JSONObject();
        hello.put("t", "hello");
        hello.put("v", 2);
        // ... format negotiation
        session.getAsyncRemote().sendText(hello.toString());
    }
    
    public void sendAudio(byte[] audioData) {
        session.getAsyncRemote().sendBinary(ByteBuffer.wrap(audioData));
    }
}
```

## Package Distribution

### NPM (Node.js)
```json
{
  "name": "@ttp/backend-sdk-nodejs",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "ws": "^8.0.0"
  }
}
```

### PyPI (Python)
```python
# setup.py
setup(
    name='ttp-backend-sdk',
    version='1.0.0',
    install_requires=['websockets>=10.0']
)
```

### Maven (Java)
```xml
<dependency>
    <groupId>com.talktopc</groupId>
    <artifactId>ttp-backend-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

## Key Implementation Points

### 1. **NO Audio Decoding**
- Backend SDK receives PCMU/PCMA and passes it through
- No conversion to PCM (unlike frontend SDK)
- Raw bytes go directly to phone systems

### 2. **Format Negotiation**
- Same protocol as frontend SDK
- Request PCMU/PCMA in `requestedOutputFormat`
- Server responds with negotiated format in `hello_ack`

### 3. **Binary Message Handling**
```typescript
// Backend: Pass through
ws.on('message', (data) => {
  if (Buffer.isBuffer(data)) {
    emit('audioData', data, format);  // Raw PCMU/PCMA
  }
});

// Frontend: Decode for browser
ws.onmessage = (event) => {
  if (event.data instanceof ArrayBuffer) {
    const decoded = decodePcmu(event.data);  // Decode to PCM
    audioPlayer.play(decoded);  // Browser playback
  }
};
```

### 4. **WAV Header Handling**
- If backend sends WAV container, extract PCM data
- If user requests WAV, wrap PCM in WAV header
- But for PCMU/PCMA, usually use 'raw' container

## Testing Strategy

### Unit Tests
- Protocol message parsing
- Format negotiation
- Binary message handling

### Integration Tests
- Connect to test WebSocket server
- Verify format negotiation
- Verify audio pass-through

### Example Test
```typescript
test('PCMU audio pass-through', async () => {
  const sdk = new VoiceSDK({
    outputEncoding: 'pcmu',
    outputSampleRate: 8000
  });
  
  const receivedAudio: Buffer[] = [];
  sdk.on('audioData', (data) => {
    receivedAudio.push(data);
  });
  
  await sdk.connect();
  
  // Simulate backend sending PCMU
  sdk['ws']?.emit('message', Buffer.from([0x7F, 0xFF, ...])); // PCMU bytes
  
  expect(receivedAudio[0]).toBeInstanceOf(Buffer);
  // Verify it's raw PCMU (not decoded)
});
```

## Documentation Structure

### README.md
- Installation
- Quick start
- Phone system integration example
- API reference
- Format negotiation guide

### Examples
- `phone-forwarding.ts` - Phone system integration
- `tts-forwarding.ts` - TTS forwarding to another service
- `simple-chat.ts` - Basic chat example

## Next Steps

1. **Start with Node.js SDK** (TypeScript)
   - Most common backend language
   - Easy to test
   - Can reuse protocol logic from frontend SDK

2. **Create GitHub Repository**
   - `ttp-agent-sdk-nodejs`
   - Separate from frontend SDK repo

3. **Implement Core Features**
   - WebSocket connection
   - Protocol v2 handler
   - Format negotiation
   - Binary message pass-through

4. **Add Examples**
   - Phone system integration
   - TTS forwarding

5. **Publish to NPM**
   - `@ttp/backend-sdk-nodejs`

6. **Expand to Other Languages**
   - Python SDK
   - Java SDK
   - Go SDK (if needed)

## Summary

**Backend SDK = Frontend SDK Protocol - Browser Dependencies**

- Same WebSocket protocol
- Same format negotiation
- **NO audio decoding** (pass-through)
- **NO browser APIs** (pure WebSocket)
- Language-specific implementations

This allows backend users to:
- Connect to TTP WebSocket API
- Request PCMU/PCMA for phone systems
- Forward raw audio without conversion
- Use in Node.js, Python, Java, etc.

