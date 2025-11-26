// src/v2/AudioPlayer.js

import EventEmitter from '../shared/EventEmitter.js';

import PCMCodec from './codecs/PCMCodec.js';

import PCMUCodec from './codecs/PCMUCodec.js';

import PCMACodec from './codecs/PCMACodec.js';



/**

 * AudioPlayer v2 - Handles multiple audio formats with codec support

 * 

 * Features:

 * - Auto-detects WAV files vs raw audio data

 * - Supports PCM, PCMU (μ-law), PCMA (A-law) encodings

 * - Handles both WAV containers and raw streams

 * - Queues audio for smooth playback

 * 

 * Events:

 * - 'playbackStarted' - Audio playback begins

 * - 'playbackStopped' - Audio playback ends

 * - 'playbackError' - Error during playback

 */

class AudioPlayer extends EventEmitter {

  constructor(config = {}) {

    super();

    

    this.config = config;

    this.audioContext = null;

    this.audioQueue = [];

    this.isPlaying = false;

    this.isProcessingQueue = false;

    this.currentSource = null;

    this.outputFormat = null;

    // Audio scheduling for seamless PCM chunk playback

    this.nextStartTime = 0;

    this.scheduledBuffers = 0;

    // Track all scheduled AudioBufferSource nodes (for stopping on barge-in)
    this.scheduledSources = new Set();

    // Queue for raw PCM chunks (before processing)
    this.pcmChunkQueue = [];

    // Queue for prepared AudioBuffers (ready to schedule)
    this.preparedBuffer = [];

    this.isProcessingPcmQueue = false;

    this.isSchedulingFrames = false;

    // Minimal scheduling delay to avoid scheduling audio in the past
    // REMOVED: Lookahead buffering was causing quality degradation due to browser resampling/timing issues
    // Now we only schedule with minimal delay (20ms) just enough to avoid gaps
    this.MAX_LOOKAHEAD_SECONDS = 0.02; // 20ms minimal delay to avoid scheduling in the past

    

    // Codec registry

    this.codecs = {

      pcm: new PCMCodec(),

      pcmu: new PCMUCodec(),

      pcma: new PCMACodec()

    };

    

    // Supported OUTPUT formats (matching backend validation)

    this.SUPPORTED_CONTAINERS = ['wav', 'raw'];

    this.SUPPORTED_ENCODINGS = ['pcm', 'pcmu', 'pcma']; // Backend only supports these three

    this.SUPPORTED_SAMPLE_RATES = [8000, 16000, 22050, 24000, 44100, 48000]; // Backend supported rates

    this.SUPPORTED_BIT_DEPTHS = [8, 16, 24];

    this.SUPPORTED_CHANNELS = [1]; // Backend only supports mono

    

    console.log('🎵 AudioPlayer v2 initialized');

  }

  

  /**

   * Set the expected output audio format

   * @param {Object} format - Audio format specification

   * @param {string} format.container - 'wav' or 'raw'

   * @param {string} format.encoding - 'pcm', 'pcmu', 'pcma'

   * @param {number} format.sampleRate - Sample rate in Hz

   * @param {number} format.channels - Number of channels (1 or 2)

   * @param {number} format.bitDepth - Bit depth (8, 16, 24)

   */

  setOutputFormat(format) {

    if (!this.validateFormat(format)) {

      console.warn('⚠️ AudioPlayer: Invalid format, using defaults:', format);

      format = this.getDefaultFormat();

    }

    

    const oldSampleRate = this.outputFormat?.sampleRate;

    const newSampleRate = format.sampleRate;

    

    this.outputFormat = format;

    console.log('✅ AudioPlayer v2: Format set:', format);

    

    // CRITICAL: If AudioContext already exists and sample rate changed, recreate it

    if (this.audioContext && oldSampleRate && oldSampleRate !== newSampleRate) {

      console.warn('⚠️ AudioPlayer: Sample rate changed, recreating AudioContext');

      console.warn(`   Old: ${oldSampleRate}Hz → New: ${newSampleRate}Hz`);

      

      // Stop any playing audio first

      this.stopImmediate();

      

      // Close old context

      if (this.audioContext.state !== 'closed') {

        this.audioContext.close();

      }

      this.audioContext = null;

      

      console.log('ℹ️ AudioContext will be recreated on next audio chunk with correct sample rate');

    }

  }

  

  /**

   * Validate audio format

   */

  validateFormat(format) {

    if (!format) return false;

    

    const container = format.container?.toLowerCase();

    const encoding = format.encoding?.toLowerCase();

    

    return (

      container &&

      encoding &&

      this.SUPPORTED_CONTAINERS.includes(container) &&

      this.SUPPORTED_ENCODINGS.includes(encoding) &&

      this.SUPPORTED_SAMPLE_RATES.includes(format.sampleRate) &&

      this.SUPPORTED_BIT_DEPTHS.includes(format.bitDepth) &&

      (!format.channels || this.SUPPORTED_CHANNELS.includes(format.channels))

    );

  }

  

  /**

   * Get default audio format

   */

  getDefaultFormat() {

    return {

      container: 'raw',

      encoding: 'pcm',

      sampleRate: 16000,

      channels: 1,

      bitDepth: 16

    };

  }

  

  /**

   * Play audio data

   * @param {ArrayBuffer|Uint8Array} binaryData - Audio data to play

   */

  playAudio(binaryData) {

    try {

      const audioBlob = this.createAudioBlob(binaryData);

      this.audioQueue.push(audioBlob);

      

      // Start processing queue if not already playing

      if (!this.isPlaying && !this.isProcessingQueue && !this.currentSource) {

        setTimeout(() => this.processQueue(), 50);

      }

    } catch (error) {

      console.error('❌ AudioPlayer v2: Playback error:', error);

      this.emit('playbackError', error);

    }

  }

  

