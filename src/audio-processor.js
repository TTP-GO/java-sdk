/**
 * AudioProcessor - AudioWorklet for real-time audio processing
 * 
 * This AudioWorklet processes audio data in real-time and sends it to the main thread
 * for transmission to the WebSocket server.
 */

class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // Configuration
    this.config = options.processorOptions || {};
    this.sampleRate = this.config.sampleRate || 16000;
    this.bufferSize = 128; // Process 128 samples at a time (256 bytes = 8ms at 16kHz)
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // VAD (Voice Activity Detection) parameters
    this.silenceThreshold = 0.01; // RMS threshold for voice detection (increased from 0.005)
    this.minVoiceDuration = 100; // ms - minimum speech duration
    this.pauseThreshold = 3000; // ms - longer pause before processing
    
    // VAD state
    this.isVoiceActive = false;
    this.voiceStartTime = 0;
    this.lastVoiceTime = 0;
    this.consecutiveSilenceFrames = 0;
    this.silenceFramesThreshold = 5; // More frames needed for silence detection
    
    // Audio quality tracking
    this.frameCount = 0;
    this.lastLogTime = 0;
    
    // Continuous recording mode
    this.continuousMode = true; // Always send audio when voice is detected
    this.forceContinuous = true; // Force continuous for toggle button behavior
    this.isCurrentlyStreaming = false; // Track if we're currently sending audio
    
    // Batching buffer
    this.sendBuffer = null;
    this.sendBufferBytes = 0;
    
    // Handle messages from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'start':
          this.isProcessing = true;
          this.isCurrentlyStreaming = true;
          break;
          
        case 'stop':
          this.isProcessing = false;
          this.isCurrentlyStreaming = false;
          this.isVoiceActive = false;
          this.forceContinuous = false;
          // Flush any remaining data
          this.flushBuffer();
          break;
          
        case 'setForceContinuous':
          this.forceContinuous = data.enabled;
          this.isProcessing = true;
          this.isCurrentlyStreaming = true;
          break;
          
        case 'flush':
          this.flushBuffer();
          break;
          
        case 'config':
          Object.assign(this.config, data);
          break;
      }
    };
  }
  
  /**
   * Process audio data
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    // Copy input to output (pass-through)
    if (input.length > 0 && output.length > 0) {
      output[0].set(input[0]);
    }
    
    // Process audio for PCM recording and VAD
    if (input.length > 0 && input[0].length > 0) {
      this.processAudioData(input[0]);
    }
    
    // Keep the processor alive
    return true;
  }
  
  processAudioData(audioData) {
    this.frameCount++;
    
    // Process audio in consistent 128-sample chunks (256 bytes)
    for (let i = 0; i < audioData.length; i += this.bufferSize) {
      const chunkSize = Math.min(this.bufferSize, audioData.length - i);
      
      // Copy chunk to buffer
      for (let j = 0; j < chunkSize; j++) {
        this.buffer[j] = audioData[i + j];
      }
      
      // Pad with zeros if needed
      for (let j = chunkSize; j < this.bufferSize; j++) {
        this.buffer[j] = 0;
      }
      
      // Calculate RMS for VAD on this chunk
      let sum = 0;
      for (let j = 0; j < this.bufferSize; j++) {
        sum += this.buffer[j] * this.buffer[j];
      }
      const rms = Math.sqrt(sum / this.bufferSize);
      
      // Calculate additional features for better VAD
      let variation = 0;
      let highFreqCount = 0;
      for (let j = 1; j < this.bufferSize; j++) {
        const diff = Math.abs(this.buffer[j] - this.buffer[j-1]);
        variation += diff;
        if (diff > 0.1) highFreqCount++;
      }
      variation = variation / this.bufferSize;
      const highFreqRatio = highFreqCount / this.bufferSize;
      
      const currentTime = Date.now();
      
      // Simplified VAD - just use RMS threshold for maximum sensitivity
      let hasVoice = rms > this.silenceThreshold;
      // Calculate time since last voice detection
      const timeSinceLastVoice = currentTime - this.lastVoiceTime;

      // Voice detection logic - always use VAD to filter silence
      if (hasVoice) {
        this.consecutiveSilenceFrames = 0;

        // Start voice if needed
        if (!this.isVoiceActive) {
          this.isVoiceActive = true;
          this.voiceStartTime = currentTime;
          this.isCurrentlyStreaming = true;
        }

        this.lastVoiceTime = currentTime;
      } else {
        // Silence detected
        this.consecutiveSilenceFrames++;
        
        // In continuous mode, we still use VAD but require longer silence before stopping
        // In non-continuous mode, stop quickly
        const silenceThreshold = this.forceContinuous ? 1500 : 200; // 1.5s for continuous, 200ms otherwise
        
        // Stop condition - detect silence and stop streaming
        if (!hasVoice && this.isVoiceActive && timeSinceLastVoice >= silenceThreshold) {
          this.isVoiceActive = false;
          this.isCurrentlyStreaming = false;
          this.voiceStartTime = 0;
          this.lastVoiceTime = 0;
          this.consecutiveSilenceFrames = 0;
        }
      }

      // Send PCM **only if streaming and processing** - hard gate
      // This ensures we only send audio when voice is detected, even in continuous mode
      if (this.isCurrentlyStreaming && this.isProcessing) {
        this.sendPCMAudioData(this.buffer);
      }
    }
  }
  
  sendPCMAudioData(float32Data) {
    // Convert Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767)
    const pcmData = new Int16Array(float32Data.length);
    
    for (let i = 0; i < float32Data.length; i++) {
      // Clamp and convert to 16-bit PCM
      const sample = Math.max(-1.0, Math.min(1.0, float32Data[i]));
      pcmData[i] = Math.round(sample * 32767);
    }
    
    // Initialize send buffer if not exists
    if (!this.sendBuffer) {
      this.sendBuffer = [];
      this.sendBufferBytes = 0;
    }
    
    // Accumulate chunks in buffer
    this.sendBuffer.push(pcmData);
    this.sendBufferBytes += pcmData.byteLength;
    
    // Send in ~4 KB batches (≈128 ms of audio at 16kHz)
    // Use sliding window approach to maintain continuous flow
    while (this.sendBufferBytes >= 4096) {
      // Calculate how many chunks we need for ~4KB
      let chunksToSend = 0;
      let bytesToSend = 0;
      
      for (let i = 0; i < this.sendBuffer.length; i++) {
        const chunkBytes = this.sendBuffer[i].byteLength;
        if (bytesToSend + chunkBytes <= 4096) {
          chunksToSend++;
          bytesToSend += chunkBytes;
        } else {
          break;
        }
      }

      // Create merged buffer from selected chunks
      const chunksForBatch = this.sendBuffer.slice(0, chunksToSend);
      const totalSamples = chunksForBatch.reduce((a, b) => a + b.length, 0);
      const merged = new Int16Array(totalSamples);
      let offset = 0;
      
      for (const chunk of chunksForBatch) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Send batched PCM data to main thread
      this.port.postMessage({
        type: 'pcm_audio_data',
        data: merged, // Send the Int16Array directly, not the buffer
        sampleRate: this.sampleRate,
        channelCount: 1,
        frameCount: this.frameCount,
        batchSize: chunksToSend,
        totalBytes: merged.byteLength
      });
      
      // Remove sent chunks from buffer (sliding window)
      this.sendBuffer = this.sendBuffer.slice(chunksToSend);
      this.sendBufferBytes -= bytesToSend;
    }
  }
  
  // Flush any remaining buffered data
  flushBuffer() {
    if (this.sendBuffer && this.sendBuffer.length > 0) {
      // Merge remaining chunks
      const totalSamples = this.sendBuffer.reduce((a, b) => a + b.length, 0);
      const merged = new Int16Array(totalSamples);
      let offset = 0;
      
      for (const chunk of this.sendBuffer) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Send remaining data
      this.port.postMessage({
        type: 'pcm_audio_data',
        data: merged, // Send the Int16Array directly, not the buffer
        sampleRate: this.sampleRate,
        channelCount: 1,
        frameCount: this.frameCount,
        batchSize: this.sendBuffer.length,
        totalBytes: merged.byteLength,
        isFlush: true
      });
      
      // Reset buffer
      this.sendBuffer = [];
      this.sendBufferBytes = 0;
    }
  }
}

// Register the processor
registerProcessor('audio-processor', AudioProcessor);
