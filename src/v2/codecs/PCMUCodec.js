// src/v2/codecs/PCMUCodec.js

/**
 * PCMU (μ-law) Codec - handles μ-law compressed audio
 * Used for telephony (8kHz, 8-bit)
 */
class PCMUCodec {
  constructor() {
    this.name = 'PCMU';
  }

  /**
   * Decode PCMU (μ-law) to 16-bit PCM
   * @param {Uint8Array} pcmuData - μ-law encoded audio data
   * @returns {ArrayBuffer} - 16-bit PCM audio data
   */
  decode(pcmuData) {
    const input = pcmuData instanceof Uint8Array ? 
                  pcmuData : 
                  new Uint8Array(pcmuData);
    
    const pcm16 = new Int16Array(input.length);
    
    for (let i = 0; i < input.length; i++) {
      pcm16[i] = this.mulawToLinear(input[i]);
    }
    
    return pcm16.buffer;
  }

  /**
   * Encode 16-bit PCM to PCMU (μ-law)
   * @param {ArrayBuffer} pcm16Data - 16-bit PCM audio data
   * @returns {Uint8Array} - μ-law encoded audio data
   */
  encode(pcm16Data) {
    const pcm16 = pcm16Data instanceof Int16Array ? 
                  pcm16Data : 
                  new Int16Array(pcm16Data);
    
    const pcmu = new Uint8Array(pcm16.length);
    
    for (let i = 0; i < pcm16.length; i++) {
      pcmu[i] = this.linearToMulaw(pcm16[i]);
    }
    
    return pcmu;
  }

  /**
   * μ-law decompression: 8-bit → 16-bit
   * @param {number} mulaw - μ-law encoded byte
   * @returns {number} - 16-bit linear PCM sample
   */
  mulawToLinear(mulaw) {
    // μ-law decompression algorithm
    const sign = (mulaw & 0x80) ? -1 : 1;
    const exponent = (mulaw >> 4) & 0x07;
    const mantissa = mulaw & 0x0F;
    
    const step = 1 << (exponent + 3);
    const value = 132 + mantissa * step + (step >> 1) - 4;
    
    return sign * value;
  }

  /**
   * μ-law compression: 16-bit → 8-bit
   * @param {number} sample - 16-bit linear PCM sample
   * @returns {number} - μ-law encoded byte
   */
  linearToMulaw(sample) {
    const BIAS = 0x84;
    const CLIP = 32635;
    
    let sign = (sample >> 8) & 0x80;
    if (sign) {
      sample = -sample;
    }
    
    if (sample > CLIP) {
      sample = CLIP;
    }
    
    sample += BIAS;
    
    let exponent = 7;
    for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1);
    
    let mantissa = (sample >> (exponent + 3)) & 0x0F;
    let mulaw = ~(sign | (exponent << 4) | mantissa);
    
    return mulaw & 0xFF;
  }
}

export default PCMUCodec;

