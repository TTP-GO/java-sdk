# Agent Settings Override Feature - Implementation Plan

## 📋 Overview

This feature allows SDK users to override agent settings dynamically when using **signed link authentication only**. This ensures security while providing flexibility for customization.

## 🎯 Goals

1. Allow dynamic agent configuration override through the SDK
2. **ONLY** allow overrides when using signed links (secured authentication)
3. Prevent overrides when using direct agent ID (unsecured authentication)
4. Ensure signed links are **one-time use** and **time-limited (1 hour)**
5. Maintain backward compatibility with existing implementations

## 🔑 Key Security Features

### 1. Two-Step Process
- **Step 1**: User requests signed URL from their backend (which gets it from TTP backend)
- **Step 2**: User connects with SDK using the signed URL
- Overrides are embedded in JWT token, not passed directly to SDK

### 2. One-Time Use Token
- Each signed link can only be used **once**
- Token ID (`jti`) is tracked in Redis
- Status: `unused` → `used` (cannot go back)
- Prevents replay attacks even if URL is intercepted

### 3. Time-Limited (1 Hour)
- Signed link expires after 1 hour
- Redis TTL automatically cleans up expired tokens
- Must request new link for new session

### 4. Backend Validation & Sanitization
- User's backend authenticates the user
- TTP UI backend validates agent access
- TTP UI backend sanitizes override values (range checks, whitelist)
- TTP Conversation backend validates JWT and one-time use

## 🛡️ One-Time Use Token Flow

**Why Redis?** The JWT already contains all data (jti, agentId, userId, allowOverride, exp). Redis is ONLY used to track one-time use - preventing the same JWT from being used twice.

```
Token Generation (UI Backend):
┌─────────────────────────────────────┐
│ 1. Generate UUID token ID (jti)    │
│ 2. Store ONLY jti in Redis:        │
│    Key: "ws_token:{jti}"            │
│    Value: "unused"                  │
│    TTL: 1 hour (same as JWT exp)   │
│ 3. Create JWT with:                │
│    - jti, agentId, userId           │
│    - allowOverride: true            │
│    - exp: 1 hour                    │
│ 4. Return signed URL with JWT      │
└─────────────────────────────────────┘

Token Validation (Conversation Backend):
┌─────────────────────────────────────┐
│ 1. Validate JWT signature & exp    │
│    (JWT has all auth data)          │
│ 2. Extract jti from JWT             │
│ 3. Check Redis: "ws_token:{jti}"   │
│    Purpose: One-time use check      │
│    ├─ NULL → Token expired/invalid │
│    ├─ "used" → Token already used  │
│    └─ "unused" → ✅ Valid!         │
│ 4. Update Redis: "used" (atomic)   │
│ 5. Use JWT data (allowOverride,    │
│    agentId, userId) for session    │
└─────────────────────────────────────┘

Second Connection Attempt (REJECTED):
┌─────────────────────────────────────┐
│ 1. JWT is still valid (< 1 hour)   │
│ 2. Extract jti from JWT             │
│ 3. Check Redis: "ws_token:{jti}"   │
│    Value: "used" ❌                 │
│ 4. REJECT: "Token already used"    │
│ 5. Close WebSocket connection       │
│                                     │
│ Note: JWT itself is valid, but      │
│ one-time use is enforced via Redis │
└─────────────────────────────────────┘
```

**Key Point:** JWT stores authentication/authorization data. Redis ONLY tracks whether the token has been used (one-time use enforcement).

---

## 🏗️ Architecture Overview

### **Step 1: Obtain Signed Link (Authentication Only)**

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER'S FRONTEND                               │
├──────────────────────────────────────────────────────────────────┤
│  User clicks "Start Voice Chat" button                           │
│  React App requests signed URL:                                  │
│  - agentId: "agent_123"                                          │
│  - NO overrides at this stage                                   │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ↓ POST /api/get-voice-session
┌──────────────────────────────────────────────────────────────────┐
│                    USER'S BACKEND API                            │
├──────────────────────────────────────────────────────────────────┤
│  - Authenticates the user                                        │
│  - Calls TTP UI Backend using API key                           │
│  - Returns signed URL to frontend                               │
│                                                                  │
│  (Implementation details left to user)                          │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ↓ POST /api/public/agents/signed-url
┌──────────────────────────────────────────────────────────────────┐
│                      TTP UI BACKEND                              │
│              (smartTerminalServerJava/smart)                     │
├──────────────────────────────────────────────────────────────────┤
│  1. Validates agentId exists in database                         │
│  2. Validates user has permission for this agent                │
│  3. Generates unique session token ID (for one-time use)        │
│  4. Stores token ID in Redis with TTL=1 hour                    │
│  5. Creates JWT token with:                                      │
│     * jti: unique token ID (for one-time use tracking)          │
│     * agentId: "agent_123"                                       │
│     * userId: "user_456"                                         │
│     * allowOverride: true (permission flag)                     │
│     * iat: issued at timestamp                                  │
│     * exp: expires in 1 hour                                    │
│  6. Returns signed WebSocket URL                                │
│                                                                  │
│  Note: NO agent overrides in JWT - just authentication!         │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ↓ Returns: { signedUrl: "wss://...?signed_token=eyJ..." }
┌──────────────────────────────────────────────────────────────────┐
│                    USER'S BACKEND API                            │
├──────────────────────────────────────────────────────────────────┤
│  Returns signed URL to frontend                                  │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ↓ Returns signed URL
┌──────────────────────────────────────────────────────────────────┐
│                    USER'S FRONTEND                               │
├──────────────────────────────────────────────────────────────────┤
│  Receives signed URL: "wss://speech.talktopc.com/ws/conv?..."   │
│  Signed URL is valid for 1 hour, one-time use only              │
│  Now ready to use SDK with this signed URL + overrides          │
└──────────────────────────────────────────────────────────────────┘
```

### **Step 2: Use SDK with Signed Link + Agent Overrides**

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER'S FRONTEND (SDK)                         │
├──────────────────────────────────────────────────────────────────┤
│  const voiceSDK = new VoiceSDK({                                 │
│    websocketUrl: signedUrl,  // Signed URL from Step 1          │
│    agentSettingsOverride: {  // NEW: Overrides sent separately  │
│      prompt: "You are a Spanish assistant",                     │
│      language: "es",                                            │
│      temperature: 0.9                                           │
│    }                                                            │
│  });                                                             │
│  await voiceSDK.connect();                                       │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ↓ WebSocket connection to signed URL
┌──────────────────────────────────────────────────────────────────┐
│                  TTP CONVERSATION BACKEND                        │
│                (smartTerminalJavaFlux)                           │
├──────────────────────────────────────────────────────────────────┤
│  WebSocket /ws/conv Handler:                                     │
│                                                                  │
│  [Connection Phase]                                              │
│  1. Extracts signed_token from query parameters                  │
│  2. Validates JWT token signature & expiration                  │
│  3. Extracts jti (token ID) from JWT                            │
│  4. Checks Redis if token was already used:                     │
│     - If used: REJECT connection immediately                    │
│     - If not used: Mark as "used" in Redis (atomic)            │
│  5. Extracts allowOverride flag from JWT token                  │
│  6. Stores authentication info in session                       │
│  7. Connection established ✅                                    │
│                                                                  │
│  [First Message Phase]                                           │
│  8. Receives "hello" message from SDK with:                     │
│     - appId or ttpId                                           │
│     - agentSettingsOverride (NEW)                              │
│  9. Validates if allowOverride=true in JWT:                     │
│     - If yes: Accept and validate overrides                    │
│     - If no: Reject overrides (direct agent ID connection)     │
│  10. Loads agent base configuration from Redis                   │
│  11. IF allowOverride=true AND overrides provided:              │
│      - Validate & sanitize override values                     │
│      - Merge overrides with base config                        │
│  12. Start conversation with merged configuration                │
│                                                                  │
│  ⚠️ If token already used: Connection rejected                   │
│  ⚠️ If allowOverride=false: Overrides ignored                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Model

### ✅ Allowed: Signed Link + Agent Overrides (Separate)

**Step 1: Obtain Signed Link (Authentication Only)**
```javascript
// User's frontend - Request signed URL from their backend
// Your backend should call TTP UI Backend using your API key
async function getSignedUrl(agentId) {
  const response = await fetch('/api/get-voice-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: agentId })
  });
  
  const data = await response.json();
  return data.signedUrl; // e.g., "wss://speech.talktopc.com/ws/conv?signed_token=eyJ..."
}

