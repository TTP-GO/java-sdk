# Mobile App Integration Guide

This guide explains how to integrate the TTP Agent SDK (text chat widget) into native Android and iOS apps.

## Overview

The text chat widget is a web-based component, but it can be integrated into native mobile apps using WebView components. This works for both Android and iOS.

## Option 1: WebView Integration (Recommended)

### Android (Kotlin/Java)

#### 1. Add WebView to your layout

```xml
<!-- activity_main.xml -->
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</LinearLayout>
```

#### 2. Configure WebView in your Activity

```kotlin
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        webView = findViewById(R.id.webView)
        setupWebView()
        loadChatWidget()
    }

    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            setSupportZoom(false)
        }
        
        webView.webViewClient = WebViewClient()
    }

    private fun loadChatWidget() {
        val html = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { margin: 0; padding: 0; }
                </style>
            </head>
            <body>
                <script src="https://cdn.talktopc.com/agent-widget.js"></script>
                <script>
                    // Initialize text chat widget
                    const widget = new TTPAgentSDK.TextChatWidget({
                        agentId: 'your_agent_id',
                        appId: 'your_app_id',
                        websocketUrl: 'wss://backend.talktopc.com/ws/conv',
                        
                        // Mobile-optimized settings
                        position: { vertical: 'bottom', horizontal: 'right', offset: { x: 20, y: 20 } },
                        
                        // Customize appearance
                        primaryColor: '#4F46E5',
                        icon: { type: 'chat', size: 'medium' },
                        
                        // Panel configuration for mobile
                        panel: {
                            width: window.innerWidth - 40,
                            height: window.innerHeight * 0.7,
                            inputPlaceholder: 'Type your message...'
                        },
                        
                        behavior: {
                            autoConnect: true,
                            showWelcomeMessage: true
                        }
                    });
                    
                    // Make widget accessible to native app if needed
                    window.chatWidget = widget;
                </script>
            </body>
            </html>
        """.trimIndent()
        
        webView.loadDataWithBaseURL("https://cdn.talktopc.com", html, "text/html", "UTF-8", null)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

#### 3. Add Internet permission to AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### iOS (Swift)

#### 1. Add WebView in your ViewController

```swift
import UIKit
import WebKit

