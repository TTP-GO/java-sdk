# Getting Started with TTP Agent SDK

This guide will help you quickly integrate voice AI agents into your web application using the TTP Agent SDK.

## Quick Start

### 1. Installation

```bash
npm install ttp-agent-sdk
```

### 2. Basic Usage

#### Option A: Pre-built Widget (Easiest)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Voice Agent Demo</title>
</head>
<body>
  <!-- Your app content -->
  
  <!-- Load the SDK -->
  <script src="https://unpkg.com/ttp-agent-sdk/dist/agent-widget.js"></script>
  
  <script>
    // Initialize the voice widget
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
      }
    });
  </script>
</body>
</html>
```

#### Option B: React Component

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
    />
  );
}
```

#### Option C: Vanilla JavaScript

```javascript
import { VoiceSDK } from 'ttp-agent-sdk';

const voiceSDK = new VoiceSDK({
        websocketUrl: 'wss://speech.talktopc.com/ws/conv',
  agentId: 'your_agent_id',
  appId: 'your_app_id'
});

// Connect and start recording
await voiceSDK.connect();
await voiceSDK.startRecording();
```

## Authentication Methods

### Method 1: Direct Agent ID (Development)

For development and testing, you can use direct agent ID authentication:

```javascript
const voiceSDK = new VoiceSDK({
        websocketUrl: 'wss://speech.talktopc.com/ws/conv',
  agentId: 'your_agent_id',  // Direct agent ID
  appId: 'your_app_id'       // User's app ID
});
```

**Note**: This method is unsecured as the agent ID is visible in network traffic.

### Method 2: Signed Link (Production)

For production applications, use signed link authentication:

```javascript
const voiceSDK = new VoiceSDK({
  websocketUrl: 'wss://speech.bidme.co.il/ws/conv?signed_token=eyJ...'
  // No agentId needed - server validates signed token
});
```

To get a signed URL from your backend:

```javascript
async function getSignedUrl(agentId, variables = {}) {
  const response = await fetch('/api/get-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, variables })
  });
  const data = await response.json();
  return data.signedUrl;
}
```

## Configuration Options

### VoiceSDK Configuration

```javascript
const voiceSDK = new VoiceSDK({
        websocketUrl: 'wss://speech.talktopc.com/ws/conv', // Required
  agentId: 'agent_12345',                           // Optional - for direct access
  appId: 'app_67890',                               // Optional - user's app ID
  ttpId: 'ttp_abc123',                              // Optional - custom TTP ID
  voice: 'default',                                 // Optional - voice selection
  language: 'en',                                   // Optional - language code
  sampleRate: 16000,                                // Optional - audio sample rate
  autoReconnect: true                               // Optional - auto-reconnect
});
```

### Widget Configuration

```javascript
TTPAgentSDK.AgentWidget.init({
  agentId: 'your_agent_id',           // Required
  getSessionUrl: 'https://...',       // Required - URL or function
  variables: {                        // Optional - dynamic variables
    userName: 'John Doe',
    page: 'homepage'
  },
  position: 'bottom-right',           // Optional - widget position
  primaryColor: '#4F46E5'            // Optional - theme color
});
```

## Event Handling

The SDK provides comprehensive event handling:

```javascript
voiceSDK.on('connected', () => {
  console.log('Connected to voice agent');
});

voiceSDK.on('disconnected', () => {
  console.log('Disconnected from voice agent');
});

voiceSDK.on('recordingStarted', () => {
  console.log('Recording started');
});

voiceSDK.on('recordingStopped', () => {
  console.log('Recording stopped');
});

voiceSDK.on('playbackStarted', () => {
  console.log('Agent is speaking');
});

voiceSDK.on('playbackStopped', () => {
  console.log('Agent finished speaking');
});

voiceSDK.on('message', (message) => {
  if (message.type === 'agent_response') {
    console.log('Agent response:', message.agent_response);
  } else if (message.type === 'user_transcript') {
    console.log('User said:', message.user_transcription);
  }
});

voiceSDK.on('error', (error) => {
  console.error('VoiceSDK Error:', error);
});
```

## Backend Integration

### Required Backend Endpoint

Your backend needs to provide a session endpoint that returns a signed WebSocket URL:

```javascript
// Example Express.js endpoint
app.post('/api/get-session', async (req, res) => {
  const { agentId, variables } = req.body;
  
  // Validate user authentication
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Generate signed URL
  const signedUrl = await generateSignedUrl({
    agentId,
    userId: user.id,
    appId: user.appId,
    variables
  });
  
  res.json({ signedUrl });
});
```

