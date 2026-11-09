import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadOntology, validate, validateAnchors, route, coverage } from './ontology.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = path.join(ROOT, 'tools', 'ontology.mjs');
const run = (...args) => spawnSync(process.execPath, [TOOL, ...args], { cwd: ROOT, encoding: 'utf8', windowsHide: true });

test('the committed ontology has a source on every entry and every guide quote still in its guide', () => {
  assert.deepEqual(validate(loadOntology()), []);
});

test('an entry that loses its source goes red', () => {
  for (const kind of ['faces', 'risks', 'probes', 'upkeep']) {
    const o = loadOntology();
    o[kind][0].source = { doc: o[kind][0].source.doc, anchor: '', note: '' };
    const errors = validate(o);
    assert.ok(errors.some((e) => e.includes(o[kind][0].id) && e.includes('source.anchor')), kind + ': ' + errors.join('; '));
  }
});

test('a guide quote the guide does not hold goes red', () => {
  const o = loadOntology();
  o.risks[0].engine[0].says = 'three.js never said this';
  assert.ok(validate(o).some((e) => e.includes('no longer says')));
});

test('washed-out colors on loaded models route to loaders and color', () => {
  const r = route(loadOntology(), 'colors washed out on loaded models');
  assert.equal(r.risks[0].id, 'loaders/color-space');
  assert.deepEqual(r.faces.slice(0, 2), ['loaders', 'color']);
  assert.ok(r.probes.some((p) => p.id === 'color.mean-luminance'));
});

test('a page error routes by its message', () => {
  const r = route(loadOntology(), 'TypeError: THREE.Geometry is not a constructor');
  assert.equal(r.risks[0].id, 'loaders/geometry-removed');
});

test('coverage counts lanes from the code, so the unbuilt breadth lane is not counted', () => {
  const c = coverage(loadOntology());
  assert.equal(c.lanes.find((l) => l.id === 'frames').live, true);
  assert.equal(c.lanes.find((l) => l.id === 'breadth-first-qa').live, false);
  assert.ok(c.totals.faces.total >= 8);
  assert.ok(c.totals.faces.covered <= c.totals.faces.total);
});

test('the CLI answers route and coverage', () => {
  const r = run('route', 'colors washed out on loaded models', '--json');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).risks[0].id, 'loaders/color-space');
  const c = run('coverage');
  assert.equal(c.status, 0, c.stderr);
  assert.match(c.stdout, /faces covered by Auto today: \d+\/\d+/);
});

test('anchors exist in the ontology checkout when one is named', { skip: !process.env.DAEDAL_ONTOLOGY_DIR && 'set DAEDAL_ONTOLOGY_DIR to check anchors' }, () => {
  assert.deepEqual(validateAnchors(loadOntology(), process.env.DAEDAL_ONTOLOGY_DIR), []);
});

