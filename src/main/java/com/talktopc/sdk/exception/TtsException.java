package com.talktopc.sdk.exception;

/**
 * Exception thrown when TTS operations fail
 */
public class TtsException extends RuntimeException {
    private final int statusCode;
    private final String errorMessage;
    
    public TtsException(String message) {
        super(message);
        this.statusCode = -1;
        this.errorMessage = message;
    }
    
    public TtsException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = -1;
        this.errorMessage = message;
    }
    
    public TtsException(int statusCode, String errorMessage) {
        super(String.format("TTS Error [%d]: %s", statusCode, errorMessage));
        this.statusCode = statusCode;
        this.errorMessage = errorMessage;
    }
    
    public int getStatusCode() {
        return statusCode;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
}

