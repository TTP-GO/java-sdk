// src/v2/VoiceSDK.js

import EventEmitter from '../shared/EventEmitter.js';

import AudioPlayer from './AudioPlayer.js';

import AudioRecorder from '../v1/AudioRecorder.js';



/**

 * VoiceSDK v2 - Multi-codec speech-to-speech SDK

 * 

 * Features:

 * - Format negotiation with backend

 * - Support for PCM, PCMU (μ-law), PCMA (A-law)

 * - Support for WAV and raw audio containers

 * - Backward compatible with v1 protocol

 * 

 * Events:

 * - 'connected' - WebSocket connected

 * - 'disconnected' - WebSocket disconnected

 * - 'formatNegotiated' - Audio format confirmed by server

 * - 'recordingStarted' - Recording started

 * - 'recordingStopped' - Recording stopped

 * - 'playbackStarted' - Audio playback started

 * - 'playbackStopped' - Audio playback stopped

 * - 'error' - Error occurred

 * - 'message' - Text message from server

 */

class VoiceSDK_v2 extends EventEmitter {

  // Supported INPUT audio format configurations (matching backend validation)

  static SUPPORTED_INPUT_ENCODINGS = ['pcm', 'pcmu', 'pcma'];

  static SUPPORTED_INPUT_SAMPLE_RATES = [8000, 16000, 24000, 48000];

  static SUPPORTED_INPUT_BIT_DEPTHS = [8, 16, 24];

  static SUPPORTED_INPUT_CHANNELS = [1];

  

  // Supported OUTPUT audio format configurations (matching backend validation)

  static SUPPORTED_OUTPUT_ENCODINGS = ['pcm', 'pcmu', 'pcma'];

  static SUPPORTED_OUTPUT_SAMPLE_RATES = [8000, 16000, 22050, 24000, 44100, 48000];

  static SUPPORTED_OUTPUT_BIT_DEPTHS = [8, 16, 24];

  static SUPPORTED_OUTPUT_CHANNELS = [1];

  static SUPPORTED_OUTPUT_CONTAINERS = ['raw', 'wav'];

  

  constructor(config = {}) {

    super();

    

    this.version = '2.0.0';

    

    this.config = {

      // Connection

      websocketUrl: config.websocketUrl || 'wss://speech.talktopc.com/ws/conv',

      agentId: config.agentId,

      appId: config.appId,

      

      // Input format (what we send to server)

      sampleRate: config.sampleRate || 16000,

      channels: config.channels || 1,

      bitDepth: config.bitDepth || 16,

      

      // Audio processor path (optional)

      audioProcessorPath: config.audioProcessorPath, // Will auto-detect if not provided

      

      // Output format (what we want from server)

      outputContainer: config.outputContainer || this.getDefaultContainer(config),

      outputEncoding: config.outputEncoding || config.outputCodec || 'pcm',

      outputSampleRate: config.outputSampleRate || 16000,

      outputChannels: config.outputChannels || 1,

      outputBitDepth: config.outputBitDepth || 16,

      

      // Legacy support

      outputCodec: config.outputCodec,

      

      // Optional settings

      agentSettingsOverride: config.agentSettingsOverride || null,

      autoReconnect: config.autoReconnect !== false,

      

      // Protocol version

      protocolVersion: config.protocolVersion || 2

    };

    

    // State

    this.isConnected = false;

    this.hasEverConnected = false; // Track if we've successfully connected at least once

    this.isRecording = false;

    this.isPlaying = false;

    this.isDestroyed = false;

    this.outputAudioFormat = null;

    this.websocket = null;

    

    // Components

    this.audioPlayer = new AudioPlayer(this.config);

    this.audioRecorder = new AudioRecorder(this.config);

    


    // DON'T set default format in constructor
    // Wait for hello_ack to set the correct format
    // outputAudioFormat is already set to null above

    

    this.setupAudioPlayerEvents();

    this.setupAudioRecorderEvents();

    

    // Validate input and output formats

    this.validateConfig();

    

    console.log('🎵 VoiceSDK v2 initialized:', {

      version: this.version,

      outputContainer: this.config.outputContainer,

      outputEncoding: this.config.outputEncoding,

      outputSampleRate: this.config.outputSampleRate

    });

  }

  

