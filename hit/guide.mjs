// Writes the official migration guide entries for one dependency between two versions into
// .coggs/guides/<dep>-<from>-<to>.md, headed with the source URL, the wiki commit and the fetch time.
// Only three.js is wired today: its guide is a GitHub wiki page with one "## rA → rB" section per release.
// Usage: node hit/guide.mjs --dep three --from 0.118.1 --to 0.162.0 [--out <file>]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// three.js names releases by the npm minor number: 0.118.1 is r118.
const release = (v) => {
  const s = String(v).replace(/^r/, '');
  return Number(s.includes('.') ? s.split('.')[1] : s);
};

const SOURCES = {
  three: {
    page: 'https://github.com/mrdoob/three.js/wiki/Migration-Guide',
    raw: 'https://raw.githubusercontent.com/wiki/mrdoob/three.js/Migration-Guide.md',
    wiki: 'https://github.com/mrdoob/three.js.wiki.git',
    release,
  },
};

export function guideName(dep, from, to) {
  const s = SOURCES[dep];
  if (!s) throw new Error('no migration guide source for ' + dep);
  return dep + '-' + s.release(from) + '-' + s.release(to) + '.md';
}

// Keeps every "## rA → rB" section with A >= from and B <= to, in the page's own order (newest first).
export function sliceGuide(markdown, from, to) {
  const out = [];
  let keep = false;
  for (const line of markdown.split(/\r?\n/)) {
    const m = /^##\s+r?(\d+)\s*→\s*r?(\d+)\s*$/.exec(line);
    if (m) keep = Number(m[1]) >= from && Number(m[2]) <= to;
    else if (/^#{1,2}\s/.test(line)) keep = false;
    if (keep) out.push(line);
  }
  return out.join('\n').trim() + '\n';
}

export async function writeGuide({ dep, from, to, out }) {
  const s = SOURCES[dep];
  if (!s) throw new Error('no migration guide source for ' + dep);
  const res = await fetch(s.raw);
  if (!res.ok) throw new Error(s.raw + ' answered ' + res.status);
  const body = await res.text();
  const head = spawnSync('git', ['ls-remote', s.wiki, 'HEAD'], { encoding: 'utf8', windowsHide: true, timeout: 60000 });
  const sha = head.status === 0 ? head.stdout.split(/\s/)[0] : 'unknown';
  const a = s.release(from);
  const b = s.release(to);
  const entries = sliceGuide(body, a, b);
  const count = (entries.match(/^## /gm) || []).length;
  if (count !== b - a) throw new Error('expected ' + (b - a) + ' release sections between r' + a + ' and r' + b + ', found ' + count);
  const text = [
    '# ' + dep + ' migration guide, r' + a + ' to r' + b,
    '',
    'Source: ' + s.page + ' (raw ' + s.raw + '), wiki commit ' + sha + ', fetched ' + new Date().toISOString() + '. The ' + count + ' release sections below are copied unchanged from that page, newest release first.',
    '',
    entries,
  ].join('\n');
  const file = out || path.join('.coggs', 'guides', guideName(dep, from, to));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return { file, sha, count };
}

function args(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[++i];
  return o;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = args(process.argv.slice(2));
  if (!a.dep || !a.from || !a.to) {
    console.error('usage: node hit/guide.mjs --dep three --from <v> --to <v> [--out <file>]');
    process.exit(2);
  }
  const r = await writeGuide(a);
  console.log(r.file + ': ' + r.count + ' sections from wiki commit ' + r.sha);
}
