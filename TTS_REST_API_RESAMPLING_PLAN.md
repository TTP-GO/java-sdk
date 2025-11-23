# TTS REST API Resampling Fix Plan

## Problem Analysis

### Current State

**Java SDK** (`TTSRequest.java`, `TtsRestClient.java`, `TtsStreamClient.java`):
- ✅ **Already sends format parameters** in request body:
  - `outputContainer` (raw/wav)
  - `outputEncoding` (pcm/pcmu/pcma)
  - `outputSampleRate` (Hz)
  - `outputBitDepth` (bits)
  - `outputChannels` (1/2)
  - `outputFrameDurationMs` (ms)

**TTS REST API Endpoints** (`TtsController.java`):
- `/api/v1/tts/synthesize` - Returns complete audio (Base64)
- `/api/v1/tts/stream` - Streams audio chunks (SSE)

**Issue**: Backend receives format parameters but **doesn't use them**:
- ✅ `TtsStreamRequest` DTO accepts format parameters (lines 578-583)
- ❌ `TtsSynthesizeRequest` DTO **missing format parameters** (lines 550-558) - needs to be added!
- ❌ **Backend ignores format parameters** - doesn't convert audio
- ❌ Directly calls `ttsClient.stream()` and returns TTS native format
- ❌ Returns TTS client's native format (usually 24kHz WAV from Kokoro, 22kHz from others)
- ❌ No resampling to requested `outputSampleRate`
- ❌ No encoding conversion (PCMU/PCMA)
- ❌ No WAV header stripping for `raw` container
- ❌ No bit depth conversion
- ❌ No frame duration handling

**Example**: Java SDK requests PCMU @ 8kHz, but backend returns 24kHz WAV PCM (ignores request)

**WebSocket Conversation Flow** (`ContinuousAudioService.java`):
- ✅ Uses `HighQualityResampler` for sample rate conversion
- ✅ Handles WAV header stripping
- ✅ Converts encoding (PCM ↔ PCMU ↔ PCMA)
- ✅ Handles bit depth conversion
- ✅ Properly frames audio chunks

### Root Cause

The TTS REST API endpoints don't use `ContinuousAudioService` or its resampling/format conversion logic. They directly stream from `TtsClient` without any processing.

---

## Solution Plan

### Phase 1: Extract Format Conversion Logic

**Goal**: Create a reusable service for audio format conversion that can be used by both `ContinuousAudioService` and `TtsController`.

#### 1.1 Create `AudioFormatConverterService.java`

**Location**: `com.smartterminal.service.AudioFormatConverterService`

**Responsibilities**:
- Sample rate conversion (using `HighQualityResampler`)
- Encoding conversion (PCM ↔ PCMU ↔ PCMA)
- WAV header parsing/stripping
- Bit depth conversion
- Channel conversion (mono/stereo)
- Frame duration handling

**Key Methods**:
```java
public class AudioFormatConverterService {
    
    /**
     * Convert audio from TTS format to requested format
     * 
     * @param audioData Raw audio bytes from TTS client
     * @param ttsFormat Format of TTS output (from TtsClient)
     * @param requestedFormat Format requested by client
     * @param sessionId Session ID for resampler caching
     * @return Converted audio bytes
     */
    public byte[] convertAudio(
        byte[] audioData,
        AudioFormat ttsFormat,
        AudioFormat requestedFormat,
        String sessionId
    );
    
    /**
     * Stream audio chunks with format conversion
     * 
     * @param audioChunks Flux of audio chunks from TTS
     * @param ttsFormat Format of TTS output
     * @param requestedFormat Format requested by client
     * @param sessionId Session ID for resampler caching
     * @return Flux of converted audio chunks
     */
    public Flux<byte[]> convertAudioStream(
        Flux<DataBuffer> audioChunks,
        AudioFormat ttsFormat,
        AudioFormat requestedFormat,
        String sessionId
    );
}
```

**Dependencies**:
- `HighQualityResampler` (for resampling)
- `AudioUtil` (for WAV parsing, encoding conversion)
- `ContinuousAudioService.getResampler()` (or extract to shared service)

#### 1.2 Create `AudioFormat.java` Model

**Location**: `com.smartterminal.dto.AudioFormat`

**Fields**:
```java
public class AudioFormat {
    private String container;  // "raw" or "wav"
    private String encoding;  // "pcm", "pcmu", "pcma"
    private int sampleRate;    // Hz
    private int bitDepth;      // bits
    private int channels;      // 1 or 2
    private Integer frameDurationMs; // Optional, for streaming
}
```

---

### Phase 2: Update TtsController

