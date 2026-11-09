// Screenshot one GitHub pull request comment for the deck.
// Usage: node docs/deck/capture-pr.mjs <pr> <commentId> <out.jpg>
// The repository is public, so the page renders without a login.
import { chromium } from 'playwright-core';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function capture(pr, id, out) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.DECK_CHROME || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 1.5, colorScheme: 'light' });
    await page.goto(`https://github.com/DaedalGames/auto-hit/pull/${pr}#issuecomment-${id}`, { waitUntil: 'networkidle', timeout: 60000 });
    const el = page.locator(`#issuecomment-${id}`).first();
    await el.waitFor({ timeout: 30000 });
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await el.screenshot({ path: out, type: 'jpeg', quality: 86 });
    return out;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [pr, id, out] = process.argv.slice(2);
  if (!pr || !id || !out) { console.error('usage: capture-pr.mjs <pr> <commentId> <out.jpg>'); process.exit(2); }
  console.log(await capture(pr, id, out));
}
