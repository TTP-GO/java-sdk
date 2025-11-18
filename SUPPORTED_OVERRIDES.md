# Supported Agent Settings Override

## Currently Supported Overrides ✅

All settings can now be overridden! `ConversationState` has been updated with setter methods for all fields.

### Core Settings
- ✅ **prompt** - System prompt/instructions
- ✅ **temperature** - LLM temperature (0.0 - 2.0)
- ✅ **maxTokens** - Maximum tokens per response

### Voice Settings
- ✅ **voiceId** - Specific voice identifier
- ✅ **voiceSpeed** - Voice speed multiplier (0.5 - 2.0)

### Language/STT Settings
- ✅ **language** - Language code (maps to sttLanguage)
- ✅ **autoDetectLanguage** - Auto-detect user's language
- ✅ **candidateLanguages** - List of candidate languages for auto-detect

### Behavior Settings
- ✅ **firstMessage** - Initial greeting message
- ✅ **disableInterruptions** - Barge-in control
- ✅ **maxCallDuration** - Session duration limit (seconds)

### Advanced Settings
- ✅ **timezone** - User timezone (e.g., 'America/New_York')
- ✅ **toolIds** - Array of custom tool IDs (e.g., [123, 456, 789])
- ✅ **internalToolIds** - Array of internal tool IDs (e.g., ['calendar', 'weather', 'email'])

---

## Not Currently Supported ⚠️

Only **1 setting** is not supported:

- ❌ **model** - LLM model selection (requires infrastructure-level changes)

---

## What Happens When You Send Unsupported Settings?

The backend will:
1. ✅ Apply all **supported** settings
2. ⚠️ Log warnings for **unsupported** settings
3. ✅ Continue normally (no errors thrown)

**Example log output:**
```
🔧 Applying agent settings overrides: [temperature, voiceSpeed, prompt, model]
  ✓ Override temperature: 0.8
  ✓ Override voiceSpeed: 1.2
  ⚠️ Override 'prompt' not supported (no setter in ConversationState)
  ⚠️ Override 'model' not supported (no setter in ConversationState)
✅ Applied 2 agent setting overrides, 2 skipped (unsupported)
```

---

## Usage Example

```javascript
const voiceSDK = new VoiceSDK({
  websocketUrl: signedUrl,
  appId: 'your_app_id',
  agentId: 'agent_123',
  
  // Only these will be applied:
  agentSettingsOverride: {
    // ✅ Supported - will be applied
    temperature: 0.8,
    maxTokens: 200,
    voiceId: "nova",                // Use voiceId (not selectedVoice)
    voiceSpeed: 1.2,
    language: "es",
    autoDetectLanguage: false,
    prompt: "Custom prompt",
    firstMessage: "Hello!",
    maxCallDuration: 300,
    toolIds: [123, 456],            // Custom tool IDs
    internalToolIds: ['calendar'],   // Internal tool IDs
    
    // ⚠️ Not supported - will be skipped with warning
    model: "gpt-4"                  // Ignored
  }
});
```

---

## To Add Support for More Settings

If you need to override additional settings (like `prompt`, `model`, etc.), you would need to:

1. Add setter methods to `ConversationState.java`
2. Update `applyAgentSettingsOverride()` in `ConversationWsHandler.java`
3. Ensure the agent configuration system supports dynamic updates for those fields

---

## Technical Details

**File:** `ConversationWsHandler.java`  
**Method:** `applyAgentSettingsOverride()`

The method:
- Checks which settings are in the override map
- Applies only settings that have corresponding setters
- Logs warnings for unsupported settings
- Never throws errors (graceful degradation)

**Available ConversationState setters:**
- `setTemperature(Double)`
- `setMaxTokens(Integer)`
- `setSelectedVoice(String)`
- `setVoiceSpeed(Double)`
- `setSttLanguage(String)`
- `setSttAutoDetectEnabled(Boolean)`

---

## Summary

✅ **15 settings** can be overridden  
❌ **1 setting** cannot be overridden (model)  
🔧 **Graceful handling** - unsupported settings are skipped with warnings

### Changes Made to ConversationState
- ✅ Made `systemPrompt` mutable (changed from `final String` to `AtomicReference<String>`)
- ✅ Added `firstMessage` field with setter/getter
- ✅ Added `disableInterruptions` field with setter/getter
- ✅ Added `maxCallDuration` field with setter/getter
- ✅ Added `timezone` field with setter/getter
- ✅ All new fields initialized from Redis configuration when available

