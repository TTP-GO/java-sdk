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

    // Queue for PCM chunks (used by playChunk)

    this.pcmChunkQueue = [];

    this.isProcessingPcmQueue = false;

    

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

    // Add to queue

    this.pcmChunkQueue.push(pcmData);

    

    // Start processing queue if not already processing

    if (!this.isProcessingPcmQueue) {

      this.processPcmQueue();

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

      // Process all queued chunks immediately with proper timing
      // This ensures frames arriving in bursts are scheduled correctly
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

      

      // Convert Int16 PCM to Float32 (optimized using TypedArray operations)
      // This is much faster than a loop - uses SIMD-like operations
      const int16Array = new Int16Array(processedData);
      const float32Array = new Float32Array(int16Array.length);
      
      // Use TypedArray.map() which is optimized by the browser
      // This is faster than a manual loop and avoids blocking
      const normalizationFactor = 1.0 / 32768.0;
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] * normalizationFactor;
      }
      
      // Alternative: Could use Int16Array.map() but it's not always faster
      // const float32Array = new Float32Array(
      //   Array.from(int16Array).map(sample => sample / 32768.0)
      // );

      

      // Create audio buffer with the ACTUAL sample rate of the audio data
      // The AudioContext will automatically resample if its sample rate differs
      const audioDataSampleRate = this.outputFormat?.sampleRate || this.audioContext.sampleRate;
      const contextSampleRate = this.audioContext.sampleRate;
      
      // CRITICAL: Log sample rate info for debugging
      if (!this.outputFormat?.sampleRate) {
        console.warn('⚠️ AudioPlayer: outputFormat.sampleRate not set! Using AudioContext sample rate:', contextSampleRate);
      } else {
        console.log(`🎵 AudioPlayer: Creating buffer at ${audioDataSampleRate}Hz (AudioContext: ${contextSampleRate}Hz)`);
      }
      
      // Create buffer at audio data sample rate - browser will resample to match context
      // This ensures correct playback speed even if browser can't create exact sample rate
      const audioBuffer = this.audioContext.createBuffer(

        1, // mono

        float32Array.length,

        audioDataSampleRate  // Use audio data rate for correct playback speed

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

        console.log('🎵 Starting playback at current time:', currentTime);

      }

      

      // Schedule this chunk

      source.start(this.nextStartTime);

      // Calculate frame duration from the actual audio buffer
      // This makes the frontend independent of backend frame size!
      // The backend can send any frame size, and we'll schedule it correctly
      const chunkDuration = audioBuffer.duration;
      
      // Schedule next chunk to start when this one ends (seamless playback)
      // Use the actual buffer duration for perfect timing (no gaps)
      this.nextStartTime += chunkDuration;
      
      // Ensure we don't have tiny gaps due to floating point precision
      // Round to nearest microsecond to prevent accumulation errors
      this.nextStartTime = Math.round(this.nextStartTime * 1000000) / 1000000;
      
      // Log timing for first few chunks (debugging)
      if (this.scheduledBuffers < 3) {
        console.log(`🎵 AudioPlayer: Scheduled chunk ${this.scheduledBuffers + 1} at ${(this.nextStartTime - chunkDuration).toFixed(4)}s, next at ${this.nextStartTime.toFixed(4)}s (duration: ${chunkDuration.toFixed(4)}s, ${(chunkDuration * 1000).toFixed(1)}ms)`);
      }

      

      this.scheduledBuffers++;

      

        // Track when this buffer finishes

        source.onended = () => {

          this.scheduledBuffers--;

          

          // If no more scheduled buffers and queue is empty, playback is complete

          if (this.scheduledBuffers === 0 && this.pcmChunkQueue.length === 0) {

            this.isPlaying = false;

            this.emit('playbackStopped');

          }

        };

      

        if (!this.isPlaying) {

          this.isPlaying = true;

          this.emit('playbackStarted');

        }

      } // end while loop

      // If there are more chunks, schedule next batch asynchronously
      // This prevents blocking the main thread for too long
      if (this.pcmChunkQueue.length > 0) {
        // Yield to browser, then process next batch
        setTimeout(() => {
          this.isProcessingPcmQueue = false;
          this.processPcmQueue();
        }, 0);
      } else {
        // All chunks scheduled, reset processing flag
        this.isProcessingPcmQueue = false;
      }

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
    // Use negotiated sample rate, default to 24kHz
    const desiredSampleRate = this.outputFormat?.sampleRate || 24000;
    
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
        latencyHint: 'interactive' // ✅ Reduces buffering issues
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

    const wasPlaying = this.isPlaying || this.currentSource !== null;

    

    // Stop current source

    if (this.currentSource) {

      try {

        this.currentSource.stop();

      } catch (e) {

        // Ignore if already stopped

      }

      this.currentSource = null;

    }

    

    // Clear state

    this.isPlaying = false;

    this.isProcessingQueue = false;

    this.audioQueue = [];

    

    // Clear PCM chunk queue

    this.pcmChunkQueue = [];

    this.isProcessingPcmQueue = false;

    

    // Reset scheduling properties

    this.nextStartTime = 0;

    this.scheduledBuffers = 0;

    

    // Emit stopped event

    if (wasPlaying) {

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

      outputFormat: this.outputFormat

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

