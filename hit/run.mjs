// COGGS Hit's local driver for one game in this monorepo. It files an issue saying how far the game's
// engine is behind, opens the upgrade pull request that fixes it, and after every failed COGGS Auto
// verdict pushes one fix written by claude -p, keeping one status comment edited in place. On PASS it
// squash-merges so the closing keyword closes the issue, deletes the branch and reads the link back.
// Hit runs on this machine with the signed-in claude CLI; git and gh act as the maintainer, so every
// push starts the COGGS Auto workflow in GitHub Actions.
// Usage: node hit/run.mjs --game games/<name> --dep three --from <v> --to <v>
//          [--repo DaedalGames/auto-hit] [--pr <n>] [--max-fixes 6] [--no-brain] [--no-merge]
// On PASS Hit squash-merges and keeps the branch as an archive; --no-merge stops at PASS instead.
// The cap counts fix(hit) commits on the branch, so resuming a PR with 3 fixes and a cap of 6 allows 3 more.
//        node hit/run.mjs ... --local --verdict <file> [--branch <name>]   one fix on a local branch, nothing pushed
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guideName } from './guide.mjs';

const HIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLAUDE_TIMEOUT_MS = 10 * 60 * 1000;
const WORKFLOW = 'coggs-auto.yml';
const CI_TIMEOUT_MS = 40 * 60 * 1000;
const POLL_MS = 20 * 1000;
const MARKER = '<!-- coggs-hit -->';
// Paths Hit never edits, whatever GAME_DIR says: Auto's player, routes, verdict prompt, workflows, Hit itself.
const FORBIDDEN = ['.github/', '.coggs/', 'auto/', 'hit/', 'tools/', 'brain/'];

// Spawns without a console window and kills the whole tree when the deadline passes.
// A gh call that dies in transport (a dropped Wi-Fi socket) is retried; any other failure is final.
const TRANSPORT = /wsarecv|ECONNRESET|ETIMEDOUT|ENOTFOUND|connection (was )?(reset|aborted|refused)|TLS handshake|unexpected EOF|i\/o timeout/i;
export async function sh(cmd, args, opts = {}) {
  for (let i = 0; ; i++) {
    const r = await shOnce(cmd, args, { ...opts, allowFail: true });
    if (cmd === 'gh' && r.code !== 0 && TRANSPORT.test(r.stderr) && i < 3) { await new Promise((res) => setTimeout(res, 5000 * (i + 1))); continue; }
    if ((r.code !== 0 || r.timedOut) && !opts.allowFail) throw new Error(cmd + ' ' + args.join(' ') + (r.timedOut ? ' timed out' : ' exited ' + r.code) + '\n' + r.stderr);
    return r;
  }
}

function shOnce(cmd, args, { cwd = HIT_ROOT, input, timeoutMs = 120000, allowFail = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', timedOut = false;
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
      else child.kill('SIGKILL');
    }, timeoutMs);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      const r = { code, stdout: stdout.trim(), stderr: stderr.trim(), timedOut };
      if ((code !== 0 || timedOut) && !allowFail) reject(new Error(cmd + ' ' + args.join(' ') + (timedOut ? ' timed out' : ' exited ' + code) + '\n' + r.stderr));
      else resolve(r);
    });
    child.stdin.end(input ?? '');
  });
}
const git = (cwd, ...args) => sh('git', args, { cwd }).then((r) => r.stdout);

export function logger(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return (entry) => {
    const line = { time: new Date().toISOString(), ...entry };
    fs.appendFileSync(file, JSON.stringify(line) + '\n');
    console.error('hit: ' + JSON.stringify(line));
  };
}

// The minor release three.js and most npm engines are named by: 0.118.1 -> "0.118".
const minorOf = (v) => String(v).split('.').slice(0, 2).join('.');
const escape = (s) => s.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');

// Attempt 0: rewrites only the version strings in GAME_DIR, the way Dependabot would.
// CDN imports (three@0.118, three@0.118.1) and package.json ranges ("three": "^0.118.1") move to TO.
export function bumpVersions(gameDir, dep, from, to) {
  const at = new RegExp('(\\b' + escape(dep) + '@)' + escape(minorOf(from)) + '(?:\\.\\d+)?(?![\\d.])', 'g');
  const pkg = new RegExp('("' + escape(dep) + '"\\s*:\\s*"[~^]?)' + escape(minorOf(from)) + '(?:\\.\\d+)?"', 'g');
  // cdnjs names a release by its revision: ajax/libs/three.js/99/three.min.js.
  const rev = (v) => String(v).split('.')[1];
  const cdnjs = new RegExp('(/ajax/libs/' + escape(dep) + '(?:\\.js)?/r?)' + rev(from) + '(?=/)', 'g');
  const changed = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') walk(file); continue; }
      if (!/\.(m?js|ts|html|json)$/i.test(e.name)) continue;
      const before = fs.readFileSync(file, 'utf8');
      const after = before.replace(at, '$1' + to).replace(pkg, '$1' + to + '"').replace(cdnjs, '$1' + rev(to));
      if (after !== before) { fs.writeFileSync(file, after); changed.push(path.relative(gameDir, file).split(path.sep).join('/')); }
    }
  };
  walk(gameDir);
  return changed.sort();
}

// COGGS Auto's verdict.json: {verdict, rule, games:[{game, verdict, frames:[{step, differPct, baseLuma,
// headLuma, pass, reasons}], newPageErrors, newConsoleErrors, three, reasons}]}. Hit reads its own game.
export function gameVerdict(v, game) {
  const name = path.basename(game);
  const g = (v.games || []).find((x) => x.game === name || path.basename(String(x.game)) === name);
  return g ? { ...g, verdict: String(g.verdict).toUpperCase() } : { game: name, verdict: String(v.verdict || 'MISSING').toUpperCase(), frames: [], newPageErrors: [], newConsoleErrors: [], reasons: ['no entry for ' + name + ' in verdict.json'] };
}

const text = (e) => typeof e === 'string' ? e : (e && (e.text || e.message)) || JSON.stringify(e);

// The numbers Hit and the log need.
export function summarizeVerdict(v, game) {
  const g = gameVerdict(v, game);
  return {
    verdict: g.verdict,
    differ: (g.frames || []).map((f) => ({ step: f.step, pct: f.differPct, baseLuma: f.baseLuma, headLuma: f.headLuma })),
    errors: (g.newPageErrors || []).length + (g.newConsoleErrors || []).length,
    reasons: g.reasons || [],
  };
}

