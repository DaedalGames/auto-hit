// Builds the README banner (dark and light, 1280x640 and @2x) and the two standalone wordmarks.
// Run: node docs/media/banner/build.mjs   (needs the playwright Chromium the repo already installs)
//
// Design sources, taken from the Daedal Games brand rules rather than redrawn:
// - palette: night cover #07040D with star field and pink/teal glows from the COGGS IR deck cover;
//   cream #EDE6D6 and ink #16140F for the light page; COGGS pink #FF3D8B and deck teal #2FB59B as the
//   two product accents; on cream the pink deepens to #D81B6A and the teal to patina #2E6E5E, because
//   #FF3D8B on cream measures 2.7:1, under the 3:1 large-text floor.
// - type: Instrument Serif for names (SIL OFL 1.1, github.com/Instrument/instrument-serif), Geist and
//   Geist Mono for labels (SIL OFL 1.1, fonts/GEIST-OFL.txt), copied from the brand's site font set and
//   inlined as data URIs so a headless render cannot fall back to an OS font.
// - layout: one golden-ratio system. Outer margin H/phi^4, the loop gutter between the two territories
//   W/phi^3, and every size a step of the name size S = H/phi^2 (S, S/phi^3, S/phi^4, S/phi^5).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const brandDir = join(here, '..', 'brand');
const evidenceDir = process.env.BANNER_EVIDENCE_DIR;
const b64 = (p) => readFileSync(join(here, p)).toString('base64');

const PHI = (1 + Math.sqrt(5)) / 2;
const W = 1280, H = 640;
const m = H / PHI ** 4;             // outer margin, 93.4
const gutter = W / PHI ** 3;        // loop zone between the two territories, 302.2
const S = H / PHI ** 2;             // product name size, 244.5
const step = (n) => S / PHI ** n;   // 244, 151, 93, 58, 36, 22
const panelW = (W - 2 * m - gutter) / 2;
const hitRight = m + panelW;        // Hit faces the loop: right-aligned to the gutter
const autoLeft = hitRight + gutter; // Auto faces the loop: left-aligned to the gutter

const fontFaces = [
  ['Instrument Serif', 'normal', 'fonts/instrument-serif.woff2'],
  ['Geist', 'normal', 'fonts/geist-sans.woff2'],
  ['Geist Mono', 'normal', 'fonts/geist-mono.woff2'],
].map(([family, style, file]) => "@font-face{font-family:'" + family + "';font-style:" + style + ";font-weight:400;font-display:block;src:url(data:font/woff2;base64," + b64(file) + ") format('woff2')}");

const themes = {
  dark: {
    bg: '#07040D', fg: '#F3EAF1', mut: 'rgba(243,234,241,.62)',
    hit: '#FF3D8B', auto: '#2FB59B', glowHit: 'rgba(255,61,139,.24)', glowAuto: 'rgba(47,181,155,.20)',
    stars: true, mark: 'daedal-wordmark.png',
  },
  light: {
    bg: '#EDE6D6', fg: '#16140F', mut: 'rgba(22,20,15,.64)',
    hit: '#D81B6A', auto: '#2E6E5E', glowHit: 'rgba(255,61,139,.16)', glowAuto: 'rgba(47,181,155,.16)',
    stars: false, mark: 'daedal-wordmark-ink.png',
  },
};

// Hit writes the pull request: a branch-and-merge glyph. Auto plays it: a play triangle in a ring.
const glyphPaths = {
  hit: (c) => '<circle cx="6" cy="5" r="2.4"/><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="19" r="2.4"/><path d="M6 7.4v9.2"/><path d="M18 16.6V10a3.6 3.6 0 0 0-3.6-3.6H10.5"/><path d="M12.8 3.9l-2.5 2.5 2.5 2.5"/>',
  auto: (c) => '<circle cx="12" cy="12" r="9.6"/><path d="M10 8.2v7.6l6-3.8z" fill="' + c + '"/>',
};
const glyph = (side, c, s) => '<svg class="glyph" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + glyphPaths[side](c) + '</svg>';

