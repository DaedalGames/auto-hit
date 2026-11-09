// Build auto-hit-deck.html from deck.src.html by inlining every {{a:<file>}} under assets/ as a data URI,
// so the deck is one self-contained file with no network fonts (webfontRace).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const types = { '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const src = readFileSync(join(here, 'deck.src.html'), 'utf8');
const out = src.replace(/\{\{a:([\w.-]+)\}\}/g, (_, f) => {
  const type = types[extname(f)];
  if (!type) throw new Error('no type for ' + f);
  return 'data:' + type + ';base64,' + readFileSync(join(here, 'assets', f)).toString('base64');
});
writeFileSync(join(here, 'auto-hit-deck.html'), out);
console.log('auto-hit-deck.html', out.length);

