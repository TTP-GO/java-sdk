# Java Backend SDK Implementation Guide

## Overview

This guide shows how to build a Java backend SDK for TTP Agent WebSocket API, supporting format negotiation (v2 protocol) and audio streaming (including PCMU/PCMA pass-through for phone systems).

## Project Structure

```
ttp-agent-sdk-java/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── talktopc/
│       │           └── sdk/
│       │               ├── VoiceSDK.java              # Main SDK class
│       │               ├── WebSocketClient.java        # WebSocket wrapper
│       │               ├── ProtocolHandler.java       # Protocol v2 handler
│       │               ├── AudioFormat.java           # Format model
│       │               ├── VoiceSDKConfig.java         # Configuration
│       │               └── events/
│       │                   ├── AudioDataEvent.java
│       │                   ├── FormatNegotiatedEvent.java
│       │                   └── MessageEvent.java
│       └── resources/
├── examples/
│   ├── PhoneForwardingExample.java
│   ├── TtsForwardingExample.java
│   └── SimpleChatExample.java
├── pom.xml (or build.gradle)
└── README.md
```

## Dependencies

### Maven (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.talktopc</groupId>
    <artifactId>ttp-agent-sdk-java</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>TTP Agent SDK - Java</name>
    <description>Backend SDK for TTP Agent WebSocket API</description>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- WebSocket Client (Tyrus - Reference Implementation) -->
        <dependency>
            <groupId>org.glassfish.tyrus</groupId>
            <artifactId>tyrus-client</artifactId>
            <version>2.1.3</version>
        </dependency>
        
        <!-- JSON Processing -->
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>
        
        <!-- SLF4J for Logging -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>2.0.9</version>
        </dependency>
        
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-simple</artifactId>
            <version>2.0.9</version>
        </dependency>
        
        <!-- JUnit for Testing -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### Gradle (build.gradle)

```gradle
plugins {
    id 'java'
    id 'maven-publish'
}

group = 'com.talktopc'
version = '1.0.0'
sourceCompatibility = '11'

repositories {
    mavenCentral()
}

dependencies {
    // WebSocket Client
    implementation 'org.glassfish.tyrus:tyrus-client:2.1.3'
    
    // JSON Processing
    implementation 'com.google.code.gson:gson:2.10.1'
    
    // Logging
    implementation 'org.slf4j:slf4j-api:2.0.9'
    implementation 'org.slf4j:slf4j-simple:2.0.9'
    
    // Testing
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
}
```

## Core Implementation

### 1. AudioFormat.java (Model)

```java
package com.talktopc.sdk;

import java.util.Objects;

/**
 * Audio format specification
 */
public class AudioFormat {
    private String container;  // "raw" or "wav"
    private String encoding;  // "pcm", "pcmu", "pcma"
    private int sampleRate;    // Hz
    private int bitDepth;      // bits
    private int channels;      // 1 = mono

    public AudioFormat() {}

    public AudioFormat(String container, String encoding, int sampleRate, 
                      int bitDepth, int channels) {
        this.container = container;
        this.encoding = encoding;
        this.sampleRate = sampleRate;
        this.bitDepth = bitDepth;
        this.channels = channels;
    }

    // Getters and setters
    public String getContainer() { return container; }
    public void setContainer(String container) { this.container = container; }

    public String getEncoding() { return encoding; }
    public void setEncoding(String encoding) { this.encoding = encoding; }

    public int getSampleRate() { return sampleRate; }
    public void setSampleRate(int sampleRate) { this.sampleRate = sampleRate; }

    public int getBitDepth() { return bitDepth; }
    public void setBitDepth(int bitDepth) { this.bitDepth = bitDepth; }

    public int getChannels() { return channels; }
    public void setChannels(int channels) { this.channels = channels; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AudioFormat that = (AudioFormat) o;
        return sampleRate == that.sampleRate &&
               bitDepth == that.bitDepth &&
               channels == that.channels &&
               Objects.equals(container, that.container) &&
               Objects.equals(encoding, that.encoding);
    }

    @Override
    public int hashCode() {
        return Objects.hash(container, encoding, sampleRate, bitDepth, channels);
    }

    @Override
    public String toString() {
        return String.format("AudioFormat{container='%s', encoding='%s', " +
                           "sampleRate=%d, bitDepth=%d, channels=%d}",
                           container, encoding, sampleRate, bitDepth, channels);
    }
}
```

