package com.talktopc.sdk.examples;

import com.talktopc.sdk.VoiceSDK;
import com.talktopc.sdk.exception.TtsException;
import com.talktopc.sdk.models.TTSRequest;
import com.talktopc.sdk.models.TTSResponse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * Example usage of TalkToPC TTS SDK
 */
public class TtsExamples {
    
    public static void main(String[] args) {
        // Get API key from environment
        String apiKey = System.getenv("TALKTOPC_API_KEY");
        if (apiKey == null) {
            System.err.println("Please set TALKTOPC_API_KEY environment variable");
            System.exit(1);
        }
        
        // Initialize SDK
        VoiceSDK sdk = VoiceSDK.builder()
            .apiKey(apiKey)
            .baseUrl("https://api.talktopc.com")  // Optional
            .build();
        
        // Run examples
        example1_SimpleTts(sdk);
        example2_TtsWithSpeed(sdk);
        example3_TtsWithMetadata(sdk);
        example4_StreamingTts(sdk);
        example5_StreamingWithCallbacks(sdk);
        example6_ErrorHandling(sdk);
        example7_AudioFormats(sdk);  // ✅ NEW: Audio format examples
    }
    
    /**
     * Example 1: Simple TTS (complete audio file)
     */
    private static void example1_SimpleTts(VoiceSDK sdk) {
        System.out.println("\n=== Example 1: Simple TTS ===");
        
        try {
            byte[] audio = sdk.textToSpeech("Hello world", "mamre");
            System.out.println("✅ Generated " + audio.length + " bytes of audio");
            
            // Save to file
            Files.write(Paths.get("output1.wav"), audio);
            System.out.println("✅ Saved to output1.wav");
            
        } catch (TtsException | IOException e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * Example 2: TTS with speed control
     */
    private static void example2_TtsWithSpeed(VoiceSDK sdk) {
        System.out.println("\n=== Example 2: TTS with Speed Control ===");
        
        try {
            // Faster speech
            byte[] fastAudio = sdk.textToSpeech("This is fast speech", "mamre", 1.5);
            Files.write(Paths.get("output2_fast.wav"), fastAudio);
            System.out.println("✅ Fast audio: " + fastAudio.length + " bytes");
            
            // Slower speech
            byte[] slowAudio = sdk.textToSpeech("This is slow speech", "mamre", 0.8);
            Files.write(Paths.get("output2_slow.wav"), slowAudio);
            System.out.println("✅ Slow audio: " + slowAudio.length + " bytes");
            
        } catch (TtsException | IOException e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * Example 3: TTS with full metadata and audio format
     */
    private static void example3_TtsWithMetadata(VoiceSDK sdk) {
        System.out.println("\n=== Example 3: TTS with Metadata and Format ===");
        
        try {
            TTSRequest request = TTSRequest.builder()
                .text("This request returns full metadata with custom format")
                .voiceId("mamre")
                .speed(1.0)
                .standardQuality()  // ✅ NEW: Use standard quality preset
                .build();
            
            TTSResponse response = sdk.synthesize(request);
            
            System.out.println("✅ Response metadata:");
            System.out.println("   Sample rate: " + response.getSampleRate() + " Hz");
            System.out.println("   Duration: " + response.getDurationMs() + " ms");
            System.out.println("   Audio size: " + response.getAudioSizeBytes() + " bytes");
            System.out.println("   Credits used: " + response.getCreditsUsed());
            System.out.println("   Conversation ID: " + response.getConversationId());
            
            Files.write(Paths.get("output3.wav"), response.getAudio());
            System.out.println("✅ Saved to output3.wav");
            
        } catch (TtsException | IOException e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * Example 4: Streaming TTS (real-time chunks)
     */
    private static void example4_StreamingTts(VoiceSDK sdk) {
        System.out.println("\n=== Example 4: Streaming TTS ===");
        
        try {
            System.out.println("🔊 Streaming audio chunks...");
            
            sdk.textToSpeechStream(
                "This is a longer text that will be streamed in real-time chunks",
                "mamre",
                audioChunk -> {
                    // Process each chunk as it arrives
                    System.out.println("   📦 Received chunk: " + audioChunk.length + " bytes");
                    
                    // In real app: send to phone system, play audio, etc.
                    // phoneSystem.playAudio(audioChunk);
                }
            );
            
            System.out.println("✅ Streaming completed");
            
        } catch (TtsException e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * Example 5: Streaming with completion callbacks
     */
    private static void example5_StreamingWithCallbacks(VoiceSDK sdk) {
        System.out.println("\n=== Example 5: Streaming with Callbacks ===");
        
        try {
            TTSRequest request = TTSRequest.builder()
                .text("Streaming with completion and error callbacks")
                .voiceId("mamre")
                .speed(1.2)
                .build();
            
            sdk.textToSpeechStream(
                request,
                audioChunk -> {
                    // Handle each chunk
                    System.out.println("   📦 Chunk: " + audioChunk.length + " bytes");
                },
                metadata -> {
                    // Handle completion
                    System.out.println("✅ Stream completed:");
                    System.out.println("   Total chunks: " + metadata.getTotalChunks());
                    System.out.println("   Total bytes: " + metadata.getTotalBytes());
                    System.out.println("   Duration: " + metadata.getDurationMs() + " ms");
                    System.out.println("   Credits: " + metadata.getCreditsUsed());
                },
                error -> {
                    // Handle errors
                    System.err.println("❌ Stream error: " + error.getMessage());
                }
            );
            
        } catch (Exception e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * Example 6: Error handling
     */
    private static void example6_ErrorHandling(VoiceSDK sdk) {
        System.out.println("\n=== Example 6: Error Handling ===");
        
        try {
            // This will fail with invalid voice ID
            byte[] audio = sdk.textToSpeech("Test", "invalid-voice");
            
        } catch (TtsException e) {
            System.out.println("✅ Caught expected error:");
            System.out.println("   Status code: " + e.getStatusCode());
            System.out.println("   Error message: " + e.getErrorMessage());
            
            // Handle specific error codes
            switch (e.getStatusCode()) {
                case 401:
                    System.out.println("   → Invalid API key");
                    break;
                case 402:
                    System.out.println("   → Insufficient credits");
                    break;
                case 400:
                    System.out.println("   → Invalid parameters");
                    break;
                default:
                    System.out.println("   → Other error");
            }
        }
    }
    
    /**
     * Example 7: Audio Format Configuration (NEW!)
     */
    private static void example7_AudioFormats(VoiceSDK sdk) {
        System.out.println("\n=== Example 7: Audio Format Configuration ===");
        
        try {
            // High quality audio (WAV @ 44.1kHz)
            System.out.println("\n📀 High Quality Audio:");
            TTSRequest highQuality = TTSRequest.builder()
                .text("This is high quality audio")
                .voiceId("mamre")
                .highQuality()  // ✅ Preset for high quality
                .build();
            
            byte[] hqAudio = sdk.textToSpeech(highQuality);
            Files.write(Paths.get("output7_high_quality.wav"), hqAudio);
            System.out.println("   ✅ Saved high quality: " + hqAudio.length + " bytes");
            
            // Phone system audio (PCMU @ 8kHz)
            System.out.println("\n📞 Phone System Audio:");
            TTSRequest phoneAudio = TTSRequest.builder()
                .text("This is phone system audio")
                .voiceId("en-US-female")
                .phoneSystem()  // ✅ Preset for phone systems
                .build();
            
            sdk.textToSpeechStream(
                phoneAudio,
                chunk -> {
                    System.out.println("   📦 PCMU chunk: " + chunk.length + " bytes (ready for Twilio/Telnyx)");
                    // phoneConnection.sendAudio(chunk);
                }
            );
            
            // Custom format (16kHz PCM)
            System.out.println("\n🎛️ Custom Format:");
            TTSRequest customFormat = TTSRequest.builder()
                .text("This is custom format audio")
                .voiceId("mamre")
                .outputContainer("raw")
                .outputEncoding("pcm")
                .outputSampleRate(16000)
                .outputBitDepth(16)
                .outputChannels(1)
                .outputFrameDurationMs(100)
                .build();
            
            byte[] customAudio = sdk.textToSpeech(customFormat);
            System.out.println("   ✅ Custom format: " + customAudio.length + " bytes (16kHz PCM)");
            
            System.out.println("\n✅ All audio format examples completed");
            
        } catch (TtsException | IOException e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
    }
}