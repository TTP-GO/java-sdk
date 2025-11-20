#!/usr/bin/env node

/**
 * Simple HTTP server for serving demo-v2.html
 * Usage: node serve-demo.js
 * Then visit: http://localhost:8080/demo-v2.html
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT_DIR = __dirname;

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
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.map': 'application/json'
};

const server = http.createServer((req, res) => {
  // Parse URL
  let filePath = req.url === '/' ? '/demo-v2.html' : req.url;
  
  // Remove query string
  filePath = filePath.split('?')[0];
  
  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Determine full file path
  let fullPath;
  if (filePath.startsWith('/dist/')) {
    // Serve from dist directory
    fullPath = path.join(ROOT_DIR, filePath);
  } else if (filePath.startsWith('/examples/')) {
    // Serve from examples directory
    fullPath = path.join(ROOT_DIR, filePath);
  } else {
    // Default: serve from root or examples
    fullPath = path.join(ROOT_DIR, filePath.startsWith('/') ? filePath.substring(1) : filePath);
    
    // If file doesn't exist in root, try examples
    if (!fs.existsSync(fullPath) && !filePath.startsWith('/examples/')) {
      fullPath = path.join(ROOT_DIR, 'examples', filePath.startsWith('/') ? filePath.substring(1) : filePath);
    }
  }
  
  // Get file extension
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  // Read and serve file
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <h1>404 - File Not Found</h1>
          <p>File: ${filePath}</p>
          <p>Full path: ${fullPath}</p>
          <p><a href="/demo-v2.html">Go to demo-v2.html</a></p>
        `);
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Set CORS headers for development
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Demo server running at http://localhost:${PORT}`);
  console.log(`📄 Demo page: http://localhost:${PORT}/demo-v2.html`);
  console.log(`📦 Dist files: http://localhost:${PORT}/dist/agent-widget.js`);
  console.log(`\nPress Ctrl+C to stop\n`);
});