### 2. VoiceSDKConfig.java (Configuration)

```java
package com.talktopc.sdk;

/**
 * Configuration for VoiceSDK
 */
public class VoiceSDKConfig {
    private String websocketUrl;
    private String agentId;
    private String appId;
    
    // Output format (what we want from server)
    private String outputContainer = "raw";
    private String outputEncoding = "pcm";
    private int outputSampleRate = 16000;
    private int outputBitDepth = 16;
    private int outputChannels = 1;
    private int outputFrameDurationMs = 600;
    
    // Input format (what we send to server)
    private String inputEncoding = "pcm";
    private int inputSampleRate = 16000;
    private int inputBitDepth = 16;
    private int inputChannels = 1;
    
    // Protocol version
    private int protocolVersion = 2;
    
    // Auto-reconnect
    private boolean autoReconnect = true;

    // Getters and setters
    public String getWebsocketUrl() { return websocketUrl; }
    public void setWebsocketUrl(String websocketUrl) { 
        this.websocketUrl = websocketUrl; 
    }

    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }

    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }

    public String getOutputContainer() { return outputContainer; }
    public void setOutputContainer(String outputContainer) { 
        this.outputContainer = outputContainer; 
    }

    public String getOutputEncoding() { return outputEncoding; }
    public void setOutputEncoding(String outputEncoding) { 
        this.outputEncoding = outputEncoding; 
    }

    public int getOutputSampleRate() { return outputSampleRate; }
    public void setOutputSampleRate(int outputSampleRate) { 
        this.outputSampleRate = outputSampleRate; 
    }

    public int getOutputBitDepth() { return outputBitDepth; }
    public void setOutputBitDepth(int outputBitDepth) { 
        this.outputBitDepth = outputBitDepth; 
    }

    public int getOutputChannels() { return outputChannels; }
    public void setOutputChannels(int outputChannels) { 
        this.outputChannels = outputChannels; 
    }

    public int getOutputFrameDurationMs() { return outputFrameDurationMs; }
    public void setOutputFrameDurationMs(int outputFrameDurationMs) { 
        this.outputFrameDurationMs = outputFrameDurationMs; 
    }

    public String getInputEncoding() { return inputEncoding; }
    public void setInputEncoding(String inputEncoding) { 
        this.inputEncoding = inputEncoding; 
    }

    public int getInputSampleRate() { return inputSampleRate; }
    public void setInputSampleRate(int inputSampleRate) { 
        this.inputSampleRate = inputSampleRate; 
    }

    public int getInputBitDepth() { return inputBitDepth; }
    public void setInputBitDepth(int inputBitDepth) { 
        this.inputBitDepth = inputBitDepth; 
    }

    public int getInputChannels() { return inputChannels; }
    public void setInputChannels(int inputChannels) { 
        this.inputChannels = inputChannels; 
    }

    public int getProtocolVersion() { return protocolVersion; }
    public void setProtocolVersion(int protocolVersion) { 
        this.protocolVersion = protocolVersion; 
    }

    public boolean isAutoReconnect() { return autoReconnect; }
    public void setAutoReconnect(boolean autoReconnect) { 
        this.autoReconnect = autoReconnect; 
    }
}
```

### 3. VoiceSDK.java (Main SDK Class)