// Obtain the signed link FIRST (just for authentication)
const signedUrl = await getSignedUrl('agent_123');
```

**Your Backend Responsibility:**
- Authenticate the user (however you choose)
- Call TTP UI Backend `/api/public/agents/signed-url` using your API key
- Return the signed URL to your frontend

**Step 2: Use SDK with Signed Link + Overrides**
```javascript
// Now use the signed URL + provide overrides in SDK
const voiceSDK = new VoiceSDK({
  websocketUrl: signedUrl,  // Signed URL for authentication
  agentSettingsOverride: {  // Overrides sent separately via WebSocket
    prompt: "You are a Spanish customer support agent",
    language: "es",
    temperature: 0.8
  }
});

await voiceSDK.connect();  // Overrides sent in "hello" message
await voiceSDK.startRecording();
```

**Why secure?**
- Your backend authenticates the user and uses API key to get signed link
- TTP UI backend validates agent exists and returns signed JWT
- JWT token is signed and time-limited (1 hour)
- **ONE-TIME USE**: Token can only be used once (tracked in Redis by jti)
- JWT contains `allowOverride: true` permission flag
- Conversation backend validates JWT signature, expiration, and one-time use
- Conversation backend checks `allowOverride` before accepting overrides from WebSocket
- Backend validates & sanitizes override values (whitelist + range checks)
- Direct agent ID connections have `allowOverride: false` (overrides rejected)
- Even if signed link is intercepted, it can only be used once

### ❌ Blocked: Direct Agent ID Authentication
```javascript
// Direct agent ID (unsecured)
const voiceSDK = new VoiceSDK({
  websocketUrl: 'wss://speech.talktopc.com/ws/conv',
  agentId: 'agent_123',
  appId: 'app_456',
  agentSettingsOverride: {  // ❌ Will be REJECTED by backend
    prompt: "Malicious prompt"
  }
});