// One line describing what broke, for the brain query: the first new error, else the verdict's reasons.
export function symptomOf(v, game) {
  const g = gameVerdict(v, game);
  const errs = [...(g.newPageErrors || []), ...(g.newConsoleErrors || [])].map(text);
  if (errs.length) return errs[0].slice(0, 300);
  const worst = (g.frames || []).reduce((a, f) => (f.differPct ?? 0) > (a?.differPct ?? -1) ? f : a, null);
  const luma = worst ? ' frame mean luma ' + worst.headLuma + ' against ' + worst.baseLuma + ', ' + worst.differPct + '% of pixels differ' : '';
  return ((g.reasons || []).map(text).join('; ') + luma).slice(0, 300);
}

function findFile(dir, name) {
  if (!fs.existsSync(dir)) return null;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isFile() && e.name === name) return p;
    if (e.isDirectory()) { const f = findFile(p, name); if (f) return f; }
  }
  return null;
}

// Waits for the COGGS Auto run on one commit, downloads its artifact and returns the parsed verdict.
export async function awaitVerdict({ sha, outDir, log, artifact = 'coggs-auto-verdict', frames = 'coggs-auto-frames' }) {
  const t0 = Date.now();
  let warned = false;
  while (Date.now() - t0 < CI_TIMEOUT_MS) {
    const r = await sh('gh', ['run', 'list', '--commit', sha, '--workflow', WORKFLOW, '--json', 'databaseId,status,conclusion,event'], { allowFail: true });
    const runs = r.code === 0 ? JSON.parse(r.stdout || '[]') : [];
    if (r.code !== 0 && !warned) { log({ kind: 'ci-wait', sha, note: r.stderr.split('\n')[0] }); warned = true; }
    const run = runs.find((x) => x.event === 'pull_request') || runs[0];
    if (run && run.status === 'completed') {
      const dir = path.join(outDir, 'run-' + run.databaseId);
      fs.rmSync(dir, { recursive: true, force: true });
      const d = await sh('gh', ['run', 'download', String(run.databaseId), '-n', artifact, '-D', dir], { allowFail: true, timeoutMs: 300000 });
      const file = d.code === 0 ? findFile(dir, 'verdict.json') : null;
      if (!file) throw new Error('COGGS Auto run ' + run.databaseId + ' (' + run.conclusion + ') left no verdict.json in artifact ' + artifact + ': ' + (d.stderr || 'artifact downloaded without it'));
      const f = await sh('gh', ['run', 'download', String(run.databaseId), '-n', frames, '-D', path.join(dir, 'frames')], { allowFail: true, timeoutMs: 300000 });
      if (f.code !== 0) log({ kind: 'ci-frames', runId: run.databaseId, note: 'no frames artifact: ' + f.stderr.split('\n')[0] });
      return { runId: run.databaseId, conclusion: run.conclusion, file, verdict: JSON.parse(fs.readFileSync(file, 'utf8')) };
    }
    await new Promise((res) => setTimeout(res, POLL_MS));
  }
  throw new Error('no completed COGGS Auto run for ' + sha + ' after ' + CI_TIMEOUT_MS / 60000 + ' min');
}

// Lessons from earlier games, from the shared brain when tools/brain.mjs is on this checkout.
async function brainQuery(symptom, dep, from, to, log, enabled = true) {
  if (!enabled) { log({ kind: 'brain', note: 'disabled with --no-brain' }); return null; }
  const tool = path.join(HIT_ROOT, 'tools', 'brain.mjs');
  if (!fs.existsSync(tool)) { log({ kind: 'brain', note: 'tools/brain.mjs not on this checkout, brain step skipped' }); return null; }
  const q = symptom + ' ' + dep + ' ' + from + '->' + to;
  const r = await sh(process.execPath, [tool, 'query', q, '--json'], { allowFail: true, timeoutMs: 60000 });
  if (r.code !== 0) throw new Error('brain query failed: ' + r.stderr);
  const hits = JSON.parse(r.stdout);
  log({ kind: 'brain', query: q, hits: hits.map((h) => h.slug) });
  if (!hits.length) return null;
  return { text: hits.map((h) => '- ' + h.title + '\n  fix: ' + h.fix + '\n  lesson: .hit.local/lessons/' + path.basename(h.file)).join('\n'), files: hits.map((h) => path.join(HIT_ROOT, h.file)) };
}

async function brainAdd(file, log) {
  const tool = path.join(HIT_ROOT, 'tools', 'brain.mjs');
  if (!fs.existsSync(tool)) { log({ kind: 'brain', note: 'tools/brain.mjs not on this checkout, lesson kept at ' + file }); return; }
  await sh(process.execPath, [tool, 'add', file], { timeoutMs: 60000 });
  log({ kind: 'brain', added: file });
}

const gamePrefix = (game) => { const g = game.replace(/\\/g, '/').replace(/^\.\/?/, '').replace(/\/$/, ''); return g ? g + '/' : ''; };

const fixSubjects = async (wt, base) => (await git(wt, 'log', '--format=%s', base + '..HEAD')).split('\n').filter((l) => l.startsWith('fix(hit):'));

// Claude edits files and nothing else: no shell, no git, writes refused under .hit.local/ (its inputs) and .git/.
// It works with the worktree as its only directory, so every write it makes shows in git status.
function claudeArgs() {
  const deny = ['Bash', 'PowerShell', 'Edit(./.hit.local/**)', 'Write(./.hit.local/**)', 'Edit(./.git/**)', 'Write(./.git/**)'];
  return ['-p', '--safe-mode', '--no-session-persistence', '--output-format', 'json', '--permission-mode', 'acceptEdits',
    '--settings', JSON.stringify({ includeCoAuthoredBy: false }),
    '--allowedTools', 'Read,Grep,Glob,LS,Edit,Write,WebFetch(domain:cdn.jsdelivr.net),WebFetch(domain:raw.githubusercontent.com)',
    '--disallowedTools', deny.join(',')];
}

