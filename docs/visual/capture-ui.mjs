// With Vite on port 5173: node docs/visual/capture-ui.mjs
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const output = 'test-results/ui-reference';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto(`${process.argv[2] ?? 'http://127.0.0.1:5173'}/docs/visual/ui-reference.html`);
  await page.locator('.upgrade-card').first().waitFor();
  assert.equal(await page.locator('#icons .tile').count(), 11);
  const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const width of [1200, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const light of [false, true]) {
      await page.evaluate(light => document.body.classList.toggle('light', light), light);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      await page.screenshot({ path: `${output}/${width}-${light ? 'light' : 'dark'}.png`, fullPage: true });
    }
  }
  await page.locator('.upgrade-card').first().focus();
  await page.screenshot({ path: `${output}/focus.png`, fullPage: true });
  for (const size of [24, 32, 64]) {
    await page.locator('#icons svg').evaluateAll((nodes, size) => {
      for (const node of nodes) { node.style.width = `${size}px`; node.style.height = `${size}px`; }
    }, size);
    await page.locator('#icons').screenshot({ path: `${output}/icons-${size}.png` });
  }
  assert.deepEqual(errors, []);
  console.log('UI: eleven symbols, unique IDs, real cards, six responsive captures; no page/network errors.');
} finally { await browser.close(); }
