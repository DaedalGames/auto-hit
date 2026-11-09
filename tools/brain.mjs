#!/usr/bin/env node
// COGGS Hit's migration memory: a thin wrapper over the gbrain CLI (garrytan/gbrain, MIT).
// Every solved upgrade cause is a markdown lesson in brain/lessons/ (committed) and a page in a
// local, keyless PGLite brain under brain/.gbrain/ (regenerable, ignored by gbrain's own .gitignore).
// Hit queries the brain before it plans a fix and adds a lesson once Auto passes the fix.
//
//   node tools/brain.mjs init                 create the brain if missing and index brain/lessons/
//   node tools/brain.mjs query "<symptom>"    top lessons for a symptom (--json, --limit n)
//   node tools/brain.mjs add <lesson.md>      check a lesson, copy it into brain/lessons/, index it
//
// gbrain is run from a checkout (GBRAIN_DIR, default ../gbrain beside this repo) with Bun 1.4.4+
// (GBRAIN_BUN, default <GBRAIN_DIR>/.rt/bun-windows-x64/bun.exe, else bun on PATH). Model API keys are
// removed from its environment, so no lesson text leaves the machine. BRAIN_HOME moves the brain.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LESSONS = path.join(ROOT, 'brain', 'lessons');
const REQUIRED = ['type', 'title', 'engine', 'from', 'to', 'symptom', 'cause', 'fix', 'result'];

function fail(message, code = 2) {
  process.stderr.write('brain: ' + message + '\n');
  process.exit(code);
}

function gbrainDir() {
  const dir = path.resolve(process.env.GBRAIN_DIR || path.join(ROOT, '..', 'gbrain'));
  if (!fs.existsSync(path.join(dir, 'src', 'cli.ts'))) {
    fail('no gbrain checkout at ' + dir + '. Clone https://github.com/garrytan/gbrain there (then bun install) or set GBRAIN_DIR.');
  }
  return dir;
}

function bunBin(dir) {
  if (process.env.GBRAIN_BUN) return process.env.GBRAIN_BUN;
  const local = path.join(dir, '.rt', 'bun-windows-x64', process.platform === 'win32' ? 'bun.exe' : 'bun');
  return fs.existsSync(local) ? local : 'bun';
}

function brainHome() {
  return path.resolve(process.env.BRAIN_HOME || path.join(ROOT, 'brain'));
}

function gbrain(args) {
  const dir = gbrainDir();
  const env = { ...process.env, GBRAIN_HOME: brainHome() };
  for (const k of Object.keys(env)) if (/^(OPENAI|ANTHROPIC|GOOGLE|GEMINI|VOYAGE|COHERE|XAI)_API_KEY$/.test(k)) delete env[k];
  const r = spawnSync(bunBin(dir), [path.join(dir, 'src', 'cli.ts'), ...args], { cwd: ROOT, env, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) fail('could not start gbrain: ' + r.error.message);
  if (r.status !== 0) fail('gbrain ' + args[0] + ' exited ' + r.status + ': ' + (r.stderr || r.stdout).trim().split('\n').slice(-4).join(' | '));
  return r.stdout;
}

// The lesson header is flat "key: value" YAML written by this tool's own format; values may be quoted.
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1');
  }
  return out;
}

function lessonFile(slug) {
  const p = path.join(LESSONS, slug + '.md');
  return fs.existsSync(p) ? p : null;
}

function init() {
  const home = brainHome();
  if (!fs.existsSync(path.join(home, '.gbrain', 'brain.pglite'))) {
    gbrain(['init', '--pglite', '--no-embedding', '--git']);
    gbrain(['config', 'set', 'memory.auto_writeback', 'off']);
  }
  const summary = JSON.parse(gbrain(['import', LESSONS, '--no-embed', '--json']));
  console.log('brain at ' + home + ': ' + summary.total_files + ' lessons, ' + summary.imported + ' new, ' + summary.unchanged + ' unchanged, ' + summary.errors + ' errors');
}

function query(text, { json, limit }) {
  const raw = gbrain(['search', text, '--json', '--limit', String(limit)]);
  const rows = JSON.parse(raw.slice(raw.indexOf('[')));
  const seen = new Set();
  const hits = [];
  for (const row of rows) {
    if (seen.has(row.slug)) continue;
    seen.add(row.slug);
    const file = lessonFile(row.slug);
    const fm = file ? frontmatter(fs.readFileSync(file, 'utf8')) || {} : {};
    hits.push({ slug: row.slug, title: row.title, score: row.score, symptom: fm.symptom, cause: fm.cause, fix: fm.fix, result: fm.result, file: file && path.relative(ROOT, file).split(path.sep).join('/') });
  }
  if (json) { console.log(JSON.stringify(hits, null, 2)); return; }
  if (!hits.length) { console.log('no lesson matches: ' + text); return; }
  for (const h of hits) console.log('[' + h.score + '] ' + h.slug + '\n  ' + h.title + '\n  cause: ' + h.cause + '\n  fix: ' + h.fix + '\n  file: ' + h.file);
}

function add(file) {
  if (!file || !fs.existsSync(file)) fail('add needs an existing lesson file, got ' + file);
  const text = fs.readFileSync(file, 'utf8');
  const fm = frontmatter(text);
  if (!fm) fail(file + ' has no --- frontmatter');
  const missing = REQUIRED.filter((k) => !fm[k]);
  if (missing.length) fail(file + ' lacks ' + missing.join(', '));
  if (fm.type !== 'lesson') fail(file + ' has type ' + fm.type + ', expected lesson');
  const dest = path.join(LESSONS, path.basename(file));
  if (path.resolve(file) !== dest) {
    if (fs.existsSync(dest) && fs.readFileSync(dest, 'utf8') !== text) fail(path.basename(file) + ' already exists in brain/lessons with other content; rename the lesson');
    fs.writeFileSync(dest, text);
  }
  gbrain(['import', dest, '--no-embed', '--json']);
  console.log('added ' + path.basename(dest, '.md'));
}

function main(argv) {
  const [cmd, ...rest] = argv;
  const json = rest.includes('--json');
  const li = rest.indexOf('--limit');
  const limit = li >= 0 ? Number(rest[li + 1]) : 3;
  const positional = rest.filter((a, i) => !a.startsWith('--') && !(li >= 0 && i === li + 1));
  if (cmd === 'init') return init();
  if (cmd === 'query') { if (!positional[0]) fail('query needs a symptom'); return query(positional.join(' '), { json, limit }); }
  if (cmd === 'add') return add(positional[0]);
  fail('usage: node tools/brain.mjs init | query "<symptom>" [--json] [--limit n] | add <lesson.md>');
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));