  /**

   * Play raw PCM chunk directly with seamless scheduling

   * This method bypasses blob creation and directly schedules audio chunks

   * for lower latency and seamless playback. Chunks are queued and processed

   * sequentially to handle bursts of incoming data.

   * 

   * @param {ArrayBuffer|Uint8Array} pcmData - Raw 16-bit PCM audio data

   */

  async playChunk(pcmData) {

    // Pre-process frame immediately (convert to AudioBuffer)
    const preparedFrame = this.prepareChunk(pcmData);

    if (preparedFrame) {

      // Add prepared frame to buffer
      this.preparedBuffer.push(preparedFrame);
      
      // Log frame arrival for debugging
      if (this.preparedBuffer.length <= 3 || this.preparedBuffer.length % 10 === 0) {
        console.log(`📥 AudioPlayer: Frame received, queued: ${this.preparedBuffer.length}, scheduled: ${this.scheduledBuffers}, isScheduling: ${this.isSchedulingFrames}`);
      }

      

      // Always try to schedule prepared frames

      // Use requestAnimationFrame to avoid blocking, but ensure scheduling happens

      if (!this.isSchedulingFrames) {

        // Schedule immediately if not already scheduling

        this.schedulePreparedFrames();

      } else {

        // Already scheduling, but ensure we'll schedule this new frame too

        // The scheduling loop will pick it up, but we can also trigger a re-check

        // Use a short timeout to ensure we check again after current scheduling completes

        setTimeout(() => {

          if (this.preparedBuffer.length > 0 && !this.isSchedulingFrames) {

            this.schedulePreparedFrames();

          }

        }, 5); // Very short delay to check after current scheduling completes

      }

      

      // Also process any raw chunks in queue (for backward compatibility)

      if (this.pcmChunkQueue.length > 0 && !this.isProcessingPcmQueue) {

        this.processPcmQueue();

      }

    } else {

      // prepareChunk returned null - log error for debugging
      console.error('❌ AudioPlayer: playChunk failed - prepareChunk returned null');
      console.error('   pcmData length:', pcmData?.byteLength || 'undefined');
      console.error('   outputFormat:', this.outputFormat);
      console.error('   audioContext:', this.audioContext ? 'initialized' : 'not initialized');
      console.error('   audioContext state:', this.audioContext?.state || 'N/A');
      
      // Emit error event
      this.emit('playbackError', new Error('Failed to prepare PCM chunk for playback'));
    }

  }

  

  /**

   * Pre-process a PCM chunk: convert to Float32 and create AudioBuffer

   * This happens immediately when frame arrives, not during playback

   * @param {ArrayBuffer|Uint8Array} pcmData - Raw PCM data

   * @returns {Object|null} Prepared frame with AudioBuffer and metadata

   */

  prepareChunk(pcmData) {

    try {

      // Ensure output format is set
      if (!this.outputFormat) {
        console.error('❌ AudioPlayer: Cannot prepare chunk - outputFormat not set');
        console.error('   Call setOutputFormat() before playing audio chunks');
        return null;
      }

      // Ensure audio context is initialized

      if (!this.audioContext) {

        this.initializeAudioContext();

      }

      

      if (!this.audioContext) {

        console.error('❌ AudioPlayer: Cannot prepare chunk - AudioContext not available');

        return null;

      }

      

      // Ensure even byte count for 16-bit PCM

      let processedData = pcmData;

      if (pcmData.byteLength % 2 !== 0) {

        console.warn('⚠️ Odd PCM chunk size, padding:', pcmData.byteLength);

        const padded = new Uint8Array(pcmData.byteLength + 1);

        padded.set(new Uint8Array(pcmData), 0);

        padded[pcmData.byteLength] = 0; // Silence padding

        processedData = padded.buffer;

      }

      

      // Convert Int16 PCM to Float32 (pre-processing)

      const int16Array = new Int16Array(processedData);

      const float32Array = new Float32Array(int16Array.length);

      const NORMALIZATION = 1.0 / 32768.0;

      const length = int16Array.length;

      for (let i = 0; i < length; i++) {

        float32Array[i] = int16Array[i] * NORMALIZATION;

      }

      

      // Create audio buffer with the ACTUAL sample rate of the audio data

      const audioDataSampleRate = this.outputFormat?.sampleRate || this.audioContext.sampleRate;

      const contextSampleRate = this.audioContext.sampleRate;

      

      const audioBuffer = this.audioContext.createBuffer(

        1, // mono

        float32Array.length,

        audioDataSampleRate

      );

      

      audioBuffer.getChannelData(0).set(float32Array);

      // Calculate duration (handle browser resampling)

      const chunkDuration = audioBuffer.duration;

      const sampleCount = float32Array.length;

      let actualDuration = chunkDuration;

      

      if (contextSampleRate !== audioDataSampleRate) {

        actualDuration = sampleCount / contextSampleRate;

      }

      

      // Return prepared frame

      return {

        buffer: audioBuffer,

        duration: actualDuration,

        sampleRate: audioDataSampleRate,

        contextSampleRate: contextSampleRate

      };

      

    } catch (error) {

      console.error('❌ AudioPlayer: Error preparing chunk:', error);

      return null;

    }

  }

  /**
   * Apply fade-out to audio buffer (stub method to prevent errors)
   * This method is called by some code paths but doesn't need to do anything
   * @param {AudioBuffer} audioBuffer - Audio buffer to fade
   * @returns {AudioBuffer} - Same audio buffer (no modification)
   */
  applyFadeOut(audioBuffer) {
    // Stub method - fade-out is not needed for streaming audio
    // This method exists to prevent "is not a function" errors
    return audioBuffer;
  }

  

  /**

   * Schedule prepared frames ahead of time for smooth playback

   * This runs continuously to keep frames scheduled ahead

   */

