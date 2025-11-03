/**
 * TTP Agent SDK - Main Entry Point
 * 
 * A comprehensive SDK for voice and text interaction with AI agents.
 * Provides real-time audio recording, WebSocket communication, and audio playback.
 * 
 * Features:
 * - 🎤 Real-time Audio Recording with AudioWorklet
 * - 💬 Text Chat Support
 * - 🔄 WebSocket Communication with authentication
 * - 🔊 Audio Playback with queue management
 * - ⚛️ React Components
 * - 🌐 Vanilla JavaScript Components
 * - 🎯 Event-driven architecture
 * - 🔒 Multiple authentication methods
 */

// Core SDK
import VoiceSDK from './core/VoiceSDK.js';
import TextChatSDK from './core/TextChatSDK.js';
import WebSocketManager from './core/WebSocketManager.js';
import AudioRecorder from './core/AudioRecorder.js';
import AudioPlayer from './core/AudioPlayer.js';
import EventEmitter from './core/EventEmitter.js';

// React components
import VoiceButton from './react/VoiceButton.jsx';

// Vanilla JavaScript components
import VanillaVoiceButton from './vanilla/VoiceButton.js';

// TTPChatWidget and AgentSDK (AgentSDK is used by VoiceInterface, which TTPChatWidget uses)
import { AgentSDK } from './legacy/AgentSDK.js';
import { TTPChatWidget } from './legacy/TextChatWidget.js';

// Version
export const VERSION = '2.0.0';

// Named exports
export {
  VoiceSDK,
  TextChatSDK,
  WebSocketManager,
  AudioRecorder,
  AudioPlayer,
  EventEmitter,
  VoiceButton,
  VanillaVoiceButton,
  AgentSDK,
  TTPChatWidget
};

// Default export for convenience
export default {
  VoiceSDK,
  TextChatSDK,
  WebSocketManager,
  AudioRecorder,
  AudioPlayer,
  EventEmitter,
  VoiceButton,
  VanillaVoiceButton,
  AgentSDK,
  TTPChatWidget,
  VERSION
};
