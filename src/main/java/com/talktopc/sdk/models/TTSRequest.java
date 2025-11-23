package com.talktopc.sdk.models;

/**
 * TTS Request Configuration with Audio Format Negotiation
 */
public class TTSRequest {
    private final String text;
    private final String voiceId;
    private final Double speed;
    
    // Output format configuration (what we want from server)
    private final String outputContainer;
    private final String outputEncoding;
    private final Integer outputSampleRate;
    private final Integer outputBitDepth;
    private final Integer outputChannels;
    private final Integer outputFrameDurationMs;
    
    private TTSRequest(Builder builder) {
        this.text = builder.text;
        this.voiceId = builder.voiceId;
        this.speed = builder.speed;
        this.outputContainer = builder.outputContainer;
        this.outputEncoding = builder.outputEncoding;
        this.outputSampleRate = builder.outputSampleRate;
        this.outputBitDepth = builder.outputBitDepth;
        this.outputChannels = builder.outputChannels;
        this.outputFrameDurationMs = builder.outputFrameDurationMs;
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public String getText() {
        return text;
    }
    
    public String getVoiceId() {
        return voiceId;
    }
    
    public Double getSpeed() {
        return speed;
    }
    
    public String getOutputContainer() {
        return outputContainer;
    }
    
    public String getOutputEncoding() {
        return outputEncoding;
    }
    
    public Integer getOutputSampleRate() {
        return outputSampleRate;
    }
    
    public Integer getOutputBitDepth() {
        return outputBitDepth;
    }
    
    public Integer getOutputChannels() {
        return outputChannels;
    }
    
    public Integer getOutputFrameDurationMs() {
        return outputFrameDurationMs;
    }
    
    public static class Builder {
        private String text;
        private String voiceId;
        private Double speed = 1.0;
        
        // Default output format (16kHz PCM raw)
        private String outputContainer = "raw";
        private String outputEncoding = "pcm";
        private Integer outputSampleRate = 16000;
        private Integer outputBitDepth = 16;
        private Integer outputChannels = 1;
        private Integer outputFrameDurationMs = 600;
        
        public Builder text(String text) {
            this.text = text;
            return this;
        }
        
        public Builder voiceId(String voiceId) {
            this.voiceId = voiceId;
            return this;
        }
        
        public Builder speed(double speed) {
            this.speed = speed;
            return this;
        }
        
        /**
         * Set output container format
         * @param container "raw" (binary PCM) or "wav" (WAV file)
         */
        public Builder outputContainer(String container) {
            this.outputContainer = container;
            return this;
        }
        
        /**
         * Set output encoding
         * @param encoding "pcm", "pcmu", "pcma"
         */
        public Builder outputEncoding(String encoding) {
            this.outputEncoding = encoding;
            return this;
        }
        
        /**
         * Set output sample rate
         * @param sampleRate Sample rate in Hz (8000, 16000, 22050, 44100, etc.)
         */
        public Builder outputSampleRate(int sampleRate) {
            this.outputSampleRate = sampleRate;
            return this;
        }
        
        /**
         * Set output bit depth
         * @param bitDepth Bit depth (8, 16, 24)
         */
        public Builder outputBitDepth(int bitDepth) {
            this.outputBitDepth = bitDepth;
            return this;
        }
        
        /**
         * Set output channels
         * @param channels 1 (mono) or 2 (stereo)
         */
        public Builder outputChannels(int channels) {
            this.outputChannels = channels;
            return this;
        }
        
        /**
         * Set output frame duration for streaming
         * @param durationMs Frame duration in milliseconds (e.g., 20, 100, 600)
         */
        public Builder outputFrameDurationMs(int durationMs) {
            this.outputFrameDurationMs = durationMs;
            return this;
        }
        
        /**
         * Configure for phone systems (PCMU @ 8kHz)
         * Common format for VoIP/telephony systems
         */
        public Builder phoneSystem() {
            this.outputContainer = "raw";
            this.outputEncoding = "pcmu";
            this.outputSampleRate = 8000;
            this.outputBitDepth = 16;
            this.outputChannels = 1;
            this.outputFrameDurationMs = 20;  // 20ms frames for telephony
            return this;
        }
        
        /**
         * Configure for high-quality audio (PCM @ 44.1kHz)
         */
        public Builder highQuality() {
            this.outputContainer = "wav";
            this.outputEncoding = "pcm";
            this.outputSampleRate = 44100;
            this.outputBitDepth = 16;
            this.outputChannels = 1;
            return this;
        }
        
        /**
         * Configure for standard quality (PCM @ 22.05kHz)
         */
        public Builder standardQuality() {
            this.outputContainer = "raw";
            this.outputEncoding = "pcm";
            this.outputSampleRate = 22050;
            this.outputBitDepth = 16;
            this.outputChannels = 1;
            return this;
        }
        
        public TTSRequest build() {
            if (text == null || text.trim().isEmpty()) {
                throw new IllegalArgumentException("Text is required");
            }
            if (voiceId == null || voiceId.trim().isEmpty()) {
                throw new IllegalArgumentException("Voice ID is required");
            }
            if (speed != null && (speed < 0.1 || speed > 3.0)) {
                throw new IllegalArgumentException("Speed must be between 0.1 and 3.0");
            }
            if(outputContainer == null || outputContainer.trim().isEmpty()) {
                this.outputContainer = "raw";
            }  
            return new TTSRequest(this);
        }
    }
}