  /**

   * Get default container based on config

   */

  getDefaultContainer(config) {

    // Backward compatibility: if user specified 'wav' as codec, use wav container

    if (config.outputCodec === 'wav') {

      return 'wav';

    }

    // Default: raw (no container overhead)

    return 'raw';

  }

  

  /**

   * Validate input audio format (matching backend validation)

   * @param {Object} format - Input format to validate

   * @returns {string|null} - Error message if invalid, null if valid

   */

  validateInputFormat(format) {

    if (!format) {

      return 'Input format is required';

    }

    

    const encoding = format.encoding?.toLowerCase();

    if (!encoding || !VoiceSDK_v2.SUPPORTED_INPUT_ENCODINGS.includes(encoding)) {

      return `Unsupported input encoding: ${format.encoding}. Supported: ${VoiceSDK_v2.SUPPORTED_INPUT_ENCODINGS.join(', ')}`;

    }

    

    if (!format.sampleRate || !VoiceSDK_v2.SUPPORTED_INPUT_SAMPLE_RATES.includes(format.sampleRate)) {

      return `Unsupported input sample rate: ${format.sampleRate}. Supported: ${VoiceSDK_v2.SUPPORTED_INPUT_SAMPLE_RATES.join(', ')}`;

    }

    

    if (!format.bitDepth || !VoiceSDK_v2.SUPPORTED_INPUT_BIT_DEPTHS.includes(format.bitDepth)) {

      return `Unsupported input bit depth: ${format.bitDepth}. Supported: ${VoiceSDK_v2.SUPPORTED_INPUT_BIT_DEPTHS.join(', ')}`;

    }

    

    if (!format.channels || !VoiceSDK_v2.SUPPORTED_INPUT_CHANNELS.includes(format.channels)) {

      return `Unsupported input channels: ${format.channels}. Supported: ${VoiceSDK_v2.SUPPORTED_INPUT_CHANNELS.join(', ')}`;

    }

    

    return null; // Valid

  }

  

  /**

   * Validate output audio format (matching backend validation)

   * @param {Object} format - Output format to validate

   * @returns {string|null} - Error message if invalid, null if valid

   */

  validateOutputFormat(format) {

    if (!format) {

      return 'Output format is required';

    }

    

    const encoding = format.encoding?.toLowerCase();

    if (!encoding || !VoiceSDK_v2.SUPPORTED_OUTPUT_ENCODINGS.includes(encoding)) {

      return `Unsupported output encoding: ${format.encoding}. Supported: ${VoiceSDK_v2.SUPPORTED_OUTPUT_ENCODINGS.join(', ')}`;

    }

    

    if (!format.sampleRate || !VoiceSDK_v2.SUPPORTED_OUTPUT_SAMPLE_RATES.includes(format.sampleRate)) {

      return `Unsupported output sample rate: ${format.sampleRate}. Supported: ${VoiceSDK_v2.SUPPORTED_OUTPUT_SAMPLE_RATES.join(', ')}`;

    }

    

    if (!format.bitDepth || !VoiceSDK_v2.SUPPORTED_OUTPUT_BIT_DEPTHS.includes(format.bitDepth)) {

      return `Unsupported output bit depth: ${format.bitDepth}. Supported: ${VoiceSDK_v2.SUPPORTED_OUTPUT_BIT_DEPTHS.join(', ')}`;

    }

    

    if (!format.channels || !VoiceSDK_v2.SUPPORTED_OUTPUT_CHANNELS.includes(format.channels)) {

      return `Unsupported output channels: ${format.channels}. Supported: ${VoiceSDK_v2.SUPPORTED_OUTPUT_CHANNELS.join(', ')}`;

    }

    

    const container = format.container?.toLowerCase();

    if (!container || !VoiceSDK_v2.SUPPORTED_OUTPUT_CONTAINERS.includes(container)) {

      return `Unsupported output container: ${format.container}. Supported: ${VoiceSDK_v2.SUPPORTED_OUTPUT_CONTAINERS.join(', ')}`;

    }

    

    return null; // Valid

  }

  

