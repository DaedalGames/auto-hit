#!/usr/bin/env node
// Reads the COGGS ontology in .coggs/ontology and answers two questions for Hit, Auto and the review comment:
// which engine faces and probes a verdict symptom points at (route), and how much of the taxonomy runs today (coverage).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, '.coggs', 'ontology');
const CITE = 'Daedal Games game-domain ontology';

export function loadOntology(dir = DIR) {
  const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const faces = read('faces.json');
  return { lanes: faces.lanes, faces: faces.faces, risks: faces.risks, probes: read('probes.json').probes, upkeep: read('upkeep.json').items };
}

export const cite = (s) => CITE + ', ' + s.doc + ' ' + s.anchor;

// Every problem that makes an entry untrustworthy: a missing source, a dangling reference, or a guide quote the guide no longer holds.
export function validate(o, root = ROOT) {
  const errors = [];
  const ids = (list) => new Set(list.map((x) => x.id));
  const faceIds = ids(o.faces), laneIds = ids(o.lanes), probeIds = ids(o.probes);
  const checkSource = (kind, e) => {
    const s = e.source || {};
    for (const k of ['doc', 'anchor', 'note']) if (typeof s[k] !== 'string' || !s[k].trim()) errors.push(kind + ' ' + e.id + ': source.' + k + ' is empty');
  };
  const guides = new Map();
  const guide = (rel) => { if (!guides.has(rel)) { const f = path.join(root, rel); guides.set(rel, fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null); } return guides.get(rel); };
  for (const [kind, list] of [['face', o.faces], ['risk', o.risks], ['probe', o.probes], ['upkeep', o.upkeep]]) {
    const seen = new Set();
    for (const e of list) { if (seen.has(e.id)) errors.push(kind + ' ' + e.id + ': duplicate id'); seen.add(e.id); checkSource(kind, e); }
  }
  for (const f of o.faces) for (const p of f.probes) if (!probeIds.has(p)) errors.push('face ' + f.id + ': unknown probe ' + p);
  for (const p of o.probes) if (!faceIds.has(p.face)) errors.push('probe ' + p.id + ': unknown face ' + p.face);
  for (const r of o.risks) {
    for (const f of r.faces) if (!faceIds.has(f)) errors.push('risk ' + r.id + ': unknown face ' + f);
    for (const l of r.lanes) if (!laneIds.has(l)) errors.push('risk ' + r.id + ': unknown lane ' + l);
    for (const l of r.partialLanes || []) if (!laneIds.has(l)) errors.push('risk ' + r.id + ': unknown partial lane ' + l);
    for (const p of r.probes) if (!probeIds.has(p)) errors.push('risk ' + r.id + ': unknown probe ' + p);
    if (!r.lanes.length) errors.push('risk ' + r.id + ': no lane catches it');
    for (const e of r.engine) {
      const text = guide(e.guide);
      if (text === null) errors.push('risk ' + r.id + ': guide ' + e.guide + ' is missing');
      else if (!text.includes(e.says)) errors.push('risk ' + r.id + ': guide ' + e.guide + ' no longer says: ' + e.says);
    }
  }
  return errors;
}

// Anchors are checked against the ontology itself only where a checkout is named, since the ontology is private.
export function validateAnchors(o, ontologyDir) {
  const errors = [];
  const all = [...o.faces, ...o.risks, ...o.probes, ...o.upkeep];
  for (const e of all) {
    const f = path.join(ontologyDir, e.source.doc);
    if (!fs.existsSync(f)) { errors.push(e.id + ': ' + e.source.doc + ' is missing'); continue; }
    const text = fs.readFileSync(f, 'utf8');
    const needle = e.source.anchor.startsWith('#') ? e.source.anchor : 'id: ' + e.source.anchor;
    if (!text.split(/\r?\n/).some((line) => line.trim() === needle)) errors.push(e.id + ': ' + e.source.doc + ' has no ' + needle);
  }
  return errors;
}

const fileHas = (root, rel, needle) => { const f = path.join(root, rel); return fs.existsSync(f) && (needle === '' || fs.readFileSync(f, 'utf8').includes(needle)); };
const liveDetect = (root, detect) => detect.length > 0 && detect.every((d) => fileHas(root, d.file, d.contains));

