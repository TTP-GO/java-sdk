# TTP Agent SDK

A comprehensive JavaScript SDK for voice interaction with AI agents. Provides real-time audio recording, WebSocket communication, and audio playback with queue management.

## Features

- 🎤 **Real-time Audio Recording** - Uses AudioWorklet for high-quality audio capture
- 🔄 **WebSocket Communication** - Real-time bidirectional communication with authentication
- 🔊 **Audio Playback Queue** - Smooth audio playback with queue management
- ⚛️ **React Components** - Ready-to-use React components
- 🌐 **Vanilla JavaScript** - Works with any JavaScript framework
- 🎯 **Event-driven** - Comprehensive event system for all interactions
- 🔒 **Multiple Authentication Methods** - Support for signed links and direct agent access
- 📱 **Responsive Widget** - Pre-built UI widget for quick integration

## Installation

```bash
npm install ttp-agent-sdk
```

## Quick Start

### Method 1: Direct Agent ID (Development/Testing)

```javascript
import { VoiceSDK } from 'ttp-agent-sdk';

const voiceSDK = new VoiceSDK({
  websocketUrl: 'wss://speech.talktopc.com/ws/conv',
  agentId: 'your_agent_id',
  appId: 'your_app_id',
  voice: 'default',
  language: 'en'
});

// Connect and start recording
await voiceSDK.connect();
await voiceSDK.startRecording();
```

### Method 2: Signed Link (Production)

```javascript
import { VoiceSDK } from 'ttp-agent-sdk';

const voiceSDK = new VoiceSDK({
  websocketUrl: 'wss://speech.talktopc.com/ws/conv',
  // No agentId needed - server validates signed token from URL
});

// Connect using signed URL
await voiceSDK.connect();
```

### Method 3: Pre-built Widget

```html
<script src="https://unpkg.com/ttp-agent-sdk/dist/agent-widget.js"></script>
<script>
  TTPAgentSDK.AgentWidget.init({
    agentId: 'your_agent_id',
    getSessionUrl: async ({ agentId, variables }) => {
      const response = await fetch('/api/get-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, variables })
      });
      const data = await response.json();
      return data.signedUrl;
    },
    variables: {
      userName: 'John Doe',
      page: 'homepage'
    }
  });
</script>
```

## React Integration

```jsx
import React from 'react';
import { VoiceButton } from 'ttp-agent-sdk';

function App() {
  return (
    <VoiceButton
      websocketUrl="wss://speech.talktopc.com/ws/conv"
      agentId="your_agent_id"
      appId="your_app_id"
      onConnected={() => console.log('Connected!')}
      onRecordingStarted={() => console.log('Recording...')}
      onPlaybackStarted={() => console.log('Playing audio...')}
    />
  );
}
```

## API Reference

### VoiceSDK

The main SDK class for voice interaction.

#### Constructor Options

```javascript
const voiceSDK = new VoiceSDK({
  websocketUrl: 'wss://speech.talktopc.com/ws/conv', // Required
  agentId: 'agent_12345', // Optional - for direct agent access
  appId: 'app_67890', // Optional - user's app ID for authentication
  ttpId: 'ttp_abc123', // Optional - custom TTP ID (fallback)
  voice: 'default', // Optional - voice selection
  language: 'en', // Optional - language code
  sampleRate: 16000, // Optional - audio sample rate
  autoReconnect: true // Optional - auto-reconnect on disconnect
});
```

#### Methods

- `connect()` - Connect to the voice server
- `disconnect()` - Disconnect from the voice server
- `startRecording()` - Start voice recording
- `stopRecording()` - Stop voice recording
- `toggleRecording()` - Toggle recording state
- `destroy()` - Clean up resources

#### Events

- `connected` - WebSocket connected
- `disconnected` - WebSocket disconnected
- `recordingStarted` - Recording started
- `recordingStopped` - Recording stopped
- `playbackStarted` - Audio playback started
- `playbackStopped` - Audio playback stopped
- `error` - Error occurred
- `message` - Received message from server

### VoiceButton (React)

A React component that provides a voice interaction button.

#### Props

```jsx
<VoiceButton
  websocketUrl="wss://speech.talktopc.com/ws/conv"
  agentId="agent_12345"
  appId="app_67890"
  voice="default"
  language="en"
  autoReconnect={true}
  onConnected={() => {}}
  onDisconnected={() => {}}
  onRecordingStarted={() => {}}
  onRecordingStopped={() => {}}
  onPlaybackStarted={() => {}}
  onPlaybackStopped={() => {}}
  onError={(error) => {}}
  onMessage={(message) => {}}
/>
```

### AgentWidget (Vanilla JS)

A pre-built widget for quick integration.

#### Configuration

```javascript
TTPAgentSDK.AgentWidget.init({
  agentId: 'your_agent_id', // Required
  getSessionUrl: 'https://your-api.com/get-session', // Required - URL or function
  variables: { // Optional - dynamic variables
    userName: 'John Doe',
    page: 'homepage'
  },
  position: 'bottom-right', // Optional - widget position
  primaryColor: '#4F46E5' // Optional - theme color
});
```

## Authentication Methods

### 1. Direct Agent ID (Unsecured - Development)

**Use Case**: Development, testing, or internal applications.

```javascript
const voiceSDK = new VoiceSDK({
  websocketUrl: 'wss://speech.talktopc.com/ws/conv',
  agentId: 'agent_12345', // Visible in network traffic
  appId: 'app_67890'
});
```

**Security Risk**: Agent ID is visible in network traffic.

### 2. Signed Link (Secured - Production)

**Use Case**: Production applications where security is critical.

```javascript
const voiceSDK = new VoiceSDK({
  websocketUrl: 'wss://speech.bidme.co.il/ws/conv?signed_token=eyJ...'
  // No agentId needed - server validates signed token
});
```

**Benefits**: Secure, cost-controlled, and production-ready.

## Message Format

### Outgoing Messages

```javascript
// Hello message (sent on connection)
{
  t: "hello",
  appId: "app_67890" // or ttpId for fallback
}

// Start continuous mode
{
  t: "start_continuous_mode",
  ttpId: "sdk_abc123_1234567890"
}

// Stop continuous mode
{
  t: "stop_continuous_mode",
  ttpId: "sdk_abc123_1234567890"
}
```

### Incoming Messages

```javascript
// Text response
{
  type: "agent_response",
  agent_response: "Hello! How can I help you?"
}

// User transcript
{
  type: "user_transcript", 
  user_transcription: "Hello there"
}

// Barge-in detection
{
  type: "barge_in",
  message: "User interrupted"
}

// Stop playing request
{
  type: "stop_playing",
  message: "Stop all audio"
}
```

## Examples

See the `examples/` directory for complete usage examples:

- `test.html` - Basic widget integration
- `react-example.jsx` - React component usage
- `vanilla-example.html` - Vanilla JavaScript usage

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Browser Support

- Chrome 66+
- Firefox 60+
- Safari 11.1+
- Edge 79+

## License

MIT

## Support

For support and questions, please open an issue on GitHub or contact our support team.
