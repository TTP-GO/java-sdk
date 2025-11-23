package com.talktopc.sdk.examples;

import com.talktopc.sdk.VoiceSDK;
import com.talktopc.sdk.models.TTSRequest;

/**
 * Examples of TTS SDK with Phone System Integration
 * 
 * Demonstrates audio format configuration for different phone systems
 */
public class PhoneSystemExamples {
    
    public static void main(String[] args) {
        String apiKey = System.getenv("TALKTOPC_API_KEY");
        if (apiKey == null) {
            System.err.println("Please set TALKTOPC_API_KEY environment variable");
            System.exit(1);
        }
        
        VoiceSDK sdk = VoiceSDK.builder()
            .apiKey(apiKey)
            .build();
        
        // Run examples
        example1_StandardPhoneSystem(sdk);
        example2_TwilioIntegration(sdk);
        example3_TelnyxIntegration(sdk);
        example4_CustomFormat(sdk);
        example5_HighQualityAudio(sdk);
    }
    
    /**
     * Example 1: Standard Phone System (PCMU @ 8kHz)
     * Most common format for VoIP/telephony
     */
    private static void example1_StandardPhoneSystem(VoiceSDK sdk) {
        System.out.println("\n=== Example 1: Standard Phone System ===");
        
        // Using convenient phoneSystem() preset
        TTSRequest request = TTSRequest.builder()
            .text("Hello, thank you for calling. How can I help you today?")
            .voiceId("en-US-female")
            .phoneSystem()  // ✅ PCMU @ 8kHz, 20ms frames
            .build();
        
        System.out.println("📞 Streaming to phone system...");
        sdk.textToSpeechStream(
            request,
            audioChunk -> {
                // audioChunk is PCMU @ 8kHz, 20ms frames (160 bytes)
                // Ready to send directly to phone connection
                System.out.println("   📦 PCMU chunk: " + audioChunk.length + " bytes");
                // phoneConnection.sendAudio(audioChunk);
            }
        );
        System.out.println("✅ Phone call audio completed");
    }
    
    /**
     * Example 2: Twilio Integration
     * Twilio expects μ-law @ 8kHz
     */
    private static void example2_TwilioIntegration(VoiceSDK sdk) {
        System.out.println("\n=== Example 2: Twilio Integration ===");
        
        TTSRequest request = TTSRequest.builder()
            .text("Your appointment is confirmed for tomorrow at 3 PM")
            .voiceId("en-US-male")
            .outputContainer("raw")
            .outputEncoding("pcmu")      // μ-law for Twilio
            .outputSampleRate(8000)       // 8kHz
            .outputBitDepth(16)
            .outputChannels(1)            // Mono
            .outputFrameDurationMs(20)    // 20ms frames
            .build();
        
        System.out.println("📞 Twilio call audio...");
        sdk.textToSpeechStream(
            request,
            audioChunk -> {
                // Send to Twilio Media Stream
                // twilioStream.sendMedia(audioChunk);
                System.out.println("   → Twilio: " + audioChunk.length + " bytes");
            }
        );
    }
    
    /**
     * Example 3: Telnyx Integration
     * Similar to Twilio - μ-law @ 8kHz
     */
    private static void example3_TelnyxIntegration(VoiceSDK sdk) {
        System.out.println("\n=== Example 3: Telnyx Integration ===");
        
        TTSRequest request = TTSRequest.builder()
            .text("Press 1 for sales, press 2 for support")
            .voiceId("en-US-female")
            .phoneSystem()  // Same as Twilio
            .build();
        
        System.out.println("📞 Telnyx call audio...");
        sdk.textToSpeechStream(
            request,
            audioChunk -> {
                // Send to Telnyx Media Stream
                // telnyxStream.sendMedia(audioChunk);
                System.out.println("   → Telnyx: " + audioChunk.length + " bytes");
            }
        );
    }
    
    /**
     * Example 4: Custom Audio Format
     * Configure exactly what you need
     */
    private static void example4_CustomFormat(VoiceSDK sdk) {
        System.out.println("\n=== Example 4: Custom Audio Format ===");
        
        TTSRequest request = TTSRequest.builder()
            .text("Custom format example")
            .voiceId("mamre")
            // Custom configuration
            .outputContainer("raw")
            .outputEncoding("pcm")
            .outputSampleRate(16000)      // 16kHz
            .outputBitDepth(16)           // 16-bit
            .outputChannels(1)            // Mono
            .outputFrameDurationMs(100)   // 100ms frames
            .build();
        
        System.out.println("🎵 Custom format (16kHz PCM, 100ms frames)...");
        sdk.textToSpeechStream(
            request,
            audioChunk -> {
                // Expected chunk size: 16000 Hz * 0.1 sec * 2 bytes = 3200 bytes
                System.out.println("   📦 Chunk: " + audioChunk.length + " bytes");
            }
        );
    }
    
    /**
     * Example 5: High Quality Audio File
     * WAV format @ 44.1kHz for high-quality recording
     */
    private static void example5_HighQualityAudio(VoiceSDK sdk) {
        System.out.println("\n=== Example 5: High Quality Audio ===");
        
        TTSRequest request = TTSRequest.builder()
            .text("This is a high quality recording")
            .voiceId("mamre")
            .highQuality()  // WAV @ 44.1kHz
            .build();
        
        // Get complete audio file
        byte[] audio = sdk.textToSpeech(request);
        
        System.out.println("✅ High quality WAV: " + audio.length + " bytes");
        System.out.println("   Format: 44.1kHz, 16-bit, WAV");
        
        // Save to file
        try {
            java.nio.file.Files.write(
                java.nio.file.Paths.get("high_quality.wav"),
                audio
            );
            System.out.println("✅ Saved to high_quality.wav");
        } catch (Exception e) {
            System.err.println("❌ Error saving file: " + e.getMessage());
        }
    }
}