// Copies what one attempt reads into <worktree>/.hit.local/ (ignored by *.local*); the two package versions are junctions.
function stageInputs({ wt, dep, from, to, verdictFile, brainFiles }) {
  const dir = path.join(wt, '.hit.local');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'lessons'), { recursive: true });
  fs.copyFileSync(path.join(HIT_ROOT, '.coggs', 'hit.md'), path.join(dir, 'hit.md'));
  fs.copyFileSync(path.join(HIT_ROOT, '.coggs', 'guides', guideName(dep, from, to)), path.join(dir, 'guide.md'));
  fs.cpSync(path.dirname(verdictFile), path.join(dir, 'verdict'), { recursive: true });
  for (const f of brainFiles) fs.copyFileSync(f, path.join(dir, 'lessons', path.basename(f)));
  const sources = [];
  for (const v of [from, to]) {
    const src = path.join(HIT_ROOT, 'node_modules', dep + '-' + v);
    if (!fs.existsSync(src)) continue;
    fs.symlinkSync(src, path.join(dir, dep + '-' + v), 'junction');
    sources.push('.hit.local/' + dep + '-' + v);
  }
  return { dir, sources };
}

// The ontology faces that match the failing frames and new page errors, as markdown; null when none match (exit 1).
export async function ontologyRoute(verdict, game, log, attempt) {
  const tool = path.join(HIT_ROOT, 'tools', 'ontology.mjs');
  if (!fs.existsSync(tool)) { log({ kind: 'ontology', note: 'tools/ontology.mjs not on this checkout, skipped' }); return null; }
  const g = gameVerdict(verdict, game);
  const failing = (g.frames || []).filter((f) => f.pass === false || (typeof f.differPct === 'number' && f.differPct > 0.1));
  // The route matches symptom words, so each failing frame is described in words read from its numbers.
  const words = (f) => {
    if (typeof f.differPct !== 'number') return 'no frame captured, the game does not start';
    const d = f.headLuma - f.baseLuma;
    const tone = d < -1 ? 'the frame is darker' : d > 1 ? 'the frame is brighter, washed out' : 'colors differ slightly at the same brightness';
    const reach = f.differPct > 50 ? 'across the whole frame' : f.differPct > 1 ? 'on part of the frame' : 'on a few pixels, edges and small details';
    return 'step ' + f.step + ': ' + tone + ' ' + reach + ', ' + f.differPct + '% of pixels differ, mean luma ' + f.headLuma + ' against ' + f.baseLuma;
  };
  const query = [...failing.map(words), ...(g.newPageErrors || []).map(text)].join('; ').slice(0, 1500);
  if (!query) return null;
  const r = await sh(process.execPath, [tool, 'route', query], { allowFail: true, timeoutMs: 60000 });
  if (r.code === 1) { log({ kind: 'ontology', attempt, used: false, note: 'no face matched' }); return null; }
  if (r.code !== 0) throw new Error('ontology route failed: ' + r.stderr);
  log({ kind: 'ontology', attempt, used: true, query, bytes: r.stdout.length });
  return r.stdout;
}

// One fix attempt: claude edits GAME_DIR and names cause, evidence and source; Hit checks the change and commits it.
export async function fixAttempt({ wt, base, game, dep, from, to, verdictFile, verdict, brain, attempt, max = 6, log }) {
  const done = await fixSubjects(wt, base);
  const { dir, sources } = stageInputs({ wt, dep, from, to, verdictFile, brainFiles: brain?.files || [] });
  const ontology = await ontologyRoute(verdict, game, log, attempt);
  const prompt = [
    fs.readFileSync(path.join(dir, 'hit.md'), 'utf8'),
    '## This attempt',
    'GAME_DIR=' + game, 'DEP=' + dep, 'FROM=' + from, 'TO=' + to, 'Fix attempt ' + attempt + ' of ' + max + ' (the cap for this run; this attempt is allowed).',
    'GUIDE: .hit.local/guide.md',
    'VERDICT: .hit.local/verdict/verdict.json (frames, when uploaded, under .hit.local/verdict/frames/)',
    sources.length ? 'SOURCES: ' + sources.join(' , ') : 'SOURCES: none installed; read https://cdn.jsdelivr.net/npm/' + dep + '@<version>/',
    'Fixes so far: ' + (done.length ? done.join(' ; ') : 'none'),
    brain ? '## Known causes from earlier games\n' + brain.text : '',
    ontology ? '## Where the ontology routes this symptom\n' + ontology : '',
  ].filter(Boolean).join('\n');
  const t0 = Date.now();
  const r = await sh('claude', claudeArgs(), { cwd: wt, input: prompt, timeoutMs: CLAUDE_TIMEOUT_MS, allowFail: true });
  fs.rmSync(dir, { recursive: true, force: true });
  let out = {};
  try { out = JSON.parse(r.stdout); } catch { out = { result: r.stdout }; }
  const line = (k) => ((new RegExp('^' + k + ':\\s*(.+)$', 'mi').exec(out.result || '') || [])[1] || '').trim();
  const cause = line('CAUSE'), evidence = line('EVIDENCE'), source = line('SOURCE');
  const denied = (out.permission_denials || []).map((d) => d.tool_name + ' ' + JSON.stringify(d.tool_input).slice(0, 160));
  const meta = { attempt, seconds: Math.round((Date.now() - t0) / 1000), costUsd: out.total_cost_usd ?? null, turns: out.num_turns ?? null, timedOut: r.timedOut, exit: r.code, denied };

  // Tracked edits and new files, by name only (status --porcelain lines lose their leading space to trim()).
  const changed = [...new Set([
    ...(await git(wt, 'diff', '--name-only', 'HEAD')).split('\n'),
    ...(await git(wt, 'ls-files', '--others', '--exclude-standard')).split('\n'),
  ].filter(Boolean))];
  const prefix = gamePrefix(game);
  const problems = [];
  if (r.code !== 0 || r.timedOut || out.is_error) problems.push('claude failed: ' + (r.timedOut ? 'timeout' : String(out.result || r.stderr).slice(0, 300)));
  if (!changed.length) problems.push('no file changed');
  const outside = changed.filter((f) => !f.startsWith(prefix) || FORBIDDEN.some((p) => f.startsWith(p)));
  if (outside.length) problems.push('edited outside GAME_DIR: ' + outside.join(', '));
  if (!cause) problems.push('no CAUSE: line');
  if (!evidence) problems.push('no EVIDENCE: line');
  if (!source) problems.push('no SOURCE: line');
  if (problems.length) {
    await git(wt, 'checkout', '--', '.');
    await git(wt, 'clean', '-fd', '--', game);
    log({ kind: 'violation', ...meta, cause, problems });
    return { ok: false, problems, cause };
  }
  const subject = 'fix(hit): ' + cause.replace(/^fix\(hit\):\s*/i, '').replace(/\.$/, '');
  const msgFile = path.join(path.dirname(wt), path.basename(wt) + '-msg.local.txt');
  fs.writeFileSync(msgFile, subject + '\n\nEvidence: ' + evidence + '\nSource: ' + source.replace(/^Source:\s*/i, '') + '\n');
  await git(wt, 'add', '--', ...changed);
  await git(wt, 'commit', '-q', '-F', msgFile);
  fs.rmSync(msgFile);
  const sha = await git(wt, 'rev-parse', 'HEAD');
  log({ kind: 'fix', ...meta, cause: subject.slice(10), sha, files: changed, verdictBefore: summarizeVerdict(verdict, game) });
  return { ok: true, sha, subject, cause: subject.slice(10) };
}

