/**
 * React Example - VoiceSDK Integration
 * 
 * This example shows how to use the VoiceSDK with React components
 * for a modern web application.
 */

import React, { useState, useRef, useEffect } from 'react';
import { VoiceSDK, VoiceButton } from 'ttp-agent-sdk';

function VoiceChatApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  
  const voiceSDKRef = useRef(null);

  // Initialize VoiceSDK
  useEffect(() => {
    const voiceSDK = new VoiceSDK({
      websocketUrl: 'wss://speech.talktopc.com/ws/conv',
      agentId: 'demo_agent_123',
      appId: 'demo_app_456',
      voice: 'default',
      language: 'en',
      autoReconnect: true
    });

    // Set up event handlers
    voiceSDK.on('connected', () => {
      setIsConnected(true);
      setConnectionStatus('Connected');
      addMessage('system', 'Connected to voice agent');
    });

    voiceSDK.on('disconnected', () => {
      setIsConnected(false);
      setIsRecording(false);
      setIsPlaying(false);
      setConnectionStatus('Disconnected');
      addMessage('system', 'Disconnected from voice agent');
    });

    voiceSDK.on('recordingStarted', () => {
      setIsRecording(true);
      addMessage('user', '🎤 Recording...');
    });

    voiceSDK.on('recordingStopped', () => {
      setIsRecording(false);
      addMessage('user', '⏹️ Recording stopped');
    });

    voiceSDK.on('playbackStarted', () => {
      setIsPlaying(true);
      addMessage('agent', '🔊 Agent is speaking...');
    });

    voiceSDK.on('playbackStopped', () => {
      setIsPlaying(false);
    });

    voiceSDK.on('message', (message) => {
      if (message.type === 'agent_response') {
        addMessage('agent', message.agent_response);
      } else if (message.type === 'user_transcript') {
        addMessage('user', message.user_transcription);
      }
    });

    voiceSDK.on('error', (error) => {
      console.error('VoiceSDK Error:', error);
      addMessage('error', `Error: ${error.message}`);
    });

    voiceSDKRef.current = voiceSDK;

    // Cleanup on unmount
    return () => {
      if (voiceSDKRef.current) {
        voiceSDKRef.current.destroy();
      }
    };
  }, []);

  const addMessage = (type, text) => {
    setMessages(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const handleConnect = async () => {
    if (voiceSDKRef.current) {
      try {
        setConnectionStatus('Connecting...');
        await voiceSDKRef.current.connect();
      } catch (error) {
        console.error('Connection failed:', error);
        setConnectionStatus('Connection failed');
      }
    }
  };

  const handleDisconnect = () => {
    if (voiceSDKRef.current) {
      voiceSDKRef.current.disconnect();
    }
  };

  const handleToggleRecording = async () => {
    if (voiceSDKRef.current) {
      try {
        if (isRecording) {
          await voiceSDKRef.current.stopRecording();
        } else {
          await voiceSDKRef.current.startRecording();
        }
      } catch (error) {
        console.error('Recording toggle failed:', error);
      }
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>🎤 Voice Chat App</h1>
      
      {/* Connection Status */}
      <div style={{
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        backgroundColor: isConnected ? '#D1FAE5' : '#FEE2E2',
        color: isConnected ? '#065F46' : '#991B1B',
        border: `1px solid ${isConnected ? '#10B981' : '#EF4444'}`
      }}>
        <strong>Status:</strong> {connectionStatus}
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleConnect}
          disabled={isConnected}
          style={{
            padding: '12px 24px',
            backgroundColor: isConnected ? '#9CA3AF' : '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isConnected ? 'not-allowed' : 'pointer'
          }}
        >
          Connect
        </button>
        
        <button
          onClick={handleDisconnect}
          disabled={!isConnected}
          style={{
            padding: '12px 24px',
            backgroundColor: !isConnected ? '#9CA3AF' : '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: !isConnected ? 'not-allowed' : 'pointer'
          }}
        >
          Disconnect
        </button>
        
        <button
          onClick={handleToggleRecording}
          disabled={!isConnected}
          style={{
            padding: '12px 24px',
            backgroundColor: !isConnected ? '#9CA3AF' : (isRecording ? '#EF4444' : '#10B981'),
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: !isConnected ? 'not-allowed' : 'pointer'
          }}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      {/* Voice Button Component */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Voice Button Component:</h3>
        <VoiceButton
          websocketUrl="wss://speech.talktopc.com/ws/conv"
          agentId="demo_agent_123"
          appId="demo_app_456"
          onConnected={() => console.log('VoiceButton connected')}
          onRecordingStarted={() => console.log('VoiceButton recording started')}
          onPlaybackStarted={() => console.log('VoiceButton playback started')}
        />
      </div>

      {/* Messages */}
      <div style={{
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        height: '400px',
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#F9FAFB'
      }}>
        <h3>Messages:</h3>
        {messages.length === 0 ? (
          <p style={{ color: '#6B7280', fontStyle: 'italic' }}>
            No messages yet. Connect and start recording to begin the conversation.
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              style={{
                marginBottom: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: message.type === 'user' ? '#E5E7EB' : 
                                message.type === 'agent' ? '#F3F4F6' :
                                message.type === 'error' ? '#FEE2E2' : '#EFF6FF',
                color: message.type === 'error' ? '#991B1B' : '#111827',
                alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                marginLeft: message.type === 'user' ? 'auto' : '0',
                marginRight: message.type === 'user' ? '0' : 'auto'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {message.type === 'user' ? '👤 You' :
                 message.type === 'agent' ? '🤖 Agent' :
                 message.type === 'error' ? '❌ Error' : 'ℹ️ System'}
              </div>
              <div>{message.text}</div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6B7280', 
                marginTop: '4px' 
              }}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status Indicators */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginTop: '20px',
        fontSize: '14px',
        color: '#6B7280'
      }}>
        <div>
          <span style={{ 
            display: 'inline-block', 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%',
            backgroundColor: isConnected ? '#10B981' : '#EF4444',
            marginRight: '8px'
          }}></span>
          Connection
        </div>
        <div>
          <span style={{ 
            display: 'inline-block', 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%',
            backgroundColor: isRecording ? '#EF4444' : '#9CA3AF',
            marginRight: '8px'
          }}></span>
          Recording
        </div>
        <div>
          <span style={{ 
            display: 'inline-block', 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%',
            backgroundColor: isPlaying ? '#10B981' : '#9CA3AF',
            marginRight: '8px'
          }}></span>
          Playing
        </div>
      </div>
    </div>
  );
}

export default VoiceChatApp;
