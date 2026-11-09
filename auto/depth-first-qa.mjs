// COGGS Auto depth-first QA: replays each changed game on base and head along the same route, seed and
// renderer, compares the captured frames and writes out/raw.json, out/verdict.json and out/comment.md.
// Two ways to name the games:
//   this repository's fixtures: --base <repo> --head <repo> [--games changed|all|a,b], routes from .coggs/depth-first-qa/<game>.json here
//   one game in any repository: --route <json> --base-game <dir> --head-game <dir> [--game <name>] [--games changed|all]
// Either way the route is read from the base side, so a pull request cannot change it.
// Common: [--out out] [--renderer swiftshader|gpu] [--base-sha <sha>] [--head-sha <sha>] [--frames-url <url ending in />]
// Exits 0 on PASS, 1 on FAIL.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import { play, readRoute, parseArgs, isMain } from './play.mjs';
import { compareFrames } from './compare.mjs';
import { writeVerdict } from './verdict.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROUTES = path.join(ROOT, '.coggs', 'depth-first-qa');

// One hash over every file path and its bytes, to tell whether a game folder changed between base and head.
function treeHash(dir) {
  const h = crypto.createHash('sha256');
  if (!fs.existsSync(dir)) return null;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else { h.update(path.relative(dir, p).split(path.sep).join('/') + '\0'); h.update(fs.readFileSync(p)); }
    }
  };
  walk(dir);
  return h.digest('hex');
}

function toJpeg(pngFile, jpgFile) {
  const img = PNG.sync.read(fs.readFileSync(pngFile));
  fs.writeFileSync(jpgFile, jpeg.encode({ data: img.data, width: img.width, height: img.height }, 85).data);
}

// Errors head shows that base did not, each message compared whole.
function newOnly(head, base) {
  const left = [...base];
  return head.filter((m) => { const i = left.indexOf(m); if (i >= 0) { left.splice(i, 1); return false; } return true; });
}

// The fixture games under games/ in base and head, each with its route in this checkout.
export function fixtureTargets(base, head, games) {
  const all = fs.readdirSync(ROUTES).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
  const names = games === 'all' || games === 'changed' ? all : games.split(',');
  return names.map((game) => ({ game, routeFile: path.join(ROUTES, game + '.json'), baseDir: path.join(base, 'games', game), headDir: path.join(head, 'games', game) }));
}

export async function depthFirstQa({ targets, base, head, out, games = 'changed', renderer = 'swiftshader', baseSha = null, headSha = null, framesUrl = '', log = console.error }) {
  fs.mkdirSync(out, { recursive: true });
  const raw = { renderer, base: { sha: baseSha }, head: { sha: headSha }, games: [], skipped: [] };
  for (const { game, routeFile, baseDir, headDir } of targets || fixtureTargets(base, head, games)) {
    if (!fs.existsSync(headDir) || !fs.existsSync(baseDir)) { raw.skipped.push(game); continue; }
    if (games === 'changed' && treeHash(baseDir) === treeHash(headDir)) { raw.skipped.push(game); continue; }
    const route = readRoute(routeFile);
    const dir = path.join(out, game);
    fs.rmSync(dir, { recursive: true, force: true });
    const sides = {};
    for (const side of ['base', 'head']) {
      log(game + ': playing ' + side);
      sides[side] = await play({ gameDir: side === 'base' ? baseDir : headDir, route, outDir: path.join(dir, side), renderer, log: (m) => log(game + ' ' + side + ': ' + m) });
    }
    const frames = route.capture.map((step) => {
      const name = 'f' + String(step).padStart(3, '0');
      const b = sides.base.frames[name] || {}, h = sides.head.frames[name] || {};
      const row = { name, step, baseCanvas: !!b.canvas, headCanvas: !!h.canvas, comparable: false };
      const bp = path.join(dir, 'base', name + '.png'), hp = path.join(dir, 'head', name + '.png');
      if (fs.existsSync(bp)) toJpeg(bp, path.join(dir, name + '-base.jpg'));
      if (fs.existsSync(hp)) toJpeg(hp, path.join(dir, name + '-head.jpg'));
      if (b.canvas && h.canvas) Object.assign(row, compareFrames(bp, hp, path.join(dir, name + '-diff.png')));
      return row;
    });
    const summary = (r) => ({ three: r.three, pageErrors: r.pageErrors, consoleErrors: r.consoleErrors, failedRequests: r.failedRequests, outsideRequests: r.outsideRequests, randomCalls: r.randomCalls, readySeconds: r.readySeconds, seconds: r.seconds, noCanvas: !!r.noCanvas, readyTimeout: !!r.readyTimeout, playerError: r.playerError || null });
    raw.games.push({
      game, route: path.basename(path.dirname(routeFile)) + '/' + path.basename(routeFile), seeds: route.seeds, steps: route.steps,
      base: summary(sides.base), head: summary(sides.head), frames,
      newPageErrors: newOnly(sides.head.pageErrors, sides.base.pageErrors),
      newConsoleErrors: newOnly(sides.head.consoleErrors, sides.base.consoleErrors),
    });
  }
  fs.writeFileSync(path.join(out, 'raw.json'), JSON.stringify(raw, null, 2) + '\n');
  return writeVerdict(out, { framesUrl });
}

if (isMain(import.meta.url)) {
  const a = parseArgs(process.argv.slice(2));
  const str = (k, d) => (typeof a[k] === 'string' ? a[k] : d);
  const one = str('route', null);
  const targets = one && [{ game: str('game', path.basename(path.resolve(str('head-game', '.')))), routeFile: one, baseDir: str('base-game', '.'), headDir: str('head-game', '.') }];
  const watchdog = setTimeout(() => { console.error('depth-first-qa: watchdog 1500 s'); process.exit(3); }, 1500000);
  const v = await depthFirstQa({
    targets, base: str('base', '.'), head: str('head', '.'), out: str('out', 'out'), games: str('games', 'changed'), renderer: str('renderer', 'swiftshader'),
    baseSha: str('base-sha', null), headSha: str('head-sha', null), framesUrl: str('frames-url', ''),
  });
  clearTimeout(watchdog);
  for (const g of v.games) console.log(g.game + ' ' + g.verdict + ' ' + g.frames.map((f) => 'step ' + f.step + ' ' + (f.differPct === null ? 'n/a' : f.differPct + '%')).join(', ') + (g.newPageErrors.length ? ' | ' + g.newPageErrors[0] : ''));
  console.log(v.verdict);
  process.exitCode = v.verdict === 'PASS' ? 0 : 1;
}
