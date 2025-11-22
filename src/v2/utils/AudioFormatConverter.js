// src/v2/utils/AudioFormatConverter.js

import ContainerConverter from './converters/ContainerConverter.js';
import EncodingConverter from './converters/EncodingConverter.js';
import BitDepthConverter from './converters/BitDepthConverter.js';
import SampleRateConverter from './converters/SampleRateConverter.js';
import ChannelConverter from './converters/ChannelConverter.js';

/**
 * Audio Format Converter - Converts audio from backend format to requested format
 * 
 * All conversions start FROM PCM (PCM is the universal intermediate format)
 * 
 * @example
 * const converter = new AudioFormatConverter(requestedFormat, actualFormat);
 * if (converter.needsConversion()) {
 *   const converted = await converter.convert(audioData);
 * }
 */
class AudioFormatConverter {
  /**
   * @param {Object} requestedFormat - What user wants
   * @param {string} requestedFormat.container - 'raw' or 'wav'
   * @param {string} requestedFormat.encoding - 'pcm', 'pcmu', 'pcma'
   * @param {number} requestedFormat.sampleRate - Sample rate in Hz
   * @param {number} requestedFormat.bitDepth - Bit depth (8, 16, 24)
   * @param {number} requestedFormat.channels - Number of channels (1 = mono)
   * 
   * @param {Object} actualFormat - What backend is sending
   * @param {string} actualFormat.container - 'raw' or 'wav'
   * @param {string} actualFormat.encoding - 'pcm', 'pcmu', 'pcma'
   * @param {number} actualFormat.sampleRate - Sample rate in Hz
   * @param {number} actualFormat.bitDepth - Bit depth (16 or 24, never 8)
   * @param {number} actualFormat.channels - Number of channels (1 = mono)
   */
  constructor(requestedFormat, actualFormat) {
    this.requestedFormat = requestedFormat;
    this.actualFormat = actualFormat;
    this.encodingConverter = new EncodingConverter();
    this.conversionSteps = [];
    
    // Analyze what conversions are needed
    this._analyzeConversions();
  }
  
  /**
   * Analyze what conversions are needed
   * @private
   */
  _analyzeConversions() {
    this.conversionSteps = [];
    
    // Check container
    if (this.actualFormat.container !== this.requestedFormat.container) {
      if (this.actualFormat.container === 'wav') {
        this.conversionSteps.push('extract_wav');
      } else if (this.requestedFormat.container === 'wav') {
        this.conversionSteps.push('wrap_wav');
      }
    }
    
    // Check encoding
    if (this.actualFormat.encoding !== this.requestedFormat.encoding) {
      if (this.actualFormat.encoding !== 'pcm') {
        this.conversionSteps.push('decode_encoding');
      }
      if (this.requestedFormat.encoding !== 'pcm') {
        this.conversionSteps.push('encode_encoding');
      }
    }
    
    // Check sample rate
    if (this.actualFormat.sampleRate !== this.requestedFormat.sampleRate) {
      this.conversionSteps.push('resample');
    }
    
    // Check bit depth
    if (this.actualFormat.bitDepth !== this.requestedFormat.bitDepth) {
      this.conversionSteps.push('convert_bitdepth');
    }
    
    // Check channels
    if (this.actualFormat.channels !== this.requestedFormat.channels) {
      this.conversionSteps.push('convert_channels');
    }
  }
  
  /**
   * Check if conversion is needed
   * @returns {boolean} - True if formats differ
   */
  needsConversion() {
    return this.conversionSteps.length > 0;
  }
  
  /**
   * Get conversion steps as human-readable array
   * @returns {string[]} - Array of conversion step descriptions
   */
  getConversionSteps() {
    const steps = [];
    
    if (this.conversionSteps.includes('extract_wav')) {
      steps.push(`Extract PCM from WAV (${this.actualFormat.container} → raw)`);
    }
    
    if (this.conversionSteps.includes('decode_encoding')) {
      steps.push(`Decode ${this.actualFormat.encoding.toUpperCase()} → PCM`);
    }
    
    if (this.conversionSteps.includes('resample')) {
      steps.push(`Resample ${this.actualFormat.sampleRate}Hz → ${this.requestedFormat.sampleRate}Hz`);
    }
    
    if (this.conversionSteps.includes('convert_bitdepth')) {
      steps.push(`Convert bit depth ${this.actualFormat.bitDepth}-bit → ${this.requestedFormat.bitDepth}-bit`);
    }
    
    if (this.conversionSteps.includes('convert_channels')) {
      steps.push(`Convert channels ${this.actualFormat.channels} → ${this.requestedFormat.channels}`);
    }
    
    if (this.conversionSteps.includes('encode_encoding')) {
      steps.push(`Encode PCM → ${this.requestedFormat.encoding.toUpperCase()}`);
    }
    
    if (this.conversionSteps.includes('wrap_wav')) {
      steps.push(`Wrap in WAV container (raw → ${this.requestedFormat.container})`);
    }
    
    return steps;
  }
  
