/**
 * AudioPlayer - Handles audio playback with queue system
 */
import EventEmitter from './EventEmitter.js';

export default class AudioPlayer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.isProcessingQueue = false;
    this.currentSource = null;
  }
  
  /**
   * Add audio data to playback queue
   */
  playAudio(audioData) {
    try {
      const audioBlob = this.createAudioBlob(audioData);
      this.audioQueue.push(audioBlob);
      
      // Process queue if not already playing or processing
      // Also check if we have a current source - if not, we should start processing
      if (!this.isPlaying && !this.isProcessingQueue && !this.currentSource) {
        setTimeout(() => this.processQueue(), 50);
      }
    } catch (error) {
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
      return;
    }
    
    this.isProcessingQueue = true;
    
    const audioBlob = this.audioQueue.shift();
    if (!audioBlob) {
      this.isProcessingQueue = false;
      return;
    }
    
    try {
      // Check if we were playing BEFORE async operations (decode, etc.)
      // This ensures we detect the true state before any async delays
      const wasNotPlayingBefore = !this.isPlaying && this.currentSource === null;
      
      // Create AudioContext if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = this.audioContext;
      
      // Resume AudioContext if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create audio source from blob
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Double-check state AFTER async operations - audio might have been stopped
      // If currentSource is still null and isPlaying is still false, we're truly starting
      const isTrulyStarting = wasNotPlayingBefore && !this.isPlaying && this.currentSource === null;
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      // Set state BEFORE emitting event to prevent race conditions
      this.currentSource = source;
      this.isPlaying = true;
      
      // Emit playbackStarted right before actually starting playback
      // This ensures the event is sent when audio actually starts playing
      // CRITICAL: This must be emitted when audio truly starts, not before
      if (isTrulyStarting) {
        this.emit('playbackStarted');
      }
      
      // Handle audio end
      source.onended = () => {
        this.currentSource = null;
        this.isProcessingQueue = false;
        
        // Process next audio in queue if there are more items
        if (this.audioQueue.length > 0) {
          // More audio to play - continue processing without emitting playbackStopped
          // Keep isPlaying = true since we'll continue playing
          // Use immediate processing to minimize gaps
          setTimeout(() => this.processQueue(), 50);
        } else {
          // Queue is empty - playback has truly ended
          // Small delay to ensure smooth transition if new audio arrives quickly
          setTimeout(() => {
            // Check again if new audio arrived during the delay
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
    const wasPlaying = this.isPlaying || this.currentSource !== null;
    
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