  async schedulePreparedFrames() {

    if (this.isSchedulingFrames) {

      return;

    }

    

    this.isSchedulingFrames = true;
    
    // Schedule multiple frames ahead to ensure continuous playback
    // This prevents gaps when frames arrive slowly or there are timing delays
    // We schedule more frames ahead to maintain smooth playback
    // Increase lookahead if we have many frames queued
    let queuedFrames = this.preparedBuffer.length;
    let targetLookaheadFrames = Math.min(queuedFrames, 5); // Schedule up to 5 frames ahead, or all available if less
    if (targetLookaheadFrames === 0 && queuedFrames > 0) {
      targetLookaheadFrames = 1; // At least schedule 1 frame
    }

    

    try {

      // Initialize audio context if needed

      if (!this.audioContext) {

        this.initializeAudioContext();

      }

      

      // Resume if suspended

      if (this.audioContext.state === 'suspended') {

        await this.audioContext.resume();

      }

      

      // Schedule frames up to target lookahead (ensures smooth playback)
      // Keep scheduling frames as long as we have them and haven't reached the lookahead limit
      let scheduledCount = 0;
      while (this.preparedBuffer.length > 0 && scheduledCount < targetLookaheadFrames) {

        // Get next prepared frame

        const preparedFrame = this.preparedBuffer.shift();

        if (!preparedFrame) {

          break;

        }

        

        // Create source and schedule playback

        const source = this.audioContext.createBufferSource();

        source.buffer = preparedFrame.buffer;

        source.connect(this.audioContext.destination);

        

        // Track this source so we can stop it on barge-in

        this.scheduledSources.add(source);

        

        // Calculate when to start this chunk

        const currentTime = this.audioContext.currentTime;

        

        // Ensure we don't schedule in the past, but NEVER decrease nextStartTime
        // This prevents overlapping audio by maintaining sequential ordering
        if (this.scheduledBuffers === 0) {

          // First chunk: start with minimal delay just enough to avoid scheduling in the past
          if (this.nextStartTime < currentTime) {

            this.nextStartTime = currentTime + this.MAX_LOOKAHEAD_SECONDS;

          }

          console.log('🎵 Starting playback with minimal delay:', this.nextStartTime);

        } else {

          // Subsequent chunks: ensure nextStartTime is not in the past
          // If nextStartTime is already in the future, use it (seamless playback)
          // If it's in the past, schedule with minimal delay
          const minStartTime = currentTime + this.MAX_LOOKAHEAD_SECONDS;

          if (this.nextStartTime < minStartTime) {
            // We've fallen behind, catch up but maintain seamless playback
            this.nextStartTime = minStartTime;
            console.warn(`⚠️ AudioPlayer: Fell behind schedule, adjusting nextStartTime to ${this.nextStartTime.toFixed(4)}s`);
          }
          // Always use nextStartTime (which is already calculated for seamless playback)

        }

        

        // Schedule this chunk to start at nextStartTime

        source.start(this.nextStartTime);

        

        // Calculate when the next chunk should start (seamless, no gaps)
        // This ensures sequential playback - each chunk starts after the previous one

        this.nextStartTime += preparedFrame.duration;

        

        // Round to prevent floating point accumulation errors

        this.nextStartTime = Math.round(this.nextStartTime * 1000000) / 1000000;

        

        // Log timing for debugging (more verbose logging)
        const startTime = this.nextStartTime - preparedFrame.duration;
        if (this.scheduledBuffers < 5) {
          console.log(`🎵 AudioPlayer: Scheduled frame ${this.scheduledBuffers + 1} at ${startTime.toFixed(4)}s, next at ${this.nextStartTime.toFixed(4)}s`);
          console.log(`   Duration: ${preparedFrame.duration.toFixed(4)}s (${(preparedFrame.duration * 1000).toFixed(2)}ms), Queued: ${this.preparedBuffer.length}, Scheduled: ${this.scheduledBuffers}`);
        }

        

        this.scheduledBuffers++;
        scheduledCount++; // Track how many we've scheduled in this batch

        

        // Track when this buffer finishes (for cleanup only)

        source.onended = () => {

          // Remove from tracked sources

          this.scheduledSources.delete(source);

          

          this.scheduledBuffers--;

          

          // If no more scheduled buffers and no prepared frames, playback is complete

          if (this.scheduledBuffers === 0 && this.preparedBuffer.length === 0 && this.pcmChunkQueue.length === 0) {

            this.isPlaying = false;

            this.isSchedulingFrames = false;

            console.log('🛑 AudioPlayer: Emitting playbackStopped event (all buffers finished)');

            this.emit('playbackStopped');

          } else if (this.preparedBuffer.length > 0) {

            // More frames available, schedule them immediately

            // Use setTimeout to avoid blocking, but schedule quickly

            setTimeout(() => {

              if (this.preparedBuffer.length > 0 && !this.isSchedulingFrames) {

                this.schedulePreparedFrames();

              }

            }, 0);

          } else if (this.scheduledBuffers > 0) {

            // No more prepared frames but still have scheduled buffers playing

            // Set up a check to schedule new frames when they arrive

            // Keep checking periodically until we have no more scheduled buffers

            const checkForMoreFrames = () => {

              if (this.preparedBuffer.length > 0 && !this.isSchedulingFrames && this.scheduledBuffers > 0) {

                this.schedulePreparedFrames();

              } else if (this.scheduledBuffers > 0) {

                // Keep checking - frames might arrive soon

                setTimeout(checkForMoreFrames, 10);

              }

            };

            setTimeout(checkForMoreFrames, 10); // Check more frequently (10ms) to catch new frames quickly

          }

        };

        

        if (!this.isPlaying) {

          this.isPlaying = true;

          console.log('🎵 AudioPlayer: Emitting playbackStarted event');

          this.emit('playbackStarted');

        }

      }

      

      // All prepared frames scheduled, reset flag

      this.isSchedulingFrames = false;

      

      // If more frames arrive while we were processing, schedule them now

      // Use requestAnimationFrame for smooth scheduling without blocking

      if (this.preparedBuffer.length > 0) {

        // More frames arrived, schedule them immediately

        requestAnimationFrame(() => {

          if (this.preparedBuffer.length > 0 && !this.isSchedulingFrames) {

            this.schedulePreparedFrames();

          }

        });

      }
      
      // Always set up a periodic check if we have scheduled buffers playing
      // This ensures continuous playback even if frames arrive slowly
      if (this.scheduledBuffers > 0) {

        // Set up a periodic check to schedule new frames as they arrive
        // Use a shorter interval to catch new frames quickly
        setTimeout(() => {

          if (this.preparedBuffer.length > 0 && !this.isSchedulingFrames && this.scheduledBuffers > 0) {

            this.schedulePreparedFrames();

          } else if (this.scheduledBuffers > 0) {

            // Keep checking even if no frames yet - they might arrive soon

            // Recursively check until we have no more scheduled buffers

            setTimeout(() => {

              if (this.preparedBuffer.length > 0 && !this.isSchedulingFrames && this.scheduledBuffers > 0) {

                this.schedulePreparedFrames();

              }

            }, 10);

          }

        }, 10); // Check every 10ms for new frames

      }

      

    } catch (error) {

      console.error('❌ AudioPlayer v2: Error scheduling frames:', error);

      this.emit('playbackError', error);

      this.isSchedulingFrames = false;

    }

  }

  

