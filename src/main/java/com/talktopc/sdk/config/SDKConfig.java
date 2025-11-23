package com.talktopc.sdk.config;

/**
 * SDK Configuration
 * Contains API credentials and connection settings
 */
public class SDKConfig {
    private final String apiKey;
    private final String baseUrl;
    private final int connectTimeout;
    private final int readTimeout;
    
    public SDKConfig(String apiKey, String baseUrl, int connectTimeout, int readTimeout) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.connectTimeout = connectTimeout;
        this.readTimeout = readTimeout;
    }
    
    public String getApiKey() {
        return apiKey;
    }
    
    public String getBaseUrl() {
        return baseUrl;
    }
    
    public int getConnectTimeout() {
        return connectTimeout;
    }
    
    public int getReadTimeout() {
        return readTimeout;
    }
    
    /**
     * Get authorization header value
     * @return Authorization header string (e.g., "Bearer api_key")
     */
    public String getAuthHeader() {
        return "Bearer " + apiKey;
    }
}