class ChatViewController: UIViewController {
    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        loadChatWidget()
    }
    
    func setupWebView() {
        let config = WKWebViewConfiguration()
        config.preferences.javaScriptEnabled = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)
    }
    
    func loadChatWidget() {
        let html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
            <style>
                body { margin: 0; padding: 0; }
            </style>
        </head>
        <body>
            <script src="https://cdn.talktopc.com/agent-widget.js"></script>
            <script>
                // Initialize text chat widget
                const widget = new TTPAgentSDK.TextChatWidget({
                    agentId: 'your_agent_id',
                    appId: 'your_app_id',
                    websocketUrl: 'wss://backend.talktopc.com/ws/conv',
                    
                    // Mobile-optimized settings
                    position: { vertical: 'bottom', horizontal: 'right', offset: { x: 20, y: 20 } },
                    
                    // Customize appearance
                    primaryColor: '#4F46E5',
                    icon: { type: 'chat', size: 'medium' },
                    
                    // Panel configuration for mobile
                    panel: {
                        width: window.innerWidth - 40,
                        height: window.innerHeight * 0.7,
                        inputPlaceholder: 'Type your message...'
                    },
                    
                    behavior: {
                        autoConnect: true,
                        showWelcomeMessage: true
                    }
                });
                
                // Make widget accessible to native app if needed
                window.chatWidget = widget;
            </script>
        </body>
        </html>
        """
        
        webView.loadHTMLString(html, baseURL: URL(string: "https://cdn.talktopc.com"))
    }
}
```

#### 2. Update Info.plist for network access

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### Option 2: React Native Integration

If you're using React Native, you can use `react-native-webview`:

```bash
npm install react-native-webview
```

```jsx
import React from 'react';
import { WebView } from 'react-native-webview';

const ChatWidget = () => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.talktopc.com/agent-widget.js"></script>
    </head>
    <body>
      <script>
        new TTPAgentSDK.TextChatWidget({
          agentId: 'your_agent_id',
          appId: 'your_app_id',
          websocketUrl: 'wss://backend.talktopc.com/ws/conv'
        });
      </script>
    </body>
    </html>
  `;

  return (
    <WebView
      source={{ html }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      style={{ flex: 1 }}
    />
  );
};

export default ChatWidget;
```

## Option 3: Using Core SDK (Advanced)

For more control, you can use only the `TextChatSDK` core (WebSocket communication) and build your own native UI:

### Android - Native UI with WebSocket SDK

```kotlin
// You would need to use a WebSocket library like OkHttp WebSocket
// and implement the TextChatSDK protocol manually
// This is more complex but gives full native control

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import okhttp3.WebSocketListener

class ChatSDK {
    private var webSocket: WebSocket? = null
    
    fun connect(url: String, agentId: String, appId: String) {
        val request = Request.Builder()
            .url("$url?agentId=$agentId&appId=$appId")
            .build()
        
        val client = OkHttpClient()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                // Send hello message
                val hello = JSONObject().apply {
                    put("t", "hello")
                    put("appId", appId)
                }
                webSocket.send(hello.toString())
            }
            
            override fun onMessage(webSocket: WebSocket, text: String) {
                // Handle messages
                val message = JSONObject(text)
                // Process message...
            }
        })
    }
    
    fun sendMessage(text: String) {
        val message = JSONObject().apply {
            put("t", "text")
            put("text", text)
        }
        webSocket?.send(message.toString())
    }
}
```

### iOS - Native UI with WebSocket SDK

```swift
import Foundation

class ChatSDK {
    var webSocket: URLSessionWebSocketTask?
    
    func connect(url: String, agentId: String, appId: String) {
        var components = URLComponents(string: url)!
        components.queryItems = [
            URLQueryItem(name: "agentId", value: agentId),
            URLQueryItem(name: "appId", value: appId)
        ]
        
        let request = URLRequest(url: components.url!)
        webSocket = URLSession.shared.webSocketTask(with: request)
        webSocket?.resume()
        
        // Send hello message
        let hello: [String: Any] = ["t": "hello", "appId": appId]
        if let data = try? JSONSerialization.data(withJSONObject: hello) {
            webSocket?.send(.string(String(data: data, encoding: .utf8)!)) { _ in }
        }
        
        receiveMessage()
    }
    
    func sendMessage(_ text: String) {
        let message: [String: Any] = ["t": "text", "text": text]
        if let data = try? JSONSerialization.data(withJSONObject: message) {
            webSocket?.send(.string(String(data: data, encoding: .utf8)!)) { _ in }
        }
    }
    
    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    // Handle message
                    print("Received: \(text)")
                default:
                    break
                }
                self?.receiveMessage() // Continue receiving
            case .failure(let error):
                print("Error: \(error)")
            }
        }
    }
}
```

## Recommendations

### For Quick Integration
**Use Option 1 (WebView)** - It's the fastest way to get the widget working in your native app with minimal code changes.

### For Best Performance
**Use Option 3 (Core SDK with Native UI)** - Build your own native UI using native components, but this requires implementing the WebSocket protocol manually.

### For React Native Apps
**Use Option 2** - React Native WebView makes integration straightforward.

## Important Notes

1. **Network Security**: 
   - Android: Add Internet permission
   - iOS: Configure App Transport Security

2. **WebSocket Support**: 
   - Both platforms fully support WebSocket in WebView
   - Native WebSocket implementations are available for Option 3

3. **Performance**: 
   - WebView approach uses more memory but is easier
   - Native implementation is more efficient but requires more work

4. **Offline Support**: 
   - WebSocket requires active internet connection
   - Consider implementing reconnection logic

5. **Testing**: 
   - Test on real devices, not just simulators
   - Test on various network conditions (WiFi, 4G, 5G)

## Troubleshooting

### WebSocket Connection Issues
- Ensure internet permission is granted
- Check App Transport Security settings on iOS
- Verify the WebSocket URL is accessible from the device

### JavaScript Not Loading
- Ensure JavaScript is enabled in WebView settings
- Check the CDN URL is accessible
- Verify CORS settings if loading from a different domain

### Widget Not Appearing
- Check viewport meta tag is set correctly
- Verify WebView dimensions are not zero
- Ensure JavaScript execution is not blocked




