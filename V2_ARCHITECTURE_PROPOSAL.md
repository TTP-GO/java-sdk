# SDK Version 2 Architecture Proposal

## Overview

Version 2 adds support for multiple codecs, sample rates, and bit depths while maintaining full backward compatibility with v1.

## Key Design Principles

1. **Backward Compatibility**: All v1 APIs continue to work unchanged
2. **Pluggable Codecs**: Codec implementations are modular and extensible
3. **Format Abstraction**: Audio format configuration is centralized
4. **Progressive Enhancement**: New features are opt-in via configuration

## Proposed Directory Structure

```
src/
├── core/                          # Core SDK components (existing)
│   ├── VoiceSDK.js               # Main SDK class (enhanced)
│   ├── AudioRecorder.js          # Recording (uses AudioFormat)
│   ├── AudioPlayer.js             # Playback (uses AudioFormat)
│   ├── WebSocketManager.js       # Unchanged
│   ├── EventEmitter.js           # Unchanged
│   └── ...
│
├── codecs/                        # NEW: Codec implementations
│   ├── AudioFormat.js            # Base format abstraction
│   ├── PCMCodec.js               # PCM codec (8/16/24/32-bit)
│   ├── OpusCodec.js              # Opus codec (future)
│   ├── G711Codec.js              # G.711 μ-law/A-law (future)
│   └── CodecFactory.js           # Codec registry and factory
│
├── audio-processors/              # NEW: Format-specific AudioWorklets
│   ├── pcm-processor.js          # PCM AudioWorklet (supports all bit depths)
│   ├── opus-processor.js         # Opus AudioWorklet (future)
│   └── processor-loader.js       # Dynamic processor loader
│
├── utils/                         # NEW: Audio utilities
│   ├── audio-converter.js        # Format conversion utilities
│   ├── sample-rate-converter.js  # Sample rate conversion
│   └── bit-depth-converter.js    # Bit depth conversion
│
├── react/                         # React components (unchanged)
├── vanilla/                       # Vanilla JS components (unchanged)
└── legacy/                        # Legacy components (unchanged)
```

## Core Changes

### 1. AudioFormat Abstraction

**File:** `src/codecs/AudioFormat.js`

```javascript
/**
 * AudioFormat - Defines audio format configuration
 */
export class AudioFormat {
  constructor({
    codec = 'pcm',           // 'pcm', 'opus', 'g711'
    sampleRate = 16000,      // 8000, 16000, 24000, 44100, 48000
    bitDepth = 16,           // 8, 16, 24, 32
    channels = 1,            // 1 (mono), 2 (stereo)
    endianness = 'little',   // 'little', 'big' (for PCM)
    signed = true            // true (signed), false (unsigned)
  } = {}) {
    this.codec = codec;
    this.sampleRate = sampleRate;
    this.bitDepth = bitDepth;
    this.channels = channels;
    this.endianness = endianness;
    this.signed = signed;
  }
  
  // Calculate bytes per sample
  getBytesPerSample() {
    return Math.ceil(this.bitDepth / 8);
  }
  
  // Calculate bytes per second
  getBytesPerSecond() {
    return this.sampleRate * this.channels * this.getBytesPerSample();
  }
  
  // Get MIME type
  getMimeType() {
    switch (this.codec) {
      case 'pcm':
        return 'audio/pcm';
      case 'opus':
        return 'audio/opus';
      case 'g711':
        return 'audio/g711';
      default:
        return 'audio/pcm';
    }
  }
  
  // Validate format
  validate() {
    const validCodecs = ['pcm', 'opus', 'g711'];
    const validSampleRates = [8000, 16000, 24000, 44100, 48000];
    const validBitDepths = [8, 16, 24, 32];
    
    if (!validCodecs.includes(this.codec)) {
      throw new Error(`Invalid codec: ${this.codec}`);
    }
    if (!validSampleRates.includes(this.sampleRate)) {
      throw new Error(`Invalid sample rate: ${this.sampleRate}`);
    }
    if (!validBitDepths.includes(this.bitDepth)) {
      throw new Error(`Invalid bit depth: ${this.bitDepth}`);
    }
  }
  
  // Create from config object (backward compatible)
  static fromConfig(config) {
    // Support v1 format: { sampleRate: 16000 }
    if (config.sampleRate && !config.codec) {
      return new AudioFormat({
        codec: 'pcm',
        sampleRate: config.sampleRate,
        bitDepth: 16,
        channels: 1
      });
    }
    
    // Support v2 format: { codec: 'pcm', sampleRate: 16000, bitDepth: 16 }
    return new AudioFormat(config);
  }
}
```

