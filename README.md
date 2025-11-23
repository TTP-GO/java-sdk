# TalkToPC Voice SDK - Java

Simple Java SDK for converting text to speech using TalkToPC's TTS API.

## Features

- ✅ **Simple TTS** - Convert text to complete audio file
- ✅ **Streaming TTS** - Receive audio chunks in real-time
- ✅ **Multiple Voices** - Support for all TalkToPC voices
- ✅ **Voice Speed Control** - Adjust playback speed
- ✅ **Zero Dependencies** - Uses Java 11+ HttpClient (no external libs)
- ✅ **Phone System Ready** - Perfect for PCMU/PCMA phone integration

## Installation

### Maven

```xml
<repositories>
    <repository>
        <id>github</id>
        <url>https://maven.pkg.github.com/TTP-GO/talktopc-voice-sdk</url>
    </repository>
</repositories>

<dependencies>
    <dependency>
        <groupId>com.talktopc</groupId>
        <artifactId>talktopc-voice-sdk</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>
```

### Gradle

```groovy
repositories {
    maven {
        url = uri("https://maven.pkg.github.com/TTP-GO/talktopc-voice-sdk")
        credentials {
            username = project.findProperty("gpr.user") ?: System.getenv("USERNAME")
            password = project.findProperty("gpr.key") ?: System.getenv("TOKEN")
        }
    }
}

dependencies {
    implementation 'com.talktopc:talktopc-voice-sdk:1.0.0'
}
```

## Quick Start

### 1. Initialize SDK

```java
import com.talktopc.sdk.VoiceSDK;

VoiceSDK sdk = VoiceSDK.builder()
    .apiKey("your-api-key-here")
    .baseUrl("https://api.talktopc.com")  // Optional
    .build();
```

### 2. Simple TTS (Blocking)

```java
// Generate complete audio file
byte[] audio = sdk.textToSpeech("Hello world", "mamre");

// Save to file
Files.write(Paths.get("output.wav"), audio);

// Or play immediately
phoneSystem.playAudio(audio);
```

### 3. Streaming TTS (Real-time)

```java
// Stream audio chunks as they're generated
sdk.textToSpeechStream(
    "Hello world, this is a longer text that will be streamed",
    "mamre",
    audioChunk -> {
        // Receive chunks in real-time
        phoneSystem.playAudio(audioChunk);
    }
);
```

## Examples

### Basic Usage

```java
VoiceSDK sdk = VoiceSDK.builder()
    .apiKey(System.getenv("TALKTOPC_API_KEY"))
    .build();

// Simple TTS
byte[] audio = sdk.textToSpeech("Welcome to TalkToPC", "mamre");
System.out.println("Generated " + audio.length + " bytes of audio");
```

### With Speed Control

```java
// Faster speech (1.5x speed)
byte[] fastAudio = sdk.textToSpeech("Quick message", "mamre", 1.5);

// Slower speech (0.8x speed)
byte[] slowAudio = sdk.textToSpeech("Slow and clear", "mamre", 0.8);
```

### Streaming with Metadata

```java
sdk.textToSpeechStream(
    TTSRequest.builder()
        .text("Streaming example with full configuration")
        .voiceId("mamre")
        .speed(1.0)
        .build(),
    audioChunk -> {
        // Handle each audio chunk
        System.out.println("Received chunk: " + audioChunk.length + " bytes");
        phoneSystem.playAudio(audioChunk);
    },
    metadata -> {
        // Handle completion
        System.out.println("Stream completed: " + metadata);
        System.out.println("Total chunks: " + metadata.getTotalChunks());
        System.out.println("Credits used: " + metadata.getCreditsUsed());
    },
    error -> {
        // Handle errors
        System.err.println("Stream error: " + error.getMessage());
    }
);
```

### Phone System Integration