// A probe runs today only when code under auto/ names its id.
function probeRuns(root, id) {
  const dir = path.join(root, 'auto');
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).some((f) => fs.readFileSync(path.join(dir, f), 'utf8').includes("'" + id + "'"));
}

export function coverage(o, root = ROOT) {
  const lanes = o.lanes.map((l) => ({ id: l.id, name: l.name, live: liveDetect(root, l.detect) }));
  const live = new Set(lanes.filter((l) => l.live).map((l) => l.id));
  // A risk is caught when a lane that reliably shows it runs; a partial lane (one that shows it only in some games) makes it partly caught.
  const risks = o.risks.map((r) => {
    const liveLanes = r.lanes.filter((l) => live.has(l));
    const livePartial = (r.partialLanes || []).filter((l) => live.has(l));
    return { id: r.id, lanes: r.lanes, liveLanes, livePartial, missingLanes: r.lanes.filter((l) => !live.has(l)), state: liveLanes.length ? 'caught' : livePartial.length ? 'partial' : 'missed' };
  });
  const faces = o.faces.map((f) => {
    const mine = risks.filter((r) => o.risks.find((x) => x.id === r.id).faces.includes(f.id));
    const caught = mine.filter((r) => r.state === 'caught').length;
    const partial = mine.filter((r) => r.state === 'partial').length;
    const probes = f.probes.filter((p) => probeRuns(root, p)).length;
    return { id: f.id, name: f.name, risks: mine.length, caught, partial, covered: mine.length > 0 && caught === mine.length, probes: f.probes.length, probesLive: probes };
  });
  const upkeep = o.upkeep.map((u) => ({ id: u.id, item: u.item, done: liveDetect(root, u.detect), humanGate: u.humanGate }));
  const probesLive = o.probes.filter((p) => probeRuns(root, p.id)).length;
  return {
    lanes, faces, risks, upkeep,
    totals: {
      faces: { covered: faces.filter((f) => f.covered).length, total: faces.length },
      risks: { caught: risks.filter((r) => r.state === 'caught').length, partial: risks.filter((r) => r.state === 'partial').length, total: risks.length },
      lanes: { live: live.size, total: lanes.length },
      probes: { live: probesLive, total: o.probes.length },
      upkeep: { done: upkeep.filter((u) => u.done).length, total: upkeep.length, humanGates: upkeep.filter((u) => u.humanGate).length },
    },
  };
}

// Scores each risk by how many of its symptom words the text holds: a phrase counts 3, a single word 1, a matching face word 0.5.
export function route(o, query, limit = 3) {
  const q = query.toLowerCase();
  const hit = (k) => q.includes(k.toLowerCase());
  const faceScore = new Map(o.faces.map((f) => [f.id, f.keywords.filter(hit).length * 0.5]));
  const scored = o.risks.map((r) => {
    const words = r.keywords.filter(hit);
    const score = words.reduce((s, k) => s + (k.includes(' ') ? 3 : 1), 0) + r.faces.reduce((s, f) => s + faceScore.get(f), 0);
    return { risk: r, score, words };
  }).filter((x) => x.words.length > 0).sort((a, b) => b.score - a.score || a.risk.id.localeCompare(b.risk.id)).slice(0, limit);
  const faces = [];
  for (const s of scored) for (const f of s.risk.faces) if (!faces.includes(f)) faces.push(f);
  const probes = [];
  for (const s of scored) for (const p of s.risk.probes) if (!probes.includes(p)) probes.push(p);
  const byId = new Map(o.probes.map((p) => [p.id, p]));
  return {
    query,
    faces,
    risks: scored.map((s) => ({ id: s.risk.id, score: s.score, matched: s.words, title: s.risk.title, symptom: s.risk.symptom, breaks: s.risk.breaks, lanes: s.risk.lanes, partialLanes: s.risk.partialLanes || [], guide: s.risk.engine.map((e) => e.says), source: cite(s.risk.source) })),
    probes: probes.map((id) => ({ id, input: byId.get(id).input, observe: byId.get(id).observe, source: cite(byId.get(id).source) })),
  };
}

