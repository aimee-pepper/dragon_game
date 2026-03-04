#!/usr/bin/env node
/**
 * Dev server: static files + save endpoints for editor tools.
 * Replaces both `npx http-server` and `python3 server.py`.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.mjs':  'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
};

// ── Save endpoints ──
const SAVE_ROUTES = {
  '/api/save-anchors': path.join(DATA_DIR, 'sprite-anchors.json'),
  '/api/save-spines':  path.join(DATA_DIR, 'spine-paths.json'),
  '/api/save-zones':   path.join(DATA_DIR, 'zone-polygons.json'),
};

function addNoCacheHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function handlePost(req, res, filePath) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      addNoCacheHeaders(res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      console.log(`  Saved → ${filePath}`);
    } catch (e) {
      addNoCacheHeaders(res);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // If path is a directory, try index.html inside it
  let resolvedPath = filePath;
  try {
    if (fs.statSync(filePath).isDirectory()) {
      resolvedPath = path.join(filePath, 'index.html');
    }
  } catch (e) { /* file doesn't exist, handled below */ }

  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      addNoCacheHeaders(res);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + urlPath);
      return;
    }
    const ext = path.extname(resolvedPath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    addNoCacheHeaders(res);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    addNoCacheHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // POST save endpoints
  if (req.method === 'POST' && SAVE_ROUTES[req.url]) {
    handlePost(req, res, SAVE_ROUTES[req.url]);
    return;
  }

  // Static files
  serveStatic(req, res);
});

// ── Keep-alive: prevent silent crashes ──
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Server may already be running.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  // Don't exit — let it try to recover
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (server staying alive):', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection (server staying alive):', reason);
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://127.0.0.1:${PORT}/`);
  console.log(`Save endpoints: ${Object.keys(SAVE_ROUTES).join(', ')}`);
});