// The overrides CAN be provided in SDK config, but backend will REJECT them
// because the JWT token has allowOverride: false (no signed link)
```

**Why blocked?**
- No authentication/authorization
- JWT token (if any) has `allowOverride: false`
- Conversation backend checks `allowOverride` flag before accepting overrides
- Direct connections always have `allowOverride: false`
- Backend rejects overrides and logs a warning
- Conversation uses base agent configuration only

**Security enforcement:**
The conversation backend checks the `allowOverride` flag from the JWT token BEFORE accepting any overrides from the WebSocket message. Direct agent ID connections don't have this flag (or have it set to false), so overrides are automatically rejected.

---

## 📦 Agent Settings That Can Be Overridden

Based on Redis agent configuration, these fields can be overridden:

### Core Settings
- ✅ `prompt` (systemPrompt) - The system prompt for the agent
- ✅ `temperature` - LLM temperature (0.0 - 2.0)
- ✅ `maxTokens` - Maximum tokens per response
- ✅ `model` (selectedLLM) - LLM model selection
- ✅ `language` (agentLanguage) - Agent language (e.g., "en", "es", "fr")
- ✅ `selectedVoice` - Voice selection (e.g., "male", "female")
- ✅ `voiceId` - Specific voice ID
- ✅ `voiceSpeed` - Voice speed (0.5 - 2.0)
- ✅ `timezone` (selectedTimezone) - Timezone for the agent

### Behavior Settings
- ✅ `firstMessage` - Custom first message
- ✅ `disableInterruptions` - Disable user interruptions (boolean)
- ✅ `autoDetectLanguage` - Auto-detect user language (boolean)
- ✅ `maxCallDuration` - Maximum call duration in seconds

### Advanced Settings
- ✅ `selectedTools` - Available tools/functions for the agent
- ❌ `allowedDomains` - **NOT ALLOWED** (security setting, cannot be overridden)
- ❌ `greeting` - **NOT ALLOWED** (audio data, too large for token)
- ❌ `agentId` - **NOT ALLOWED** (immutable)
- ❌ `ttpId` - **NOT ALLOWED** (immutable)
- ❌ `isActive` - **NOT ALLOWED** (security setting)

---

## 🛠️ Implementation Steps

### Phase 1: SDK Changes (ttp-agent-sdk)

#### 1.1 Update VoiceSDK to Accept and Send Overrides
**File:** `src/core/VoiceSDK.js`

Add `agentSettingsOverride` config option and send it in the hello message:

```javascript
constructor(config = {}) {
  super();
  
  this.config = {
    websocketUrl: config.websocketUrl || 'wss://speech.talktopc.com/ws/conv',
    agentId: config.agentId,  // Optional - not needed if using signed link
    appId: config.appId,      // Required for hello message
    voice: config.voice || 'default',
    language: config.language || 'en',
    sampleRate: config.sampleRate || 16000,
    
    // NEW: Agent settings override (sent via WebSocket message)
    agentSettingsOverride: config.agentSettingsOverride || null,
    
    ...config
  };
  // ... rest stays the same
}
```

#### 1.2 Update Hello Message to Include Overrides
**File:** `src/core/VoiceSDK.js`

Modify the `sendHelloMessage()` method to include overrides:

```javascript
sendHelloMessage() {
  if (!this.isConnected) {
    console.warn('VoiceSDK: Cannot send hello message - not connected');
    return;
  }

  const helloMessage = {
    t: "hello"
  };

  // appId is REQUIRED - no fallback
  if (!this.config.appId) {
    const error = new Error('appId is required for connection');
    console.error('VoiceSDK: Failed to send hello message:', error);
    this.emit('error', error);
    return;
  }
  
  helloMessage.appId = this.config.appId;

  // NEW: Include agent settings override if provided
  if (this.config.agentSettingsOverride && 
      Object.keys(this.config.agentSettingsOverride).length > 0) {
    helloMessage.agentSettingsOverride = this.config.agentSettingsOverride;
    console.log('🔧 VoiceSDK: Sending agent settings override:', 
      Object.keys(this.config.agentSettingsOverride));
  }

  try {
    this.webSocketManager.sendMessage(helloMessage);
  } catch (error) {
    console.error('VoiceSDK: Failed to send hello message:', error);
    this.emit('error', error);
  }
}
```

**What changed:**
- Added `agentSettingsOverride` config option
- Removed `ttpId` - no longer supported
- `appId` is now REQUIRED - no fallback to ttpId or generated ID
- If `appId` is not provided, SDK will emit error and fail to send hello message
- Included overrides in the "hello" message sent to backend
- Backend will validate `allowOverride` flag before accepting

#### 1.3 Update React VoiceButton Component
**File:** `src/react/VoiceButton.jsx`

Add `agentSettingsOverride` prop:

```javascript
const VoiceButton = ({ 
  websocketUrl,
  agentId,
  voice = 'default',
  language = 'en',
  autoReconnect = true,
  
  // NEW: Agent settings override
  agentSettingsOverride = null,
  
  onConnected,
  onDisconnected,
  // ... other props
}) => {
  // ... state hooks
  
  useEffect(() => {
    const voiceSDK = new VoiceSDK({
      websocketUrl,
      agentId,
      voice,
      language,
      autoReconnect,
      agentSettingsOverride  // Pass through to SDK
    });
    
    // ... rest of setup
  }, [websocketUrl, agentId, voice, language, agentSettingsOverride]);
  
  // ... rest of component
};
```

#### 1.4 Update Documentation
**File:** `README.md`

Add new section explaining the two-step process:

```markdown
## Dynamic Agent Settings Override (Secured with Signed Links)

To override agent settings, you must use signed links obtained from your backend:

### Step 1: Obtain Signed URL from Your Backend

```javascript
// Your frontend requests a signed URL from YOUR backend
async function getSignedUrl(agentId, overrides) {
  const response = await fetch('/api/get-voice-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourUserToken}`
    },
    body: JSON.stringify({
      agentId: agentId,
      agentSettingsOverride: overrides  // Settings you want to override
    })
  });
  
  const data = await response.json();
  return data.signedUrl;  // This URL is valid for 1 hour, one-time use
}

// Get the signed URL with your overrides
const signedUrl = await getSignedUrl('agent_123', {
  prompt: "You are a helpful Spanish assistant",
  language: "es",
  temperature: 0.9,
  voiceSpeed: 1.2
});
```

### Step 2: Use the Signed URL with SDK

```javascript
import { VoiceSDK } from 'ttp-agent-sdk';

// Use the signed URL you obtained in Step 1
const voiceSDK = new VoiceSDK({
  websocketUrl: signedUrl  // The complete signed URL with overrides in JWT
});

await voiceSDK.connect();
await voiceSDK.startRecording();
```

**Important:** 
- The signed URL is valid for **1 hour only**
- Each signed URL is **one-time use** (cannot be reused)
- All agent overrides are securely embedded in the JWT token
- Your backend controls what can be overridden
```

### Phase 2: UI Backend Changes (smartTerminalServerJava/smart)

#### 2.1 Update Signed URL Generation Endpoint
**File:** `com/smartTerminal/smart/PublicAgentController.java`

**Important:** Signed URL generation is ONLY for authentication - no overrides needed here!

```java
@PostMapping("/api/public/agents/signed-url")
public ResponseEntity<Map<String, Object>> generateSignedUrl(
        @RequestBody Map<String, Object> request,
        @RequestHeader(value = "Authorization", required = false) String authHeader) {
    
    try {
        String agentId = (String) request.get("agentId");
        String appId = (String) request.get("appId");
        Map<String, Object> variables = (Map<String, Object>) request.get("variables");
        
        // Validate agentId
        if (agentId == null || agentId.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "agentId is required"));
        }
        
        // TODO: Validate user has access to agent (implement your auth logic)
        // String userId = extractUserIdFromAuth(authHeader);
        // if (!userHasAccessToAgent(userId, agentId)) {
        //     return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        // }
        
        // Generate JWT token for authentication only
        // allowOverride flag is set to true if using signed link
        String signedUrl = conversationWebSocketService.generateSignedUrl(
            agentId, 
            appId, 
            variables
        );
        
        return ResponseEntity.ok(Map.of(
            "signedUrl", signedUrl,
            "agentId", agentId
        ));
        
    } catch (Exception e) {
        logger.error("Error generating signed URL: {}", e.getMessage(), e);
        return ResponseEntity.status(500)
            .body(Map.of("error", "Failed to generate signed URL"));
    }
}
```

