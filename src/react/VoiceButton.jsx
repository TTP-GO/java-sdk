/**
 * VoiceButton - React component for voice interaction
 */
import React, { useState, useEffect, useRef } from 'react';
import VoiceSDK from '../core/VoiceSDK.js';

const VoiceButton = ({ 
  websocketUrl,
  agentId, // Optional - for direct agent access (unsecured method)
  voice = 'default',
  language = 'en',
  autoReconnect = true,
  onConnected,
  onDisconnected,
  onRecordingStarted,
  onRecordingStopped,
  onPlaybackStarted,
  onPlaybackStopped,
  onError,
  onMessage,
  onBargeIn,
  onStopPlaying,
  className = '',
  style = {},
  children
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  
  const voiceSDKRef = useRef(null);
  
  // Initialize VoiceSDK
  useEffect(() => {
    console.log(`🎙️ VoiceButton: Creating VoiceSDK instance for ${websocketUrl}`);
    
    // Clean up existing instance if any
    if (voiceSDKRef.current) {
      console.log(`🎙️ VoiceButton: Destroying existing VoiceSDK instance`);
      voiceSDKRef.current.destroy();
      voiceSDKRef.current = null;
    }
    
    const voiceSDK = new VoiceSDK({
      websocketUrl,
      agentId, // Pass through agentId if provided
      voice,
      language,
      autoReconnect
    });
    
    // Setup event listeners
    voiceSDK.on('connected', () => {
      setIsConnected(true);
      setConnectionStatus('Connected');
      onConnected?.();
    });
    
    voiceSDK.on('disconnected', () => {
      setIsConnected(false);
      setConnectionStatus('Disconnected');
      onDisconnected?.();
    });
    
    voiceSDK.on('recordingStarted', () => {
      setIsRecording(true);
      onRecordingStarted?.();
    });
    
    voiceSDK.on('recordingStopped', () => {
      setIsRecording(false);
      onRecordingStopped?.();
    });
    
    voiceSDK.on('playbackStarted', () => {
      setIsPlaying(true);
      onPlaybackStarted?.();
    });
    
    voiceSDK.on('playbackStopped', () => {
      setIsPlaying(false);
      onPlaybackStopped?.();
    });
    
    voiceSDK.on('error', (error) => {
      onError?.(error);
    });
    
    voiceSDK.on('message', (message) => {
      onMessage?.(message);
    });
    
    voiceSDK.on('bargeIn', (message) => {
      onBargeIn?.(message);
    });
    
    voiceSDK.on('stopPlaying', (message) => {
      onStopPlaying?.(message);
    });
    
    voiceSDKRef.current = voiceSDK;
    
    // Auto-connect
    voiceSDK.connect();
    
    // Cleanup on unmount
    return () => {
      console.log(`🎙️ VoiceButton: Cleaning up VoiceSDK instance for ${websocketUrl}`);
      if (voiceSDKRef.current) {
        voiceSDKRef.current.destroy();
        voiceSDKRef.current = null;
      }
    };
  }, [websocketUrl, agentId, voice, language]);
  
  // Handle button click
  const handleClick = async () => {
    if (!voiceSDKRef.current) return;
    
    try {
      await voiceSDKRef.current.toggleRecording();
    } catch (error) {
      console.error('Error toggling recording:', error);
    }
  };
  
  // Default button content
  const defaultContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ fontSize: '20px' }}>
        {isRecording ? '🔴' : '🎤'}
      </div>
      <div>
        {isRecording ? 'Stop Listening' : 'Start Listening'}
      </div>
    </div>
  );
  
  return (
    <button
      className={`voice-button ${isRecording ? 'recording' : ''} ${className}`}
      style={{
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: isRecording ? '#dc3545' : '#007bff',
        color: 'white',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        ...style
      }}
      onClick={handleClick}
      disabled={!isConnected}
    >
      {children || defaultContent}
    </button>
  );
};

export default VoiceButton;
