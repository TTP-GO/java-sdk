// ============================================
// FILE: test-server.js  
// Mock Backend Server for Testing
// ============================================
// This simulates the customer's backend that would call YOUR API
// Run this with: node test-server.js

const http = require('http');

const PORT = 3000;

// Mock WebSocket server URL (you'll replace with your real one)
const MOCK_WS_URL = 'wss://echo.websocket.org'; // Free echo server for testing

const server = http.createServer((req, res) => {
  // Enable CORS for local testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok',
      message: 'Mock backend is running' 
    }));
    return;
  }

  // Mock session endpoint
  if (req.url === '/api/get-session' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('📥 Received session request:');
        console.log('  Agent ID:', data.agentId);
        console.log('  Variables:', data.variables);
        
        // In production, you would:
        // 1. Call YOUR API with YOUR secret key
        // 2. Get back a real signed WebSocket URL
        // 3. Return it to the frontend
        
        // For now, return a mock WebSocket URL
        const mockSignedUrl = MOCK_WS_URL + '?agent=' + data.agentId;
        
        console.log('📤 Returning signed URL:', mockSignedUrl);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          signedUrl: mockSignedUrl,
          sessionId: 'session_mock_' + Date.now(),
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }));
        
      } catch (error) {
        console.error('❌ Error processing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('🚀 Mock Backend Server Started!');
  console.log('================================');
  console.log(`✓ Listening on: http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ Session API:  http://localhost:${PORT}/api/get-session`);
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Open another terminal');
  console.log('2. Run: npm run dev');
  console.log('3. Browser will open with test page');
  console.log('');
  console.log('⚠️  Note: This uses a free echo WebSocket server for testing.');
  console.log('   Replace MOCK_WS_URL with your real WebSocket URL when ready.');
  console.log('');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
