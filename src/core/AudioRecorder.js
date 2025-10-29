/**
 * AudioRecorder - Handles audio recording using AudioWorklet
 */
import EventEmitter from './EventEmitter.js';

export default class AudioRecorder extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.audioContext = null;
    this.audioWorkletNode = null;
    this.mediaStream = null;
    this.isRecording = false;
  }
  
  /**
   * Start audio recording
   */
  async start() {
    try {
      // Get user media
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create AudioContext
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });
      
      // Resume AudioContext if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Load AudioWorklet module
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');
      
      // Create AudioWorklet node
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
      
      // Create media stream source
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.audioWorkletNode);
      
      // Handle messages from AudioWorklet
      this.audioWorkletNode.port.onmessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'pcm_audio_data') {
          this.emit('audioData', data);
        }
      };
      
      // Enable continuous mode
      this.audioWorkletNode.port.postMessage({
        type: 'setForceContinuous',
        data: { enabled: true }
      });
      
      this.isRecording = true;
      this.emit('recordingStarted');
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Stop audio recording
   */
  async stop() {
    if (!this.isRecording) {
      return;
    }
    
    try {
      // Flush any remaining audio data
      if (this.audioWorkletNode) {
        this.audioWorkletNode.port.postMessage({ type: 'flush' });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Disconnect and cleanup
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
        this.audioContext = null;
      }
      
      this.audioWorkletNode = null;
      this.isRecording = false;
      this.emit('recordingStopped');
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Get recording status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      audioContextState: this.audioContext ? this.audioContext.state : 'closed'
    };
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    this.stop();
  }
}
