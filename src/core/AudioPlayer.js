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
      if (!this.isPlaying && !this.isProcessingQueue) {
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
    if (this.isProcessingQueue || this.isPlaying || this.audioQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    const audioBlob = this.audioQueue.shift();
    if (!audioBlob) {
      this.isProcessingQueue = false;
      return;
    }
    
    try {
      this.isPlaying = true;
      this.emit('playbackStarted');
      
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
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      this.currentSource = source;
      
      // Handle audio end
      source.onended = () => {
        this.isPlaying = false;
        this.isProcessingQueue = false;
        this.currentSource = null;
        this.emit('playbackStopped');
        
        // Process next audio in queue if there are more items
        if (this.audioQueue.length > 0) {
          setTimeout(() => this.processQueue(), 100);
        }
      };
      
      // Start playback
      source.start();
      
    } catch (error) {
      this.isPlaying = false;
      this.isProcessingQueue = false;
      this.currentSource = null;
      this.emit('playbackError', error);
      
      // Try to process next audio in queue if there are more items
      if (this.audioQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
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
    this.emit('playbackStopped');
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
