// Serves one game folder over loopback and answers its jsDelivr three.js imports from the npm
// packages package.json pins, so a replay never waits on a CDN and both sides read the same bytes.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODULES = path.join(ROOT, 'node_modules');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.fbx': 'application/octet-stream',
};

export const contentType = (file) => TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';

// A path inside root, or null when the request climbs out of it.
function inside(root, rel) {
  const file = path.resolve(root, '.' + path.posix.sep + rel);
  return file === root || file.startsWith(root + path.sep) ? file : null;
}

export function serveGame(gameDir) {
  const root = path.resolve(gameDir);
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://local').pathname).replace(/^\/+/, '') || 'index.html';
    const file = inside(root, rel);
    if (!file) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': contentType(file), 'cache-control': 'no-store' });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
    url: 'http://127.0.0.1:' + server.address().port + '/',
    close: () => new Promise((r) => server.close(r)),
  })));
}

// Versions installed as npm aliases named three-<version>.
function installedThree() {
  return fs.readdirSync(MODULES).filter((d) => /^three-\d+\.\d+\.\d+$/.test(d)).map((d) => d.slice(6));
}

const newer = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};

// The CDN forms games use for three.js, each read as [version spec, file inside the npm package].
// cdnjs names a release by its revision (three.js/99/three.min.js is npm 0.99.x, build/three.min.js).
const CDN_FORMS = [
  [/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@([0-9.]+)\/([^?#]+)/, (m) => [m[1], m[2]]],
  [/^https:\/\/unpkg\.com\/three@([0-9.]+)\/([^?#]+)/, (m) => [m[1], m[2]]],
  [/^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r?(\d+)(?:\.\d+)*\/([^?#]+)/, (m) => ['0.' + m[1], 'build/' + m[2]]],
];

// jsDelivr reads three@0.118 as the newest 0.118.x; the same rule picks among the installed copies.
export function resolveThree(url) {
  const form = CDN_FORMS.map(([re, read]) => [re.exec(url), read]).find(([m]) => m);
  if (!form) return null;
  const [spec, rest] = form[1](form[0]);
  const depth = spec.split('.').length;
  const versions = installedThree().filter((v) => v.split('.').slice(0, depth).join('.') === spec).sort(newer);
  if (!versions.length) return { spec, version: null, file: null };
  const version = versions[versions.length - 1];
  return { spec, version, file: inside(path.join(MODULES, 'three-' + version), rest) };
}
