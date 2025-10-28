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
      console.log('🎤 AudioRecorder: Requesting microphone access...');
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
      console.log('✅ AudioRecorder: Microphone access granted');
      
      console.log('🎤 AudioRecorder: Creating AudioContext...');
      // Create AudioContext
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });
      
      // Resume AudioContext if suspended
      if (this.audioContext.state === 'suspended') {
        console.log('🎤 AudioRecorder: Resuming suspended AudioContext...');
        await this.audioContext.resume();
      }
      console.log('✅ AudioRecorder: AudioContext ready');
      
      console.log('🎤 AudioRecorder: Loading AudioWorklet module...');
      // Load AudioWorklet module
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');
      console.log('✅ AudioRecorder: AudioWorklet module loaded');
      
      console.log('🎤 AudioRecorder: Creating AudioWorklet node...');
      // Create AudioWorklet node
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
      
      console.log('🎤 AudioRecorder: Connecting audio source...');
      // Create media stream source
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.audioWorkletNode);
      
      // Handle messages from AudioWorklet
      this.audioWorkletNode.port.onmessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'pcm_audio_data') {
          console.log('🎵 AudioRecorder: Received audio data, length:', data.length);
          this.emit('audioData', data);
        }
      };
      
      console.log('🎤 AudioRecorder: Enabling continuous mode...');
      // Enable continuous mode
      this.audioWorkletNode.port.postMessage({
        type: 'setForceContinuous',
        data: { enabled: true }
      });
      
      this.isRecording = true;
      console.log('✅ AudioRecorder: Recording started successfully');
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
