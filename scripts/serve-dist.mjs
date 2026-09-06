#!/usr/bin/env node
/**
 * Minimal static server with SPA fallback for the production build.
 * Mirrors Cloudflare Pages behaviour (unknown paths → index.html).
 *
 *   node scripts/serve-dist.mjs            → http://localhost:4300
 *   PORT=5000 node scripts/serve-dist.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/pli-demo/browser');
const port = Number(process.env.PORT ?? 4300);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

if (!existsSync(join(root, 'index.html'))) {
  console.error(`No index.html in ${root}. Run "npm run build" first.`);
  process.exit(1);
}

function send(res, file, status = 200) {
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600',
  });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const safePath = normalize(decodeURIComponent(url.pathname));
  const candidate = join(root, safePath);
  if (candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isFile()) {
    send(res, candidate);
  } else {
    send(res, join(root, 'index.html'));
  }
}).listen(port, () => {
  console.log(`Serving ${root}`);
  console.log(`→ http://localhost:${port}`);
});