#### 2.1 Inject `AudioFormatConverterService`

```java
private final AudioFormatConverterService formatConverter;

public TtsController(
    // ... existing dependencies
    AudioFormatConverterService formatConverter
) {
    // ...
    this.formatConverter = formatConverter;
}
```

#### 2.2 Update `generateAudio()` Method

**Current Flow** (lines 415-486):
```java
ttsClient.stream(...)
    .collectList()
    .flatMap(dataBuffers -> {
        // Combine chunks
        // Return Base64
    });
```

**Note**: `TtsSynthesizeRequest` doesn't have format fields yet - need to add them!

**New Flow**:
```java
// 1. Get TTS format (from TtsClient metadata or detect from first chunk)
AudioFormat ttsFormat = detectTtsFormat(voiceId); // e.g., WAV @ 24kHz PCM

// 2. Build requested format from request (with defaults)
AudioFormat requestedFormat = AudioFormat.builder()
    .container(request.getOutputContainer() != null 
        ? request.getOutputContainer() 
        : "raw")
    .encoding(request.getOutputEncoding() != null 
        ? request.getOutputEncoding() 
        : "pcm")
    .sampleRate(request.getOutputSampleRate() != null 
        ? request.getOutputSampleRate() 
        : getSampleRate(voiceId))
    .bitDepth(request.getOutputBitDepth() != null 
        ? request.getOutputBitDepth() 
        : 16)
    .channels(request.getOutputChannels() != null 
        ? request.getOutputChannels() 
        : 1)
    .build();

// 3. Stream TTS, convert format, collect
return ttsClient.stream(...)
    .flatMap(dataBuffer -> {
        byte[] audioData = extractBytes(dataBuffer);
        
        // Convert format
        byte[] converted = formatConverter.convertAudio(
            audioData,
            ttsFormat,
            requestedFormat,
            conversationId
        );
        
        return Mono.just(converted);
    })
    .collectList()
    .flatMap(chunks -> {
        // Combine converted chunks
        // Return Base64
    });
```

#### 2.3 Update `streamAudio()` Method

**Current Flow** (lines 282-410):
```java
// ✅ Already reads format parameters from request (lines 298-302)
// ❌ But doesn't use them - just passes TTS output directly

ttsClient.stream(...)
    .map(dataBuffer -> {
        // Extract bytes
        // Return SSE event (with wrong format!)
    });
```

**New Flow**:
```java
// 1. Detect TTS format (from TtsClient or first chunk)
AudioFormat ttsFormat = detectTtsFormat(voiceId);

// 2. Build requested format (already read from request, lines 298-302)
AudioFormat requestedFormat = AudioFormat.builder()
    .container(request.getOutputContainer() != null 
        ? request.getOutputContainer() 
        : "raw")
    .encoding(request.getOutputEncoding() != null 
        ? request.getOutputEncoding() 
        : "pcm")
    .sampleRate(request.getOutputSampleRate() != null 
        ? request.getOutputSampleRate() 
        : getSampleRate(voiceId))
    .bitDepth(request.getOutputBitDepth() != null 
        ? request.getOutputBitDepth() 
        : 16)
    .channels(request.getOutputChannels() != null 
        ? request.getOutputChannels() 
        : 1)
    .frameDurationMs(request.getOutputFrameDurationMs() != null 
        ? request.getOutputFrameDurationMs() 
        : 600)
    .build();

// 3. Stream TTS, convert format, frame chunks
return ttsClient.stream(...)
    .flatMap(dataBuffer -> {
        byte[] audioData = extractBytes(dataBuffer);
        
        // Convert format
        return formatConverter.convertAudioStream(
            Flux.just(DataBufferFactory.wrap(audioData)),
            ttsFormat,
            requestedFormat,
            conversationId
        );
    })
    .map(convertedChunk -> {
        // Create SSE event with converted chunk
        return ServerSentEvent.builder()
            .event("audio")
            .data(createChunkData(convertedChunk, requestedFormat))
            .build();
    });
```

---

### Phase 3: Extract Shared Resampling Logic

#### 3.1 Extract `getResampler()` from `ContinuousAudioService`

**Option A**: Move to `AudioFormatConverterService`
- `AudioFormatConverterService` manages resamplers
- `ContinuousAudioService` uses `AudioFormatConverterService` for resampling

**Option B**: Create `ResamplerManager` service
- Shared service for resampler caching
- Both `ContinuousAudioService` and `AudioFormatConverterService` use it

**Recommendation**: Option A (simpler, less refactoring)

#### 3.2 Reuse WAV Parsing Logic

