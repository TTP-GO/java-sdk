/**
 * TTP Agent SDK - Main Entry Point
 * 
 * A comprehensive SDK for voice interaction with AI agents.
 * Provides real-time audio recording, WebSocket communication, and audio playback.
 * 
 * Features:
 * - 🎤 Real-time Audio Recording with AudioWorklet
 * - 🔄 WebSocket Communication with authentication
 * - 🔊 Audio Playback with queue management
 * - ⚛️ React Components
 * - 🌐 Vanilla JavaScript Components
 * - 🎯 Event-driven architecture
 * - 🔒 Multiple authentication methods
 */

// Core SDK
export { default as VoiceSDK } from './core/VoiceSDK.js';
export { default as WebSocketManager } from './core/WebSocketManager.js';
export { default as WebSocketManagerV2 } from './core/WebSocketManagerV2.js';
export { default as AudioRecorder } from './core/AudioRecorder.js';
export { default as AudioPlayer } from './core/AudioPlayer.js';
export { default as EventEmitter } from './core/EventEmitter.js';

// React components
export { default as VoiceButton } from './react/VoiceButton.jsx';

// Vanilla JavaScript components
export { default as VanillaVoiceButton } from './vanilla/VoiceButton.js';

// Legacy AgentSDK (for backward compatibility)
export { AgentSDK, AgentWidget } from './legacy/AgentSDK.js';

// Version
export const VERSION = '2.0.0';

// Default export for convenience
export default {
  VoiceSDK,
  WebSocketManager,
  WebSocketManagerV2,
  AudioRecorder,
  AudioPlayer,
  EventEmitter,
  VoiceButton,
  VanillaVoiceButton,
  AgentSDK,
  AgentWidget,
  VERSION
};