# SDK v2 Structure Summary

## Quick Overview

**Goal**: Add codec, sample rate, and bit depth support while maintaining 100% backward compatibility.

## Directory Structure

```
src/
├── core/                    # Existing core components
│   ├── VoiceSDK.js         # ✏️ Enhanced (adds audioFormat config)
│   ├── AudioRecorder.js    # ✏️ Enhanced (uses AudioFormat)
│   ├── AudioPlayer.js      # ✏️ Enhanced (format detection)
│   └── ...                 # Unchanged
│
├── codecs/                  # 🆕 NEW: Codec system
│   ├── AudioFormat.js      # Format definition class
│   ├── PCMCodec.js         # PCM encoder/decoder
│   └── CodecFactory.js     # Codec registry
│
├── audio-processors/        # 🆕 NEW: Format-specific processors
│   └── pcm-processor.js    # PCM AudioWorklet (replaces audio-processor.js)
│
└── ...                      # Rest unchanged
```

## Key Components

### 1. AudioFormat Class
**Purpose**: Centralized audio format configuration

```javascript
new AudioFormat({
  codec: 'pcm',        // 'pcm', 'opus', 'g711'
  sampleRate: 48000,   // 8000, 16000, 24000, 44100, 48000
  bitDepth: 24,        // 8, 16, 24, 32
  channels: 1          // 1 (mono), 2 (stereo)
})
```

### 2. Codec System
**Purpose**: Pluggable encoding/decoding

- `PCMCodec`: Handles PCM encoding/decoding for all bit depths
- `CodecFactory`: Registry for codecs (extensible for future codecs)

### 3. Enhanced AudioRecorder
**Changes**:
- Accepts `AudioFormat` or backward-compatible config
- Passes format to AudioWorklet
- Emits format metadata with audio data

### 4. Enhanced AudioProcessor (AudioWorklet)
**Changes**:
- Supports 8/16/24/32-bit PCM encoding
- Configurable via processorOptions
- Maintains existing VAD and batching logic

## API Changes

### v1 (Still Works)
```javascript
new VoiceSDK({
  sampleRate: 16000  // Defaults to PCM 16-bit
})
```

### v2 (New)
```javascript
// Option 1: Individual params
new VoiceSDK({
  codec: 'pcm',
  sampleRate: 48000,
  bitDepth: 24
})

// Option 2: Format object
new VoiceSDK({
  audioFormat: {
    codec: 'pcm',
    sampleRate: 48000,
    bitDepth: 24
  }
})
```

## Implementation Priority

1. **Phase 1**: Core format system (AudioFormat, PCMCodec)
2. **Phase 2**: Update AudioRecorder and AudioProcessor
3. **Phase 3**: Update AudioPlayer for format detection
4. **Phase 4**: Testing and documentation

## Backward Compatibility

✅ All v1 code continues to work
✅ Default behavior unchanged (PCM 16-bit, 16kHz)
✅ New features are opt-in

## Benefits

- ✅ Extensible (easy to add Opus, G.711, etc.)
- ✅ Type-safe format definitions
- ✅ Efficient encoding/decoding
- ✅ Clear separation of concerns

