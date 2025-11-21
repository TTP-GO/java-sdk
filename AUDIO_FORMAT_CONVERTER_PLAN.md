# Audio Format Converter Architecture Plan

## Overview

Create a converter system that automatically converts incoming audio from the backend's negotiated format to the user's requested format, ensuring consistent audio quality regardless of what the backend sends.

## Backend Behavior (Key Insight)

**The backend always works with PCM internally:**
- Backend receives TTS output (usually WAV)
- Backend converts WAV → PCM using `AudioUtil.convertWavToPcmFormat()`
- Backend then sends audio in the requested format (PCM, PCMU, or PCMA)
- **All conversions start FROM PCM** (the internal format)

## Source Format Assumptions

**What the SDK receives from backend:**
- **Containers**: `raw` (no header) or `wav` (with header)
- **Encodings**: `pcm`, `pcmu` (μ-law), or `pcma` (A-law)
- **Bit Depths**: **16-bit or 24-bit ONLY** (NEVER 8-bit as source)
- **Sample Rates**: 8000, 16000, 22050, 24000, 44100, 48000 Hz
- **Channels**: Always mono (1 channel)

**Common scenarios:**
- Backend sends: `wav` container with `pcm` encoding (16-bit or 24-bit)
- Backend sends: `raw` container with `pcm` encoding (16-bit or 24-bit)
- Backend sends: `raw` container with `pcmu` encoding (8-bit μ-law, decode to 16-bit PCM)
- Backend sends: `raw` container with `pcma` encoding (8-bit A-law, decode to 16-bit PCM)

**Backend Conversion Flow:**
```
TTS Output (WAV) 
  → AudioUtil.convertWavToPcmFormat() 
  → PCM (internal format)
  → Encode to requested format (PCM/PCMU/PCMA)
  → Send to SDK
```

**Implication for SDK Converter:**
- SDK receives audio in backend's format:
  - **PCM (raw)**: Direct PCM data
  - **WAV (with PCM)**: WAV container with PCM encoding (need to extract PCM)
  - **PCMU (raw)**: μ-law encoded (need to decode to PCM)
  - **PCMA (raw)**: A-law encoded (need to decode to PCM)
- **Source bit depth**: Always 16-bit or 24-bit (NEVER 8-bit)
- SDK must decode/extract to PCM first - **This is the starting point**
- SDK then converts FROM PCM to requested format
- **All conversions are FROM PCM** (PCM is the universal intermediate format)

**SDK Conversion Flow:**
```
Backend Audio (PCM raw, WAV with PCM, PCMU raw, or PCMA raw)
  → Extract PCM from WAV (if WAV container)
  → Decode to PCM (if PCMU/PCMA encoding)
  → Normalize to 16-bit PCM (if 24-bit, never 8-bit source)
  → Convert FROM PCM:
     - Resample (sample rate)
     - Convert bit depth (if needed)
     - Convert channels (if needed)
  → Encode FROM PCM (if target is PCMU/PCMA)
  → Wrap in container (if target is WAV)
  → Requested format
```

## Current State

- SDK requests format in `hello` message (`requestedOutputFormat`)
- Backend responds with negotiated format in `hello_ack` (`outputAudioFormat`)
- SDK currently uses whatever backend sends (with basic PCMU/PCMA decoding)
- No conversion happens if formats don't match

## Goals

1. **Automatic Format Conversion**: Convert incoming audio to match requested format
2. **Transparent Operation**: User doesn't need to know about backend format mismatches
3. **Quality Preservation**: Minimize quality loss during conversion
4. **Performance**: Efficient conversion with minimal latency

## Architecture

### 1. Format Converter Class

**Location**: `src/v2/utils/AudioFormatConverter.js`

**Responsibilities**:
- Convert between different audio formats
- Handle container conversion (raw ↔ wav)
- Handle encoding conversion (pcm ↔ pcmu ↔ pcma)
- Handle sample rate conversion (resampling)
- Handle bit depth conversion (8-bit ↔ 16-bit ↔ 24-bit)
- Handle channel conversion (mono ↔ stereo)

**Interface**:
```javascript
class AudioFormatConverter {
  constructor(requestedFormat, actualFormat) {
    // requestedFormat: What user wants
    // actualFormat: What backend is sending
    // All conversions will go: actualFormat → PCM → requestedFormat
  }
  
  // Main conversion method
  async convert(audioData) {
    // Step 1: Decode to PCM (if not already PCM)
    // Step 2: Convert FROM PCM to requested format
    // Returns converted audio in requested format
  }
  
  // Check if conversion is needed
  needsConversion() {
    // Returns true if formats differ
  }
  
  // Get conversion steps
  getConversionSteps() {
    // Returns array of conversion operations needed
    // Format: ["decode: PCMU → PCM", "resample: 8kHz → 16kHz", "encode: PCM → PCMU"]
  }
}
```

### 2. Conversion Pipeline

**Key Principle: All conversions start FROM PCM**

**Steps** (in order):
1. **Container Extraction**: Extract PCM from WAV if needed (WAV → Raw PCM)
   - Parse WAV header to get format info
   - Extract raw PCM data (skip 44-byte header)
