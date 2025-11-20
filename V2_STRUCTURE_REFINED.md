# SDK v2 Structure - Refined Proposal

## Proposed Structure

```
ttp-agent-sdk/
├── src/
│   ├── v1/                          # Existing SDK (DON'T TOUCH)
│   │   ├── VoiceSDK.js
│   │   ├── AudioRecorder.js
│   │   ├── AudioPlayer.js
│   │   ├── WebSocketManager.js
│   │   ├── TextChatSDK.js
│   │   └── audio-processor.js       # AudioWorklet for v1
│   │
│   ├── v2/                          # NEW - v2 Implementation
│   │   ├── VoiceSDK.js
│   │   ├── AudioRecorder.js
│   │   ├── AudioPlayer.js
│   │   ├── WebSocketManager.js      # May reuse or enhance
│   │   ├── TextChatSDK.js           # May reuse or enhance
│   │   │
│   │   ├── codecs/                  # Codec implementations
│   │   │   ├── BaseCodec.js         # Abstract base class
│   │   │   ├── PCMCodec.js          # PCM (8/16/24/32-bit)
│   │   │   ├── PCMUCodec.js         # G.711 μ-law
│   │   │   ├── PCMACodec.js         # G.711 A-law
│   │   │   └── CodecFactory.js     # Codec registry
│   │   │
│   │   ├── audio-processors/        # Format-specific AudioWorklets
│   │   │   ├── pcm-processor.js     # PCM AudioWorklet
│   │   │   ├── pcmu-processor.js    # μ-law AudioWorklet (future)
│   │   │   └── pcma-processor.js    # A-law AudioWorklet (future)
│   │   │
│   │   └── utils/
│   │       ├── AudioFormat.js       # Format configuration class
│   │       ├── AudioFormatDetector.js
│   │       └── sample-rate-converter.js
│   │
│   ├── shared/                      # Shared utilities (used by both versions)
│   │   ├── EventEmitter.js
│   │   ├── Logger.js
│   │   └── ConnectionManager.js     # If shared
│   │
│   ├── react/                       # React components (version-agnostic or v1-specific)
│   │   └── VoiceButton.jsx          # May need v1/v2 variants
│   │
│   ├── vanilla/                     # Vanilla JS components
│   │   └── VoiceButton.js
│   │
│   ├── legacy/                      # Legacy components (keep as-is)
│   │   └── ...
│   │
│   └── index.js                     # Main entry point - exports both v1 and v2
│
├── dist/                            # Build output
│   ├── agent-widget.js             # Main bundle (includes both versions)
│   └── audio-processor.js           # v1 AudioWorklet (for backward compat)
│   └── v2/
│       └── pcm-processor.js         # v2 AudioWorklet
│
├── package.json
└── README.md
```

## Key Decisions

### 1. What Goes in `shared/`?
**Shared components** (used by both v1 and v2):
- ✅ `EventEmitter.js` - Core event system
- ✅ `Logger.js` - Logging utility
- ❓ `WebSocketManager.js` - **Decision needed**: Keep separate or share?
- ❓ `TextChatSDK.js` - **Decision needed**: Version-specific or shared?

**Recommendation**: 
- Start with `EventEmitter` and `Logger` in shared
- Keep `WebSocketManager` version-specific (v2 may need enhancements)
- Keep `TextChatSDK` version-specific (may have different features)

### 2. Component Versioning

**React/Vanilla Components**:
```javascript
// Option A: Version-specific components
src/react/v1/VoiceButton.jsx
src/react/v2/VoiceButton.jsx

// Option B: Single component that accepts version
src/react/VoiceButton.jsx  // Accepts version prop

// Option C: Keep v1 components, add v2 later
src/react/VoiceButton.jsx  // Uses v1 SDK (for now)
```

**Recommendation**: Option C (keep existing, add v2 support later)

### 3. AudioWorklet Processors

**v1**: `src/v1/audio-processor.js` → `dist/audio-processor.js`
**v2**: `src/v2/audio-processors/pcm-processor.js` → `dist/v2/pcm-processor.js`

**Why separate?**
- v1 users expect `audio-processor.js` at root
- v2 uses different processor structure
- Avoids conflicts