export function routeMarkdown(r) {
  if (!r.risks.length) return 'Ontology route: no engine face matches "' + r.query + '".\n';
  const lines = ['Ontology route for "' + r.query + '": likely faces ' + r.faces.join(', ') + '.', ''];
  for (const k of r.risks) {
    lines.push('- **' + k.id + '** (' + k.title + '). ' + k.breaks + ' Symptom: ' + k.symptom + '. Caught by ' + k.lanes.join(', ') + (k.partialLanes.length ? ', sometimes by ' + k.partialLanes.join(', ') : '') + '.');
    for (const g of k.guide) lines.push('  - guide: ' + g);
    lines.push('  - source: ' + k.source);
  }
  lines.push('', 'Probes to run:');
  for (const p of r.probes) lines.push('- ' + p.id + ': ' + p.input + ' Observe: ' + p.observe);
  return lines.join('\n') + '\n';
}

function coverageText(c) {
  const t = c.totals;
  const lines = [
    'faces covered by Auto today: ' + t.faces.covered + '/' + t.faces.total + ' (every upgrade risk of the face has a lane that runs and reliably shows it)',
    'upgrade risks caught today: ' + t.risks.caught + '/' + t.risks.total + ', seen only sometimes: ' + t.risks.partial + ', missed: ' + (t.risks.total - t.risks.caught - t.risks.partial),
    'Auto lanes running: ' + t.lanes.live + '/' + t.lanes.total + ' (' + c.lanes.filter((l) => !l.live).map((l) => l.id).join(', ') + ' not built)',
    'breadth-first-qa probes running: ' + t.probes.live + '/' + t.probes.total,
    'upkeep items Hit does today: ' + t.upkeep.done + '/' + t.upkeep.total + ' (' + t.upkeep.humanGates + ' need a person)',
    '',
    'face        caught  partly  probes live',
  ];
  for (const f of c.faces) lines.push(f.id.padEnd(12) + String(f.caught + '/' + f.risks).padEnd(8) + String(f.partial).padEnd(8) + f.probesLive + '/' + f.probes + (f.covered ? '' : '  <- gap'));
  const waiting = c.risks.filter((r) => r.state !== 'caught');
  if (waiting.length) { lines.push('', 'risks that wait on a lane not built:'); for (const r of waiting) lines.push('- ' + r.id + ' (' + r.state + '): needs ' + r.missingLanes.join(', ')); }
  return lines.join('\n') + '\n';
}

function main(argv) {
  const [cmd, ...rest] = argv;
  const json = rest.includes('--json');
  const args = rest.filter((a) => a !== '--json');
  const o = loadOntology();
  const errors = validate(o);
  if (errors.length) { process.stderr.write(errors.join('\n') + '\n'); return 1; }
  if (cmd === 'route') {
    const query = args.join(' ').trim();
    if (!query) { process.stderr.write('usage: node tools/ontology.mjs route "<verdict symptoms or page error>" [--json]\n'); return 2; }
    const r = route(o, query);
    process.stdout.write(json ? JSON.stringify(r, null, 2) + '\n' : routeMarkdown(r));
    return r.risks.length ? 0 : 1;
  }
  if (cmd === 'coverage') { const c = coverage(o); process.stdout.write(json ? JSON.stringify(c, null, 2) + '\n' : coverageText(c)); return 0; }
  if (cmd === 'check') {
    const dir = process.env.DAEDAL_ONTOLOGY_DIR;
    const more = dir ? validateAnchors(o, dir) : [];
    if (more.length) { process.stderr.write(more.join('\n') + '\n'); return 1; }
    process.stdout.write('ontology ok: ' + o.faces.length + ' faces, ' + o.risks.length + ' risks, ' + o.probes.length + ' probes, ' + o.upkeep.length + ' upkeep items' + (dir ? ', anchors checked' : '') + '\n');
    return 0;
  }
  process.stderr.write('usage: node tools/ontology.mjs route "<symptoms>" | coverage | check [--json]\n');
  return 2;
}

if (fs.realpathSync(process.argv[1] || '') === fs.realpathSync(fileURLToPath(import.meta.url))) process.exitCode = main(process.argv.slice(2));