  /**

   * Process PCM chunk queue with seamless scheduling

   * Process one chunk at a time to ensure proper timing

   */

  async processPcmQueue() {

    if (this.isProcessingPcmQueue) {

      return;

    }

    this.isProcessingPcmQueue = true;

    

    try {

      // Initialize audio context if needed

      if (!this.audioContext) {

        this.initializeAudioContext();

      }

      

      // Resume if suspended

      if (this.audioContext.state === 'suspended') {

        await this.audioContext.resume();

      }

      // Process ALL queued chunks immediately with precise scheduling
      // This eliminates overhead from onended callbacks and setTimeout delays
      // The browser's AudioContext handles seamless playback automatically
      while (this.pcmChunkQueue.length > 0) {
        const pcmData = this.pcmChunkQueue.shift();

        if (!pcmData) {
          continue;
        }

        // Ensure even byte count for 16-bit PCM
        let processedData = pcmData;

        if (pcmData.byteLength % 2 !== 0) {
          console.warn('⚠️ Odd PCM chunk size, padding:', pcmData.byteLength);
          const padded = new Uint8Array(pcmData.byteLength + 1);
          padded.set(new Uint8Array(pcmData), 0);
          padded[pcmData.byteLength] = 0; // Silence padding
          processedData = padded.buffer;
        }

        // Convert Int16 PCM to Float32
        const int16Array = new Int16Array(processedData);
        const float32Array = new Float32Array(int16Array.length);
        const NORMALIZATION = 1.0 / 32768.0;
        const length = int16Array.length;
        for (let i = 0; i < length; i++) {
          float32Array[i] = int16Array[i] * NORMALIZATION;
        }

        // Create audio buffer with the ACTUAL sample rate of the audio data
        const audioDataSampleRate = this.outputFormat?.sampleRate || this.audioContext.sampleRate;
        const contextSampleRate = this.audioContext.sampleRate;
        
        if (!this.outputFormat?.sampleRate) {
          console.warn('⚠️ AudioPlayer: outputFormat.sampleRate not set! Using AudioContext sample rate:', contextSampleRate);
        } else if (this.scheduledBuffers < 3) {
          console.log(`🎵 AudioPlayer: Creating buffer at ${audioDataSampleRate}Hz (AudioContext: ${contextSampleRate}Hz)`);
        }
        
        const audioBuffer = this.audioContext.createBuffer(
          1, // mono
          float32Array.length,
          audioDataSampleRate
        );

        audioBuffer.getChannelData(0).set(float32Array);

        // Schedule playback with seamless timing
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);

        // Calculate when to start this chunk
        const currentTime = this.audioContext.currentTime;

        // If this is the first chunk or we've fallen behind, start immediately
        if (this.nextStartTime < currentTime) {
          this.nextStartTime = currentTime;
          if (this.scheduledBuffers === 0) {
            console.log('🎵 Starting playback at current time:', currentTime);
          }
        }

        // Calculate frame duration - handle browser resampling correctly
        const chunkDuration = audioBuffer.duration;
        const sampleCount = float32Array.length;
        let actualDuration = chunkDuration;
        
        if (contextSampleRate !== audioDataSampleRate) {
          actualDuration = sampleCount / contextSampleRate;
          
          if (this.scheduledBuffers < 3) {
            console.log(`🔄 Resampling detected: ${audioDataSampleRate}Hz → ${contextSampleRate}Hz`);
            console.log(`   Buffer duration: ${chunkDuration.toFixed(4)}s, Calculated: ${actualDuration.toFixed(4)}s`);
          }
        }
        
        // Schedule this chunk to start at nextStartTime
        source.start(this.nextStartTime);
        
        // Calculate when the next chunk should start (seamless, no gaps)
        this.nextStartTime += actualDuration;
        
        // Round to prevent floating point accumulation errors
        this.nextStartTime = Math.round(this.nextStartTime * 1000000) / 1000000;
        
        // Log timing for first few chunks (debugging)
        if (this.scheduledBuffers < 3) {
          const startTime = this.nextStartTime - actualDuration;
          console.log(`🎵 AudioPlayer: Scheduled chunk ${this.scheduledBuffers + 1} at ${startTime.toFixed(4)}s, next at ${this.nextStartTime.toFixed(4)}s`);
          console.log(`   Duration: ${actualDuration.toFixed(4)}s (${(actualDuration * 1000).toFixed(2)}ms)`);
        }

        this.scheduledBuffers++;

        // Track when this buffer finishes (for cleanup only, not for scheduling)
        source.onended = () => {
          this.scheduledBuffers--;

          // If no more scheduled buffers and queue is empty, playback is complete
          if (this.scheduledBuffers === 0 && this.pcmChunkQueue.length === 0) {
            this.isPlaying = false;
            this.isProcessingPcmQueue = false;
            this.emit('playbackStopped');
          }
        };

        if (!this.isPlaying) {
          this.isPlaying = true;
          this.emit('playbackStarted');
        }
      } // end while loop

      // All chunks scheduled, reset processing flag
      this.isProcessingPcmQueue = false;

    } catch (error) {

      console.error('❌ AudioPlayer v2: Error playing chunk:', error);

      this.emit('playbackError', error);

      this.isProcessingPcmQueue = false;

    }

  }

  

  /**

   * Create audio blob from binary data

   * Detects format and converts to browser-playable WAV

   */

  createAudioBlob(rawData) {

    const bytes = new Uint8Array(rawData);

    

    console.log(`🎵 AudioPlayer: Processing ${bytes.length} bytes`);

    console.log(`🎵 AudioPlayer: Negotiated format:`, this.outputFormat);

    

    // 1. Check negotiated format first
    // If format says "raw", trust that and don't auto-detect WAV
    // Only auto-detect if format is unknown or explicitly says "wav"
    
    const isNegotiatedWav = this.outputFormat && 
                           this.outputFormat.container && 
                           this.outputFormat.container.toLowerCase() === 'wav';
    
    const isNegotiatedRaw = this.outputFormat && 
                            this.outputFormat.container && 
                            this.outputFormat.container.toLowerCase() === 'raw';

    // 2. Check if data looks like WAV (for auto-detection when format is unknown or wav)
    const looksLikeWav = this.isWavFile(bytes);
    
    if (looksLikeWav) {
      console.log('🎵 AudioPlayer: Data has WAV header (RIFF)');
    }

    // 3. Decision logic:
    // Priority: Negotiated format > Auto-detection
    // BUT: If backend sends WAV when raw was negotiated, process as WAV (with warning)
    //      to avoid playback failures
    
    if (isNegotiatedRaw && looksLikeWav) {
      // Backend negotiated "raw" but sent WAV - backend is ignoring format request
      console.error('❌ AudioPlayer: CRITICAL MISMATCH!');
      console.error('   Negotiated format: RAW');
      console.error('   Actual data: WAV (RIFF header detected)');
      console.error('   Backend is ignoring format request and sending WAV anyway.');
      console.warn('⚠️ AudioPlayer: Processing as WAV to avoid playback failure, but UI configuration was bypassed.');
      // Process as WAV since that's what we actually received
      return this.handleWavFile(bytes);
    }
    
    if (isNegotiatedRaw && !looksLikeWav) {
      // Negotiated raw and data looks raw - process as raw
      console.log('🎵 AudioPlayer: Processing as RAW data (as negotiated)');
      // Fall through to handleRawData
    } else if (isNegotiatedWav && looksLikeWav) {
      // Negotiated WAV and data is WAV - perfect match
      console.log('✅ AudioPlayer: Processing as WAV file (matches negotiation)');
      return this.handleWavFile(bytes);
    } else if (isNegotiatedWav && !looksLikeWav) {
      // Negotiated WAV but data doesn't look like WAV - warn but try to process as WAV
      console.warn('⚠️ AudioPlayer: Negotiated WAV but data lacks WAV header. Attempting WAV processing anyway.');
      return this.handleWavFile(bytes);
    } else if (!this.outputFormat && looksLikeWav) {
      // No format negotiated, but data looks like WAV - auto-detect
      console.log('🎵 AudioPlayer: No format negotiated, auto-detecting WAV');
      return this.handleWavFile(bytes);
    } else if (!this.outputFormat && !looksLikeWav) {
      // No format negotiated, data doesn't look like WAV - use defaults
      console.warn('⚠️ AudioPlayer: No format negotiated and data not WAV, using defaults');
      this.outputFormat = this.getDefaultFormat();
    }
    
    // 4. Handle raw data based on negotiated format (if we get here)

    if (!this.outputFormat) {

      console.warn('⚠️ AudioPlayer: No format set, using defaults');

      this.outputFormat = this.getDefaultFormat();

    }

    

    console.log('🎵 AudioPlayer: Processing as RAW data with encoding:', this.outputFormat.encoding);

    return this.handleRawData(bytes);

  }

  

  /**

   * Check if data is a WAV file

   */

  isWavFile(bytes) {

    return bytes.length >= 44 &&

           bytes[0] === 0x52 && bytes[1] === 0x49 && // "RI"

           bytes[2] === 0x46 && bytes[3] === 0x46;   // "FF"

  }

  

  /**

   * Handle WAV file data

   */

  handleWavFile(bytes) {

    const wavInfo = this.parseWavHeader(bytes);

    

    console.log('🎵 WAV file detected:', {

      format: wavInfo.audioFormat,

      encoding: this.getEncodingName(wavInfo.audioFormat),

      sampleRate: wavInfo.sampleRate,

      channels: wavInfo.channels,

      bitDepth: wavInfo.bitsPerSample

    });

    

    // PCM WAV (format code 1) - browser can play directly

    if (wavInfo.audioFormat === 1) {

      console.log('✅ PCM WAV - using directly');

      return new Blob([bytes], { type: 'audio/wav' });

    }

    

    // Non-PCM WAV - need to convert to PCM

    const codec = this.getCodecForWavFormat(wavInfo.audioFormat);

    if (!codec) {

      throw new Error(`Unsupported WAV format code: ${wavInfo.audioFormat}`);

    }

    

    console.log('🔄 Non-PCM WAV - converting to PCM WAV');

    

    // Extract raw audio data (skip 44-byte header)

    const rawData = bytes.slice(44);

    

    // Decode to 16-bit PCM

    const pcm16 = codec.decode(rawData);

    

    // Wrap in new PCM WAV header

    const wavHeader = this.createWavHeader(

      pcm16.byteLength,

      wavInfo.sampleRate,

      wavInfo.channels,

      16 // Always decode to 16-bit PCM for browser

    );

    

    return new Blob([wavHeader, pcm16], { type: 'audio/wav' });

  }

  

  /**

   * Handle raw audio data (no WAV header)

   */

  handleRawData(bytes) {

    const encoding = this.outputFormat.encoding.toLowerCase();

    const codec = this.getCodec(encoding);

    

    if (!codec) {

      throw new Error(`No codec found for encoding: ${encoding}`);

    }

    

    console.log(`🎵 AudioPlayer: Decoding ${encoding.toUpperCase()} to PCM`);

    console.log(`🎵 AudioPlayer: Input format - bitDepth: ${this.outputFormat.bitDepth}, sampleRate: ${this.outputFormat.sampleRate}`);

    

    // Handle PCM data - use native bit depth when possible

    let pcmData;

    let outputBitDepth;

    

    if (encoding === 'pcm') {

      // Handle PCM data based on bit depth
      const bitDepth = this.outputFormat.bitDepth || 16;

      // Check if data length matches expected bit depth
      const expectedBytesPerSample = bitDepth / 8;
      const remainder = bytes.length % expectedBytesPerSample;
      
      if (bitDepth === 24) {
        // Convert 24-bit PCM to 16-bit PCM for browser compatibility
        // TODO: Implement proper 24-bit handling if needed
        console.warn(`⚠️ AudioPlayer: Format says 24-bit PCM, but browser support is limited.`);
        console.warn(`   Treating as 16-bit PCM. If audio sounds wrong, backend should send 16-bit instead.`);
        pcmData = this.convert24BitTo16Bit(bytes);
        outputBitDepth = 16;
      } else if (bitDepth === 8) {
        // Convert 8-bit PCM to 16-bit PCM
        console.log(`🔄 AudioPlayer: Converting 8-bit PCM to 16-bit PCM`);
        pcmData = this.convert8BitTo16Bit(bytes);
        outputBitDepth = 16;
      } else {
        // Use PCM data as-is for 16-bit (most common)
        pcmData = bytes.buffer;
        outputBitDepth = bitDepth;
        console.log(`✅ AudioPlayer: Using native ${bitDepth}-bit PCM (no conversion needed)`);
      }

      

    } else {

      // Non-PCM encoding - decode to 16-bit PCM (codecs output 16-bit)

      pcmData = codec.decode(bytes);

      outputBitDepth = 16;

      console.log(`🔄 AudioPlayer: Decoded ${encoding.toUpperCase()} to 16-bit PCM`);

    }

    

    // Wrap in PCM WAV header with correct bit depth

    // Modern browsers support 8-bit, 16-bit, and 24-bit WAV files

    const wavHeader = this.createWavHeader(

      pcmData.byteLength,

      this.outputFormat.sampleRate,

      this.outputFormat.channels,

      outputBitDepth // Use native bit depth

    );

    

    return new Blob([wavHeader, pcmData], { type: 'audio/wav' });

  }

  

  /**

   * Convert 24-bit PCM to 16-bit PCM

   * @param {Uint8Array} bytes - 24-bit PCM data (3 bytes per sample)

   * @returns {ArrayBuffer} - 16-bit PCM data (2 bytes per sample)

   */

  convert24BitTo16Bit(bytes) {

    const samples = Math.floor(bytes.length / 3);

    const pcm16 = new Int16Array(samples);

    

    for (let i = 0; i < samples; i++) {

      // Read 24-bit signed integer (little-endian: LSB first)
      // 24-bit PCM: 3 bytes per sample, signed integer
      const byte0 = bytes[i * 3];     // LSB (bits 0-7)
      const byte1 = bytes[i * 3 + 1]; // Middle (bits 8-15)
      const byte2 = bytes[i * 3 + 2]; // MSB (bits 16-23, sign bit is bit 23)

      

      // Combine bytes to 24-bit value (little-endian)
      // Use bitwise OR to combine, then handle sign extension
      let value24 = byte0 | (byte1 << 8) | ((byte2 & 0xFF) << 16);

      

      // Convert unsigned 24-bit to signed 32-bit integer
      // If sign bit (bit 23 = byte2 bit 7) is set, sign extend
      if (byte2 & 0x80) {

        // Negative: sign extend to 32-bit signed integer
        value24 = value24 | 0xFF000000;

      }

      

      // Convert signed 32-bit integer to signed 16-bit
      // Scale down by dividing by 256 (equivalent to right shift by 8)
      // 24-bit range: -8388608 to 8388607
      // 16-bit range: -32768 to 32767
      // Clamp to prevent overflow
      pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(value24 / 256)));

    }

    

    return pcm16.buffer;

  }

  

  /**

   * Convert 8-bit PCM to 16-bit PCM

   * @param {Uint8Array} bytes - 8-bit PCM data (1 byte per sample, unsigned 0-255)

   * @returns {ArrayBuffer} - 16-bit PCM data (2 bytes per sample)

   */

  convert8BitTo16Bit(bytes) {

    const samples = bytes.length;

    const pcm16 = new Int16Array(samples);

    

    for (let i = 0; i < samples; i++) {

      // 8-bit unsigned (0-255) -> 16-bit signed (-32768 to 32767)

      // Convert: (value - 128) * 256

      const value8 = bytes[i];

      pcm16[i] = (value8 - 128) * 256;

    }

    

    return pcm16.buffer;

  }

  

  /**

   * Get codec for encoding name

   */

  getCodec(encoding) {

    // Normalize encoding names

    const normalized = {

      'pcm': 'pcm',

      'linear': 'pcm',

      'l16': 'pcm',

      'pcmu': 'pcmu',

      'ulaw': 'pcmu',

      'mulaw': 'pcmu',

      'g711u': 'pcmu',

      'pcma': 'pcma',

      'alaw': 'pcma',

      'g711a': 'pcma'

    }[encoding.toLowerCase()];

    

    return this.codecs[normalized];

  }

  

  /**

   * Get codec for WAV format code

   */

  getCodecForWavFormat(audioFormat) {

    switch (audioFormat) {

      case 1: return this.codecs.pcm;   // PCM

      case 6: return this.codecs.pcma;  // A-law

      case 7: return this.codecs.pcmu;  // μ-law

      default: return null;

    }

  }

  

  /**

   * Get human-readable encoding name from WAV format code

   */

  getEncodingName(audioFormat) {

    switch (audioFormat) {

      case 1: return 'PCM';

      case 6: return 'A-law';

      case 7: return 'μ-law';

      default: return `Unknown (${audioFormat})`;

    }

  }

  

  /**

   * Parse WAV file header

   */

  parseWavHeader(bytes) {

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    

    return {

      audioFormat: view.getUint16(20, true),      // 1=PCM, 6=A-law, 7=μ-law

      channels: view.getUint16(22, true),

      sampleRate: view.getUint32(24, true),

      byteRate: view.getUint32(28, true),

      blockAlign: view.getUint16(32, true),

      bitsPerSample: view.getUint16(34, true)

    };

  }

  

  /**

   * Create WAV header

   */

  createWavHeader(dataLength, sampleRate, numChannels, bitsPerSample) {

    const header = new ArrayBuffer(44);

    const view = new DataView(header);

    

    // RIFF header

    view.setUint32(0, 0x52494646, false); // "RIFF"

    view.setUint32(4, 36 + dataLength, true);

    view.setUint32(8, 0x57415645, false); // "WAVE"

    

    // fmt chunk

    view.setUint32(12, 0x666D7420, false); // "fmt "

    view.setUint32(16, 16, true);           // Subchunk size

    view.setUint16(20, 1, true);            // Audio format (1 = PCM)

    view.setUint16(22, numChannels, true);

    view.setUint32(24, sampleRate, true);

    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); // Byte rate

    view.setUint16(32, numChannels * bitsPerSample / 8, true); // Block align

    view.setUint16(34, bitsPerSample, true);

    

    // data chunk

    view.setUint32(36, 0x64617461, false); // "data"

    view.setUint32(40, dataLength, true);

    

    return header;

  }

  

  /**
  /**
   *
   * Initialize audio context with correct sample rate
   *
   */
  initializeAudioContext() {
    // Use negotiated sample rate, but prefer 48kHz to avoid browser resampling
    // Most browsers default to 48kHz, so requesting it avoids resampling overhead
    let desiredSampleRate = this.outputFormat?.sampleRate || 48000;
    
    // If backend sends non-standard rate (like 22050Hz), check if browser supports it
    // If not, prefer 48kHz to avoid resampling issues
    if (desiredSampleRate !== 48000 && desiredSampleRate !== 44100) {
      // For non-standard rates, try to use browser's native rate to avoid resampling
      // This prevents tiny cuts caused by browser resampling
      console.log(`ℹ️ AudioPlayer: Backend requested ${desiredSampleRate}Hz, but browser may resample to 48kHz`);
      console.log(`   Consider requesting 48kHz from backend to avoid resampling and improve quality`);
    }
    
    // Check if AudioContext exists and if it matches the desired sample rate
    if (this.audioContext) {
      const currentSampleRate = this.audioContext.sampleRate;
      // If sample rate differs significantly, recreate the AudioContext
      if (Math.abs(currentSampleRate - desiredSampleRate) > 100) {
        console.warn(`⚠️ AudioPlayer: AudioContext sample rate (${currentSampleRate}Hz) doesn't match format (${desiredSampleRate}Hz), recreating...`);
        this.stopImmediate();
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close();
        }
        this.audioContext = null;
      } else {
        // Sample rate matches (or close enough), no need to recreate
        return;
      }
    }

    console.log(`🎵 AudioPlayer: Creating AudioContext at ${desiredSampleRate}Hz (from outputFormat: ${this.outputFormat?.sampleRate || 'not set'})`);
    
    try {
      // Try to create with specific sample rate
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: desiredSampleRate,
        latencyHint: 'playback' // ✅ Better for streaming audio - prioritizes smooth playback over low latency
      });
      
      console.log(`✅ AudioContext created at ${this.audioContext.sampleRate}Hz (requested: ${desiredSampleRate}Hz)`);
      
      // ❌ CRITICAL: If browser can't create requested sample rate, we have a problem
      if (Math.abs(this.audioContext.sampleRate - desiredSampleRate) > 100) {
        console.error(`❌ CRITICAL: Browser sample rate mismatch!`);
        console.error(`   Requested: ${desiredSampleRate}Hz`);
        console.error(`   Got: ${this.audioContext.sampleRate}Hz`);
        console.error(`   This WILL cause audio distortion/noise!`);
        console.error(`   Solution: Backend should send ${this.audioContext.sampleRate}Hz audio instead`);
      } else if (this.audioContext.sampleRate !== desiredSampleRate) {
        console.warn(`⚠️ Browser adjusted sample rate: ${desiredSampleRate}Hz → ${this.audioContext.sampleRate}Hz`);
        console.warn(`   Browser will automatically resample audio.`);
      }
    } catch (error) {
      // Fallback to default if browser doesn't support custom sample rate
      console.error(`❌ Failed to create AudioContext:`, error);
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log(`ℹ️ Using browser default: ${this.audioContext.sampleRate}Hz`);
    }
  }

  

  /**

   *

   * Process audio queue

   *

   */

  async processQueue() {

    if (this.isProcessingQueue || this.audioQueue.length === 0) {

      return;

    }

    

    this.isProcessingQueue = true;

    const audioBlob = this.audioQueue.shift();

    

    if (!audioBlob) {

      this.isProcessingQueue = false;

      return;

    }

    

    try {

      const wasFirstPlay = !this.isPlaying && this.currentSource === null;

      

      // Initialize audio context if needed

      if (!this.audioContext) {

        this.initializeAudioContext();

      }

      

      // Resume if suspended

      if (this.audioContext.state === 'suspended') {

        await this.audioContext.resume();

      }

      

      // Decode audio

      const arrayBuffer = await audioBlob.arrayBuffer();

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      

      const shouldEmitStart = wasFirstPlay && !this.isPlaying && this.currentSource === null;

      

      // Create source

      const source = this.audioContext.createBufferSource();

      source.buffer = audioBuffer;

      source.connect(this.audioContext.destination);

      

      this.currentSource = source;

      this.isPlaying = true;

      

      // Emit playback started (only on first chunk)

      if (shouldEmitStart) {

        this.emit('playbackStarted');

      }

      

      // Handle end

      source.onended = () => {

        this.currentSource = null;

        this.isProcessingQueue = false;

        

        // Process next chunk

        if (this.audioQueue.length > 0) {

          setTimeout(() => this.processQueue(), 50);

        } else {

          // No more chunks - stop after delay

          setTimeout(() => {

            if (this.audioQueue.length === 0 && !this.currentSource) {

              this.isPlaying = false;

              this.emit('playbackStopped');

            }

          }, 100);

        }

      };

      

      // Start playback

      source.start();

      

    } catch (error) {

      console.error('❌ AudioPlayer v2: Error processing queue:', error);

      this.currentSource = null;

      this.emit('playbackError', error);

      

      // Try next chunk

      if (this.audioQueue.length > 0) {

        this.isProcessingQueue = false;

        setTimeout(() => this.processQueue(), 100);

      } else {

        this.isPlaying = false;

        this.isProcessingQueue = false;

        this.emit('playbackStopped');

      }

    }

  }

  

  /**

   * Stop audio playback immediately

   */

  stop() {

    this.stopImmediate();

  }

  

  /**

   * Reset player state and clear queue

   */

  reset() {

    this.stop();

    this.audioQueue = [];

    this.pcmChunkQueue = [];

  }

  

  /**

   * Stop playback and clear queue

   */

  stopImmediate() {

    const wasPlaying = this.isPlaying || this.currentSource !== null || this.scheduledSources.size > 0;

    

    console.log('🛑 AudioPlayer.stopImmediate() called');

    console.log('   isPlaying:', this.isPlaying);

    console.log('   currentSource:', this.currentSource !== null);

    console.log('   scheduledSources.size:', this.scheduledSources.size);

    console.log('   scheduledBuffers:', this.scheduledBuffers);

    

    // Stop current source (legacy queue-based system)

    if (this.currentSource) {

      try {

        console.log('   Stopping currentSource...');

        this.currentSource.stop();

      } catch (e) {

        // Ignore if already stopped

        console.log('   currentSource already stopped or error:', e.message);

      }

      this.currentSource = null;

    }

    

    // Stop ALL scheduled AudioBufferSource nodes (new lookahead system)

    // This is critical for barge-in to work properly

    if (this.scheduledSources.size > 0) {

      console.log(`   Stopping ${this.scheduledSources.size} scheduled sources...`);

      let stoppedCount = 0;

      for (const source of this.scheduledSources) {

        try {

          source.stop();

          stoppedCount++;

        } catch (e) {

          // Ignore if already stopped or not started yet

          console.log('   Source already stopped or not started:', e.message);

        }

      }

      console.log(`   Stopped ${stoppedCount} sources`);

      this.scheduledSources.clear();

    }

    

    // Clear state

    this.isPlaying = false;

    this.isProcessingQueue = false;

    this.audioQueue = [];

    

    // Clear PCM chunk queue and prepared buffer

    this.pcmChunkQueue = [];

    this.preparedBuffer = [];

    this.isProcessingPcmQueue = false;

    this.isSchedulingFrames = false;

    

    // Reset scheduling properties

    this.nextStartTime = 0;

    this.scheduledBuffers = 0;

    

    // Emit stopped event - CRITICAL for barge-in

    if (wasPlaying) {

      console.log('🛑 AudioPlayer: Emitting playbackStopped event (stopImmediate called)');

      this.emit('playbackStopped');

    }

  }

  

  /**

   * Get player status

   */

  getStatus() {

    return {

      isPlaying: this.isPlaying,

      isProcessingQueue: this.isProcessingQueue,

      queueLength: this.audioQueue.length,

      audioContextState: this.audioContext ? this.audioContext.state : 'closed',

      outputFormat: this.outputFormat,

      scheduledBuffers: this.scheduledBuffers,

      preparedBufferLength: this.preparedBuffer.length,

      scheduledSourcesCount: this.scheduledSources.size

    };

  }

  

  /**

   * Destroy player and release resources

   */

  destroy() {

    this.stop();

    

    if (this.audioContext && this.audioContext.state !== 'closed') {

      this.audioContext.close();

      this.audioContext = null;

    }

    

    this.removeAllListeners();

  }

}



export default AudioPlayer;