  /**

   * Validate SDK configuration and warn/error on invalid formats

   */

  validateConfig() {

    // Validate input format

    const inputFormat = {

      encoding: 'pcm', // SDK always sends PCM input

      sampleRate: this.config.sampleRate,

      channels: this.config.channels,

      bitDepth: this.config.bitDepth

    };

    

    const inputError = this.validateInputFormat(inputFormat);

    if (inputError) {

      console.error('❌ VoiceSDK v2: Invalid input format:', inputError);

      this.emit('error', new Error(inputError));

      return;

    }

    

    // Validate output format

    const outputFormat = {

      encoding: this.config.outputEncoding,

      sampleRate: this.config.outputSampleRate,

      channels: this.config.outputChannels,

      bitDepth: this.config.outputBitDepth,

      container: this.config.outputContainer

    };

    

    const outputError = this.validateOutputFormat(outputFormat);

    if (outputError) {

      console.error('❌ VoiceSDK v2: Invalid output format:', outputError);

      this.emit('error', new Error(outputError));

      return;

    }

    

    console.log('✅ VoiceSDK v2: Format validation passed');

  }

  

  /**

   * Setup AudioPlayer event listeners

   */

  setupAudioPlayerEvents() {

    this.audioPlayer.on('playbackStarted', () => {

      this.isPlaying = true;

      this.emit('playbackStarted');

      

      // Notify server

      if (this.isConnected) {

        this.sendMessage({ t: 'audio_started_playing' });

      }

    });

    

    this.audioPlayer.on('playbackStopped', () => {

      this.isPlaying = false;

      this.emit('playbackStopped');

      

      // Notify server

      if (this.isConnected) {

        this.sendMessage({ t: 'audio_stopped_playing' });

      }

    });

    

    this.audioPlayer.on('playbackError', (error) => {

      this.emit('playbackError', error);

      this.emit('error', error);

    });

  }

  

  /**

   * Setup AudioRecorder event listeners

   */

  setupAudioRecorderEvents() {

    this.audioRecorder.on('recordingStarted', () => {

      this.isRecording = true;

      

      // If audio is playing, stop it and barge-in

      if (this.isPlaying) {

        this.audioPlayer.stopImmediate();

        if (this.isConnected) {

          this.sendMessage({ t: 'barge_in' });

        }

      }

      

      this.emit('recordingStarted');

      console.log('🎤 VoiceSDK v2: Recording started');

    });

    

    this.audioRecorder.on('recordingStopped', () => {

      this.isRecording = false;

      this.emit('recordingStopped');

      console.log('🛑 VoiceSDK v2: Recording stopped');

    });

    

    this.audioRecorder.on('audioData', (pcmData) => {

      // Send audio chunks to server via WebSocket

      if (this.isConnected && this.isRecording) {

        this.sendBinary(pcmData);

      }

    });

    

    this.audioRecorder.on('error', (error) => {

      console.error('❌ AudioRecorder error:', error);

      this.emit('error', error);

    });

  }

  

  /**

   * Build WebSocket URL with query parameters

   */

  buildWebSocketUrl() {

    const baseUrl = this.config.websocketUrl;

    const params = new URLSearchParams();

    

    // Add agentId and appId to query parameters if provided

    if (this.config.agentId) {

      params.append('agentId', this.config.agentId);

    }

    

    if (this.config.appId) {

      params.append('appId', this.config.appId);

    }

    

    // If we have query parameters, append them to the URL

    if (params.toString()) {

      const separator = baseUrl.includes('?') ? '&' : '?';

      return `${baseUrl}${separator}${params.toString()}`;

    }

    

    return baseUrl;

  }

  

  /**

   * Connect to WebSocket server

   */

