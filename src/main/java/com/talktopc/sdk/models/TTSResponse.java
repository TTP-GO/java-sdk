package com.talktopc.sdk.models;

/**
 * TTS Response with audio and metadata
 */
public class TTSResponse {
    private final byte[] audio;
    private final int sampleRate;
    private final long durationMs;
    private final long audioSizeBytes;
    private final double creditsUsed;
    private final String conversationId;
    
    public TTSResponse(byte[] audio, int sampleRate, long durationMs, 
                      long audioSizeBytes, double creditsUsed, String conversationId) {
        this.audio = audio;
        this.sampleRate = sampleRate;
        this.durationMs = durationMs;
        this.audioSizeBytes = audioSizeBytes;
        this.creditsUsed = creditsUsed;
        this.conversationId = conversationId;
    }
    
    public byte[] getAudio() {
        return audio;
    }
    
    public int getSampleRate() {
        return sampleRate;
    }
    
    public long getDurationMs() {
        return durationMs;
    }
    
    public long getAudioSizeBytes() {
        return audioSizeBytes;
    }
    
    public double getCreditsUsed() {
        return creditsUsed;
    }
    
    public String getConversationId() {
        return conversationId;
    }
    
    @Override
    public String toString() {
        return String.format("TTSResponse{sampleRate=%d, duration=%dms, size=%d bytes, credits=%.2f}",
            sampleRate, durationMs, audioSizeBytes, creditsUsed);
    }
}

