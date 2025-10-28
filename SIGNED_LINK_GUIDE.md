# TTP Agent SDK - Signed Link Authentication Guide

## 🔐 Understanding Signed Links

Signed links provide **secure, production-ready authentication** for your voice agents. Your **UI backend** generates secure, time-limited URLs that the widget uses to connect to the **conversation backend**.

## 🏗️ Architecture Overview

```
User's Frontend → User's Backend → TTP UI Backend → TTP Conversation Backend
      ↓               ↓               ↓                    ↓
   Requests        Requests        Generates           Handles
   signed URL      signed URL      signed URL          conversation
      ↑               ↑               ↑                    ↑
   Receives        Receives        Returns             Validates
   signed URL      signed URL      signed URL          signed token
```

**The complete flow:**
1. **User's Frontend** → requests signed URL from **User's Backend**
2. **User's Backend** → requests signed URL from **TTP UI Backend** (`/api/public/agents`)
3. **TTP UI Backend** → generates signed URL and returns to **User's Backend**
4. **User's Backend** → returns signed URL to **User's Frontend**
5. **User's Frontend** → connects directly to **TTP Conversation Backend** using signed URL

## 🎯 Why Use Signed Links?

### ❌ **Direct Agent ID (Insecure)**
```javascript
// DON'T DO THIS IN PRODUCTION
new EnhancedAgentWidget({
  agentId: 'agent_12345', // ❌ Visible in network traffic
  websocketUrl: 'wss://speech.talktopc.com/ws/conv'
});
```

**Problems:**
- Agent ID exposed in browser network tab
- No cost control
- No user-specific permissions
- Security risk

### ✅ **Signed Link (Secure)**
```javascript
// PRODUCTION-READY APPROACH
new EnhancedAgentWidget({
  agentId: 'agent_12345',
  getSessionUrl: async ({ agentId, variables }) => {
    // User's Frontend calls User's Backend
    const response = await fetch('/api/get-voice-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, variables })
    });
    const data = await response.json();
    return data.signedUrl; // ✅ Secure, time-limited URL from TTP
  }
});
```

**Benefits:**
- ✅ Secure authentication
- ✅ Cost control per user
- ✅ User-specific permissions
- ✅ Time-limited access
- ✅ Production-ready

## 🏗️ Implementation Guide

### Step 1: User's Backend Implementation

Your user's backend should have an endpoint that requests signed URLs from TTP:

```javascript
// User's Backend (Node.js example)
app.post('/api/get-voice-session', async (req, res) => {
  try {
    const { agentId, variables } = req.body;
    
    // Validate user authentication
    const user = await validateUser(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Request signed URL from TTP UI Backend
    const ttpResponse = await fetch('https://backend.talktopc.com/api/public/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TTP_API_KEY}` // Your TTP API key
      },
      body: JSON.stringify({
        agentId,
        variables: {
          ...variables,
          userId: user.id,
          userEmail: user.email
        }
      })
    });
    
    if (!ttpResponse.ok) {
      throw new Error(`TTP API error: ${ttpResponse.status}`);
    }
    
    const ttpData = await ttpResponse.json();
    
    // Return signed URL to user's frontend
    res.json({
      signedUrl: ttpData.signedUrl
    });
    
  } catch (error) {
    console.error('Failed to get signed URL from TTP:', error);
    res.status(500).json({ error: 'Failed to get voice session' });
  }
});
```

### Step 2: User's Frontend Integration

```javascript
import { EnhancedAgentWidget } from 'ttp-agent-sdk';

new EnhancedAgentWidget({
  agentId: 'your_agent_id',
  
  // User's Frontend calls User's Backend
  getSessionUrl: async ({ agentId, variables }) => {
    try {
      const response = await fetch('/api/get-voice-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}` // User's auth token
        },
        body: JSON.stringify({
          agentId,
          variables: {
            ...variables,
            page: 'homepage',
            userType: 'customer'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Your backend responded with ${response.status}`);
      }

      const data = await response.json();
      return data.signedUrl; // This connects directly to TTP Conversation Backend
      
    } catch (error) {
      console.error('Failed to get signed URL from your backend:', error);
      throw error;
    }
  },
  
  variables: {
    page: 'homepage',
    userType: 'customer',
    language: 'en'
  }
});
```

## 🔧 Your Current Implementation

Based on your setup, you're already using this pattern:

```javascript
// Your current LandingPageWidget.jsx
getSessionUrl: async ({ agentId, variables }) => {
  const response = await fetch(buildApiUrl('/api/landing/signed-url'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: agentId,
      variables: variables,
      page: 'landing',
      userType: 'visitor'
    })
  });
  
  const data = await response.json();
  return data.signedUrl; // This connects to conversation backend
}
```

## 🎯 Key Points

1. **UI Backend** (`/api/landing/signed-url`):
   - Handles authentication
   - Generates signed URLs
   - Manages user permissions
   - Controls costs

2. **Conversation Backend** (`wss://speech.talktopc.com/ws/conv`):
   - Validates signed tokens
   - Handles voice conversations
   - Processes audio streams

3. **Frontend Widget**:
   - Requests signed URL from UI backend
   - Connects to conversation backend using signed URL
   - Never exposes agent IDs directly

## 🚀 Production Benefits

- **Security**: Agent IDs never exposed in frontend
- **Separation**: UI logic separate from conversation logic
- **Scalability**: Each backend can scale independently
- **Control**: UI backend controls access and permissions
- **Monitoring**: Track usage and costs at UI backend level

This architecture ensures your voice agents are secure, scalable, and production-ready! 🎤✨