  async connect() {

    if (this.isDestroyed) {

      console.warn('VoiceSDK v2: Cannot connect - SDK is destroyed');

      return false;

    }

    

    if (this.isConnected) {

      console.warn('VoiceSDK v2: Already connected');

      return true;

    }

    

    try {

      // Build WebSocket URL with query parameters (agentId and appId)

      const wsUrl = this.buildWebSocketUrl();

      console.log('🔌 VoiceSDK v2: Connecting to', wsUrl);

      

      return await new Promise((resolve, reject) => {

        this.websocket = new WebSocket(wsUrl);

        

        // Connection opened

        this.websocket.onopen = () => {

          console.log('✅ VoiceSDK v2: WebSocket connected');

          this.isConnected = true;

          this.hasEverConnected = true; // Mark that we've successfully connected

          

          // Send hello message

          this.sendHelloMessage();

          

          this.emit('connected');

          resolve(true);

        };

        

        // Connection error

        this.websocket.onerror = (error) => {

          console.error('❌ VoiceSDK v2: WebSocket error:', error);

          reject(error);

        };

        

        // Connection closed

        this.websocket.onclose = (event) => {

          console.log('🔌 VoiceSDK v2: WebSocket closed:', event.code, event.reason);

          this.isConnected = false;

          

          // Stop recording if active

          if (this.isRecording) {

            this.stopRecording().catch(err => 

              console.error('Error stopping recording:', err)

            );

          }

          

          this.emit('disconnected', event);

          

          // Auto-reconnect (if enabled) - only retry if we've successfully connected before

          // This prevents infinite retry loops on initial connection failures

          if (this.config.autoReconnect && !this.isDestroyed && this.hasEverConnected) {

            console.log('🔄 VoiceSDK v2: Auto-reconnecting in 3s...');

            setTimeout(() => {

              if (!this.isDestroyed && !this.isConnected) {

                this.connect();

              }

            }, 3000);

          } else if (this.config.autoReconnect && !this.hasEverConnected) {

            console.log('⚠️ VoiceSDK v2: Initial connection failed. Auto-reconnect disabled to prevent retry loop.');

          }

        };

        

        // Message received

        this.websocket.onmessage = (event) => {

          this.handleMessage(event);

        };

      });

      

    } catch (error) {

      console.error('🔌 VoiceSDK v2: Connection failed:', error);

      this.emit('error', error);

      return false;

    }

  }

  

  /**

   * Send hello message with format negotiation

   */

  sendHelloMessage() {

    if (!this.isConnected) {

      console.warn('VoiceSDK v2: Cannot send hello - not connected');

      return;

    }

    

    // Build input format object

    const inputFormat = {

      encoding: 'pcm', // "pcm", "pcmu", "pcma"

      sampleRate: this.config.sampleRate, // Integer

      channels: this.config.channels, // Integer

      bitDepth: this.config.bitDepth // Integer

    };

    

    // Build requested output format object

    const requestedOutputFormat = {

      encoding: this.config.outputEncoding, // "pcm", "pcmu", "pcma"

      sampleRate: this.config.outputSampleRate, // Integer

      channels: this.config.outputChannels, // Integer

      bitDepth: this.config.outputBitDepth, // Integer

      container: this.config.outputContainer // "raw" or "wav" (for output format only)

    };

    

    // Validate formats before sending (matching backend validation)

    const inputError = this.validateInputFormat(inputFormat);

    if (inputError) {

      console.error('❌ VoiceSDK v2: Cannot send hello - invalid input format:', inputError);

      this.emit('error', new Error(`Invalid input format: ${inputError}`));

      return;

    }

    

    const outputError = this.validateOutputFormat(requestedOutputFormat);

    if (outputError) {

      console.error('❌ VoiceSDK v2: Cannot send hello - invalid output format:', outputError);

      this.emit('error', new Error(`Invalid output format: ${outputError}`));

      return;

    }

    

    // Build hello message matching backend ControlMessage structure

    const helloMessage = {

      t: 'hello',

      v: this.config.protocolVersion, // Protocol version (Integer)

      inputFormat: inputFormat,

      requestedOutputFormat: requestedOutputFormat

    };

    

    // Optional: Agent settings override (Map<String, Object>)

    if (this.config.agentSettingsOverride) {

      helloMessage.agentSettingsOverride = this.config.agentSettingsOverride;

    }

    

    // Note: appId and agentId are sent as query parameters in WebSocket URL, not in hello message

    // (matching v1 behavior and backend expectations)

    

    console.log('📤 VoiceSDK v2: Sending hello:', {

      version: helloMessage.v,

      requestedFormat: helloMessage.requestedOutputFormat

    });

    console.log('📤 VoiceSDK v2: Requested output format:', {

      container: helloMessage.requestedOutputFormat.container,

      encoding: helloMessage.requestedOutputFormat.encoding,

      sampleRate: helloMessage.requestedOutputFormat.sampleRate,

      bitDepth: helloMessage.requestedOutputFormat.bitDepth

    });

    

    try {

      this.sendMessage(helloMessage);

    } catch (error) {

      console.error('VoiceSDK v2: Failed to send hello:', error);

      this.emit('error', error);

    }

  }

  