### 2. Codec Interface

**File:** `src/codecs/CodecFactory.js`

```javascript
import { AudioFormat } from './AudioFormat.js';
import { PCMCodec } from './PCMCodec.js';
// import { OpusCodec } from './OpusCodec.js'; // Future

export class CodecFactory {
  static codecs = new Map();
  
  static register(codecName, codecClass) {
    this.codecs.set(codecName, codecClass);
  }
  
  static getCodec(format) {
    const CodecClass = this.codecs.get(format.codec);
    if (!CodecClass) {
      throw new Error(`Codec not supported: ${format.codec}`);
    }
    return new CodecClass(format);
  }
}

// Register built-in codecs
CodecFactory.register('pcm', PCMCodec);
// CodecFactory.register('opus', OpusCodec); // Future
```

### 3. PCM Codec Implementation

**File:** `src/codecs/PCMCodec.js`

```javascript
import { AudioFormat } from './AudioFormat.js';

export class PCMCodec {
  constructor(format) {
    this.format = format;
    this.validateFormat();
  }
  
  validateFormat() {
    if (this.format.codec !== 'pcm') {
      throw new Error('PCMCodec only supports PCM format');
    }
  }
  
  /**
   * Encode Float32Array to PCM format
   */
  encode(float32Data) {
    const samples = float32Data.length;
    const bytesPerSample = this.format.getBytesPerSample();
    const buffer = new ArrayBuffer(samples * bytesPerSample);
    
    switch (this.format.bitDepth) {
      case 8:
        return this.encode8Bit(float32Data, buffer);
      case 16:
        return this.encode16Bit(float32Data, buffer);
      case 24:
        return this.encode24Bit(float32Data, buffer);
      case 32:
        return this.encode32Bit(float32Data, buffer);
      default:
        throw new Error(`Unsupported bit depth: ${this.format.bitDepth}`);
    }
  }
  
  encode8Bit(float32Data, buffer) {
    const view = new Uint8Array(buffer);
    for (let i = 0; i < float32Data.length; i++) {
      const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
      if (this.format.signed) {
        view[i] = Math.round((sample + 1.0) * 127.5);
      } else {
        view[i] = Math.round((sample + 1.0) * 127.5) + 128;
      }
    }
    return buffer;
  }
  
  encode16Bit(float32Data, buffer) {
    const view = new Int16Array(buffer);
    for (let i = 0; i < float32Data.length; i++) {
      const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
      view[i] = Math.round(sample * 32767);
    }
    return buffer;
  }
  
  encode24Bit(float32Data, buffer) {
    const view = new Uint8Array(buffer);
    for (let i = 0; i < float32Data.length; i++) {
      const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
      const value = Math.round(sample * 8388607); // 2^23 - 1
      
      if (this.format.endianness === 'little') {
        view[i * 3] = value & 0xFF;
        view[i * 3 + 1] = (value >> 8) & 0xFF;
        view[i * 3 + 2] = (value >> 16) & 0xFF;
      } else {
        view[i * 3] = (value >> 16) & 0xFF;
        view[i * 3 + 1] = (value >> 8) & 0xFF;
        view[i * 3 + 2] = value & 0xFF;
      }
    }
    return buffer;
  }
  
  encode32Bit(float32Data, buffer) {
    if (this.format.signed) {
      const view = new Int32Array(buffer);
      for (let i = 0; i < float32Data.length; i++) {
        const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
        view[i] = Math.round(sample * 2147483647); // 2^31 - 1
      }
    } else {
      const view = new Uint32Array(buffer);
      for (let i = 0; i < float32Data.length; i++) {
        const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
        view[i] = Math.round((sample + 1.0) * 2147483647.5);
      }
    }
    return buffer;
  }
  
  /**
   * Decode PCM format to Float32Array
   */
  decode(pcmData) {
    const bytesPerSample = this.format.getBytesPerSample();
    const samples = pcmData.byteLength / bytesPerSample;
    const float32Data = new Float32Array(samples);
    
    switch (this.format.bitDepth) {
      case 8:
        return this.decode8Bit(pcmData, float32Data);
      case 16:
        return this.decode16Bit(pcmData, float32Data);
      case 24:
        return this.decode24Bit(pcmData, float32Data);
      case 32:
        return this.decode32Bit(pcmData, float32Data);
      default:
        throw new Error(`Unsupported bit depth: ${this.format.bitDepth}`);
    }
  }
  
  decode8Bit(pcmData, float32Data) {
    const view = new Uint8Array(pcmData);
    for (let i = 0; i < float32Data.length; i++) {
      if (this.format.signed) {
        float32Data[i] = (view[i] / 127.5) - 1.0;
      } else {
        float32Data[i] = ((view[i] - 128) / 127.5) - 1.0;
      }
    }
    return float32Data;
  }
  
  decode16Bit(pcmData, float32Data) {
    const view = new Int16Array(pcmData);
    for (let i = 0; i < float32Data.length; i++) {
      float32Data[i] = view[i] / 32767.0;
    }
    return float32Data;
  }
  
  decode24Bit(pcmData, float32Data) {
    const view = new Uint8Array(pcmData);
    for (let i = 0; i < float32Data.length; i++) {
      let value;
      if (this.format.endianness === 'little') {
        value = view[i * 3] | (view[i * 3 + 1] << 8) | (view[i * 3 + 2] << 16);
      } else {
        value = (view[i * 3] << 16) | (view[i * 3 + 1] << 8) | view[i * 3 + 2];
      }
      // Sign extend 24-bit to 32-bit
      if (value & 0x800000) {
        value |= 0xFF000000;
      }
      float32Data[i] = value / 8388607.0;
    }
    return float32Data;
  }
  
  decode32Bit(pcmData, float32Data) {
    if (this.format.signed) {
      const view = new Int32Array(pcmData);
      for (let i = 0; i < float32Data.length; i++) {
        float32Data[i] = view[i] / 2147483647.0;
      }
    } else {
      const view = new Uint32Array(pcmData);
      for (let i = 0; i < float32Data.length; i++) {
        float32Data[i] = (view[i] / 2147483647.5) - 1.0;
      }
    }
    return float32Data;
  }
}
```

