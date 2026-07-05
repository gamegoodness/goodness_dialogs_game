/*
 * serve.js - a tiny, zero-dependency static file server.
 *
 * ES modules must be served over http:// (not opened as file://), so this
 * provides a no-install way to run the game locally:
 *
 *     npm start           →  http://localhost:5173
 *     node serve.js 8080  →  http://localhost:8080
 *
 * For production you can host the folder on any static host (GitHub Pages,
 * Netlify, S3, …) - there is no build step.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2]) || 5173;
const root = __dirname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // Resolve safely inside root (prevent path traversal).
  const filePath = path.normalize(path.join(root, urlPath));
  if (!filePath.startsWith(root)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // Local dev server: always serve the file as it is on disk right now,
      // never a browser-cached copy of an older edit.
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}).listen(port, () => {
  console.log(`\n  Milo & the Good Angel → http://localhost:${port}\n  (Ctrl+C to stop)\n`);
});
