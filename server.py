#!/usr/bin/env python3
"""Dev server with static file serving + anchor save endpoint."""

import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

PORT = 8000
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
ANCHOR_FILE = os.path.join(DATA_DIR, 'sprite-anchors.json')
SPINE_FILE = os.path.join(DATA_DIR, 'spine-paths.json')


class DevHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/save-anchors':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                # Validate structure
                if 'anchors' not in data or 'toolFormat' not in data:
                    self.send_error(400, 'Missing anchors or toolFormat')
                    return
                # Write with pretty formatting for git-friendly diffs
                os.makedirs(os.path.dirname(ANCHOR_FILE), exist_ok=True)
                with open(ANCHOR_FILE, 'w') as f:
                    json.dump(data, f, indent=2, sort_keys=False)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True}).encode())
                print(f'  Saved anchors → {ANCHOR_FILE}')
            except json.JSONDecodeError:
                self.send_error(400, 'Invalid JSON')
            except Exception as e:
                self.send_error(500, str(e))
        elif self.path == '/api/save-spines':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                os.makedirs(DATA_DIR, exist_ok=True)
                with open(SPINE_FILE, 'w') as f:
                    json.dump(data, f, indent=2, sort_keys=False)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True}).encode())
                print(f'  Saved spines → {SPINE_FILE}')
            except json.JSONDecodeError:
                self.send_error(400, 'Invalid JSON')
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404, 'Not found')

    def end_headers(self):
        # Allow CORS for local dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = ThreadedHTTPServer(('', PORT), DevHandler)
    print(f'Dev server running at http://127.0.0.1:{PORT}/')
    print(f'Anchor save endpoint: POST /api/save-anchors')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down.')
        server.shutdown()