### 4. Main Entry Point (`src/index.js`)

```javascript
// Export v1 (default/backward compatible)
import VoiceSDKv1 from './v1/VoiceSDK.js';
import AudioRecorderV1 from './v1/AudioRecorder.js';
// ... other v1 exports

// Export v2 (new API)
import VoiceSDKv2 from './v2/VoiceSDK.js';
import AudioRecorderV2 from './v2/AudioRecorder.js';
// ... other v2 exports

// Shared utilities
import EventEmitter from './shared/EventEmitter.js';

// Default export (v1 for backward compatibility)
export default {
  // v1 (default)
  VoiceSDK: VoiceSDKv1,
  AudioRecorder: AudioRecorderV1,
  // ...
  
  // v2 (explicit)
  v2: {
    VoiceSDK: VoiceSDKv2,
    AudioRecorder: AudioRecorderV2,
    // ...
  },
  
  // Shared
  EventEmitter,
  
  VERSION: '2.0.0'
};

// Named exports
export {
  // v1 (default)
  VoiceSDK: VoiceSDKv1,
  AudioRecorder: AudioRecorderV1,
  
  // v2 (explicit)
  VoiceSDKv2,
  AudioRecorderV2,
  
  // Shared
  EventEmitter
};
```

### 5. Usage Examples

**v1 (backward compatible)**:
```javascript
import { VoiceSDK } from 'ttp-agent-sdk';

const sdk = new VoiceSDK({
  appId: 'your-app-id',
  sampleRate: 16000
});
```

**v2 (new API)**:
```javascript
import { VoiceSDKv2 } from 'ttp-agent-sdk';

const sdk = new VoiceSDKv2({
  appId: 'your-app-id',
  codec: 'pcm',
  sampleRate: 48000,
  bitDepth: 24
});
```

**Or using default export**:
```javascript
import TTPAgentSDK from 'ttp-agent-sdk';

// v1
const sdk1 = new TTPAgentSDK.VoiceSDK({ ... });

// v2
const sdk2 = new TTPAgentSDK.v2.VoiceSDK({ ... });
```

## Migration Plan

### Phase 1: Restructure (Week 1)
1. Create `src/shared/` and move `EventEmitter.js`
2. Create `src/v1/` and move existing core files
3. Update imports in v1 files to use `shared/EventEmitter`
4. Update `src/index.js` to export v1

### Phase 2: Build v2 Core (Week 2)
1. Create `src/v2/` structure
2. Implement `AudioFormat.js`
3. Implement `PCMCodec.js` and `CodecFactory.js`
4. Create `v2/AudioRecorder.js` (uses codecs)
5. Create `v2/audio-processors/pcm-processor.js`
6. Create `v2/VoiceSDK.js`

### Phase 3: Integration (Week 3)
1. Update `src/index.js` to export both versions
2. Update webpack config for v2 processors
3. Update documentation
4. Test backward compatibility

### Phase 4: Additional Codecs (Future)
1. Implement `PCMUCodec.js` (G.711 μ-law)
2. Implement `PCMACodec.js` (G.711 A-law)
3. Add Opus codec (if needed)

## Questions to Resolve

1. **WebSocketManager**: Share or version-specific?
   - **Recommendation**: Version-specific (v2 may need format metadata)

2. **TextChatSDK**: Share or version-specific?
   - **Recommendation**: Version-specific (may have different features)

3. **React Components**: How to handle versioning?
   - **Recommendation**: Keep existing, add `version` prop later

4. **Build Output**: Single bundle or separate bundles?
   - **Recommendation**: Single bundle (smaller, easier to use)

5. **Package.json**: How to version?
   - **Recommendation**: Bump to 3.0.0 (major version for new API)

## Benefits of This Structure

✅ **Complete isolation**: v1 untouched, v2 clean slate
✅ **Shared utilities**: No code duplication
✅ **Clear versioning**: Explicit v1/v2 exports
✅ **Backward compatible**: Existing code works unchanged
✅ **Extensible**: Easy to add new codecs/features
✅ **Maintainable**: Clear separation of concerns