### 4. Updated AudioRecorder

**File:** `src/core/AudioRecorder.js` (enhanced)

```javascript
import EventEmitter from './EventEmitter.js';
import { AudioFormat } from '../codecs/AudioFormat.js';
import { CodecFactory } from '../codecs/CodecFactory.js';

export default class AudioRecorder extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    
    // Create audio format from config (backward compatible)
    this.audioFormat = AudioFormat.fromConfig({
      codec: config.codec || 'pcm',
      sampleRate: config.sampleRate || 16000,
      bitDepth: config.bitDepth || 16,
      channels: config.channels || 1
    });
    
    // Get codec instance
    this.codec = CodecFactory.getCodec(this.audioFormat);
    
    this.audioContext = null;
    this.audioWorkletNode = null;
    this.mediaStream = null;
    this.isRecording = false;
  }
  
  // ... existing methods ...
  
  async start() {
    try {
      // Get user media with configured sample rate
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.audioFormat.sampleRate,
          channelCount: this.audioFormat.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create AudioContext with configured sample rate
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.audioFormat.sampleRate
      });
      
      // ... rest of start() method ...
      
      // Pass format config to AudioWorklet
      this.audioWorkletNode.port.postMessage({
        type: 'config',
        data: {
          codec: this.audioFormat.codec,
          sampleRate: this.audioFormat.sampleRate,
          bitDepth: this.audioFormat.bitDepth,
          channels: this.audioFormat.channels
        }
      });
      
      // ... rest stays the same ...
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  // ... rest of methods unchanged ...
}
```

### 5. Updated AudioProcessor (AudioWorklet)

**File:** `src/audio-processors/pcm-processor.js` (new, replaces audio-processor.js)

```javascript
/**
 * PCM AudioProcessor - Supports multiple bit depths and sample rates
 */
class PCMAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    const config = options.processorOptions || {};
    this.codec = config.codec || 'pcm';
    this.sampleRate = config.sampleRate || 16000;
    this.bitDepth = config.bitDepth || 16;
    this.channels = config.channels || 1;
    
    // ... existing VAD and buffer logic ...
    
    // Calculate bytes per sample
    this.bytesPerSample = Math.ceil(this.bitDepth / 8);
  }
  
  // ... existing process() and processAudioData() methods ...
  
  sendPCMAudioData(float32Data) {
    // Encode based on bit depth
    let pcmData;
    
    switch (this.bitDepth) {
      case 8:
        pcmData = this.encode8Bit(float32Data);
        break;
      case 16:
        pcmData = this.encode16Bit(float32Data);
        break;
      case 24:
        pcmData = this.encode24Bit(float32Data);
        break;
      case 32:
        pcmData = this.encode32Bit(float32Data);
        break;
      default:
        throw new Error(`Unsupported bit depth: ${this.bitDepth}`);
    }
    
    // ... existing batching logic ...
    
    this.port.postMessage({
      type: 'pcm_audio_data',
      data: pcmData,
      codec: this.codec,
      sampleRate: this.sampleRate,
      bitDepth: this.bitDepth,
      channelCount: this.channels,
      // ... other metadata ...
    });
  }
  
  encode8Bit(float32Data) {
    const pcmData = new Uint8Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
      const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
      pcmData[i] = Math.round((sample + 1.0) * 127.5);
    }
    return pcmData;
  }
  
  encode16Bit(float32Data) {
    const pcmData = new Int16Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
      const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
      pcmData[i] = Math.round(sample * 32767);
    }
    return pcmData;
  }
  
  // ... encode24Bit, encode32Bit methods ...
}

registerProcessor('pcm-processor', PCMAudioProcessor);
```