**What changed:**
- Removed agent settings override handling from signed URL generation
- Signed URL is purely for authentication (contains only agentId, userId, jti, expiration)
- JWT includes `allowOverride: true` flag for signed link users
- Overrides are sent separately via SDK and validated in conversation backend

#### 2.2 Update Signed URL Generation Service
**File:** `com/smartTerminal/service/ConversationWebSocketService.java`

```java
/**
 * Generate signed URL for authentication only
 * Token is valid for 1 hour and ONE-TIME USE only
 * Agent overrides are sent separately via WebSocket, not in the token
 */
public String generateSignedUrl(
        String agentId,
        String appId,
        Map<String, Object> variables) {
    
    try {
        String secretKey = configProperties.getConversationSecretKey();
        String baseUrl = configProperties.getWebsocketBaseUrl();
        
        if (secretKey == null || secretKey.isEmpty()) {
            throw new IllegalStateException("CONVERSATION_SECRET_KEY not configured");
        }
        
        if (baseUrl == null || baseUrl.isEmpty()) {
            throw new IllegalStateException("WEBSOCKET_BASE_URL not configured");
        }
        
        // Generate unique token ID for one-time use tracking
        String tokenId = UUID.randomUUID().toString();
        
        // Store token ID in Redis with TTL of 1 hour (marks it as unused)
        String redisKey = "ws_token:" + tokenId;
        redisTemplate.opsForValue().set(redisKey, "unused", 1, TimeUnit.HOURS);
        logger.info("🔑 Generated one-time token ID: {}", tokenId);
        
        // Create JWT claims (authentication only)
        Map<String, Object> claims = new HashMap<>();
        claims.put("jti", tokenId);  // JWT ID for one-time use tracking
        claims.put("agentId", agentId);
        
        if (appId != null && !appId.isEmpty()) {
            claims.put("appId", appId);
        }
        
        if (variables != null && !variables.isEmpty()) {
            claims.put("variables", variables);
        }
        
        // Set allowOverride flag to true for signed link users
        // This allows them to send overrides via WebSocket
        claims.put("allowOverride", true);
        
        claims.put("tokenType", "conversation_websocket");
        claims.put("iss", "smart-terminal");
        claims.put("aud", "conversation-websocket");
        
        // Set expiration (1 hour)
        long expirationMs = 3600000; // 1 hour
        Date issuedAt = new Date();
        Date expiration = new Date(System.currentTimeMillis() + expirationMs);
        
        // Generate JWT token
        String token = Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(issuedAt)
            .setExpiration(expiration)
            .signWith(SignatureAlgorithm.HS256, secretKey.getBytes())
            .compact();
        
        // Build signed URL
        String signedUrl = baseUrl + "/ws/conv?signed_token=" + token;
        
        logger.info("✅ Generated one-time signed URL for agent {}, tokenId: {}, allowOverride: true, expires at: {}", 
            agentId, tokenId, expiration);
        
        return signedUrl;
        
    } catch (Exception e) {
        logger.error("❌ Error generating signed URL: {}", e.getMessage(), e);
        throw new RuntimeException("Failed to generate signed URL", e);
    }
}
```

**What changed:**
- Removed `agentSettingsOverride` parameter (not needed)
- JWT token contains only authentication data + `allowOverride: true` flag
- Overrides are sent separately via WebSocket "hello" message
- Conversation backend validates `allowOverride` before accepting overrides

### Phase 3: Conversation Backend Changes (smartTerminalJavaFlux)

#### 3.1 Update WebSocket Authentication
**File:** `com/smartterminal/auth/ConversationWebSocketAuthenticator.java`

