// src/v2/utils/converters/EncodingConverter.js

import PCMCodec from '../../codecs/PCMCodec.js';
import PCMUCodec from '../../codecs/PCMUCodec.js';
import PCMACodec from '../../codecs/PCMACodec.js';

/**
 * Encoding Converter - Handles PCM ↔ PCMU ↔ PCMA conversion
 * 
 * All conversions are FROM PCM (PCM is the universal intermediate format)
 */
class EncodingConverter {
  constructor() {
    this.codecs = {
      pcm: new PCMCodec(),
      pcmu: new PCMUCodec(),
      pcma: new PCMACodec()
    };
  }
  
  /**
   * Decode encoded audio to PCM
   * @param {ArrayBuffer|Uint8Array} encodedData - Encoded audio (PCMU/PCMA)
   * @param {string} encoding - Source encoding ('pcm', 'pcmu', 'pcma')
   * @returns {ArrayBuffer} - 16-bit PCM audio data
   */
  decodeToPcm(encodedData, encoding) {
    const normalizedEncoding = encoding?.toLowerCase();
    
    if (!normalizedEncoding || normalizedEncoding === 'pcm') {
      // Already PCM, return as-is
      if (encodedData instanceof ArrayBuffer) {
        return encodedData;
      }
      if (encodedData instanceof Uint8Array) {
        return encodedData.buffer;
      }
      return encodedData;
    }
    
    const codec = this.codecs[normalizedEncoding];
    if (!codec) {
      throw new Error(`Unsupported encoding: ${encoding}`);
    }
    
    const input = encodedData instanceof Uint8Array ? 
                  encodedData : 
                  new Uint8Array(encodedData);
    
    return codec.decode(input);
  }
  
  /**
   * Encode PCM to target encoding
   * @param {ArrayBuffer} pcmData - 16-bit PCM audio data
   * @param {string} targetEncoding - Target encoding ('pcm', 'pcmu', 'pcma')
   * @returns {ArrayBuffer|Uint8Array} - Encoded audio data
   */
  encodeFromPcm(pcmData, targetEncoding) {
    const normalizedEncoding = targetEncoding?.toLowerCase();
    
    if (!normalizedEncoding || normalizedEncoding === 'pcm') {
      // Target is PCM, return as-is
      return pcmData;
    }
    
    const codec = this.codecs[normalizedEncoding];
    if (!codec) {
      throw new Error(`Unsupported target encoding: ${targetEncoding}`);
    }
    
    const encoded = codec.encode(pcmData);
    
    // Return as ArrayBuffer for consistency
    if (encoded instanceof Uint8Array) {
      return encoded.buffer;
    }
    
    return encoded;
  }
  
  /**
   * Get codec for encoding
   * @param {string} encoding - Encoding name
   * @returns {Object|null} - Codec instance or null
   */
  getCodec(encoding) {
    const normalized = encoding?.toLowerCase();
    return this.codecs[normalized] || null;
  }
}

export default EncodingConverter;


