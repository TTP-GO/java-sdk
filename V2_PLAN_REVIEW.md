# V2 Plan Review & Enhancements

## ✅ What's Great About Your Plan

1. **Clean Structure**: v1/v2 separation is perfect
2. **Codec Interface**: Simple encode/decode pattern is good
3. **G.711 Support**: PCMU/PCMA are valuable additions
4. **EventEmitter Enhancement**: Adding `once()` is a nice improvement

## 🔧 Enhancements Needed

### 1. PCMCodec Needs Bit Depth Support

**Current Issue**: Your PCMCodec is too simple - it doesn't handle different bit depths (8/16/24/32-bit).

**Problem**: The original requirement was to support different bit depths. PCM at 16-bit vs 24-bit vs 32-bit requires different encoding.

**Solution**: Enhance PCMCodec to handle bit depth conversion:

```javascript
// src/v2/codecs/PCMCodec.js

/**
 * PCM Codec - handles raw PCM audio with configurable bit depth
 */
class PCMCodec {
  constructor(config = {}) {
    this.name = 'PCM';
    this.bitDepth = config.bitDepth || 16; // 8, 16, 24, 32
    this.sampleRate = config.sampleRate || 16000;
    this.channels = config.channels || 1;
  }

  /**
   * Decode PCM data to Float32Array (normalized -1.0 to 1.0)
   * @param {ArrayBuffer|Uint8Array|Int16Array} data - PCM audio data
   * @returns {Float32Array} - Normalized audio samples
   */
  decode(data) {
    // Detect input format and convert to Float32Array
    if (data instanceof Float32Array) {
      return data; // Already decoded
    }
    
    if (data instanceof Int16Array) {
      return this.decode16Bit(data);
    }
    
    if (data instanceof Uint8Array) {
      // Could be 8-bit PCM
      return this.decode8Bit(data);
    }
    
    if (data instanceof ArrayBuffer) {
      // Try to detect bit depth from byte length
      const bytesPerSample = this.detectBitDepth(data);
      switch (bytesPerSample) {
        case 1: return this.decode8Bit(new Uint8Array(data));
        case 2: return this.decode16Bit(new Int16Array(data));
        case 3: return this.decode24Bit(new Uint8Array(data));
        case 4: return this.decode32Bit(new Int32Array(data));
        default: return this.decode16Bit(new Int16Array(data));
      }
    }
    
    throw new Error('Invalid PCM data type');
  }

  /**
   * Encode Float32Array to PCM format
   * @param {Float32Array} float32Data - Normalized audio samples (-1.0 to 1.0)
   * @returns {ArrayBuffer} - PCM audio data in configured bit depth
   */
  encode(float32Data) {
    switch (this.bitDepth) {
      case 8:
        return this.encode8Bit(float32Data).buffer;
      case 16:
        return this.encode16Bit(float32Data).buffer;
      case 24:
        return this.encode24Bit(float32Data).buffer;
      case 32:
        return this.encode32Bit(float32Data).buffer;
      default:
        throw new Error(`Unsupported bit depth: ${this.bitDepth}`);
    }
  }

  encode8Bit(float32Data) {
    const pcm8 = new Uint8Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
      const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
      pcm8[i] = Math.round((sample + 1.0) * 127.5);
    }
    return pcm8;
  }

  encode16Bit(float32Data) {
    const pcm16 = new Int16Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
      const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
      pcm16[i] = Math.round(sample * 32767);
    }
    return pcm16;
  }

  encode24Bit(float32Data) {
    const pcm24 = new Uint8Array(float32Data.length * 3);
    for (let i = 0; i < float32Data.length; i++) {
      const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
      const value = Math.round(sample * 8388607); // 2^23 - 1
      pcm24[i * 3] = value & 0xFF;
      pcm24[i * 3 + 1] = (value >> 8) & 0xFF;
      pcm24[i * 3 + 2] = (value >> 16) & 0xFF;
    }
    return pcm24;
  }

  encode32Bit(float32Data) {
    const pcm32 = new Int32Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
      const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
      pcm32[i] = Math.round(sample * 2147483647); // 2^31 - 1
    }
    return pcm32;
  }

  decode8Bit(uint8Data) {
    const float32 = new Float32Array(uint8Data.length);
    for (let i = 0; i < uint8Data.length; i++) {
      float32[i] = (uint8Data[i] / 127.5) - 1.0;
    }
    return float32;
  }

  decode16Bit(int16Data) {
    const float32 = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32[i] = int16Data[i] / 32767.0;
    }
    return float32;
  }

  decode24Bit(uint8Data) {
    const samples = uint8Data.length / 3;
    const float32 = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      let value = uint8Data[i * 3] | (uint8Data[i * 3 + 1] << 8) | (uint8Data[i * 3 + 2] << 16);
      // Sign extend 24-bit to 32-bit
      if (value & 0x800000) {
        value |= 0xFF000000;
      }
      float32[i] = value / 8388607.0;
    }
    return float32;
  }

  decode32Bit(int32Data) {
    const float32 = new Float32Array(int32Data.length);
    for (let i = 0; i < int32Data.length; i++) {
      float32[i] = int32Data[i] / 2147483647.0;
    }
    return float32;
  }

  detectBitDepth(data) {
    // Try to infer bit depth from data length
    // This is a heuristic - ideally format should be known
    const totalBytes = data.byteLength;
    // Assume 128 samples (common AudioWorklet buffer size)
    const estimatedSamples = totalBytes / 2; // Default to 16-bit
    const bytesPerSample = totalBytes / estimatedSamples;
    return Math.round(bytesPerSample);
  }
}

export default PCMCodec;
```