```java
/**
 * Authenticate WebSocket connection
 * Returns authentication info including any agent settings overrides
 */
public Mono<Map<String, Object>> authenticate(ServerHttpRequest request) {
    
    // Extract signed token from query parameters
    String signedToken = extractQueryParam(request, "signed_token");
    
    if (signedToken != null && !signedToken.isEmpty()) {
        // Signed link authentication
        return authenticateSignedLink(signedToken, request);
    }
    
    // Fallback to direct agent ID (no overrides allowed)
    String agentId = extractQueryParam(request, "agentId");
    if (agentId != null && !agentId.isEmpty()) {
        return authenticateDirectAgentId(agentId, request);
    }
    
    // No authentication method found
    return Mono.error(new SecurityException("No authentication credentials provided"));
}

private Mono<Map<String, Object>> authenticateSignedLink(String token, ServerHttpRequest request) {
    try {
        // Validate JWT token signature and expiration
        Claims claims = Jwts.parser()
            .setSigningKey(conversationSecretKey.getBytes())
            .parseClaimsJws(token)
            .getBody();
        
        String agentId = claims.get("agentId", String.class);
        String userId = claims.get("userId", String.class);
        String tokenId = claims.get("jti", String.class);  // JWT ID for one-time use
        Boolean allowOverride = claims.get("allowOverride", Boolean.class);
        
        // Check if token has already been used (one-time use enforcement)
        if (tokenId != null && !tokenId.isEmpty()) {
            String redisKey = "ws_token:" + tokenId;
            
            // Check token status in Redis
            return reactiveRedisTemplate.opsForValue()
                .get(redisKey)
                .flatMap(tokenStatus -> {
                    if (tokenStatus == null) {
                        // Token doesn't exist in Redis (expired or never created)
                        logger.error("❌ Token expired or invalid: {}", tokenId);
                        return Mono.error(new SecurityException("Token expired or invalid"));
                    }
                    
                    if ("used".equals(tokenStatus)) {
                        // Token was already used - REJECT
                        logger.error("❌ Token already used (one-time use violation): {}", tokenId);
                        return Mono.error(new SecurityException("Token already used"));
                    }
                    
                    // Token is valid and unused - mark it as used (atomic operation)
                    return reactiveRedisTemplate.opsForValue()
                        .set(redisKey, "used", Duration.ofHours(1))
                        .flatMap(success -> {
                            if (!success) {
                                logger.error("❌ Failed to mark token as used: {}", tokenId);
                                return Mono.error(new SecurityException("Token validation failed"));
                            }
                            
                            logger.info("✅ Token marked as used: {}", tokenId);
                            
                            // Build auth info (authentication only)
                            Map<String, Object> authInfo = new HashMap<>();
                            authInfo.put("authenticated", true);
                            authInfo.put("authMethod", "signed_link");
                            authInfo.put("agentId", agentId);
                            authInfo.put("userId", userId);
                            authInfo.put("tokenId", tokenId);
                            authInfo.put("allowOverride", allowOverride != null && allowOverride);
                            
                            logger.info("✅ Signed link authentication successful for agent: {}, user: {}, tokenId: {}, allowOverride: {}", 
                                agentId, userId, tokenId, allowOverride);
                            
                            // Note: Agent overrides will be received later via WebSocket "hello" message
                            
                            return Mono.just(authInfo);
                        });
                })
                .switchIfEmpty(Mono.defer(() -> {
                    logger.error("❌ Token not found in Redis: {}", tokenId);
                    return Mono.error(new SecurityException("Token not found"));
                }));
        } else {
            // No token ID - legacy token without one-time use tracking
            logger.warn("⚠️ Token without jti (one-time use not enforced)");
            return Mono.error(new SecurityException("Invalid token format"));
        }
        
    } catch (JwtException e) {
        logger.error("❌ Invalid signed token: {}", e.getMessage());
        return Mono.error(new SecurityException("Invalid signed token"));
    }
}

private Mono<Map<String, Object>> authenticateDirectAgentId(String agentId, ServerHttpRequest request) {
    // Direct agent ID authentication - NO OVERRIDES ALLOWED
    
    Map<String, Object> authInfo = new HashMap<>();
    authInfo.put("authenticated", true);
    authInfo.put("authMethod", "direct_agent");
    authInfo.put("agentId", agentId);
    authInfo.put("allowOverride", false);  // IMPORTANT: No overrides with direct auth
    authInfo.put("agentSettingsOverride", null);
    
    logger.info("✅ Direct agent access for agent: {}", agentId);
    logger.warn("⚠️ Using unsecured direct agent access - overrides NOT allowed");
    
    return Mono.just(authInfo);
}
```

#### 3.2 Handle WebSocket Messages with Overrides
**File:** `com/smartterminal/ConversationWsHandler.java`

Add handler for "hello" message that includes overrides:

```java
/**
 * Handle incoming WebSocket messages
 * Processes "hello" message which may contain agent settings overrides
 */
private void handleIncomingMessage(WebSocketSession session, String messageText) {
    try {
        JsonNode message = objectMapper.readTree(messageText);
        String messageType = message.has("t") ? message.get("t").asText() : null;
        
        if ("hello".equals(messageType)) {
            handleHelloMessage(session, message);
        }
        // ... other message handlers
        
    } catch (Exception e) {
        logger.error("Error handling message: {}", e.getMessage());
    }
}

/**
 * Handle "hello" message from SDK
 * Extracts and validates agent settings overrides if provided
 */
private void handleHelloMessage(WebSocketSession session, JsonNode message) {
    // Check if overrides are allowed (from JWT authentication)
    Boolean allowOverride = (Boolean) session.getAttributes().get("allowOverride");
    
    // Extract overrides from message if present
    if (message.has("agentSettingsOverride")) {
        JsonNode overridesNode = message.get("agentSettingsOverride");
        
        if (allowOverride != null && allowOverride) {
            // Signed link user - overrides are allowed
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> overrides = objectMapper.convertValue(
                    overridesNode, 
                    new TypeReference<Map<String, Object>>() {}
                );
                
                // Validate and sanitize overrides
                Map<String, Object> validatedOverrides = validateAndSanitizeOverrides(overrides);
                
                // Store in session for later use
                session.getAttributes().put("agentSettingsOverride", validatedOverrides);
                
                logger.info("🔧 Received and validated {} agent setting overrides", 
                    validatedOverrides.size());
                
            } catch (Exception e) {
                logger.error("❌ Failed to parse agent settings overrides: {}", e.getMessage());
            }
        } else {
            // Direct agent ID user - overrides NOT allowed
            logger.warn("⚠️ Agent settings override rejected: allowOverride=false (direct agent ID connection)");
        }
    }
    
    // Continue with normal hello message processing...
}

/**
 * Validate and sanitize agent settings overrides
 * Removes disallowed fields and validates value ranges
 */
private Map<String, Object> validateAndSanitizeOverrides(Map<String, Object> overrides) {
    // Whitelist of allowed override fields
    Set<String> allowedFields = Set.of(
        "prompt", "temperature", "maxTokens", "model", "language",
        "selectedVoice", "voiceId", "voiceSpeed", "timezone",
        "firstMessage", "disableInterruptions", "autoDetectLanguage",
        "maxCallDuration", "selectedTools"
    );
    
    Map<String, Object> sanitized = new HashMap<>();
    
    for (Map.Entry<String, Object> entry : overrides.entrySet()) {
        String key = entry.getKey();
        Object value = entry.getValue();
        
        if (!allowedFields.contains(key)) {
            logger.warn("⚠️ Ignoring disallowed override field: {}", key);
            continue;
        }
        
        // Validate specific field ranges
        if ("temperature".equals(key) && value instanceof Number) {
            double temp = ((Number) value).doubleValue();
            if (temp < 0.0 || temp > 2.0) {
                logger.warn("⚠️ Invalid temperature {}, clamping to [0.0, 2.0]", temp);
                sanitized.put(key, Math.max(0.0, Math.min(2.0, temp)));
            } else {
                sanitized.put(key, value);
            }
        } else if ("maxTokens".equals(key) && value instanceof Number) {
            int tokens = ((Number) value).intValue();
            if (tokens < 1 || tokens > 4000) {
                logger.warn("⚠️ Invalid maxTokens {}, clamping to [1, 4000]", tokens);
                sanitized.put(key, Math.max(1, Math.min(4000, tokens)));
            } else {
                sanitized.put(key, value);
            }
        } else if ("voiceSpeed".equals(key) && value instanceof Number) {
            double speed = ((Number) value).doubleValue();
            if (speed < 0.5 || speed > 2.0) {
                logger.warn("⚠️ Invalid voiceSpeed {}, clamping to [0.5, 2.0]", speed);
                sanitized.put(key, Math.max(0.5, Math.min(2.0, speed)));
            } else {
                sanitized.put(key, value);
            }
        } else {
            // Other fields - accept as-is
            sanitized.put(key, value);
        }
    }
    
    return sanitized;
}
```