  /**

   * Handle incoming WebSocket message

   */

  handleMessage(event) {

    // Binary message (audio data)

    if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {

      this.handleBinaryMessage(event.data);

      return;

    }

    

    // Text message (JSON)

    try {

      const message = JSON.parse(event.data);

      

      console.log('📥 VoiceSDK v2: Received message:', message.t);

      

      switch (message.t) {

        case 'hello_ack':

          this.handleHelloAck(message);

          break;

        

        case 'user_transcript':

        case 'agent_response':

        case 'error':

          this.emit('message', message);

          break;

        

        case 'barge_in':

          this.emit('bargeIn', message);

          this.audioPlayer.stopImmediate();

          break;

        

        case 'stop_playing':

          this.emit('stopPlaying', message);

          this.audioPlayer.stopImmediate();

          break;

        

        default:

          console.log('VoiceSDK v2: Unknown message type:', message.t);

          this.emit('message', message);

      }

      

    } catch (error) {

      console.error('VoiceSDK v2: Error parsing message:', error);

    }

  }

  

  /**

   * Handle hello_ack message

   */

  handleHelloAck(message) {

    console.log('📥 VoiceSDK v2: Received hello_ack:', {
      hasOutputFormat: !!message.outputAudioFormat,
      outputFormat: message.outputAudioFormat,
      messageType: message.t
    });

    

    if (message.outputAudioFormat) {

      // v2 protocol: format was negotiated

      this.outputAudioFormat = message.outputAudioFormat;

      this.audioPlayer.setOutputFormat(message.outputAudioFormat);

      

      console.log('✅ VoiceSDK v2: Format negotiated by server:', this.outputAudioFormat);
      
      // Compare requested vs negotiated format in detail
      const requestedFormat = {
        container: this.config.outputContainer || 'wav',
        encoding: this.config.outputEncoding || 'pcm',
        sampleRate: this.config.outputSampleRate || 16000,
        bitDepth: this.config.outputBitDepth || 16,
        channels: this.config.outputChannels || 1
      };
      
      const negotiatedFormat = {
        container: this.outputAudioFormat.container || 'unknown',
        encoding: this.outputAudioFormat.encoding || 'unknown',
        sampleRate: this.outputAudioFormat.sampleRate || 0,
        bitDepth: this.outputAudioFormat.bitDepth || 0,
        channels: this.outputAudioFormat.channels || 0
      };
      
      // Check for mismatches
      const mismatches = [];
      if (requestedFormat.container !== negotiatedFormat.container) {
        mismatches.push(`container: "${requestedFormat.container}" → "${negotiatedFormat.container}"`);
      }
      if (requestedFormat.encoding !== negotiatedFormat.encoding) {
        mismatches.push(`encoding: "${requestedFormat.encoding}" → "${negotiatedFormat.encoding}"`);
      }
      if (requestedFormat.sampleRate !== negotiatedFormat.sampleRate) {
        mismatches.push(`sampleRate: ${requestedFormat.sampleRate}Hz → ${negotiatedFormat.sampleRate}Hz`);
      }
      if (requestedFormat.bitDepth !== negotiatedFormat.bitDepth) {
        mismatches.push(`bitDepth: ${requestedFormat.bitDepth}-bit → ${negotiatedFormat.bitDepth}-bit`);
      }
      if (requestedFormat.channels !== negotiatedFormat.channels) {
        mismatches.push(`channels: ${requestedFormat.channels} → ${negotiatedFormat.channels}`);
      }
      
      if (mismatches.length > 0) {
        console.warn('⚠️ VoiceSDK v2: Format negotiation mismatch!');
        console.warn('   Requested:', requestedFormat);
        console.warn('   Negotiated:', negotiatedFormat);
        console.warn('   Differences:', mismatches.join(', '));
        console.warn('⚠️ Backend is ignoring your format request and using its own format.');
      } else {
        console.log('✅ VoiceSDK v2: Format perfectly matched!', negotiatedFormat);
      }

      this.emit('formatNegotiated', this.outputAudioFormat);

      

    } else {

      // v1 protocol: no format info (backward compatibility)
      // OR v2 protocol but backend didn't include outputAudioFormat

      if (this.config.protocolVersion >= 2) {

        console.warn('⚠️ VoiceSDK v2: hello_ack received but no outputAudioFormat in response.');

        console.warn('   This may happen if:');

        console.warn('   1. Backend is not sending outputAudioFormat (check backend logs)');

        console.warn('   2. Hello message missing v2 fields (v, inputFormat, requestedOutputFormat)');

        console.warn('   3. Backend validation failed (check backend error logs)');

        console.warn('   Using default format from config...');

      } else {

        console.log('✅ VoiceSDK v2: Connected (v1 legacy mode)');

      }

      

      // Use defaults from config (already set during initialization, but update if needed)

      const defaultFormat = {

        container: this.config.outputContainer || 'wav',

        encoding: this.config.outputEncoding || 'pcm',

        sampleRate: this.config.outputSampleRate || 16000,

        channels: this.config.outputChannels || 1,

        bitDepth: this.config.outputBitDepth || 16

      };

      

      this.outputAudioFormat = defaultFormat;

      this.audioPlayer.setOutputFormat(defaultFormat);

    }

  }

  

