import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Runs the real gbrain CLI against a scratch brain, so the committed lessons are indexed from zero.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAIN = path.join(ROOT, 'tools', 'brain.mjs');
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-test-'));
const run = (...args) => spawnSync(process.execPath, [BRAIN, ...args], { cwd: ROOT, env: { ...process.env, BRAIN_HOME: home }, encoding: 'utf8', windowsHide: true });
after(() => fs.rmSync(home, { recursive: true, force: true }));

test('init indexes every committed lesson', { timeout: 180000 }, () => {
  const r = run('init');
  assert.equal(r.status, 0, r.stderr);
  const count = fs.readdirSync(path.join(ROOT, 'brain', 'lessons')).filter((f) => f.endsWith('.md')).length;
  assert.match(r.stdout, new RegExp(count + ' lessons'));
});

test('a washed-out color symptom returns the FBXLoader sRGB lesson first', { timeout: 60000 }, () => {
  const r = run('query', 'colors washed out after three upgrade', '--json');
  assert.equal(r.status, 0, r.stderr);
  const hits = JSON.parse(r.stdout);
  assert.equal(hits[0].slug, 'three-r162-fbxloader-srgb');
  assert.match(hits[0].fix, /linear back to sRGB/);
});

test('a shader compile error returns the GLSL3 lesson first', { timeout: 60000 }, () => {
  const hits = JSON.parse(run('query', '#version directive must occur before anything else', '--json').stdout);
  assert.equal(hits[0].slug, 'three-r162-glsl3-version-directive');
});

test('add refuses a lesson without a fix and indexes a complete one', { timeout: 60000 }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-lesson-'));
  const bad = path.join(dir, 'zz-bad.md');
  fs.writeFileSync(bad, '---\ntype: lesson\ntitle: "x"\nengine: three\nfrom: r1\nto: r2\nsymptom: "s"\ncause: "c"\nresult: "r"\n---\n');
  const refused = run('add', bad);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /lacks fix/);
  // A complete lesson goes into a scratch lessons copy, so the committed folder is not touched.
  const good = path.join(dir, 'zz-quokka-tilemap.md');
  fs.writeFileSync(good, '---\ntype: lesson\ntitle: "quokka tilemap test lesson"\nengine: phaser\nfrom: 3.60\nto: 3.80\nsymptom: "quokkaglyph tiles vanish"\ncause: "c"\nfix: "f"\nresult: "r"\n---\n\nquokkaglyph tiles vanish after the upgrade.\n');
  const lessonsCopy = path.join(ROOT, 'brain', 'lessons', 'zz-quokka-tilemap.md');
  try {
    assert.equal(run('add', good).status, 0);
    assert.equal(JSON.parse(run('query', 'quokkaglyph tiles vanish', '--json').stdout)[0].slug, 'zz-quokka-tilemap');
  } finally {
    fs.rmSync(lessonsCopy, { force: true });
  }
});