#### 3.3 Apply Overrides to Agent Configuration
**File:** `com/smartterminal/ConversationWsHandler.java`

```java
/**
 * Load agent configuration and apply overrides if present
 */
private Mono<Map<String, Object>> loadAgentConfiguration(WebSocketSession session, String agentId) {
    
    return redisAgentService.getAgentConfiguration(agentId)
        .map(baseConfig -> {
            
            // Check if overrides are present in session
            @SuppressWarnings("unchecked")
            Map<String, Object> overrides = 
                (Map<String, Object>) session.getAttributes().get("agentSettingsOverride");
            
            if (overrides != null && !overrides.isEmpty()) {
                // Merge overrides with base configuration
                Map<String, Object> mergedConfig = new HashMap<>(baseConfig);
                
                logger.info("🔧 Applying agent settings overrides for agent {}: {} fields", 
                    agentId, overrides.size());
                
                // Apply each override field
                for (Map.Entry<String, Object> entry : overrides.entrySet()) {
                    String field = entry.getKey();
                    Object value = entry.getValue();
                    
                    Object oldValue = baseConfig.get(field);
                    logger.debug("   Override: {} = {} (was: {})", field, value, oldValue);
                    
                    // Apply override (overwrite base config)
                    mergedConfig.put(field, value);
                }
                
                logger.info("✅ Agent configuration merged with {} overrides", overrides.size());
                return mergedConfig;
            }
            
            // No overrides - use base configuration
            logger.info("ℹ️ Using base agent configuration for agent {} (no overrides)", agentId);
            return baseConfig;
        })
        .doOnError(error -> {
            logger.error("❌ Failed to load agent configuration for {}: {}", 
                agentId, error.getMessage());
        });
}

@Override
public Mono<Void> handle(WebSocketSession session) {
    
    // Authenticate
    return authenticator.authenticate(session.getHandshakeInfo().getUri(), session)
        .flatMap(authInfo -> {
            // Store auth info in session attributes
            session.getAttributes().putAll(authInfo);
            
            String agentId = (String) authInfo.get("agentId");
            
            // Load agent configuration (with overrides if applicable)
            return loadAgentConfiguration(session, agentId)
                .flatMap(agentConfig -> {
                    // Store merged config in session
                    session.getAttributes().put("agentConfig", agentConfig);
                    
                    // Continue with conversation handling
                    return handleConversation(session, agentConfig);
                });
        })
        .onErrorResume(error -> {
            logger.error("Authentication or initialization failed: {}", error.getMessage());
            return session.close(CloseStatus.POLICY_VIOLATION);
        });
}
```

### Phase 4: Testing

#### 4.1 SDK Unit Tests
**File:** `tests/VoiceSDK.test.js`

```javascript
describe('VoiceSDK Agent Settings Override', () => {
  
  test('should send overrides in hello message', async () => {
    const mockSendMessage = jest.fn();
    
    const sdk = new VoiceSDK({
      websocketUrl: 'wss://speech.talktopc.com/ws/conv?signed_token=test',
      appId: 'app_123',  // Required
      agentSettingsOverride: {
        prompt: 'Test prompt',
        temperature: 0.8
      }
    });
    
    // Mock the sendMessage method
    sdk.webSocketManager.sendMessage = mockSendMessage;
    sdk.isConnected = true;
    
    sdk.sendHelloMessage();
    
    expect(mockSendMessage).toHaveBeenCalledWith({
      t: 'hello',
      appId: 'app_123',
      agentSettingsOverride: {
        prompt: 'Test prompt',
        temperature: 0.8
      }
    });
  });
  
  test('should not include overrides in hello message if not provided', async () => {
    const mockSendMessage = jest.fn();
    
    const sdk = new VoiceSDK({
      websocketUrl: 'wss://speech.talktopc.com/ws/conv?signed_token=test',
      appId: 'app_123'  // Required
    });
    
    // Mock the sendMessage method
    sdk.webSocketManager.sendMessage = mockSendMessage;
    sdk.isConnected = true;
    
    sdk.sendHelloMessage();
    
    const calledWith = mockSendMessage.mock.calls[0][0];
    expect(calledWith).toHaveProperty('appId', 'app_123');
    expect(calledWith).not.toHaveProperty('agentSettingsOverride');
  });
  
  test('should fail if appId is not provided', async () => {
    const mockEmit = jest.fn();
    
    const sdk = new VoiceSDK({
      websocketUrl: 'wss://speech.talktopc.com/ws/conv?signed_token=test'
      // No appId provided
    });
    
    sdk.emit = mockEmit;
    sdk.isConnected = true;
    
    sdk.sendHelloMessage();
    
    expect(mockEmit).toHaveBeenCalledWith('error', expect.any(Error));
    expect(mockEmit.mock.calls[0][1].message).toContain('appId is required');
  });
});
```

#### 4.2 Backend Integration Tests
**File:** `ConversationWsHandlerTest.java`

