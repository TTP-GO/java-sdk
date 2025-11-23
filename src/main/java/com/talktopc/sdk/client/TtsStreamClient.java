package com.talktopc.sdk.client;

import com.talktopc.sdk.VoiceSDK;
import com.talktopc.sdk.config.SDKConfig;
import com.talktopc.sdk.exception.TtsException;
import com.talktopc.sdk.models.TTSRequest;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.function.Consumer;

/**
 * Streaming client for TTS (Server-Sent Events)
 * Calls POST /api/v1/tts/stream
 */
public class TtsStreamClient {
    
    private final SDKConfig config;
    private final HttpClient httpClient;
    
    public TtsStreamClient(SDKConfig config) {
        this.config = config;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(config.getConnectTimeout()))
            .build();
    }
    
    /**
     * Stream TTS audio chunks in real-time
     * 
     * @param request TTS request
     * @param chunkHandler Handler for audio chunks
     */
    public void stream(TTSRequest request, Consumer<byte[]> chunkHandler) {
        stream(request, chunkHandler, null, null);
    }
    
    /**
     * Stream TTS audio chunks with completion and error handlers
     * 
     * @param request TTS request
     * @param chunkHandler Handler for audio chunks
     * @param onComplete Completion handler (receives metadata)
     * @param onError Error handler
     */
    public void stream(
            TTSRequest request,
            Consumer<byte[]> chunkHandler,
            Consumer<VoiceSDK.StreamMetadata> onComplete,
            Consumer<Throwable> onError) {
        
        try {
            // Build JSON request body
            String jsonBody = buildJsonRequest(request);
            
            // Build HTTP request
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(config.getBaseUrl() + "/api/v1/tts/stream"))
                .header("Authorization", config.getAuthHeader())
                .header("Content-Type", "application/json")
                .header("Accept", "text/event-stream")
                .timeout(Duration.ofMillis(config.getReadTimeout()))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
            
            // Send request and process SSE stream
            HttpResponse<java.io.InputStream> response = httpClient.send(httpRequest,
                HttpResponse.BodyHandlers.ofInputStream());
            
            if (response.statusCode() != 200) {
                String errorBody = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
                TtsException exception = parseErrorResponse(response.statusCode(), errorBody);
                if (onError != null) {
                    onError.accept(exception);
                } else {
                    throw exception;
                }
                return;
            }
            
            // Process SSE stream
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
                
                String line;
                String event = null;
                StringBuilder data = new StringBuilder();
                
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("event:")) {
                        event = line.substring(6).trim();
                    } else if (line.startsWith("data:")) {
                        data.append(line.substring(5).trim());
                    } else if (line.isEmpty() && event != null) {
                        // Process complete SSE message
                        processEvent(event, data.toString(), chunkHandler, onComplete);
                        event = null;
                        data.setLength(0);
                    }
                }
            }
            
        } catch (IOException | InterruptedException e) {
            TtsException exception = new TtsException("TTS streaming failed: " + e.getMessage(), e);
            if (onError != null) {
                onError.accept(exception);
            } else {
                throw exception;
            }
        }
    }
    
    /**
     * Process SSE event
     */
    private void processEvent(
            String event,
            String data,
            Consumer<byte[]> chunkHandler,
            Consumer<VoiceSDK.StreamMetadata> onComplete) {
        
        if ("audio".equals(event)) {
            // Extract and decode audio chunk
            String chunkBase64 = extractJsonString(data, "chunk");
            if (chunkBase64 != null) {
                byte[] audioChunk = Base64.getDecoder().decode(chunkBase64);
                chunkHandler.accept(audioChunk);
            }
            
        } else if ("done".equals(event) && onComplete != null) {
            // Extract metadata
            String conversationId = extractJsonString(data, "conversationId");
            long totalChunks = extractJsonLong(data, "totalChunks");
            long totalBytes = extractJsonLong(data, "totalBytes");
            long durationMs = extractJsonLong(data, "durationMs");
            double creditsUsed = extractJsonDouble(data, "creditsUsed");
            
            VoiceSDK.StreamMetadata metadata = new VoiceSDK.StreamMetadata(
                conversationId, totalChunks, totalBytes, durationMs, creditsUsed);
            onComplete.accept(metadata);
            
        } else if ("error".equals(event)) {
            String errorMsg = extractJsonString(data, "error");
            throw new TtsException("Streaming error: " + errorMsg);
        }
    }
    
    /**
     * Build JSON request body with audio format configuration
     */
    private String buildJsonRequest(TTSRequest request) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"text\":").append(quote(request.getText())).append(",");
        json.append("\"voiceId\":").append(quote(request.getVoiceId()));
        
        if (request.getSpeed() != null && request.getSpeed() != 1.0) {
            json.append(",\"voiceSettings\":{");
            json.append("\"speed\":").append(request.getSpeed());
            json.append("}");
        }
        
        // Add output format configuration
        if (request.getOutputContainer() != null) {
            json.append(",\"outputContainer\":").append(quote(request.getOutputContainer()));
        }
        if (request.getOutputEncoding() != null) {
            json.append(",\"outputEncoding\":").append(quote(request.getOutputEncoding()));
        }
        if (request.getOutputSampleRate() != null) {
            json.append(",\"outputSampleRate\":").append(request.getOutputSampleRate());
        }
        if (request.getOutputBitDepth() != null) {
            json.append(",\"outputBitDepth\":").append(request.getOutputBitDepth());
        }
        if (request.getOutputChannels() != null) {
            json.append(",\"outputChannels\":").append(request.getOutputChannels());
        }
        if (request.getOutputFrameDurationMs() != null) {
            json.append(",\"outputFrameDurationMs\":").append(request.getOutputFrameDurationMs());
        }
        
        json.append("}");
        return json.toString();
    }
    
    /**
     * Parse error response
     */
    private TtsException parseErrorResponse(int statusCode, String body) {
        try {
            String error = extractJsonString(body, "error");
            return new TtsException(statusCode, error);
        } catch (Exception e) {
            return new TtsException(statusCode, body);
        }
    }
    
    // Simple JSON extraction helpers
    
    private String extractJsonString(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start == -1) return null;
        start += pattern.length();
        int end = json.indexOf("\"", start);
        if (end == -1) return null;
        return json.substring(start, end);
    }
    
    private long extractJsonLong(String json, String key) {
        String pattern = "\"" + key + "\":";
        int start = json.indexOf(pattern);
        if (start == -1) return 0;
        start += pattern.length();
        int end = findJsonValueEnd(json, start);
        return Long.parseLong(json.substring(start, end).trim());
    }
    
    private double extractJsonDouble(String json, String key) {
        String pattern = "\"" + key + "\":";
        int start = json.indexOf(pattern);
        if (start == -1) return 0.0;
        start += pattern.length();
        int end = findJsonValueEnd(json, start);
        return Double.parseDouble(json.substring(start, end).trim());
    }
    
    private int findJsonValueEnd(String json, int start) {
        for (int i = start; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == ',' || c == '}' || c == ']') {
                return i;
            }
        }
        return json.length();
    }
    
    private String quote(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}