### 2. Add AudioFormat Configuration Class

**Why**: Need a way to configure codec + sample rate + bit depth together.

```javascript
// src/v2/utils/AudioFormat.js

/**
 * AudioFormat - Configuration for audio format
 */
class AudioFormat {
  constructor({
    codec = 'pcm',           // 'pcm', 'pcmu', 'pcma'
    sampleRate = 16000,      // 8000, 16000, 24000, 44100, 48000
    bitDepth = 16,           // 8, 16, 24, 32 (for PCM)
    channels = 1             // 1 (mono), 2 (stereo)
  } = {}) {
    this.codec = codec;
    this.sampleRate = sampleRate;
    this.bitDepth = bitDepth;
    this.channels = channels;
  }

  getBytesPerSample() {
    if (this.codec === 'pcmu' || this.codec === 'pcma') {
      return 1; // 8-bit compressed
    }
    return Math.ceil(this.bitDepth / 8);
  }

  getBytesPerSecond() {
    return this.sampleRate * this.channels * this.getBytesPerSample();
  }

  validate() {
    const validCodecs = ['pcm', 'pcmu', 'pcma'];
    const validSampleRates = [8000, 16000, 24000, 44100, 48000];
    const validBitDepths = [8, 16, 24, 32];

    if (!validCodecs.includes(this.codec)) {
      throw new Error(`Invalid codec: ${this.codec}`);
    }
    if (!validSampleRates.includes(this.sampleRate)) {
      throw new Error(`Invalid sample rate: ${this.sampleRate}`);
    }
    if (this.codec === 'pcm' && !validBitDepths.includes(this.bitDepth)) {
      throw new Error(`Invalid bit depth: ${this.bitDepth}`);
    }
  }

  // Backward compatibility: create from v1 config
  static fromConfig(config) {
    if (config.codec) {
      return new AudioFormat(config);
    }
    // v1 format: just sampleRate
    return new AudioFormat({
      codec: 'pcm',
      sampleRate: config.sampleRate || 16000,
      bitDepth: 16,
      channels: 1
    });
  }
}

export default AudioFormat;
```

### 3. Add CodecFactory

**Why**: Need a registry to get the right codec instance.

```javascript
// src/v2/codecs/CodecFactory.js

import PCMCodec from './PCMCodec.js';
import PCMUCodec from './PCMUCodec.js';
import PCMACodec from './PCMACodec.js';
import AudioFormat from '../utils/AudioFormat.js';

class CodecFactory {
  static codecs = new Map();

  static register(name, CodecClass) {
    this.codecs.set(name, CodecClass);
  }

  static getCodec(format) {
    if (!(format instanceof AudioFormat)) {
      format = AudioFormat.fromConfig(format);
    }

    const CodecClass = this.codecs.get(format.codec);
    if (!CodecClass) {
      throw new Error(`Codec not supported: ${format.codec}`);
    }

    // Create codec instance with format config
    return new CodecClass({
      bitDepth: format.bitDepth,
      sampleRate: format.sampleRate,
      channels: format.channels
    });
  }
}

// Register built-in codecs
CodecFactory.register('pcm', PCMCodec);
CodecFactory.register('pcmu', PCMUCodec);
CodecFactory.register('pcma', PCMACodec);

export default CodecFactory;
```