```java
@Test
public void testValidateAndSanitizeOverrides() {
    // Test allowed fields
    Map<String, Object> overrides = new HashMap<>();
    overrides.put("temperature", 0.9);  // allowed
    overrides.put("language", "es");  // allowed
    overrides.put("allowedDomains", List.of("evil.com"));  // NOT allowed
    overrides.put("agentId", "fake_agent");  // NOT allowed
    
    Map<String, Object> sanitized = handler.validateAndSanitizeOverrides(overrides);
    
    // Should keep allowed fields
    assertTrue(sanitized.containsKey("temperature"));
    assertTrue(sanitized.containsKey("language"));
    
    // Should remove disallowed fields
    assertFalse(sanitized.containsKey("allowedDomains"));
    assertFalse(sanitized.containsKey("agentId"));
}

@Test
public void testOverridesRejectedWithoutAllowOverride() {
    WebSocketSession session = mock(WebSocketSession.class);
    Map<String, Object> sessionAttributes = new HashMap<>();
    sessionAttributes.put("allowOverride", false);  // Direct agent ID connection
    
    when(session.getAttributes()).thenReturn(sessionAttributes);
    
    JsonNode message = objectMapper.createObjectNode()
        .put("t", "hello")
        .set("agentSettingsOverride", objectMapper.createObjectNode()
            .put("temperature", 0.9));
    
    handler.handleHelloMessage(session, message);
    
    // Should NOT store overrides in session
    assertFalse(sessionAttributes.containsKey("agentSettingsOverride"));
}

@Test
public void testOverridesAcceptedWithAllowOverride() {
    WebSocketSession session = mock(WebSocketSession.class);
    Map<String, Object> sessionAttributes = new HashMap<>();
    sessionAttributes.put("allowOverride", true);  // Signed link connection
    
    when(session.getAttributes()).thenReturn(sessionAttributes);
    
    JsonNode message = objectMapper.createObjectNode()
        .put("t", "hello")
        .set("agentSettingsOverride", objectMapper.createObjectNode()
            .put("temperature", 0.9)
            .put("language", "es"));
    
    handler.handleHelloMessage(session, message);
    
    // Should store overrides in session
    assertTrue(sessionAttributes.containsKey("agentSettingsOverride"));
    Map<String, Object> storedOverrides = 
        (Map<String, Object>) sessionAttributes.get("agentSettingsOverride");
    assertEquals(0.9, storedOverrides.get("temperature"));
    assertEquals("es", storedOverrides.get("language"));
}
```

#### 4.3 End-to-End Test
**File:** `examples/test-agent-override.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Agent Settings Override Test</title>
  <script src="../dist/agent-widget.js"></script>
</head>
<body>
  <h1>Test Agent Settings Override</h1>
  <button id="test-spanish">Test Spanish Override</button>
  <button id="test-high-temp">Test High Temperature</button>
  
  <script>
    // Step 1: Get signed URL from YOUR backend
    async function getSignedUrl(agentId) {
      // Your backend calls TTP UI Backend with API key
      const response = await fetch('/api/get-voice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agentId })
      });
      const data = await response.json();
      return data.signedUrl;
    }
    
    // Step 2: Use SDK with signed URL + overrides
    async function testOverride(overrides, description) {
      console.log(`Testing: ${description}`);
      
      // Get signed URL first (authentication)
      const signedUrl = await getSignedUrl('agent_test123');
      
      // Use SDK with signed URL + overrides
      const voiceSDK = new TTPAgentSDK.VoiceSDK({
        websocketUrl: signedUrl,  // Signed URL from Step 1
        agentSettingsOverride: overrides  // Overrides sent via WebSocket
      });
      
      voiceSDK.on('connected', () => console.log('✅ Connected with overrides'));
      voiceSDK.on('message', (msg) => console.log('Message:', msg));
      
      await voiceSDK.connect();  // Overrides sent in "hello" message
      await voiceSDK.startRecording();
    }
    
    document.getElementById('test-spanish').onclick = () => {
      testOverride({
        prompt: "Eres un asistente útil que habla español",
        language: "es",
        selectedVoice: "male"
      }, "Spanish Language Override");
    };
    
    document.getElementById('test-high-temp').onclick = () => {
      testOverride({
        temperature: 1.5,
        maxTokens: 250
      }, "High Temperature Override");
    };
  </script>
</body>
</html>
```

---

## 📝 Example Usage Scenarios

### Scenario 1: Multi-Language Support
```javascript
// User selects language in UI
const userLanguage = document.getElementById('language-select').value; // "es", "fr", "de"

// Step 1: Get signed URL (authentication only)
const signedUrl = await getSignedUrl('agent_multilingual');

// Step 2: Use SDK with signed URL + language-specific overrides
const voiceSDK = new VoiceSDK({
  websocketUrl: signedUrl,
  agentSettingsOverride: {
    language: userLanguage,
    prompt: getPromptForLanguage(userLanguage)
  }
});

await voiceSDK.connect();
```

### Scenario 2: A/B Testing
```javascript
// Test different temperature settings
const temperature = Math.random() > 0.5 ? 0.7 : 0.9;
const variant = temperature === 0.7 ? 'A' : 'B';

// Step 1: Get signed URL
const signedUrl = await getSignedUrl('agent_test');

// Step 2: Use SDK with A/B test variant
const voiceSDK = new VoiceSDK({
  websocketUrl: signedUrl,
  agentSettingsOverride: {
    temperature: temperature
  }
});

// Track variant for analytics
analytics.track('A/B Test Started', { variant, temperature });

await voiceSDK.connect();
```

### Scenario 3: User Preferences
```javascript
// User's saved preferences
const userPrefs = await getUserPreferences();

// Step 1: Get signed URL
const signedUrl = await getSignedUrl('agent_123');

// Step 2: Use SDK with user preferences
const voiceSDK = new VoiceSDK({
  websocketUrl: signedUrl,
  agentSettingsOverride: {
    voiceSpeed: userPrefs.voiceSpeed,
    selectedVoice: userPrefs.preferredVoice,
    language: userPrefs.language
  }
});

await voiceSDK.connect();
```

### Scenario 4: Context-Aware Agent
```javascript
// Different behavior based on page/context
const pageContext = getCurrentPageContext();

// Step 1: Get signed URL
const signedUrl = await getSignedUrl('agent_support');

// Step 2: Use SDK with context-specific settings
const voiceSDK = new VoiceSDK({
  websocketUrl: signedUrl,
  agentSettingsOverride: {
    prompt: `You are a ${pageContext.department} support agent. ${pageContext.additionalContext}`,
    firstMessage: `Welcome to ${pageContext.department}! How can I help you?`,
    maxCallDuration: pageContext.maxDuration
  }
});

await voiceSDK.connect();
```