### 6. Updated VoiceSDK Configuration

**File:** `src/core/VoiceSDK.js` (enhanced)

```javascript
export default class VoiceSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration with backward compatibility
    this.config = {
      websocketUrl: config.websocketUrl || 'wss://speech.talktopc.com/ws/conv',
      agentId: config.agentId,
      appId: config.appId,
      ttpId: config.ttpId,
      voice: config.voice || 'default',
      language: config.language || 'en',
      
      // Audio format configuration (v2)
      // Supports both v1 format (sampleRate) and v2 format (audioFormat object)
      audioFormat: config.audioFormat || {
        codec: config.codec || 'pcm',
        sampleRate: config.sampleRate || 16000,
        bitDepth: config.bitDepth || 16,
        channels: config.channels || 1
      },
      
      // Backward compatibility: still support direct sampleRate
      sampleRate: config.sampleRate || 16000,
      
      agentSettingsOverride: config.agentSettingsOverride || null,
      
      ...config
    };
    
    // ... rest of constructor ...
  }
  
  // ... rest of methods unchanged ...
}
```

## Migration Guide

### v1 Usage (Still Works)
```javascript
const sdk = new VoiceSDK({
  appId: 'your-app-id',
  sampleRate: 16000  // v1 format
});
```

### v2 Usage (New Features)
```javascript
// Option 1: Individual parameters
const sdk = new VoiceSDK({
  appId: 'your-app-id',
  codec: 'pcm',
  sampleRate: 48000,
  bitDepth: 24,
  channels: 1
});

// Option 2: AudioFormat object
const sdk = new VoiceSDK({
  appId: 'your-app-id',
  audioFormat: {
    codec: 'pcm',
    sampleRate: 48000,
    bitDepth: 24,
    channels: 1
  }
});
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create `AudioFormat` class
- [ ] Create `CodecFactory` and `PCMCodec`
- [ ] Update `AudioRecorder` to use format abstraction
- [ ] Update `AudioProcessor` to support multiple bit depths
- [ ] Maintain backward compatibility

### Phase 2: Enhanced Features (Week 2)
- [ ] Add sample rate conversion utilities
- [ ] Add format detection in `AudioPlayer`
- [ ] Update WebSocket messages to include format metadata
- [ ] Add format validation and error handling

### Phase 3: Testing & Documentation (Week 3)
- [ ] Write unit tests for codecs
- [ ] Update documentation with v2 examples
- [ ] Create migration guide
- [ ] Performance testing

### Phase 4: Future Codecs (Future)
- [ ] Opus codec implementation
- [ ] G.711 codec implementation
- [ ] Additional codec support as needed

## Benefits

1. **Backward Compatible**: All existing v1 code continues to work
2. **Extensible**: Easy to add new codecs
3. **Type Safe**: Clear format definitions
4. **Performance**: Efficient encoding/decoding
5. **Flexible**: Supports various audio configurations

## File Changes Summary

### New Files
- `src/codecs/AudioFormat.js`
- `src/codecs/PCMCodec.js`
- `src/codecs/CodecFactory.js`
- `src/audio-processors/pcm-processor.js`
- `src/utils/audio-converter.js` (optional)

### Modified Files
- `src/core/VoiceSDK.js` (add audioFormat config)
- `src/core/AudioRecorder.js` (use AudioFormat)
- `src/core/AudioPlayer.js` (detect and decode formats)
- `src/audio-processor.js` (rename/move to pcm-processor.js)

### Unchanged Files
- `src/core/WebSocketManager.js`
- `src/core/EventEmitter.js`
- `src/react/VoiceButton.jsx`
- `src/vanilla/VoiceButton.js`
- All legacy files

