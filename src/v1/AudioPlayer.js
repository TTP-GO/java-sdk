/**
 * AudioPlayer - Handles audio playback with queue system
 */
import EventEmitter from '../shared/EventEmitter.js';

export default class AudioPlayer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.isProcessingQueue = false;
    this.currentSource = null;
    // For gapless playback: track scheduled sources and their end times
    this.scheduledSources = [];
    this.nextStartTime = 0;
  }
  
  /**
   * Add audio data to playback queue
   */
  playAudio(audioData) {
    try {
      console.log('🎵 AudioPlayer v1: playAudio called with', audioData.byteLength || audioData.length, 'bytes');
      const audioBlob = this.createAudioBlob(audioData);
      this.audioQueue.push(audioBlob);
      console.log('🎵 AudioPlayer v1: Audio queued. Queue length:', this.audioQueue.length);
      
      // Process queue if not already playing or processing
      // Also check if we have a current source - if not, we should start processing
      if (!this.isPlaying && !this.isProcessingQueue && !this.currentSource) {
        console.log('🎵 AudioPlayer v1: Starting queue processing...');
        setTimeout(() => this.processQueue(), 50);
      } else {
        console.log('🎵 AudioPlayer v1: Queue already processing. isPlaying:', this.isPlaying, 'isProcessingQueue:', this.isProcessingQueue, 'currentSource:', !!this.currentSource);
      }
    } catch (error) {
      console.error('❌ AudioPlayer v1: Error in playAudio:', error);
      this.emit('playbackError', error);
    }
  }
  
  /**
   * Create audio blob from ArrayBuffer
   */
  createAudioBlob(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Detect audio format
    if (uint8Array.length >= 4) {
      // WAV header (RIFF)
      if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && 
          uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
        return new Blob([arrayBuffer], { type: 'audio/wav' });
      }
      
      // MP3 header
      if (uint8Array[0] === 0xFF && (uint8Array[1] & 0xE0) === 0xE0) {
        return new Blob([arrayBuffer], { type: 'audio/mpeg' });
      }
      
      // OGG header
      if (uint8Array[0] === 0x4F && uint8Array[1] === 0x67 && 
          uint8Array[2] === 0x67 && uint8Array[3] === 0x53) {
        return new Blob([arrayBuffer], { type: 'audio/ogg' });
      }
    }
    
    // Default to WAV format
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
  
  /**
   * Process audio queue
   */
  async processQueue() {
    // Prevent multiple simultaneous queue processing
    // Note: isPlaying check removed to allow seamless queue processing
    if (this.isProcessingQueue || this.audioQueue.length === 0) {
      console.log('🎵 AudioPlayer v1: processQueue skipped - isProcessingQueue:', this.isProcessingQueue, 'queueLength:', this.audioQueue.length);
      return;
    }
    
    console.log('🎵 AudioPlayer v1: Starting processQueue, queue length:', this.audioQueue.length);
    this.isProcessingQueue = true;
    
    const audioBlob = this.audioQueue.shift();
    if (!audioBlob) {
      console.log('🎵 AudioPlayer v1: No audio blob in queue');
      this.isProcessingQueue = false;
      return;
    }
    
    console.log('🎵 AudioPlayer v1: Processing audio blob, size:', audioBlob.size, 'type:', audioBlob.type);
    try {
      // Check if we were playing BEFORE async operations (decode, etc.)
      // This ensures we detect the true state before any async delays
      const wasNotPlayingBefore = !this.isPlaying && this.currentSource === null;
      
      // Create AudioContext if not exists
      if (!this.audioContext) {
        // Use configured sample rate if available, otherwise let browser choose
        const contextOptions = this.config.sampleRate ? { sampleRate: this.config.sampleRate } : {};
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
      }
      
      const audioContext = this.audioContext;
      
      // Resume AudioContext if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create audio source from blob
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Try to decode audio data
      let audioBuffer;
      try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('✅ AudioPlayer v1: Audio decoded successfully, duration:', audioBuffer.duration, 's');
      } catch (decodeError) {
        console.error('❌ AudioPlayer v1: decodeAudioData failed:', decodeError);
        console.log('   Attempting to wrap raw PCM in WAV header...');
        
        // If decode fails, it might be raw PCM - try wrapping it in a WAV header
        // Assume 16-bit mono PCM at configured sample rate
        const sampleRate = this.config.sampleRate || 16000;
        const channels = 1;
        const bitDepth = 16;
        const pcmData = new Uint8Array(arrayBuffer);
        
        // Create WAV header
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);
        
        // RIFF header
        view.setUint8(0, 0x52); // 'R'
        view.setUint8(1, 0x49); // 'I'
        view.setUint8(2, 0x46); // 'F'
        view.setUint8(3, 0x46); // 'F'
        view.setUint32(4, 36 + pcmData.length, true); // File size - 8
        
        // WAVE format
        view.setUint8(8, 0x57);  // 'W'
        view.setUint8(9, 0x41);  // 'A'
        view.setUint8(10, 0x56); // 'V'
        view.setUint8(11, 0x45); // 'E'
        
        // fmt chunk
        view.setUint8(12, 0x66); // 'f'
        view.setUint8(13, 0x6D); // 'm'
        view.setUint8(14, 0x74); // 't'
        view.setUint8(15, 0x20); // ' '
        view.setUint32(16, 16, true); // Subchunk size
        view.setUint16(20, 1, true); // Audio format (1 = PCM)
        view.setUint16(22, channels, true); // Channels
        view.setUint32(24, sampleRate, true); // Sample rate
        view.setUint32(28, sampleRate * channels * bitDepth / 8, true); // Byte rate
        view.setUint16(32, channels * bitDepth / 8, true); // Block align
        view.setUint16(34, bitDepth, true); // Bits per sample
        
        // data chunk
        view.setUint8(36, 0x64); // 'd'
        view.setUint8(37, 0x61); // 'a'
        view.setUint8(38, 0x74); // 't'
        view.setUint8(39, 0x61); // 'a'
        view.setUint32(40, pcmData.length, true); // Data size
        
        // Combine header + PCM data
        const wavFile = new Uint8Array(44 + pcmData.length);
        wavFile.set(new Uint8Array(wavHeader), 0);
        wavFile.set(pcmData, 44);
        
        console.log('🎵 AudioPlayer v1: Wrapped PCM in WAV header, total size:', wavFile.length);
        
        // Try decoding again with WAV header
        try {
          audioBuffer = await audioContext.decodeAudioData(wavFile.buffer);
          console.log('✅ AudioPlayer v1: WAV-wrapped audio decoded successfully, duration:', audioBuffer.duration, 's');
        } catch (wavError) {
          console.error('❌ AudioPlayer v1: WAV-wrapped decode also failed:', wavError);
          throw decodeError; // Throw original error
        }
      }
      
      // Double-check state AFTER async operations - audio might have been stopped
      // If currentSource is still null and isPlaying is still false, we're truly starting
      const isTrulyStarting = wasNotPlayingBefore && !this.isPlaying && this.currentSource === null;
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      // Calculate precise start time for gapless playback
      const currentTime = audioContext.currentTime;
      const startTime = this.nextStartTime > currentTime ? this.nextStartTime : currentTime;
      
      // Update next start time for seamless playback (no gaps)
      this.nextStartTime = startTime + audioBuffer.duration;
      
      // Track this source for cleanup
      this.scheduledSources.push({ source, endTime: this.nextStartTime });
      
      // Set state BEFORE emitting event to prevent race conditions
      this.currentSource = source;
      this.isPlaying = true;
      
      // Emit playbackStarted right before actually starting playback
      // This ensures the event is sent when audio actually starts playing
      // CRITICAL: This must be emitted when audio truly starts, not before
      if (isTrulyStarting) {
        this.emit('playbackStarted');
      }
      
      // Handle audio end with gapless playback
      source.onended = () => {
        // Remove from scheduled sources
        this.scheduledSources = this.scheduledSources.filter(s => s.source !== source);
        
        // If this was the current source, clear it
        if (this.currentSource === source) {
          this.currentSource = null;
        }
        
        this.isProcessingQueue = false;
        
        // Process next audio in queue if there are more items
        if (this.audioQueue.length > 0) {
          // More audio to play - continue processing without emitting playbackStopped
          // Keep isPlaying = true since we'll continue playing
          // Start next chunk immediately for gapless playback
          this.processQueue();
        } else {
          // Check if any other sources are still playing
          const stillPlaying = this.scheduledSources.length > 0 || this.currentSource !== null;
          
          if (!stillPlaying) {
            // Queue is empty and no sources playing - playback has truly ended
            setTimeout(() => {
              // Check again if new audio arrived during the delay
              if (this.audioQueue.length === 0 && !this.currentSource && this.scheduledSources.length === 0) {
                this.isPlaying = false;
                this.nextStartTime = 0; // Reset for next session
                this.emit('playbackStopped');
              }
            }, 100);
          }
        }
      };
      
      // Start playback at precise time for gapless playback
      source.start(startTime);
      
    } catch (error) {
      this.currentSource = null;
      this.emit('playbackError', error);
      
      // Try to process next audio in queue if there are more items
      if (this.audioQueue.length > 0) {
        this.isProcessingQueue = false;
        setTimeout(() => this.processQueue(), 100);
      } else {
        // Queue is empty - playback has ended
        this.isPlaying = false;
        this.isProcessingQueue = false;
        this.emit('playbackStopped');
      }
    }
  }
  
  /**
   * Stop current playback and clear queue
   */
  stop() {
    this.stopImmediate();
  }
  
  /**
   * Stop current playback immediately and clear queue
   */
  stopImmediate() {
    const wasPlaying = this.isPlaying || this.currentSource !== null || this.scheduledSources.length > 0;
    
    // Stop all scheduled sources
    this.scheduledSources.forEach(({ source }) => {
      try {
        source.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
    });
    this.scheduledSources = [];
    
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
      this.currentSource = null;
    }
    
    this.isPlaying = false;
    this.isProcessingQueue = false;
    this.audioQueue = [];
    this.nextStartTime = 0; // Reset for next session
    
    // Only emit playbackStopped if audio was actually playing
    if (wasPlaying) {
      this.emit('playbackStopped');
    }
  }
  
  /**
   * Get playback status
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isProcessingQueue: this.isProcessingQueue,
      queueLength: this.audioQueue.length,
      audioContextState: this.audioContext ? this.audioContext.state : 'closed'
    };
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    this.stop();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