```java
package com.talktopc.sdk;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.websocket.*;
import java.io.IOException;
import java.net.URI;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

/**
 * VoiceSDK - Backend SDK for TTP Agent WebSocket API
 * 
 * Key Features:
 * - Format negotiation (v2 protocol)
 * - Audio streaming with pass-through (no decoding)
 * - Support for PCMU/PCMA for phone systems
 */
@ClientEndpoint
public class VoiceSDK {
    private static final Logger logger = LoggerFactory.getLogger(VoiceSDK.class);
    private static final Gson gson = new Gson();

    private final VoiceSDKConfig config;
    private Session session;
    private AudioFormat negotiatedOutputFormat;
    private boolean isConnected = false;

    // Event listeners
    private final List<Consumer<byte[]>> audioDataListeners = new CopyOnWriteArrayList<>();
    private final List<Consumer<AudioFormat>> formatNegotiatedListeners = new CopyOnWriteArrayList<>();
    private final List<Consumer<JsonObject>> messageListeners = new CopyOnWriteArrayList<>();
    private final List<Runnable> connectedListeners = new CopyOnWriteArrayList<>();
    private final List<Runnable> disconnectedListeners = new CopyOnWriteArrayList<>();
    private final List<Consumer<Throwable>> errorListeners = new CopyOnWriteArrayList<>();

    public VoiceSDK(VoiceSDKConfig config) {
        this.config = config;
    }

    /**
     * Connect to WebSocket server
     */
    public CompletableFuture<Void> connect() {
        CompletableFuture<Void> future = new CompletableFuture<>();

        try {
            WebSocketContainer container = ContainerProvider.getWebSocketContainer();
            URI uri = URI.create(config.getWebsocketUrl());
            
            logger.info("Connecting to: {}", uri);
            
            container.connectToServer(this, uri);
            
            // Connection will be confirmed in @OnOpen
            // Future will be completed there
            
        } catch (Exception e) {
            logger.error("Failed to connect", e);
            future.completeExceptionally(e);
            notifyError(e);
        }

        return future;
    }

    @OnOpen
    public void onOpen(Session session) {
        logger.info("WebSocket connected");
        this.session = session;
        this.isConnected = true;
        
        // Send hello message with format negotiation
        sendHelloMessage();
        
        // Notify listeners
        connectedListeners.forEach(Runnable::run);
    }

    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        logger.info("WebSocket closed: {} - {}", closeReason.getCloseCode(), closeReason.getReasonPhrase());
        this.isConnected = false;
        this.session = null;
        
        // Notify listeners
        disconnectedListeners.forEach(Runnable::run);
        
        // Auto-reconnect if enabled
        if (config.isAutoReconnect() && closeReason.getCloseCode() != CloseReason.CloseCodes.NORMAL_CLOSURE) {
            logger.info("Auto-reconnecting in 3 seconds...");
            new Thread(() -> {
                try {
                    Thread.sleep(3000);
                    connect();
                } catch (Exception e) {
                    logger.error("Auto-reconnect failed", e);
                }
            }).start();
        }
    }

    @OnError
    public void onError(Session session, Throwable error) {
        logger.error("WebSocket error", error);
        notifyError(error);
    }

    @OnMessage
    public void onMessage(String message) {
        // Text message (JSON)
        try {
            JsonObject json = gson.fromJson(message, JsonObject.class);
            String type = json.get("t").getAsString();
            
            logger.debug("Received message: {}", type);
            
            if ("hello_ack".equals(type)) {
                handleHelloAck(json);
            }
            
            // Notify message listeners
            messageListeners.forEach(listener -> listener.accept(json));
            
        } catch (Exception e) {
            logger.error("Error parsing message", e);
            notifyError(e);
        }
    }

    @OnMessage
    public void onMessage(ByteBuffer buffer) {
        // Binary message (audio data)
        byte[] audioData = new byte[buffer.remaining()];
        buffer.get(audioData);
        
        logger.debug("Received audio: {} bytes, format: {}", 
                    audioData.length, negotiatedOutputFormat);
        
        // ✅ KEY: Pass through raw audio (NO decoding!)
        // Frontend SDK would decode PCMU/PCMA here, but backend doesn't
        notifyAudioData(audioData);
    }

    /**
     * Send hello message with format negotiation
     */
    private void sendHelloMessage() {
        JsonObject hello = new JsonObject();
        hello.addProperty("t", "hello");
        hello.addProperty("v", config.getProtocolVersion());
        
        // Input format
        JsonObject inputFormat = new JsonObject();
        inputFormat.addProperty("encoding", config.getInputEncoding());
        inputFormat.addProperty("sampleRate", config.getInputSampleRate());
        inputFormat.addProperty("channels", config.getInputChannels());
        inputFormat.addProperty("bitDepth", config.getInputBitDepth());
        hello.add("inputFormat", inputFormat);
        
        // Requested output format
        JsonObject requestedOutputFormat = new JsonObject();
        requestedOutputFormat.addProperty("encoding", config.getOutputEncoding());
        requestedOutputFormat.addProperty("sampleRate", config.getOutputSampleRate());
        requestedOutputFormat.addProperty("channels", config.getOutputChannels());
        requestedOutputFormat.addProperty("bitDepth", config.getOutputBitDepth());
        requestedOutputFormat.addProperty("container", config.getOutputContainer());
        hello.add("requestedOutputFormat", requestedOutputFormat);
        
        hello.addProperty("outputFrameDurationMs", config.getOutputFrameDurationMs());
        
        sendMessage(hello.toString());
        
        logger.info("Sent hello message: {}", hello);
    }

    /**
     * Handle hello_ack message
     */
    private void handleHelloAck(JsonObject message) {
        if (message.has("outputAudioFormat")) {
            JsonObject formatJson = message.getAsJsonObject("outputAudioFormat");
            
            negotiatedOutputFormat = new AudioFormat(
                formatJson.get("container").getAsString(),
                formatJson.get("encoding").getAsString(),
                formatJson.get("sampleRate").getAsInt(),
                formatJson.get("bitDepth").getAsInt(),
                formatJson.get("channels").getAsInt()
            );
            
            logger.info("Format negotiated: {}", negotiatedOutputFormat);
            
            // Notify listeners
            formatNegotiatedListeners.forEach(listener -> 
                listener.accept(negotiatedOutputFormat));
        }
    }

    /**
     * Send audio data to server
     */
    public void sendAudio(byte[] audioData) {
        if (!isConnected || session == null) {
            logger.warn("Cannot send audio - not connected");
            return;
        }
        
        try {
            session.getBasicRemote().sendBinary(ByteBuffer.wrap(audioData));
        } catch (IOException e) {
            logger.error("Error sending audio", e);
            notifyError(e);
        }
    }

    /**
     * Send text message to server
     */
    public void sendMessage(String message) {
        if (!isConnected || session == null) {
            logger.warn("Cannot send message - not connected");
            return;
        }
        
        try {
            session.getBasicRemote().sendText(message);
        } catch (IOException e) {
            logger.error("Error sending message", e);
            notifyError(e);
        }
    }

    /**
     * Send JSON message to server
     */
    public void sendMessage(JsonObject message) {
        sendMessage(gson.toJson(message));
    }

    /**
     * Disconnect from server
     */
    public void disconnect() {
        if (session != null) {
            try {
                session.close();
            } catch (IOException e) {
                logger.error("Error closing session", e);
            }
        }
    }

    // Event listener registration

    /**
     * Listen for audio data (raw PCMU/PCMA bytes, NOT decoded!)
     */
    public void onAudioData(Consumer<byte[]> listener) {
        audioDataListeners.add(listener);
    }

    /**
     * Listen for audio data with format info
     */
    public void onAudioDataWithFormat(AudioDataWithFormatListener listener) {
        audioDataListeners.add(data -> {
            listener.onAudioData(data, negotiatedOutputFormat);
        });
    }

    /**
     * Listen for format negotiation
     */
    public void onFormatNegotiated(Consumer<AudioFormat> listener) {
        formatNegotiatedListeners.add(listener);
    }

    /**
     * Listen for text messages
     */
    public void onMessage(Consumer<JsonObject> listener) {
        messageListeners.add(listener);
    }

    /**
     * Listen for connection events
     */
    public void onConnected(Runnable listener) {
        connectedListeners.add(listener);
    }

    /**
     * Listen for disconnection events
     */
    public void onDisconnected(Runnable listener) {
        disconnectedListeners.add(listener);
    }

    /**
     * Listen for errors
     */
    public void onError(Consumer<Throwable> listener) {
        errorListeners.add(listener);
    }

    // Private notification methods

    private void notifyAudioData(byte[] audioData) {
        audioDataListeners.forEach(listener -> {
            try {
                listener.accept(audioData);
            } catch (Exception e) {
                logger.error("Error in audio data listener", e);
            }
        });
    }

    private void notifyError(Throwable error) {
        errorListeners.forEach(listener -> {
            try {
                listener.accept(error);
            } catch (Exception e) {
                logger.error("Error in error listener", e);
            }
        });
    }

    // Getters

    public boolean isConnected() {
        return isConnected;
    }

    public AudioFormat getNegotiatedOutputFormat() {
        return negotiatedOutputFormat;
    }

    public VoiceSDKConfig getConfig() {
        return config;
    }
}

// Helper interface for audio data with format
@FunctionalInterface
interface AudioDataWithFormatListener {
    void onAudioData(byte[] audioData, AudioFormat format);
}
```