### 4. Update PCMUCodec & PCMACodec

**Enhancement**: Make them work with AudioFormat config:

```javascript
// src/v2/codecs/PCMUCodec.js (enhanced)

class PCMUCodec {
  constructor(config = {}) {
    this.name = 'PCMU';
    this.sampleRate = config.sampleRate || 8000; // G.711 is typically 8kHz
  }

  // ... your existing methods are good ...
  // Just ensure they work with the interface
}
```

### 5. Missing: AudioWorklet Processor for v2

**Critical**: You need a v2 AudioWorklet processor that uses codecs.

```javascript
// src/v2/audio-processor.js

/**
 * V2 AudioProcessor - Uses codec system
 */
class V2AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    const config = options.processorOptions || {};
    this.codec = config.codec || 'pcm';
    this.sampleRate = config.sampleRate || 16000;
    this.bitDepth = config.bitDepth || 16;
    
    // ... existing VAD logic ...
    
    // Will use codec for encoding
  }

  sendPCMAudioData(float32Data) {
    // In v2, we'll encode using the codec
    // For now, use PCMCodec logic inline or import
    // (AudioWorklets can't import modules, so inline or use dynamic import)
    
    // ... encoding logic based on codec ...
    
    this.port.postMessage({
      type: 'pcm_audio_data',
      data: encodedData,
      codec: this.codec,
      sampleRate: this.sampleRate,
      bitDepth: this.bitDepth
    });
  }
}

registerProcessor('v2-audio-processor', V2AudioProcessor);
```

**Note**: AudioWorklets can't import ES modules directly. You'll need to:
- Inline the encoding logic, OR
- Use a bundler that includes codec code in the processor file

### 6. Missing: AudioRecorder v2 Implementation

You'll need to create `src/v2/AudioRecorder.js` that:
- Uses AudioFormat
- Uses CodecFactory
- Loads v2 audio-processor.js
- Integrates with codecs

### 7. Missing: AudioPlayer v2 Implementation

You'll need `src/v2/AudioPlayer.js` that:
- Detects incoming audio format
- Uses appropriate codec to decode
- Handles different sample rates

## 📋 Complete Task List

### Phase 1: Foundation ✅
- [x] Create folder structure
- [x] Create shared EventEmitter
- [x] Create PCMCodec (enhanced with bit depth)
- [x] Create PCMUCodec
- [x] Create PCMACodec

### Phase 2: Configuration System
- [ ] Create `AudioFormat.js` class
- [ ] Create `CodecFactory.js`
- [ ] Update codecs to accept config

### Phase 3: AudioWorklet Processor
- [ ] Create `src/v2/audio-processor.js`
- [ ] Support codec-based encoding
- [ ] Update webpack to build processor separately

### Phase 4: Core Components
- [ ] Create `src/v2/AudioRecorder.js`
- [ ] Create `src/v2/AudioPlayer.js`
- [ ] Create `src/v2/WebSocketManager.js` (or reuse shared)
- [ ] Create `src/v2/VoiceSDK.js`

### Phase 5: Integration
- [ ] Update `src/index.js` to export v1 and v2
- [ ] Update webpack config
- [ ] Test backward compatibility

## 🎯 Recommended Next Steps

1. **Start with AudioFormat** - It's the foundation
2. **Enhance PCMCodec** - Add bit depth support
3. **Create CodecFactory** - Registry system
4. **Build AudioRecorder v2** - Integrate everything
5. **Build AudioWorklet** - Handle encoding in worker

## 💡 Key Insights

- **PCMCodec must handle bit depths** - This is the core requirement
- **AudioFormat is essential** - Centralizes configuration
- **CodecFactory enables extensibility** - Easy to add new codecs
- **AudioWorklet needs codec logic** - Can't import modules, so inline or bundle

Your plan is solid! Just needs these enhancements to fully support the requirements.

