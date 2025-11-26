// src/v2/VoiceSDK.js

import EventEmitter from '../shared/EventEmitter.js';

import AudioPlayer from './AudioPlayer.js';

import AudioRecorder from '../v1/AudioRecorder.js';

import AudioFormatConverter from './utils/AudioFormatConverter.js';



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

  static SUPPORTED_INPUT_SAMPLE_RATES = [8000, 16000, 22050, 24000, 44100, 48000];

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

      // Output frame duration (for raw PCM streaming)
      outputFrameDurationMs: config.outputFrameDurationMs || 600, // Default 600ms - smooth playback with good latency balance

      

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

    this.requestedOutputFormat = null; // What user requested

    this.formatConverter = null; // Format converter instance

    this.websocket = null;

    this.conversationId = null; // Conversation ID from server

    

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

      

      // Notify server - CRITICAL for barge-in detection

      if (this.isConnected) {

        console.log('📤 VoiceSDK v2: Sending audio_started_playing message to server');

        this.sendMessage({ t: 'audio_started_playing' });

      } else {

        console.warn('⚠️ VoiceSDK v2: Cannot send audio_started_playing - not connected');

      }

    });

    

    this.audioPlayer.on('playbackStopped', () => {

      this.isPlaying = false;

      this.emit('playbackStopped');

      

      // Notify server - CRITICAL for barge-in detection

      if (this.isConnected) {

        console.log('📤 VoiceSDK v2: Sending audio_stopped_playing message to server');

        this.sendMessage({ t: 'audio_stopped_playing' });

      } else {

        console.warn('⚠️ VoiceSDK v2: Cannot send audio_stopped_playing - not connected');

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

      // Check both isPlaying flag and AudioPlayer's actual state (scheduled buffers, sources, etc.)

      const audioPlayerStatus = this.audioPlayer.getStatus();

      const hasScheduledAudio = (audioPlayerStatus.scheduledBuffers && audioPlayerStatus.scheduledBuffers > 0) || 

                                (audioPlayerStatus.scheduledSourcesCount && audioPlayerStatus.scheduledSourcesCount > 0);

      const isActuallyPlaying = this.isPlaying || audioPlayerStatus.isPlaying || hasScheduledAudio;

      

      console.log('🎤 VoiceSDK v2: Recording started - checking for barge-in...');

      console.log('   VoiceSDK.isPlaying:', this.isPlaying);

      console.log('   AudioPlayer.isPlaying:', audioPlayerStatus.isPlaying);

      console.log('   scheduledBuffers:', audioPlayerStatus.scheduledBuffers || 0);

      console.log('   scheduledSourcesCount:', audioPlayerStatus.scheduledSourcesCount || 0);

      console.log('   preparedBufferLength:', audioPlayerStatus.preparedBufferLength || 0);

      console.log('   isActuallyPlaying:', isActuallyPlaying);

      

      if (isActuallyPlaying) {

        console.log('🛑 VoiceSDK v2: Barge-in detected! Stopping audio playback...');

        

        this.audioPlayer.stopImmediate();

        console.log('✅ VoiceSDK v2: Audio playback stopped');

        

        if (this.isConnected) {

          this.sendMessage({ t: 'barge_in' });

          console.log('📤 VoiceSDK v2: Sent barge_in message to server');

        } else {

          console.warn('⚠️ VoiceSDK v2: Cannot send barge_in - not connected');

        }

      } else {

        console.log('ℹ️ VoiceSDK v2: No audio playing, normal recording start');

      }

      

      this.emit('recordingStarted');

    });

    

    this.audioRecorder.on('recordingStopped', () => {

      this.isRecording = false;

      this._bargeInChecked = false; // Reset for next recording session

      this.emit('recordingStopped');

      console.log('🛑 VoiceSDK v2: Recording stopped');

    });

    

    this.audioRecorder.on('audioData', (pcmData) => {

      // Check for barge-in on first audio data (user actually speaking)

      // This is more reliable than checking on recordingStarted

      if (!this._bargeInChecked && this.isRecording) {

        this._bargeInChecked = true; // Only check once per recording session

        

        const audioPlayerStatus = this.audioPlayer.getStatus();

        const hasScheduledAudio = (audioPlayerStatus.scheduledBuffers && audioPlayerStatus.scheduledBuffers > 0) || 

                                  (audioPlayerStatus.scheduledSourcesCount && audioPlayerStatus.scheduledSourcesCount > 0);

        const isActuallyPlaying = this.isPlaying || audioPlayerStatus.isPlaying || hasScheduledAudio;

        

        if (isActuallyPlaying) {

          console.log('🛑 VoiceSDK v2: Barge-in detected on first audio data! Stopping audio playback...');

          console.log('   VoiceSDK.isPlaying:', this.isPlaying);

          console.log('   AudioPlayer.isPlaying:', audioPlayerStatus.isPlaying);

          console.log('   scheduledBuffers:', audioPlayerStatus.scheduledBuffers || 0);

          console.log('   scheduledSourcesCount:', audioPlayerStatus.scheduledSourcesCount || 0);

          

          this.audioPlayer.stopImmediate();

          console.log('✅ VoiceSDK v2: Audio playback stopped');

          

          if (this.isConnected) {

            this.sendMessage({ t: 'barge_in' });

            console.log('📤 VoiceSDK v2: Sent barge_in message to server');

          }

        }

      }

      

      // Send audio chunks to server via WebSocket
      // NOTE: Don't check isRecording here - the audioRecorder emits data when it's active
      // This allows continuous frame sending even during barge-in scenarios
      // Matching v1 behavior: frames are sent as long as recorder is producing data
      if (this.isConnected) {
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

      requestedOutputFormat: requestedOutputFormat,

      outputFrameDurationMs: this.config.outputFrameDurationMs // Frame duration in milliseconds

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

      

      // Fallback: capture conversationId if present on any message (if not already set)
      if (!this.conversationId && message.conversationId) {
        this.conversationId = message.conversationId;
        console.log('🔍 VoiceSDK v2: Captured conversationId from message:', this.conversationId);
        this.emit('conversationIdChanged', this.conversationId);
      }

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
      hasConversationId: !!message.conversationId,
      messageType: message.t
    });

    // Capture conversation ID if provided
    if (message.conversationId) {
      this.conversationId = message.conversationId;
      console.log('🔍 VoiceSDK v2: Received conversationId:', this.conversationId);
      this.emit('conversationIdChanged', this.conversationId);
    }

    

    if (message.outputAudioFormat) {

      // v2 protocol: format was negotiated

      this.outputAudioFormat = message.outputAudioFormat;

      this.audioPlayer.setOutputFormat(message.outputAudioFormat);

      

      console.log('✅ VoiceSDK v2: Format negotiated by server:', this.outputAudioFormat);
      
      // Store requested format
      this.requestedOutputFormat = {
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
      
      // Check for mismatches and create converter if needed
      const mismatches = [];
      if (this.requestedOutputFormat.container !== negotiatedFormat.container) {
        mismatches.push(`container: "${this.requestedOutputFormat.container}" → "${negotiatedFormat.container}"`);
      }
      if (this.requestedOutputFormat.encoding !== negotiatedFormat.encoding) {
        mismatches.push(`encoding: "${this.requestedOutputFormat.encoding}" → "${negotiatedFormat.encoding}"`);
      }
      if (this.requestedOutputFormat.sampleRate !== negotiatedFormat.sampleRate) {
        mismatches.push(`sampleRate: ${this.requestedOutputFormat.sampleRate}Hz → ${negotiatedFormat.sampleRate}Hz`);
      }
      if (this.requestedOutputFormat.bitDepth !== negotiatedFormat.bitDepth) {
        mismatches.push(`bitDepth: ${this.requestedOutputFormat.bitDepth}-bit → ${negotiatedFormat.bitDepth}-bit`);
      }
      if (this.requestedOutputFormat.channels !== negotiatedFormat.channels) {
        mismatches.push(`channels: ${this.requestedOutputFormat.channels} → ${negotiatedFormat.channels}`);
      }
      
      if (mismatches.length > 0) {
        console.warn('⚠️ VoiceSDK v2: Format negotiation mismatch!');
        console.warn('   Requested:', this.requestedOutputFormat);
        console.warn('   Negotiated:', negotiatedFormat);
        console.warn('   Differences:', mismatches.join(', '));
        
        // Create format converter to automatically convert
        try {
          this.formatConverter = new AudioFormatConverter(
            this.requestedOutputFormat,
            negotiatedFormat
          );
          
          if (this.formatConverter.needsConversion()) {
            const steps = this.formatConverter.getConversionSteps();
            console.log('🔄 VoiceSDK v2: Format conversion enabled');
            console.log('   Conversion steps:', steps.join(', '));
            console.log('   Audio will be automatically converted to requested format');
          }
        } catch (error) {
          console.error('❌ VoiceSDK v2: Failed to create format converter:', error);
          console.warn('   Will use backend format without conversion');
          this.formatConverter = null;
        }
      } else {
        console.log('✅ VoiceSDK v2: Format perfectly matched!', negotiatedFormat);
        this.formatConverter = null; // No conversion needed
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
      
      this.requestedOutputFormat = defaultFormat; // Same as default when no negotiation

      this.audioPlayer.setOutputFormat(defaultFormat);
      
      this.formatConverter = null; // No conversion needed when using defaults

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
    console.log('   Current outputFormat:', this.outputAudioFormat);
    console.log('   AudioPlayer outputFormat:', this.audioPlayer?.outputFormat);
    console.log('   Format converter:', this.formatConverter ? 'active' : 'none');

    

    // Convert format if needed (before passing to AudioPlayer)
    let processedAudio = arrayBuffer;
    
    if (this.formatConverter && this.formatConverter.needsConversion()) {
      try {
        processedAudio = await this.formatConverter.convert(arrayBuffer);
        console.log('✅ VoiceSDK v2: Audio converted to requested format');
      } catch (error) {
        console.error('❌ VoiceSDK v2: Format conversion failed:', error);
        console.warn('   Using backend format without conversion');
        processedAudio = arrayBuffer; // Fall back to original
      }
    }
    
    // Determine format for playback (use requested format if converter was used, otherwise use negotiated)
    const playbackFormat = this.formatConverter && this.formatConverter.needsConversion() 
      ? this.requestedOutputFormat 
      : (this.outputAudioFormat || {
          container: this.config.outputContainer || 'raw',
          encoding: this.config.outputEncoding || 'pcm',
          sampleRate: this.config.outputSampleRate || 16000,
          bitDepth: this.config.outputBitDepth || 16,
          channels: this.config.outputChannels || 1
        });
    
    const container = playbackFormat.container || 'raw';
    const encoding = (playbackFormat.encoding || 'pcm').toLowerCase();
    
    if (container === 'raw') {
      // Raw audio - decode if needed, then use playChunk for seamless scheduling
      let pcmData = processedAudio;
      
      if (encoding !== 'pcm') {
        // Need to decode PCMU/PCMA to PCM
        const codec = this.audioPlayer.getCodec(encoding);
        if (codec) {
          const decoded = codec.decode(new Uint8Array(processedAudio));
          pcmData = decoded.buffer;
          console.log(`🔄 VoiceSDK v2: Decoded ${encoding.toUpperCase()} to PCM (${decoded.byteLength} bytes)`);
        } else {
          console.warn(`⚠️ VoiceSDK v2: No codec for ${encoding}, treating as PCM`);
        }
      }
      
      // Ensure outputFormat is set on AudioPlayer before playing chunks
      // This is critical for raw PCM playback
      if (!this.audioPlayer.outputFormat) {
        console.warn('⚠️ VoiceSDK v2: outputFormat not set on AudioPlayer, setting from playbackFormat');
        this.audioPlayer.setOutputFormat(playbackFormat);
      }
      
      // Use playChunk for seamless scheduling
      this.audioPlayer.playChunk(pcmData);
    } else {
      // WAV or other - use playAudio which handles headers
      this.audioPlayer.playAudio(processedAudio);
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

    
    // Stop audio playback and clear queues (like v1)
    if (this.audioPlayer) {
      this.audioPlayer.stopImmediate();
    }

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

      conversationId: this.conversationId,

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

