// src/v2/codecs/PCMACodec.js

/**
 * PCMA (A-law) Codec - handles A-law compressed audio
 * Used for European telephony (8kHz, 8-bit)
 */
class PCMACodec {
  constructor() {
    this.name = 'PCMA';
  }

  /**
   * Decode PCMA (A-law) to 16-bit PCM
   * @param {Uint8Array} pcmaData - A-law encoded audio data
   * @returns {ArrayBuffer} - 16-bit PCM audio data
   */
  decode(pcmaData) {
    const input = pcmaData instanceof Uint8Array ? 
                  pcmaData : 
                  new Uint8Array(pcmaData);
    
    const pcm16 = new Int16Array(input.length);
    
    for (let i = 0; i < input.length; i++) {
      pcm16[i] = this.alawToLinear(input[i]);
    }
    
    return pcm16.buffer;
  }

  /**
   * Encode 16-bit PCM to PCMA (A-law)
   * @param {ArrayBuffer} pcm16Data - 16-bit PCM audio data
   * @returns {Uint8Array} - A-law encoded audio data
   */
  encode(pcm16Data) {
    const pcm16 = pcm16Data instanceof Int16Array ? 
                  pcm16Data : 
                  new Int16Array(pcm16Data);
    
    const pcma = new Uint8Array(pcm16.length);
    
    for (let i = 0; i < pcm16.length; i++) {
      pcma[i] = this.linearToAlaw(pcm16[i]);
    }
    
    return pcma;
  }

  /**
   * A-law decompression: 8-bit → 16-bit
   * @param {number} alaw - A-law encoded byte
   * @returns {number} - 16-bit linear PCM sample
   */
  alawToLinear(alaw) {
    alaw ^= 0x55; // XOR with 0x55
    
    const sign = (alaw & 0x80) ? -1 : 1;
    const exponent = (alaw >> 4) & 0x07;
    const mantissa = alaw & 0x0F;
    
    let value;
    if (exponent === 0) {
      value = (mantissa << 4) + 8;
    } else {
      value = ((mantissa << 4) + 0x108) << (exponent - 1);
    }
    
    return sign * value;
  }

  /**
   * A-law compression: 16-bit → 8-bit
   * @param {number} sample - 16-bit linear PCM sample
   * @returns {number} - A-law encoded byte
   */
  linearToAlaw(sample) {
    const CLIP = 32635;
    
    let sign = (sample >> 8) & 0x80;
    if (sign) {
      sample = -sample;
    }
    
    if (sample > CLIP) {
      sample = CLIP;
    }
    
    let exponent, mantissa;
    
    if (sample < 256) {
      exponent = 0;
      mantissa = sample >> 4;
    } else {
      exponent = 7;
      for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1);
      mantissa = (sample >> (exponent + 3)) & 0x0F;
    }
    
    let alaw = sign | (exponent << 4) | mantissa;
    
    return alaw ^ 0x55; // XOR with 0x55
  }
}

export default PCMACodec;