### 4. Usage Example: Phone System Integration

```java
package com.talktopc.sdk.examples;

import com.talktopc.sdk.VoiceSDK;
import com.talktopc.sdk.VoiceSDKConfig;
import com.talktopc.sdk.AudioFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.CompletableFuture;

/**
 * Example: Forward TTP audio to phone system (PCMU)
 */
public class PhoneForwardingExample {
    private static final Logger logger = LoggerFactory.getLogger(PhoneForwardingExample.class);

    public static void main(String[] args) {
        // Configure SDK for phone system (PCMU, 8kHz)
        VoiceSDKConfig config = new VoiceSDKConfig();
        config.setWebsocketUrl("wss://speech.talktopc.com/ws/conv?agentId=xxx&appId=yyy");
        config.setAgentId("agent_123");
        config.setAppId("your_app_id");
        
        // Request PCMU for phone systems
        config.setOutputContainer("raw");
        config.setOutputEncoding("pcmu");      // ← Phone systems use PCMU
        config.setOutputSampleRate(8000);       // ← Phone standard
        config.setOutputBitDepth(16);
        config.setOutputChannels(1);
        config.setProtocolVersion(2);

        VoiceSDK sdk = new VoiceSDK(config);

        // Listen for format negotiation
        sdk.onFormatNegotiated(format -> {
            logger.info("Format negotiated: {}", format);
            // Should be: AudioFormat{container='raw', encoding='pcmu', sampleRate=8000, ...}
        });

        // ✅ KEY: Listen for raw PCMU audio (NOT decoded!)
        sdk.onAudioDataWithFormat((audioData, format) -> {
            logger.info("Received {} bytes of {} audio", 
                       audioData.length, format.getEncoding());
            
            // Forward directly to phone system (raw PCMU, no conversion!)
            forwardToPhoneSystem(audioData);
        });

        // Listen for messages
        sdk.onMessage(message -> {
            String type = message.get("t").getAsString();
            if ("agent_response".equals(type)) {
                logger.info("Agent: {}", message.get("agent_response"));
            }
        });

        // Connect
        CompletableFuture<Void> connectFuture = sdk.connect();
        connectFuture.thenRun(() -> {
            logger.info("Connected! Ready to forward audio.");
        }).exceptionally(error -> {
            logger.error("Connection failed", error);
            return null;
        });

        // Keep running
        try {
            Thread.sleep(Long.MAX_VALUE);
        } catch (InterruptedException e) {
            logger.info("Shutting down...");
            sdk.disconnect();
        }
    }

    private static void forwardToPhoneSystem(byte[] pcmuAudio) {
        // Your phone system integration here
        // pcmuAudio is raw PCMU bytes, ready to send to phone!
        logger.debug("Forwarding {} bytes to phone system", pcmuAudio.length);
        // phoneSystem.sendAudio(pcmuAudio);
    }
}
```