### Signed URL Generation

The signed URL should contain a JWT token with the following claims:

```javascript
const jwt = require('jsonwebtoken');

function generateSignedUrl({ agentId, userId, appId, variables }) {
  const token = jwt.sign({
    agentId,
    userId,
    appId,
    variables,
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
  }, process.env.CONVERSATION_SECRET_KEY);
  
  return `wss://speech.bidme.co.il/ws/conv?signed_token=${token}`;
}
```

## Examples

### Complete React Example

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { VoiceSDK } from 'ttp-agent-sdk';

function VoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const voiceSDKRef = useRef(null);

  useEffect(() => {
    const voiceSDK = new VoiceSDK({
        websocketUrl: 'wss://speech.talktopc.com/ws/conv',
      agentId: 'your_agent_id',
      appId: 'your_app_id'
    });

    voiceSDK.on('connected', () => setIsConnected(true));
    voiceSDK.on('disconnected', () => setIsConnected(false));
    voiceSDK.on('recordingStarted', () => setIsRecording(true));
    voiceSDK.on('recordingStopped', () => setIsRecording(false));
    voiceSDK.on('message', (message) => {
      if (message.type === 'agent_response') {
        setMessages(prev => [...prev, { type: 'agent', text: message.agent_response }]);
      }
    });

    voiceSDKRef.current = voiceSDK;

    return () => voiceSDK.destroy();
  }, []);

  const handleConnect = async () => {
    await voiceSDKRef.current.connect();
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      await voiceSDKRef.current.stopRecording();
    } else {
      await voiceSDKRef.current.startRecording();
    }
  };

  return (
    <div>
      <button onClick={handleConnect} disabled={isConnected}>
        Connect
      </button>
      <button onClick={handleToggleRecording} disabled={!isConnected}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg.type}: {msg.text}</div>
        ))}
      </div>
    </div>
  );
}
```

### Complete Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Voice Chat</title>
</head>
<body>
  <button id="connectBtn">Connect</button>
  <button id="recordBtn" disabled>Start Recording</button>
  <div id="messages"></div>

  <script type="module">
    import { VoiceSDK } from 'https://unpkg.com/ttp-agent-sdk/dist/agent-widget.js';

    const voiceSDK = new VoiceSDK({
        websocketUrl: 'wss://speech.talktopc.com/ws/conv',
      agentId: 'your_agent_id',
      appId: 'your_app_id'
    });

    let isRecording = false;

    voiceSDK.on('connected', () => {
      document.getElementById('connectBtn').disabled = true;
      document.getElementById('recordBtn').disabled = false;
    });

    voiceSDK.on('recordingStarted', () => {
      isRecording = true;
      document.getElementById('recordBtn').textContent = 'Stop Recording';
    });

    voiceSDK.on('recordingStopped', () => {
      isRecording = false;
      document.getElementById('recordBtn').textContent = 'Start Recording';
    });

    voiceSDK.on('message', (message) => {
      if (message.type === 'agent_response') {
        addMessage('Agent', message.agent_response);
      }
    });

    document.getElementById('connectBtn').onclick = () => voiceSDK.connect();
    document.getElementById('recordBtn').onclick = () => {
      if (isRecording) {
        voiceSDK.stopRecording();
      } else {
        voiceSDK.startRecording();
      }
    };

    function addMessage(sender, text) {
      const div = document.createElement('div');
      div.textContent = `${sender}: ${text}`;
      document.getElementById('messages').appendChild(div);
    }
  </script>
</body>
</html>
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if the WebSocket URL is correct
   - Verify agent ID and app ID are valid
   - Ensure backend is running and accessible

2. **Microphone Access Denied**
   - Request microphone permission in browser
   - Use HTTPS in production (required for microphone access)

3. **Audio Not Playing**
   - Check browser audio settings
   - Ensure Web Audio API is supported
   - Verify audio format compatibility

4. **Authentication Errors**
   - Verify signed token is valid and not expired
   - Check secret key configuration
   - Ensure agent ID exists in backend

### Debug Mode

Enable debug logging:

```javascript
const voiceSDK = new VoiceSDK({
  // ... config
  debug: true  // Enable debug logging
});
```

## Browser Support

- Chrome 66+
- Firefox 60+
- Safari 11.1+
- Edge 79+

## Next Steps

- Check out the [examples](./examples/) directory for more complete examples
- Read the [API Reference](./README.md#api-reference) for detailed documentation
- Join our community for support and updates

## Support

For support and questions:
- Open an issue on GitHub
- Contact our support team
- Check the documentation