const stars = 'radial-gradient(1px 1px at 12% 18%,rgba(255,255,255,.8),transparent),radial-gradient(1px 1px at 27% 72%,rgba(255,255,255,.55),transparent),radial-gradient(1.5px 1.5px at 41% 12%,rgba(255,255,255,.7),transparent),radial-gradient(1px 1px at 55% 84%,rgba(255,255,255,.5),transparent),radial-gradient(1px 1px at 63% 32%,rgba(255,255,255,.6),transparent),radial-gradient(1.5px 1.5px at 74% 9%,rgba(255,255,255,.75),transparent),radial-gradient(1px 1px at 86% 58%,rgba(255,255,255,.5),transparent),radial-gradient(1px 1px at 93% 22%,rgba(255,255,255,.65),transparent),radial-gradient(1px 1px at 8% 88%,rgba(255,255,255,.5),transparent),radial-gradient(1px 1px at 35% 44%,rgba(255,255,255,.4),transparent),radial-gradient(1px 1px at 68% 66%,rgba(255,255,255,.45),transparent),radial-gradient(1px 1px at 81% 90%,rgba(255,255,255,.55),transparent),radial-gradient(1px 1px at 20% 52%,rgba(255,255,255,.35),transparent),radial-gradient(1px 1px at 49% 60%,rgba(255,255,255,.4),transparent),';

// The name's centre line sits a small step below the canvas centre; the top strip sits m/phi from the edge.
const nameLH = 0.8;
const cluster = step(3) + step(5) / 2 + S * nameLH + step(5) + step(4) * 1.2;
const terrTop = (H - cluster) / 2 + step(5);
const cy = terrTop + step(3) + step(5) / 2 + S * nameLH * 0.56; // optical centre of the cap height
const stripY = m / PHI;

function loopSvg(t) {
  const x0 = hitRight + step(4), x1 = autoLeft - step(4), mid = W / 2, rise = step(2), off = step(5);
  const top = 'M' + x0 + ' ' + (cy - off) + ' C' + (x0 + 30) + ' ' + (cy - rise) + ' ' + (x1 - 30) + ' ' + (cy - rise) + ' ' + x1 + ' ' + (cy - off);
  const bot = 'M' + x1 + ' ' + (cy + off) + ' C' + (x1 - 30) + ' ' + (cy + rise) + ' ' + (x0 + 30) + ' ' + (cy + rise) + ' ' + x0 + ' ' + (cy + off);
  return '<svg class="loop" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
    '<defs><linearGradient id="gTop" gradientUnits="userSpaceOnUse" x1="' + x0 + '" y1="0" x2="' + x1 + '" y2="0"><stop offset="0" stop-color="' + t.hit + '"/><stop offset="1" stop-color="' + t.auto + '"/></linearGradient>' +
    '<linearGradient id="gBot" gradientUnits="userSpaceOnUse" x1="' + x1 + '" y1="0" x2="' + x0 + '" y2="0"><stop offset="0" stop-color="' + t.auto + '"/><stop offset="1" stop-color="' + t.hit + '"/></linearGradient>' +
    '<marker id="aTop" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + t.auto + '"/></marker>' +
    '<marker id="aBot" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + t.hit + '"/></marker></defs>' +
    '<path d="' + top + '" stroke="url(#gTop)" stroke-width="4" fill="none" stroke-linecap="round" marker-end="url(#aTop)"/>' +
    '<path d="' + bot + '" stroke="url(#gBot)" stroke-width="4" fill="none" stroke-linecap="round" marker-end="url(#aBot)"/>' +
    '</svg>' +
    '<div class="lbl" style="left:' + mid + 'px;top:' + (cy - rise * 0.75 - step(4) * 1.5) + 'px;color:' + t.hit + '">fix PR</div>' +
    '<div class="lbl" style="left:' + mid + 'px;top:' + (cy + rise * 0.75 + step(4) * 0.3) + 'px;color:' + t.auto + '">verdict</div>';
}

function territory(side, t) {
  const c = t[side];
  const name = side === 'hit' ? 'Hit' : 'Auto';
  const role = side === 'hit' ? 'writes the fix PR' : 'plays it, judges it';
  const pos = side === 'hit' ? 'left:' + m + 'px;text-align:right;align-items:flex-end' : 'left:' + autoLeft + 'px;text-align:left;align-items:flex-start';
  return '<section class="terr ' + side + '" style="' + pos + ';width:' + panelW + 'px">' +
    '<div class="brandrow">' + glyph(side, c, Math.round(step(3))) + '<span class="coggs">COGGS</span></div>' +
    '<div class="name" style="color:' + c + '">' + name + '</div>' +
    '<div class="role">' + role + '</div>' +
    '</section>';
}