Extract WAV header parsing from `ContinuousAudioService`:
- `AudioUtil.parseWavHeader()` ✅ Already exists
- `AudioUtil.extractPcmData()` ✅ Already exists
- Use these in `AudioFormatConverterService`

---

### Phase 4: Handle Edge Cases

#### 4.1 First Chunk WAV Header

**Issue**: Kokoro TTS first chunk contains WAV header, subsequent chunks are raw PCM.

**Solution**: 
- Detect WAV header in first chunk
- Strip header, extract PCM
- Process remaining chunks as raw PCM

**Implementation**:
```java
private boolean isFirstChunk = true;

Flux<byte[]> convertedChunks = ttsClient.stream(...)
    .flatMap(dataBuffer -> {
        byte[] audioData = extractBytes(dataBuffer);
        
        if (isFirstChunk) {
            // Check for WAV header
            if (hasWavHeader(audioData)) {
                WavHeader header = AudioUtil.parseWavHeader(audioData);
                audioData = AudioUtil.extractPcmData(audioData, header);
                ttsFormat = AudioFormat.fromWavHeader(header);
                isFirstChunk = false;
            }
        }
        
        // Convert format
        return formatConverter.convertAudio(...);
    });
```

#### 4.2 Frame Duration Handling

**Issue**: Client requests specific frame duration (e.g., 20ms for phone systems).

**Solution**:
- Buffer audio until frame duration is reached
- Send frames at requested intervals
- Handle partial frames at end

**Implementation**:
```java
private byte[] frameBuffer = new byte[0];
private int frameSizeBytes = calculateFrameSize(requestedFormat);

Flux<byte[]> framedChunks = convertedChunks
    .flatMap(chunk -> {
        // Add to buffer
        frameBuffer = concat(frameBuffer, chunk);
        
        List<byte[]> frames = new ArrayList<>();
        
        // Extract complete frames
        while (frameBuffer.length >= frameSizeBytes) {
            byte[] frame = Arrays.copyOf(frameBuffer, frameSizeBytes);
            frames.add(frame);
            frameBuffer = Arrays.copyOfRange(
                frameBuffer, 
                frameSizeBytes, 
                frameBuffer.length
            );
        }
        
        return Flux.fromIterable(frames);
    })
    .concatWith(Flux.defer(() -> {
        // Flush remaining buffer (pad with silence if needed)
        if (frameBuffer.length > 0) {
            return Flux.just(padFrame(frameBuffer, frameSizeBytes));
        }
        return Flux.empty();
    }));
```

#### 4.3 Encoding Conversion (PCMU/PCMA)

**Issue**: TTS returns PCM, but client requests PCMU/PCMA.

**Solution**: Use `AudioUtil` encoding conversion methods:
- `AudioUtil.pcmToMulaw()` for PCMU
- `AudioUtil.pcmToAlaw()` for PCMA

**Implementation**:
```java
if (!ttsFormat.getEncoding().equals(requestedFormat.getEncoding())) {
    if ("pcmu".equals(requestedFormat.getEncoding())) {
        audioData = AudioUtil.pcmToMulaw(audioData);
    } else if ("pcma".equals(requestedFormat.getEncoding())) {
        audioData = AudioUtil.pcmToAlaw(audioData);
    }
}
```

---

### Phase 5: Testing

#### 5.1 Test Cases

1. **Sample Rate Conversion**
   - Request: 8kHz, TTS: 24kHz → Should resample to 8kHz
   - Request: 16kHz, TTS: 24kHz → Should resample to 16kHz
   - Request: 44.1kHz, TTS: 24kHz → Should resample to 44.1kHz

2. **Encoding Conversion**
   - Request: PCMU, TTS: PCM → Should convert to PCMU
   - Request: PCMA, TTS: PCM → Should convert to PCMA
   - Request: PCM, TTS: PCM → No conversion needed

3. **Container Conversion**
   - Request: `raw`, TTS: `wav` → Should strip WAV header
   - Request: `wav`, TTS: `wav` → Keep WAV header

4. **Frame Duration**
   - Request: 20ms frames → Should send 20ms chunks
   - Request: 100ms frames → Should send 100ms chunks

5. **Bit Depth**
   - Request: 16-bit, TTS: 24-bit → Should convert to 16-bit

#### 5.2 Integration Tests

- Test `/api/v1/tts/synthesize` with various format requests
- Test `/api/v1/tts/stream` with various format requests
- Compare output with WebSocket conversation flow (should match)

---

## Implementation Steps