  /**

   * Handle binary audio data

   */

  async handleBinaryMessage(data) {

    // Convert Blob to ArrayBuffer if needed

    let arrayBuffer;

    if (data instanceof Blob) {

      arrayBuffer = await data.arrayBuffer();

    } else {

      arrayBuffer = data;

    }

    

    console.log('📥 VoiceSDK v2: Received audio:', arrayBuffer.byteLength, 'bytes');

    

    // Check if this is raw PCM or WAV
    // For raw PCM (container: 'raw'), use playChunk() for seamless playback
    // For WAV (container: 'wav'), use playAudio() which handles WAV headers
    const container = this.outputAudioFormat?.container || this.config.outputContainer || 'raw';
    const encoding = (this.outputAudioFormat?.encoding || this.config.outputEncoding || 'pcm').toLowerCase();
    
    if (container === 'raw') {
      // Raw audio - decode if needed, then use playChunk for seamless scheduling
      let pcmData = arrayBuffer;
      
      if (encoding !== 'pcm') {
        // Need to decode PCMU/PCMA to PCM
        const codec = this.audioPlayer.getCodec(encoding);
        if (codec) {
          const decoded = codec.decode(new Uint8Array(arrayBuffer));
          pcmData = decoded.buffer;
          console.log(`🔄 VoiceSDK v2: Decoded ${encoding.toUpperCase()} to PCM (${decoded.byteLength} bytes)`);
        } else {
          console.warn(`⚠️ VoiceSDK v2: No codec for ${encoding}, treating as PCM`);
        }
      }
      
      // Use playChunk for seamless scheduling
      this.audioPlayer.playChunk(pcmData);
    } else {
      // WAV or other - use playAudio which handles headers
      this.audioPlayer.playAudio(arrayBuffer);
    }

  }

  

  /**

   * Send message to server

   */

  sendMessage(message) {

    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {

      console.warn('VoiceSDK v2: Cannot send message - not connected');

      return false;

    }

    

    try {

      this.websocket.send(JSON.stringify(message));

      return true;

    } catch (error) {

      console.error('VoiceSDK v2: Error sending message:', error);

      this.emit('error', error);

      return false;

    }

  }

  