2. **Encoding Decode**: Decode to PCM (PCMU/PCMA → PCM) - **This is the starting point**
   - If already PCM (raw or from WAV), skip this step
   - Use existing codecs: `PCMUCodec.decode()`, `PCMACodec.decode()`
3. **Bit Depth Normalize**: Convert to 16-bit PCM (intermediate format for processing)
   - Input: 16-bit or 24-bit PCM (NEVER 8-bit)
   - Convert 24-bit → 16-bit if needed (scale down)
   - Keep 16-bit as-is
4. **Sample Rate Resample**: Resample PCM to target sample rate (FROM PCM)
   - Use Web Audio API `OfflineAudioContext` for high-quality resampling
5. **Channel Convert**: Convert channels if needed (FROM PCM)
   - Currently always mono (1 channel), but prepare for future
6. **Bit Depth Convert**: Convert PCM to target bit depth (FROM PCM)
   - 16-bit → 8-bit: Scale down (if requested, rare)
   - 16-bit → 24-bit: Scale up (if requested, rare)
   - Keep 16-bit as-is (most common)
7. **Encoding Encode**: Encode PCM to target encoding (FROM PCM → PCMU/PCMA if needed)
   - PCM → PCMU: Use `PCMUCodec.encode()` (if implemented)
   - PCM → PCMA: Use `PCMACodec.encode()` (if implemented)
   - Keep PCM as-is (most common)
8. **Container Wrap**: Wrap in target container (WAV header if needed)
   - Raw → WAV: Add WAV header with format info
   - Keep raw as-is (if requested)

### 3. Integration Points

#### A. VoiceSDK Integration

**In `handleHelloAck()`**:
```javascript
handleHelloAck(message) {
  this.outputAudioFormat = message.outputAudioFormat; // What backend sends
  this.requestedOutputFormat = { // What user wants
    container: this.config.outputContainer,
    encoding: this.config.outputEncoding,
    sampleRate: this.config.outputSampleRate,
    bitDepth: this.config.outputBitDepth,
    channels: this.config.outputChannels
  };
  
  // Create converter if formats differ
  if (this.needsFormatConversion()) {
    this.formatConverter = new AudioFormatConverter(
      this.requestedOutputFormat,
      this.outputAudioFormat
    );
    console.log('🔄 Format conversion enabled:', this.formatConverter.getConversionSteps());
  }
}
```

**In `handleBinaryMessage()`**:
```javascript
async handleBinaryMessage(data) {
  let arrayBuffer = /* convert to ArrayBuffer */;
  
  // Convert format if needed
  if (this.formatConverter && this.formatConverter.needsConversion()) {
    arrayBuffer = await this.formatConverter.convert(arrayBuffer);
    console.log('🔄 Converted audio to requested format');
  }
  
  // Continue with normal playback
  // ...
}
```

#### B. AudioPlayer Integration

**Option 1**: Convert in VoiceSDK (before AudioPlayer)
- ✅ Cleaner separation of concerns
- ✅ AudioPlayer always receives requested format
- ✅ Easier to test

**Option 2**: Convert in AudioPlayer
- ❌ AudioPlayer becomes more complex
- ❌ Harder to test conversion separately

**Recommendation**: Convert in VoiceSDK before passing to AudioPlayer

### 4. Conversion Components

#### A. Container Converter
- **WAV → Raw PCM**: 
  - Parse WAV header to get format info (sample rate, bit depth, channels)
  - Extract raw PCM data (skip WAV header, typically 44 bytes)
  - Handle variable-length WAV headers (find "data" chunk)
- **Raw → WAV**: 
  - Add WAV header with format info (sample rate, bit depth, channels)
  - Create standard 44-byte WAV header

#### B. Encoding Converter
- **PCMU → PCM**: Use existing `PCMUCodec.decode()` (decode to PCM first)
- **PCMA → PCM**: Use existing `PCMACodec.decode()` (decode to PCM first)
- **PCM → PCMU**: Use `PCMUCodec.encode()` (convert FROM PCM)
- **PCM → PCMA**: Use `PCMACodec.encode()` (convert FROM PCM)

**Note**: All encoding conversions are FROM PCM (the universal intermediate format)

#### C. Sample Rate Converter
- **Resampling**: Use Web Audio API `OfflineAudioContext` for high-quality resampling
- **Input**: Always PCM (after decoding from PCMU/PCMA if needed)
- **Output**: PCM at target sample rate
- **Supported rates**: 8000, 16000, 22050, 24000, 44100, 48000 Hz
- **Quality**: Linear interpolation (fast) or cubic interpolation (better quality)
- **Backend uses**: Manual linear interpolation (see `AudioUtil.manualResample()`)

