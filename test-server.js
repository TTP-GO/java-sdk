#!/usr/bin/env node

/**
 * Simple HTTP Server for Testing TTP Agent SDK
 * 
 * This server serves the test pages over HTTP to avoid CORS issues
 * with AudioWorklet when testing locally.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const ROOT_DIR = path.join(__dirname, 'dist');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to test-text-chat.html for root
  if (pathname === '/') {
    pathname = '/examples/test-text-chat.html';
  }
  
  // Remove leading slash and resolve path
  let filePath = path.join(ROOT_DIR, pathname.substring(1));
  
  // Normalize the path to handle any issues
  filePath = path.normalize(filePath);
  
  // Security check - prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    // Get file extension for MIME type
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
        return;
      }
      
      // Set CORS headers for AudioWorklet
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
      res.end(data);
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 TTP Agent SDK Test Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${ROOT_DIR}`);
  console.log(`🎤 Test pages available at:`);
  console.log(`   - http://localhost:${PORT}/examples/test-text-chat.html`);
  console.log(`   - http://localhost:${PORT}/examples/test-signed-link.html`);
  console.log(`   - http://localhost:${PORT}/examples/test.html`);
  console.log(`\n💡 Press Ctrl+C to stop the server`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});