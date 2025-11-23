// src/v2/utils/converters/BitDepthConverter.js

/**
 * Bit Depth Converter - Handles bit depth conversion FROM PCM
 * 
 * Note: Source is NEVER 8-bit (only 16-bit or 24-bit)
 * All conversions are FROM PCM
 */
class BitDepthConverter {
  /**
   * Convert PCM from one bit depth to another
   * @param {ArrayBuffer} pcmData - Input PCM data
   * @param {number} inputBitDepth - Input bit depth (16 or 24, never 8)
   * @param {number} outputBitDepth - Output bit depth (8, 16, or 24)
   * @returns {ArrayBuffer} - Converted PCM data
   */
  static convert(pcmData, inputBitDepth, outputBitDepth) {
    if (inputBitDepth === outputBitDepth) {
      return pcmData; // No conversion needed
    }
    
    if (inputBitDepth === 8) {
      throw new Error('Source bit depth cannot be 8-bit (only 16-bit or 24-bit supported)');
    }
    
    const inputBytesPerSample = inputBitDepth / 8;
    const outputBytesPerSample = outputBitDepth / 8;
    const numSamples = pcmData.byteLength / inputBytesPerSample;
    
    const outputData = new ArrayBuffer(numSamples * outputBytesPerSample);
    
    if (inputBitDepth === 16 && outputBitDepth === 16) {
      // No conversion
      return pcmData;
    } else if (inputBitDepth === 24 && outputBitDepth === 16) {
      // 24-bit → 16-bit: Scale down
      return BitDepthConverter.convert24To16(pcmData);
    } else if (inputBitDepth === 16 && outputBitDepth === 24) {
      // 16-bit → 24-bit: Scale up
      return BitDepthConverter.convert16To24(pcmData);
    } else if (inputBitDepth === 16 && outputBitDepth === 8) {
      // 16-bit → 8-bit: Scale down (rare)
      return BitDepthConverter.convert16To8(pcmData);
    } else if (inputBitDepth === 24 && outputBitDepth === 8) {
      // 24-bit → 8-bit: Scale down (rare)
      return BitDepthConverter.convert24To8(pcmData);
    } else {
      throw new Error(`Unsupported bit depth conversion: ${inputBitDepth}-bit → ${outputBitDepth}-bit`);
    }
  }
  
  /**
   * Convert 24-bit PCM to 16-bit PCM
   * @param {ArrayBuffer} pcm24Data - 24-bit PCM data
   * @returns {ArrayBuffer} - 16-bit PCM data
   */
  static convert24To16(pcm24Data) {
    const bytes = new Uint8Array(pcm24Data);
    const samples = Math.floor(bytes.length / 3);
    const pcm16 = new Int16Array(samples);
    
    for (let i = 0; i < samples; i++) {
      // Read 24-bit signed integer (little-endian)
      const byte0 = bytes[i * 3];     // LSB
      const byte1 = bytes[i * 3 + 1]; // Middle
      const byte2 = bytes[i * 3 + 2]; // MSB (sign bit)
      
      // Combine bytes to 24-bit value
      let value24 = byte0 | (byte1 << 8) | ((byte2 & 0xFF) << 16);
      
      // Sign extend if negative
      if (byte2 & 0x80) {
        value24 = value24 | 0xFF000000;
      }
      
      // Scale down to 16-bit (divide by 256)
      pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(value24 / 256)));
    }
    
    return pcm16.buffer;
  }
  
  /**
   * Convert 16-bit PCM to 24-bit PCM
   * @param {ArrayBuffer} pcm16Data - 16-bit PCM data
   * @returns {ArrayBuffer} - 24-bit PCM data
   */
  static convert16To24(pcm16Data) {
    const pcm16 = new Int16Array(pcm16Data);
    const pcm24 = new Uint8Array(pcm16.length * 3);
    
    for (let i = 0; i < pcm16.length; i++) {
      const value = pcm16[i];
      // Scale up to 24-bit (multiply by 256)
      const value24 = value * 256;
      
      // Write as little-endian 24-bit
      pcm24[i * 3] = value24 & 0xFF;
      pcm24[i * 3 + 1] = (value24 >> 8) & 0xFF;
      pcm24[i * 3 + 2] = (value24 >> 16) & 0xFF;
    }
    
    return pcm24.buffer;
  }
  
  /**
   * Convert 16-bit PCM to 8-bit PCM
   * @param {ArrayBuffer} pcm16Data - 16-bit PCM data
   * @returns {ArrayBuffer} - 8-bit PCM data
   */
  static convert16To8(pcm16Data) {
    const pcm16 = new Int16Array(pcm16Data);
    const pcm8 = new Uint8Array(pcm16.length);
    
    for (let i = 0; i < pcm16.length; i++) {
      // 16-bit signed (-32768 to 32767) → 8-bit unsigned (0 to 255)
      const value = pcm16[i];
      pcm8[i] = Math.max(0, Math.min(255, Math.round((value / 256) + 128)));
    }
    
    return pcm8.buffer;
  }
  
  /**
   * Convert 24-bit PCM to 8-bit PCM
   * @param {ArrayBuffer} pcm24Data - 24-bit PCM data
   * @returns {ArrayBuffer} - 8-bit PCM data
   */
  static convert24To8(pcm24Data) {
    // First convert to 16-bit, then to 8-bit
    const pcm16 = BitDepthConverter.convert24To16(pcm24Data);
    return BitDepthConverter.convert16To8(pcm16);
  }
}

export default BitDepthConverter;




