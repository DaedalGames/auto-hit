// Turns out/raw.json into out/verdict.json and out/comment.md. The verdict is arithmetic on raw.json, so
// no model is needed for PASS or FAIL; a model may only add words to the comment (.coggs/verdict.md).
// Usage: node auto/verdict.mjs --out <dir> [--frames-url <url ending in />]
import fs from 'node:fs';
import path from 'node:path';
import { MAX_DIFFERENT_PCT, PIXEL_THRESHOLD } from './compare.mjs';
import { parseArgs, isMain } from './play.mjs';

export const MARKER = '<!-- coggs-auto -->';
const FENCE = '\u0060\u0060\u0060';
const two = (x) => (x === null || x === undefined ? null : Math.round(x * 100) / 100);

export function judgeGame(g) {
  const frames = g.frames.map((f) => {
    const reasons = [];
    if (!f.baseCanvas) reasons.push('base drew no canvas');
    if (!f.headCanvas) reasons.push('head drew no canvas');
    if (f.baseCanvas && f.headCanvas && !f.comparable) reasons.push(f.reason);
    if (f.comparable && f.differPct > MAX_DIFFERENT_PCT) reasons.push(two(f.differPct) + '% of pixels differ');
    return { name: f.name, step: f.step, differPct: f.comparable ? two(f.differPct) : null, baseLuma: two(f.baseLuma), headLuma: two(f.headLuma), pass: reasons.length === 0, reasons };
  });
  const reasons = [];
  if (g.newPageErrors.length) reasons.push(g.newPageErrors.length + ' new page error(s)');
  if (g.head.playerError) reasons.push('player error on head: ' + g.head.playerError.split('\n')[0]);
  if (g.base.playerError) reasons.push('player error on base: ' + g.base.playerError.split('\n')[0]);
  const pass = reasons.length === 0 && frames.every((f) => f.pass);
  return { game: g.game, route: g.route, verdict: pass ? 'PASS' : 'FAIL', frames, newPageErrors: g.newPageErrors, newConsoleErrors: g.newConsoleErrors, three: { base: g.base.three, head: g.head.three }, reasons };
}

export function judge(raw) {
  const games = raw.games.map(judgeGame);
  return {
    verdict: games.every((g) => g.verdict === 'PASS') ? 'PASS' : 'FAIL',
    rule: { pixelThreshold: PIXEL_THRESHOLD, maxDifferentPct: MAX_DIFFERENT_PCT, newPageErrorFails: true },
    renderer: raw.renderer,
    base: raw.base,
    head: raw.head,
    skipped: raw.skipped,
    games,
  };
}

const versions = (m) => [...new Set(Object.values(m || {}))].sort().join(', ') || 'none';

export function renderComment(v, { framesUrl } = {}) {
  const img = (game, file) => (framesUrl || '') + game + '/' + file;
  const mark = (pass) => (pass ? '✅ PASS' : '❌ FAIL');
  const lines = [MARKER, '## 🎮 COGGS Auto played this PR · ' + mark(v.verdict === 'PASS'), ''];
  if (!v.games.length) lines.push('No game folder changed in this pull request, so nothing was played.', '');
  for (const g of v.games) {
    lines.push('### ' + FENCE.slice(0, 1) + g.game + FENCE.slice(0, 1) + ' · ' + mark(g.verdict === 'PASS'), '');
    lines.push('three.js ' + versions(g.three.base) + ' → ' + versions(g.three.head) + '. Same seed, same inputs (route ' + FENCE.slice(0, 1) + g.route + FENCE.slice(0, 1) + '), same renderer (' + v.renderer +
      ') on base and head. Rule: three.js e2e, a frame fails above ' + v.rule.maxDifferentPct + '% different pixels, and any new page error fails the run.', '');
    lines.push('| Frame | base | head | diff | Differ |', '| --- | --- | --- | --- | --- |');
    for (const f of g.frames) {
      const pct = f.differPct === null ? '' : f.differPct.toFixed(2) + '% ';
      const cell = f.pass ? pct + '✅' : pct + '❌ ' + f.reasons.join('; ');
      const diff = f.differPct === null ? 'n/a' : '![diff ' + f.name + '](' + img(g.game, f.name + '-diff.png') + ')';
      lines.push('| step ' + f.step + ' | ![base ' + f.name + '](' + img(g.game, f.name + '-base.jpg') + ') | ![head ' + f.name + '](' + img(g.game, f.name + '-head.jpg') + ') | ' + diff + ' | ' + cell + ' |');
    }
    lines.push('');
    if (g.newPageErrors.length) lines.push('**New page errors on head**', '', FENCE + 'text', ...g.newPageErrors, FENCE, '');
    else lines.push('New page errors: none.', '');
    if (g.newConsoleErrors.length) {
      lines.push('<details><summary>New console errors on head (' + g.newConsoleErrors.length + ')</summary>', '', FENCE + 'text', ...g.newConsoleErrors.slice(0, 20), FENCE, '', '</details>', '');
    }
    const runReasons = g.reasons.filter((r) => !r.endsWith('new page error(s)'));
    if (runReasons.length) lines.push('Run: ' + runReasons.join('; ') + '.', '');
  }
  if (v.skipped && v.skipped.length) lines.push('Not played (folder unchanged): ' + v.skipped.join(', ') + '.', '');
  const sha = (s) => FENCE.slice(0, 1) + String(s || 'local').slice(0, 7) + FENCE.slice(0, 1);
  lines.push('<sub>base ' + sha(v.base.sha) + ' · head ' + sha(v.head.sha) + ' · red in the diff column = pixels over the threshold</sub>');
  return lines.join('\n') + '\n';
}

export function writeVerdict(outDir, opts = {}) {
  const raw = JSON.parse(fs.readFileSync(path.join(outDir, 'raw.json'), 'utf8'));
  const v = judge(raw);
  fs.writeFileSync(path.join(outDir, 'verdict.json'), JSON.stringify(v, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'comment.md'), renderComment(v, opts));
  return v;
}

if (isMain(import.meta.url)) {
  const a = parseArgs(process.argv.slice(2));
  const v = writeVerdict(typeof a.out === 'string' ? a.out : 'out', { framesUrl: typeof a['frames-url'] === 'string' ? a['frames-url'] : '' });
  console.log(v.verdict);
}