  /**

   * Send binary audio data to server

   */

  sendBinary(audioData) {

    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {

      console.warn('VoiceSDK v2: Cannot send audio - not connected');

      return false;

    }

    

    try {

      this.websocket.send(audioData);

      return true;

    } catch (error) {

      console.error('VoiceSDK v2: Error sending audio:', error);

      this.emit('error', error);

      return false;

    }

  }

  

  /**

   * Disconnect from server

   */

  disconnect() {

    if (this.isDestroyed) return;

    

    console.log('🔌 VoiceSDK v2: Disconnecting...');

    

    this.stopRecording();

    

    if (this.websocket) {

      this.websocket.close();

      this.websocket = null;

    }

    

    this.isConnected = false;

  }

  

  /**

   * Start recording audio from microphone

   */

  async startRecording() {

    if (!this.isConnected) {

      const error = new Error('Not connected to voice server');

      this.emit('error', error);

      throw error;

    }

    

    if (this.isRecording) {

      console.warn('VoiceSDK v2: Already recording');

      return true;

    }

    

    console.log('🎤 VoiceSDK v2: Starting recording...');

    

    try {

      // Send start_continuous_mode message to server

      this.sendMessage({

        t: 'start_continuous_mode',

        ttpId: this.generateTtpId()

      });

      

      // Start capturing audio from microphone

      await this.audioRecorder.start();

      

      return true;

      

    } catch (error) {

      console.error('❌ VoiceSDK v2: Failed to start recording:', error);

      this.emit('error', error);

      return false;

    }

  }

  

  /**

   * Stop recording audio

   */

  async stopRecording() {

    if (!this.isRecording) {

      console.warn('VoiceSDK v2: Not recording');

      return true;

    }

    

    console.log('🛑 VoiceSDK v2: Stopping recording...');

    

    try {

      // Send stop_continuous_mode message to server

      this.sendMessage({

        t: 'stop_continuous_mode',

        ttpId: this.generateTtpId()

      });

      

      // Stop capturing audio from microphone

      await this.audioRecorder.stop();

      

      // Stop any playing audio

      this.audioPlayer.stopImmediate();

      

      return true;

      

    } catch (error) {

      console.error('VoiceSDK v2: Error stopping recording:', error);

      this.emit('error', error);

      return false;

    }

  }

  

  /**

   * Toggle recording on/off

   */

  async toggleRecording() {

    if (this.isRecording) {

      return await this.stopRecording();

    } else {

      return await this.startRecording();

    }

  }

  

  /**

   * Stop audio playback

   */

  stopAudioPlayback() {

    this.audioPlayer.stopImmediate();

  }

  

  /**

   * Handle barge-in (interrupt agent, start listening)

   */

  async handleBargeIn() {

    this.stopAudioPlayback();

    

    if (!this.isRecording) {

      await this.startRecording();

    }

  }

  

  /**

   * Get SDK status

   */

  getStatus() {

    return {

      version: this.version,

      isConnected: this.isConnected,

      isRecording: this.isRecording,

      isPlaying: this.isPlaying,

      outputFormat: this.outputAudioFormat,

      audioPlayer: this.audioPlayer.getStatus(),

      audioRecorder: this.audioRecorder.getStatus()

    };

  }

  

  /**

   * Update configuration

   */

  updateConfig(newConfig) {

    this.config = { ...this.config, ...newConfig };

  }

  

  /**

   * Generate unique TTP ID

   */

  generateTtpId() {

    return 'sdk_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

  }

  

  /**

   * Destroy SDK and cleanup resources

   */

  destroy() {

    if (this.isDestroyed) return;

    

    console.log('🗑️ VoiceSDK v2: Destroying...');

    

    this.disconnect();

    this.isDestroyed = true;

    

    // Cleanup components

    if (this.audioPlayer) {

      this.audioPlayer.destroy();

    }

    

    if (this.audioRecorder) {

      this.audioRecorder.destroy();

    }

    

    this.removeAllListeners();

  }

}



export default VoiceSDK_v2;

