// Plays one game folder along one route with a seeded, frozen-clock page and writes the captured frames.
// Determinism adapted from three.js test/e2e/deterministic-injection.js (MIT): seeded Math.random, frozen
// performance.now and Date.now, requestAnimationFrame drained by the player. Changed: randomness is split
// into one stream for three.js and one for the game, because r118 and r162 call Math.random a different
// number of times (MathUtils.generateUUID) and a shared stream would move every tree the game scatters.
// Usage: node auto/play.mjs --game <dir> --route <json> --out <dir> [--renderer swiftshader|gpu]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { serveGame, resolveThree, contentType } from './serve.mjs';

export const RENDERER_ARGS = {
  swiftshader: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  gpu: ['--enable-gpu', '--ignore-gpu-blocklist'],
};

// Runs in the page before any game script.
function pageClock(seeds) {
  const stream = (s) => () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const game = stream(seeds.game), three = stream(seeds.three);
  const calls = { game: 0, three: 0 };
  Math.random = function random() {
    const caller = (new Error().stack || '').split('\n')[2] || '';
    if (/\/npm\/three@|\/three@[0-9.]+\/|\/ajax\/libs\/three\.js\/|\/three(\.module)?(\.min)?\.js/.test(caller)) { calls.three++; return three(); }
    calls.game++;
    return game();
  };
  let now = 0;
  performance.now = () => now;
  Date.now = () => 1762646400000 + now;
  const queue = [];
  window.requestAnimationFrame = (cb) => { queue.push(cb); return queue.length; };
  window.cancelAnimationFrame = () => {};
  window.__autoCalls = () => calls;
  window.__autoStep = (selector, capture) => {
    now += 1000 / 60;
    for (const cb of queue.splice(0)) cb(now);
    if (!capture) return null;
    const canvas = document.querySelector(selector);
    return canvas ? canvas.toDataURL('image/png') : null;
  };
}

export function readRoute(file) {
  const route = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const k of ['url', 'canvas', 'steps', 'capture', 'inputs', 'seeds', 'viewport']) {
    if (route[k] === undefined) throw new Error(file + ': missing ' + k);
  }
  return route;
}

export async function play({ gameDir, route, outDir, renderer = 'swiftshader', log = () => {} }) {
  if (!RENDERER_ARGS[renderer]) throw new Error('unknown renderer ' + renderer);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const started = Date.now();
  const run = {
    game: path.resolve(gameDir), renderer, seeds: route.seeds, steps: route.steps, capture: route.capture,
    pageErrors: [], consoleErrors: [], failedRequests: [], three: {}, outsideRequests: [], frames: {},
  };
  const server = await serveGame(gameDir);
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: RENDERER_ARGS[renderer] });
    const context = await browser.newContext({ viewport: route.viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.addInitScript(pageClock, route.seeds);

    let inflight = 0, lastNet = Date.now();
    page.on('request', () => { inflight++; lastNet = Date.now(); });
    page.on('requestfinished', () => { inflight--; lastNet = Date.now(); });
    page.on('requestfailed', (r) => { inflight--; lastNet = Date.now(); run.failedRequests.push(r.url() + ' ' + ((r.failure() || {}).errorText || '')); });
    page.on('response', (r) => { if (r.status() >= 400) run.failedRequests.push(r.status() + ' ' + r.url()); });
    page.on('pageerror', (e) => run.pageErrors.push(String((e && e.message) || e)));
    page.on('console', (m) => { if (m.type() === 'error') run.consoleErrors.push(m.text()); });

    await page.route((u) => !u.href.startsWith(server.url), async (r) => {
      const url = r.request().url();
      const hit = resolveThree(url);
      if (hit && hit.file && fs.existsSync(hit.file)) {
        run.three[hit.spec] = hit.version;
        return r.fulfill({ status: 200, headers: { 'content-type': contentType(hit.file), 'access-control-allow-origin': '*' }, body: fs.readFileSync(hit.file) });
      }
      // Not pinned in package.json: fetched live and listed, so a reader sees the replay left the machine.
      run.outsideRequests.push(url);
      return r.continue();
    });

    await page.goto(server.url + route.url, { waitUntil: 'load', timeout: 180000 });
    const quietMs = route.ready?.quietMs ?? 3000;
    const t0 = Date.now();
    for (;;) {
      const hasCanvas = await page.evaluate((s) => !!document.querySelector(s), route.canvas);
      if (hasCanvas && inflight === 0 && Date.now() - lastNet >= quietMs) break;
      if (!hasCanvas && inflight === 0 && Date.now() - lastNet >= quietMs * 3) { run.noCanvas = true; break; }
      if (Date.now() - t0 > 240000) { run.readyTimeout = true; break; }
      await page.waitForTimeout(100);
    }
    run.readySeconds = (Date.now() - started) / 1000;
    log('ready after ' + run.readySeconds + ' s');

    const at = (field) => {
      const m = new Map();
      for (const i of route.inputs) m.set(i[field], [...(m.get(i[field]) || []), i.key]);
      return m;
    };
    const downs = at('down'), ups = at('up');
    for (let step = 1; step <= route.steps; step++) {
      for (const k of ups.get(step) || []) await page.keyboard.up(k);
      for (const k of downs.get(step) || []) await page.keyboard.down(k);
      const capture = route.capture.includes(step);
      const data = await page.evaluate(([s, c]) => window.__autoStep(s, c), [route.canvas, capture]);
      if (!capture) continue;
      const name = 'f' + String(step).padStart(3, '0');
      if (!data) {
        fs.writeFileSync(path.join(outDir, name + '.png'), await page.screenshot());
        run.frames[name] = { step, canvas: false };
        continue;
      }
      const png = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
      fs.writeFileSync(path.join(outDir, name + '.png'), png);
      const img = PNG.sync.read(png);
      run.frames[name] = { step, canvas: true, width: img.width, height: img.height, sha256: crypto.createHash('sha256').update(img.data).digest('hex') };
    }
    run.randomCalls = await page.evaluate(() => window.__autoCalls());
  } catch (e) {
    run.playerError = String((e && e.stack) || e);
  } finally {
    run.seconds = (Date.now() - started) / 1000;
    fs.writeFileSync(path.join(outDir, 'run.json'), JSON.stringify(run, null, 2) + '\n');
    if (browser) await browser.close().catch(() => {});
    await server.close();
  }
  return run;
}

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const next = argv[i + 1];
    out[argv[i].slice(2)] = next === undefined || next.startsWith('--') ? true : (i++, next);
  }
  return out;
}

export const isMain = (url) => process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(url);

if (isMain(import.meta.url)) {
  const a = parseArgs(process.argv.slice(2));
  const watchdog = setTimeout(() => { console.error('play: watchdog 600 s'); process.exit(3); }, 600000);
  const run = await play({ gameDir: a.game, route: readRoute(a.route), outDir: a.out, renderer: a.renderer || 'swiftshader', log: (m) => console.error(m) });
  clearTimeout(watchdog);
  console.log(JSON.stringify({ seconds: run.seconds, pageErrors: run.pageErrors.length, playerError: run.playerError || null, frames: Object.keys(run.frames) }));
  process.exitCode = run.playerError ? 2 : 0;
}
