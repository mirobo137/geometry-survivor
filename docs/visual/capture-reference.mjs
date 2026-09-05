// Run after `npm run dev`: node docs/visual/capture-reference.mjs
// Development-only visual QA; uses the existing Playwright dependency.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output = 'test-results/fleet-reference';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 950 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('http://127.0.0.1:5173/docs/visual/fleet-reference.html');
  await page.locator('#background canvas').waitFor();
  assert.equal(await page.locator('article').count(), 15);
  assert.equal(await page.locator('article svg').count(), 45);
  const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(new Set(ids).size, ids.length, 'Inline SVG IDs must stay unique');
  for (const [name, mode] of [['dark', ''], ['light', 'light'], ['gray', 'gray'], ['silhouette', 'light silhouette']]) {
    await page.selectOption('#inspection', mode);
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  }
  for (const theme of ['deep-space', 'ion-storm', 'solar-drift', 'crystal-field']) {
    await page.selectOption('#theme', theme);
    for (const quality of ['low', 'high']) {
      await page.selectOption('#quality', quality);
      await page.locator('#background canvas').screenshot({ path: `${output}/${theme}-${quality}.png` });
    }
  }
  await page.click('#motion');
  assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'true');
  await page.click('#motion');
  assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'false');
  assert.deepEqual(errors, []);
  console.log(`Fleet gallery verified: 15 assets, unique IDs, four inspection modes, eight backgrounds. Captures: ${output}`);
} finally {
  await browser.close();
}
