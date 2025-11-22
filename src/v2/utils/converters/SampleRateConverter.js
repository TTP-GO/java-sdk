// src/v2/utils/converters/SampleRateConverter.js

/**
 * Sample Rate Converter - Handles resampling FROM PCM
 * 
 * Uses Web Audio API OfflineAudioContext for high-quality resampling
 */
class SampleRateConverter {
  /**
   * Resample PCM audio to target sample rate
   * @param {ArrayBuffer} pcmData - Input PCM data (16-bit)
   * @param {number} inputSampleRate - Input sample rate in Hz
   * @param {number} outputSampleRate - Output sample rate in Hz
   * @returns {Promise<ArrayBuffer>} - Resampled PCM data
   */
  static async resample(pcmData, inputSampleRate, outputSampleRate) {
    if (inputSampleRate === outputSampleRate) {
      return pcmData; // No resampling needed
    }
    
    // Convert Int16 PCM to Float32 for Web Audio API
    const int16Array = new Int16Array(pcmData);
    const float32Array = new Float32Array(int16Array.length);
    const NORMALIZATION = 1.0 / 32768.0;
    
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] * NORMALIZATION;
    }
    
    // Create offline audio context for resampling
    const outputLength = Math.ceil(float32Array.length * outputSampleRate / inputSampleRate);
    const offlineContext = new OfflineAudioContext(
      1, // mono
      outputLength,
      outputSampleRate
    );
    
    // Create buffer with input sample rate
    const inputBuffer = offlineContext.createBuffer(
      1, // mono
      float32Array.length,
      inputSampleRate
    );
    
    inputBuffer.getChannelData(0).set(float32Array);
    
    // Create source and connect
    const source = offlineContext.createBufferSource();
    source.buffer = inputBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    // Render to get resampled audio
    const resampledBuffer = await offlineContext.startRendering();
    const resampledFloat32 = resampledBuffer.getChannelData(0);
    
    // Convert Float32 back to Int16 PCM
    const resampledInt16 = new Int16Array(resampledFloat32.length);
    for (let i = 0; i < resampledFloat32.length; i++) {
      const sample = Math.max(-1, Math.min(1, resampledFloat32[i]));
      resampledInt16[i] = Math.round(sample * 32767);
    }
    
    return resampledInt16.buffer;
  }
}

export default SampleRateConverter;



