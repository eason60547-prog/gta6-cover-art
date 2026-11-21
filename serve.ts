// A tiny static server for app/ (Node 22, standard library only), so
// an entry can be tried locally without a build step:
//
//   node serve.ts            serves app/ on http://localhost:8080
//   node serve.ts --port 8081  serves it on port 8081 instead
//
// It sends the MIME types an offline web app needs, refuses any path
// outside app/, and otherwise does nothing clever: this is a
// development convenience, not a web server for the internet. It keeps
// no state, stores nothing, and never touches the filesystem except to
// read the file it is about to serve.
//
// Why a server at all, when index.html can be opened straight from
// disk? Two reasons. First, ES modules and font loading are happiest
// over HTTP: some browsers block module scripts or local font files
// from file:// URLs, and the app would silently fall back to generic
// fonts. Second, the ?shot= screenshot scenes are driven by a
// Playwright script against this server, so the screenshots in
// screenshots/ are real renders of the shipped code, not mock-ups.
//
// The v3 rewrite of this file keeps the exact same behaviour as v2 —
// same port handling, same MIME table, same path guard — with clearer
// comments and the steps laid out in the order a request travels:
// parse the URL, guard the path, check the file, send it.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// The directory being served: app/ beside this file, resolved to an
// absolute path once at startup so the path guard below can compare
// against it without surprises from relative paths or symlinks.
const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));

// The port: --port N wins, anything invalid falls back to 8080. The
// check is deliberately strict — a port must be an integer between 1
// and 65535 — because a typo like --port abc should serve on the
// default, not crash the server.
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

// MIME types for the files an offline web app needs. Anything not
// listed here is served as a generic byte stream, which is safe but
// means the browser will not know what to do with it — if a new file
// type is added to app/, add its type here too.
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

// One request, step by step:
//
//   1. Parse the URL. A malformed URL (one that decodeURIComponent
//      chokes on) is a 400, not a crash.
//   2. A path ending in "/" means the directory index: index.html.
//   3. Guard the path. The requested file is resolved against the app
//      root and must stay inside it — a request for "../main.ts" or
//      an absolute path must never escape app/, so it gets a 403.
//   4. Check the file exists and is a real file. A missing file, or a
//      directory, is a 404.
//   5. Stream it back with the right content type, its length, and a
//      no-store cache header, so a changed file is never served stale
//      while the app is being edited.
//
// The server binds to 127.0.0.1 only: it is for local testing, and
// there is no reason for it to be reachable from the network.
createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  let size: number;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`app/ is on http://localhost:${port}`);
});
