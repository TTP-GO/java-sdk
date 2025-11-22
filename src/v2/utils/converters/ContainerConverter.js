// src/v2/utils/converters/ContainerConverter.js

/**
 * Container Converter - Handles WAV ↔ Raw conversion
 * 
 * Responsibilities:
 * - Extract PCM from WAV (parse header, extract data chunk)
 * - Wrap PCM in WAV header (create standard WAV file)
 */
class ContainerConverter {
  /**
   * Extract raw PCM from WAV file
   * @param {ArrayBuffer|Uint8Array} wavData - WAV file data
   * @returns {Object} - { pcmData: ArrayBuffer, format: { sampleRate, channels, bitDepth } }
   */
  static extractPcmFromWav(wavData) {
    const bytes = wavData instanceof Uint8Array ? wavData : new Uint8Array(wavData);
    
    if (bytes.length < 44) {
      throw new Error('WAV data too short (< 44 bytes)');
    }
    
    // Verify RIFF header
    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    if (riff !== 'RIFF') {
      throw new Error('Not a valid WAV file - missing RIFF header');
    }
    
    // Verify WAVE format
    const wave = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (wave !== 'WAVE') {
      throw new Error('Not a valid WAV file - missing WAVE format');
    }
    
    // Parse format chunk (little-endian)
    const channels = bytes[22] | (bytes[23] << 8);
    const sampleRate = bytes[24] | (bytes[25] << 8) | (bytes[26] << 16) | (bytes[27] << 24);
    const bitDepth = bytes[34] | (bytes[35] << 8);
    
    // Find "data" chunk
    let dataChunkStart = -1;
    for (let i = 12; i < bytes.length - 8; i += 4) {
      const chunkId = String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
      if (chunkId === 'data') {
        dataChunkStart = i;
        break;
      }
      // Skip this chunk
      const chunkSize = bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24);
      i += 4 + chunkSize; // Skip chunk header + data
    }
    
    if (dataChunkStart === -1) {
      throw new Error('No data chunk found in WAV');
    }
    
    // Read data chunk size
    const dataSize = bytes[dataChunkStart + 4] | 
                    (bytes[dataChunkStart + 5] << 8) | 
                    (bytes[dataChunkStart + 6] << 16) | 
                    (bytes[dataChunkStart + 7] << 24);
    
    // Extract PCM data
    const dataStart = dataChunkStart + 8;
    const actualDataSize = Math.min(dataSize, bytes.length - dataStart);
    
    const pcmData = bytes.slice(dataStart, dataStart + actualDataSize);
    
    return {
      pcmData: pcmData.buffer,
      format: {
        sampleRate,
        channels,
        bitDepth
      }
    };
  }
  
  /**
   * Check if data is a WAV file
   * @param {Uint8Array} bytes - Data to check
   * @returns {boolean} - True if WAV file
   */
  static isWavFile(bytes) {
    return bytes.length >= 44 &&
           bytes[0] === 0x52 && bytes[1] === 0x49 && // "RI"
           bytes[2] === 0x46 && bytes[3] === 0x46;   // "FF"
  }
  
  /**
   * Create WAV header
   * @param {number} dataLength - Length of PCM data in bytes
   * @param {number} sampleRate - Sample rate in Hz
   * @param {number} numChannels - Number of channels (1 = mono)
   * @param {number} bitsPerSample - Bit depth (8, 16, 24)
   * @returns {ArrayBuffer} - 44-byte WAV header
   */
  static createWavHeader(dataLength, sampleRate, numChannels, bitsPerSample) {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataLength, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt chunk
    view.setUint32(12, 0x666D7420, false); // "fmt "
    view.setUint32(16, 16, true);           // Subchunk size
    view.setUint16(20, 1, true);            // Audio format (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); // Byte rate
    view.setUint16(32, numChannels * bitsPerSample / 8, true); // Block align
    view.setUint16(34, bitsPerSample, true);
    
    // data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true);
    
    return header;
  }
  
  /**
   * Wrap PCM data in WAV container
   * @param {ArrayBuffer} pcmData - Raw PCM audio data
   * @param {Object} format - Audio format { sampleRate, channels, bitDepth }
   * @returns {ArrayBuffer} - WAV file data
   */
  static wrapPcmInWav(pcmData, format) {
    const header = ContainerConverter.createWavHeader(
      pcmData.byteLength,
      format.sampleRate,
      format.channels || 1,
      format.bitDepth || 16
    );
    
    // Combine header + data
    const wavFile = new Uint8Array(header.byteLength + pcmData.byteLength);
    wavFile.set(new Uint8Array(header), 0);
    wavFile.set(new Uint8Array(pcmData), header.byteLength);
    
    return wavFile.buffer;
  }
}

export default ContainerConverter;



