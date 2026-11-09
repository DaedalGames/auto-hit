// Compares one captured frame of base and head with the rule three.js uses for its own e2e screenshots
// (test/e2e/puppeteer.js): a pixel differs when its RGB distance, squared and normalized to 0..1, exceeds
// 0.1 squared, and a frame fails when more than 0.1% of its pixels differ.
import fs from 'node:fs';
import { PNG } from 'pngjs';

export const PIXEL_THRESHOLD = 0.1;
export const MAX_DIFFERENT_PCT = 0.1;

const luma = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

export function meanLuma(png) {
  let sum = 0;
  for (let i = 0; i < png.data.length; i += 4) sum += luma(png.data, i);
  return sum / (png.width * png.height);
}

// Writes the diff image (red where a pixel differs, the base frame dimmed elsewhere) and returns the numbers.
export function compareFrames(basePng, headPng, diffPath) {
  const a = PNG.sync.read(fs.readFileSync(basePng));
  const b = PNG.sync.read(fs.readFileSync(headPng));
  if (a.width !== b.width || a.height !== b.height) {
    return { comparable: false, reason: 'size ' + a.width + 'x' + a.height + ' vs ' + b.width + 'x' + b.height, baseLuma: meanLuma(a), headLuma: meanLuma(b) };
  }
  const out = new PNG({ width: a.width, height: a.height });
  const limit = PIXEL_THRESHOLD * PIXEL_THRESHOLD * 3 * 255 * 255;
  let differ = 0, changed = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const dr = a.data[i] - b.data[i], dg = a.data[i + 1] - b.data[i + 1], db = a.data[i + 2] - b.data[i + 2];
    const d2 = dr * dr + dg * dg + db * db;
    if (d2) changed++;
    if (d2 > limit) {
      differ++;
      out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 0;
    } else {
      const y = luma(a.data, i) * 0.25;
      out.data[i] = y; out.data[i + 1] = y; out.data[i + 2] = y;
    }
    out.data[i + 3] = 255;
  }
  fs.writeFileSync(diffPath, PNG.sync.write(out));
  const pixels = a.width * a.height;
  return { comparable: true, pixels, differentPixels: differ, changedPixels: changed, differPct: (100 * differ) / pixels, baseLuma: meanLuma(a), headLuma: meanLuma(b) };
}