async function pushBranch(wt, branch) {
  await git(wt, 'fetch', 'origin');
  const remote = await sh('git', ['rev-parse', '--verify', '--quiet', 'origin/' + branch], { cwd: wt, allowFail: true });
  if (remote.code === 0) await git(wt, 'rebase', 'origin/' + branch);
  await git(wt, 'push', '-u', 'origin', 'HEAD:refs/heads/' + branch);
  return git(wt, 'rev-parse', 'HEAD');
}

async function ensureWorktree(repo, branch, startPoint) {
  // A worktree already holding the branch is reused wherever it sits.
  const list = await git(repo, 'worktree', 'list', '--porcelain');
  for (const block of list.split(/\n\n+/)) {
    const lines = block.split('\n');
    const dir = (lines.find((l) => l.startsWith('worktree ')) || '').slice(9);
    if (dir && lines.includes('branch refs/heads/' + branch)) return path.resolve(dir);
  }
  const wt = path.join(path.dirname(repo), path.basename(repo) + '-' + branch.replace(/[^\w.-]+/g, '-') + '.local');
  const exists = await sh('git', ['rev-parse', '--verify', '--quiet', 'refs/heads/' + branch], { cwd: repo, allowFail: true });
  if (exists.code === 0) await git(repo, 'worktree', 'add', wt, branch);
  else await git(repo, 'worktree', 'add', '-b', branch, wt, startPoint);
  return wt;
}

const rel = (v) => 'r' + String(v).split('.')[1];
const q = (x) => '"' + String(x).replace(/\s+/g, ' ').replace(/"/g, "'").trim() + '"';
const pctText = (p) => typeof p === 'number' ? p.toFixed(2) + '%' : 'no frame';

// Guide entries that name an API the game calls: the evidence for the issue, read from files, never typed.
export function guideHits(guideText, gameDir) {
  const src = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!/^(node_modules|resources|\.git)$/.test(e.name)) walk(p); }
      else if (/\.(m?js|html)$/i.test(e.name)) src.push([path.relative(gameDir, p).split(path.sep).join('/'), fs.readFileSync(p, 'utf8')]);
    }
  };
  walk(gameDir);
  const verb = /\b(has been|have been|is now|are now|now requires|is deprecated|are deprecated|no longer)\b/i;
  // How a guide token shows up in code: "THREE.X" or "Class.member" by its last part, "a/b" as a path,
  // and "Use B instead of A" names the old spelling A.
  const pattern = (t) => {
    if (t.includes('/')) return new RegExp(t.replace(/[.*+?^\u0024{}()|[\]\\]/g, '\\$&'));
    const last = t.split('.').pop().replace(/[^\w]/g, '');
    if (!/[A-Z]/.test(last) || last.length < 5) return null;
    return new RegExp((t.includes('.') && !/^THREE\./.test(t) ? '\\.' : '\\b') + last + '\\b');
  };
  const hits = [];
  let release = '';
  for (const line of guideText.split('\n')) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) { release = h[1].trim(); continue; }
    const v = verb.exec(line);
    if (!/^- /.test(line) || !v) continue;
    const head = line.slice(0, v.index);
    const old = /instead of \u0060([^\u0060]+)\u0060/.exec(line);
    const tokens = [...head.matchAll(/\u0060([^\u0060]+)\u0060/g)].map((m) => m[1].split(/\s|=/)[0]);
    if (old) tokens.push(old[1].replace(/^Box/, '\\w+'));
    for (const t of tokens) {
      const re = t.startsWith('\\w+') ? new RegExp('\\b' + t + '\\b') : pattern(t);
      if (!re) continue;
      const files = src.filter(([, x]) => re.test(x)).map(([f]) => f);
      const api = t.startsWith('\\w+') ? '*' + t.slice(3) : t;
      if (files.length && !hits.some((x) => x.api === api)) hits.push({ api, release, entry: line.slice(2).trim(), files });
    }
  }
  return hits;
}

async function ensureLabel(repo, name, color, description) {
  const r = await sh('gh', ['label', 'list', '-R', repo, '--search', name, '--json', 'name']);
  // --force makes a create that races another Hit run on the same label succeed instead of failing.
  if (!JSON.parse(r.stdout || '[]').some((l) => l.name === name)) await sh('gh', ['label', 'create', name, '-R', repo, '--color', color, '--description', description, '--force']);
}

async function bodyFile(name, text) {
  const f = path.join(HIT_ROOT, 'hit', 'out', name);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
  return f;
}