#### D. Bit Depth Converter
- **Input**: Always PCM (after decoding/extraction)
- **Input bit depths**: 16-bit or 24-bit (NEVER 8-bit as source)
- **Output**: PCM at target bit depth
- **24-bit → 16-bit**: Scale down (already implemented in AudioPlayer, FROM PCM)
- **16-bit → 16-bit**: No conversion needed (most common)
- **16-bit → 8-bit**: Scale down and clamp (rare, FROM PCM)
- **16-bit → 24-bit**: Scale up (rare, FROM PCM)
- **Backend uses**: Similar logic in `AudioUtil.convertBitDepth()`

#### E. Channel Converter
- **Mono → Stereo**: Duplicate channel
- **Stereo → Mono**: Average channels (if needed in future)

### 5. Implementation Details

#### Sample Rate Resampling

**Option 1: Web Audio API (Recommended)**
```javascript
async resample(audioData, fromRate, toRate) {
  const offlineContext = new OfflineAudioContext(
    1, // channels
    audioData.length * toRate / fromRate, // length
    toRate // sample rate
  );
  
  const source = offlineContext.createBufferSource();
  const buffer = offlineContext.createBuffer(
    1,
    audioData.length,
    fromRate
  );
  buffer.getChannelData(0).set(audioData);
  source.buffer = buffer;
  source.connect(offlineContext.destination);
  source.start();
  
  const resampled = await offlineContext.startRendering();
  return resampled.getChannelData(0);
}
```

**Option 2: Manual Interpolation**
- Linear interpolation (faster, lower quality)
- Cubic interpolation (slower, better quality)

#### Performance Considerations

1. **Async Conversion**: Use async/await for resampling (Web Audio API)
2. **Chunked Processing**: Process in chunks to avoid blocking
3. **Caching**: Cache converter instances if formats don't change
4. **Lazy Conversion**: Only convert if formats actually differ

### 6. Error Handling

- **Unsupported Conversion**: Log warning, use backend format
- **Conversion Failure**: Fall back to backend format
- **Quality Loss Warning**: Warn user if conversion causes quality loss

### 7. Testing Strategy

1. **Unit Tests**: Test each conversion component separately
2. **Integration Tests**: Test full conversion pipeline
3. **Format Mismatch Tests**: Test all format combinations
4. **Performance Tests**: Measure conversion overhead

### 8. File Structure

```
src/v2/
  utils/
    AudioFormatConverter.js      # Main converter class
    converters/
      ContainerConverter.js      # WAV ↔ Raw
      EncodingConverter.js       # PCM ↔ PCMU ↔ PCMA
      SampleRateConverter.js     # Resampling
      BitDepthConverter.js       # Bit depth conversion
      ChannelConverter.js         # Channel conversion
```

### 9. Example Usage

```javascript
// User requests 16kHz PCM raw
const sdk = new VoiceSDK_v2({
  outputSampleRate: 16000,
  outputEncoding: 'pcm',
  outputContainer: 'raw',
  outputBitDepth: 16
});

// Example 1: Backend sends 8kHz PCMU raw
// Converter automatically:
// 1. Decodes PCMU → PCM (16-bit)
// 2. Resamples 8kHz → 16kHz (FROM PCM)
// 3. Returns 16kHz PCM raw (as requested)

// Example 2: Backend sends 24kHz PCM WAV
// Converter automatically:
// 1. Extracts PCM from WAV (16-bit or 24-bit, never 8-bit)
// 2. Normalizes to 16-bit PCM (if 24-bit)
// 3. Resamples 24kHz → 16kHz (FROM PCM)
// 4. Returns 16kHz PCM raw (as requested)

// Example 3: Backend sends 16kHz PCM raw, user wants 8kHz PCMU
// Converter automatically:
// 1. Already PCM, no decode needed
// 2. Resamples 16kHz → 8kHz (FROM PCM)
// 3. Encodes PCM → PCMU (FROM PCM)
// 4. Returns 8kHz PCMU raw (as requested)

// User gets exactly what they requested, transparently!
```

### 10. Migration Path

1. **Phase 1**: Create converter class and basic conversions (container, encoding)
2. **Phase 2**: Add sample rate resampling
3. **Phase 3**: Add bit depth conversion
4. **Phase 4**: Add channel conversion (if needed)
5. **Phase 5**: Optimize performance and add caching

## Benefits

1. **User Control**: Users get exactly what they request
2. **Backend Flexibility**: Backend can send any format, SDK handles it
3. **Quality Consistency**: All audio plays at requested quality
4. **Transparent**: No API changes needed
5. **Future-Proof**: Easy to add new format support

## Potential Issues

1. **Latency**: Resampling adds processing time (mitigate with async)
2. **Quality Loss**: Some conversions lose quality (warn user)
3. **Performance**: Conversion overhead (optimize with caching)
4. **Browser Compatibility**: Web Audio API support (use fallback)

## Next Steps

1. ✅ Create plan (this document)
2. ⏳ Create `AudioFormatConverter` class structure
3. ⏳ Implement container conversion
4. ⏳ Implement encoding conversion (reuse existing codecs)
5. ⏳ Implement sample rate resampling
6. ⏳ Implement bit depth conversion
7. ⏳ Integrate into VoiceSDK
8. ⏳ Add tests
9. ⏳ Optimize performance

