# Tools Configuration Update - Documentation Changes

## Summary

Updated all documentation to reflect the new agent tools configuration structure, changing from `selectedTools` (single field) to separate `toolIds` and `internalToolIds` arrays.

## Changes Made

### New Configuration Structure

**Previous (Old):**
```javascript
agentSettingsOverride: {
  selectedTools: { ... }  // Map/object of tool configurations
}
```

**Current (New):**
```javascript
agentSettingsOverride: {
  toolIds: [123, 456, 789],              // Array of custom tool IDs (numbers)
  internalToolIds: ['calendar', 'email']  // Array of internal tool IDs (strings)
}
```

## Backend Implementation (Reference)

Based on `RedisAgentService.java` in the UI backend (`/home/yinon11/smartTerminal/smartTerminalServerJava/smart`):

### Redis Storage
- **Line 67**: `Object toolIdsObj = configData.get("toolIds");`
- **Line 68**: `Object internalToolIdsObj = configData.get("internalToolIds");`
- **Lines 123-135**: `toolIds` stored as JSON array (custom tools)
- **Lines 137-149**: `internalToolIds` stored as JSON array (internal tools)

### Field Descriptions
- `toolIds`: Array of custom tool IDs (numeric) - references user-created tools in the tools database
- `internalToolIds`: Array of internal tool IDs (string) - references built-in system tools like 'calendar', 'weather', 'email', etc.

## Files Updated

### 1. Main Documentation Files
- ✅ `docs/index.html` - Main documentation
  - Updated Agent Override example code (lines 546-547)
  - Updated Advanced Settings list (lines 581-582)
  - Updated Advanced Settings table (lines 2550-2560)
  - Updated setting count: "15 out of 16 settings" (line 552)

- ✅ `dist/index.html` - Built/deployed documentation
  - Updated Agent Override example code
  - Updated Advanced Settings list
  - Updated Advanced Settings table

- ✅ `index.html` - Root documentation (mirror of docs)
  - Updated Agent Override example code
  - Updated Advanced Settings list
  - Updated Advanced Settings table

### 2. Markdown Documentation
- ✅ `SUPPORTED_OVERRIDES.md`
  - Updated Advanced Settings section (lines 28-30)
  - Updated usage example with toolIds and internalToolIds (lines 81-82)
  - Updated summary: "15 settings can be overridden" (line 123)

- ✅ `COMPLETE_AGENT_OVERRIDE_IMPLEMENTATION.md`
  - Updated supported settings list (lines 114-115)
  - Updated settings reference table (lines 494-495)

## Documentation Examples

### Example 1: Basic Usage
```javascript
const voiceSDK = new VoiceSDK({
  websocketUrl: signedUrl,
  appId: 'your_app_id',
  agentId: 'agent_123',
  
  agentSettingsOverride: {
    prompt: "You are a helpful assistant",
    language: "es",
    temperature: 0.9,
    
    // NEW: Tool configuration
    toolIds: [123, 456, 789],              // Custom tool IDs
    internalToolIds: ['calendar', 'email'] // Internal tool IDs
  }
});
```

### Example 2: Full Configuration
```javascript
agentSettingsOverride: {
  // Core settings
  prompt: "You are a friendly Spanish-speaking travel assistant",
  language: "es",
  temperature: 0.9,
  maxTokens: 200,
  
  // Voice settings
  voiceSpeed: 1.2,
  selectedVoice: "nova",
  
  // Behavior
  firstMessage: "¡Hola! ¿Cómo puedo ayudarte hoy?",
  disableInterruptions: false,
  autoDetectLanguage: true,
  
  // Tools (optional)
  toolIds: [123, 456, 789],              // Custom tool IDs
  internalToolIds: ['calendar', 'email'] // Internal tool IDs
}
```

## Settings Count Update

- **Previous**: 14 out of 15 settings can be overridden
- **Current**: 15 out of 16 settings can be overridden
  - `selectedTools` (1 field) replaced with `toolIds` + `internalToolIds` (2 fields)
  - Only `model` selection remains unsupported

## Verification

✅ All HTML documentation files updated
✅ All markdown documentation files updated  
✅ Build successful (`npm run build`)
✅ Examples updated with new tool configuration
✅ Settings tables updated with accurate descriptions
✅ Type information added (array of numbers vs array of strings)

## Next Steps

1. ✅ Documentation updated
2. **TODO**: Update SDK code if needed to properly send toolIds/internalToolIds in WebSocket messages
3. **TODO**: Ensure backend properly handles both fields in agent override logic
4. **TODO**: Deploy documentation: `npm run build && git commit && git push`

## Related Files (Backend)

For reference, the backend implementation can be found in:
- `/home/yinon11/smartTerminal/smartTerminalServerJava/smart/src/main/java/com/smartTerminal/smart/RedisAgentService.java`
- `/home/yinon11/smartTerminal/smartTerminalServerJava/smart/src/main/java/com/smartTerminal/smart/ToolService.java`

## Notes

- `toolIds` are numeric because they reference database IDs for custom tools
- `internalToolIds` are strings because they reference predefined internal tool names
- Both fields are optional in agentSettingsOverride
- When not provided, agent uses default tool configuration from Redis