### 5. Usage Example: Simple Chat

```java
package com.talktopc.sdk.examples;

import com.talktopc.sdk.VoiceSDK;
import com.talktopc.sdk.VoiceSDKConfig;
import com.google.gson.JsonObject;

/**
 * Simple chat example
 */
public class SimpleChatExample {
    public static void main(String[] args) {
        VoiceSDKConfig config = new VoiceSDKConfig();
        config.setWebsocketUrl("wss://speech.talktopc.com/ws/conv?agentId=xxx&appId=yyy");
        config.setOutputEncoding("pcm");  // PCM for general use
        config.setOutputSampleRate(16000);

        VoiceSDK sdk = new VoiceSDK(config);

        sdk.onFormatNegotiated(format -> {
            System.out.println("Format: " + format);
        });

        sdk.onAudioData(audioData -> {
            // Save or process audio
            System.out.println("Received " + audioData.length + " bytes");
        });

        sdk.onMessage(message -> {
            String type = message.get("t").getAsString();
            if ("agent_response".equals(type)) {
                System.out.println("Agent: " + message.get("agent_response"));
            }
        });

        sdk.connect().thenRun(() -> {
            System.out.println("Connected!");
            
            // Send a message
            JsonObject msg = new JsonObject();
            msg.addProperty("t", "user_message");
            msg.addProperty("text", "Hello!");
            sdk.sendMessage(msg);
        });
    }
}
```

