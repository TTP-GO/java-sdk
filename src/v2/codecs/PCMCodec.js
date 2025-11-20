// src/v2/codecs/PCMCodec.js

/**
 * PCM Codec - handles raw PCM audio (no compression)
 */
class PCMCodec {
  constructor() {
    this.name = 'PCM';
  }

  /**
   * Decode PCM data (it's already decoded, so return as-is)
   * @param {Uint8Array|ArrayBuffer} data - PCM audio data
   * @returns {ArrayBuffer} - PCM audio data
   */
  decode(data) {
    if (data instanceof ArrayBuffer) {
      return data;
    }
    if (data instanceof Uint8Array) {
      return data.buffer;
    }
    throw new Error('Invalid PCM data type');
  }

  /**
   * Encode PCM data (no encoding needed)
   * @param {ArrayBuffer} pcmData - PCM audio data
   * @returns {ArrayBuffer} - PCM audio data
   */
  encode(pcmData) {
    return pcmData;
  }
}

export default PCMCodec;

