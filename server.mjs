import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { build } from 'esbuild';
import signup from './api/signup.js';
import { existsSync } from 'node:fs';
if (existsSync(new URL('.env.local', import.meta.url))) process.loadEnvFile(fileURLToPath(new URL('.env.local', import.meta.url)));

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.otf': 'font/otf', '.ttf': 'font/ttf' };
const agentation = await build({
  entryPoints: [fileURLToPath(new URL('dev/agentation.jsx', import.meta.url))],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  minify: true,
  write: false,
});
const agentationScript = agentation.outputFiles[0].contents;
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/api/signup') {
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 2048) { response.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      request.body = Buffer.concat(chunks).toString();
      response.status = code => { response.statusCode = code; return response; };
      response.json = value => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(value)); };
      await signup(request, response);
      return;
    }
    if (url.pathname.startsWith('/__agentation-api/')) {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const upstream = await fetch(`http://127.0.0.1:4747${url.pathname.slice('/__agentation-api'.length)}${url.search}`, {
        method: request.method,
        headers: { 'content-type': request.headers['content-type'] || 'application/json' },
        body: chunks.length ? Buffer.concat(chunks) : undefined,
      });
      response.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-cache' });
      if (upstream.body) Readable.fromWeb(upstream.body).pipe(response);
      else response.end();
      return;
    }
    if (url.pathname === '/__agentation.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
      response.end(agentationScript);
      return;
    }
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname === '/about' ? '/about.html' : url.pathname));
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    let body = await readFile(path);
    if (path === resolve(root, 'index.html')) {
      body = Buffer.from(body.toString().replace('</body>', '<script src="/__agentation.js" defer></script></body>'));
    }
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`ETTO is ready at http://localhost:${port}`));
