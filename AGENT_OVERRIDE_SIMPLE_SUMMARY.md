# Agent Settings Override - Simple Summary

## What Was Implemented

The ability to dynamically override agent configuration at runtime when connecting via signed URLs.

---

## How It Works (3 Simple Steps)

### Step 1: JWT Token Contains Permission
When generating a signed URL, the UI backend can include `allowOverride: true` in the JWT token.

```javascript
// JWT contains:
{
  agentId: "agent_123",
  appId: "app_456",
  ttpId: "user_789",
  allowOverride: true,  // ← Permission to override
  exp: 1699999999       // ← Token expiration (TTL)
}
```

### Step 2: WebSocket Authentication Stores Permission
When the frontend connects to the WebSocket, the authenticator:
1. Validates the JWT (signature, expiration, claims)
2. Extracts `allowOverride` from the JWT
3. Stores it in the session: `session.attributes.put("allowOverride", true)`

### Step 3: Hello Message Applies Overrides
When the SDK sends the hello message with overrides:
```javascript
{
  t: "hello",
  appId: "app_456",
  agentSettingsOverride: {
    prompt: "Custom greeting...",
    temperature: 0.8,
    selectedVoice: "nova"
  }
}
```

The backend:
1. Gets `allowOverride` from session (stored in Step 2)
2. If `allowOverride == true`: Apply overrides to ConversationState
3. If `allowOverride == false/null`: Reject with warning log

---

## Security

- **Permission Required**: Override only works if JWT has `allowOverride: true`
- **JWT Validation**: Full signature and expiration checking
- **TTL Control**: Token validity controlled by expiration time
- **No Redis Needed**: Uses JWT built-in expiration (no one-time use tracking)

---

## What Can Be Overridden

**Core Settings:**
- `prompt`, `temperature`, `maxTokens`, `model`, `language`

**Voice Settings:**
- `selectedVoice`, `voiceId`, `voiceSpeed`

**Behavior:**
- `firstMessage`, `disableInterruptions`, `autoDetectLanguage`, `maxCallDuration`

**Advanced:**
- `timezone`

---

## Files Changed

1. **JwtTokenUtil.java** - Extract `allowOverride` from JWT
2. **ConversationWebSocketAuthenticator.java** - Store `allowOverride` in session
3. **ControlMessage.java** - Receive `agentSettingsOverride` from SDK
4. **ConversationWsHandler.java** - Apply overrides if permission granted

---

## What the UI Backend Needs to Do

Add `allowOverride` claim to JWT when generating signed URLs:

```java
// When generating JWT for signed URL:
Map<String, Object> claims = new HashMap<>();
claims.put("agentId", agentId);
claims.put("ttpId", ttpId);
claims.put("appId", appId);
claims.put("tokenType", "conversation_websocket");

// Add this if override is requested:
if (requestedAllowOverride) {
    claims.put("allowOverride", true);
}

String jwt = jwtTokenUtil.generateToken(secretKey, agentId, ttpId, appId, expirationMs);
```

That's it! No JTI, no Redis, just a simple boolean claim.

---

## Example Usage

```javascript
// Frontend SDK usage:
const voiceSDK = new VoiceSDK({
  websocketUrl: signedUrl,  // Contains JWT with allowOverride=true
  appId: 'app_456',
  agentId: 'agent_123',
  agentSettingsOverride: {
    prompt: 'You are a helpful customer service agent...',
    temperature: 0.7,
    selectedVoice: 'nova'
  }
});

await voiceSDK.connect();
// Overrides are sent in hello message and applied automatically
```

---

## Testing

1. ✅ **Without permission**: SDK sends overrides, backend rejects (logs warning)
2. ✅ **With permission**: SDK sends overrides, backend applies successfully
3. ✅ **Expired token**: Connection rejected (JWT expired)
4. ✅ **Token reuse**: Works fine (until TTL expires)

---

## Key Difference from Original Plan

**Original Plan:**
- One-time use enforcement with JTI + Redis
- Each token can only be used once

**Simplified Implementation:**
- No JTI, no Redis
- Token can be reused until TTL expires
- Simpler and easier to maintain

**Why Simplified?**
- JWT already has expiration (TTL) built-in
- No need for UI backend to generate JTI
- No Redis dependency for token tracking
- Still secure with proper TTL settings

---

## Summary

✅ **Secure**: Permission-based with JWT validation  
✅ **Simple**: No Redis, no JTI, just boolean claim  
✅ **Complete**: All agent settings can be overridden  
✅ **Ready**: Backend implementation complete, UI backend just needs to add `allowOverride` to JWT

