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
   * Get the audio processor path
   * Tries to detect from script source, falls back to config or default
   */
  getAudioProcessorPath() {
    // If explicitly configured, use it
    if (this.config.audioProcessorPath) {
      return this.config.audioProcessorPath;
    }
    
    // Try to find the script that loaded the SDK
    const scripts = document.getElementsByTagName('script');
    for (let script of scripts) {
      const src = script.src;
      // Check if this is the agent-widget.js script
      if (src && (src.includes('agent-widget.js') || src.includes('ttp-agent-sdk'))) {
        // Extract base URL and construct processor path
        try {
          const url = new URL(src);
          const basePath = src.substring(0, src.lastIndexOf('/'));
          return `${basePath}/audio-processor.js`;
        } catch (e) {
          // If URL parsing fails, try to extract path manually
          const basePath = src.substring(0, src.lastIndexOf('/'));
          return `${basePath}/audio-processor.js`;
        }
      }
    }
    
    // Fallback to CDN
    return 'https://cdn.talktopc.com/audio-processor.js';
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
      
      // Get the audio processor path
      const processorPath = this.getAudioProcessorPath();
      
      // Load AudioWorklet module
      await this.audioContext.audioWorklet.addModule(processorPath);
      
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