### Step 1: Create `AudioFormat.java` DTO
- [ ] Create `com.smartterminal.dto.AudioFormat`
- [ ] Add builder pattern
- [ ] Add `fromWavHeader()` static method
- [ ] **Note**: Java SDK already has `AudioFormat.java` - ensure backend version matches structure

### Step 2: Create `AudioFormatConverterService.java`
- [ ] Create service class
- [ ] Inject `HighQualityResampler` (or extract resampler management)
- [ ] Implement `convertAudio()` method
- [ ] Implement `convertAudioStream()` method
- [ ] Handle WAV header detection/stripping
- [ ] Handle resampling
- [ ] Handle encoding conversion
- [ ] Handle bit depth conversion
- [ ] Handle frame duration

### Step 3: Update `TtsController.java`
- [ ] **Add format fields to `TtsSynthesizeRequest`** (currently missing, lines 550-558)
  - Add `outputContainer`, `outputEncoding`, `outputSampleRate`, `outputBitDepth`, `outputChannels`
  - Match structure of `TtsStreamRequest` (lines 578-583)
- [ ] Inject `AudioFormatConverterService`
- [ ] Update `generateAudio()` to:
  - Read format parameters from request (with defaults)
  - Detect TTS output format
  - Convert audio using `AudioFormatConverterService`
- [ ] Update `streamAudio()` to:
  - Use format parameters already read (lines 298-302)
  - Detect TTS output format
  - Convert audio chunks using `AudioFormatConverterService`
  - Frame chunks at requested `outputFrameDurationMs`
- [ ] Add format detection logic
- [ ] Handle first chunk WAV header

### Step 4: Extract/Refactor Resampler Management
- [ ] Option A: Move `getResampler()` to `AudioFormatConverterService`
- [ ] Option B: Create `ResamplerManager` service
- [ ] Update `ContinuousAudioService` to use shared resampler management

### Step 5: Testing
- [ ] Unit tests for `AudioFormatConverterService`
- [ ] Integration tests for `/synthesize` endpoint
- [ ] Integration tests for `/stream` endpoint
- [ ] Compare with WebSocket flow output

---

## Files to Modify

1. **New Files**:
   - `src/main/java/com/smartterminal/dto/AudioFormat.java`
   - `src/main/java/com/smartterminal/service/AudioFormatConverterService.java`

2. **Modified Files**:
   - `src/main/java/com/smartterminal/controller/TtsController.java`
     - Add format fields to `TtsSynthesizeRequest` (lines 550-558)
     - Update `generateAudio()` method (lines 415-486)
     - Update `streamAudio()` method (lines 282-410)
   - `src/main/java/com/smartterminal/service/ContinuousAudioService.java` (if extracting resampler management)

---

## Key Considerations

1. **Java SDK Compatibility**:
   - ✅ Java SDK already sends format parameters correctly
   - ✅ Both `TtsRestClient` and `TtsStreamClient` include format in JSON
   - ✅ Backend `TtsStreamRequest` already accepts format parameters
   - ⚠️ Backend `TtsSynthesizeRequest` needs format fields added

2. **Performance**: 
   - Cache resamplers per session (already done in `ContinuousAudioService`)
   - Reuse `HighQualityResampler` instances
   - Use same resampler caching strategy as WebSocket flow

3. **Memory**:
   - Stream processing (don't load entire audio into memory)
   - Release `DataBuffer` instances properly
   - For `/synthesize`, can collect all chunks (complete file)

4. **Error Handling**:
   - Handle unsupported format combinations
   - Graceful fallback if `libresample4j` not available
   - Validate format parameters match Java SDK expectations

5. **Consistency**:
   - Use same conversion logic as `ContinuousAudioService`
   - Ensure output matches WebSocket flow
   - Same resampling quality for both paths

---

## Success Criteria

✅ TTS REST API endpoints return audio in requested format
✅ Sample rate conversion works correctly
✅ Encoding conversion (PCMU/PCMA) works correctly
✅ WAV header stripping works for `raw` container
✅ Frame duration handling works for streaming
✅ Output matches WebSocket conversation flow quality
✅ No performance degradation

---

## Estimated Effort

- **Phase 1** (Extract format conversion): 4-6 hours
- **Phase 2** (Update TtsController): 3-4 hours
- **Phase 3** (Extract resampler management): 2-3 hours
- **Phase 4** (Edge cases): 3-4 hours
- **Phase 5** (Testing): 4-6 hours

**Total**: ~16-23 hours

---

## Next Steps

1. Review and approve plan
2. Start with Phase 1 (create `AudioFormatConverterService`)
3. Test incrementally after each phase
4. Compare output with WebSocket flow to ensure consistency