async function fileIssue({ repo, game, dep, from, to, log }) {
  const name = path.basename(game);
  const guidePath = path.join(HIT_ROOT, '.coggs', 'guides', guideName(dep, from, to));
  const guide = fs.readFileSync(guidePath, 'utf8');
  const releases = (guide.match(/^## /gm) || []).length;
  const title = dep + '.js ' + rel(from) + ' in ' + name + ' is ' + releases + ' releases behind ' + rel(to);
  const open = JSON.parse((await sh('gh', ['issue', 'list', '-R', repo, '--state', 'open', '--search', 'in:title "' + title + '"', '--json', 'number,title,url'])).stdout);
  const found = open.find((i) => i.title === title);
  if (found) { log({ kind: 'issue', number: found.number, url: found.url, reused: true }); return found; }
  const hits = guideHits(guide, path.join(HIT_ROOT, game));
  // Published advisories for the version the game loads, read from GitHub's advisory database.
  const adv = await sh('gh', ['api', 'advisories?ecosystem=npm&affects=' + dep + '@' + from, '--jq', '[.[] | {ghsa_id, cve_id, severity, summary, html_url, patched: ([.vulnerabilities[] | select(.package.name == "' + dep + '") | .first_patched_version] | first)}]'], { allowFail: true });
  const advisories = adv.code === 0 ? JSON.parse(adv.stdout || '[]') : [];
  const source = (/^Source: (.+)$/m.exec(guide) || [])[1] || '';
  const body = [
    '## What breaks',
    '',
    '\u0060' + game + '\u0060 loads ' + dep + '.js ' + rel(from) + ' (\u0060' + from + '\u0060). The current release is ' + rel(to) + ' (\u0060' + to + '\u0060), ' + releases + ' releases later. The game cannot take any fix or feature from those releases until it moves, and every release it waits adds more removed APIs to the jump.',
    '',
    ...(advisories.length ? [
      '## Security',
      '',
      dep + '.js ' + from + ' is affected by ' + advisories.length + ' published advisor' + (advisories.length === 1 ? 'y' : 'ies') + ':',
      '',
      '| advisory | severity | summary | fixed in |',
      '| --- | --- | --- | --- |',
      ...advisories.map((x) => '| [' + (x.cve_id || x.ghsa_id) + '](' + x.html_url + ') | ' + x.severity + ' | ' + x.summary + ' | ' + (x.patched || '?') + ' |'),
      '',
    ] : []),
    '## Evidence',
    '',
    hits.length + ' entries of the official migration guide between ' + rel(from) + ' and ' + rel(to) + ' change an API or path this game uses:',
    '',
    '| API | release | guide entry | used in |',
    '| --- | --- | --- | --- |',
    ...hits.slice(0, 10).map((h) => '| \u0060' + h.api + '\u0060 | ' + h.release + ' | ' + h.entry.replace(/\|/g, '\\|').slice(0, 160) + ' | ' + h.files.slice(0, 3).map((f) => '\u0060' + f + '\u0060').join(', ') + (h.files.length > 3 ? ' +' + (h.files.length - 3) : '') + ' |'),
    '',
    'Guide: ' + source.split(' (raw')[0] + ', copied in \u0060.coggs/guides/' + guideName(dep, from, to) + '\u0060.',
    '',
    '## Expected',
    '',
    'The game runs on ' + dep + '.js ' + rel(to) + ' and plays the same as on ' + rel(from) + ': COGGS Auto replays both builds with one seed and one input route, and every captured frame differs on fewer than 0.1% of pixels.',
    '',
  ].join('\n');
  await ensureLabel(repo, 'dependencies', '0366d6', 'Pull requests that update a dependency file');
  const f = await bodyFile('issue-' + name + '.local.md', body);
  const r = await sh('gh', ['issue', 'create', '-R', repo, '--title', title, '--body-file', f, '--label', 'dependencies']);
  fs.rmSync(f);
  const url = r.stdout.trim().split('\n').pop();
  const issue = { number: Number(url.split('/').pop()), title, url, releases, apis: hits.length, advisories: advisories.map((x) => x.cve_id || x.ghsa_id) };
  log({ kind: 'issue', ...issue });
  return issue;
}

function prBody({ game, dep, from, to, issue, first, last }) {
  const evidence = !last ? ['COGGS Auto has not played this pull request yet. Its verdict comment and the COGGS Hit status comment below update on every push.'] : [
    'COGGS Auto replays base (' + rel(from) + ') and head (' + rel(to) + ') with one seed and one input route on SwiftShader. A frame passes when fewer than 0.1% of its pixels differ.',
    '',
    '| frame | version bump only | this head |',
    '| --- | --- | --- |',
    ...last.differ.map((f, i) => '| step ' + f.step + ' | ' + (first?.errors && first.differ[i]?.pct == null ? 'page error, no frame' : pctText(first?.differ[i]?.pct)) + ' | ' + pctText(f.pct) + ' |'),
    '',
    'New page or console errors: ' + (first ? first.errors : '?') + ' on the bump, ' + last.errors + ' on this head. Verdict: **' + last.verdict + '**.',
  ];
  return [
    '\u0060' + game + '\u0060 moves from ' + dep + '.js ' + rel(from) + ' to ' + rel(to) + ' and must play the same as before.',
    '',
    'Fixes #' + issue.number + '.',
    '',
    '## Evidence',
    '',
    ...evidence,
    '',
    '## Fix and scope',
    '',
    'The first commit changes only the version strings, the way Dependabot writes it. Each later \u0060fix(hit):\u0060 commit fixes one cause COGGS Auto measured, with the verdict line it acted on and its source in the commit body. Gameplay numbers, assets, the input route and the pass threshold are untouched.',
    '',
  ].join('\n');
}

async function editPrBody(repo, pr, body) {
  const f = await bodyFile('pr-' + pr + '-body.local.md', body);
  await sh('gh', ['pr', 'edit', String(pr), '-R', repo, '--body-file', f]);
  fs.rmSync(f);
}

// The one COGGS Hit status comment on a pull request, created once and edited in place.
async function upsertStatus(repo, pr, body) {
  const me = (await sh('gh', ['api', 'user', '--jq', '.login'])).stdout;
  const list = JSON.parse((await sh('gh', ['api', '--paginate', '--slurp', 'repos/' + repo + '/issues/' + pr + '/comments'])).stdout).flat();
  const mine = list.filter((c) => c.user.login === me && c.body.startsWith(MARKER));
  const f = await bodyFile('pr-' + pr + '-status.local.md', JSON.stringify({ body: MARKER + '\n' + body }));
  if (mine.length) await sh('gh', ['api', '-X', 'PATCH', 'repos/' + repo + '/issues/comments/' + mine[0].id, '--input', f]);
  else await sh('gh', ['api', '-X', 'POST', 'repos/' + repo + '/issues/' + pr + '/comments', '--input', f]);
  for (const extra of mine.slice(1)) await sh('gh', ['api', '-X', 'DELETE', 'repos/' + repo + '/issues/comments/' + extra.id]);
  fs.rmSync(f);
}

function statusBody({ dep, from, to, rows, state, note }) {
  return [
    '### 🔧 COGGS Hit · ' + dep + '.js ' + rel(from) + ' → ' + rel(to) + ' · ' + state,
    '',
    '| try | commit | what Hit changed | COGGS Auto after it |',
    '| --- | --- | --- | --- |',
    ...rows.map((r) => '| ' + r.attempt + ' | ' + (r.sha ? '\u0060' + r.sha.slice(0, 7) + '\u0060' : '') + ' | ' + r.cause + ' | ' + (r.verdict || 'playing…') + ' |'),
    '',
    note || 'Hit pushes one fix per failed verdict.',
  ].join('\n');
}

const verdictCell = (s) => (s.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL') + ' · ' + (s.differ.every((f) => f.pct == null) ? s.errors + ' new error' + (s.errors === 1 ? '' : 's') + ', no frame' : 'max ' + pctText(Math.max(...s.differ.map((f) => f.pct ?? 100))) + ' differ' + (s.errors ? ', ' + s.errors + ' new error' + (s.errors === 1 ? '' : 's') : ''));

// After PASS: one lesson per fix commit in the brain/lessons frontmatter shape, then tools/brain.mjs add.
async function writeLessons({ wt, base, pr, game, dep, from, to, logFile, log }) {
  const shas = (await git(wt, 'log', '--reverse', '--format=%H %s', base + '..HEAD')).split('\n').filter((l) => / fix\(hit\): /.test(l)).map((l) => l.split(' ')[0]);
  const entries = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const verdictAt = (attempt) => [...entries].reverse().find((e) => e.kind === 'verdict' && e.attempt === attempt);
  const frames = (v) => v ? v.differ.map((f) => 'step ' + f.step + ' ' + pctText(f.pct)).join(', ') : 'not logged';
  const dir = path.join(HIT_ROOT, 'hit', 'out', String(pr), 'lessons');
  fs.mkdirSync(dir, { recursive: true });
  const name = path.basename(game);
  for (const [i, sha] of shas.entries()) {
    const msg = await git(wt, 'log', '-1', '--format=%B', sha);
    const cause = msg.split('\n')[0].replace(/^fix\(hit\): /, '');
    const pick = (k) => ((new RegExp('^' + k + ': (.+)$', 'm').exec(msg) || [])[1] || '').trim();
    const stat = await git(wt, 'show', '--stat', '--format=', sha);
    const diff = (await git(wt, 'show', '--format=', '--unified=1', sha)).split('\n').slice(0, 80).join('\n');
    const before = verdictAt(i), after = verdictAt(i + 1);
    const file = path.join(dir, dep + '-' + name + '-' + cause.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) + '.md');
    fs.writeFileSync(file, [
      '---',
      'type: lesson',
      'title: ' + q(dep + ' ' + rel(from) + ' to ' + rel(to) + ': ' + cause),
      'engine: ' + dep,
      'from: ' + rel(from),
      'to: ' + rel(to),
      'game: ' + name,
      'symptom: ' + q((before?.symptom || pick('Evidence')) + '; frames ' + frames(before)),
      'cause: ' + q(cause),
      'fix: ' + q(pick('Source') + '. Commit ' + sha.slice(0, 12) + ' on PR #' + pr + ': ' + stat.split('\n').pop()),
      'result: ' + q('COGGS Auto after this fix: ' + (after ? after.verdict + ', frames ' + frames(after) : 'not logged')),
      'tags: [' + [dep, name, rel(to), 'hit', ...cause.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3)].join(', ') + ']',
      '---',
      '',
      '# ' + cause,
      '',
      'Evidence: ' + pick('Evidence'),
      '',
      'Source: ' + pick('Source'),
      '',
      'Written by COGGS Hit after PR #' + pr + ' reached PASS. Fix ' + (i + 1) + ' of ' + shas.length + ', commit ' + sha + '.',
      '',
      '\u0060\u0060\u0060text', stat, '\u0060\u0060\u0060', '',
      '\u0060\u0060\u0060diff', diff, '\u0060\u0060\u0060', '',
    ].join('\n'));
    await brainAdd(file, log);
  }
  return shas.length;
}

// Squash-merge with a conventional "<title> (#n)" subject, keep the branch, and read the issue link back.
async function mergeAndClose({ repo, pr, issue, title, wt, base, branch, log }) {
  const subjects = (await git(wt, 'log', '--reverse', '--format=%s', base + '..HEAD')).split('\n').filter(Boolean);
  const f = await bodyFile('pr-' + pr + '-squash.local.md', subjects.map((s) => '- ' + s).join('\n') + '\n\nFixes #' + issue.number + '\n');
  await sh('gh', ['pr', 'merge', String(pr), '-R', repo, '--squash', '--subject', title + ' (#' + pr + ')', '--body-file', f]);
  fs.rmSync(f);
  const merged = JSON.parse((await sh('gh', ['pr', 'view', String(pr), '-R', repo, '--json', 'state,mergeCommit,url'])).stdout);
  // The branch stays on the remote as the archive of every attempt; only the local worktree goes.
  await sh('git', ['worktree', 'remove', '--force', wt], { cwd: HIT_ROOT, allowFail: true });
  let link;
  for (let i = 0; i < 12; i++) {
    link = JSON.parse((await sh('gh', ['issue', 'view', String(issue.number), '-R', repo, '--json', 'state,closedByPullRequestsReferences,url'])).stdout);
    if (link.state === 'CLOSED' && link.closedByPullRequestsReferences.some((p) => p.number === pr)) break;
    await new Promise((res) => setTimeout(res, 5000));
  }
  const entry = { kind: 'merge', pr, state: merged.state, mergeCommit: merged.mergeCommit?.oid, mergeUrl: 'https://github.com/' + repo + '/commit/' + merged.mergeCommit?.oid, issue: issue.number, issueState: link.state, closedBy: link.closedByPullRequestsReferences.map((p) => p.number) };
  log(entry);
  return entry;
}

async function ensureBrain(log) {
  const tool = path.join(HIT_ROOT, 'tools', 'brain.mjs');
  if (!fs.existsSync(tool) || fs.existsSync(path.join(HIT_ROOT, 'brain', '.gbrain', 'brain.pglite'))) return;
  const r = await sh(process.execPath, [tool, 'init'], { allowFail: true, timeoutMs: 300000 });
  log({ kind: 'brain', init: r.code === 0 ? r.stdout : 'failed: ' + r.stderr.split('\n').pop() });
}

export async function main(a) {
  const game = a.game.replace(/\\/g, '/').replace(/\/$/, '');
  const { dep, from, to } = a;
  const max = Number(a['max-fixes'] || a.max || 6);
  const repo = HIT_ROOT;
  const ghRepo = a.repo || 'DaedalGames/auto-hit';
  const useBrain = !a['no-brain'];
  const branch = a.branch || 'coggs-hit/' + dep + '-' + to + '-' + path.basename(game);
  const base = 'origin/main';
  const title = 'build(deps): upgrade ' + dep + '.js from ' + rel(from) + ' to ' + rel(to) + ' in ' + path.basename(game);
  await git(repo, 'fetch', 'origin');
  if (useBrain) await ensureBrain(() => {});

  if (a.local) {
    const wt = await ensureWorktree(repo, branch, base);
    const log = logger(path.join(repo, 'hit', 'out', 'local-' + branch.replace(/[^\w.-]+/g, '-') + '.jsonl'));
    if (!(await git(wt, 'log', '--format=%s', base + '..HEAD'))) {
      const files = bumpVersions(path.join(wt, game), dep, from, to);
      await git(wt, 'add', '--', ...files.map((f) => game + '/' + f));
      await git(wt, 'commit', '-m', 'build(deps): bump ' + dep + ' from ' + from + ' to ' + to);
      log({ kind: 'bump', branch, files: files.length, sha: await git(wt, 'rev-parse', 'HEAD') });
    }
    const verdictFile = path.resolve(a.verdict);
    const verdict = JSON.parse(fs.readFileSync(verdictFile, 'utf8'));
    const brain = await brainQuery(symptomOf(verdict, game), dep, from, to, log, useBrain);
    const r = await fixAttempt({ wt, base, game, dep, from, to, verdictFile, verdict, brain, attempt: 1, log });
    console.log(JSON.stringify({ worktree: wt, ...r }));
    return r.ok ? 0 : 1;
  }

  let pr = a.pr ? Number(a.pr) : null;
  let issue, wt, prBranch = branch;
  if (!pr) {
    const boot = logger(path.join(repo, 'hit', 'out', 'pending-' + path.basename(game) + '.jsonl'));
    issue = await fileIssue({ repo: ghRepo, game, dep, from, to, log: boot });
    console.log('ISSUE ' + issue.url);
    wt = await ensureWorktree(repo, branch, base);
    if (!(await git(wt, 'log', '--format=%s', base + '..HEAD'))) {
      const files = bumpVersions(path.join(wt, game), dep, from, to);
      if (!files.length) throw new Error('no ' + dep + ' ' + from + ' version string found under ' + game);
      await git(wt, 'add', '--', ...files.map((f) => game + '/' + f));
      await git(wt, 'commit', '-m', 'build(deps): bump ' + dep + ' from ' + from + ' to ' + to + ' in ' + path.basename(game));
    }
    const sha = await pushBranch(wt, branch);
    const openPr = JSON.parse((await sh('gh', ['pr', 'list', '-R', ghRepo, '--head', branch, '--state', 'open', '--json', 'url'])).stdout);
    let url = openPr[0]?.url;
    if (!url) {
      const f = await bodyFile('pr-new-body.local.md', prBody({ game, dep, from, to, issue }));
      await ensureLabel(ghRepo, 'dependencies', '0366d6', 'Pull requests that update a dependency file');
      const r = await sh('gh', ['pr', 'create', '-R', ghRepo, '--base', 'main', '--head', branch, '--title', title, '--body-file', f, '--label', 'dependencies'], { cwd: wt });
      fs.rmSync(f);
      url = r.stdout.trim().split('\n').pop();
    }
    pr = Number(url.split('/').pop());
    console.log('PR ' + url);
    const pending = path.join(repo, 'hit', 'out', 'pending-' + path.basename(game) + '.jsonl');
    fs.appendFileSync(path.join(repo, 'hit', 'out', pr + '.jsonl'), fs.readFileSync(pending, 'utf8'));
    fs.rmSync(pending);
    logger(path.join(repo, 'hit', 'out', pr + '.jsonl'))({ kind: 'pr', pr, url, title, game, dep, from, to, attempt: 0, sha, cause: 'version strings only', brain: useBrain });
  } else {
    const info = JSON.parse((await sh('gh', ['pr', 'view', String(pr), '-R', ghRepo, '--json', 'headRefName,body'])).stdout);
    prBranch = info.headRefName;
    const n = Number((/Fixes #(\d+)/.exec(info.body) || [])[1]);
    issue = { number: n };
    await git(repo, 'fetch', 'origin', prBranch + ':refs/remotes/origin/' + prBranch);
    wt = await ensureWorktree(repo, prBranch, 'origin/' + prBranch);
  }

  const outDir = path.join(repo, 'hit', 'out', String(pr));
  const logFile = path.join(repo, 'hit', 'out', pr + '.jsonl');
  const log = logger(logFile);
  const watchdog = setTimeout(() => { log({ kind: 'abort', note: 'watchdog 4 h' }); process.exit(3); }, 4 * 3600 * 1000);
  const rows = [{ attempt: 0, sha: await git(wt, 'rev-list', '-1', '--grep', '^build(deps)', 'HEAD'), cause: 'version strings only' }];
  const shas = (await git(wt, 'log', '--reverse', '--format=%H', '--grep', '^fix(hit):', base + '..HEAD')).split('\n').filter(Boolean);
  for (const [i, s] of (await fixSubjects(wt, base)).reverse().entries()) rows.push({ attempt: rows.length, sha: shas[i], cause: s.replace(/^fix\(hit\): /, '') });
  // A resumed run refills the table from the verdicts already logged for this PR.
  let first = null;
  if (fs.existsSync(logFile)) {
    for (const e of fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))) {
      if (e.kind !== 'verdict' || !rows[e.attempt] || rows[e.attempt].sha !== e.sha) continue;
      rows[e.attempt].verdict = verdictCell(e) + ' ([run](https://github.com/' + ghRepo + '/actions/runs/' + e.runId + '))';
      if (e.attempt === 0) first = e;
    }
  }
  let resuming = Boolean(a.pr);
  if (resuming) {
    await sh('gh', ['pr', 'edit', String(pr), '-R', ghRepo, '--remove-label', 'needs-human'], { allowFail: true });
    log({ kind: 'resume', pr, fixes: rows.length - 1, maxFixes: max, brain: useBrain });
  }
  try {
    for (;;) {
      const sha = await git(wt, 'rev-parse', 'HEAD');
      const fixes = (await fixSubjects(wt, base)).length;
      const cap = 'Hit pushes one fix per failed verdict and stops after ' + max + ' fixes.';
      const known = resuming && rows[rows.length - 1].verdict;
      await upsertStatus(ghRepo, pr, statusBody({ dep, from, to, rows, state: resuming ? 'resuming with a cap of ' + max + ' fixes' : 'waiting for COGGS Auto on \u0060' + sha.slice(0, 7) + '\u0060', note: cap }));
      resuming = false;
      if (known) await new Promise((res) => setTimeout(res, 3000));
      const v = await awaitVerdict({ sha, outDir, log });
      const s = summarizeVerdict(v.verdict, game);
      if (!first) first = s;
      rows[rows.length - 1].verdict = verdictCell(s) + ' ([run](https://github.com/' + ghRepo + '/actions/runs/' + v.runId + '))';
      rows[rows.length - 1].sha ||= sha;
      log({ kind: 'verdict', pr, game: path.basename(game), attempt: fixes, sha, runId: v.runId, conclusion: v.conclusion, verdict: s.verdict, differ: s.differ, errors: s.errors, symptom: symptomOf(v.verdict, game), brain: useBrain });
      if (s.verdict === 'PASS') {
        await editPrBody(ghRepo, pr, prBody({ game, dep, from, to, issue, first, last: s }));
        const lessons = useBrain ? await writeLessons({ wt, base, pr, game, dep, from, to, logFile, log }) : 0;
        log({ kind: 'pass', pr, game: path.basename(game), dep, from, to, attemptsToPass: fixes, brain: useBrain, lessons });
        await upsertStatus(ghRepo, pr, statusBody({ dep, from, to, rows, state: (!a['no-merge'] ? '✅ PASS after ' : '✅ PASS · ready to merge · ') + fixes + ' fix' + (fixes === 1 ? '' : 'es'), note: 'Every frame matches ' + rel(from) + ' within 0.1%. ' + (!a['no-merge'] ? 'Squash-merging closes #' + issue.number + '.' : 'Merging closes #' + issue.number + '.') }));
        if (a['no-merge']) return 0;
        await mergeAndClose({ repo: ghRepo, pr, issue, title, wt, base, branch: prBranch, log });
        return 0;
      }
      if (fixes >= max) {
        await editPrBody(ghRepo, pr, prBody({ game, dep, from, to, issue, first, last: s }));
        await ensureLabel(ghRepo, 'needs-human', 'B60205', 'COGGS Hit stopped at its fix cap without PASS');
        await sh('gh', ['pr', 'edit', String(pr), '-R', ghRepo, '--add-label', 'needs-human']);
        const ask = 'You are COGGS Hit. ' + fixes + ' fixes did not reach PASS. From this COGGS Auto verdict, write one sentence naming the cause you would try next, starting with "Hypothesis:". Verdict:\n' + JSON.stringify(gameVerdict(v.verdict, game)).slice(0, 6000);
        const r = await sh('claude', ['-p', '--safe-mode', '--no-session-persistence', '--tools', ''], { cwd: wt, input: ask, timeoutMs: CLAUDE_TIMEOUT_MS, allowFail: true });
        const next = r.stdout.split('\n').filter(Boolean).pop() || 'Hypothesis: none written.';
        await upsertStatus(ghRepo, pr, statusBody({ dep, from, to, rows, state: '🙋 needs a human after ' + fixes + ' fixes', note: 'Stopped at the cap of ' + max + ' fixes. Still differs: ' + s.differ.map((f) => 'step ' + f.step + ' ' + pctText(f.pct)).join(', ') + ' (limit 0.1%).\n\n' + next }));
        log({ kind: 'stop', pr, game: path.basename(game), attemptsToPass: null, fixes, brain: useBrain, next });
        return 1;
      }
      const brain = await brainQuery(symptomOf(v.verdict, game), dep, from, to, log, useBrain);
      rows.push({ attempt: fixes + 1, cause: 'writing fix ' + (fixes + 1) + '…' });
      await upsertStatus(ghRepo, pr, statusBody({ dep, from, to, rows, state: 'writing fix ' + (fixes + 1), note: 'Hit pushes one fix per failed verdict and stops after ' + max + ' fixes.' }));
      let r = await fixAttempt({ wt, base, game, dep, from, to, verdictFile: v.file, verdict: v.verdict, brain, attempt: fixes + 1, max, log });
      if (!r.ok) r = await fixAttempt({ wt, base, game, dep, from, to, verdictFile: v.file, verdict: v.verdict, brain, attempt: fixes + 1, max, log });
      if (!r.ok) throw new Error('claude broke the commit rules twice on attempt ' + (fixes + 1) + ': ' + r.problems.join('; '));
      rows[rows.length - 1] = { attempt: fixes + 1, sha: r.sha, cause: r.subject.replace(/^fix\(hit\): /, '') };
      log({ kind: 'push', pr, attempt: fixes + 1, sha: await pushBranch(wt, prBranch) });
    }
  } finally {
    clearTimeout(watchdog);
  }
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const next = argv[i + 1];
    o[argv[i].slice(2)] = next === undefined || next.startsWith('--') ? true : (i++, next);
  }
  return o;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = parseArgs(process.argv.slice(2));
  if (!a.game || !a.dep || !a.from || !a.to || (a.local && !a.verdict)) {
    console.error('usage: node hit/run.mjs --game games/<name> --dep three --from <v> --to <v> [--repo owner/name] [--pr <n>] [--max-fixes 6] [--no-brain] [--no-merge]\n       node hit/run.mjs ... --local --verdict <file> [--branch <name>]');
    process.exit(2);
  }
  process.exitCode = await main(a);
}