### Scenario 5: Helper Function Pattern (Recommended)
```javascript
// Create a reusable helper function
async function createVoiceSession(agentId, overrides = {}) {
  // Step 1: Get signed URL
  const signedUrl = await getSignedUrl(agentId);
  
  // Step 2: Create SDK instance with overrides
  const voiceSDK = new VoiceSDK({
    websocketUrl: signedUrl,
    agentSettingsOverride: overrides
  });
  
  await voiceSDK.connect();
  return voiceSDK;
}

// Usage:
const voiceSDK = await createVoiceSession('agent_123', {
  language: 'es',
  temperature: 0.9,
  voiceSpeed: 1.2
});

await voiceSDK.startRecording();
```

---

## 🔍 Monitoring & Logging

### Frontend Logging
```javascript
voiceSDK.on('connected', () => {
  if (voiceSDK.config.agentSettingsOverride) {
    analytics.track('Agent Override Used', {
      agentId: voiceSDK.config.agentId,
      overrideFields: Object.keys(voiceSDK.config.agentSettingsOverride)
    });
  }
});
```

### Backend Logging
```java
// Log when overrides are applied
logger.info("🔧 Agent settings override applied for agent {}: {}", 
    agentId, 
    overrides.keySet());

// Log individual field changes
overrides.forEach((field, value) -> {
    logger.debug("   {} = {} (was: {})", field, value, baseConfig.get(field));
});
```

### Metrics to Track
- Number of connections with overrides vs. without
- Most commonly overridden fields
- Override validation failures
- Impact on conversation quality/duration

---

## ✅ Acceptance Criteria

### Must Have
- ✅ Settings override only works with signed links
- ✅ Direct agent ID connections ignore overrides
- ✅ Security-sensitive fields cannot be overridden
- ✅ Override values are validated and sanitized
- ✅ JWT token contains override data
- ✅ Backend merges overrides with base config
- ✅ Backward compatible with existing implementations
- ✅ Clear documentation and examples
- ✅ Warning logs when overrides are attempted without signed link

### Nice to Have
- Audit trail of override usage
- Per-user override permissions
- Override limits (e.g., max temperature)
- Admin dashboard to monitor override usage

---

## 🚀 Migration Path

### Phase 1: Add Support (No Breaking Changes)
1. Deploy SDK with new override feature
2. Deploy backends with override support
3. Feature is opt-in (existing code works unchanged)

### Phase 2: Encourage Adoption
1. Update documentation with examples
2. Notify users of new feature
3. Provide migration guides

### Phase 3: Best Practices
1. Monitor usage patterns
2. Gather feedback
3. Iterate on validation rules
4. Add more override fields if needed

---

## 📚 Related Documentation

- [Signed Link Authentication Guide](SIGNED_LINK_GUIDE.md)
- [SDK Getting Started](GETTING_STARTED.md)
- [Backend Integration](BACKEND_INTEGRATION.md)
- [Security Best Practices](SECURITY.md)

---

## ❓ FAQ

### Q: Why only with signed links?
**A:** Signed links provide authentication and authorization. The backend verifies the user has access to the agent and controls what can be overridden. Direct agent ID has no security and anyone could modify settings. The signed link JWT contains an `allowOverride: true` flag which the conversation backend checks before accepting any overrides sent via WebSocket.

### Q: How do I get a signed link?
**A:** You request a signed link from YOUR backend. Your backend should:
1. Authenticate the user (your responsibility)
2. Call TTP UI Backend `/api/public/agents/signed-url` using your API key
3. Return the signed URL to your frontend

The signed link is ONLY for authentication - overrides are sent separately via the SDK.

### Q: Why is the signed link one-time use?
**A:** One-time use prevents replay attacks. If someone intercepts the signed URL, they can only use it once before it's marked as "used" in Redis and rejected.

### Q: How long is the signed link valid?
**A:** Signed links are valid for **1 hour** from generation. After 1 hour, the token expires and the Redis key is automatically deleted (TTL).

### Q: Why do we need Redis if JWT has all the data?
**A:** JWT already contains all authentication/authorization data (jti, agentId, userId, allowOverride, exp). Redis is ONLY used for **one-time use enforcement**. When a JWT is used, Redis marks it as "used". If someone tries to reuse the same JWT (even though it's still valid for 1 hour), Redis will reject it because it's already marked as "used".

### Q: Can I reuse the same signed link for multiple connections?
**A:** No. Each signed link is one-time use only. To create a new connection, you must request a new signed link from your backend.

### Q: Can I override allowedDomains?
**A:** No. `allowedDomains` is a security setting that cannot be overridden. It must be configured in the agent's base configuration.

### Q: What happens if I use a direct agent ID (no signed link)?
**A:** Direct agent ID connections have NO way to provide overrides. Overrides can only be embedded in the signed JWT token. Direct connections will always use the agent's base configuration.

### Q: Can I override the greeting audio?
**A:** No. Audio data is too large for JWT tokens. Greeting must be pre-configured in the agent.

### Q: Are overrides persisted?
**A:** No. Overrides are per-session only. They don't modify the agent's base configuration in the database or Redis.

### Q: How do I know if overrides were applied?
**A:** Check the conversation backend logs for "Agent settings override applied" messages. The log will show which fields were overridden and their values.

### Q: What happens if someone tries to reuse a token?
**A:** The conversation backend checks Redis for the token ID (jti). If the token was already used, the connection is immediately rejected with "Token already used" error.

### Q: Can I pass overrides directly to the SDK?
**A:** Yes! You pass overrides directly to the SDK via the `agentSettingsOverride` config option. However, the conversation backend will only accept them if you're using a signed link (which has `allowOverride: true` in the JWT). Direct agent ID connections will have their overrides rejected by the backend.

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

---

**Last Updated:** November 11, 2025  
**Version:** 1.0  
**Status:** Ready for Implementation