  /**
   * Convert audio data from actual format to requested format
   * @param {ArrayBuffer|Uint8Array} audioData - Input audio data
   * @returns {Promise<ArrayBuffer>} - Converted audio data
   */
  async convert(audioData) {
    if (!this.needsConversion()) {
      return audioData instanceof ArrayBuffer ? audioData : audioData.buffer;
    }
    
    let currentData = audioData instanceof ArrayBuffer ? audioData : audioData.buffer;
    let currentFormat = { ...this.actualFormat };
    
    // Step 1: Extract PCM from WAV if needed
    if (this.conversionSteps.includes('extract_wav')) {
      const extracted = ContainerConverter.extractPcmFromWav(currentData);
      currentData = extracted.pcmData;
      // Update format from WAV header
      currentFormat = {
        ...currentFormat,
        container: 'raw',
        sampleRate: extracted.format.sampleRate,
        channels: extracted.format.channels,
        bitDepth: extracted.format.bitDepth
      };
      console.log('🔄 AudioFormatConverter: Extracted PCM from WAV', extracted.format);
    }
    
    // Step 2: Decode to PCM if needed (PCMU/PCMA → PCM)
    if (this.conversionSteps.includes('decode_encoding')) {
      currentData = this.encodingConverter.decodeToPcm(currentData, currentFormat.encoding);
      currentFormat.encoding = 'pcm';
      currentFormat.bitDepth = 16; // Decoded to 16-bit PCM
      console.log(`🔄 AudioFormatConverter: Decoded ${this.actualFormat.encoding.toUpperCase()} → PCM`);
    }
    
    // Step 3: Normalize to 16-bit PCM if 24-bit (for processing)
    if (currentFormat.bitDepth === 24 && currentFormat.bitDepth !== this.requestedFormat.bitDepth) {
      // Only normalize if we need to process it (resample, etc.)
      if (this.conversionSteps.includes('resample') || 
          this.conversionSteps.includes('convert_channels') ||
          (this.requestedFormat.bitDepth !== 24)) {
        currentData = BitDepthConverter.convert(currentData, 24, 16);
        currentFormat.bitDepth = 16;
        console.log('🔄 AudioFormatConverter: Normalized 24-bit → 16-bit PCM');
      }
    }
    
    // Step 4: Resample if needed (FROM PCM)
    if (this.conversionSteps.includes('resample')) {
      currentData = await SampleRateConverter.resample(
        currentData,
        currentFormat.sampleRate,
        this.requestedFormat.sampleRate
      );
      currentFormat.sampleRate = this.requestedFormat.sampleRate;
      console.log(`🔄 AudioFormatConverter: Resampled ${this.actualFormat.sampleRate}Hz → ${this.requestedFormat.sampleRate}Hz`);
    }
    
    // Step 5: Convert channels if needed (FROM PCM)
    if (this.conversionSteps.includes('convert_channels')) {
      currentData = ChannelConverter.convert(
        currentData,
        currentFormat.channels,
        this.requestedFormat.channels,
        currentFormat.bitDepth
      );
      currentFormat.channels = this.requestedFormat.channels;
      console.log(`🔄 AudioFormatConverter: Converted channels ${this.actualFormat.channels} → ${this.requestedFormat.channels}`);
    }
    
    // Step 6: Convert bit depth if needed (FROM PCM)
    if (this.conversionSteps.includes('convert_bitdepth')) {
      currentData = BitDepthConverter.convert(
        currentData,
        currentFormat.bitDepth,
        this.requestedFormat.bitDepth
      );
      currentFormat.bitDepth = this.requestedFormat.bitDepth;
      console.log(`🔄 AudioFormatConverter: Converted bit depth ${this.actualFormat.bitDepth}-bit → ${this.requestedFormat.bitDepth}-bit`);
    }
    
    // Step 7: Encode to target encoding if needed (FROM PCM)
    if (this.conversionSteps.includes('encode_encoding')) {
      const encoded = this.encodingConverter.encodeFromPcm(currentData, this.requestedFormat.encoding);
      currentData = encoded instanceof ArrayBuffer ? encoded : encoded.buffer;
      currentFormat.encoding = this.requestedFormat.encoding;
      console.log(`🔄 AudioFormatConverter: Encoded PCM → ${this.requestedFormat.encoding.toUpperCase()}`);
    }
    
    // Step 8: Wrap in WAV container if needed
    if (this.conversionSteps.includes('wrap_wav')) {
      currentData = ContainerConverter.wrapPcmInWav(currentData, currentFormat);
      currentFormat.container = 'wav';
      console.log('🔄 AudioFormatConverter: Wrapped in WAV container');
    }
    
    console.log('✅ AudioFormatConverter: Conversion complete');
    return currentData;
  }
}

export default AudioFormatConverter;