```java
// For phone systems (PCMU @ 8kHz)
VoiceSDK sdk = VoiceSDK.builder()
    .apiKey(apiKey)
    .build();

// Stream to phone system
sdk.textToSpeechStream(
    "Hello caller, how can I help you today?",
    "en-US-female",  // Use appropriate voice
    audioChunk -> {
        // Convert to PCMU if needed and send to phone
        byte[] pcmuAudio = convertToPCMU(audioChunk);
        phoneConnection.sendAudio(pcmuAudio);
    }
);
```

### Error Handling

```java
import com.talktopc.sdk.exception.TtsException;

try {
    byte[] audio = sdk.textToSpeech("Test", "mamre");
} catch (TtsException e) {
    System.err.println("TTS Error [" + e.getStatusCode() + "]: " + e.getErrorMessage());
    
    if (e.getStatusCode() == 401) {
        System.err.println("Invalid API key");
    } else if (e.getStatusCode() == 402) {
        System.err.println("Insufficient credits");
    }
}
```

### Full Configuration

```java
import com.talktopc.sdk.models.TTSRequest;
import com.talktopc.sdk.models.TTSResponse;

// Build request with all options
TTSRequest request = TTSRequest.builder()
    .text("Full configuration example")
    .voiceId("mamre")
    .speed(1.2)
    .build();

// Get response with metadata
TTSResponse response = sdk.synthesize(request);

System.out.println("Audio: " + response.getAudioSizeBytes() + " bytes");
System.out.println("Sample rate: " + response.getSampleRate() + " Hz");
System.out.println("Duration: " + response.getDurationMs() + " ms");
System.out.println("Credits: " + response.getCreditsUsed());

// Save audio
Files.write(Paths.get("output.wav"), response.getAudio());
```

## API Reference

### VoiceSDK

Main SDK entry point.

**Builder Methods:**
- `apiKey(String)` - Your TalkToPC API key (required)
- `baseUrl(String)` - API base URL (default: https://api.talktopc.com)
- `connectTimeout(int)` - Connection timeout in ms (default: 30000)
- `readTimeout(int)` - Read timeout in ms (default: 60000)

**Methods:**
- `textToSpeech(String text, String voiceId)` - Simple TTS (blocking)
- `textToSpeech(String text, String voiceId, double speed)` - TTS with speed
- `textToSpeech(TTSRequest)` - TTS with full configuration
- `synthesize(TTSRequest)` - Get full response with metadata
- `textToSpeechStream(...)` - Streaming TTS (multiple overloads)

### TTSRequest

Request configuration builder.

```java
TTSRequest request = TTSRequest.builder()
    .text("Hello")              // Required
    .voiceId("mamre")           // Required
    .speed(1.0)                 // Optional (0.1 - 3.0)
    .format("raw")              // Optional ("raw" or "base64")
    .build();
```

### TTSResponse

Response with audio and metadata.

**Fields:**
- `byte[] getAudio()` - Audio data
- `int getSampleRate()` - Sample rate (Hz)
- `long getDurationMs()` - Playback duration
- `long getAudioSizeBytes()` - Audio size
- `double getCreditsUsed()` - Credits consumed
- `String getConversationId()` - Unique conversation ID

## Available Voices

See [TalkToPC Documentation](https://docs.talktopc.com/voices) for the complete list of available voices.

Common voices:
- `mamre` - High quality voice (44100 Hz)
- `en-US-female` - English female voice
- `en-US-male` - English male voice

## Error Handling

The SDK throws `TtsException` for all errors:

- **401 Unauthorized** - Invalid API key
- **402 Payment Required** - Insufficient credits
- **400 Bad Request** - Invalid parameters
- **500 Internal Server Error** - Server error

## Requirements

- Java 11 or higher
- Valid TalkToPC API key

## License

Proprietary - For use with TalkToPC applications only.

## Support

- Documentation: https://docs.talktopc.com
- Issues: https://github.com/TTP-GO/talktopc-voice-sdk/issues
- Email: support@talktopc.com