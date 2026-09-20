const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const querystring = require('node:querystring');

const outputDir = path.resolve(__dirname, '..', 'browser-media');
fs.mkdirSync(outputDir, { recursive: true });

const server = http.createServer((request, response) => {
  response.setHeader('access-control-allow-origin', '*');
  response.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type');
  if (request.method === 'OPTIONS' && request.url === '/capture') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.method === 'GET' && request.url === '/') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html><meta charset="utf-8"><title>Local evidence capture</title>
<form method="post" action="/capture">
<label>filename <input name="filename" required></label>
<label>payload <textarea name="payload" rows="8" cols="80" required></textarea></label>
<button type="submit">save</button>
</form>`);
    return;
  }
  if (request.method !== 'POST' || request.url !== '/capture') {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('not found');
    return;
  }
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', () => {
    try {
      const fields = querystring.parse(Buffer.concat(chunks).toString('utf8'));
      const filename = String(fields.filename || 'capture.png');
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|webp)$/.test(filename)) {
        throw new Error('invalid image filename');
      }
      const payload = String(fields.payload || '').trim();
      if (!/^[A-Za-z0-9+/=]+$/.test(payload)) throw new Error('invalid image payload');
      const outputPath = path.join(outputDir, filename);
      fs.writeFileSync(outputPath, Buffer.from(payload, 'base64'));
      response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(`saved ${filename} ${fs.statSync(outputPath).size} bytes`);
    } catch (error) {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(String(error && error.message ? error.message : error));
    }
  });
});

server.listen(4311, '127.0.0.1', () => {
  console.log(`capture-server listening on 127.0.0.1:4311 output=${outputDir}`);
});
