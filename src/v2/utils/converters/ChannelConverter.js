// src/v2/utils/converters/ChannelConverter.js

/**
 * Channel Converter - Handles channel conversion FROM PCM
 * 
 * Currently only supports mono (1 channel), but prepared for future stereo support
 */
class ChannelConverter {
  /**
   * Convert PCM channels
   * @param {ArrayBuffer} pcmData - Input PCM data
   * @param {number} inputChannels - Input channel count
   * @param {number} outputChannels - Output channel count
   * @param {number} bitDepth - Bit depth (16 or 24)
   * @returns {ArrayBuffer} - Converted PCM data
   */
  static convert(pcmData, inputChannels, outputChannels, bitDepth = 16) {
    if (inputChannels === outputChannels) {
      return pcmData; // No conversion needed
    }
    
    if (inputChannels === 1 && outputChannels === 1) {
      return pcmData; // Already mono
    }
    
    if (inputChannels === 1 && outputChannels === 2) {
      // Mono → Stereo: Duplicate channel
      return ChannelConverter.monoToStereo(pcmData, bitDepth);
    }
    
    if (inputChannels === 2 && outputChannels === 1) {
      // Stereo → Mono: Average channels
      return ChannelConverter.stereoToMono(pcmData, bitDepth);
    }
    
    throw new Error(`Unsupported channel conversion: ${inputChannels} → ${outputChannels}`);
  }
  
  /**
   * Convert mono to stereo (duplicate channel)
   * @param {ArrayBuffer} monoData - Mono PCM data
   * @param {number} bitDepth - Bit depth
   * @returns {ArrayBuffer} - Stereo PCM data
   */
  static monoToStereo(monoData, bitDepth) {
    const bytesPerSample = bitDepth / 8;
    const numSamples = monoData.byteLength / bytesPerSample;
    const stereoData = new ArrayBuffer(numSamples * bytesPerSample * 2);
    
    const input = new Uint8Array(monoData);
    const output = new Uint8Array(stereoData);
    
    for (let i = 0; i < numSamples; i++) {
      const inputOffset = i * bytesPerSample;
      const outputOffset = i * bytesPerSample * 2;
      
      // Copy sample to both left and right channels
      for (let j = 0; j < bytesPerSample; j++) {
        output[outputOffset + j] = input[inputOffset + j]; // Left
        output[outputOffset + bytesPerSample + j] = input[inputOffset + j]; // Right
      }
    }
    
    return stereoData;
  }
  
  /**
   * Convert stereo to mono (average channels)
   * @param {ArrayBuffer} stereoData - Stereo PCM data
   * @param {number} bitDepth - Bit depth
   * @returns {ArrayBuffer} - Mono PCM data
   */
  static stereoToMono(stereoData, bitDepth) {
    const bytesPerSample = bitDepth / 8;
    const numSamples = stereoData.byteLength / (bytesPerSample * 2);
    const monoData = new ArrayBuffer(numSamples * bytesPerSample);
    
    const input = new Uint8Array(stereoData);
    const output = new Uint8Array(monoData);
    
    if (bitDepth === 16) {
      // 16-bit: Average samples
      for (let i = 0; i < numSamples; i++) {
        const leftOffset = i * bytesPerSample * 2;
        const rightOffset = leftOffset + bytesPerSample;
        
        const left = (input[leftOffset] | (input[leftOffset + 1] << 8)) << 16 >> 16; // Sign extend
        const right = (input[rightOffset] | (input[rightOffset + 1] << 8)) << 16 >> 16;
        
        const mono = Math.round((left + right) / 2);
        
        const outputOffset = i * bytesPerSample;
        output[outputOffset] = mono & 0xFF;
        output[outputOffset + 1] = (mono >> 8) & 0xFF;
      }
    } else {
      // For other bit depths, just take left channel
      for (let i = 0; i < numSamples; i++) {
        const inputOffset = i * bytesPerSample * 2;
        const outputOffset = i * bytesPerSample;
        
        for (let j = 0; j < bytesPerSample; j++) {
          output[outputOffset + j] = input[inputOffset + j];
        }
      }
    }
    
    return monoData;
  }
}

export default ChannelConverter;




