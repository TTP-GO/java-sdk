package com.talktopc.sdk.client;

import com.talktopc.sdk.config.SDKConfig;
import com.talktopc.sdk.exception.TtsException;
import com.talktopc.sdk.models.TTSRequest;
import com.talktopc.sdk.models.TTSResponse;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

/**
 * REST client for TTS synthesis (complete audio)
 * Calls POST /api/v1/tts/synthesize
 */
public class TtsRestClient {
    
    private final SDKConfig config;
    private final HttpClient httpClient;
    
    public TtsRestClient(SDKConfig config) {
        this.config = config;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(config.getConnectTimeout()))
            .build();
    }
    
    /**
     * Synthesize text to speech (blocking)
     * 
     * @param request TTS request
     * @return TTS response with audio and metadata
     * @throws TtsException if synthesis fails
     */
    public TTSResponse synthesize(TTSRequest request) {
        try {
            // Build JSON request body
            String jsonBody = buildJsonRequest(request);
            
            // Build HTTP request
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(config.getBaseUrl() + "/api/v1/tts/synthesize"))
                .header("Authorization", config.getAuthHeader())
                .header("Content-Type", "application/json")
                .timeout(Duration.ofMillis(config.getReadTimeout()))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
            
            // Send request
            HttpResponse<String> response = httpClient.send(httpRequest, 
                HttpResponse.BodyHandlers.ofString());
            
            // Handle response
            if (response.statusCode() == 200) {
                return parseSuccessResponse(response.body());
            } else {
                throw parseErrorResponse(response.statusCode(), response.body());
            }
            
        } catch (IOException | InterruptedException e) {
            throw new TtsException("TTS request failed: " + e.getMessage(), e);
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
     * Parse success response
     */
    private TTSResponse parseSuccessResponse(String body) {
        try {
            // Simple JSON parsing (you can use Gson/Jackson if available)
            String audioBase64 = extractJsonString(body, "audio");
            int sampleRate = extractJsonInt(body, "sampleRate");
            long durationMs = extractJsonLong(body, "durationMs");
            long audioSizeBytes = extractJsonLong(body, "audioSizeBytes");
            double creditsUsed = extractJsonDouble(body, "creditsUsed");
            String conversationId = extractJsonString(body, "conversationId");
            
            byte[] audio = Base64.getDecoder().decode(audioBase64);
            
            return new TTSResponse(audio, sampleRate, durationMs, audioSizeBytes, 
                                 creditsUsed, conversationId);
                                 
        } catch (Exception e) {
            throw new TtsException("Failed to parse response: " + e.getMessage(), e);
        }
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
    
    // Simple JSON extraction helpers (no external dependencies)
    
    private String extractJsonString(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start == -1) return null;
        start += pattern.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }
    
    private int extractJsonInt(String json, String key) {
        String pattern = "\"" + key + "\":";
        int start = json.indexOf(pattern);
        if (start == -1) return 0;
        start += pattern.length();
        int end = findJsonValueEnd(json, start);
        return Integer.parseInt(json.substring(start, end).trim());
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
        char c;
        for (int i = start; i < json.length(); i++) {
            c = json.charAt(i);
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