function html(themeName) {
  const t = themes[themeName];
  const glowHitX = hitRight - panelW / 4, glowAutoX = autoLeft + panelW / 4;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>COGGS Hit and COGGS Auto</title><style>\n' + fontFaces.join('\n') + '\n' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    'html,body{width:' + W + 'px;height:' + H + 'px;overflow:hidden;background:' + t.bg + '}' +
    '.canvas{position:relative;width:' + W + 'px;height:' + H + 'px;overflow:hidden;color:' + t.fg + ';font-family:Geist,sans-serif;' +
    'background:radial-gradient(' + panelW * 1.1 + 'px ' + H * 0.8 + 'px at ' + glowHitX + 'px ' + cy + 'px,' + t.glowHit + ',transparent 66%),radial-gradient(' + panelW * 1.1 + 'px ' + H * 0.8 + 'px at ' + glowAutoX + 'px ' + cy + 'px,' + t.glowAuto + ',transparent 66%),' + (t.stars ? stars : '') + t.bg + '}' +
    '.strip{position:absolute;left:' + m + 'px;right:' + m + 'px;top:' + (stripY - step(4) / 2) + 'px;height:' + step(4) + 'px;display:flex;align-items:center;justify-content:space-between;font-family:"Geist Mono",monospace;font-size:' + step(5) + 'px;letter-spacing:.08em;color:' + t.mut + '}' +
    '.strip img{height:' + step(4) + 'px;display:block}' +
    '.terr{position:absolute;top:' + terrTop + 'px;display:flex;flex-direction:column}' +
    '.brandrow{display:flex;align-items:center;gap:' + step(5) + 'px;height:' + step(3) + 'px}' +
    '.coggs{font-family:"Geist Mono",monospace;font-size:' + step(4) + 'px;letter-spacing:.32em;margin-right:-.32em;color:' + t.fg + '}' +
    '.name{font-family:"Instrument Serif",serif;font-size:' + S + 'px;line-height:' + nameLH + ';letter-spacing:-.01em;margin-top:' + step(5) / 2 + 'px}' +
    '.role{font-family:Geist,sans-serif;font-size:' + step(4) + 'px;line-height:1.2;color:' + t.fg + ';margin-top:' + step(5) + 'px}' +
    '.loop{position:absolute;left:0;top:0}' +
    '.lbl{position:absolute;transform:translateX(-50%);font-family:"Geist Mono",monospace;font-size:' + step(4) + 'px;letter-spacing:.06em;white-space:nowrap}' +
    '</style></head><body><main class="canvas">' +
    '<div class="strip"><span>DaedalGames/auto-hit</span><img alt="Daedal" src="data:image/png;base64,' + b64(t.mark) + '"></div>' +
    territory('hit', t) + loopSvg(t) + territory('auto', t) +
    '</main></body></html>';
}

// Standalone wordmark: glyph and COGGS over the product name, with the two fonts it uses embedded.
// Colours follow the viewer's scheme: the light-page values by default, the night values under dark.
function wordmarkSvg(side, vb = { x: 0, y: 0, w: 640, h: 360 }) {
  const dark = themes.dark, light = themes.light;
  const name = side === 'hit' ? 'Hit' : 'Auto';
  const g = Math.round(step(4));
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h + '" width="' + vb.w + '" height="' + vb.h + '" role="img" aria-label="COGGS ' + name + '">' +
    '<title>COGGS ' + name + '</title><style>' + fontFaces.filter((f) => !f.includes("'Geist';")).join('') +
    '.acc{fill:' + light[side] + '}.gl{color:' + light[side] + '}.base{fill:' + light.fg + '}' +
    '@media (prefers-color-scheme: dark){.acc{fill:' + dark[side] + '}.gl{color:' + dark[side] + '}.base{fill:' + dark.fg + '}}' +
    '.mono{font-family:"Geist Mono",monospace;font-size:' + step(5) + 'px;letter-spacing:.32em}.serif{font-family:"Instrument Serif",serif;font-size:' + step(1) + 'px;letter-spacing:-.01em}' +
    '</style>' +
    '<g class="gl" transform="scale(' + g / 24 + ')" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + glyphPaths[side]('currentColor') + '</g>' +
    '<text class="mono base" x="' + (g + step(5)) + '" y="' + (g / 2 + step(5) * 0.36) + '">COGGS</text>' +
    '<text class="serif acc" x="-4" y="' + (g + step(5) / 2 + step(1) * 0.8) + '">' + name + '</text>' +
    '</svg>';
}

