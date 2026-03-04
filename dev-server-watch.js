#!/usr/bin/env node
/**
 * Auto-restarting wrapper for dev-server.js
 * If the server process dies for any reason, it restarts within 1 second.
 */
const { spawn } = require('child_process');
const path = require('path');

const SERVER_SCRIPT = path.join(__dirname, 'dev-server.js');

function startServer() {
  console.log('[watch] Starting dev server...');

  const child = spawn(process.execPath, [SERVER_SCRIPT], {
    stdio: 'inherit',
    cwd: __dirname,
  });

  child.on('exit', (code, signal) => {
    console.log(`[watch] Server exited (code=${code}, signal=${signal}) — restarting in 1s...`);
    setTimeout(startServer, 1000);
  });

  child.on('error', (err) => {
    console.error('[watch] Failed to start server:', err);
    setTimeout(startServer, 1000);
  });
}

startServer();
