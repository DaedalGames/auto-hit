// Render the deck: one JPG per slide (1600 px long side) for review, the PDF beside the HTML,
// and an overflow check of every slide. Usage: node docs/deck/render.mjs [shotsDir]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = process.argv[2] || join(here, 'shots.local');
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.DECK_CHROME || undefined });
try {
  const url = pathToFileURL(join(here, 'auto-hit-deck.html')).href + '?print';
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.25 });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const over = await page.evaluate(() => [...document.querySelectorAll('.slide')].flatMap((s) => {
    const r = s.getBoundingClientRect();
    return [...s.querySelectorAll('.pg *')].filter((e) => {
      if (e.closest('.notes') || e.closest('.cv-ping') || e.classList.contains('cl-gear') || e.closest('.gh')) return false;
      const b = e.getBoundingClientRect();
      if (!b.width || !b.height) return false;
      return b.right > r.right + 1 || b.bottom > r.bottom + 1 || b.left < r.left - 1 || e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow === 'hidden';
    }).map((e) => s.id + ' ' + e.tagName + '.' + e.className + ' "' + (e.textContent || '').slice(0, 40) + '"');
  }));
  console.log('overflow', over.length ? over : 'none');
  // Every box (border or background) must hold its own text; DECK_PLANT=1 plants a spilling chip to prove the check turns red.
  if (process.env.DECK_PLANT) await page.evaluate(() => { const s = document.querySelector('.slide .pg'); const c = document.createElement('span'); c.style.cssText = 'display:inline-block;width:40px;border:1px solid red;white-space:nowrap'; c.textContent = 'spilling chip text'; s.appendChild(c); });
  const spill = await page.evaluate(() => [...document.querySelectorAll('.slide *')].filter((e) => {
    if (e.closest('.notes') || e.closest('svg') || !e.textContent.trim()) return false;
    const cs = getComputedStyle(e);
    const boxed = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth) > 0 || cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
    if (!boxed || e.classList.contains('slide')) return false;
    const b = e.getBoundingClientRect(); if (!b.width) return false;
    return [...e.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim()).some((n) => {
      const r = document.createRange(); r.selectNodeContents(n);
      return [...r.getClientRects()].some((t) => t.width && (t.right > b.right + 1 || t.left < b.left - 1 || t.bottom > b.bottom + 1));
    });
  }).map((e) => e.closest('.slide').id + ' ' + e.tagName + '.' + e.className + ' "' + e.textContent.trim().slice(0, 30) + '"'));
  console.log('box spill', spill.length ? spill : 'none');
  if (spill.length || over.length) process.exitCode = 1;
  // Ask the renderer which font drew every text node (deckfont rule): any system font is a fallback.
  await page.evaluate(() => { for (const n of document.querySelectorAll('.notes,#hud')) n.remove(); });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const texts = [];
  (function walk(n) { if (n.nodeType === 3 && n.nodeValue.trim() && n.parentId) texts.push(n.parentId); for (const c of n.children || []) walk(c); })(root);
  const used = new Map();
  for (const id of new Set(texts)) {
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: id });
    for (const f of fonts) used.set(f.familyName + (f.isCustomFont ? '' : ' (SYSTEM)'), (used.get(f.familyName) || 0) + f.glyphCount);
  }
  console.log('fonts', [...used.keys()]);
  if ([...used.keys()].some((k) => k.includes('SYSTEM'))) process.exitCode = 1;
  const ids = await page.$$eval('.slide', (xs) => xs.map((x) => x.id));
  for (const [n, id] of ids.entries()) {
    const el = page.locator('#' + id);
    await el.screenshot({ path: join(shots, String(n + 1).padStart(2, '0') + '-' + id + '.jpg'), type: 'jpeg', quality: 85 });
  }
  await page.pdf({ path: join(here, 'auto-hit-deck.pdf'), width: '1280px', height: '720px', printBackground: true, preferCSSPageSize: true });
  console.log('slides', ids.length, 'pdf ok');
} finally {
  await browser.close();
}