mkdirSync(brandDir, { recursive: true });
const browser = await chromium.launch();
const report = { layout: { W, H, phi: PHI, margin: m, gutter, S, panelW }, renders: {}, wordmarks: {} };
try {
  for (const themeName of Object.keys(themes)) {
    const src = html(themeName);
    writeFileSync(join(here, 'banner-' + themeName + '.html'), src);
    for (const scale of [1, 2]) {
      const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: scale });
      const page = await ctx.newPage();
      await page.setContent(src, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: join(here, 'banner-' + themeName + (scale === 2 ? '@2x' : '') + '.png'), clip: { x: 0, y: 0, width: W, height: H } });
      if (scale === 1) {
        // Every text node must be drawn by an inlined webfont, and every element must stay on the canvas.
        const cdp = await ctx.newCDPSession(page);
        await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
        const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
        const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '.strip span, .coggs, .name, .role, .lbl' });
        const fonts = [];
        for (const nodeId of nodeIds) {
          const { fonts: f } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
          const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId });
          fonts.push({ node: outerHTML.slice(0, 80), fonts: f });
        }
        const boxes = await page.evaluate(() => [...document.querySelectorAll('.strip span, .strip img, .brandrow, .name, .role, .lbl')].map((e) => { const r = e.getBoundingClientRect(); return { el: e.className || e.tagName, text: e.textContent.trim(), x: r.x, y: r.y, r: r.right, b: r.bottom }; }));
        const fallback = fonts.filter((n) => n.fonts.length === 0 || n.fonts.some((f) => !f.isCustomFont));
        const offCanvas = boxes.filter((b) => b.x < 0 || b.y < 0 || b.r > W || b.b > H);
        report.renders[themeName] = { fonts, boxes, fallback, offCanvas };
        if (fallback.length || offCanvas.length) throw new Error(themeName + ': ' + JSON.stringify({ fallback, offCanvas }));
      }
      await ctx.close();
    }
  }
  // Wordmarks: draw once to measure the ink box, then write the SVG cropped to it.
  for (const side of ['hit', 'auto']) {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><body style="margin:0">' + wordmarkSvg(side) + '</body>');
    await page.evaluate(() => document.fonts.ready);
    const bb = await page.evaluate(() => { const b = document.querySelector('svg').getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
    await page.close();
    const pad = 4;
    const box = { x: Math.floor(bb.x - pad), y: Math.floor(bb.y - pad), w: Math.ceil(bb.w + 2 * pad), h: Math.ceil(bb.h + 2 * pad) };
    const svg = wordmarkSvg(side, box);
    writeFileSync(join(brandDir, 'coggs-' + side + '.svg'), svg);
    report.wordmarks[side] = { box, bytes: Buffer.byteLength(svg) };
    if (evidenceDir) {
      for (const scheme of ['light', 'dark']) {
        const p2 = await browser.newPage({ colorScheme: scheme, deviceScaleFactor: 2, viewport: { width: box.w + 40, height: box.h + 40 } });
        await p2.setContent('<!doctype html><body style="margin:20px;background:' + themes[scheme].bg + '"><img src="data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64') + '"></body>');
        await p2.waitForTimeout(400);
        await p2.screenshot({ path: join(evidenceDir, 'wordmark-' + side + '-' + scheme + '.png') });
        await p2.close();
      }
    }
  }
} finally {
  await browser.close();
}
if (evidenceDir) writeFileSync(join(evidenceDir, 'banner-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ layout: report.layout, wordmarks: report.wordmarks, fallback: Object.fromEntries(Object.entries(report.renders).map(([k, v]) => [k, v.fallback.length])), offCanvas: Object.fromEntries(Object.entries(report.renders).map(([k, v]) => [k, v.offCanvas.length])) }));