## Key Implementation Points

### 1. **NO Audio Decoding**
```java
@OnMessage
public void onMessage(ByteBuffer buffer) {
    byte[] audioData = new byte[buffer.remaining()];
    buffer.get(audioData);
    
    // ✅ Pass through raw PCMU/PCMA (NO decoding!)
    // Frontend SDK would decode here, but backend doesn't
    notifyAudioData(audioData);
}
```

### 2. **Format Negotiation**
- Same protocol as frontend SDK
- Request PCMU/PCMA in `requestedOutputFormat`
- Server responds with negotiated format in `hello_ack`

### 3. **Event-Driven API**
- Uses Java 8 `Consumer` for callbacks
- Thread-safe listeners (`CopyOnWriteArrayList`)
- Async message handling

### 4. **WebSocket Library**
- Uses **Tyrus** (JSR-356 reference implementation)
- Standard Java WebSocket API
- No external dependencies beyond WebSocket

## Testing

### Unit Test Example

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class VoiceSDKTest {
    @Test
    public void testFormatNegotiation() {
        VoiceSDKConfig config = new VoiceSDKConfig();
        config.setOutputEncoding("pcmu");
        config.setOutputSampleRate(8000);
        
        VoiceSDK sdk = new VoiceSDK(config);
        
        AudioFormat[] negotiated = new AudioFormat[1];
        sdk.onFormatNegotiated(format -> {
            negotiated[0] = format;
        });
        
        // Simulate hello_ack
        // ... test format negotiation
        
        assertNotNull(negotiated[0]);
        assertEquals("pcmu", negotiated[0].getEncoding());
    }
}
```

## Publishing to Maven Central

### 1. Add Maven Central Configuration

```xml
<distributionManagement>
    <repository>
        <id>central</id>
        <name>Maven Central</name>
        <url>https://oss.sonatype.org/service/local/staging/deploy/maven2/</url>
    </repository>
</distributionManagement>
```

### 2. Add GPG Signing

```xml
<plugins>
    <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-gpg-plugin</artifactId>
        <version>3.0.1</version>
        <executions>
            <execution>
                <id>sign-artifacts</id>
                <phase>verify</phase>
                <goals>
                    <goal>sign</goal>
                </goals>
            </execution>
        </executions>
    </plugin>
</plugins>
```

### 3. Deploy

```bash
mvn clean deploy
```

## Usage in Projects

### Maven Dependency

```xml
<dependency>
    <groupId>com.talktopc</groupId>
    <artifactId>ttp-agent-sdk-java</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Gradle Dependency

```gradle
dependencies {
    implementation 'com.talktopc:ttp-agent-sdk-java:1.0.0'
}
```

## Comparison: Frontend vs Backend SDK

| Feature | Frontend SDK (JS) | Backend SDK (Java) |
|---------|------------------|-------------------|
| **Runtime** | Browser | JVM (any Java app) |
| **WebSocket** | Native WebSocket API | Tyrus (JSR-356) |
| **Audio Decoding** | ✅ Decodes PCMU→PCM | ❌ Pass-through only |
| **Audio Playback** | Browser AudioContext | N/A (user handles) |
| **PCMU/PCMA** | Decoded for browser | **Raw bytes** for phone |
| **Use Case** | Browser voice chat | Phone systems, backend TTS |

## Summary

**Java Backend SDK = Same Protocol + No Browser Dependencies**

- ✅ Same WebSocket protocol (v2 format negotiation)
- ✅ Same message structure (hello, hello_ack, binary)
- ✅ **NO audio decoding** (pass-through PCMU/PCMA)
- ✅ **NO browser APIs** (pure Java WebSocket)
- ✅ Event-driven API (Java 8+)
- ✅ Thread-safe listeners
- ✅ Maven/Gradle ready

This allows Java backend users to:
- Connect to TTP WebSocket API
- Request PCMU/PCMA for phone systems
- Forward raw audio without conversion
- Use in Spring Boot, Quarkus, or any Java application

